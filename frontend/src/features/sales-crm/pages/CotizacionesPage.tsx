/**
 * Página: Cotizaciones - Sales CRM
 * Gestión de cotizaciones con CRUD, tabla y KPIs
 */
import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FileText, Clock, CheckCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import { KpiCard, KpiCardGrid, KpiCardSkeleton } from '@/components/common/KpiCard';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Table } from '@/components/common/Table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import CotizacionFormModal from '../components/CotizacionFormModal';
import { useCotizaciones, useDeleteCotizacion } from '../hooks';
import type { CotizacionList, Cotizacion, EstadoCotizacion } from '../types';

const ESTADO_LABELS: Record<EstadoCotizacion, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  VENCIDA: 'Vencida',
  CONVERTIDA: 'Convertida',
};

export default function CotizacionesPage() {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Cotizacion | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: cotizacionesData, isLoading } = useCotizaciones();

  const deleteMutation = useDeleteCotizacion();

  const cotizaciones = useMemo(() => {
    return Array.isArray(cotizacionesData) ? cotizacionesData : (cotizacionesData?.results ?? []);
  }, [cotizacionesData]);

  // Calcular estadísticas desde la data
  const stats = useMemo(() => {
    const total = cotizaciones.length;
    const enviadas = cotizaciones.filter((c) => c.estado === 'ENVIADA').length;
    const aprobadas = cotizaciones.filter((c) => c.estado === 'APROBADA').length;
    const valorTotal = cotizaciones.reduce((sum, c) => sum + c.total, 0);
    return { total, enviadas, aprobadas, valorTotal };
  }, [cotizaciones]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleEdit = (cotizacion: CotizacionList) => {
    setEditingItem(cotizacion as unknown as Cotizacion);
    setShowFormModal(true);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingItem(null);
  };

  // ── Columnas ────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<CotizacionList, unknown>[]>(
    () => [
      {
        accessorKey: 'numero_cotizacion',
        header: 'Código',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {getValue() as string}
          </span>
        ),
        size: 140,
      },
      {
        accessorKey: 'cliente_nombre',
        header: 'Cliente',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900 dark:text-white">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'fecha_emision',
        header: 'Emisión',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {format(new Date(getValue() as string), 'dd MMM yyyy', { locale: es })}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'fecha_vencimiento',
        header: 'Vencimiento',
        cell: ({ row }) => {
          const isVencida = row.original.dias_vigencia < 0;
          const isPorVencer = row.original.dias_vigencia >= 0 && row.original.dias_vigencia <= 3;
          return (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm ${
                  isVencida
                    ? 'text-danger-600 font-medium'
                    : isPorVencer
                      ? 'text-warning-600 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {format(new Date(row.original.fecha_vencimiento), 'dd MMM yyyy', {
                  locale: es,
                })}
              </span>
              {isVencida && <AlertCircle className="w-3.5 h-3.5 text-danger-500" />}
              {isPorVencer && <Clock className="w-3.5 h-3.5 text-warning-500" />}
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ getValue }) => {
          const estado = getValue() as EstadoCotizacion;
          return <StatusBadge status={estado} label={ESTADO_LABELS[estado]} preset="proceso" />;
        },
        size: 120,
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ getValue }) => (
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            ${(getValue() as number).toLocaleString()}
          </span>
        ),
        size: 130,
      },
      {
        accessorKey: 'vendedor_nombre',
        header: 'Vendedor',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {(getValue() as string) || '—'}
          </span>
        ),
        size: 140,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4 text-danger-500" />
            </Button>
          </div>
        ),
        size: 100,
      },
    ],
    []
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cotizaciones"
        description="Gestión de cotizaciones, aprobaciones y conversión a pedidos"
      />

      {/* KPI Cards */}
      {isLoading ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Total Cotizaciones"
            value={stats.total}
            icon={<FileText className="w-5 h-5" />}
            color="primary"
          />
          <KpiCard
            label="Enviadas"
            value={stats.enviadas}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="Aprobadas"
            value={stats.aprobadas}
            icon={<CheckCircle className="w-5 h-5" />}
            color="success"
          />
          <KpiCard
            label="Valor Total"
            value={`$${stats.valorTotal.toLocaleString()}`}
            icon={<FileText className="w-5 h-5" />}
            color="purple"
          />
        </KpiCardGrid>
      )}

      {/* Toolbar */}
      <SectionToolbar
        title="Todas las Cotizaciones"
        count={cotizaciones.length}
        primaryAction={{
          label: 'Nueva Cotización',
          onClick: handleCreate,
        }}
      />

      {/* Table */}
      {cotizaciones.length === 0 && !isLoading ? (
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title="No hay cotizaciones registradas"
          description="Comience creando cotizaciones para sus clientes"
          action={{
            label: 'Nueva Cotización',
            onClick: handleCreate,
          }}
        />
      ) : (
        <Table
          data={cotizaciones}
          columns={columns}
          loading={isLoading}
          sorting
          pagination
          defaultPageSize={25}
          hoverable
          emptyMessage="No se encontraron cotizaciones"
        />
      )}

      {/* Form Modal */}
      <CotizacionFormModal item={editingItem} isOpen={showFormModal} onClose={handleCloseForm} />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Cotización"
        message="¿Está seguro que desea eliminar esta cotización? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
