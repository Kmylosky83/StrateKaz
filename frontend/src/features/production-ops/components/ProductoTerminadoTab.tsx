/**
 * Tab de Producto Terminado - Production Ops
 *
 * Sub-tabs: Stock de Producto + Liberaciones de Calidad
 * KPIs + SectionToolbar + Tabla profesional + CRUD completo
 */
import { useState, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  Card,
  Badge,
  Button,
  Spinner,
  EmptyState,
  KpiCard,
  KpiCardGrid,
  KpiCardSkeleton,
  SectionToolbar,
  ConfirmDialog,
  Tabs,
} from '@/components/common';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Shield,
  XCircle,
} from 'lucide-react';
import {
  useStocks,
  useLiberaciones,
  useDeleteStock,
  useDeleteLiberacion,
} from '../hooks/useProductionOps';
import type {
  StockProductoList,
  LiberacionList,
  Liberacion,
  ResultadoLiberacion,
} from '../types/production-ops.types';
import LiberacionFormModal from './LiberacionFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== RESULTADO MAPS ====================

const RESULTADO_LABELS: Record<ResultadoLiberacion, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  APROBADO_CON_OBSERVACIONES: 'Aprobado c/ Obs.',
  RECHAZADO: 'Rechazado',
};

const RESULTADO_VARIANTS: Record<ResultadoLiberacion, 'warning' | 'success' | 'info' | 'danger'> = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  APROBADO_CON_OBSERVACIONES: 'info',
  RECHAZADO: 'danger',
};

// ==================== STOCK SECTION ====================

