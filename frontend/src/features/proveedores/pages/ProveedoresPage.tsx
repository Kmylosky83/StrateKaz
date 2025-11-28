import { useState, useMemo } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
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
      page: 1, // Reset page when filters change
    }));
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Proveedores</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total: {totalProveedores} proveedor{totalProveedores !== 1 ? 'es' : ''}
          </p>
        </div>
        {canCreateProveedor && (
          <Button
            onClick={handleOpenCreateForm}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {/* FILTROS */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Filtros</h2>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Limpiar Filtros
            </Button>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Buscar"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Nombre, documento..."
                leftIcon={<Search className="h-4 w-4" />}
              />

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
            </div>
          </div>
        </Card>

      {/* TABLA */}
      <Card>
        <div className="p-6">
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

          {/* PAGINACIÓN */}
          {totalProveedores > filters.page_size! && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {((filters.page! - 1) * filters.page_size!) + 1} -{' '}
                {Math.min(filters.page! * filters.page_size!, totalProveedores)} de {totalProveedores}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', filters.page! - 1)}
                  disabled={!proveedoresData?.previous}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', filters.page! + 1)}
                  disabled={!proveedoresData?.next}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

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
