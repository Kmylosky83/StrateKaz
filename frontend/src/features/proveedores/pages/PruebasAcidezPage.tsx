import { useState, useMemo } from 'react';
import { FlaskConical, Plus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Badge } from '@/components/common/Badge';
import {
  PageHeader,
  FilterCard,
  FilterGrid,
  DataTableCard,
} from '@/components/layout';
import { PruebasAcidezTable } from '../components/PruebasAcidezTable';
import { PruebaAcidezForm } from '../components/PruebaAcidezForm';
import { VoucherAcidezModal } from '../components/VoucherAcidezModal';
import { DeleteConfirmModal } from '@/components/users/DeleteConfirmModal';
import {
  useProveedores,
  usePruebasAcidez,
  useDeletePruebaAcidez,
  useEstadisticasAcidez,
} from '../hooks/useProveedores';
import { useAuthStore } from '@/store/authStore';
import type {
  PruebaAcidez,
  PruebaAcidezFilters,
  CalidadSebo,
} from '@/types/proveedores.types';

// Colores por calidad
const CALIDAD_CONFIG: Record<
  CalidadSebo,
  { bg: string; text: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'gray' }
> = {
  A: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', variant: 'success' },
  B: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', variant: 'info' },
  B1: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', variant: 'warning' },
  B2: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', variant: 'warning' },
  B4: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', variant: 'danger' },
  C: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', variant: 'gray' },
};

