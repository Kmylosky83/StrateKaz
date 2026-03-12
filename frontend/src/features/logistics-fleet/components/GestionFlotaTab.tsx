/**
 * Tab de Gestión de Flota
 * Sub-tabs: Vehículos, Mantenimientos
 */
import { useState } from 'react';
import { Truck, Wrench, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  Card,
  Badge,
  Button,
  Alert,
  Tabs,
  Spinner,
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  EmptyState,
  ConfirmDialog,
} from '@/components/common';
import {
  useVehiculos,
  useDashboardFlota,
  useVehiculosVencidos,
  useMantenimientos,
  useDeleteVehiculo,
} from '../hooks/useLogisticsFleet';
import {
  TipoMantenimientoLabels,
  TipoMantenimientoColors,
  EstadoMantenimientoLabels,
  EstadoMantenimientoColors,
} from '../types/logistics-fleet.types';
import type { Vehiculo, VehiculoList, MantenimientoVehiculo } from '../types/logistics-fleet.types';
import VehiculoFormModal from './VehiculoFormModal';
import MantenimientoFormModal from './MantenimientoFormModal';

const colorToBadge = (color: string): 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
    green: 'success',
    yellow: 'warning',
    red: 'danger',
    blue: 'info',
    purple: 'info',
  };
  return map[color] || 'gray';
};

