/**
 * Tab de Gestión de Compras - Supply Chain
 *
 * Gestión de requisiciones, cotizaciones, órdenes de compra, contratos y recepciones.
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
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  FileText,
  TrendingUp,
  ShoppingCart,
  FileSignature,
  PackageCheck,
  Plus,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  Download,
  ClipboardList,
  Clock,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useRequisiciones,
  useDeleteRequisicion,
  useEstadisticasCompras,
  useCotizaciones,
  useOrdenesCompra,
  useContratos,
  useRecepcionesCompra,
} from '../hooks';
import RequisicionFormModal from './RequisicionFormModal';
import type { Requisicion } from '../types';

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
  const estadosSuccess = ['APROBADA', 'COMPLETADA', 'VIGENTE', 'CONFORME'];
  const estadosPrimary = ['EN_PROCESO', 'EVALUACION', 'SELECCIONADA'];
  const estadosWarning = ['BORRADOR', 'PENDIENTE', 'SOLICITADA'];
  const estadosDanger = ['RECHAZADA', 'CANCELADA', 'VENCIDO', 'NO_CONFORME'];

  if (estadosSuccess.some((e) => estado.includes(e))) return 'success';
  if (estadosPrimary.some((e) => estado.includes(e))) return 'primary';
  if (estadosWarning.some((e) => estado.includes(e))) return 'warning';
  if (estadosDanger.some((e) => estado.includes(e))) return 'danger';
  return 'gray';
};

// ==================== REQUISICIONES SECTION ====================

const RequisicionesSection = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.ORDENES_COMPRA, 'create');
  const canEdit = canDo(Modules.SUPPLY_CHAIN, Sections.ORDENES_COMPRA, 'edit');
  const canDelete = canDo(Modules.SUPPLY_CHAIN, Sections.ORDENES_COMPRA, 'delete');
  const { data, isLoading } = useRequisiciones();
  const { data: estadisticasData } = useEstadisticasCompras();
  const deleteMutation = useDeleteRequisicion();

  const [selectedItem, setSelectedItem] = useState<Requisicion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const requisiciones = Array.isArray(data) ? data : (data?.results ?? []);
  const estadisticas = estadisticasData as Record<string, unknown> | undefined;

  const handleCreate = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Requisicion) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

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
          label="Total Requisiciones"
          value={estadisticas?.total_requisiciones ?? requisiciones.length}
          icon={<ClipboardList className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Pendientes Aprobación"
          value={estadisticas?.requisiciones_pendientes ?? 0}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Órdenes Activas"
          value={estadisticas?.ordenes_activas ?? 0}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Monto Total"
          value={`$${Number(estadisticas?.valor_total_ordenes ?? 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="info"
        />
      </KpiCardGrid>

      {/* Toolbar */}
      <SectionToolbar
        title="Requisiciones de Compra"
        count={requisiciones.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nueva Requisición',
                onClick: handleCreate,
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {/* Table */}
      {requisiciones.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title="No hay requisiciones registradas"
          description="Comience creando requisiciones de compra"
          action={
            canCreate
              ? {
                  label: 'Nueva Requisición',
                  onClick: handleCreate,
                  icon: <Plus className="w-4 h-4" />,
                }
              : undefined
          }
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
                    Área Solicitante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha Requerida
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
                {requisiciones.map((req: Requisicion) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {req.codigo || `REQ-${req.id}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {req.area_solicitante}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {req.fecha_requerida
                        ? format(new Date(req.fecha_requerida), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(
                          req.prioridad_nombre || String(req.prioridad || '')
                        )}
                        size="sm"
                      >
                        {req.prioridad_nombre || formatEstado(String(req.prioridad || 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(
                          req.estado_nombre || String(req.estado || '')
                        )}
                        size="sm"
                      >
                        {req.estado_nombre || formatEstado(String(req.estado || 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(req)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(req.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-danger-600" />
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

      {/* Modal Crear/Editar */}
      <RequisicionFormModal item={selectedItem} isOpen={isFormOpen} onClose={handleCloseForm} />

      {/* Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Requisición"
        description="¿Está seguro de que desea eliminar esta requisición? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== COTIZACIONES SECTION ====================

const CotizacionesSection = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.ORDENES_COMPRA, 'create');
  const canEdit = canDo(Modules.SUPPLY_CHAIN, Sections.ORDENES_COMPRA, 'edit');
  const { data, isLoading } = useCotizaciones();
  const cotizaciones = Array.isArray(data) ? data : (data?.results ?? []);

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
        title="Cotizaciones"
        count={cotizaciones.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nueva Cotización',
                onClick: () => {},
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {cotizaciones.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-16 h-16" />}
          title="No hay cotizaciones registradas"
          description="Solicite cotizaciones a los proveedores"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
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
                {cotizaciones.map((cot: Record<string, unknown>) => (
                  <tr key={cot.id as number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {cot.numero as string}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {cot.proveedor_nombre as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {cot.fecha_cotizacion
                        ? format(new Date(cot.fecha_cotizacion as string), 'dd/MM/yyyy', {
                            locale: es,
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${Number(cot.total ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(String(cot.estado_codigo ?? ''))}
                        size="sm"
                      >
                        {formatEstado(String(cot.estado_nombre ?? 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="sm" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button variant="ghost" size="sm" title="Seleccionar">
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

// ==================== ÓRDENES DE COMPRA SECTION ====================

const OrdenesCompraSection = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.ORDENES_COMPRA, 'create');
  const { data, isLoading } = useOrdenesCompra();
  const ordenes = Array.isArray(data) ? data : (data?.results ?? []);

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
        title="Órdenes de Compra"
        count={ordenes.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nueva Orden',
                onClick: () => {},
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {ordenes.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-16 h-16" />}
          title="No hay órdenes de compra"
          description="Genere órdenes de compra desde las cotizaciones aprobadas"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
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
                {ordenes.map((oc: Record<string, unknown>) => (
                  <tr key={oc.id as number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {oc.numero as string}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {oc.proveedor_nombre as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {oc.fecha_orden
                        ? format(new Date(oc.fecha_orden as string), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${Number(oc.total ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(String(oc.estado_codigo ?? ''))}
                        size="sm"
                      >
                        {formatEstado(String(oc.estado_nombre ?? 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Descargar">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Recepcionar">
                          <PackageCheck className="w-4 h-4" />
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

// ==================== CONTRATOS SECTION ====================

const ContratosSection = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.ORDENES_COMPRA, 'create');
  const { data, isLoading } = useContratos();
  const contratos = Array.isArray(data) ? data : (data?.results ?? []);

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
        title="Contratos"
        count={contratos.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Contrato',
                onClick: () => {},
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {contratos.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="w-16 h-16" />}
          title="No hay contratos registrados"
          description="Registre los contratos con proveedores"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Vigencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Valor
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
                {contratos.map((cont: Record<string, unknown>) => (
                  <tr
                    key={cont.id as number}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {cont.numero as string}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {cont.proveedor_nombre as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {cont.fecha_inicio
                        ? format(new Date(cont.fecha_inicio as string), 'dd/MM/yyyy', {
                            locale: es,
                          })
                        : '-'}{' '}
                      -{' '}
                      {cont.fecha_fin
                        ? format(new Date(cont.fecha_fin as string), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${Number(cont.valor_total ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getEstadoBadgeVariant(String(cont.estado_codigo ?? ''))}
                        size="sm"
                      >
                        {formatEstado(String(cont.estado_nombre ?? 'N/A'))}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Descargar">
                          <Download className="w-4 h-4" />
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

// ==================== RECEPCIONES SECTION ====================

const RecepcionesSection = () => {
  const { data, isLoading } = useRecepcionesCompra();
  const recepciones = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionToolbar title="Recepciones de Compra" count={recepciones.length} />

      {recepciones.length === 0 ? (
        <EmptyState
          icon={<PackageCheck className="w-16 h-16" />}
          title="No hay recepciones registradas"
          description="Registre las recepciones de las órdenes de compra"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Orden Compra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha Recepción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Recibido Por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Conforme
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recepciones.map((rec: Record<string, unknown>) => (
                  <tr key={rec.id as number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {rec.orden_compra_numero as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {rec.fecha_recepcion
                        ? format(new Date(rec.fecha_recepcion as string), 'dd/MM/yyyy', {
                            locale: es,
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {rec.recibido_por_nombre as string}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rec.conforme ? (
                        <Badge variant="success" size="sm">
                          Conforme
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          No Conforme
                        </Badge>
                      )}
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
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ComprasTab() {
  const { color: moduleColor } = useModuleColor('supply_chain');
  const [activeTab, setActiveTab] = useState('requisiciones');

  const tabs = [
    { id: 'requisiciones', label: 'Requisiciones', icon: FileText },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: TrendingUp },
    { id: 'ordenes', label: 'Órdenes de Compra', icon: ShoppingCart },
    { id: 'contratos', label: 'Contratos', icon: FileSignature },
    { id: 'recepciones', label: 'Recepciones', icon: PackageCheck },
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
        {activeTab === 'requisiciones' && <RequisicionesSection />}
        {activeTab === 'cotizaciones' && <CotizacionesSection />}
        {activeTab === 'ordenes' && <OrdenesCompraSection />}
        {activeTab === 'contratos' && <ContratosSection />}
        {activeTab === 'recepciones' && <RecepcionesSection />}
      </div>
    </div>
  );
}
