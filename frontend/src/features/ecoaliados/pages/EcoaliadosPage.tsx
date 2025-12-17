/**
 * Página Principal del Módulo Ecoaliados
 *
 * Características:
 * - Listado completo con filtros
 * - CRUD completo
 * - Gestión de precios (solo Líder Comercial+)
 * - Control de acceso por permisos
 * - Geolocalización GPS
 */
import { useState, useEffect, useRef } from 'react';
import { Plus, Users, CheckCircle, MapPin, DollarSign } from 'lucide-react';
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
import { CargoCodes } from '@/constants/permissions';
import { EcoaliadosTable } from '../components/EcoaliadosTable';
import { EcoaliadoForm } from '../components/EcoaliadoForm';
import { CambiarPrecioModal } from '../components/CambiarPrecioModal';
import { HistorialPrecioModal } from '../components/HistorialPrecioModal';
import {
  useEcoaliados,
  useCreateEcoaliado,
  useUpdateEcoaliado,
  useDeleteEcoaliado,
  useToggleEcoaliadoStatus,
  useCambiarPrecio,
  useUnidadesNegocio,
} from '../api/useEcoaliados';
import type {
  Ecoaliado,
  CreateEcoaliadoDTO,
  UpdateEcoaliadoDTO,
  EcoaliadoFilters,
} from '../types/ecoaliado.types';

interface EcoaliadosPageProps {
  /** Modo embebido: oculta el PageHeader y controles cuando se usa dentro de otro componente */
  embedded?: boolean;
  /** Trigger externo para abrir el formulario de nuevo ecoaliado */
  triggerNewForm?: number;
}

