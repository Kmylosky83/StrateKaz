/**
 * IntegracionesSection - Sección principal de Integraciones Externas
 *
 * Vista 2: Lista CRUD (Table View)
 * - Section Header por fuera del Card (icono + título + contador + botón crear)
 * - Filtros colapsables
 * - Data Table en Card con acciones por fila
 * - Empty State con CTA
 * - Modal de formulario para crear/editar
 * - ConfirmDialog para eliminar
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md
 */
import { useState } from 'react';
import {
  Plus,
  Wifi,
  Mail,
  FileText,
  MessageSquare,
  Phone,
  MapPin,
  HardDrive,
  BarChart3,
  CreditCard,
  PenTool,
  Cloud,
  Plug,
  Database,
  Bell,
  Users,
  CheckCircle,
  Globe,
  TrendingUp,
  Landmark,
  Building,
  Navigation,
  Server,
  UserCheck,
  Code,
  Webhook,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  Brain,
  ScanLine,
} from 'lucide-react';
import { Card, Badge, Button, BadgeVariant, BrandedSkeleton } from '@/components/common';
import { ActionButtons } from '@/components/common/ActionButtons';
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
import type {
  IntegracionExternaList,
  TipoServicio,
  StatusIndicator,
} from '../types/strategic.types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Iconos por tipo de servicio (sincronizado con backend cargar_tipos_sistema)
const TIPO_SERVICIO_ICONS: Record<TipoServicio, React.ComponentType<{ className?: string }>> = {
  // Comunicación
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: Phone,
  NOTIFICACIONES: Bell,
  // Tributario
  FACTURACION: FileText,
  NOMINA: Users,
  RADIAN: CheckCircle,
  // Archivos
  ALMACENAMIENTO: HardDrive,
  CDN: Globe,
  BACKUP: Database,
  // Analítica
  BI: BarChart3,
  ANALYTICS: TrendingUp,
  // Financiero
  PAGOS: CreditCard,
  PSE: Landmark,
  BANCARIO: Building,
  // Geolocalización
  MAPAS: MapPin,
  RASTREO: Navigation,
  // Legal
  FIRMA_DIGITAL: PenTool,
  // Cumplimiento
  OFAC: ShieldAlert,
  SAGRILAFT: ShieldCheck,
  // IA
  IA: Brain,
  OCR: ScanLine,
  // Sistemas
  ERP: Server,
  CRM: UserCheck,
  // Otros
  API_TERCEROS: Code,
  WEBHOOK: Webhook,
  OTRO: MoreHorizontal,
};

