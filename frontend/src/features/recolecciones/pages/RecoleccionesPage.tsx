/**
 * Pagina Principal del Modulo Recolecciones
 *
 * Caracteristicas:
 * - Lista de recolecciones con filtros
 * - Estadisticas en tiempo real
 * - Registro de nuevas recolecciones
 * - Visualizacion e impresion de vouchers
 * - Control de acceso por permisos
 */
import { useState, useEffect } from 'react';
import {
  Plus,
  Receipt,
  Scale,
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Card } from '@/components/common/Card';
import { formatCurrency } from '@/utils/formatters';
import {
  PageHeader,
  StatsGrid,
  FilterCard,
  FilterGrid,
  DataTableCard,
} from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { RecoleccionesTable } from '../components/RecoleccionesTable';
import { RegistrarRecoleccionModal } from '../components/RegistrarRecoleccionModal';
import { VoucherModal } from '../components/VoucherModal';
import {
  useRecolecciones,
  useEstadisticasRecolecciones,
  useProgramacionesEnRuta,
  useRegistrarRecoleccion,
} from '../api/useRecolecciones';
import type {
  Recoleccion,
  RecoleccionFilters,
  ProgramacionEnRuta,
  RegistrarRecoleccionDTO,
} from '../types/recoleccion.types';

interface RecoleccionesPageProps {
  /** Modo embebido: oculta el PageHeader y controles cuando se usa dentro de otro componente */
  embedded?: boolean;
  /** Trigger externo para abrir el modal de registrar recolección */
  triggerNewForm?: number;
}

