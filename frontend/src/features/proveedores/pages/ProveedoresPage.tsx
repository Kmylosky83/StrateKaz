import { useState, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { PageHeader, FilterCard, FilterGrid, DataTableCard } from '@/components/layout';
import { ProveedoresTable } from '../components/ProveedoresTable';
import { ProveedorForm } from '../components/ProveedorForm';
import { CambiarPrecioModal } from '../components/CambiarPrecioModal';
import { HistorialPrecioModal } from '../components/HistorialPrecioModal';
import { DeleteConfirmModal } from '@/components/users/DeleteConfirmModal';
import {
  useProveedores,
  useUnidadesNegocio,
  useCreateProveedor,
  useUpdateProveedor,
  useDeleteProveedor,
  useToggleProveedorStatus,
  useCambiarPrecio,
} from '../hooks/useProveedores';
import { useAuthStore } from '@/store/authStore';
import { CargoCodes } from '@/constants/permissions';
import type {
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  ProveedorFilters,
  CambiarPrecioDTO,
} from '@/types/proveedores.types';

export default function ProveedoresPage() {
  const [filters, setFilters] = useState<ProveedorFilters>({
    search: '',
    tipo_proveedor: '',
    subtipo_materia: '',
    modalidad_logistica: '',
    is_active: undefined,
    ciudad: '',
    page: 1,
    page_size: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPrecioModalOpen, setIsPrecioModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | undefined>();
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | undefined>();

  const user = useAuthStore((state) => state.user);
  const { data: proveedoresData, isLoading: isLoadingProveedores } = useProveedores(filters);
  const { data: unidadesNegocioData } = useUnidadesNegocio();
  const createProveedorMutation = useCreateProveedor();
  const updateProveedorMutation = useUpdateProveedor();
  const deleteProveedorMutation = useDeleteProveedor();
  const toggleStatusMutation = useToggleProveedorStatus();
  const cambiarPrecioMutation = useCambiarPrecio();

  // Verificar si el usuario puede cambiar precios (Solo Gerente y SuperAdmin)
  const canChangePrecio = useMemo(() => {
    if (!user?.cargo) return false;
    const cargo = user.cargo.code;
    return cargo === 'gerente' || cargo === 'superadmin';
  }, [user]);

  // Verificar si el usuario puede crear proveedores
  const canCreateProveedor = useMemo(() => {
    if (!user?.cargo) return false;
    const cargo = user.cargo.code;
    return [
      'lider_comercial',
      CargoCodes.LIDER_COMERCIAL_ECONORTE,
      CargoCodes.LIDER_LOGISTICA_ECONORTE,
      'admin',
      'gerente',
      'superadmin',
    ].includes(cargo);
  }, [user]);

  const handleOpenCreateForm = () => {
    setSelectedProveedor(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedProveedor(undefined);
  };

  const handleSubmit = async (data: CreateProveedorDTO | UpdateProveedorDTO) => {
    try {
      if (selectedProveedor) {
        await updateProveedorMutation.mutateAsync({
          id: selectedProveedor.id,
          data: data as UpdateProveedorDTO,
        });
      } else {
        await createProveedorMutation.mutateAsync(data as CreateProveedorDTO);
      }
      handleCloseForm();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const handleOpenDeleteModal = (proveedor: Proveedor) => {
    setProveedorToDelete(proveedor);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProveedorToDelete(undefined);
  };

  const handleConfirmDelete = async () => {
    if (proveedorToDelete) {
      try {
        await deleteProveedorMutation.mutateAsync(proveedorToDelete.id);
        handleCloseDeleteModal();
      } catch (error) {
        console.error('Error deleting proveedor:', error);
      }
    }
  };

  const handleToggleStatus = async (proveedor: Proveedor) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: proveedor.id,
        is_active: !proveedor.is_active,
      });
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleOpenPrecioModal = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsPrecioModalOpen(true);
  };

  const handleClosePrecioModal = () => {
    setIsPrecioModalOpen(false);
    setSelectedProveedor(undefined);
  };

  const handleCambiarPrecio = async (data: CambiarPrecioDTO) => {
    if (selectedProveedor) {
      try {
        await cambiarPrecioMutation.mutateAsync({
          id: selectedProveedor.id,
          data,
        });
        handleClosePrecioModal();
      } catch (error) {
        console.error('Error cambiando precio:', error);
      }
    }
  };

  const handleOpenHistorialModal = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsHistorialModalOpen(true);
  };

  const handleCloseHistorialModal = () => {
    setIsHistorialModalOpen(false);
    setSelectedProveedor(undefined);
  };

  const handleFilterChange = (key: keyof ProveedorFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      tipo_proveedor: '',
      subtipo_materia: '',
      modalidad_logistica: '',
      is_active: undefined,
      ciudad: '',
      page: 1,
      page_size: 10,
    });
  };

  const activeFiltersCount = [
    filters.tipo_proveedor,
    filters.subtipo_materia,
    filters.modalidad_logistica,
    filters.ciudad,
    filters.is_active !== undefined ? 'active' : '',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  const tipoProveedorOptions = [
    { value: '', label: 'Todos' },
    { value: 'MATERIA_PRIMA_EXTERNO', label: 'Materia Prima Externa' },
    { value: 'UNIDAD_NEGOCIO', label: 'Unidad Interna' },
    { value: 'PRODUCTO_SERVICIO', label: 'Producto/Servicio' },
  ];

  const subtipoMateriaOptions = [
    { value: '', label: 'Todos' },
    { value: 'SEBO', label: 'Sebo' },
    { value: 'HUESO', label: 'Hueso' },
    { value: 'CABEZAS', label: 'Cabezas' },
    { value: 'ACU', label: 'ACU' },
  ];

  const modalidadLogisticaOptions = [
    { value: '', label: 'Todas' },
    { value: 'ENTREGA_PLANTA', label: 'Entrega en Planta' },
    { value: 'COMPRA_EN_PUNTO', label: 'Compra en Punto' },
  ];

  const estadoOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' },
  ];

  const proveedores = proveedoresData?.results || [];
  const totalProveedores = proveedoresData?.count || 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Gestión de Proveedores"
        description="Administración de todos los proveedores del sistema"
        badges={[{ label: `${totalProveedores} proveedores`, variant: 'primary' }]}
        actions={
          canCreateProveedor ? (
            <Button onClick={handleOpenCreateForm} leftIcon={<UserPlus className="h-4 w-4" />}>
              Nuevo Proveedor
            </Button>
          ) : undefined
        }
      />

      {/* FILTROS */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por nombre, documento..."
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={5}>
          <Select
            label="Tipo de Proveedor"
            value={filters.tipo_proveedor}
            onChange={(e) => handleFilterChange('tipo_proveedor', e.target.value)}
            options={tipoProveedorOptions}
          />

          <Select
            label="Subtipo de Materia"
            value={filters.subtipo_materia}
            onChange={(e) => handleFilterChange('subtipo_materia', e.target.value)}
            options={subtipoMateriaOptions}
          />

          <Select
            label="Modalidad Logística"
            value={filters.modalidad_logistica}
            onChange={(e) => handleFilterChange('modalidad_logistica', e.target.value)}
            options={modalidadLogisticaOptions}
          />

          <Input
            label="Ciudad"
            value={filters.ciudad}
            onChange={(e) => handleFilterChange('ciudad', e.target.value)}
            placeholder="Filtrar por ciudad"
          />

          <Select
            label="Estado"
            value={filters.is_active === undefined ? '' : String(filters.is_active)}
            onChange={(e) =>
              handleFilterChange(
                'is_active',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
            options={estadoOptions}
          />
        </FilterGrid>
      </FilterCard>

      {/* TABLA */}
      <DataTableCard
        pagination={{
          currentPage: filters.page || 1,
          pageSize: filters.page_size || 10,
          totalItems: totalProveedores,
          hasPrevious: !!proveedoresData?.previous,
          hasNext: !!proveedoresData?.next,
          onPageChange: (page) => handleFilterChange('page', page),
        }}
        isEmpty={proveedores.length === 0}
        isLoading={isLoadingProveedores}
        emptyMessage="No se encontraron proveedores"
      >
        <ProveedoresTable
          proveedores={proveedores}
          onEdit={handleOpenEditForm}
          onDelete={handleOpenDeleteModal}
          onCambiarPrecio={handleOpenPrecioModal}
          onVerHistorial={handleOpenHistorialModal}
          onToggleStatus={handleToggleStatus}
          canChangePrecio={canChangePrecio}
          isLoading={isLoadingProveedores}
        />
      </DataTableCard>

      {/* MODALES */}
      <ProveedorForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        proveedor={selectedProveedor}
        unidadesNegocio={unidadesNegocioData?.results || []}
        isLoading={createProveedorMutation.isPending || updateProveedorMutation.isPending}
      />

      <CambiarPrecioModal
        isOpen={isPrecioModalOpen}
        onClose={handleClosePrecioModal}
        onSubmit={handleCambiarPrecio}
        proveedor={selectedProveedor || null}
        isLoading={cambiarPrecioMutation.isPending}
      />

      <HistorialPrecioModal
        isOpen={isHistorialModalOpen}
        onClose={handleCloseHistorialModal}
        proveedor={selectedProveedor || null}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Eliminar Proveedor"
        message={`¿Está seguro de que desea eliminar al proveedor "${proveedorToDelete?.nombre_comercial}"? Esta acción no se puede deshacer.`}
        isLoading={deleteProveedorMutation.isPending}
      />
    </div>
  );
}
