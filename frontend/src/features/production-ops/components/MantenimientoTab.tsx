/**
 * Tab de Mantenimiento - Production Ops
 *
 * Sub-tabs: Activos de Producción + Órdenes de Trabajo
 * KPIs + SectionToolbar + Tabla profesional + CRUD completo
 */
import { useState, useMemo } from 'react';
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
  Wrench,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  ClipboardList,
  PlayCircle,
  Cog,
} from 'lucide-react';
import {
  useActivosProduccion,
  useOrdenesTrabajo,
  useDeleteActivoProduccion,
  useDeleteOrdenTrabajo,
} from '../hooks/useProductionOps';
import type {
  ActivoProduccionList,
  ActivoProduccion,
  OrdenTrabajoList,
  OrdenTrabajo,
  EstadoActivo,
  EstadoOrden,
} from '../types/production-ops.types';
import ActivoFormModal from './ActivoFormModal';
import OrdenTrabajoFormModal from './OrdenTrabajoFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== ESTADO MAPS ====================

const ESTADO_ACTIVO_LABELS: Record<EstadoActivo, string> = {
  OPERATIVO: 'Operativo',
  EN_MANTENIMIENTO: 'En Mantenimiento',
  FUERA_SERVICIO: 'Fuera de Servicio',
  DADO_DE_BAJA: 'Dado de Baja',
};

const ESTADO_ACTIVO_VARIANTS: Record<EstadoActivo, 'success' | 'warning' | 'danger' | 'gray'> = {
  OPERATIVO: 'success',
  EN_MANTENIMIENTO: 'warning',
  FUERA_SERVICIO: 'danger',
  DADO_DE_BAJA: 'gray',
};

