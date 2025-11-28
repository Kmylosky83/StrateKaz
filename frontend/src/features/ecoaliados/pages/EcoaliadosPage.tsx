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
import { useState } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Card } from '@/components/common/Card';
import { useAuthStore } from '@/store/authStore';
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
  useHistorialPrecios,
  useUnidadesNegocio,
} from '../api/useEcoaliados';
import type {
  Ecoaliado,
  CreateEcoaliadoDTO,
  UpdateEcoaliadoDTO,
  EcoaliadoFilters,
} from '../types/ecoaliado.types';

export const EcoaliadosPage = () => {
  // Obtener usuario autenticado
  const user = useAuthStore((state) => state.user);

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

  const [showFilters, setShowFilters] = useState(false);

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

  // Historial de precios query (solo se carga cuando se abre el modal)
  const { data: historialData, isLoading: isLoadingHistorial } = useHistorialPrecios(
    selectedEcoaliado?.id || 0
  );

  // Permisos
  const canChangePrecio = ['lider_com_econorte', 'gerente', 'superadmin'].includes(
    user?.cargo_code || ''
  );
  const isComercial = user?.cargo_code === 'comercial_econorte';
  const isLiderLogistico = user?.cargo_code === 'lider_log_econorte';

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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Ecoaliados</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de proveedores de material reciclable
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Ecoaliado
          </Button>
        )}
      </div>

      {/* FILTROS */}
      <Card>
        <div className="space-y-4">
          {/* Buscador Principal */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por código o razón social..."
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
                  {Object.values({
                    unidad: filters.unidad_negocio,
                    ciudad: filters.ciudad,
                    depto: filters.departamento,
                    estado: filters.is_active,
                  }).filter(Boolean).length}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  label="Unidad Interna"
                  value={filters.unidad_negocio}
                  onChange={(e) => handleFilterChange('unidad_negocio', e.target.value)}
                  options={[{ value: '', label: 'Todas' }, ...unidadesOptions]}
                  placeholder="Seleccionar"
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
                  placeholder="Seleccionar"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ESTADÍSTICAS */}
      {ecoaliadosData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Ecoaliados</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {ecoaliadosData.count}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 dark:text-gray-400">Activos</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {ecoaliadosData.results.filter((e) => e.is_active).length}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 dark:text-gray-400">Con GPS</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {ecoaliadosData.results.filter((e) => e.tiene_geolocalizacion).length}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 dark:text-gray-400">Precio Promedio</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
              $
              {ecoaliadosData.results.length > 0
                ? (
                    ecoaliadosData.results.reduce(
                      (acc, e) => acc + parseFloat(e.precio_compra_kg),
                      0
                    ) / ecoaliadosData.results.length
                  ).toLocaleString('es-CO', { maximumFractionDigits: 0 })
                : 0}
            </div>
          </Card>
        </div>
      )}

      {/* TABLA */}
      <Card>
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
      </Card>

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
        ecoaliado={
          selectedEcoaliado
            ? {
                razon_social: selectedEcoaliado.razon_social,
                codigo: selectedEcoaliado.codigo,
              }
            : null
        }
        precioActual={historialData?.precio_actual || '0'}
        historial={historialData?.historial || []}
        isLoading={isLoadingHistorial}
      />
    </div>
  );
};
