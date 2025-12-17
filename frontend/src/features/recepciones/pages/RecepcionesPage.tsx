/**
 * Pagina Principal del Modulo Recepciones
 *
 * Gestión de recepciones de materia prima en planta:
 * - Iniciar recepción (agrupar recolecciones de un recolector)
 * - Registrar pesaje en báscula (calcular merma)
 * - Confirmar recepción (prorratear merma entre recolecciones)
 * - Cancelar recepción
 *
 * Flujo completo:
 * 1. INICIADA: Se agrupan recolecciones de un recolector
 * 2. PESADA: Se registra peso real en báscula y se calcula merma
 * 3. CONFIRMADA: Se prorratean mermas y se actualizan recolecciones
 * 4. CANCELADA: Se cancela la recepción (solo si no está confirmada)
 */
import { useState, useRef, useEffect } from 'react';
import {
  Scale,
  Package,
  TrendingDown,
  Plus,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Badge } from '@/components/common/Badge';
import {
  PageHeader,
  StatsGrid,
  FilterCard,
  FilterGrid,
  DataTableCard,
} from '@/components/layout';
import { formatPercentage } from '@/utils/formatters';
import { formatFechaLocal } from '@/utils/dateUtils';
import { useAuthStore } from '@/store/authStore';
import { CargoCodes } from '@/constants/permissions';
import { useUsers } from '@/features/users/hooks/useUsers';
import {
  useRecepciones,
  useRecepcion,
  useEstadisticasRecepciones,
} from '../api/useRecepciones';
import type {
  Recepcion,
  RecepcionFilters,
  EstadoRecepcion,
} from '../types/recepcion.types';

