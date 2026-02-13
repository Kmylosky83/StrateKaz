/**
 * PermisosTab - CRUD de permisos
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { Clock, Plus, Pencil, Trash2, CheckCircle, XCircle, Check } from 'lucide-react';
import {
  usePermisos,
  useDeletePermiso,
  useAprobarPermiso,
  useRechazarPermiso,
} from '../../hooks/useNovedades';
import type { Permiso } from '../../types';
import { estadoPermisoOptions, tipoPermisoOptions } from '../../types';
import { PermisoFormModal } from './PermisoFormModal';

const ESTADO_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...estadoPermisoOptions];

const TIPO_OPTIONS = [{ value: '', label: 'Todos los tipos' }, ...tipoPermisoOptions];

const ESTADO_BADGE: Record<string, 'gray' | 'warning' | 'success' | 'danger'> = {
  solicitado: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
};

export const PermisosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [selectedPermiso, setSelectedPermiso] = useState<Permiso | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Permiso | null>(null);
  const [approveTarget, setApproveTarget] = useState<Permiso | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Permiso | null>(null);
  const [rejectObservations, setRejectObservations] = useState('');

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: permisos, isLoading } = usePermisos();
  const deleteMutation = useDeletePermiso();
  const aprobarMutation = useAprobarPermiso();
  const rechazarMutation = useRechazarPermiso();

  const filtered = useMemo(() => {
    if (!permisos) return [];
    return permisos.filter((perm) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!perm.colaborador_nombre.toLowerCase().includes(term)) return false;
      }
      if (estadoFilter && perm.estado !== estadoFilter) return false;
      if (tipoFilter && perm.tipo !== tipoFilter) return false;
      return true;
    });
  }, [permisos, searchTerm, estadoFilter, tipoFilter]);

  const handleCreate = () => {
    setSelectedPermiso(null);
    setIsFormOpen(true);
  };

  const handleEdit = (perm: Permiso) => {
    setSelectedPermiso(perm);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    await aprobarMutation.mutateAsync(approveTarget.id);
    setApproveTarget(null);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    await rechazarMutation.mutateAsync({ id: rejectTarget.id, observaciones: rejectObservations });
    setRejectTarget(null);
    setRejectObservations('');
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Clock className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Permisos"
        description="Solicitudes de permisos personales, medicos y otros"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              options={TIPO_OPTIONS}
              className="w-40"
            />
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              options={ESTADO_OPTIONS}
              className="w-40"
            />
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus size={16} className="mr-1" />
              Solicitar
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando permisos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Clock className="h-12 w-12 text-gray-300" />}
              title="Sin permisos"
              description={
                searchTerm || estadoFilter || tipoFilter
                  ? 'No se encontraron permisos con los filtros aplicados.'
                  : 'Registra el primer permiso.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Hora Salida
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Hora Regreso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Horas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Compensable
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((perm) => (
                  <tr
                    key={perm.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {perm.colaborador_nombre}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(perm.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {perm.hora_salida}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {perm.hora_regreso}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {perm.horas_permiso}h
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray" size="sm">
                        {tipoPermisoOptions.find((o) => o.value === perm.tipo)?.label || perm.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {perm.compensable && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Check size={14} className="text-green-600 dark:text-green-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[perm.estado] || 'gray'} size="sm">
                        {estadoPermisoOptions.find((o) => o.value === perm.estado)?.label ||
                          perm.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {perm.estado === 'solicitado' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setApproveTarget(perm)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/20"
                              title="Aprobar"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(perm)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                              title="Rechazar"
                            >
                              <XCircle size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(perm)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(perm)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
            Mostrando {filtered.length} de {permisos?.length || 0} permisos
          </div>
        )}
      </Card>

      <PermisoFormModal
        permiso={selectedPermiso}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPermiso(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Permiso"
        message={`¿Estas seguro de eliminar el permiso de "${deleteTarget?.colaborador_nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!approveTarget}
        title="Aprobar Permiso"
        message={`¿Estas seguro de aprobar el permiso de "${approveTarget?.colaborador_nombre}"?`}
        confirmText="Aprobar"
        variant="success"
        isLoading={aprobarMutation.isPending}
        onConfirm={confirmApprove}
        onClose={() => setApproveTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!rejectTarget}
        title="Rechazar Permiso"
        message={`¿Por que rechazas el permiso de "${rejectTarget?.colaborador_nombre}"?`}
        confirmText="Rechazar"
        variant="danger"
        isLoading={rechazarMutation.isPending}
        onConfirm={confirmReject}
        onClose={() => {
          setRejectTarget(null);
          setRejectObservations('');
        }}
      >
        <textarea
          value={rejectObservations}
          onChange={(e) => setRejectObservations(e.target.value)}
          placeholder="Observaciones (obligatorio)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          required
        />
      </ConfirmDialog>
    </div>
  );
};
