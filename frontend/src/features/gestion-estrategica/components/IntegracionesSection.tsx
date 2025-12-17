/**
 * IntegracionesSection - Sección principal de Integraciones Externas
 *
 * Características:
 * - Tabla de integraciones con estado de salud
 * - Filtros por tipo de servicio y estado
 * - Acciones: probar, editar, toggle, eliminar
 * - Empty state cuando no hay integraciones
 * - Iconos específicos por tipo de servicio
 *
 * Usa hooks internos siguiendo el patrón de SedesSection
 */
import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Wifi,
  Mail,
  FileText,
  MessageSquare,
  Phone,
  MapPin,
  HardDrive,
  BarChart3,
  CreditCard,
  Building2,
  PenTool,
  Cloud,
  Plug,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Alert } from '@/components/common/Alert';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import {
  useIntegraciones,
  useDeleteIntegracion,
  useTestConnection,
  useToggleIntegracionStatus,
} from '../hooks/useStrategic';
import { IntegracionFormModal } from './modals/IntegracionFormModal';
import type { IntegracionExternaList, TipoServicio, StatusIndicator } from '../types/strategic.types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Iconos por tipo de servicio
const TIPO_SERVICIO_ICONS: Record<TipoServicio, React.ComponentType<{ className?: string }>> = {
  EMAIL: Mail,
  FACTURACION: FileText,
  SMS: MessageSquare,
  WHATSAPP: Phone,
  MAPAS: MapPin,
  ALMACENAMIENTO: HardDrive,
  BI: BarChart3,
  PAGOS: CreditCard,
  ERP: Building2,
  FIRMA_DIGITAL: PenTool,
};

const TIPO_SERVICIO_LABELS: Record<TipoServicio, string> = {
  EMAIL: 'Email',
  FACTURACION: 'Facturación Electrónica',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  MAPAS: 'Mapas',
  ALMACENAMIENTO: 'Almacenamiento',
  BI: 'Business Intelligence',
  PAGOS: 'Pagos',
  ERP: 'ERP',
  FIRMA_DIGITAL: 'Firma Digital',
};

// Badge de estado de salud
const StatusBadge = ({ status, isActive }: { status: StatusIndicator; isActive: boolean }) => {
  if (!isActive) {
    return (
      <Badge variant="gray" size="sm">
        Inactivo
      </Badge>
    );
  }

  const variants: Record<StatusIndicator, 'success' | 'warning' | 'error'> = {
    success: 'success',
    warning: 'warning',
    danger: 'error',
  };

  const labels: Record<StatusIndicator, string> = {
    success: 'Saludable',
    warning: 'Advertencia',
    danger: 'Error',
  };

  return (
    <Badge variant={variants[status]} size="sm">
      {labels[status]}
    </Badge>
  );
};