export const EcoaliadosPage = ({ embedded = false, triggerNewForm = 0 }: EcoaliadosPageProps) => {
  // Obtener usuario autenticado
  const user = useAuthStore((state) => state.user);
  const lastTriggerRef = useRef(0); // Para evitar abrir modal al cambiar de tab

  // Estado de filtros
  const [filters, setFilters] = useState<EcoaliadoFilters>({
    search: '',
    unidad_negocio: '',
    ciudad: '',
    departamento: '',
    is_active: undefined,
    page: 1,
    page_size: 20,
  });

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isChangePriceModalOpen, setIsChangePriceModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [selectedEcoaliado, setSelectedEcoaliado] = useState<Ecoaliado | null>(null);

  // Queries
  const { data: ecoaliadosData, isLoading: isLoadingEcoaliados } = useEcoaliados(filters);
  const { data: unidadesData } = useUnidadesNegocio();

  // Mutations
  const createMutation = useCreateEcoaliado();
  const updateMutation = useUpdateEcoaliado();
  const deleteMutation = useDeleteEcoaliado();
  const toggleStatusMutation = useToggleEcoaliadoStatus();
  const cambiarPrecioMutation = useCambiarPrecio();

  // Permisos
  const canChangePrecio = [CargoCodes.LIDER_COMERCIAL_ECONORTE, 'gerente', 'superadmin'].includes(
    user?.cargo_code || ''
  );
  const isComercial = user?.cargo_code === CargoCodes.COMERCIAL_ECONORTE;
  const isLiderLogistico = user?.cargo_code === CargoCodes.LIDER_LOGISTICA_ECONORTE;

  // Permisos de gestión (crear, editar, eliminar, desactivar)
  const canManage = !isLiderLogistico; // Líder logístico SOLO puede ver

  // Handlers - Formulario
  const handleOpenForm = (ecoaliado?: Ecoaliado) => {
    setSelectedEcoaliado(ecoaliado || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEcoaliado(null);
  };

  const handleSubmitForm = async (data: CreateEcoaliadoDTO | UpdateEcoaliadoDTO) => {
    try {
      if (selectedEcoaliado) {
        // Actualizar
        await updateMutation.mutateAsync({
          id: selectedEcoaliado.id,
          data: data as UpdateEcoaliadoDTO,
        });
      } else {
        // Crear
        await createMutation.mutateAsync(data as CreateEcoaliadoDTO);
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error al guardar ecoaliado:', error);
    }
  };

  // Handlers - Cambiar Precio
  const handleOpenChangePriceModal = (ecoaliado: Ecoaliado) => {
    setSelectedEcoaliado(ecoaliado);
    setIsChangePriceModalOpen(true);
  };

  const handleCloseChangePriceModal = () => {
    setIsChangePriceModalOpen(false);
    setSelectedEcoaliado(null);
  };

  const handleSubmitChangePrice = async (data: any) => {
    if (!selectedEcoaliado) return;

    try {
      await cambiarPrecioMutation.mutateAsync({
        id: selectedEcoaliado.id,
        data,
      });
      handleCloseChangePriceModal();
    } catch (error) {
      console.error('Error al cambiar precio:', error);
    }
  };

  // Handlers - Historial
  const handleOpenHistorialModal = (ecoaliado: Ecoaliado) => {
    setSelectedEcoaliado(ecoaliado);
    setIsHistorialModalOpen(true);
  };

  const handleCloseHistorialModal = () => {
    setIsHistorialModalOpen(false);
    setSelectedEcoaliado(null);
  };

  // Handlers - Acciones
  const handleDelete = async (ecoaliado: Ecoaliado) => {
    if (
      window.confirm(
        `¿Está seguro de eliminar el ecoaliado "${ecoaliado.razon_social}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(ecoaliado.id);
      } catch (error) {
        console.error('Error al eliminar ecoaliado:', error);
      }
    }
  };

  const handleToggleStatus = async (ecoaliado: Ecoaliado) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: ecoaliado.id,
        is_active: !ecoaliado.is_active,
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  // Handlers - Filtros
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof EcoaliadoFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      unidad_negocio: '',
      ciudad: '',
      departamento: '',
      is_active: undefined,
      page: 1,
      page_size: 20,
    });
  };

  // Efecto para abrir formulario desde trigger externo (EcoNortePage)
  // Solo abre cuando el trigger realmente cambia, no al montar el componente
  useEffect(() => {
    if (triggerNewForm > 0 && triggerNewForm !== lastTriggerRef.current && canManage) {
      lastTriggerRef.current = triggerNewForm;
      handleOpenForm();
    }
  }, [triggerNewForm, canManage]);

  const hasActiveFilters =
    filters.unidad_negocio || filters.ciudad || filters.departamento || filters.is_active !== undefined;

  const unidadesOptions =
    unidadesData?.results.map((unidad) => ({
      value: unidad.id,
      label: unidad.nombre_comercial,
    })) || [];

  // Extraer ciudades y departamentos únicos de los ecoaliados
  const ciudades = Array.from(
    new Set(ecoaliadosData?.results.map((e) => e.ciudad) || [])
  ).map((ciudad) => ({ value: ciudad, label: ciudad }));

  const departamentos = Array.from(
    new Set(ecoaliadosData?.results.map((e) => e.departamento) || [])
  ).map((depto) => ({ value: depto, label: depto }));

  // Calcular estadísticas
  const totalEcoaliados = ecoaliadosData?.count || 0;
  const ecoaliadosActivos = ecoaliadosData?.results.filter((e) => e.is_active).length || 0;
  const ecoaliadosConGPS = ecoaliadosData?.results.filter((e) => e.tiene_geolocalizacion).length || 0;
  const precioPromedio = ecoaliadosData?.results.length
    ? ecoaliadosData.results.reduce((acc, e) => acc + parseFloat(e.precio_compra_kg), 0) /
      ecoaliadosData.results.length
    : 0;

  const activeFiltersCount = [
    filters.unidad_negocio,
    filters.ciudad,
    filters.departamento,
    filters.is_active !== undefined ? 'active' : '',
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* HEADER - Solo visible cuando NO está embebido */}
      {!embedded && (
        <PageHeader
          title="Ecoaliados"
          description="Gestión de proveedores de material reciclable"
          badges={[{ label: `${totalEcoaliados} registros`, variant: 'primary' }]}
          actions={
            canManage ? (
              <Button variant="primary" onClick={() => handleOpenForm()}>
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Ecoaliado
              </Button>
            ) : undefined
          }
        />
      )}

      {/* ESTADÍSTICAS */}
      {ecoaliadosData && (
        <StatsGrid
          stats={[
            {
              label: 'Total Ecoaliados',
              value: totalEcoaliados,
              icon: Users,
              iconColor: 'gray',
            },
            {
              label: 'Activos',
              value: ecoaliadosActivos,
              icon: CheckCircle,
              iconColor: 'success',
            },
            {
              label: 'Con GPS',
              value: ecoaliadosConGPS,
              icon: MapPin,
              iconColor: 'info',
            },
            {
              label: 'Precio Promedio',
              value: `$${precioPromedio.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
              icon: DollarSign,
              iconColor: 'warning',
            },
          ]}
        />
      )}

      {/* FILTROS */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por código o razón social..."
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={4}>
          <Select
            label="Unidad Interna"
            value={filters.unidad_negocio}
            onChange={(e) => handleFilterChange('unidad_negocio', e.target.value)}
            options={[{ value: '', label: 'Todas' }, ...unidadesOptions]}
          />

          <Input
            label="Ciudad"
            value={filters.ciudad}
            onChange={(e) => handleFilterChange('ciudad', e.target.value)}
            placeholder="Buscar ciudad"
          />

          <Input
            label="Departamento"
            value={filters.departamento}
            onChange={(e) => handleFilterChange('departamento', e.target.value)}
            placeholder="Buscar departamento"
          />

          <Select
            label="Estado"
            value={
              filters.is_active === undefined
                ? ''
                : filters.is_active
                ? 'true'
                : 'false'
            }
            onChange={(e) =>
              handleFilterChange(
                'is_active',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
            options={[
              { value: '', label: 'Todos' },
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
            ]}
          />
        </FilterGrid>
      </FilterCard>

      {/* TABLA */}
      <DataTableCard
        pagination={{
          currentPage: filters.page || 1,
          pageSize: filters.page_size || 20,
          totalItems: totalEcoaliados,
          hasPrevious: (filters.page || 1) > 1,
          hasNext: (filters.page || 1) * (filters.page_size || 20) < totalEcoaliados,
          onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
        }}
        isEmpty={(ecoaliadosData?.results || []).length === 0}
        isLoading={isLoadingEcoaliados}
        emptyMessage="No se encontraron ecoaliados"
      >
        <EcoaliadosTable
          ecoaliados={ecoaliadosData?.results || []}
          onEdit={handleOpenForm}
          onDelete={handleDelete}
          onCambiarPrecio={handleOpenChangePriceModal}
          onVerHistorial={handleOpenHistorialModal}
          onToggleStatus={handleToggleStatus}
          canChangePrecio={canChangePrecio}
          canManage={canManage}
          isLoading={isLoadingEcoaliados}
        />
      </DataTableCard>

      {/* MODALES */}
      <EcoaliadoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        ecoaliado={selectedEcoaliado}
        currentUserId={user?.id}
        isComercial={isComercial}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <CambiarPrecioModal
        isOpen={isChangePriceModalOpen}
        onClose={handleCloseChangePriceModal}
        onSubmit={handleSubmitChangePrice}
        ecoaliado={selectedEcoaliado}
        isLoading={cambiarPrecioMutation.isPending}
      />

      <HistorialPrecioModal
        isOpen={isHistorialModalOpen}
        onClose={handleCloseHistorialModal}
        ecoaliado={selectedEcoaliado}
      />
    </div>
  );
};
