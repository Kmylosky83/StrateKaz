/**
 * ReglamentoInternoSection - Seccion principal de Reglamentos Internos
 *
 * Vista Tipo B: SectionToolbar + Table en Card
 * Fundacion Tab 4 "Mis Politicas y Reglamentos"
 *
 * Features:
 * - Stats grid (total, vigentes, en revision, obsoletos)
 * - SectionToolbar con busqueda + boton crear (RBAC)
 * - Tabla con columnas: codigo, nombre, tipo, estado, version, vigencia, aplicabilidad
 * - ActionButtons por fila (edit, delete) basado en RBAC
 * - ConfirmDialog para eliminar
 * - EmptyState sin datos
 * - BrandedSkeleton mientras carga
 */
import { useState, useMemo } from 'react';
import { BookOpen, FileText, Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { BrandedSkeleton } from '@/components/common/BrandedSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  useReglamentos,
  useReglamentosEstadisticas,
  useDeleteReglamento,
} from '../hooks/useReglamentos';
import { ReglamentoFormModal } from './ReglamentoFormModal';
import type { Reglamento, EstadoReglamento } from '../types/reglamentos.types';

// ==================== HELPERS ====================

const estadoBadgeVariant: Record<
  EstadoReglamento,
  'success' | 'warning' | 'info' | 'gray' | 'danger'
> = {
  borrador: 'gray',
  en_revision: 'warning',
  aprobado: 'info',
  vigente: 'success',
  obsoleto: 'danger',
};

// ==================== COMPONENT ====================

export function ReglamentoInternoSection() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.FUNDACION, Sections.REGLAMENTO_INTERNO, 'create');
  const canEdit = canDo(Modules.FUNDACION, Sections.REGLAMENTO_INTERNO, 'edit');
  const canDelete = canDo(Modules.FUNDACION, Sections.REGLAMENTO_INTERNO, 'delete');

  // ── State ──
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedReglamento, setSelectedReglamento] = useState<Reglamento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reglamento | null>(null);

  // ── Data ──
  const { data: reglamentos = [], isLoading } = useReglamentos();
  const { data: estadisticas } = useReglamentosEstadisticas();
  const deleteMutation = useDeleteReglamento();

  // ── Filtered data ──
  const filteredReglamentos = useMemo(() => {
    if (!search.trim()) return reglamentos;
    const term = search.toLowerCase();
    return reglamentos.filter(
      (r) =>
        r.codigo.toLowerCase().includes(term) ||
        r.nombre.toLowerCase().includes(term) ||
        r.tipo_nombre.toLowerCase().includes(term)
    );
  }, [reglamentos, search]);

  // ── Handlers ──
  const handleCreate = () => {
    setSelectedReglamento(null);
    setShowFormModal(true);
  };

  const handleEdit = (reglamento: Reglamento) => {
    setSelectedReglamento(reglamento);
    setShowFormModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Error handling via mutation onError (toast)
    }
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setSelectedReglamento(null);
  };

  // ── Loading ──
  if (isLoading) {
    return <BrandedSkeleton lines={8} />;
  }

  // ── Stats ──
  const stats = [
    {
      label: 'Total',
      value: estadisticas?.total ?? reglamentos.length,
      color: 'text-gray-900 dark:text-gray-100',
      bg: 'bg-gray-50 dark:bg-gray-800',
    },
    {
      label: 'Vigentes',
      value: estadisticas?.por_estado?.vigente ?? 0,
      color: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'En revision',
      value: estadisticas?.por_estado?.en_revision ?? 0,
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'Obsoletos',
      value: estadisticas?.por_estado?.obsoleto ?? 0,
      color: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg ${stat.bg} px-4 py-3 border border-gray-200 dark:border-gray-700`}
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <SectionToolbar
        title="Reglamentos Internos"
        count={filteredReglamentos.length}
        searchable
        searchValue={search}
        searchPlaceholder="Buscar reglamento..."
        onSearchChange={setSearch}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo reglamento',
                onClick: handleCreate,
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {/* Table / Content */}
      <Card padding="none">
        {filteredReglamentos.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title="Sin reglamentos internos"
            description="No se han registrado reglamentos internos. Comience creando el primero."
            action={
              canCreate
                ? {
                    label: 'Crear reglamento',
                    onClick: handleCreate,
                    icon: <Plus className="w-4 h-4" />,
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Codigo
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    Version
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    Vigencia
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                    Aplicabilidad
                  </th>
                  {(canEdit || canDelete) && (
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReglamentos.map((reglamento) => (
                  <tr
                    key={reglamento.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                          {reglamento.codigo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {reglamento.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600 dark:text-gray-400">
                        {reglamento.tipo_nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={estadoBadgeVariant[reglamento.estado] ?? 'gray'} size="sm">
                        {reglamento.estado_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-600 dark:text-gray-400">
                        v{reglamento.version_actual}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-600 dark:text-gray-400">
                        {reglamento.fecha_vigencia
                          ? new Date(reglamento.fecha_vigencia).toLocaleDateString('es-CO')
                          : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {reglamento.aplica_sst && (
                          <Badge variant="info" size="sm">
                            SST
                          </Badge>
                        )}
                        {reglamento.aplica_ambiental && (
                          <Badge variant="success" size="sm">
                            Ambiental
                          </Badge>
                        )}
                        {reglamento.aplica_calidad && (
                          <Badge variant="primary" size="sm">
                            Calidad
                          </Badge>
                        )}
                        {reglamento.aplica_pesv && (
                          <Badge variant="warning" size="sm">
                            PESV
                          </Badge>
                        )}
                        {!reglamento.aplica_sst &&
                          !reglamento.aplica_ambiental &&
                          !reglamento.aplica_calidad &&
                          !reglamento.aplica_pesv && (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                      </div>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3 text-right">
                        <ActionButtons
                          module={Modules.FUNDACION}
                          section={Sections.REGLAMENTO_INTERNO}
                          onEdit={() => handleEdit(reglamento)}
                          onDelete={() => setDeleteTarget(reglamento)}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <ReglamentoFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        reglamento={selectedReglamento}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar reglamento"
        message={`Esta seguro de eliminar el reglamento "${deleteTarget?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