export function GestionFlotaTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.LOGISTICS_FLEET, Sections.VEHICULOS, 'create');
  const canEdit = canDo(Modules.LOGISTICS_FLEET, Sections.VEHICULOS, 'edit');
  const canDelete = canDo(Modules.LOGISTICS_FLEET, Sections.VEHICULOS, 'delete');

  const [activeSubTab, setActiveSubTab] = useState('vehiculos');

  // Queries
  const { data: dashboard, isLoading: loadingDashboard } = useDashboardFlota();
  const { data: vehiculosVencidos } = useVehiculosVencidos();
  const { data: vehiculosData, isLoading: loadingVehiculos } = useVehiculos({ is_active: true });
  const { data: mantenimientosData, isLoading: loadingMantenimientos } = useMantenimientos({});

  const vehiculos = Array.isArray(vehiculosData) ? vehiculosData : (vehiculosData?.results ?? []);
  const mantenimientos = Array.isArray(mantenimientosData)
    ? mantenimientosData
    : (mantenimientosData?.results ?? []);

  // Delete
  const deleteVehiculoMutation = useDeleteVehiculo();

  // Modal state - Vehículos
  const [vehiculoModalOpen, setVehiculoModalOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [deleteVehiculoId, setDeleteVehiculoId] = useState<number | null>(null);

  // Modal state - Mantenimientos
  const [mantenimientoModalOpen, setMantenimientoModalOpen] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState<MantenimientoVehiculo | null>(
    null
  );

  // Handlers - Vehículos
  const handleNewVehiculo = () => {
    setSelectedVehiculo(null);
    setVehiculoModalOpen(true);
  };
  const handleEditVehiculo = (item: VehiculoList) => {
    setSelectedVehiculo(item as unknown as Vehiculo);
    setVehiculoModalOpen(true);
  };
  const handleCloseVehiculo = () => {
    setSelectedVehiculo(null);
    setVehiculoModalOpen(false);
  };
  const handleDeleteVehiculo = () => {
    if (deleteVehiculoId)
      deleteVehiculoMutation.mutate(deleteVehiculoId, {
        onSuccess: () => setDeleteVehiculoId(null),
      });
  };

  // Handlers - Mantenimientos
  const handleNewMantenimiento = () => {
    setSelectedMantenimiento(null);
    setMantenimientoModalOpen(true);
  };
  const handleEditMantenimiento = (item: MantenimientoVehiculo) => {
    setSelectedMantenimiento(item);
    setMantenimientoModalOpen(true);
  };
  const handleCloseMantenimiento = () => {
    setSelectedMantenimiento(null);
    setMantenimientoModalOpen(false);
  };

  // KPIs
  const dashboardStats = {
    total: loadingDashboard ? 0 : (dashboard?.total_vehiculos ?? 0),
    disponibles: loadingDashboard ? 0 : (dashboard?.vehiculos_disponibles ?? 0),
    enMantenimiento: loadingDashboard ? 0 : (dashboard?.vehiculos_mantenimiento ?? 0),
    docVencidos: loadingDashboard ? 0 : (dashboard?.documentos_vencidos ?? 0),
  };

  const subTabs = [
    { id: 'vehiculos', label: 'Vehículos', icon: <Truck className="h-4 w-4" /> },
    { id: 'mantenimientos', label: 'Mantenimientos', icon: <Wrench className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* PESV Alert - Documentos Vencidos */}
      {vehiculosVencidos && vehiculosVencidos.length > 0 && (
        <Alert variant="error">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                Alerta PESV - Documentos Vencidos
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {vehiculosVencidos.length} vehículo(s) con documentos vencidos. NO pueden operar
                según Resolución 40595/2022.
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* KPIs */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Vehículos"
          value={dashboardStats.total}
          icon={<Truck className="w-6 h-6" />}
          color="blue"
        />
        <KpiCard
          label="Disponibles"
          value={dashboardStats.disponibles}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
        />
        <KpiCard
          label="En Mantenimiento"
          value={dashboardStats.enMantenimiento}
          icon={<Wrench className="w-6 h-6" />}
          color="warning"
        />
        <KpiCard
          label="Docs. Vencidos"
          value={dashboardStats.docVencidos}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
        />
      </KpiCardGrid>

      {/* Sub-tabs */}
      <Tabs tabs={subTabs} activeTab={activeSubTab} onChange={setActiveSubTab} variant="pills" />

      {/* ===== Vehículos ===== */}
      {activeSubTab === 'vehiculos' && (
        <div className="space-y-4">
          <SectionToolbar
            title="Vehículos de la Flota"
            subtitle="Gestión completa de vehículos y documentos PESV"
            count={vehiculos.length}
            primaryAction={
              canCreate ? { label: 'Nuevo Vehículo', onClick: handleNewVehiculo } : undefined
            }
          />

          {loadingVehiculos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : vehiculos.length === 0 ? (
            <EmptyState
              icon={<Truck className="w-16 h-16" />}
              title="No hay vehículos registrados"
              description="Comience registrando los vehículos de su flota"
              action={
                canCreate ? { label: 'Nuevo Vehículo', onClick: handleNewVehiculo } : undefined
              }
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Placa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Vehículo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        SOAT
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tecnomecánica
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Disponible
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {vehiculos.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {v.placa}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {v.marca} {v.modelo} ({v.anio})
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {v.tipo_nombre}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              v.estado_color === 'green'
                                ? 'success'
                                : v.estado_color === 'red'
                                  ? 'danger'
                                  : v.estado_color === 'yellow'
                                    ? 'warning'
                                    : 'gray'
                            }
                            size="sm"
                          >
                            {v.estado_nombre}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {v.fecha_soat ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 dark:text-gray-300">
                                {new Date(v.fecha_soat).toLocaleDateString('es-CO')}
                              </span>
                              {v.dias_hasta_vencimiento_soat !== undefined && (
                                <Badge
                                  variant={
                                    v.dias_hasta_vencimiento_soat < 0
                                      ? 'danger'
                                      : v.dias_hasta_vencimiento_soat <= 30
                                        ? 'warning'
                                        : 'gray'
                                  }
                                  size="sm"
                                >
                                  {v.dias_hasta_vencimiento_soat < 0
                                    ? `Vencido ${Math.abs(v.dias_hasta_vencimiento_soat)}d`
                                    : `${v.dias_hasta_vencimiento_soat}d`}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">Sin registro</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {v.fecha_tecnomecanica ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 dark:text-gray-300">
                                {new Date(v.fecha_tecnomecanica).toLocaleDateString('es-CO')}
                              </span>
                              {v.dias_hasta_vencimiento_tecnomecanica !== undefined && (
                                <Badge
                                  variant={
                                    v.dias_hasta_vencimiento_tecnomecanica < 0
                                      ? 'danger'
                                      : v.dias_hasta_vencimiento_tecnomecanica <= 30
                                        ? 'warning'
                                        : 'gray'
                                  }
                                  size="sm"
                                >
                                  {v.dias_hasta_vencimiento_tecnomecanica < 0
                                    ? `Vencido ${Math.abs(v.dias_hasta_vencimiento_tecnomecanica)}d`
                                    : `${v.dias_hasta_vencimiento_tecnomecanica}d`}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">Sin registro</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {v.disponible_para_operar ? (
                            <Badge variant="success" size="sm">
                              Disponible
                            </Badge>
                          ) : (
                            <Badge variant="danger" size="sm">
                              No Disponible
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditVehiculo(v)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteVehiculoId(v.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ===== Mantenimientos ===== */}
      {activeSubTab === 'mantenimientos' && (
        <div className="space-y-4">
          <SectionToolbar
            title="Mantenimientos"
            subtitle="Gestión de mantenimientos preventivos y correctivos"
            count={mantenimientos.length}
            primaryAction={
              canCreate
                ? { label: 'Nuevo Mantenimiento', onClick: handleNewMantenimiento }
                : undefined
            }
          />

          {loadingMantenimientos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : mantenimientos.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-16 h-16" />}
              title="No hay mantenimientos registrados"
              description="Programe mantenimientos para los vehículos de su flota"
              action={
                canCreate
                  ? { label: 'Nuevo Mantenimiento', onClick: handleNewMantenimiento }
                  : undefined
              }
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Vehículo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha Prog.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Costo Total
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {mantenimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {m.vehiculo_placa}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={colorToBadge(TipoMantenimientoColors[m.tipo])} size="sm">
                            {TipoMantenimientoLabels[m.tipo]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                          {m.descripcion}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(m.fecha_programada).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={colorToBadge(EstadoMantenimientoColors[m.estado])}
                            size="sm"
                          >
                            {EstadoMantenimientoLabels[m.estado]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          ${new Intl.NumberFormat('es-CO').format(m.costo_total)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMantenimiento(m)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modals */}
      <VehiculoFormModal
        item={selectedVehiculo}
        isOpen={vehiculoModalOpen}
        onClose={handleCloseVehiculo}
      />
      <MantenimientoFormModal
        item={selectedMantenimiento}
        isOpen={mantenimientoModalOpen}
        onClose={handleCloseMantenimiento}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteVehiculoId !== null}
        onClose={() => setDeleteVehiculoId(null)}
        onConfirm={handleDeleteVehiculo}
        title="Eliminar Vehículo"
        message="¿Está seguro de eliminar este vehículo? Se eliminarán también sus documentos y registros asociados."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteVehiculoMutation.isPending}
      />
    </div>
  );
}
