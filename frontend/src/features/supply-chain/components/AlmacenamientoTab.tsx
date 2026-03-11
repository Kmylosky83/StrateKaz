/**
 * Tab de Gestión de Almacenamiento - Supply Chain
 *
 * Gestión de inventarios, movimientos, kardex, alertas y configuración de stock.
 * KPIs + SectionToolbar + Table + CRUD modales.
 */
import { useState } from 'react';
import { PageTabs } from '@/components/layout';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { KpiCard, KpiCardGrid } from '@/components/common/KpiCard';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  Package,
  ArrowRightLeft,
  FileText,
  AlertTriangle,
  Settings,
  Plus,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  TrendingDown,
  DollarSign,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useInventarios,
  useMovimientosInventario,
  useAlertasStock,
  useConfiguracionesStock,
  useEstadisticasAlmacenamiento,
  useGenerarAlertas,
  useMarcarAlertaLeida,
  useResolverAlerta,
} from '../hooks';
import MovimientoInventarioFormModal from './MovimientoInventarioFormModal';

// ==================== UTILITY FUNCTIONS ====================

const formatEstado = (estado: string): string => {
  return estado
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const getEstadoBadgeVariant = (
  estado: string
): 'success' | 'primary' | 'warning' | 'danger' | 'gray' => {
  const estadosSuccess = ['DISPONIBLE', 'ACTIVO', 'RESUELTA'];
  const estadosPrimary = ['EN_TRANSITO', 'RESERVADO'];
  const estadosWarning = ['STOCK_BAJO', 'PENDIENTE', 'LEIDA'];
  const estadosDanger = ['STOCK_CRITICO', 'VENCIDO', 'NO_DISPONIBLE'];

  if (estadosSuccess.some((e) => estado.includes(e))) return 'success';
  if (estadosPrimary.some((e) => estado.includes(e))) return 'primary';
  if (estadosWarning.some((e) => estado.includes(e))) return 'warning';
  if (estadosDanger.some((e) => estado.includes(e))) return 'danger';
  return 'gray';
};

// ==================== INVENTARIOS SECTION ====================

const InventariosSection = () => {
  const { data, isLoading } = useInventarios();
  const { data: estadisticasData } = useEstadisticasAlmacenamiento();
  const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);

  const inventarios = Array.isArray(data) ? data : (data?.results ?? []);
  const estadisticas = estadisticasData as Record<string, unknown> | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Productos"
          value={estadisticas?.total_productos ?? inventarios.length}
          icon={<Package className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Stock Bajo"
          value={estadisticas?.productos_stock_bajo ?? 0}
          icon={<TrendingDown className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Alertas Activas"
          value={estadisticas?.alertas_activas ?? 0}
          icon={<Bell className="w-5 h-5" />}
          color="danger"
        />
        <KpiCard
          label="Valor Total"
          value={`$${Number(estadisticas?.valor_total_inventario ?? 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="success"
        />
      </KpiCardGrid>

      {/* Toolbar */}
      <SectionToolbar
        title="Inventarios"
        count={inventarios.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Movimiento',
                onClick: () => setIsMovimientoOpen(true),
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {/* Table */}
      {inventarios.length === 0 ? (
        <EmptyState
          icon={<Package className="w-16 h-16" />}
          title="No hay inventarios registrados"
          description="Registre movimientos de inventario para comenzar"
          action={{
            label: 'Nuevo Movimiento',
            onClick: () => setIsMovimientoOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Stock Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Stock Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {inventarios.map((inv: Record<string, unknown>) => (
                  <tr key={inv.id as number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {inv.codigo as string}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {inv.producto_nombre as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {inv.stock_actual as number} {inv.unidad_medida_codigo as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {inv.stock_minimo as number} {inv.unidad_medida_codigo as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(String(inv.estado_codigo ?? ''))}
                        size="sm"
                      >
                        {formatEstado(String(inv.estado_nombre ?? 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Nuevo Movimiento */}
      <MovimientoInventarioFormModal
        isOpen={isMovimientoOpen}
        onClose={() => setIsMovimientoOpen(false)}
      />
    </div>
  );
};

// ==================== MOVIMIENTOS SECTION ====================

const MovimientosSection = () => {
  const { data, isLoading } = useMovimientosInventario();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const movimientos = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionToolbar
        title="Movimientos de Inventario"
        count={movimientos.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Movimiento',
                onClick: () => setIsFormOpen(true),
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {movimientos.length === 0 ? (
        <EmptyState
          icon={<ArrowRightLeft className="w-16 h-16" />}
          title="No hay movimientos registrados"
          description="Registre entradas, salidas y ajustes de inventario"
          action={{
            label: 'Nuevo Movimiento',
            onClick: () => setIsFormOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {movimientos.map((mov: Record<string, unknown>) => (
                  <tr key={mov.id as number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {mov.fecha_movimiento
                        ? format(new Date(mov.fecha_movimiento as string), 'dd/MM/yyyy HH:mm', {
                            locale: es,
                          })
                        : mov.created_at
                          ? format(new Date(mov.created_at as string), 'dd/MM/yyyy HH:mm', {
                              locale: es,
                            })
                          : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          (mov.afectacion_stock as string) === 'ENTRADA' ? 'success' : 'warning'
                        }
                        size="sm"
                      >
                        {formatEstado(String(mov.tipo_movimiento_nombre ?? ''))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {(mov.producto_nombre as string) || (mov.inventario_producto as string)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {(mov.afectacion_stock as string) === 'ENTRADA' ? '+' : '-'}
                      {mov.cantidad as number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {(mov.usuario_nombre as string) || (mov.created_by_nombre as string) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" title="Ver detalle">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Nuevo Movimiento */}
      <MovimientoInventarioFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

// ==================== KARDEX SECTION ====================

const KardexSection = () => {
  return (
    <EmptyState
      icon={<FileText className="w-16 h-16" />}
      title="Consulta de Kardex"
      description="Seleccione un producto para ver su kardex"
    />
  );
};

// ==================== ALERTAS SECTION ====================

const AlertasSection = () => {
  const { data, isLoading } = useAlertasStock();
  const generarAlertasMutation = useGenerarAlertas();
  const marcarLeidaMutation = useMarcarAlertaLeida();
  const resolverMutation = useResolverAlerta();

  const alertas = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionToolbar
        title="Alertas de Stock"
        count={alertas.length}
        primaryAction={
          canCreate
            ? {
                label: 'Generar Alertas',
                onClick: () => generarAlertasMutation.mutate(),
                icon: <Bell className="w-4 h-4" />,
                disabled: generarAlertasMutation.isPending,
              }
            : undefined
        }
      />

      {alertas.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-16 h-16" />}
          title="No hay alertas de stock"
          description="Las alertas se generarán automáticamente cuando se cumplan las condiciones"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Inventario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {alertas.map((alerta: Record<string, unknown>) => (
                  <tr
                    key={alerta.id as number}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {alerta.fecha_alerta
                        ? format(new Date(alerta.fecha_alerta as string), 'dd/MM/yyyy', {
                            locale: es,
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatEstado(String(alerta.tipo_alerta_nombre ?? ''))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {alerta.inventario_producto as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(String(alerta.prioridad ?? ''))}
                        size="sm"
                      >
                        {formatEstado(String(alerta.prioridad ?? 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={alerta.resuelta ? 'success' : alerta.leida ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {alerta.resuelta ? 'Resuelta' : alerta.leida ? 'Leída' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!alerta.leida && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Marcar como leída"
                            onClick={() => marcarLeidaMutation.mutate(alerta.id as number)}
                            disabled={marcarLeidaMutation.isPending}
                          >
                            <Eye className="w-4 h-4 text-primary-600" />
                          </Button>
                        )}
                        {!alerta.resuelta && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Resolver"
                            onClick={() => resolverMutation.mutate({ id: alerta.id as number })}
                            disabled={resolverMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 text-success-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== CONFIGURACIÓN SECTION ====================

const ConfiguracionSection = () => {
  const { data, isLoading } = useConfiguracionesStock();
  const configuraciones = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionToolbar
        title="Configuración de Stock"
        count={configuraciones.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nueva Configuración',
                onClick: () => {},
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {configuraciones.length === 0 ? (
        <EmptyState
          icon={<Settings className="w-16 h-16" />}
          title="No hay configuraciones de stock"
          description="Configure los parámetros de stock para cada inventario"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Inventario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Stock Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Stock Máximo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Punto Reorden
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {configuraciones.map((config: Record<string, unknown>) => (
                  <tr
                    key={config.id as number}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {config.inventario_producto as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {config.stock_minimo as number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {config.stock_maximo as number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {config.punto_reorden as number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Eliminar">
                          <Trash2 className="w-4 h-4 text-danger-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function AlmacenamientoTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.INVENTARIO, 'create');

  const { color: moduleColor } = useModuleColor('supply_chain');
  const [activeTab, setActiveTab] = useState('inventarios');

  const tabs = [
    { id: 'inventarios', label: 'Inventarios', icon: Package },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowRightLeft },
    { id: 'kardex', label: 'Kardex', icon: FileText },
    { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
        moduleColor={moduleColor}
      />

      <div className="mt-6">
        {activeTab === 'inventarios' && <InventariosSection />}
        {activeTab === 'movimientos' && <MovimientosSection />}
        {activeTab === 'kardex' && <KardexSection />}
        {activeTab === 'alertas' && <AlertasSection />}
        {activeTab === 'configuracion' && <ConfiguracionSection />}
      </div>
    </div>
  );
}