const StockSection = () => {
  const { canDo } = usePermissions();
  const _canCreate = canDo(Modules.PRODUCTION_OPS, Sections.LOTES, 'create');

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: stocksData, isLoading } = useStocks({
    page,
    page_size: 10,
    search: searchTerm || undefined,
  });
  const deleteMutation = useDeleteStock();

  const stocks = useMemo(() => {
    const raw = stocksData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [stocksData]);

  const totalCount = stocksData?.count ?? stocks.length;

  const kpis = useMemo(() => {
    const items = stocks as StockProductoList[];
    const disponibles = items.filter(
      (s) =>
        s.estado_lote_nombre?.toLowerCase().includes('liberado') ||
        s.estado_lote_nombre?.toLowerCase().includes('aprobado')
    ).length;
    const reservados = items.filter((s) =>
      s.estado_lote_nombre?.toLowerCase().includes('cuarentena')
    ).length;
    const porVencer = items.filter((s) => s.esta_vencido === true).length;
    return { total: totalCount, disponibles, reservados, porVencer };
  }, [stocks, totalCount]);

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Total Lotes"
            value={kpis.total}
            icon={<Package className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="Disponibles"
            value={kpis.disponibles}
            icon={<CheckCircle className="w-5 h-5" />}
            color="success"
          />
          <KpiCard
            label="En Cuarentena"
            value={kpis.reservados}
            icon={<Clock className="w-5 h-5" />}
            color="warning"
          />
          <KpiCard
            label="Vencidos"
            value={kpis.porVencer}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="danger"
          />
        </KpiCardGrid>
      )}

      <Card>
        <SectionToolbar
          title="Stock de Producto Terminado"
          count={totalCount}
          searchable
          searchValue={searchTerm}
          searchPlaceholder="Buscar por lote, producto..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
        />
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="large" />
          </div>
        ) : stocks.length === 0 ? (
          <EmptyState
            title="Sin stock registrado"
            description="No hay lotes de producto terminado en inventario."
            icon={<Package className="w-12 h-12" />}
          />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lote PT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Disponible
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha Producción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {stocks.map((stock: StockProductoList) => (
                    <tr key={stock.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                        {stock.codigo_lote_pt}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {stock.producto_nombre}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {stock.producto_codigo}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="gray" size="sm">
                          {stock.estado_lote_nombre || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                        {parseFloat(stock.cantidad_disponible).toLocaleString('es-CO')} Kg
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {stock.fecha_produccion
                          ? format(new Date(stock.fecha_produccion), 'dd MMM yyyy', {
                              locale: es,
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {stock.fecha_vencimiento ? (
                          <span
                            className={
                              stock.esta_vencido
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300'
                            }
                          >
                            {format(new Date(stock.fecha_vencimiento), 'dd MMM yyyy', {
                              locale: es,
                            })}
                            {stock.esta_vencido && (
                              <Badge variant="danger" size="sm" className="ml-2">
                                Vencido
                              </Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(stock.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {stocks.length} de {totalCount} lotes
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!stocksData?.next}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Stock"
        message="¿Está seguro de que desea eliminar este registro de stock? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== LIBERACIONES SECTION ====================

const LiberacionesSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Liberacion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: liberacionesData, isLoading } = useLiberaciones({
    page,
    page_size: 10,
    search: searchTerm || undefined,
  });
  const deleteMutation = useDeleteLiberacion();

  const liberaciones = useMemo(() => {
    const raw = liberacionesData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [liberacionesData]);

  const totalCount = liberacionesData?.count ?? liberaciones.length;

  const kpis = useMemo(() => {
    const items = liberaciones as LiberacionList[];
    return {
      total: totalCount,
      pendientes: items.filter((l) => l.resultado === 'PENDIENTE').length,
      aprobadas: items.filter(
        (l) => l.resultado === 'APROBADO' || l.resultado === 'APROBADO_CON_OBSERVACIONES'
      ).length,
      rechazadas: items.filter((l) => l.resultado === 'RECHAZADO').length,
    };
  }, [liberaciones, totalCount]);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleView = (item: LiberacionList) => {
    setSelectedItem(item as unknown as Liberacion);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Total Liberaciones"
            value={kpis.total}
            icon={<Shield className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="Pendientes"
            value={kpis.pendientes}
            icon={<Clock className="w-5 h-5" />}
            color="warning"
          />
          <KpiCard
            label="Aprobadas"
            value={kpis.aprobadas}
            icon={<CheckCircle className="w-5 h-5" />}
            color="success"
          />
          <KpiCard
            label="Rechazadas"
            value={kpis.rechazadas}
            icon={<XCircle className="w-5 h-5" />}
            color="danger"
          />
        </KpiCardGrid>
      )}

      <Card>
        <SectionToolbar
          title="Liberaciones de Calidad"
          count={totalCount}
          searchable
          searchValue={searchTerm}
          searchPlaceholder="Buscar liberaciones..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          primaryAction={
            canCreate
              ? {
                  label: 'Nueva Liberación',
                  onClick: handleNew,
                }
              : undefined
          }
        />
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="large" />
          </div>
        ) : liberaciones.length === 0 ? (
          <EmptyState
            title="Sin liberaciones"
            description="Solicite una liberación de calidad para aprobar lotes de producto."
            icon={<Shield className="w-12 h-12" />}
            action={{ label: 'Nueva Liberación', onClick: handleNew }}
          />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha Solicitud
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Solicitado por
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Resultado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha Liberación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Aprobado por
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {liberaciones.map((liberacion: LiberacionList) => (
                    <tr key={liberacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                        {liberacion.stock_codigo_lote || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {liberacion.stock_producto_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {liberacion.fecha_solicitud
                          ? format(new Date(liberacion.fecha_solicitud), 'dd MMM yyyy', {
                              locale: es,
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {liberacion.solicitado_por_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            RESULTADO_VARIANTS[liberacion.resultado as ResultadoLiberacion] ||
                            'gray'
                          }
                          size="sm"
                        >
                          {RESULTADO_LABELS[liberacion.resultado as ResultadoLiberacion] ||
                            liberacion.resultado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {liberacion.fecha_liberacion
                          ? format(new Date(liberacion.fecha_liberacion), 'dd MMM yyyy', {
                              locale: es,
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {liberacion.aprobado_por_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleView(liberacion)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(liberacion.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {liberaciones.length} de {totalCount} liberaciones
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!liberacionesData?.next}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <LiberacionFormModal
        item={selectedItem}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Liberación"
        message="¿Está seguro de que desea eliminar esta liberación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const ProductoTerminadoTab = () => {
  const [subTab, setSubTab] = useState('stock');

  const tabs = [
    { id: 'stock', label: 'Stock de Producto', icon: <Package className="h-4 w-4" /> },
    {
      id: 'liberaciones',
      label: 'Liberaciones de Calidad',
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={tabs} activeTab={subTab} onChange={setSubTab} variant="pills" />

      {subTab === 'stock' && <StockSection />}
      {subTab === 'liberaciones' && <LiberacionesSection />}
    </div>
  );
};

export default ProductoTerminadoTab;
