/**
 * Seccion de Encuestas DOFA Colaborativas
 *
 * Vista 2B: Lista CRUD con Filtros en linea
 * - SectionHeader con busqueda y filtros
 * - DataTableCard para la tabla
 * - EmptyState para estado vacio
 * - ConfirmDialog para confirmaciones
 *
 * Permite gestionar encuestas para recopilar opiniones de colaboradores
 * sobre fortalezas y debilidades organizacionales.
 */
import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  Send,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  Search,
  Link2,
  Play,
  Square,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Alert } from '@/components/common/Alert';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Tooltip } from '@/components/common/Tooltip';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { DataTableCard, TableSkeleton } from '@/components/layout/DataTableCard';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import {
  useEncuestas,
  useDeleteEncuesta,
  useActivarEncuesta,
  useCerrarEncuesta,
  useEnviarNotificacionesEncuesta,
} from '../../hooks/useEncuestas';
import type { EncuestaDofa, EncuestaFilters, EstadoEncuesta } from '../../types/encuestas.types';
import { ESTADO_ENCUESTA_CONFIG } from '../../types/encuestas.types';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import { EncuestaFormModal } from '../modals/EncuestaFormModal';

// =============================================================================
// OPCIONES DE FILTROS
// =============================================================================

const ESTADO_OPTIONS: { value: EstadoEncuesta | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'activa', label: 'Activa' },
  { value: 'cerrada', label: 'Cerrada' },
  { value: 'procesada', label: 'Procesada' },
  { value: 'cancelada', label: 'Cancelada' },
];

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface EncuestasDofaSectionProps {
  triggerNewForm?: number;
}

