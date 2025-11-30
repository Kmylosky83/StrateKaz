import { useState, useMemo } from 'react';
import { UserPlus, Search, Factory, Truck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
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
  const { data: unidadesNegocioData } = useUnidadesNegocio();

  // Queries para conteos en header
  const { data: externosCount } = useProveedores({ tipo_proveedor: 'MATERIA_PRIMA_EXTERNO', page_size: 1 });
  const { data: internosCount } = useProveedores({ tipo_proveedor: 'UNIDAD_NEGOCIO', page_size: 1 });
  const createProveedorMutation = useCreateProveedor();
  const updateProveedorMutation = useUpdateProveedor();
  const deleteProveedorMutation = useDeleteProveedor();
  const toggleStatusMutation = useToggleProveedorStatus();
  const cambiarPrecioMutation = useCambiarPrecio();

  // Cambiar tipo de proveedor según pestaña
  const handleTabChange = (tab: TabType) => {
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
      // Forzar el tipo de proveedor según la pestaña activa
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Proveedores de Materia Prima
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                {externosCount?.count ?? 0} externos
              </Badge>
              <Badge variant="info" size="sm">
                {internosCount?.count ?? 0} internos
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestión de proveedores de sebo, hueso, cabezas y ACU
          </p>
        </div>
        {canCreateProveedor && (
          <Button
            onClick={handleOpenCreateForm}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            {activeTab === 'externos' ? 'Nuevo Proveedor Externo' : 'Nueva Unidad Interna'}
          </Button>
        )}
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('externos')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'externos'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <Truck className="h-5 w-5" />
            Proveedores Externos
          </button>
          <button
            onClick={() => handleTabChange('unidades_internas')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'unidades_internas'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <Factory className="h-5 w-5" />
            Unidades Internas
          </button>
        </nav>
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
