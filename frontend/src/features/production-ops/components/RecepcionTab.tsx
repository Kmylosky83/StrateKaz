/**
 * Tab de Recepción de Materia Prima - Production Ops
 *
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
} from '@/components/common';
import { Package, Clock, CheckCircle, Search, Edit, Trash2, Thermometer } from 'lucide-react';
import { useRecepciones, useDeleteRecepcion } from '../hooks/useProductionOps';
import type { RecepcionList, Recepcion } from '../types/production-ops.types';
import RecepcionFormModal from './RecepcionFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const RecepcionTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Recepcion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: recepcionesData, isLoading } = useRecepciones({
    page,
    page_size: 10,
    search: searchTerm || undefined,
  });
  const deleteMutation = useDeleteRecepcion();

  const recepciones = useMemo(() => {
    const raw = recepcionesData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [recepcionesData]);

  const totalCount = recepcionesData?.count ?? recepciones.length;

  // KPI calculations
  const kpis = useMemo(() => {
    const items = recepciones as RecepcionList[];
    const pendientes = items.filter((r) =>
      r.estado_nombre?.toLowerCase().includes('pendiente')
    ).length;
    const enControl = items.filter(
      (r) =>
        r.estado_nombre?.toLowerCase().includes('control') ||
        r.estado_nombre?.toLowerCase().includes('calidad')
    ).length;
    const completadas = items.filter((r) =>
      r.estado_nombre?.toLowerCase().includes('completada')
    ).length;
    return { total: totalCount, pendientes, enControl, completadas };
  }, [recepciones, totalCount]);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: RecepcionList) => {
    setSelectedItem(item as unknown as Recepcion);
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

  const getEstadoBadgeVariant = (
    color?: string
  ): 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
    const colorMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
      '#28A745': 'success',
      '#FFC107': 'warning',
      '#DC3545': 'danger',
      '#17A2B8': 'info',
      '#6C757D': 'gray',
    };
    return colorMap[color || '#6C757D'] || 'gray';
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      {isLoading ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Total Recepciones"
            value={kpis.total}
            icon={<Package className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="Pendientes"
            value={kpis.pendientes}
            icon={<Clock className="w-5 h-5" />}
            color="warning"
          />
          <KpiCard
            label="En Control Calidad"
            value={kpis.enControl}
            icon={<Search className="w-5 h-5" />}
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
          title="Recepciones de Materia Prima"
          count={totalCount}
          searchable
          searchValue={searchTerm}
          searchPlaceholder="Buscar por código, proveedor..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          primaryAction={{
            label: 'Nueva Recepción',
            onClick: handleNew,
          }}
        />
      </Card>

      {/* Tabla */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="large" />
          </div>
        ) : recepciones.length === 0 ? (
          <EmptyState
            title="Sin recepciones"
            description="No hay recepciones registradas. Cree la primera para comenzar."
            icon={<Package className="w-12 h-12" />}
            action={{
              label: 'Nueva Recepción',
              onClick: handleNew,
            }}
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
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Peso Neto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Temp.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {recepciones.map((recepcion: RecepcionList) => (
                    <tr key={recepcion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                        {recepcion.codigo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {recepcion.fecha
                          ? format(new Date(recepcion.fecha), 'dd MMM yyyy', { locale: es })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {recepcion.proveedor_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {recepcion.tipo_recepcion_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {recepcion.peso_neto
                          ? `${parseFloat(recepcion.peso_neto).toLocaleString('es-CO')} Kg`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                        {recepcion.temperatura_llegada ? (
                          <span className="inline-flex items-center gap-1">
                            <Thermometer className="w-3 h-3" />
                            {recepcion.temperatura_llegada}°C
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getEstadoBadgeVariant(recepcion.estado_color)} size="sm">
                          {recepcion.estado_nombre || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(recepcion)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(recepcion.id)}
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

            {/* Paginación */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {recepciones.length} de {totalCount} recepciones
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
                  disabled={!recepcionesData?.next}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de formulario */}
      <RecepcionFormModal
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
        title="Eliminar Recepción"
        message="¿Está seguro de que desea eliminar esta recepción? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default RecepcionTab;