export const IntegracionesSection = () => {
  // Hooks de datos
  const { data: integracionesData, isLoading, error } = useIntegraciones();
  const deleteMutation = useDeleteIntegracion();
  const testConnectionMutation = useTestConnection();
  const toggleStatusMutation = useToggleIntegracionStatus();

  // Estado local
  const [showModal, setShowModal] = useState(false);
  const [selectedIntegracion, setSelectedIntegracion] = useState<IntegracionExternaList | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [integracionToDelete, setIntegracionToDelete] = useState<IntegracionExternaList | null>(null);
  const [filterTipoServicio, setFilterTipoServicio] = useState<TipoServicio | ''>('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'active' | 'inactive' | 'healthy' | 'unhealthy'>('all');

  const integraciones = integracionesData?.results || [];

  // Filtrar integraciones
  const filteredIntegraciones = integraciones.filter((int) => {
    if (filterTipoServicio && int.tipo_servicio !== filterTipoServicio) {
      return false;
    }
    if (filterEstado === 'active' && !int.is_active) return false;
    if (filterEstado === 'inactive' && int.is_active) return false;
    if (filterEstado === 'healthy' && (!int.is_active || !int.is_healthy)) return false;
    if (filterEstado === 'unhealthy' && (!int.is_active || int.is_healthy)) return false;
    return true;
  });

  // Handlers
  const handleAdd = () => {
    setSelectedIntegracion(null);
    setShowModal(true);
  };

  const handleEdit = (integracion: IntegracionExternaList) => {
    setSelectedIntegracion(integracion);
    setShowModal(true);
  };

  const handleDeleteClick = (integracion: IntegracionExternaList) => {
    setIntegracionToDelete(integracion);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (integracionToDelete) {
      await deleteMutation.mutateAsync(integracionToDelete.id);
      setShowDeleteDialog(false);
      setIntegracionToDelete(null);
    }
  };

  const handleTestConnection = async (id: number) => {
    await testConnectionMutation.mutateAsync(id);
  };

  const handleToggleStatus = async (id: number) => {
    await toggleStatusMutation.mutateAsync(id);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar las integraciones. Intente de nuevo."
      />
    );
  }

  return (
    <>
      <Card>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Plug className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Integraciones Externas
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {integraciones.length} integración{integraciones.length !== 1 ? 'es' : ''} configurada{integraciones.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Integración
            </Button>
          </div>

          {/* Filtros */}
          {integraciones.length > 0 && (
            <div className="flex gap-4 mb-6">
              <Select
                label=""
                value={filterTipoServicio}
                onChange={(e) => setFilterTipoServicio(e.target.value as TipoServicio | '')}
                options={[
                  { value: '', label: 'Todos los tipos' },
                  { value: 'EMAIL', label: 'Email' },
                  { value: 'FACTURACION', label: 'Facturación' },
                  { value: 'SMS', label: 'SMS' },
                  { value: 'WHATSAPP', label: 'WhatsApp' },
                  { value: 'MAPAS', label: 'Mapas' },
                  { value: 'ALMACENAMIENTO', label: 'Almacenamiento' },
                  { value: 'BI', label: 'BI' },
                  { value: 'PAGOS', label: 'Pagos' },
                  { value: 'ERP', label: 'ERP' },
                  { value: 'FIRMA_DIGITAL', label: 'Firma Digital' },
                ]}
                className="w-48"
              />
              <Select
                label=""
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as typeof filterEstado)}
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'active', label: 'Activos' },
                  { value: 'inactive', label: 'Inactivos' },
                  { value: 'healthy', label: 'Saludables' },
                  { value: 'unhealthy', label: 'Con problemas' },
                ]}
                className="w-48"
              />
            </div>
          )}

          {/* Tabla de integraciones */}
          {filteredIntegraciones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Servicio
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Ambiente
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Última Verificación
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIntegraciones.map((integracion) => {
                    const Icon = TIPO_SERVICIO_ICONS[integracion.tipo_servicio] || Cloud;

                    return (
                      <tr
                        key={integracion.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {integracion.nombre}
                              </span>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {integracion.proveedor_display || integracion.proveedor}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="gray" size="sm">
                            {integracion.tipo_servicio_display || TIPO_SERVICIO_LABELS[integracion.tipo_servicio]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={integracion.ambiente === 'PRODUCCION' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {integracion.ambiente_display || integracion.ambiente}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge
                            status={integracion.status_indicator}
                            isActive={integracion.is_active}
                          />
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {integracion.ultima_verificacion
                            ? formatDistanceToNow(new Date(integracion.ultima_verificacion), {
                                addSuffix: true,
                                locale: es,
                              })
                            : 'Nunca'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Switch
                              checked={integracion.is_active}
                              onChange={() => handleToggleStatus(integracion.id)}
                              size="sm"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestConnection(integracion.id)}
                              title="Probar conexión"
                              disabled={!integracion.is_active || testConnectionMutation.isPending}
                            >
                              <Wifi className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(integracion)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(integracion)}
                              title="Eliminar"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : integraciones.length > 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No se encontraron integraciones con los filtros aplicados.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterTipoServicio('');
                  setFilterEstado('all');
                }}
                className="mt-2"
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Cloud className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay integraciones configuradas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Agregue la primera integración para conectar con servicios externos.
              </p>
              <Button variant="primary" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Integración
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de formulario */}
      <IntegracionFormModal
        integracion={selectedIntegracion}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedIntegracion(null);
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setIntegracionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Integración"
        message={`¿Está seguro de eliminar la integración "${integracionToDelete?.nombre}"? Esta acción puede afectar funcionalidades del sistema que dependan de esta integración.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
