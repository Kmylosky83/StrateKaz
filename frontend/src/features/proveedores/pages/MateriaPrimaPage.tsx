import { useState, useMemo } from 'react';
import { UserPlus, Factory, Truck, Users, CheckCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import {
  PageHeader,
  StatsGrid,
  FilterCard,
  FilterGrid,
  DataTableCard,
  PageTabs,
} from '@/components/layout';
import { ProveedoresTable } from '../components/ProveedoresTable';
import { ProveedorForm } from '../components/ProveedorForm';
import { CambiarPrecioModal } from '../components/CambiarPrecioModal';
import { HistorialPrecioModal } from '../components/HistorialPrecioModal';
import { DeleteConfirmModal } from '@/components/users/DeleteConfirmModal';
import {
  useProveedores,
  useCreateProveedor,
  useUpdateProveedor,
  useDeleteProveedor,
  useToggleProveedorStatus,
  useCambiarPrecio,
} from '../hooks/useProveedores';
import { useAuthStore } from '@/store/authStore';
import type {
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  ProveedorFilters,
  CambiarPrecioDTO,
} from '@/types/proveedores.types';

type TabType = 'externos' | 'unidades_internas';

export default function MateriaPrimaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('externos');
  const [filters, setFilters] = useState<ProveedorFilters>({
    search: '',
    tipo_proveedor: 'MATERIA_PRIMA_EXTERNO',
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

  // Queries para conteos en header
  const { data: externosCount } = useProveedores({ tipo_proveedor: 'MATERIA_PRIMA_EXTERNO', page_size: 1 });
  const { data: internosCount } = useProveedores({ tipo_proveedor: 'UNIDAD_NEGOCIO', page_size: 1 });
  const createProveedorMutation = useCreateProveedor();
  const updateProveedorMutation = useUpdateProveedor();
  const deleteProveedorMutation = useDeleteProveedor();
  const toggleStatusMutation = useToggleProveedorStatus();
  const cambiarPrecioMutation = useCambiarPrecio();

  // Cambiar tipo de proveedor según pestaña
  const handleTabChange = (tabId: string) => {
    const tab = tabId as TabType;
    setActiveTab(tab);
    setFilters((prev) => ({
      ...prev,
      tipo_proveedor: tab === 'externos' ? 'MATERIA_PRIMA_EXTERNO' : 'UNIDAD_NEGOCIO',
      page: 1,
    }));
  };

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
    return ['lider_comercial', 'lider_com_econorte', 'lider_log_econorte', 'admin', 'gerente', 'superadmin'].includes(cargo);
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
        tipo_proveedor: activeTab === 'externos' ? 'MATERIA_PRIMA_EXTERNO' : 'UNIDAD_NEGOCIO',
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
      // El modal maneja el cierre internamente cuando todos los precios se guardan exitosamente
      // Si hay error, la Promise es rechazada y el modal muestra feedback
      await cambiarPrecioMutation.mutateAsync({
        id: selectedProveedor.id,
        data,
      });
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
      tipo_proveedor: activeTab === 'externos' ? 'MATERIA_PRIMA_EXTERNO' : 'UNIDAD_NEGOCIO',
      subtipo_materia: '',
      modalidad_logistica: '',
      is_active: undefined,
      ciudad: '',
      page: 1,
      page_size: 10,
    });
  };

  const activeFiltersCount = [
    filters.subtipo_materia,
    filters.modalidad_logistica,
    filters.ciudad,
    filters.is_active !== undefined ? 'active' : '',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

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

  // Calcular estadísticas
  const proveedoresActivos = proveedores.filter((p) => p.is_active).length;
  const totalExternos = externosCount?.count || 0;
  const totalInternos = internosCount?.count || 0;

  // Configuración de tabs
  const tabs = [
    { id: 'externos', label: 'Proveedores Externos', icon: Truck },
    { id: 'unidades_internas', label: 'Unidades Internas', icon: Factory },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER con PageHeader */}
      <PageHeader
        title="Proveedores de Materia Prima"
        description="Gestión de proveedores de sebo, hueso, cabezas y ACU"
        actions={
          canCreateProveedor ? (
            <Button
              onClick={handleOpenCreateForm}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              {activeTab === 'externos' ? 'Nuevo Proveedor Externo' : 'Nueva Unidad Interna'}
            </Button>
          ) : undefined
        }
        tabs={
          <PageTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
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
              label: 'Proveedores Externos',
              value: totalExternos,
              icon: Truck,
              iconColor: 'primary',
            },
            {
              label: 'Unidades Internas',
              value: totalInternos,
              icon: Building2,
              iconColor: 'info',
            },
            {
              label: 'Activos',
              value: proveedoresActivos,
              icon: CheckCircle,
              iconColor: 'success',
            },
          ]}
        />
      )}

      {/* FILTROS con FilterCard */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por nombre, documento..."
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={4}>
          <Select
            label="Tipo de Materia"
            value={filters.subtipo_materia}
            onChange={(e) => handleFilterChange('subtipo_materia', e.target.value)}
            options={subtipoMateriaOptions}
          />

          {activeTab === 'externos' && (
            <Select
              label="Modalidad Logística"
              value={filters.modalidad_logistica}
              onChange={(e) => handleFilterChange('modalidad_logistica', e.target.value)}
              options={modalidadLogisticaOptions}
            />
          )}

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

      {/* TABLA con DataTableCard */}
      <DataTableCard
        pagination={{
          currentPage: filters.page!,
          pageSize: filters.page_size!,
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
        isLoading={createProveedorMutation.isPending || updateProveedorMutation.isPending}
        tipoProveedorForzado={activeTab === 'externos' ? 'MATERIA_PRIMA_EXTERNO' : 'UNIDAD_NEGOCIO'}
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
        title={activeTab === 'externos' ? 'Eliminar Proveedor' : 'Eliminar Unidad Interna'}
        message={`¿Está seguro de que desea eliminar "${proveedorToDelete?.nombre_comercial}"? Esta acción no se puede deshacer.`}
        isLoading={deleteProveedorMutation.isPending}
      />
    </div>
  );
}
