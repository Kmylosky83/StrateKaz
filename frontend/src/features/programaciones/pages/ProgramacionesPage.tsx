/**
 * Página Principal del Módulo Programaciones
 *
 * Características:
 * - Vista de tabla y calendario intercambiable
 * - Filtros avanzados colapsables
 * - CRUD completo de programaciones
 * - Gestión de estados y asignaciones
 * - Control de acceso por permisos
 * - Estadísticas en tiempo real
 */
import { useState, useEffect } from 'react';
import { Plus, Calendar, List, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import {
  PageHeader,
  StatsGrid,
  FilterCard,
  FilterGrid,
  DataTableCard,
} from '@/components/layout';
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

interface ProgramacionesPageProps {
  /** Modo embebido: oculta el PageHeader y controles cuando se usa dentro de otro componente */
  embedded?: boolean;
  /** Trigger externo para abrir el formulario de nueva programación */
  triggerNewForm?: number;
  /** Modo de vista controlado externamente */
  externalViewMode?: 'tabla' | 'calendario';
  /** Callback para cambiar modo de vista externamente */
  onViewModeChange?: (mode: 'tabla' | 'calendario') => void;
}

export const ProgramacionesPage = ({
  embedded = false,
  triggerNewForm = 0,
  externalViewMode,
  onViewModeChange,
}: ProgramacionesPageProps) => {
  // Usuario autenticado
  const user = useAuthStore((state) => state.user);

  // Estado de vista (controlado internamente o externamente)
  const [vistaInterna, setVistaInterna] = useState<'tabla' | 'calendario'>('tabla');
  const vistaActual = externalViewMode ?? vistaInterna;
  const setVistaActual = onViewModeChange ?? setVistaInterna;

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
  // Hook disponible para filtrar por unidad si se requiere
  useUnidadesNegocioProgramacion();

  // Mutations
  const createMutation = useCreateProgramacion();
  const updateMutation = useUpdateProgramacion();
  const deleteMutation = useDeleteProgramacion();
  const asignarRecolectorMutation = useAsignarRecolector();
  const reprogramarMutation = useReprogramar();

  // Permisos
  const canCreate = ['comercial_econorte', 'lider_com_econorte', 'gerente', 'superadmin', 'coordinador_recoleccion'].includes(
    user?.cargo_code || ''
  );
  const canDelete = ['comercial_econorte', 'lider_com_econorte', 'gerente', 'superadmin', 'coordinador_recoleccion'].includes(
    user?.cargo_code || ''
  );
  const canReprogramar = ['lider_log_econorte', 'superadmin'].includes(user?.cargo_code || '');
  const canAsignarRecolector = ['lider_log_econorte', 'superadmin'].includes(user?.cargo_code || '');

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

  // Efecto para abrir formulario desde trigger externo (EcoNortePage)
  useEffect(() => {
    if (triggerNewForm > 0 && canCreate) {
      handleOpenForm();
    }
  }, [triggerNewForm, canCreate]);

  const activeFiltersCount = [
    filters.estado,
    filters.tipo_programacion,
    filters.fecha_desde,
    filters.fecha_hasta,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  // Datos
  const programaciones = programacionesData?.results || [];
  const totalProgramaciones = programacionesData?.count || 0;

  // Toggle de vista
  const ViewToggle = (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <Button
        variant={vistaActual === 'tabla' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setVistaActual('tabla')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={vistaActual === 'calendario' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setVistaActual('calendario')}
      >
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* HEADER - Solo visible cuando NO está embebido */}
      {!embedded && (
        <PageHeader
          title="Programaciones"
          description="Gestión de programaciones de recolección de material"
          controls={ViewToggle}
          actions={
            canCreate ? (
              <Button variant="primary" onClick={() => handleOpenForm()}>
                <Plus className="h-5 w-5 mr-2" />
                Nueva Programación
              </Button>
            ) : undefined
          }
        />
      )}

      {/* ESTADÍSTICAS */}
      {estadisticasData && (
        <StatsGrid
          stats={[
            {
              label: 'Total',
              value: estadisticasData.total,
              icon: Package,
              iconColor: 'gray',
            },
            {
              label: 'Pendientes',
              value: estadisticasData.pendientes,
              icon: Clock,
              iconColor: 'info',
            },
            {
              label: 'En Proceso',
              value: estadisticasData.asignadas + estadisticasData.en_ruta,
              icon: Truck,
              iconColor: 'warning',
            },
            {
              label: 'Completadas',
              value: estadisticasData.completadas,
              icon: CheckCircle,
              iconColor: 'success',
            },
          ]}
        />
      )}

      {/* FILTROS (Solo en vista tabla) */}
      {vistaActual === 'tabla' && (
        <FilterCard
          collapsible
          searchPlaceholder="Buscar por Código o Ecoaliado..."
          searchValue={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
          activeFiltersCount={activeFiltersCount}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        >
          <FilterGrid columns={4}>
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
          </FilterGrid>
        </FilterCard>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {vistaActual === 'tabla' ? (
        <DataTableCard
          pagination={{
            currentPage: filters.page!,
            pageSize: filters.page_size!,
            totalItems: totalProgramaciones,
            hasPrevious: !!programacionesData?.previous,
            hasNext: !!programacionesData?.next,
            onPageChange: (page) => handleFilterChange('page', page),
          }}
          isEmpty={programaciones.length === 0}
          isLoading={isLoadingProgramaciones}
          emptyMessage="No se encontraron programaciones"
        >
          <ProgramacionesTable
            programaciones={programaciones}
            onDelete={handleDelete}
            onAsignarRecolector={handleOpenAsignarRecolector}
            onReprogramar={handleOpenReprogramar}
            canDelete={canDelete}
            canReprogramar={canReprogramar}
            canAsignarRecolector={canAsignarRecolector}
            isLoading={isLoadingProgramaciones}
          />
        </DataTableCard>
      ) : (
        <CalendarioView
          programaciones={programaciones}
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
