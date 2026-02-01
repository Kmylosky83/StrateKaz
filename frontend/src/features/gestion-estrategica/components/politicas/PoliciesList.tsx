/**
 * Lista de Políticas Unificada
 * Sistema de Gestión StrateKaz v3.0
 *
 * Vista 2B con Agrupación: DataSection (externo) + Card con grid agrupado
 * - El header (DataSection) se maneja desde el componente padre (PoliticasSection)
 * - Este componente solo renderiza el contenido agrupado por tipo
 *
 * Muestra todas las políticas agrupadas por tipo,
 * con acciones de CRUD y workflow de firmas.
 */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Eye,
  PenTool,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Send,
  FileCheck,
} from 'lucide-react';

// Design System
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DynamicIcon } from '@/components/common/DynamicIcon';

// Hooks
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import {
  usePoliticas,
  useNormasISOActivas,
  useDeletePolitica,
  useEnviarAGestion,
  useCrearNuevaVersion,
} from '../../hooks/usePoliticas';

// Components
import { UnifiedPolicyModal } from './UnifiedPolicyModal';
import { PolicyDetailModal } from './PolicyDetailModal';
import { ActionButtons } from '@/components/common/ActionButtons';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

// Types
import type { Politica, PoliticaFilters, PoliticaStatus, NormaISO } from '../../types/policies.types';
import { STATUS_CONFIG } from '../../types/policies.types';

/**
 * Mapeo de iconos para estados de política v4.0 (simplificado)
 *
 * Estados principales:
 * - BORRADOR: En edición (editable)
 * - EN_GESTION: Enviado a Gestor Documental (firmas, codificación)
 * - VIGENTE: Publicado y activo
 * - OBSOLETO: Versión anterior reemplazada
 */
