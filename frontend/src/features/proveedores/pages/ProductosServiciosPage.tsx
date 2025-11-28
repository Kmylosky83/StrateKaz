import { useState, useMemo } from 'react';
import { UserPlus, Search, Package, Wrench, FileCheck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Proveedores de Productos y Servicios
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestión de proveedores de insumos, repuestos y servicios
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

      {/* ACCIONES RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Productos</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Insumos y repuestos</p>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Wrench className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Servicios</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mantenimiento, logística</p>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Selección ISO</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Evaluación de proveedores</p>
            </div>
          </div>
        </Card>
      </div>

      {/* INFO */}
      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 dark:text-amber-100">Proveedores de Productos y Servicios</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Proveedores de insumos, repuestos, servicios y otros suministros no relacionados con materia prima.
                Total: {totalProveedores} proveedor{totalProveedores !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* FILTROS */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Filtros</h2>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Limpiar Filtros
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Buscar"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Nombre, documento, NIT..."
              leftIcon={<Search className="h-4 w-4" />}
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
            onToggleStatus={handleToggleStatus}
            canChangePrecio={false}
            isLoading={isLoadingProveedores}
            showPrecioColumns={false}
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
        unidadesNegocio={[]}
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
