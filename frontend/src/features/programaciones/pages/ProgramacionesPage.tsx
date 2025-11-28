/**
 * Página Principal del Módulo Programaciones
 *
 * Características:
 * - Vista de tabla y calendario intercambiable
 * - Filtros avanzados
 * - CRUD completo de programaciones
 * - Gestión de estados y asignaciones
 * - Control de acceso por permisos
 * - Estadísticas en tiempo real
 */
import { useState } from 'react';
import { Plus, Search, Filter, X, Calendar, List, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Card } from '@/components/common/Card';
import { useAuthStore } from '@/store/authStore';
import { ProgramacionesTable } from '../components/ProgramacionesTable';
import { ProgramacionForm } from '../components/ProgramacionForm';
import { AsignarRecolectorModal } from '../components/AsignarRecolectorModal';
import { ReprogramarModal } from '../components/ReprogramarModal';
import { ProgramacionDetalleModal } from '../components/ProgramacionDetalleModal';
import { CalendarioView } from '../components/CalendarioView';
import {
  useProgramaciones,
  useCreateProgramacion,
  useUpdateProgramacion,
  useDeleteProgramacion,
  useAsignarRecolector,
  useReprogramar,
  useEstadisticasProgramaciones,
  useUnidadesNegocioProgramacion,
} from '../api/useProgramaciones';
import type {
  Programacion,
  CreateProgramacionDTO,
  UpdateProgramacionDTO,
  ProgramacionFilters,
  AsignarRecolectorDTO,
  ReprogramarDTO,
} from '../types/programacion.types';