const STATUS_ICONS: Record<PoliticaStatus, typeof FileText> = {
  // Estados v4.0
  BORRADOR: FileText,
  EN_GESTION: Send,
  VIGENTE: CheckCircle,
  OBSOLETO: XCircle,
  // Estados legacy para retrocompatibilidad
  EN_REVISION: Clock,
  EN_APROBACION: Clock,
  POR_CODIFICAR: FileCheck,
  RECHAZADO: XCircle,
  FIRMADO: FileCheck,
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface PoliciesListProps {
  identityId: number;
  // Props controladas desde el padre (DataSection)
  searchTerm: string;
  onSearchChange: (term: string) => void;
  /** Filtro por norma ISO (usa el campo norma_iso de la política) */
  filterNormaId: number | undefined;
  onFilterNormaChange: (normaId: number | undefined) => void;
  /** Trigger para abrir modal de creación (incrementar para abrir) */
  triggerCreate?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PoliciesList({
  identityId,
  searchTerm,
  onSearchChange,
  filterNormaId,
  onFilterNormaChange,
  triggerCreate,
}: PoliciesListProps) {
  const { primaryColor } = useBrandingConfig();
  const { canDo } = usePermissions();

  // State interno (solo lo que no se controla desde el padre)
  const [selectedPolitica, setSelectedPolitica] = useState<Politica | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [defaultNormaId, setDefaultNormaId] = useState<number | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<Politica | null>(null);

  // Efecto para abrir modal de creación cuando triggerCreate cambia
  useEffect(() => {
    if (triggerCreate && triggerCreate > 0) {
      setDefaultNormaId(undefined);
      setSelectedPolitica(null);
      setIsCreateModalOpen(true);
    }
  }, [triggerCreate]);

  // Filtros usando props controladas
  const filters: PoliticaFilters = useMemo(() => ({
    identity: identityId,
    ...(filterNormaId && { norma_iso_id: filterNormaId }),
  }), [identityId, filterNormaId]);

  // Queries
  const { data: politicasData, isLoading } = usePoliticas(filters);
  const { data: normasISO = [] } = useNormasISOActivas();
  const politicas = politicasData?.results || [];

  // Mutations (simplificado v4.0 - sin firma local)
  const deleteMutation = useDeletePolitica();
  const enviarAGestionMutation = useEnviarAGestion();
  const crearNuevaVersionMutation = useCrearNuevaVersion();

  // Filter by search term
  const filteredPoliticas = useMemo(() => {
    if (!searchTerm) return politicas;
    const term = searchTerm.toLowerCase();
    return politicas.filter(p =>
      p.title.toLowerCase().includes(term) ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      p.norma_iso_code?.toLowerCase().includes(term) ||
      p.norma_iso_name?.toLowerCase().includes(term)
    );
  }, [politicas, searchTerm]);

  /**
   * Agrupa políticas por Norma/Sistema de Gestión.
   *
   * Las políticas DEBEN tener una norma/sistema asignado ya que es el criterio
   * de organización. Las normas y sistemas se consumen dinámicamente desde:
   * Gestión Estratégica > Configuración > Normas ISO
   *
   * Ejemplos de normas/sistemas:
   * - ISO 9001 (Calidad)
   * - ISO 14001 (Ambiental)
   * - ISO 45001 (SST)
   * - SG-SST (Sistema de Gestión SST Colombia)
   * - PESV (Plan Estratégico de Seguridad Vial)
   *
   * CLASIFICACIÓN:
   * 1. Políticas con norma_iso → Se agrupan por su norma/sistema
   * 2. Políticas integrales (is_integral_policy=true) sin norma → Grupo "Sistema Integrado"
   *    Son transversales a todos los sistemas, no requieren norma específica
   * 3. Políticas normales sin norma → Grupo "Sin Clasificar" (necesitan corrección)
   */
  const politicasByNorma = useMemo(() => {
    const grouped = new Map<number, { norma: NormaISO; politicas: Politica[] }>();
    const politicasIntegrales: Politica[] = [];
    const sinClasificar: Politica[] = [];

    filteredPoliticas.forEach(p => {
      const normaId = p.norma_iso;

      // Si tiene norma asignada, agrupar por norma
      if (normaId) {
        const norma = normasISO.find(n => n.id === normaId);
        if (norma) {
          if (!grouped.has(norma.id)) {
            grouped.set(norma.id, { norma, politicas: [] });
          }
          grouped.get(norma.id)?.politicas.push(p);
          return;
        }
      }

      // Sin norma: separar integrales de las que necesitan corrección
      if (p.is_integral_policy) {
        // Políticas integrales son transversales - válido sin norma específica
        politicasIntegrales.push(p);
      } else {
        // Políticas normales sin norma - necesitan corrección
        sinClasificar.push(p);
      }
    });

    // Convertir a array y ordenar por el orden de la norma/sistema
    const result = Array.from(grouped.values()).sort((a, b) =>
      (a.norma.orden ?? 0) - (b.norma.orden ?? 0)
    );

    // Agregar grupo de políticas integrales al INICIO (son las más importantes)
    if (politicasIntegrales.length > 0) {
      const integralNorma: NormaISO = {
        id: -2,
        code: 'SISTEMA_INTEGRADO',
        name: 'Sistema Integrado de Gestión',
        short_name: 'Sistema Integrado',
        description: 'Políticas integrales que aplican a todos los sistemas de gestión',
        icon: 'Globe',
        color: '#8B5CF6', // Morado para destacar
        orden: -1, // Primero
        es_sistema: true,
        is_active: true,
        created_at: '',
        updated_at: '',
      };
      result.unshift({ norma: integralNorma, politicas: politicasIntegrales });
    }

    // Agregar grupo "Sin Clasificar" al FINAL (necesitan corrección)
    if (sinClasificar.length > 0) {
      const sinClasificarNorma: NormaISO = {
        id: -1,
        code: 'SIN_CLASIFICAR',
        name: 'Políticas sin clasificar - Requieren asignación de norma',
        short_name: 'Sin Clasificar',
        description: 'Políticas que necesitan una norma o sistema de gestión asignado',
        icon: 'AlertTriangle',
        color: '#F59E0B', // Amarillo de advertencia
        orden: 9999,
        es_sistema: false,
        is_active: true,
        created_at: '',
        updated_at: '',
      };
      result.push({ norma: sinClasificarNorma, politicas: sinClasificar });
    }

    return result;
  }, [filteredPoliticas, normasISO]);

  // Handlers
  const handleCreate = (normaId?: number) => {
    setDefaultNormaId(normaId);
    setSelectedPolitica(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (politica: Politica) => {
    setSelectedPolitica(politica);
    setIsEditModalOpen(true);
  };

  const handleView = (politica: Politica) => {
    setSelectedPolitica(politica);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (politica: Politica) => {
    await deleteMutation.mutateAsync(politica.id);
    setConfirmDelete(null);
  };

  /**
   * Envía la política al Gestor Documental (v4.0 simplificado)
   *
   * Flujo: BORRADOR → EN_GESTION (Gestor Documental maneja firmas) → VIGENTE
   */
  const handleEnviarAGestion = async (politica: Politica) => {
    await enviarAGestionMutation.mutateAsync(politica.id);
  };

  const handleCrearNuevaVersion = async (politica: Politica) => {
    await crearNuevaVersionMutation.mutateAsync({
      politicaId: politica.id,
      dto: { change_reason: 'Nueva versión de la política' },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8" style={{ color: primaryColor }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gray-500">Cargando políticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Empty state */}
      {politicasByNorma.length === 0 && (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <FileText className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay políticas
          </h3>
          <p className="text-gray-500 mb-6">
            Crea tu primera política para comenzar a gestionar el cumplimiento normativo.
          </p>
          {canDo(Modules.GESTION_ESTRATEGICA, Sections.POLITICAS, 'create') && (
            <Button
              onClick={() => handleCreate()}
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Política
            </Button>
          )}
        </div>
      )}

      {/* Lista agrupada por Norma/Sistema de Gestión */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {politicasByNorma.map(({ norma, politicas: normaPoliticas }) => (
            <motion.div
              key={norma.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Norma/Sistema Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${norma.color || primaryColor}20` }}
                  >
                    <DynamicIcon
                      name={norma.icon || 'FileText'}
                      className="w-5 h-5"
                      color={norma.color || primaryColor}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {norma.short_name || norma.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {normaPoliticas.length} política{normaPoliticas.length !== 1 ? 's' : ''}
                      {norma.id > 0 && norma.name !== norma.short_name && (
                        <span className="ml-1 text-gray-400">• {norma.name}</span>
                      )}
                    </p>
                  </div>
                </div>
                {/* Botón Agregar solo para normas reales (ID > 0), no para grupos especiales */}
                {norma.id > 0 && canDo(Modules.GESTION_ESTRATEGICA, Sections.POLITICAS, 'create') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreate(norma.id)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                )}
              </div>

              {/* Políticas de la norma/sistema */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {normaPoliticas.map((politica) => {
                  const statusInfo = STATUS_CONFIG[politica.status] || STATUS_CONFIG.BORRADOR;
                  const StatusIcon = STATUS_ICONS[politica.status] || FileText;

                  return (
                    <motion.div
                      key={politica.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group"
                    >
                      <div
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
                        onClick={() => handleView(politica)}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-mono mb-1">
                              {politica.code || (
                                <span className="text-gray-400 italic">Sin código asignado</span>
                              )}
                            </p>
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {politica.title}
                            </h4>
                          </div>
                          <div className={`${statusInfo.bgColor} ${statusInfo.color} px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium ml-2 shrink-0`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </div>
                        </div>

                        {/* Indicador de política integral */}
                        {politica.is_integral_policy && (
                          <div className="mb-3">
                            <span
                              className="px-2 py-0.5 text-xs font-medium rounded-md"
                              style={{
                                backgroundColor: `${primaryColor}15`,
                                color: primaryColor,
                              }}
                            >
                              Política Integral
                            </span>
                          </div>
                        )}

                        {/* Footer con acciones */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs text-gray-500">
                            v{politica.version}
                          </span>
                          <div
                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => e.stopPropagation()}
                          >
                            {/* BORRADOR: Editar, Enviar a Gestión, Eliminar */}
                            {politica.status === 'BORRADOR' && (
                              <div className="flex items-center gap-1">
                                <ActionButtons
                                  module={Modules.GESTION_ESTRATEGICA}
                                  section={Sections.POLITICAS}
                                  onEdit={() => handleEdit(politica)}
                                  onDelete={() => setConfirmDelete(politica)}
                                  size="sm"
                                />
                                {canDo(Modules.GESTION_ESTRATEGICA, Sections.POLITICAS, 'edit') && (
                                  <button
                                    onClick={() => handleEnviarAGestion(politica)}
                                    className="px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1 transition-colors bg-blue-600 hover:bg-blue-700"
                                    disabled={enviarAGestionMutation.isPending}
                                    title="Enviar a Gestión Documental (firmas, codificación, publicación)"
                                  >
                                    <Send className="w-3 h-3" />
                                    {enviarAGestionMutation.isPending ? 'Enviando...' : 'Enviar a Gestión'}
                                  </button>
                                )}
                              </div>
                            )}

                            {/* EN_GESTION: Indicador de que está en Gestor Documental */}
                            {politica.status === 'EN_GESTION' && (
                              <span className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded-lg flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-pulse" />
                                En gestión documental
                              </span>
                            )}

                            {/* VIGENTE: Nueva Versión */}
                            {politica.status === 'VIGENTE' && (
                              <button
                                onClick={() => handleCrearNuevaVersion(politica)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                disabled={crearNuevaVersionMutation.isPending}
                                title="Crear nueva versión de esta política"
                              >
                                <Plus className="w-3 h-3" />
                                {crearNuevaVersionMutation.isPending ? 'Creando...' : 'Nueva Versión'}
                              </button>
                            )}

                            {/* OBSOLETO: Solo ver (no hay acciones) */}
                            {politica.status === 'OBSOLETO' && (
                              <span className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded-lg flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Versión histórica
                              </span>
                            )}

                            {/* Estados legacy (retrocompatibilidad) */}
                            {(politica.status === 'EN_REVISION' || politica.status === 'EN_APROBACION') && (
                              <span className="px-2 py-1 text-xs text-yellow-600 bg-yellow-50 rounded-lg flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                En proceso (legacy)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modales */}
      <UnifiedPolicyModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedPolitica(null);
          setDefaultNormaId(undefined);
        }}
        identityId={identityId}
        politica={selectedPolitica}
        defaultNormaId={defaultNormaId}
      />

      <PolicyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPolitica(null);
        }}
        politica={selectedPolitica}
        onEdit={
          canDo(Modules.GESTION_ESTRATEGICA, Sections.POLITICAS, 'edit')
            ? () => {
              setIsDetailModalOpen(false);
              setIsEditModalOpen(true);
            }
            : undefined
        }
      />

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Eliminar Política
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ¿Está seguro de eliminar la política <strong>"{confirmDelete.title}"</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