export const RecoleccionesPage = ({ embedded = false, triggerNewForm = 0 }: RecoleccionesPageProps) => {
  // Usuario autenticado
  const user = useAuthStore((state) => state.user);

  // Estado de filtros
  const [filters, setFilters] = useState<RecoleccionFilters>({
    search: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 20,
  });

  // Modales
  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [selectedProgramacion, setSelectedProgramacion] = useState<ProgramacionEnRuta | null>(null);
  const [selectedRecoleccionId, setSelectedRecoleccionId] = useState<number | null>(null);

  // Queries
  const { data: recoleccionesData, isLoading: isLoadingRecolecciones } = useRecolecciones(filters);
  const { data: estadisticasData } = useEstadisticasRecolecciones(
    filters.fecha_desde || undefined,
    filters.fecha_hasta || undefined
  );
  const { data: programacionesEnRuta } = useProgramacionesEnRuta();

  // Mutations
  const registrarMutation = useRegistrarRecoleccion();

  // Permisos
  const canRegistrar = [
    'recolector_econorte',
    'lider_log_econorte',
    'gerente',
    'superadmin',
    'coordinador_recoleccion',
  ].includes(user?.cargo_code || '');

  const canVerTodas = [
    'lider_log_econorte',
    'lider_com_econorte',
    'gerente',
    'superadmin',
    'coordinador_recoleccion',
  ].includes(user?.cargo_code || '');

  // Handlers - Registrar Recoleccion
  const handleOpenRegistrar = (programacion?: ProgramacionEnRuta) => {
    if (programacion) {
      setSelectedProgramacion(programacion);
    } else if (programacionesEnRuta?.results && programacionesEnRuta.results.length > 0) {
      setSelectedProgramacion(programacionesEnRuta.results[0]);
    }
    setIsRegistrarOpen(true);
  };

  const handleCloseRegistrar = () => {
    setIsRegistrarOpen(false);
    setSelectedProgramacion(null);
  };

  const handleSubmitRegistrar = async (data: RegistrarRecoleccionDTO) => {
    try {
      const response = await registrarMutation.mutateAsync(data);
      handleCloseRegistrar();
      // Abrir el voucher modal para que el usuario pueda imprimirlo
      setTimeout(() => {
        setSelectedRecoleccionId(response.recoleccion.id);
        setIsVoucherOpen(true);
      }, 300);
    } catch (error) {
      console.error('Error al registrar recoleccion:', error);
    }
  };

  // Handlers - Ver Voucher
  const handleVerVoucher = (recoleccion: Recoleccion) => {
    setSelectedRecoleccionId(recoleccion.id);
    setIsVoucherOpen(true);
  };

  const handleCloseVoucher = () => {
    setIsVoucherOpen(false);
    setSelectedRecoleccionId(null);
  };

  const handleReimprimir = (recoleccion: Recoleccion) => {
    setSelectedRecoleccionId(recoleccion.id);
    setIsVoucherOpen(true);
  };

  // Handlers - Filtros
  const handleFilterChange = (key: keyof RecoleccionFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      fecha_desde: '',
      fecha_hasta: '',
      page: 1,
      page_size: 20,
    });
  };

  // Efecto para abrir modal desde trigger externo (EcoNortePage)
  useEffect(() => {
    if (triggerNewForm > 0 && canRegistrar && programacionesEnRuta?.results?.length) {
      handleOpenRegistrar();
    }
  }, [triggerNewForm, canRegistrar, programacionesEnRuta?.results?.length]);

  const activeFiltersCount = [filters.fecha_desde, filters.fecha_hasta].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0;

  // Datos
  const recolecciones = recoleccionesData?.results || [];
  const totalRecolecciones = recoleccionesData?.count || 0;

  return (
    <div className="space-y-6">
      {/* HEADER - Solo visible cuando NO está embebido */}
      {!embedded && (
        <PageHeader
          title="Recolecciones"
          description="Registro y seguimiento de recolecciones de material"
          actions={
            canRegistrar && programacionesEnRuta?.results && programacionesEnRuta.results.length > 0 ? (
              <Button variant="primary" onClick={() => handleOpenRegistrar()}>
                <Plus className="h-5 w-5 mr-2" />
                Registrar Recoleccion
              </Button>
            ) : undefined
          }
        />
      )}

      {/* PROGRAMACIONES EN RUTA (para recolectores) */}
      {canRegistrar && programacionesEnRuta?.results && programacionesEnRuta.results.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Programaciones Listas para Registrar ({programacionesEnRuta.count})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programacionesEnRuta.results.slice(0, 6).map((prog) => (
                <div
                  key={prog.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer"
                  onClick={() => handleOpenRegistrar(prog)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {prog.ecoaliado_codigo}
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                      EN RUTA
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {prog.ecoaliado_razon_social}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                    {prog.ecoaliado_direccion} - {prog.ecoaliado_ciudad}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {formatCurrency(prog.precio_kg)}/kg
                    </span>
                    {prog.cantidad_estimada_kg && (
                      <span className="text-xs text-gray-500">
                        Est: {prog.cantidad_estimada_kg.toLocaleString('es-CO')} kg
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {programacionesEnRuta.results.length > 6 && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">
                  +{programacionesEnRuta.results.length - 6} programaciones mas
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ESTADISTICAS */}
      {estadisticasData && (
        <StatsGrid
          stats={[
            {
              label: 'Total Recolecciones',
              value: estadisticasData.total_recolecciones.toLocaleString('es-CO'),
              icon: Receipt,
              iconColor: 'gray',
              description: `Hoy: ${estadisticasData.recolecciones_hoy}`,
            },
            {
              label: 'Total Kilogramos',
              value: estadisticasData.total_kg_recolectados.toLocaleString('es-CO'),
              icon: Scale,
              iconColor: 'info',
              description: `Prom: ${estadisticasData.promedio_kg_por_recoleccion.toLocaleString('es-CO')} kg`,
            },
            {
              label: 'Total Pagado',
              value: formatCurrency(estadisticasData.total_valor_pagado),
              icon: DollarSign,
              iconColor: 'success',
              description: `Prom: ${formatCurrency(estadisticasData.promedio_valor_por_recoleccion)}`,
            },
            {
              label: 'Esta Semana',
              value: estadisticasData.recolecciones_semana.toLocaleString('es-CO'),
              icon: TrendingUp,
              iconColor: 'warning',
              description: `Este mes: ${estadisticasData.recolecciones_mes}`,
            },
          ]}
        />
      )}

      {/* FILTROS */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por codigo voucher, ecoaliado..."
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange('search', value)}
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={3}>
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

      {/* TABLA DE RECOLECCIONES */}
      <DataTableCard
        pagination={{
          currentPage: filters.page || 1,
          pageSize: filters.page_size || 20,
          totalItems: totalRecolecciones,
          hasPrevious: (filters.page || 1) > 1,
          hasNext: (filters.page || 1) * (filters.page_size || 20) < totalRecolecciones,
          onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
        }}
        isEmpty={recolecciones.length === 0}
        isLoading={isLoadingRecolecciones}
        emptyMessage="No se encontraron recolecciones"
      >
        <RecoleccionesTable
          recolecciones={recolecciones}
          onVerVoucher={handleVerVoucher}
          onReimprimir={handleReimprimir}
          isLoading={isLoadingRecolecciones}
        />
      </DataTableCard>

      {/* MODALES */}
      <RegistrarRecoleccionModal
        isOpen={isRegistrarOpen}
        onClose={handleCloseRegistrar}
        onSubmit={handleSubmitRegistrar}
        programacion={selectedProgramacion}
        isLoading={registrarMutation.isPending}
      />

      <VoucherModal
        isOpen={isVoucherOpen}
        onClose={handleCloseVoucher}
        recoleccionId={selectedRecoleccionId}
      />
    </div>
  );
};