const ESTADO_OT_LABELS: Record<EstadoOrden, string> = {
  ABIERTA: 'Abierta',
  EN_PROCESO: 'En Proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

const ESTADO_OT_VARIANTS: Record<EstadoOrden, 'info' | 'warning' | 'success' | 'gray'> = {
  ABIERTA: 'info',
  EN_PROCESO: 'warning',
  COMPLETADA: 'success',
  CANCELADA: 'gray',
};

const PRIORIDAD_OT_LABELS: Record<number, string> = {
  1: 'Crítica',
  2: 'Alta',
  3: 'Media',
  4: 'Baja',
  5: 'Planificada',
};

const PRIORIDAD_OT_VARIANTS: Record<number, 'danger' | 'warning' | 'info' | 'gray'> = {
  1: 'danger',
  2: 'danger',
  3: 'warning',
  4: 'info',
  5: 'gray',
};

// ==================== ACTIVOS SECTION ====================

const ActivosSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ActivoProduccion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: activosData, isLoading } = useActivosProduccion({
    page,
    page_size: 10,
    search: searchTerm || undefined,
  });
  const deleteMutation = useDeleteActivoProduccion();

  const activos = useMemo(() => {
    const raw = activosData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [activosData]);

  const totalCount = activosData?.count ?? activos.length;

  const kpis = useMemo(() => {
    const items = activos as ActivoProduccionList[];
    return {
      total: totalCount,
      operativos: items.filter((a) => a.estado === 'OPERATIVO').length,
      enMantenimiento: items.filter((a) => a.estado === 'EN_MANTENIMIENTO').length,
      fueraServicio: items.filter((a) => a.estado === 'FUERA_SERVICIO').length,
    };
  }, [activos, totalCount]);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: ActivoProduccionList) => {
    setSelectedItem(item as unknown as ActivoProduccion);
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
            label="Total Activos"
            value={kpis.total}
            icon={<Settings className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="Operativos"
            value={kpis.operativos}
            icon={<CheckCircle className="w-5 h-5" />}
            color="success"
          />
          <KpiCard
            label="En Mantenimiento"
            value={kpis.enMantenimiento}
            icon={<Wrench className="w-5 h-5" />}
            color="warning"
          />
          <KpiCard
            label="Fuera de Servicio"
            value={kpis.fueraServicio}
            icon={<XCircle className="w-5 h-5" />}
            color="danger"
          />
        </KpiCardGrid>
      )}

      <Card>
        <SectionToolbar
          title="Activos de Producción"
          count={totalCount}
          searchable
          searchValue={searchTerm}
          searchPlaceholder="Buscar activos..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          primaryAction={{
            label: 'Nuevo Activo',
            onClick: handleNew,
          }}
        />
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="large" />
          </div>
        ) : activos.length === 0 ? (
          <EmptyState
            title="Sin activos registrados"
            description="Registre los equipos y maquinaria de producción."
            icon={<Settings className="w-12 h-12" />}
            action={{ label: 'Nuevo Activo', onClick: handleNew }}
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
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Próximo Mantenimiento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {activos.map((activo: ActivoProduccionList) => (
                    <tr key={activo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                        {activo.codigo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {activo.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {activo.tipo_activo_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={ESTADO_ACTIVO_VARIANTS[activo.estado] || 'gray'} size="sm">
                          {ESTADO_ACTIVO_LABELS[activo.estado] || activo.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {activo.fecha_proximo_mantenimiento
                          ? format(new Date(activo.fecha_proximo_mantenimiento), 'dd MMM yyyy', {
                              locale: es,
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(activo)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(activo.id)}>
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
                Mostrando {activos.length} de {totalCount} activos
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
                  disabled={!activosData?.next}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <ActivoFormModal
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
        title="Eliminar Activo"
        message="¿Está seguro de que desea eliminar este activo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== ÓRDENES DE TRABAJO SECTION ====================

const OrdenesTrabajoSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<OrdenTrabajo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: ordenesData, isLoading } = useOrdenesTrabajo({
    page,
    page_size: 10,
    search: searchTerm || undefined,
  });
  const deleteMutation = useDeleteOrdenTrabajo();

  const ordenes = useMemo(() => {
    const raw = ordenesData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [ordenesData]);

  const totalCount = ordenesData?.count ?? ordenes.length;

  const kpis = useMemo(() => {
    const items = ordenes as OrdenTrabajoList[];
    return {
      total: totalCount,
      abiertas: items.filter((o) => o.estado === 'ABIERTA').length,
      enProceso: items.filter((o) => o.estado === 'EN_PROCESO').length,
      completadas: items.filter((o) => o.estado === 'COMPLETADA').length,
    };
  }, [ordenes, totalCount]);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: OrdenTrabajoList) => {
    setSelectedItem(item as unknown as OrdenTrabajo);
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
            label="Total OT"
            value={kpis.total}
            icon={<ClipboardList className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="Abiertas"
            value={kpis.abiertas}
            icon={<AlertTriangle className="w-5 h-5" />}
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

      <Card>
        <SectionToolbar
          title="Órdenes de Trabajo"
          count={totalCount}
          searchable
          searchValue={searchTerm}
          searchPlaceholder="Buscar órdenes de trabajo..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          primaryAction={{
            label: 'Nueva OT',
            onClick: handleNew,
          }}
        />
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="large" />
          </div>
        ) : ordenes.length === 0 ? (
          <EmptyState
            title="Sin órdenes de trabajo"
            description="Cree una orden de trabajo para gestionar el mantenimiento."
            icon={<ClipboardList className="w-12 h-12" />}
            action={{ label: 'Nueva OT', onClick: handleNew }}
          />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código OT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Activo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha Prog.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Asignado a
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Costo Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {ordenes.map((orden: OrdenTrabajoList) => (
                    <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                        {orden.codigo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {orden.activo_codigo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {orden.tipo_mantenimiento_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={PRIORIDAD_OT_VARIANTS[orden.prioridad] || 'gray'} size="sm">
                          {PRIORIDAD_OT_LABELS[orden.prioridad] || `P${orden.prioridad}`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={ESTADO_OT_VARIANTS[orden.estado] || 'gray'} size="sm">
                          {ESTADO_OT_LABELS[orden.estado] || orden.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {orden.fecha_programada
                          ? format(new Date(orden.fecha_programada), 'dd MMM yyyy', {
                              locale: es,
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {orden.asignado_a_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {orden.costo_total
                          ? `$${parseFloat(orden.costo_total).toLocaleString('es-CO')}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(orden)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(orden.id)}>
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

      <OrdenTrabajoFormModal
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
        title="Eliminar Orden de Trabajo"
        message="¿Está seguro de que desea eliminar esta orden de trabajo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const MantenimientoTab = () => {
  const [subTab, setSubTab] = useState('activos');

  const tabs = [
    { id: 'activos', label: 'Activos de Producción', icon: <Cog className="h-4 w-4" /> },
    {
      id: 'ordenes',
      label: 'Órdenes de Trabajo',
      icon: <ClipboardList className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={tabs} activeTab={subTab} onChange={setSubTab} variant="pills" />

      {subTab === 'activos' && <ActivosSection />}
      {subTab === 'ordenes' && <OrdenesTrabajoSection />}
    </div>
  );
};

export default MantenimientoTab;
