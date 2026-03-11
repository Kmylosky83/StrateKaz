/**
 * Tab de Procesamiento (Órdenes de Producción) - Production Ops
 *
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
  Progress,
} from '@/components/common';
import { Factory, Clock, PlayCircle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useOrdenesProduccion, useDeleteOrdenProduccion } from '../hooks/useProductionOps';
import type { OrdenProduccionList, OrdenProduccion } from '../types/production-ops.types';
import OrdenProduccionFormModal from './OrdenProduccionFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PRIORIDAD_LABELS: Record<number, string> = {
  1: 'Muy Baja',
  2: 'Baja',
  3: 'Media',
  4: 'Alta',
  5: 'Urgente',
};

const PRIORIDAD_VARIANTS: Record<number, 'gray' | 'info' | 'warning' | 'danger'> = {
  1: 'gray',
  2: 'info',
  3: 'warning',
  4: 'danger',
  5: 'danger',
};

const ProcesamientoTab = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PRODUCTION_OPS, Sections.ORDENES_PRODUCCION, 'create');
  const canEdit = canDo(Modules.PRODUCTION_OPS, Sections.ORDENES_PRODUCCION, 'edit');
  const canDelete = canDo(Modules.PRODUCTION_OPS, Sections.ORDENES_PRODUCCION, 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<OrdenProduccion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: ordenesData, isLoading } = useOrdenesProduccion({
    page,
    page_size: 10,
    search: searchTerm || undefined,
  });
  const deleteMutation = useDeleteOrdenProduccion();

  const ordenes = useMemo(() => {
    const raw = ordenesData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [ordenesData]);

  const totalCount = ordenesData?.count ?? ordenes.length;

  // KPI calculations
  const kpis = useMemo(() => {
    const items = ordenes as OrdenProduccionList[];
    const programadas = items.filter((o) =>
      o.estado_nombre?.toLowerCase().includes('programada')
    ).length;
    const enProceso = items.filter((o) =>
      o.estado_nombre?.toLowerCase().includes('proceso')
    ).length;
    const completadas = items.filter((o) =>
      o.estado_nombre?.toLowerCase().includes('completada')
    ).length;
    return { total: totalCount, programadas, enProceso, completadas };
  }, [ordenes, totalCount]);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: OrdenProduccionList) => {
    setSelectedItem(item as unknown as OrdenProduccion);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      {isLoading ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Total Órdenes"
            value={kpis.total}
            icon={<Factory className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="Programadas"
            value={kpis.programadas}
            icon={<Clock className="w-5 h-5" />}
            color="warning"
          />
          <KpiCard
            label="En Proceso"
            value={kpis.enProceso}
            icon={<PlayCircle className="w-5 h-5" />}
            color="info"
          />
          <KpiCard
            label="Completadas"
            value={kpis.completadas}
            icon={<CheckCircle className="w-5 h-5" />}
            color="success"
          />
        </KpiCardGrid>
      )}

      {/* Toolbar */}
      <Card>
        <SectionToolbar
          title="Órdenes de Producción"
          count={totalCount}
          searchable
          searchValue={searchTerm}
          searchPlaceholder="Buscar por código, tipo de proceso..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          primaryAction={
            canCreate
              ? {
                  label: 'Nueva Orden',
                  onClick: handleNew,
                }
              : undefined
          }
        />
      </Card>

      {/* Tabla */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="large" />
          </div>
        ) : ordenes.length === 0 ? (
          <EmptyState
            title="Sin órdenes de producción"
            description="No hay órdenes registradas. Cree la primera para comenzar."
            icon={<Factory className="w-12 h-12" />}
            action={
              canCreate
                ? {
                    label: 'Nueva Orden',
                    onClick: handleNew,
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha Programada
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo Proceso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Línea
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {ordenes.map((orden: OrdenProduccionList) => {
                    const progreso = orden.porcentaje_completado
                      ? parseFloat(orden.porcentaje_completado)
                      : 0;
                    return (
                      <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                          {orden.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {orden.fecha_programada
                            ? format(new Date(orden.fecha_programada), 'dd MMM yyyy', {
                                locale: es,
                              })
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {orden.tipo_proceso_nombre || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {orden.linea_produccion_nombre || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={PRIORIDAD_VARIANTS[orden.prioridad] || 'gray'} size="sm">
                            {PRIORIDAD_LABELS[orden.prioridad] || 'Media'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                          {parseFloat(orden.cantidad_programada).toLocaleString('es-CO')} Kg
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="gray" size="sm">
                            {orden.estado_nombre || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <Progress value={progreso} size="sm" className="flex-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                              {progreso.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(orden)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(orden.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {ordenes.length} de {totalCount} órdenes
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
                  disabled={!ordenesData?.next}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de formulario */}
      <OrdenProduccionFormModal
        item={selectedItem}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Orden de Producción"
        message="¿Está seguro de que desea eliminar esta orden de producción? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ProcesamientoTab;
