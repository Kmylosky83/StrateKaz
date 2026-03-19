/**
 * AfiliacionesTab - Gestion de Afiliaciones a Seguridad Social
 * Sub-tab dentro de SeleccionSection para gestionar EPS, ARL, AFP, CCF
 *
 * Funcionalidades:
 * - StatsGrid con metricas de afiliaciones
 * - Tabla con filtros (estado, tipo entidad, busqueda)
 * - Crear nueva afiliacion
 * - Confirmar afiliacion (marcar como afiliado)
 * - Actualizar estado (rechazar, cancelar)
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/utils/cn';
import {
  Shield,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  Hash,
  User,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useAfiliaciones,
  useUpdateAfiliacion,
  useTiposEntidad,
} from '../../hooks/useSeleccionContratacion';
import { ESTADO_AFILIACION_OPTIONS, ESTADO_AFILIACION_BADGE } from '../../types';
import type { AfiliacionSS, AfiliacionSSFilters } from '../../types';
import { AfiliacionFormModal } from './AfiliacionFormModal';
import { ConfirmarAfiliacionModal } from './ConfirmarAfiliacionModal';

// ============================================================================
// StatsGrid
// ============================================================================

const StatsGrid = ({ afiliaciones }: { afiliaciones: AfiliacionSS[] }) => {
  const stats = useMemo(() => {
    const total = afiliaciones.length;
    const pendientes = afiliaciones.filter(
      (a) => a.estado === 'pendiente' || a.estado === 'en_proceso'
    ).length;
    const afiliados = afiliaciones.filter((a) => a.estado === 'afiliado').length;
    const rechazados = afiliaciones.filter((a) => a.estado === 'rechazado').length;

    return [
      {
        label: 'Total',
        value: total,
        icon: Shield,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
      },
      {
        label: 'Pendientes',
        value: pendientes,
        icon: Calendar,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
      },
      {
        label: 'Afiliados',
        value: afiliados,
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
      },
      {
        label: 'Rechazados',
        value: rechazados,
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
      },
    ];
  }, [afiliaciones]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-3"
        >
          <div className={cn('p-2 rounded-lg', stat.bg)}>
            <stat.icon size={18} className={stat.color} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Componente Principal
// ============================================================================

export const AfiliacionesTab = () => {
  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.AFILIACIONES, 'create');
  const canEdit = canDo(Modules.TALENT_HUB, Sections.AFILIACIONES, 'edit');

  // Filtros
  const [filters, setFilters] = useState<AfiliacionSSFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Datos
  const { data: afiliacionesData, isLoading } = useAfiliaciones(filters);
  const { data: tiposEntidad = [] } = useTiposEntidad();
  const updateMutation = useUpdateAfiliacion();

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConfirmarModal, setShowConfirmarModal] = useState(false);
  const [selectedAfiliacion, setSelectedAfiliacion] = useState<AfiliacionSS | null>(null);
  const [showRechazarDialog, setShowRechazarDialog] = useState(false);
  const [rechazarId, setRechazarId] = useState<number | null>(null);

  const afiliaciones = useMemo(() => afiliacionesData?.results || [], [afiliacionesData]);

  // Filtrar por busqueda local
  const filteredAfiliaciones = useMemo(() => {
    if (!searchTerm) return afiliaciones;
    const term = searchTerm.toLowerCase();
    return afiliaciones.filter(
      (a) =>
        a.candidato_nombre?.toLowerCase().includes(term) ||
        a.entidad_nombre?.toLowerCase().includes(term) ||
        a.numero_afiliacion?.toLowerCase().includes(term)
    );
  }, [afiliaciones, searchTerm]);

  const handleFilterChange = (field: keyof AfiliacionSSFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const handleConfirmar = (afiliacion: AfiliacionSS) => {
    setSelectedAfiliacion(afiliacion);
    setShowConfirmarModal(true);
  };

  const handleRechazar = (id: number) => {
    setRechazarId(id);
    setShowRechazarDialog(true);
  };

  const confirmRechazar = () => {
    if (rechazarId) {
      updateMutation.mutate(
        { id: rechazarId, data: { estado: 'rechazado' } },
        { onSuccess: () => setShowRechazarDialog(false) }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatsGrid afiliaciones={afiliaciones} />

      {/* Header con filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Shield size={16} />
            Afiliaciones a Seguridad Social
          </h3>
          {canCreate && (
            <Button size="sm" onClick={() => setShowFormModal(true)}>
              <Plus size={14} className="mr-1" />
              Nueva Afiliacion
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar candidato, entidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.estado || ''}
            onChange={(e) => handleFilterChange('estado', e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADO_AFILIACION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={filters.tipo_entidad || ''}
            onChange={(e) => handleFilterChange('tipo_entidad', e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {tiposEntidad.map((tipo) => (
              <option key={tipo.id} value={tipo.codigo}>
                {tipo.nombre}
              </option>
            ))}
          </Select>
        </div>

        {/* Tabla */}
        {filteredAfiliaciones.length === 0 ? (
          <EmptyState
            icon={
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <Shield size={24} className="text-blue-500" />
              </div>
            }
            title="Sin afiliaciones"
            description="No se encontraron afiliaciones con los filtros actuales."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Candidato</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Entidad</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Tipo</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Estado</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">No. Afiliacion</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Fecha</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAfiliaciones.map((afiliacion, index) => (
                  <tr
                    key={afiliacion.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-gray-400">{index + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                          {afiliacion.candidato_nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                          {afiliacion.entidad_nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        {afiliacion.tipo_entidad}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={ESTADO_AFILIACION_BADGE[afiliacion.estado]}>
                        {afiliacion.estado_display}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      {afiliacion.numero_afiliacion ? (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Hash size={12} />
                          <span className="text-xs">{afiliacion.numero_afiliacion}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">
                      {afiliacion.fecha_afiliacion
                        ? new Date(afiliacion.fecha_afiliacion).toLocaleDateString('es-CO')
                        : new Date(afiliacion.fecha_solicitud).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit &&
                          (afiliacion.estado === 'pendiente' ||
                            afiliacion.estado === 'en_proceso') && (
                            <>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleConfirmar(afiliacion)}
                                title="Confirmar afiliacion"
                              >
                                <CheckCircle size={14} className="text-green-500" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleRechazar(afiliacion.id)}
                                title="Rechazar"
                              >
                                <XCircle size={14} className="text-red-500" />
                              </Button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modales */}
      {showFormModal && (
        <AfiliacionFormModal isOpen={showFormModal} onClose={() => setShowFormModal(false)} />
      )}

      {showConfirmarModal && selectedAfiliacion && (
        <ConfirmarAfiliacionModal
          isOpen={showConfirmarModal}
          onClose={() => {
            setShowConfirmarModal(false);
            setSelectedAfiliacion(null);
          }}
          afiliacion={selectedAfiliacion}
        />
      )}

      <ConfirmDialog
        isOpen={showRechazarDialog}
        onClose={() => setShowRechazarDialog(false)}
        onConfirm={confirmRechazar}
        title="Rechazar Afiliacion"
        message="Esta seguro de rechazar esta afiliacion? Esta accion cambiara el estado a 'Rechazado'."
        confirmText="Rechazar"
        variant="danger"
        isLoading={updateMutation.isPending}
      />
    </div>
  );
};