export const EncuestasDofaSection = ({ triggerNewForm }: EncuestasDofaSectionProps) => {
  const [filters, setFilters] = useState<EncuestaFilters>({});
  const [selectedEncuesta, setSelectedEncuesta] = useState<EncuestaDofa | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<EncuestaDofa | null>(null);
  const [activarConfirm, setActivarConfirm] = useState<EncuestaDofa | null>(null);
  const [cerrarConfirm, setCerrarConfirm] = useState<EncuestaDofa | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // RBAC: Verificar permisos del usuario
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'create');
  const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'edit');
  const canDelete = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'delete');

  // Color del modulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Queries y mutations
  const { data, isLoading, error } = useEncuestas({ ...filters, page_size: 50 });
  const deleteMutation = useDeleteEncuesta();
  const activarMutation = useActivarEncuesta();
  const cerrarMutation = useCerrarEncuesta();
  const enviarNotificacionesMutation = useEnviarNotificacionesEncuesta();

  // Calcular estadisticas para StatsGrid
  const encuestaStats: StatItem[] = useMemo(() => {
    const encuestas = data?.results || [];
    const activas = encuestas.filter((e) => e.estado === 'activa').length;
    const totalInvitados = encuestas.reduce((sum, e) => sum + (e.total_invitados || 0), 0);
    const totalRespondidos = encuestas.reduce((sum, e) => sum + (e.total_respondidos || 0), 0);

    return [
      {
        label: 'Total Encuestas',
        value: data?.count || encuestas.length,
        icon: ClipboardList,
        iconColor: 'info',
      },
      {
        label: 'Activas',
        value: activas,
        icon: Play,
        iconColor: 'success',
        description: 'Recibiendo respuestas',
      },
      {
        label: 'Invitados',
        value: totalInvitados,
        icon: Users,
        iconColor: 'primary',
      },
      {
        label: 'Respuestas',
        value: totalRespondidos,
        icon: CheckCircle,
        iconColor: 'gray',
      },
    ];
  }, [data]);

  // Handlers
  const handleCreate = () => {
    setSelectedEncuesta(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleEdit = (encuesta: EncuestaDofa) => {
    setSelectedEncuesta(encuesta);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleView = (encuesta: EncuestaDofa) => {
    setSelectedEncuesta(encuesta);
    // TODO: Abrir modal de detalle/resultados
  };

  const handleDeleteRequest = (encuesta: EncuestaDofa) => {
    if (encuesta.estado === 'activa') {
      setAlertMessage({
        type: 'warning',
        message: 'No se puede eliminar una encuesta activa. Cierre la encuesta primero.',
      });
      return;
    }
    setDeleteConfirm(encuesta);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
      setAlertMessage({ type: 'success', message: 'Encuesta eliminada correctamente' });
    }
  };

  const handleActivar = (encuesta: EncuestaDofa) => {
    if (encuesta.total_invitados === 0 && !encuesta.es_publica) {
      setAlertMessage({
        type: 'warning',
        message: 'Agregue participantes o habilite el acceso publico antes de activar.',
      });
      return;
    }
    setActivarConfirm(encuesta);
  };

  const handleActivarConfirm = async () => {
    if (activarConfirm) {
      await activarMutation.mutateAsync(activarConfirm.id);
      setActivarConfirm(null);
      setAlertMessage({ type: 'success', message: 'Encuesta activada. Los participantes pueden responder.' });
    }
  };

  const handleCerrar = (encuesta: EncuestaDofa) => {
    setCerrarConfirm(encuesta);
  };

  const handleCerrarConfirm = async () => {
    if (cerrarConfirm) {
      await cerrarMutation.mutateAsync(cerrarConfirm.id);
      setCerrarConfirm(null);
      setAlertMessage({ type: 'success', message: 'Encuesta cerrada. Ya no se aceptan respuestas.' });
    }
  };

  const handleEnviarNotificaciones = async (encuesta: EncuestaDofa) => {
    try {
      await enviarNotificacionesMutation.mutateAsync(encuesta.id);
      setAlertMessage({ type: 'success', message: 'Notificaciones enviadas a los participantes.' });
    } catch {
      setAlertMessage({ type: 'error', message: 'Error al enviar notificaciones.' });
    }
  };

  const handleCopyLink = (encuesta: EncuestaDofa) => {
    if (encuesta.enlace_publico) {
      navigator.clipboard.writeText(window.location.origin + encuesta.enlace_publico);
      setAlertMessage({ type: 'success', message: 'Enlace copiado al portapapeles.' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEncuesta(null);
    setIsCreating(false);
  };

  // Renderizar badge de estado
  const renderEstadoBadge = (estado: EstadoEncuesta) => {
    const config = ESTADO_ENCUESTA_CONFIG[estado];
    return (
      <Badge variant={config?.color || 'gray'} size="sm">
        {config?.label || estado}
      </Badge>
    );
  };

  // Renderizar progreso de participacion
  const renderParticipacion = (encuesta: EncuestaDofa) => {
    const porcentaje = encuesta.porcentaje_participacion || 0;
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(porcentaje, 100)}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {encuesta.total_respondidos}/{encuesta.total_invitados}
        </span>
      </div>
    );
  };

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar las encuestas. Intente de nuevo."
      />
    );
  }

  const isEmpty = !isLoading && (!data?.results || data.results.length === 0);

  return (
    <div className="space-y-6">
      {/* Alerta de feedback */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.message}
          closable
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Estadisticas */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={encuestaStats} columns={4} moduleColor={moduleColor} />
      )}

      {/* Section Header - Vista 2B: Filtros en linea */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <ClipboardList className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Encuestas"
        description="Recopila opiniones de colaboradores sobre fortalezas y debilidades"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              leftIcon={<Search className="h-4 w-4" />}
              className="w-48"
            />
            <Select
              value={filters.estado || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  estado: e.target.value ? (e.target.value as EstadoEncuesta) : undefined,
                })
              }
              options={ESTADO_OPTIONS}
              className="w-40"
            />
            {canCreate && (
              <Button onClick={handleCreate} variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Encuesta
              </Button>
            )}
          </div>
        }
      />

      {/* Contenido */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : isEmpty ? (
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title="Sin encuestas"
          description="Cree una encuesta para recopilar opiniones de colaboradores sobre el contexto organizacional."
          action={
            canCreate && (
              <Button onClick={handleCreate} variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Encuesta
              </Button>
            )
          }
        />
      ) : (
        <DataTableCard
          columns={[
            {
              key: 'titulo',
              header: 'Encuesta',
              render: (encuesta: EncuestaDofa) => (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {encuesta.titulo}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {encuesta.analisis_dofa_nombre || `DOFA #${encuesta.analisis_dofa}`}
                  </div>
                </div>
              ),
            },
            {
              key: 'estado',
              header: 'Estado',
              render: (encuesta: EncuestaDofa) => renderEstadoBadge(encuesta.estado),
            },
            {
              key: 'vigencia',
              header: 'Vigencia',
              render: (encuesta: EncuestaDofa) => (
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {new Date(encuesta.fecha_inicio).toLocaleDateString('es-CO')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    hasta {new Date(encuesta.fecha_cierre).toLocaleDateString('es-CO')}
                  </div>
                </div>
              ),
            },
            {
              key: 'participacion',
              header: 'Participacion',
              render: (encuesta: EncuestaDofa) => renderParticipacion(encuesta),
            },
            {
              key: 'tipo_acceso',
              header: 'Acceso',
              render: (encuesta: EncuestaDofa) => (
                <Badge variant={encuesta.es_publica ? 'info' : 'gray'} size="sm">
                  {encuesta.es_publica ? 'Publica' : 'Privada'}
                </Badge>
              ),
            },
            {
              key: 'acciones',
              header: 'Acciones',
              align: 'right',
              render: (encuesta: EncuestaDofa) => (
                <div className="flex items-center justify-end gap-1">
                  {/* Ver resultados */}
                  <Tooltip content="Ver resultados">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(encuesta)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  {/* Copiar enlace publico */}
                  {encuesta.es_publica && encuesta.estado === 'activa' && (
                    <Tooltip content="Copiar enlace">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(encuesta)}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  )}

                  {/* Activar encuesta */}
                  {encuesta.estado === 'borrador' && canEdit && (
                    <Tooltip content="Activar encuesta">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleActivar(encuesta)}
                      >
                        <Play className="h-4 w-4 text-green-600" />
                      </Button>
                    </Tooltip>
                  )}

                  {/* Cerrar encuesta */}
                  {encuesta.estado === 'activa' && canEdit && (
                    <Tooltip content="Cerrar encuesta">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCerrar(encuesta)}
                      >
                        <Square className="h-4 w-4 text-orange-600" />
                      </Button>
                    </Tooltip>
                  )}

                  {/* Enviar notificaciones */}
                  {encuesta.estado === 'activa' && !encuesta.es_publica && canEdit && (
                    <Tooltip content="Enviar notificaciones">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEnviarNotificaciones(encuesta)}
                        disabled={enviarNotificacionesMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  )}

                  {/* Editar */}
                  {(encuesta.estado === 'borrador' || encuesta.estado === 'activa') && canEdit && (
                    <Tooltip content="Editar">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(encuesta)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  )}

                  {/* Eliminar */}
                  {canDelete && encuesta.estado !== 'activa' && (
                    <Tooltip content="Eliminar">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(encuesta)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              ),
            },
          ]}
          data={data?.results || []}
        />
      )}

      {/* Dialogo de confirmacion para eliminar */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Encuesta"
        message={`Esta seguro de eliminar la encuesta "${deleteConfirm?.titulo}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Dialogo de confirmacion para activar */}
      <ConfirmDialog
        isOpen={!!activarConfirm}
        title="Activar Encuesta"
        message={`Al activar la encuesta "${activarConfirm?.titulo}", los participantes podran responder. Desea continuar?`}
        confirmText="Activar"
        cancelText="Cancelar"
        variant="info"
        onConfirm={handleActivarConfirm}
        onClose={() => setActivarConfirm(null)}
        isLoading={activarMutation.isPending}
      />

      {/* Dialogo de confirmacion para cerrar */}
      <ConfirmDialog
        isOpen={!!cerrarConfirm}
        title="Cerrar Encuesta"
        message={`Al cerrar la encuesta "${cerrarConfirm?.titulo}", ya no se aceptaran respuestas. Desea continuar?`}
        confirmText="Cerrar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleCerrarConfirm}
        onClose={() => setCerrarConfirm(null)}
        isLoading={cerrarMutation.isPending}
      />

      {/* Modal de formulario */}
      <EncuestaFormModal
        encuesta={isCreating ? null : selectedEncuesta}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default EncuestasDofaSection;
