/**
 * Página: PQRS - Sales CRM
 * Gestión de tickets PQRS con CRUD, tabla y KPIs
 */
import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MessageSquare, AlertCircle, Clock, CheckCircle, Edit, Trash2 } from 'lucide-react';
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
import PQRSFormModal from '../components/PQRSFormModal';
import { usePQRS, useDeletePQRS, usePQRSDashboard } from '../hooks';
import type { PQRSList, PQRS, TipoPQRS, EstadoPQRS, PrioridadPQRS } from '../types';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

const TIPO_LABELS: Record<TipoPQRS, string> = {
  PETICION: 'Petición',
  QUEJA: 'Queja',
  RECLAMO: 'Reclamo',
  SUGERENCIA: 'Sugerencia',
  FELICITACION: 'Felicitación',
};

const ESTADO_LABELS: Record<EstadoPQRS, string> = {
  ABIERTA: 'Abierta',
  EN_PROCESO: 'En Proceso',
  ESCALADA: 'Escalada',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada',
  CANCELADA: 'Cancelada',
};

const PRIORIDAD_LABELS: Record<PrioridadPQRS, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export default function PQRSPage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SALES_CRM, Sections.PQRS, 'create');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PQRS | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: pqrsData, isLoading: isLoadingPQRS } = usePQRS();
  const { data: dashboard, isLoading: isLoadingDashboard } = usePQRSDashboard();

  const deleteMutation = useDeletePQRS();

  const pqrsList = useMemo(() => {
    return Array.isArray(pqrsData) ? pqrsData : (pqrsData?.results ?? []);
  }, [pqrsData]);

  const stats = dashboard || {
    total_pqrs: 0,
    abiertas: 0,
    en_proceso: 0,
    resueltas: 0,
  };

  // Calcular vencidas de la lista
  const vencidas = useMemo(() => {
    const hoy = new Date();
    return pqrsList.filter((p) => {
      if (!p.fecha_limite_respuesta) return false;
      return (
        new Date(p.fecha_limite_respuesta) < hoy &&
        p.estado !== 'RESUELTA' &&
        p.estado !== 'CERRADA' &&
        p.estado !== 'CANCELADA'
      );
    }).length;
  }, [pqrsList]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleEdit = (pqrs: PQRSList) => {
    setEditingItem(pqrs as unknown as PQRS);
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

  const columns = useMemo<ColumnDef<PQRSList, unknown>[]>(
    () => [
      {
        accessorKey: 'numero_ticket',
        header: 'Código',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {getValue() as string}
          </span>
        ),
        size: 130,
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ getValue }) => {
          const tipo = getValue() as TipoPQRS;
          return <StatusBadge status={tipo} label={TIPO_LABELS[tipo]} />;
        },
        size: 120,
      },
      {
        accessorKey: 'asunto',
        header: 'Asunto',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
              {row.original.asunto}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.original.cliente_nombre}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'prioridad',
        header: 'Prioridad',
        cell: ({ getValue }) => {
          const prioridad = getValue() as PrioridadPQRS;
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
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ getValue }) => {
          const estado = getValue() as EstadoPQRS;
          return <StatusBadge status={estado} label={ESTADO_LABELS[estado]} preset="proceso" />;
        },
        size: 120,
      },
      {
        accessorKey: 'fecha_recepcion',
        header: 'Fecha',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {format(new Date(getValue() as string), 'dd MMM yyyy', { locale: es })}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'dias_abierta',
        header: 'Días',
        cell: ({ getValue }) => {
          const dias = getValue() as number;
          return (
            <span
              className={`text-sm font-medium ${
                dias > 7
                  ? 'text-danger-600'
                  : dias > 3
                    ? 'text-warning-600'
                    : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {dias}d
            </span>
          );
        },
        size: 70,
      },
      {
        accessorKey: 'asignado_a_nombre',
        header: 'Asignado',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {(getValue() as string) || 'Sin asignar'}
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
        title="PQRS"
        description="Gestión de Peticiones, Quejas, Reclamos y Sugerencias"
      />

      {/* KPI Cards */}
      {isLoadingDashboard ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Total PQRS"
            value={stats.total_pqrs}
            icon={<MessageSquare className="w-5 h-5" />}
            color="primary"
          />
          <KpiCard
            label="Abiertas"
            value={stats.abiertas}
            icon={<AlertCircle className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="En Proceso"
            value={stats.en_proceso}
            icon={<Clock className="w-5 h-5" />}
            color="warning"
          />
          <KpiCard
            label="Vencidas"
            value={vencidas}
            icon={<CheckCircle className="w-5 h-5" />}
            color={vencidas > 0 ? 'danger' : 'success'}
            description={vencidas > 0 ? 'Requieren atención inmediata' : 'Sin tickets vencidos'}
          />
        </KpiCardGrid>
      )}

      {/* Toolbar */}
      <SectionToolbar
        title="Tickets PQRS"
        count={pqrsList.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo PQRS',
                onClick: handleCreate,
              }
            : undefined
        }
      />

      {/* Table */}
      {pqrsList.length === 0 && !isLoadingPQRS ? (
        <EmptyState
          icon={<MessageSquare className="w-16 h-16" />}
          title="No hay tickets registrados"
          description="Comience registrando peticiones, quejas, reclamos o sugerencias"
          action={{
            label: 'Nuevo Ticket',
            onClick: handleCreate,
          }}
        />
      ) : (
        <Table
          data={pqrsList}
          columns={columns}
          loading={isLoadingPQRS}
          sorting
          pagination
          defaultPageSize={25}
          hoverable
          emptyMessage="No se encontraron tickets PQRS"
        />
      )}

      {/* Form Modal */}
      <PQRSFormModal item={editingItem} isOpen={showFormModal} onClose={handleCloseForm} />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Eliminar PQRS"
        message="¿Está seguro que desea eliminar este ticket PQRS? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
