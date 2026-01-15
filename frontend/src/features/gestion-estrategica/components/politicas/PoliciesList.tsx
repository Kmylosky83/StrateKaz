/**
 * Lista de Políticas Unificada
 * Sistema de Gestión StrateKaz v3.0
 *
 * Muestra todas las políticas agrupadas por tipo,
 * con acciones de CRUD y workflow de firmas.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Eye,
  PenTool,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Filter,
  MoreVertical,
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
  useTiposPolitica,
  useDeletePolitica,
  useIniciarFirmaPolitica,
  usePublicarPolitica,
  useEnviarADocumental,
  useCrearNuevaVersion,
} from '../../hooks/usePoliticas';

// Components
import { UnifiedPolicyModal } from './UnifiedPolicyModal';
import { PolicyDetailModal } from './PolicyDetailModal';
import { ActionButtons } from '@/components/common/ActionButtons';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

// Types
import type { Politica, PoliticaFilters, PoliticaStatus, TipoPolitica } from '../../types/policies.types';
import { STATUS_CONFIG } from '../../types/policies.types';

// Mapeo de iconos para STATUS_CONFIG (los iconos no se pueden exportar desde types)
const STATUS_ICONS: Record<PoliticaStatus, typeof FileText> = {
  BORRADOR: FileText,
  EN_REVISION: Clock,
  FIRMADO: PenTool,
  VIGENTE: CheckCircle,
  OBSOLETO: XCircle,
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface PoliciesListProps {
  identityId: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PoliciesList({ identityId }: PoliciesListProps) {
  const { primaryColor } = useBrandingConfig();
  const { canDo } = usePermissions();

  // State
  const [filters, setFilters] = useState<PoliticaFilters>({ identity: identityId });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolitica, setSelectedPolitica] = useState<Politica | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [defaultTipoId, setDefaultTipoId] = useState<number | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<Politica | null>(null);

  // Queries
  const { data: politicasData, isLoading } = usePoliticas(filters);
  const { data: tiposPolitica = [] } = useTiposPolitica();
  const politicas = politicasData?.results || [];

  // Mutations
  const deleteMutation = useDeletePolitica();
  const iniciarFirmaMutation = useIniciarFirmaPolitica();
  const publicarMutation = usePublicarPolitica();
  const enviarADocumentalMutation = useEnviarADocumental();
  const crearNuevaVersionMutation = useCrearNuevaVersion();

  // Filter by search term
  const filteredPoliticas = useMemo(() => {
    if (!searchTerm) return politicas;
    const term = searchTerm.toLowerCase();
    return politicas.filter(p =>
      p.title.toLowerCase().includes(term) ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      p.tipo_name?.toLowerCase().includes(term)
    );
  }, [politicas, searchTerm]);

  // Inferir tipo desde el código de la política (POL-SST-xxx -> SST)
  const inferTipoFromCode = (code: string): TipoPolitica | undefined => {
    const match = code.match(/^POL-([A-Z]+)/);
    if (match) {
      const tipoCode = match[1];
      return tiposPolitica.find(t => t.code === tipoCode);
    }
    return tiposPolitica.find(t => t.code === 'OTRAS');
  };

  // Group by tipo (inferido desde código o tipo_id)
  const politicasByTipo = useMemo(() => {
    const grouped = new Map<number, { tipo: TipoPolitica; politicas: Politica[] }>();
    const sinTipo: Politica[] = [];

    filteredPoliticas.forEach(p => {
      // Intentar obtener el tipo: desde tipo_id, desde el código, o "OTRAS"
      let tipo: TipoPolitica | undefined;

      if (p.tipo_id) {
        tipo = tiposPolitica.find(t => t.id === p.tipo_id) || p.tipo;
      }

      if (!tipo && p.code) {
        tipo = inferTipoFromCode(p.code);
      }

      if (!tipo) {
        // Poner en "Sin clasificar" si no hay tipo
        sinTipo.push(p);
        return;
      }

      if (!grouped.has(tipo.id)) {
        grouped.set(tipo.id, { tipo, politicas: [] });
      }
      grouped.get(tipo.id)?.politicas.push(p);
    });

    // Si hay políticas sin tipo, agruparlas bajo "Otras Políticas" si existe
    if (sinTipo.length > 0) {
      const otrasType = tiposPolitica.find(t => t.code === 'OTRAS');
      if (otrasType) {
        if (!grouped.has(otrasType.id)) {
          grouped.set(otrasType.id, { tipo: otrasType, politicas: [] });
        }
        sinTipo.forEach(p => grouped.get(otrasType.id)?.politicas.push(p));
      } else if (tiposPolitica.length > 0) {
        // Si no hay tipo "OTRAS", usar el último tipo disponible
        const lastTipo = tiposPolitica[tiposPolitica.length - 1];
        if (!grouped.has(lastTipo.id)) {
          grouped.set(lastTipo.id, { tipo: lastTipo, politicas: [] });
        }
        sinTipo.forEach(p => grouped.get(lastTipo.id)?.politicas.push(p));
      }
    }

    return Array.from(grouped.values()).sort((a, b) => a.tipo.orden - b.tipo.orden);
  }, [filteredPoliticas, tiposPolitica]);

  // Handlers
  const handleCreate = (tipoId?: number) => {
    setDefaultTipoId(tipoId);
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

  const handleIniciarFirma = async (politica: Politica) => {
    await iniciarFirmaMutation.mutateAsync({ id: politica.id });
  };

  const handlePublicar = async (politica: Politica) => {
    await publicarMutation.mutateAsync(politica.id);
  };

  const handleEnviarADocumental = async (politica: Politica) => {
    await enviarADocumentalMutation.mutateAsync({ politicaId: politica.id });
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
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar políticas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            />
          </div>
          <select
            value={filters.tipo_id || ''}
            onChange={(e) => setFilters(f => ({ ...f, tipo_id: e.target.value ? Number(e.target.value) : undefined }))}
            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
          >
            <option value="">Todos los tipos</option>
            {tiposPolitica.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        {canDo(Modules.GESTION_ESTRATEGICA, Sections.POLITICAS, 'create') && (
          <Button
            onClick={() => handleCreate()}
            className="flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4" />
            Nueva Política
          </Button>
        )}
      </div>

      {/* Empty state */}
      {politicasByTipo.length === 0 && (
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

      {/* Lista agrupada por tipo */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {politicasByTipo.map(({ tipo, politicas: tipoPoliticas }) => (
            <motion.div
              key={tipo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Tipo Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${tipo.color}20` }}
                  >
                    <DynamicIcon
                      name={tipo.icon}
                      className="w-5 h-5"
                      color={tipo.color}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tipo.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {tipoPoliticas.length} política{tipoPoliticas.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {canDo(Modules.GESTION_ESTRATEGICA, Sections.POLITICAS, 'create') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreate(tipo.id)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                )}
              </div>

              {/* Políticas del tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tipoPoliticas.map((politica) => {
                  const statusInfo = STATUS_CONFIG[politica.status];
                  const StatusIcon = STATUS_ICONS[politica.status];

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

                        {/* Normas aplicables */}
                        {politica.normas_aplicables?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {politica.normas_aplicables.slice(0, 3).map(norma => (
                              <span
                                key={norma.id}
                                className="px-2 py-0.5 text-xs font-medium rounded-md"
                                style={{
                                  backgroundColor: `${norma.color || primaryColor}15`,
                                  color: norma.color || primaryColor,
                                }}
                              >
                                {norma.code}
                              </span>
                            ))}
                            {politica.normas_aplicables.length > 3 && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                +{politica.normas_aplicables.length - 3}
                              </span>
                            )}
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
                            {/* BORRADOR: Editar, Enviar a Firma, Eliminar */}
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
                                    onClick={() => handleIniciarFirma(politica)}
                                    className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                    title="Enviar a firma"
                                    disabled={iniciarFirmaMutation.isPending}
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* EN_REVISION: Ver progreso de firmas (indicador visual) */}
                            {politica.status === 'EN_REVISION' && (
                              <span className="px-2 py-1 text-xs text-yellow-600 bg-yellow-50 rounded-lg flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-pulse" />
                                Esperando firmas
                              </span>
                            )}

                            {/* FIRMADO: Enviar a Documental para codificación */}
                            {politica.status === 'FIRMADO' && (
                              <button
                                onClick={() => handleEnviarADocumental(politica)}
                                className="px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1 transition-colors bg-blue-600 hover:bg-blue-700"
                                disabled={enviarADocumentalMutation.isPending}
                                title="Enviar al Gestor Documental para asignación de código y publicación"
                              >
                                <FileCheck className="w-3 h-3" />
                                {enviarADocumentalMutation.isPending ? 'Enviando...' : 'Enviar a Documental'}
                              </button>
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
          setDefaultTipoId(undefined);
        }}
        identityId={identityId}
        politica={selectedPolitica}
        defaultTipoId={defaultTipoId}
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