const TIPO_SERVICIO_LABELS: Record<TipoServicio, string> = {
  // Comunicación
  EMAIL: 'Email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  NOTIFICACIONES: 'Notificaciones Push',
  // Tributario
  FACTURACION: 'Facturación Electrónica',
  NOMINA: 'Nómina Electrónica',
  RADIAN: 'RADIAN',
  // Archivos
  ALMACENAMIENTO: 'Almacenamiento',
  CDN: 'CDN',
  BACKUP: 'Backup',
  // Analítica
  BI: 'Business Intelligence',
  ANALYTICS: 'Analytics',
  // Financiero
  PAGOS: 'Pagos',
  PSE: 'PSE',
  BANCARIO: 'Bancario',
  // Geolocalización
  MAPAS: 'Mapas',
  RASTREO: 'Rastreo GPS',
  // Legal
  FIRMA_DIGITAL: 'Firma Digital',
  // Cumplimiento
  OFAC: 'OFAC/Listas Restrictivas',
  SAGRILAFT: 'SAGRILAFT/SARLAFT',
  // IA
  IA: 'Inteligencia Artificial',
  OCR: 'OCR',
  // Sistemas
  ERP: 'ERP',
  CRM: 'CRM',
  // Otros
  API_TERCEROS: 'API Terceros',
  WEBHOOK: 'Webhooks',
  OTRO: 'Otro',
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

  const variants: Record<StatusIndicator, BadgeVariant> = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
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
  const [selectedIntegracion, setSelectedIntegracion] = useState<IntegracionExternaList | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [integracionToDelete, setIntegracionToDelete] = useState<IntegracionExternaList | null>(
    null
  );
  const [filterTipoServicio, setFilterTipoServicio] = useState<TipoServicio | ''>('');
  const [filterEstado, setFilterEstado] = useState<
    'all' | 'active' | 'inactive' | 'healthy' | 'unhealthy'
  >('all');

  const integraciones = Array.isArray(integracionesData) ? integracionesData : [];

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

  // Loading state - muestra logo del branding
  if (isLoading) {
    return <BrandedSkeleton height="h-80" logoSize="xl" showText />;
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
      <div className="space-y-6">
        {/* Section Header - Por fuera del Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Plug className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Integraciones Externas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {integraciones.length} integración{integraciones.length !== 1 ? 'es' : ''}{' '}
                configurada{integraciones.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {canDo(Modules.FUNDACION, Sections.INTEGRACIONES, 'create') && (
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Integración
            </Button>
          )}
        </div>

        {/* Filtros - Por fuera del Card de tabla */}
        {integraciones.length > 0 && (
          <div className="flex gap-4">
            <Select
              label=""
              value={filterTipoServicio}
              onChange={(e) => setFilterTipoServicio(e.target.value as TipoServicio | '')}
              options={[
                { value: '', label: 'Todos los tipos' },
                // Comunicación
                { value: 'EMAIL', label: 'Email' },
                { value: 'SMS', label: 'SMS' },
                { value: 'WHATSAPP', label: 'WhatsApp' },
                { value: 'NOTIFICACIONES', label: 'Notificaciones' },
                // Tributario
                { value: 'FACTURACION', label: 'Facturación' },
                { value: 'NOMINA', label: 'Nómina' },
                // Archivos
                { value: 'ALMACENAMIENTO', label: 'Almacenamiento' },
                { value: 'BACKUP', label: 'Backup' },
                // Analítica
                { value: 'BI', label: 'BI' },
                { value: 'ANALYTICS', label: 'Analytics' },
                // Financiero
                { value: 'PAGOS', label: 'Pagos' },
                { value: 'PSE', label: 'PSE' },
                { value: 'BANCARIO', label: 'Bancario' },
                // Geolocalización
                { value: 'MAPAS', label: 'Mapas' },
                { value: 'RASTREO', label: 'Rastreo GPS' },
                // Legal y Cumplimiento
                { value: 'FIRMA_DIGITAL', label: 'Firma Digital' },
                { value: 'OFAC', label: 'OFAC' },
                { value: 'SAGRILAFT', label: 'SAGRILAFT' },
                // IA
                { value: 'IA', label: 'IA' },
                { value: 'OCR', label: 'OCR' },
                // Sistemas
                { value: 'ERP', label: 'ERP' },
                { value: 'CRM', label: 'CRM' },
                // Otros
                { value: 'API_TERCEROS', label: 'API Terceros' },
                { value: 'WEBHOOK', label: 'Webhooks' },
                { value: 'OTRO', label: 'Otro' },
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

        {/* Data Table Card */}
        {filteredIntegraciones.length > 0 ? (
          <Card>
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
                            {integracion.tipo_servicio_display ||
                              TIPO_SERVICIO_LABELS[integracion.tipo_servicio]}
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
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={integracion.is_active}
                              onChange={() => handleToggleStatus(integracion.id)}
                              size="sm"
                              disabled={!canDo(Modules.FUNDACION, Sections.INTEGRACIONES, 'edit')}
                            />
                            <ActionButtons
                              module={Modules.FUNDACION}
                              section={Sections.INTEGRACIONES}
                              onEdit={() => handleEdit(integracion)}
                              onDelete={() => handleDeleteClick(integracion)}
                              size="sm"
                              customActions={[
                                {
                                  key: 'test-connection',
                                  label: 'Probar conexión',
                                  icon: <Wifi className="h-4 w-4" />,
                                  onClick: () => handleTestConnection(integracion.id),
                                  disabled:
                                    !integracion.is_active || testConnectionMutation.isPending,
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : integraciones.length > 0 ? (
          /* Estado: Filtros sin resultados */
          <Card>
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
          </Card>
        ) : (
          /* Empty State */
          <Card>
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
              {canDo(Modules.FUNDACION, Sections.INTEGRACIONES, 'create') && (
                <Button variant="primary" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Integración
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

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
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
