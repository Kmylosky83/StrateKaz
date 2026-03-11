/**
 * Página: Pipeline de Ventas - Sales CRM
 * Gestión de oportunidades con CRUD, tabla y KPIs
 */
import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Target, DollarSign, TrendingUp, Clock, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { KpiCard, KpiCardGrid, KpiCardSkeleton } from '@/components/common/KpiCard';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Table } from '@/components/common/Table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import OportunidadFormModal from '../components/OportunidadFormModal';
import { useOportunidades, useDeleteOportunidad, usePipelineDashboard } from '../hooks';
import type { OportunidadList, Oportunidad, EtapaVenta, PrioridadOportunidad } from '../types';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

const ETAPA_LABELS: Record<EtapaVenta, string> = {
  PROSPECTO: 'Prospecto',
  CONTACTADO: 'Contactado',
  CALIFICADO: 'Calificado',
  PROPUESTA: 'Propuesta',
  NEGOCIACION: 'Negociación',
  GANADA: 'Ganada',
  PERDIDA: 'Perdida',
};

const PRIORIDAD_LABELS: Record<PrioridadOportunidad, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export default function PipelinePage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SALES_CRM, Sections.OPORTUNIDADES_VENTA, 'create');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Oportunidad | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: oportunidadesData, isLoading: isLoadingOportunidades } = useOportunidades();
  const { data: dashboard, isLoading: isLoadingDashboard } = usePipelineDashboard();

  const deleteMutation = useDeleteOportunidad();

  const oportunidades = useMemo(() => {
    return Array.isArray(oportunidadesData)
      ? oportunidadesData
      : (oportunidadesData?.results ?? []);
  }, [oportunidadesData]);

  const stats = dashboard || {
    total_oportunidades: 0,
    valor_pipeline_total: 0,
    tasa_conversion: 0,
    tiempo_promedio_cierre_dias: 0,
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleEdit = (oportunidad: OportunidadList) => {
    setEditingItem(oportunidad as unknown as Oportunidad);
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

  // Calcular oportunidades próximas a vencer (cierre en 7 días o menos)
  const proximasVencer = useMemo(() => {
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);
    return oportunidades.filter((o) => {
      if (!o.fecha_estimada_cierre) return false;
      const fecha = new Date(o.fecha_estimada_cierre);
      return fecha <= en7Dias && fecha >= hoy && o.etapa !== 'GANADA' && o.etapa !== 'PERDIDA';
    }).length;
  }, [oportunidades]);

  // ── Columnas ────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<OportunidadList, unknown>[]>(
    () => [
      {
        accessorKey: 'numero_oportunidad',
        header: 'Código',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {getValue() as string}
          </span>
        ),
        size: 130,
      },
      {
        accessorKey: 'titulo',
        header: 'Título',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.original.titulo}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.original.cliente_nombre}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'valor_estimado',
        header: 'Valor',
        cell: ({ getValue }) => (
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            ${(getValue() as number).toLocaleString()}
          </span>
        ),
        size: 140,
      },
      {
        accessorKey: 'etapa',
        header: 'Etapa',
        cell: ({ getValue }) => {
          const etapa = getValue() as EtapaVenta;
          return <StatusBadge status={etapa} label={ETAPA_LABELS[etapa]} preset="proceso" />;
        },
        size: 130,
      },
      {
        accessorKey: 'prioridad',
        header: 'Prioridad',
        cell: ({ getValue }) => {
          const prioridad = getValue() as PrioridadOportunidad;
          return (
            <StatusBadge
              status={prioridad}
              label={PRIORIDAD_LABELS[prioridad]}
              preset="prioridad"
            />
          );
        },
        size: 110,
      },
      {
        accessorKey: 'probabilidad_cierre',
        header: 'Prob.',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{getValue() as number}%</span>
        ),
        size: 80,
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
        title="Pipeline de Ventas"
        description="Gestión de oportunidades comerciales y seguimiento del pipeline"
      />

      {/* KPI Cards */}
      {isLoadingDashboard ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Oportunidades Activas"
            value={stats.total_oportunidades}
            icon={<Target className="w-5 h-5" />}
            color="primary"
          />
          <KpiCard
            label="Valor Pipeline"
            value={`$${(stats.valor_pipeline_total || 0).toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="success"
          />
          <KpiCard
            label="Tasa Conversión"
            value={`${(stats.tasa_conversion || 0).toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="warning"
          />
          <KpiCard
            label="Próximas a Vencer"
            value={proximasVencer}
            icon={<Clock className="w-5 h-5" />}
            color={proximasVencer > 0 ? 'danger' : 'gray'}
            description="Cierre en 7 días o menos"
          />
        </KpiCardGrid>
      )}

      {/* Toolbar */}
      <SectionToolbar
        title="Oportunidades"
        count={oportunidades.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nueva Oportunidad',
                onClick: handleCreate,
              }
            : undefined
        }
      />

      {/* Table */}
      {oportunidades.length === 0 && !isLoadingOportunidades ? (
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="No hay oportunidades registradas"
          description="Comience agregando oportunidades a su pipeline de ventas"
          action={{
            label: 'Nueva Oportunidad',
            onClick: handleCreate,
          }}
        />
      ) : (
        <Table
          data={oportunidades}
          columns={columns}
          loading={isLoadingOportunidades}
          sorting
          pagination
          defaultPageSize={25}
          hoverable
          emptyMessage="No se encontraron oportunidades"
        />
      )}

      {/* Form Modal */}
      <OportunidadFormModal item={editingItem} isOpen={showFormModal} onClose={handleCloseForm} />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Oportunidad"
        message="¿Está seguro que desea eliminar esta oportunidad? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