export default function PruebasAcidezPage() {
  const [filters, setFilters] = useState<PruebaAcidezFilters>({
    search: '',
    proveedor: '',
    calidad_resultante: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [pruebaToDelete, setPruebaToDelete] = useState<PruebaAcidez | undefined>();
  const [pruebaForVoucher, setPruebaForVoucher] = useState<PruebaAcidez | null>(null);

  const user = useAuthStore((state) => state.user);

  // Cargar proveedores de SEBO para el filtro y formulario
  const { data: proveedoresData } = useProveedores({
    tipo_proveedor: 'MATERIA_PRIMA_EXTERNO',
    subtipo_materia: 'SEBO',
    is_active: true,
    page_size: 100,
  });

  // También cargar unidades internas con sebo
  const { data: unidadesInternasData } = useProveedores({
    tipo_proveedor: 'UNIDAD_NEGOCIO',
    subtipo_materia: 'SEBO',
    is_active: true,
    page_size: 100,
  });

  const { data: pruebasData, isLoading: isLoadingPruebas } = usePruebasAcidez(filters);
  const { data: estadisticas } = useEstadisticasAcidez({
    fecha_desde: filters.fecha_desde || undefined,
    fecha_hasta: filters.fecha_hasta || undefined,
  });
  const deletePruebaMutation = useDeletePruebaAcidez();

  // Combinar proveedores externos y unidades internas
  const allProveedoresSebo = useMemo(() => {
    const externos = proveedoresData?.results || [];
    const internos = unidadesInternasData?.results || [];
    return [...externos, ...internos];
  }, [proveedoresData, unidadesInternasData]);

  // Verificar si el usuario puede registrar pruebas
  const canCreatePrueba = useMemo(() => {
    if (!user?.cargo) return false;
    const cargo = user.cargo.code;
    return ['lider_calidad', 'operador_bascula', 'admin', 'gerente', 'superadmin'].includes(cargo);
  }, [user]);

  // Verificar si el usuario puede eliminar pruebas
  const canDeletePrueba = useMemo(() => {
    if (!user?.cargo) return false;
    const cargo = user.cargo.code;
    return ['lider_calidad', 'admin', 'gerente', 'superadmin'].includes(cargo);
  }, [user]);

  const handleOpenCreateForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSuccess = () => {
    // El hook ya refresca los datos
  };

  const handleOpenDeleteModal = (prueba: PruebaAcidez) => {
    setPruebaToDelete(prueba);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setPruebaToDelete(undefined);
  };

  const handleConfirmDelete = async () => {
    if (pruebaToDelete) {
      try {
        await deletePruebaMutation.mutateAsync(pruebaToDelete.id);
        handleCloseDeleteModal();
      } catch (error) {
        console.error('Error deleting prueba:', error);
      }
    }
  };

  const handleGenerarVoucher = (prueba: PruebaAcidez) => {
    setPruebaForVoucher(prueba);
    setIsVoucherModalOpen(true);
  };

  const handleCloseVoucherModal = () => {
    setIsVoucherModalOpen(false);
    setPruebaForVoucher(null);
  };

  const handleFilterChange = (key: keyof PruebaAcidezFilters, value: any) => {
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
      proveedor: '',
      calidad_resultante: '',
      fecha_desde: '',
      fecha_hasta: '',
      page: 1,
      page_size: 10,
    });
  };

  const activeFiltersCount = [
    filters.proveedor,
    filters.calidad_resultante,
    filters.fecha_desde,
    filters.fecha_hasta,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  // Opciones para el filtro de proveedor
  const proveedorOptions = [
    { value: '', label: 'Todos los proveedores' },
    ...allProveedoresSebo.map((p) => ({
      value: String(p.id),
      label: `${p.nombre_comercial} (${p.numero_documento})`,
    })),
  ];

  // Opciones para el filtro de calidad
  const calidadOptions = [
    { value: '', label: 'Todas las calidades' },
    { value: 'A', label: 'Calidad A (< 3%)' },
    { value: 'B', label: 'Calidad B (3-5%)' },
    { value: 'B1', label: 'Calidad B1 (5-8%)' },
    { value: 'B2', label: 'Calidad B2 (8-12%)' },
    { value: 'B4', label: 'Calidad B4 (12-15%)' },
    { value: 'C', label: 'Calidad C (> 15%)' },
  ];

  const pruebas = pruebasData?.results || [];
  const totalPruebas = pruebasData?.count || 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Pruebas de Acidez"
        description="Registro y seguimiento de pruebas de acidez para sebo"
        badges={[{ label: `${totalPruebas} pruebas`, variant: 'primary' }]}
        actions={
          canCreatePrueba ? (
            <Button onClick={handleOpenCreateForm} leftIcon={<Plus className="h-4 w-4" />}>
              Registrar Prueba
            </Button>
          ) : undefined
        }
      />

      {/* ESTADÍSTICAS */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarjeta de Totales */}
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border-primary-200 dark:border-primary-800">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                    Total Pruebas
                  </p>
                  <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                    {estadisticas.totales.total_pruebas}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary-500" />
              </div>
              {estadisticas.totales.total_kg && (
                <p className="text-xs text-primary-700 dark:text-primary-300 mt-2">
                  {parseFloat(estadisticas.totales.total_kg).toLocaleString('es-CO')} kg procesados
                </p>
              )}
            </div>
          </Card>

          {/* Tarjetas por calidad - Top 3 */}
          {estadisticas.por_calidad.slice(0, 3).map((stat) => {
            const config = CALIDAD_CONFIG[stat.calidad_resultante];
            return (
              <Card
                key={stat.calidad_resultante}
                className={`${config.bg} border-2`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${config.text}`}>
                        Calidad {stat.calidad_resultante}
                      </p>
                      <p className={`text-2xl font-bold ${config.text}`}>
                        {stat.cantidad}
                      </p>
                    </div>
                    <Badge variant={config.variant} size="lg">
                      {stat.calidad_resultante}
                    </Badge>
                  </div>
                  {stat.total_valor && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      ${parseFloat(stat.total_valor).toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* FILTROS */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por voucher, proveedor..."
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={4}>
          <Select
            label="Proveedor"
            value={String(filters.proveedor || '')}
            onChange={(e) => handleFilterChange('proveedor', e.target.value ? Number(e.target.value) : '')}
            options={proveedorOptions}
          />

          <Select
            label="Calidad"
            value={filters.calidad_resultante || ''}
            onChange={(e) => handleFilterChange('calidad_resultante', e.target.value)}
            options={calidadOptions}
          />

          <Input
            label="Fecha Desde"
            type="date"
            value={filters.fecha_desde}
            onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
          />

          <Input
            label="Fecha Hasta"
            type="date"
            value={filters.fecha_hasta}
            onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
          />
        </FilterGrid>
      </FilterCard>

      {/* TABLA */}
      <DataTableCard
        pagination={{
          currentPage: filters.page || 1,
          pageSize: filters.page_size || 10,
          totalItems: totalPruebas,
          hasPrevious: !!pruebasData?.previous,
          hasNext: !!pruebasData?.next,
          onPageChange: (page) => handleFilterChange('page', page),
        }}
        isEmpty={pruebas.length === 0}
        isLoading={isLoadingPruebas}
        emptyMessage="No se encontraron pruebas de acidez"
      >
        <PruebasAcidezTable
          pruebas={pruebas}
          onDelete={canDeletePrueba ? handleOpenDeleteModal : undefined}
          onGenerarVoucher={handleGenerarVoucher}
          isLoading={isLoadingPruebas}
          showProveedorColumn={true}
        />
      </DataTableCard>

      {/* MODALES */}
      <PruebaAcidezForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSuccess={handleSuccess}
        proveedores={allProveedoresSebo}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Eliminar Prueba de Acidez"
        message={`¿Está seguro de que desea eliminar la prueba ${pruebaToDelete?.codigo_voucher}? Esta acción no se puede deshacer.`}
        isLoading={deletePruebaMutation.isPending}
      />

      <VoucherAcidezModal
        isOpen={isVoucherModalOpen}
        onClose={handleCloseVoucherModal}
        prueba={pruebaForVoucher}
      />
    </div>
  );
}
