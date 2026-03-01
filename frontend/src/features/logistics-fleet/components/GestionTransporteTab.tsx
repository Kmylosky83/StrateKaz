/**
 * Tab de Gestión de Transporte
 * Sub-tabs: Programaciones, Rutas, Conductores
 */
import { useState } from 'react';
import { MapPin, User, Calendar, AlertTriangle, Edit, Trash2, Route } from 'lucide-react';
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
  useRutas,
  useConductores,
  useProgramaciones,
  useConductoresLicenciaVencida,
  useDeleteRuta,
  useDeleteConductor,
} from '../hooks/useLogisticsFleet';
import { EstadoProgramacionLabels, EstadoProgramacionColors } from '../types/logistics-fleet.types';
import type { Ruta, Conductor, ProgramacionRuta } from '../types/logistics-fleet.types';
import RutaFormModal from './RutaFormModal';
import ConductorFormModal from './ConductorFormModal';
import ProgramacionFormModal from './ProgramacionFormModal';

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

export function GestionTransporteTab() {
  const [activeSubTab, setActiveSubTab] = useState('programaciones');

  // Queries
  const { data: conductoresVencidos } = useConductoresLicenciaVencida();
  const { data: rutasData, isLoading: loadingRutas } = useRutas({ is_active: true });
  const { data: conductoresData, isLoading: loadingConductores } = useConductores({
    is_active: true,
  });
  const { data: programacionesData, isLoading: loadingProgramaciones } = useProgramaciones({});

  const rutas = Array.isArray(rutasData) ? rutasData : (rutasData?.results ?? []);
  const conductores = Array.isArray(conductoresData)
    ? conductoresData
    : (conductoresData?.results ?? []);
  const programaciones = Array.isArray(programacionesData)
    ? programacionesData
    : (programacionesData?.results ?? []);

  // Delete mutations
  const deleteRutaMutation = useDeleteRuta();
  const deleteConductorMutation = useDeleteConductor();

  // Modal state - Rutas
  const [rutaModalOpen, setRutaModalOpen] = useState(false);
  const [selectedRuta, setSelectedRuta] = useState<Ruta | null>(null);
  const [deleteRutaId, setDeleteRutaId] = useState<number | null>(null);

  // Modal state - Conductores
  const [conductorModalOpen, setConductorModalOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [deleteConductorId, setDeleteConductorId] = useState<number | null>(null);

  // Modal state - Programaciones
  const [programacionModalOpen, setProgramacionModalOpen] = useState(false);
  const [selectedProgramacion, setSelectedProgramacion] = useState<ProgramacionRuta | null>(null);

  // Handlers - Rutas
  const handleNewRuta = () => {
    setSelectedRuta(null);
    setRutaModalOpen(true);
  };
  const handleEditRuta = (item: Ruta) => {
    setSelectedRuta(item);
    setRutaModalOpen(true);
  };
  const handleCloseRuta = () => {
    setSelectedRuta(null);
    setRutaModalOpen(false);
  };
  const handleDeleteRuta = () => {
    if (deleteRutaId)
      deleteRutaMutation.mutate(deleteRutaId, { onSuccess: () => setDeleteRutaId(null) });
  };

  // Handlers - Conductores
  const handleNewConductor = () => {
    setSelectedConductor(null);
    setConductorModalOpen(true);
  };
  const handleEditConductor = (item: Conductor) => {
    setSelectedConductor(item);
    setConductorModalOpen(true);
  };
  const handleCloseConductor = () => {
    setSelectedConductor(null);
    setConductorModalOpen(false);
  };
  const handleDeleteConductor = () => {
    if (deleteConductorId)
      deleteConductorMutation.mutate(deleteConductorId, {
        onSuccess: () => setDeleteConductorId(null),
      });
  };

  // Handlers - Programaciones
  const handleNewProgramacion = () => {
    setSelectedProgramacion(null);
    setProgramacionModalOpen(true);
  };
  const handleEditProgramacion = (item: ProgramacionRuta) => {
    setSelectedProgramacion(item);
    setProgramacionModalOpen(true);
  };
  const handleCloseProgramacion = () => {
    setSelectedProgramacion(null);
    setProgramacionModalOpen(false);
  };

  // KPIs
  const stats = {
    rutasActivas: rutas.length,
    conductoresActivos: conductores.length,
    programacionesPendientes: programaciones.filter((p) => p.estado === 'PROGRAMADA').length,
    licenciasVencidas: conductoresVencidos?.length ?? 0,
  };

  const subTabs = [
    { id: 'programaciones', label: 'Programaciones', icon: <Calendar className="h-4 w-4" /> },
    { id: 'rutas', label: 'Rutas', icon: <MapPin className="h-4 w-4" /> },
    { id: 'conductores', label: 'Conductores', icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* PESV Alert */}
      {conductoresVencidos && conductoresVencidos.length > 0 && (
        <Alert variant="error">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                Alerta PESV - Licencias de Conducción Vencidas
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {conductoresVencidos.length} conductor(es) con licencia vencida. NO pueden operar
                según Resolución 40595/2022.
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* KPIs */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Rutas Activas"
          value={stats.rutasActivas}
          icon={<Route className="w-6 h-6" />}
          color="blue"
        />
        <KpiCard
          label="Conductores"
          value={stats.conductoresActivos}
          icon={<User className="w-6 h-6" />}
          color="success"
        />
        <KpiCard
          label="Prog. Pendientes"
          value={stats.programacionesPendientes}
          icon={<Calendar className="w-6 h-6" />}
          color="warning"
        />
        <KpiCard
          label="Licencias Vencidas"
          value={stats.licenciasVencidas}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
        />
      </KpiCardGrid>

      {/* Sub-tabs */}
      <Tabs tabs={subTabs} activeTab={activeSubTab} onChange={setActiveSubTab} variant="pills" />

      {/* ===== Programaciones ===== */}
      {activeSubTab === 'programaciones' && (
        <div className="space-y-4">
          <SectionToolbar
            title="Programación de Rutas"
            subtitle="Asignación de vehículos y conductores a rutas"
            count={programaciones.length}
            primaryAction={{ label: 'Nueva Programación', onClick: handleNewProgramacion }}
          />

          {loadingProgramaciones ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : programaciones.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-16 h-16" />}
              title="No hay programaciones registradas"
              description="Comience programando rutas con vehículos y conductores"
              action={{ label: 'Nueva Programación', onClick: handleNewProgramacion }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Ruta
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Conductor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Hora Salida
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {programaciones.map((prog) => (
                      <tr key={prog.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {prog.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {prog.ruta_nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {prog.conductor_nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(prog.fecha_programada).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {prog.hora_salida_programada}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={colorToBadge(EstadoProgramacionColors[prog.estado])}
                            size="sm"
                          >
                            {EstadoProgramacionLabels[prog.estado]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProgramacion(prog)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
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

      {/* ===== Rutas ===== */}
      {activeSubTab === 'rutas' && (
        <div className="space-y-4">
          <SectionToolbar
            title="Rutas Predefinidas"
            subtitle="Gestión de rutas de recolección y entrega"
            count={rutas.length}
            primaryAction={{ label: 'Nueva Ruta', onClick: handleNewRuta }}
          />

          {loadingRutas ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : rutas.length === 0 ? (
            <EmptyState
              icon={<MapPin className="w-16 h-16" />}
              title="No hay rutas registradas"
              description="Defina las rutas de transporte de su operación"
              action={{ label: 'Nueva Ruta', onClick: handleNewRuta }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Origen
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Destino
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Distancia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tiempo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {rutas.map((ruta) => (
                      <tr key={ruta.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {ruta.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ruta.nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ruta.origen_nombre}, {ruta.origen_ciudad}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ruta.destino_nombre}, {ruta.destino_ciudad}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ruta.distancia_km} km
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ruta.tiempo_estimado_minutos} min
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditRuta(ruta)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteRutaId(ruta.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
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

      {/* ===== Conductores ===== */}
      {activeSubTab === 'conductores' && (
        <div className="space-y-4">
          <SectionToolbar
            title="Conductores"
            subtitle="Gestión de conductores y licencias"
            count={conductores.length}
            primaryAction={{ label: 'Nuevo Conductor', onClick: handleNewConductor }}
          />

          {loadingConductores ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : conductores.length === 0 ? (
            <EmptyState
              icon={<User className="w-16 h-16" />}
              title="No hay conductores registrados"
              description="Registre los conductores de su operación"
              action={{ label: 'Nuevo Conductor', onClick: handleNewConductor }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Documento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Licencia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Categoría
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Vencimiento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {conductores.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {c.nombre_completo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {c.tipo_documento} {c.documento_identidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {c.licencia_conduccion}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="gray" size="sm">
                            {c.categoria_licencia}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 dark:text-gray-300">
                              {new Date(c.fecha_vencimiento_licencia).toLocaleDateString('es-CO')}
                            </span>
                            {c.licencia_vigente === false && (
                              <Badge variant="danger" size="sm">
                                Vencida
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={c.es_empleado ? 'info' : 'gray'} size="sm">
                            {c.es_empleado ? 'Empleado' : 'Tercero'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditConductor(c)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConductorId(c.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
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

      {/* Modals */}
      <RutaFormModal item={selectedRuta} isOpen={rutaModalOpen} onClose={handleCloseRuta} />
      <ConductorFormModal
        item={selectedConductor}
        isOpen={conductorModalOpen}
        onClose={handleCloseConductor}
      />
      <ProgramacionFormModal
        item={selectedProgramacion}
        isOpen={programacionModalOpen}
        onClose={handleCloseProgramacion}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={deleteRutaId !== null}
        onClose={() => setDeleteRutaId(null)}
        onConfirm={handleDeleteRuta}
        title="Eliminar Ruta"
        message="¿Está seguro de eliminar esta ruta? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteRutaMutation.isPending}
      />
      <ConfirmDialog
        isOpen={deleteConductorId !== null}
        onClose={() => setDeleteConductorId(null)}
        onConfirm={handleDeleteConductor}
        title="Eliminar Conductor"
        message="¿Está seguro de eliminar este conductor? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteConductorMutation.isPending}
      />
    </div>
  );
}
