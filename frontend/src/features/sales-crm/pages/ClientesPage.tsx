/**
 * Página: Clientes - Sales CRM
 * Gestión completa de clientes con CRUD, tabla, KPIs e importación masiva
 */
import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Users,
  Star,
  AlertTriangle,
  TrendingUp,
  Upload,
  Edit,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { KpiCard, KpiCardGrid, KpiCardSkeleton } from '@/components/common/KpiCard';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Table } from '@/components/common/Table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ScoringBadge } from '../components/ScoringBadge';
import ClienteFormModal from '../components/ClienteFormModal';
import ImportClientesModal from '../components/ImportClientesModal';
import { CrearAccesoClienteModal } from '../components/CrearAccesoClienteModal';
import { useClientes, useDeleteCliente, useClienteDashboard } from '../hooks';
import type { ClienteList, Cliente } from '../types';

export default function ClientesPage() {
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Cliente | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [accesoCliente, setAccesoCliente] = useState<ClienteList | null>(null);

  const { data: clientesData, isLoading: isLoadingClientes } = useClientes();
  const { data: dashboard, isLoading: isLoadingDashboard } = useClienteDashboard();

  const deleteMutation = useDeleteCliente();

  const clientes = useMemo(() => {
    return Array.isArray(clientesData) ? clientesData : (clientesData?.results ?? []);
  }, [clientesData]);

  const stats = dashboard || {
    total_clientes: 0,
    clientes_activos: 0,
    clientes_alto_scoring: 0,
    total_saldo_pendiente: 0,
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleEdit = (cliente: ClienteList) => {
    // Usar el registro de la lista como base para edición
    setEditingItem(cliente as unknown as Cliente);
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

  const columns = useMemo<ColumnDef<ClienteList, unknown>[]>(
    () => [
      {
        accessorKey: 'codigo_cliente',
        header: 'Código',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {getValue() as string}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'nombre_comercial',
        header: 'Razón Social / Nombre',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {row.original.nombre_comercial}
            </p>
            {row.original.razon_social && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {row.original.razon_social}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'tipo_cliente',
        header: 'Tipo',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} size="sm" />,
        size: 130,
      },
      {
        accessorKey: 'scoring_cliente',
        header: 'Scoring',
        cell: ({ getValue }) => <ScoringBadge scoring={getValue() as number} />,
        size: 150,
      },
      {
        accessorKey: 'segmento_nombre',
        header: 'Segmento',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {(getValue() as string) || '—'}
          </span>
        ),
        size: 130,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} preset="proceso" />,
        size: 120,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAccesoCliente(row.original)}
              title="Crear Acceso Portal"
            >
              <KeyRound className="w-4 h-4" />
            </Button>
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
        size: 130,
      },
    ],
    []
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Gestión de clientes, contactos y scoring" />

      {/* KPI Cards */}
      {isLoadingDashboard ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Total Clientes"
            value={stats.total_clientes}
            icon={<Users className="w-5 h-5" />}
            color="primary"
          />
          <KpiCard
            label="Clientes Activos"
            value={stats.clientes_activos}
            icon={<TrendingUp className="w-5 h-5" />}
            color="success"
          />
          <KpiCard
            label="Alto Scoring (>70)"
            value={stats.clientes_alto_scoring}
            icon={<Star className="w-5 h-5" />}
            color="warning"
          />
          <KpiCard
            label="Saldo Pendiente"
            value={`$${(stats.total_saldo_pendiente || 0).toLocaleString()}`}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="danger"
          />
        </KpiCardGrid>
      )}

      {/* Toolbar */}
      <SectionToolbar
        title="Todos los Clientes"
        count={clientes.length}
        extraActions={[
          {
            label: 'Importar',
            onClick: () => setShowImportModal(true),
            icon: <Upload className="w-4 h-4" />,
            variant: 'outline',
          },
        ]}
        primaryAction={{
          label: 'Nuevo Cliente',
          onClick: handleCreate,
        }}
      />

      {/* Table */}
      {clientes.length === 0 && !isLoadingClientes ? (
        <EmptyState
          icon={<Users className="w-16 h-16" />}
          title="No hay clientes registrados"
          description="Comience agregando clientes a su sistema CRM o importe desde Excel"
          action={{
            label: 'Nuevo Cliente',
            onClick: handleCreate,
          }}
        />
      ) : (
        <Table
          data={clientes}
          columns={columns}
          loading={isLoadingClientes}
          sorting
          pagination
          defaultPageSize={25}
          hoverable
          emptyMessage="No se encontraron clientes"
        />
      )}

      {/* Form Modal */}
      <ClienteFormModal item={editingItem} isOpen={showFormModal} onClose={handleCloseForm} />

      {/* Import Modal */}
      <ImportClientesModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />

      {/* Crear Acceso Portal Modal */}
      <CrearAccesoClienteModal
        cliente={accesoCliente}
        isOpen={!!accesoCliente}
        onClose={() => setAccesoCliente(null)}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Cliente"
        message="¿Está seguro que desea eliminar este cliente? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