// Componentes de modal especializados (Design System)
import { IniciarRecepcionModal } from '../components/IniciarRecepcionModal';
import { RegistrarPesajeModal } from '../components/RegistrarPesajeModal';
import { ConfirmarRecepcionModal } from '../components/ConfirmarRecepcionModal';
import { CancelarRecepcionModal } from '../components/CancelarRecepcionModal';
import { RecepcionDetailModal } from '../components/RecepcionDetailModal';

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'INICIADA', label: 'Iniciada' },
  { value: 'PESADA', label: 'Pesada' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

interface RecepcionesPageProps {
  /** Modo embebido: oculta el PageHeader cuando se usa dentro de otro componente */
  embedded?: boolean;
  /** Trigger externo para abrir el modal de nueva recepción */
  triggerNewForm?: number;
}

export const RecepcionesPage = ({ embedded = false, triggerNewForm = 0 }: RecepcionesPageProps) => {
  const user = useAuthStore((state) => state.user);
  const lastTriggerRef = useRef(0);

  // Estado de filtros
  const [filters, setFilters] = useState<RecepcionFilters>({
    search: '',
    estado: undefined,
    recolector: undefined,
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 20,
  });

  // Estado de modales - simplificado usando componentes externos
  const [selectedRecepcionId, setSelectedRecepcionId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isIniciarModalOpen, setIsIniciarModalOpen] = useState(false);
  const [isPesarModalOpen, setIsPesarModalOpen] = useState(false);
  const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false);
  const [isCancelarModalOpen, setIsCancelarModalOpen] = useState(false);

  // Queries
  const { data: recepcionesData, isLoading, refetch } = useRecepciones(filters);
  const { data: recepcionDetalle } = useRecepcion(selectedRecepcionId);
  const { data: estadisticas } = useEstadisticasRecepciones(
    filters.fecha_desde,
    filters.fecha_hasta
  );
  const { data: usersData } = useUsers({ cargo__code: CargoCodes.RECOLECTOR_ECONORTE, page_size: 1000 });

  // Permisos
  const canInitiate = [
    CargoCodes.LIDER_LOGISTICA_ECONORTE,
    'gerente',
    'superadmin',
  ].includes(user?.cargo_code || '');

  const canWeigh = [
    CargoCodes.LIDER_LOGISTICA_ECONORTE,
    'gerente',
    'superadmin',
  ].includes(user?.cargo_code || '');

  const canConfirm = [
    CargoCodes.LIDER_LOGISTICA_ECONORTE,
    'gerente',
    'superadmin',
  ].includes(user?.cargo_code || '');

  const canCancel = [
    CargoCodes.LIDER_LOGISTICA_ECONORTE,
    'gerente',
    'superadmin',
  ].includes(user?.cargo_code || '');

  // Efecto para abrir modal desde trigger externo
  useEffect(() => {
    if (triggerNewForm > 0 && triggerNewForm !== lastTriggerRef.current && canInitiate) {
      lastTriggerRef.current = triggerNewForm;
      setIsIniciarModalOpen(true);
    }
  }, [triggerNewForm, canInitiate]);

  // Handlers - Filtros
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof RecepcionFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      estado: undefined,
      recolector: undefined,
      fecha_desde: '',
      fecha_hasta: '',
      page: 1,
      page_size: 20,
    });
  };

  // Handlers - Modales
  const handleVerDetalle = (recepcion: Recepcion) => {
    setSelectedRecepcionId(recepcion.id);
    setIsDetailModalOpen(true);
  };

  const handleOpenPesarModal = (recepcion: Recepcion) => {
    setSelectedRecepcionId(recepcion.id);
    setIsPesarModalOpen(true);
  };

  const handleOpenConfirmarModal = (recepcion: Recepcion) => {
    setSelectedRecepcionId(recepcion.id);
    setIsConfirmarModalOpen(true);
  };

  const handleOpenCancelarModal = (recepcion: Recepcion) => {
    setSelectedRecepcionId(recepcion.id);
    setIsCancelarModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setIsPesarModalOpen(false);
    setIsConfirmarModalOpen(false);
    setIsCancelarModalOpen(false);
    setSelectedRecepcionId(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  // Helpers
  const getEstadoBadgeVariant = (estado: EstadoRecepcion): 'primary' | 'info' | 'success' | 'danger' | 'warning' | 'gray' => {
    const variants: Record<EstadoRecepcion, 'primary' | 'info' | 'success' | 'danger' | 'warning' | 'gray'> = {
      INICIADA: 'info',
      PESADA: 'warning',
      CONFIRMADA: 'success',
      CANCELADA: 'danger',
    };
    return variants[estado] || 'gray';
  };

  // Datos
  const recepciones = recepcionesData?.results || [];
  const totalRecepciones = recepcionesData?.count || 0;
  const recolectores = usersData?.results || [];

  // Opciones de recolectores para filtro
  const recolectoresOptions = [
    { value: '', label: 'Todos los recolectores' },
    ...recolectores.map((r) => ({
      value: String(r.id),
      label: r.full_name,
    })),
  ];

  const hasActiveFilters = filters.estado || filters.recolector || filters.fecha_desde || filters.fecha_hasta;
  const activeFiltersCount = [filters.estado, filters.recolector, filters.fecha_desde, filters.fecha_hasta].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      {!embedded && (
        <PageHeader
          title="Recepción de Materia Prima"
          description="Gestión de recepciones en planta"
          actions={
            canInitiate && (
              <Button variant="primary" onClick={() => setIsIniciarModalOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Nueva Recepción
              </Button>
            )
          }
        />
      )}

      {/* ESTADÍSTICAS */}
      <StatsGrid
        stats={[
          {
            label: 'Pendientes de Pesaje',
            value: estadisticas?.recepciones_por_estado?.INICIADA ?? 0,
            icon: Package,
            iconColor: 'info',
            description: 'Estado: Iniciada',
          },
          {
            label: 'Pesadas',
            value: estadisticas?.recepciones_por_estado?.PESADA ?? 0,
            icon: Scale,
            iconColor: 'warning',
            description: 'Pendientes de confirmar',
          },
          {
            label: 'Confirmadas Hoy',
            value: estadisticas?.recepciones_hoy ?? 0,
            icon: CheckCircle,
            iconColor: 'success',
            description: `Total: ${estadisticas?.recepciones_por_estado?.CONFIRMADA ?? 0}`,
          },
          {
            label: 'Merma Promedio',
            value: formatPercentage(estadisticas?.porcentaje_merma_promedio ?? 0),
            icon: TrendingDown,
            iconColor: 'danger',
            description: `${(estadisticas?.merma_total_kg ?? 0).toLocaleString('es-CO')} kg totales`,
          },
        ]}
      />

      {/* FILTROS */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por código de recepción..."
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={!!hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={4}>
          <Select
            label="Estado"
            value={filters.estado || ''}
            onChange={(e) => handleFilterChange('estado', e.target.value as EstadoRecepcion)}
            options={ESTADO_OPTIONS}
          />

          <Select
            label="Recolector"
            value={String(filters.recolector || '')}
            onChange={(e) => handleFilterChange('recolector', e.target.value ? Number(e.target.value) : '')}
            options={recolectoresOptions}
          />

          <Input
            label="Fecha desde"
            type="date"
            value={filters.fecha_desde || ''}
            onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
          />

          <Input
            label="Fecha hasta"
            type="date"
            value={filters.fecha_hasta || ''}
            onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
          />
        </FilterGrid>
      </FilterCard>

      {/* TABLA */}
      <DataTableCard
        pagination={{
          currentPage: filters.page || 1,
          pageSize: filters.page_size || 20,
          totalItems: totalRecepciones,
          hasPrevious: (filters.page || 1) > 1,
          hasNext: (filters.page || 1) * (filters.page_size || 20) < totalRecepciones,
          onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
        }}
        isEmpty={recepciones.length === 0}
        isLoading={isLoading}
        emptyMessage="No se encontraron recepciones"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recolector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recolecciones
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kg Esperados
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kg Reales
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Merma %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recepciones.map((recepcion) => (
                <tr
                  key={recepcion.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleVerDetalle(recepcion)}
                >
                  {/* Código */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-medium text-primary-600 dark:text-primary-400">
                      {recepcion.codigo_recepcion}
                    </span>
                  </td>

                  {/* Recolector */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {recepcion.recolector_nombre || '-'}
                    </span>
                  </td>

                  {/* Fecha */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFechaLocal(recepcion.fecha_recepcion.split('T')[0])}
                    </span>
                  </td>

                  {/* Recolecciones */}
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {recepcion.cantidad_recolecciones}
                    </span>
                  </td>

                  {/* Kg Esperados */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {Number(recepcion.peso_esperado_kg).toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Kg Reales */}
                  <td className="px-6 py-4 text-right">
                    {recepcion.peso_real_kg !== null ? (
                      <span className="text-sm font-semibold text-success-600 dark:text-success-400">
                        {Number(recepcion.peso_real_kg).toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  {/* Merma % */}
                  <td className="px-6 py-4 text-right">
                    {recepcion.porcentaje_merma > 0 ? (
                      <span className="text-sm font-medium text-danger-600 dark:text-danger-400">
                        {formatPercentage(recepcion.porcentaje_merma)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    <Badge variant={getEstadoBadgeVariant(recepcion.estado)} size="sm">
                      {recepcion.estado_display}
                    </Badge>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerDetalle(recepcion)}
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableCard>

      {/* MODALES - Usando componentes especializados del Design System */}

      {/* Modal: Iniciar Recepción */}
      <IniciarRecepcionModal
        isOpen={isIniciarModalOpen}
        onClose={() => setIsIniciarModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Modal: Ver Detalle con acciones */}
      <RecepcionDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        recepcion={recepcionDetalle || null}
        onPesar={() => {
          setIsDetailModalOpen(false);
          setIsPesarModalOpen(true);
        }}
        onConfirmar={() => {
          setIsDetailModalOpen(false);
          setIsConfirmarModalOpen(true);
        }}
        onCancelar={() => {
          setIsDetailModalOpen(false);
          setIsCancelarModalOpen(true);
        }}
        canWeigh={canWeigh}
        canConfirm={canConfirm}
        canCancel={canCancel}
      />

      {/* Modal: Registrar Pesaje */}
      <RegistrarPesajeModal
        isOpen={isPesarModalOpen}
        onClose={handleCloseModal}
        recepcion={recepcionDetalle || null}
        onSuccess={handleModalSuccess}
      />

      {/* Modal: Confirmar Recepción */}
      <ConfirmarRecepcionModal
        isOpen={isConfirmarModalOpen}
        onClose={handleCloseModal}
        recepcion={recepcionDetalle || null}
        onSuccess={handleModalSuccess}
      />

      {/* Modal: Cancelar Recepción */}
      <CancelarRecepcionModal
        isOpen={isCancelarModalOpen}
        onClose={handleCloseModal}
        recepcion={recepcionDetalle || null}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};
