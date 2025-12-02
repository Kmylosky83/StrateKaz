import { useState, useMemo } from 'react';
import { UserPlus, Users, CheckCircle, MapPin } from 'lucide-react';
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
import { ProveedoresTable } from '../components/ProveedoresTable';
import { ProveedorForm } from '../components/ProveedorForm';
import { DeleteConfirmModal } from '@/components/users/DeleteConfirmModal';
import {
  useProveedores,
  useCreateProveedor,
  useUpdateProveedor,
  useDeleteProveedor,
  useToggleProveedorStatus,
} from '../hooks/useProveedores';
import { useAuthStore } from '@/store/authStore';
import type {
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  ProveedorFilters,
} from '@/types/proveedores.types';

export default function ProductosServiciosPage() {
  const [filters, setFilters] = useState<ProveedorFilters>({
    search: '',
    tipo_proveedor: 'PRODUCTO_SERVICIO',
    is_active: undefined,
    ciudad: '',
    page: 1,
    page_size: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | undefined>();
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | undefined>();

  const user = useAuthStore((state) => state.user);
  const { data: proveedoresData, isLoading: isLoadingProveedores } = useProveedores(filters);
  const createProveedorMutation = useCreateProveedor();
  const updateProveedorMutation = useUpdateProveedor();
  const deleteProveedorMutation = useDeleteProveedor();
  const toggleStatusMutation = useToggleProveedorStatus();

  // Verificar si el usuario puede crear proveedores
  const canCreateProveedor = useMemo(() => {
    if (!user?.cargo) return false;
    const cargo = user.cargo.code;
    return ['lider_comercial', 'admin', 'gerente', 'superadmin'].includes(cargo);
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
      const submitData = {
        ...data,
        tipo_proveedor: 'PRODUCTO_SERVICIO',
      };

      if (selectedProveedor) {
        await updateProveedorMutation.mutateAsync({
          id: selectedProveedor.id,
          data: submitData as UpdateProveedorDTO,
        });
      } else {
        await createProveedorMutation.mutateAsync(submitData as CreateProveedorDTO);
      }
      handleCloseForm();
    } catch (error: any) {
      console.error('Error submitting form:', error);
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
      tipo_proveedor: 'PRODUCTO_SERVICIO',
      is_active: undefined,
      ciudad: '',
      page: 1,
      page_size: 10,
    });
  };

  const activeFiltersCount = [
    filters.ciudad,
    filters.is_active !== undefined ? 'active' : '',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  const estadoOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' },
  ];

  const proveedores = proveedoresData?.results || [];
  const totalProveedores = proveedoresData?.count || 0;

  // Calcular estadísticas
  const proveedoresActivos = proveedores.filter((p) => p.is_active).length;
  const ciudadesUnicas = new Set(proveedores.map((p) => p.ciudad).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Proveedores de Productos y Servicios"
        description="Gestión de proveedores de insumos, repuestos y servicios"
        actions={
          canCreateProveedor ? (
            <Button onClick={handleOpenCreateForm} leftIcon={<UserPlus className="h-4 w-4" />}>
              Nuevo Proveedor
            </Button>
          ) : undefined
        }
      />

      {/* ESTADÍSTICAS */}
      {proveedoresData && (
        <StatsGrid
          stats={[
            {
              label: 'Total Proveedores',
              value: totalProveedores,
              icon: Users,
              iconColor: 'gray',
            },
            {
              label: 'Activos',
              value: proveedoresActivos,
              icon: CheckCircle,
              iconColor: 'success',
            },
            {
              label: 'Ciudades',
              value: ciudadesUnicas,
              icon: MapPin,
              iconColor: 'info',
            },
          ]}
        />
      )}

      {/* FILTROS */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por nombre, documento, NIT..."
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={3}>
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
          onToggleStatus={handleToggleStatus}
          canChangePrecio={false}
          isLoading={isLoadingProveedores}
          showPrecioColumns={false}
        />
      </DataTableCard>

      {/* MODALES */}
      <ProveedorForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        proveedor={selectedProveedor}
        isLoading={createProveedorMutation.isPending || updateProveedorMutation.isPending}
        tipoProveedorForzado="PRODUCTO_SERVICIO"
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