export const ProgramacionesPage = () => {
  // Usuario autenticado
  const user = useAuthStore((state) => state.user);

  // Estado de vista
  const [vistaActual, setVistaActual] = useState<'tabla' | 'calendario'>('tabla');

  // Estado de filtros
  const [filters, setFilters] = useState<ProgramacionFilters>({
    search: '',
    estado: '',
    tipo_programacion: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 20,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAsignarRecolectorOpen, setIsAsignarRecolectorOpen] = useState(false);
  const [isReprogramarOpen, setIsReprogramarOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [selectedProgramacion, setSelectedProgramacion] = useState<Programacion | null>(null);

  // Queries
  const { data: programacionesData, isLoading: isLoadingProgramaciones } = useProgramaciones(filters);
  const { data: estadisticasData } = useEstadisticasProgramaciones(
    filters.fecha_desde || undefined,
    filters.fecha_hasta || undefined
  );
  // TODO: Backend endpoint /api/programaciones/recolectores/ no existe aún
  // const { data: recolectoresData } = useRecolectores();
  const { data: unidadesData } = useUnidadesNegocioProgramacion();

  // Mutations
  const createMutation = useCreateProgramacion();
  const updateMutation = useUpdateProgramacion();
  const deleteMutation = useDeleteProgramacion();
  const asignarRecolectorMutation = useAsignarRecolector();
  const reprogramarMutation = useReprogramar();

  // Permisos
  // Crear: comerciales, líderes comerciales, gerente, superadmin, coordinador
  const canCreate = ['comercial_econorte', 'lider_com_econorte', 'gerente', 'superadmin', 'coordinador_recoleccion'].includes(
    user?.cargo_code || ''
  );

  // Eliminar: comerciales, líderes comerciales, gerente, superadmin, coordinador
  const canDelete = ['comercial_econorte', 'lider_com_econorte', 'gerente', 'superadmin', 'coordinador_recoleccion'].includes(
    user?.cargo_code || ''
  );

  // Reprogramar: solo lider logístico y superadmin
  const canReprogramar = ['lider_log_econorte', 'superadmin'].includes(
    user?.cargo_code || ''
  );

  // Asignar recolector: SOLO lider logístico y superadmin
  const canAsignarRecolector = ['lider_log_econorte', 'superadmin'].includes(
    user?.cargo_code || ''
  );

  // Handlers - Formulario
  const handleOpenForm = (programacion?: Programacion) => {
    setSelectedProgramacion(programacion || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedProgramacion(null);
  };

  const handleSubmitForm = async (data: CreateProgramacionDTO | UpdateProgramacionDTO) => {
    try {
      if (selectedProgramacion) {
        await updateMutation.mutateAsync({
          id: selectedProgramacion.id,
          data: data as UpdateProgramacionDTO,
        });
      } else {
        await createMutation.mutateAsync(data as CreateProgramacionDTO);
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error al guardar programación:', error);
    }
  };

  // Handlers - Asignar Recolector
  const handleOpenAsignarRecolector = (programacion: Programacion) => {
    setSelectedProgramacion(programacion);
    setIsAsignarRecolectorOpen(true);
  };

  const handleCloseAsignarRecolector = () => {
    setIsAsignarRecolectorOpen(false);
    setSelectedProgramacion(null);
  };

  const handleSubmitAsignarRecolector = async (data: AsignarRecolectorDTO) => {
    if (!selectedProgramacion) return;

    try {
      await asignarRecolectorMutation.mutateAsync({
        id: selectedProgramacion.id,
        data,
      });
      handleCloseAsignarRecolector();
    } catch (error) {
      console.error('Error al asignar recolector:', error);
    }
  };

  // Handlers - Detalle (calendario)
  const handleOpenDetalle = (programacion: Programacion) => {
    setSelectedProgramacion(programacion);
    setIsDetalleOpen(true);
  };

  const handleCloseDetalle = () => {
    setIsDetalleOpen(false);
    setSelectedProgramacion(null);
  };

  // Handlers - Reprogramar
  const handleOpenReprogramar = (programacion: Programacion) => {
    setSelectedProgramacion(programacion);
    setIsReprogramarOpen(true);
  };

  const handleCloseReprogramar = () => {
    setIsReprogramarOpen(false);
    setSelectedProgramacion(null);
  };

  const handleSubmitReprogramar = async (data: ReprogramarDTO) => {
    if (!selectedProgramacion) return;

    try {
      await reprogramarMutation.mutateAsync({
        id: selectedProgramacion.id,
        data,
      });
      handleCloseReprogramar();
    } catch (error) {
      console.error('Error al reprogramar:', error);
    }
  };

  // Handlers - Acciones
  const handleDelete = async (programacion: Programacion) => {
    if (
      window.confirm(
        `¿Está seguro de eliminar la programación "${programacion.codigo}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(programacion.id);
      } catch (error) {
        console.error('Error al eliminar programación:', error);
      }
    }
  };

  // Handlers - Filtros
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof ProgramacionFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      estado: '',
      tipo_programacion: '',
      fecha_desde: '',
      fecha_hasta: '',
      page: 1,
      page_size: 20,
    });
  };

  const hasActiveFilters =
    filters.estado ||
    filters.tipo_programacion ||
    filters.fecha_desde ||
    filters.fecha_hasta;

  // TODO: Backend endpoint /api/programaciones/recolectores/ no existe aún
  // const recolectoresOptions =
  //   recolectoresData?.results
  //     .filter((r) => r.is_active)
  //     .map((r) => ({
  //       value: r.id,
  //       label: r.nombre_completo,
  //     })) || [];
  const recolectoresOptions: Array<{ value: number; label: string }> = [];

  const unidadesOptions =
    unidadesData?.results.map((u) => ({
      value: u.id,
      label: u.nombre_comercial,
    })) || [];

  // Datos para calendario
  const programacionesCalendario = programacionesData?.results || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Programaciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de programaciones de recolección de material
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Vista */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={vistaActual === 'tabla' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setVistaActual('tabla')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={vistaActual === 'calendario' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setVistaActual('calendario')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>

          {canCreate && (
            <Button variant="primary" onClick={() => handleOpenForm()}>
              <Plus className="h-5 w-5 mr-2" />
              Nueva Programación
            </Button>
          )}
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      {estadisticasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {estadisticasData.total}
                </div>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pendientes</div>
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                  {estadisticasData.pendientes}
                </div>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">En Proceso</div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {estadisticasData.asignadas + estadisticasData.en_ruta}
                </div>
              </div>
              <Truck className="h-8 w-8 text-yellow-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completadas</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {estadisticasData.completadas}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </Card>
        </div>
      )}

      {/* FILTROS (Solo en vista tabla) */}
      {vistaActual === 'tabla' && (
        <Card>
          <div className="space-y-4">
            {/* Buscador Principal */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por Código o Ecoaliado..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  leftIcon={<Search className="h-5 w-5 text-gray-400" />}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-shrink-0"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {
                      Object.values({
                        estado: filters.estado,
                        tipo: filters.tipo_programacion,
                        fechas: filters.fecha_desde || filters.fecha_hasta,
                      }).filter(Boolean).length
                    }
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Filtros Avanzados */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select
                    label="Estado"
                    value={filters.estado}
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
                    options={[
                      { value: '', label: 'Todos' },
                      { value: 'PROGRAMADA', label: 'Programada' },
                      { value: 'CONFIRMADA', label: 'Confirmada' },
                      { value: 'EN_RUTA', label: 'En Ruta' },
                      { value: 'COMPLETADA', label: 'Completada' },
                      { value: 'CANCELADA', label: 'Cancelada' },
                      { value: 'REPROGRAMADA', label: 'Reprogramada' },
                    ]}
                  />

                  <Select
                    label="Tipo de Programación"
                    value={filters.tipo_programacion}
                    onChange={(e) => handleFilterChange('tipo_programacion', e.target.value)}
                    options={[
                      { value: '', label: 'Todos' },
                      { value: 'PROGRAMADA', label: 'Programada' },
                      { value: 'INMEDIATA', label: 'Inmediata' },
                    ]}
                  />

                  <Input
                    type="date"
                    label="Fecha Desde"
                    value={filters.fecha_desde}
                    onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                  />

                  <Input
                    type="date"
                    label="Fecha Hasta"
                    value={filters.fecha_hasta}
                    onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {vistaActual === 'tabla' ? (
        <Card>
          <ProgramacionesTable
            programaciones={programacionesData?.results || []}
            onDelete={handleDelete}
            onAsignarRecolector={handleOpenAsignarRecolector}
            onReprogramar={handleOpenReprogramar}
            canDelete={canDelete}
            canReprogramar={canReprogramar}
            canAsignarRecolector={canAsignarRecolector}
            isLoading={isLoadingProgramaciones}
          />
        </Card>
      ) : (
        <CalendarioView
          programaciones={programacionesCalendario}
          onProgramacionClick={handleOpenDetalle}
          isLoading={isLoadingProgramaciones}
        />
      )}

      {/* MODALES */}
      <ProgramacionForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        programacion={selectedProgramacion}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AsignarRecolectorModal
        isOpen={isAsignarRecolectorOpen}
        onClose={handleCloseAsignarRecolector}
        onSubmit={handleSubmitAsignarRecolector}
        programacion={selectedProgramacion}
        isLoading={asignarRecolectorMutation.isPending}
      />

      <ProgramacionDetalleModal
        isOpen={isDetalleOpen}
        onClose={handleCloseDetalle}
        programacion={selectedProgramacion}
        onAsignarRecolector={handleOpenAsignarRecolector}
        onReprogramar={handleOpenReprogramar}
        onEliminar={handleDelete}
        canAsignarRecolector={canAsignarRecolector}
        canReprogramar={canReprogramar}
        canEliminar={canDelete}
      />

      <ReprogramarModal
        isOpen={isReprogramarOpen}
        onClose={handleCloseReprogramar}
        onSubmit={handleSubmitReprogramar}
        programacion={selectedProgramacion}
        canReprogramar={canReprogramar}
        isLoading={reprogramarMutation.isPending}
      />
    </div>
  );
};
