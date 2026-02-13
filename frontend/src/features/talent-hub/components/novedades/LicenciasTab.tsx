/**
 * LicenciasTab - CRUD de licencias
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
import { FileCheck, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  useLicencias,
  useDeleteLicencia,
  useAprobarLicencia,
  useRechazarLicencia,
} from '../../hooks/useNovedades';
import type { Licencia } from '../../types';
import { estadoLicenciaOptions, categoriaLicenciaOptions } from '../../types';
import { LicenciaFormModal } from './LicenciaFormModal';

const ESTADO_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...estadoLicenciaOptions];

const ESTADO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  solicitada: 'warning',
  aprobada: 'success',
  rechazada: 'danger',
  cancelada: 'gray',
};

const CATEGORIA_BADGE: Record<string, 'gray' | 'info' | 'success'> = {
  remunerada: 'success',
  no_remunerada: 'gray',
  legal: 'info',
};

export const LicenciasTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedLicencia, setSelectedLicencia] = useState<Licencia | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Licencia | null>(null);
  const [approveTarget, setApproveTarget] = useState<Licencia | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Licencia | null>(null);
  const [rejectObservations, setRejectObservations] = useState('');

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: licencias, isLoading } = useLicencias();
  const deleteMutation = useDeleteLicencia();
  const aprobarMutation = useAprobarLicencia();
  const rechazarMutation = useRechazarLicencia();

  const filtered = useMemo(() => {
    if (!licencias) return [];
    return licencias.filter((lic) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !lic.colaborador_nombre.toLowerCase().includes(term) &&
          !lic.tipo_nombre.toLowerCase().includes(term)
        )
          return false;
      }
      if (estadoFilter && lic.estado !== estadoFilter) return false;
      return true;
    });
  }, [licencias, searchTerm, estadoFilter]);

  const handleCreate = () => {
    setSelectedLicencia(null);
    setIsFormOpen(true);
  };

  const handleEdit = (lic: Licencia) => {
    setSelectedLicencia(lic);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    await aprobarMutation.mutateAsync({ id: approveTarget.id });
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
            <FileCheck className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Licencias"
        description="Solicitudes de licencias remuneradas y no remuneradas"
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
            <p className="mt-3 text-sm text-gray-500">Cargando licencias...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<FileCheck className="h-12 w-12 text-gray-300" />}
              title="Sin licencias"
              description={
                searchTerm || estadoFilter
                  ? 'No se encontraron licencias con los filtros aplicados.'
                  : 'Registra la primera solicitud de licencia.'
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
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha Inicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha Fin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Dias
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Aprobado Por
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((lic) => (
                  <tr
                    key={lic.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {lic.colaborador_nombre}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{lic.tipo_nombre}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CATEGORIA_BADGE[lic.tipo_categoria] || 'gray'} size="sm">
                        {
                          categoriaLicenciaOptions.find((o) => o.value === lic.tipo_categoria)
                            ?.label
                        }
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(lic.fecha_inicio).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(lic.fecha_fin).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {lic.dias_solicitados}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[lic.estado] || 'gray'} size="sm">
                        {estadoLicenciaOptions.find((o) => o.value === lic.estado)?.label ||
                          lic.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {lic.aprobado_por_nombre || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lic.estado === 'solicitada' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setApproveTarget(lic)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/20"
                              title="Aprobar"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(lic)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                              title="Rechazar"
                            >
                              <XCircle size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(lic)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(lic)}
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
            Mostrando {filtered.length} de {licencias?.length || 0} licencias
          </div>
        )}
      </Card>

      <LicenciaFormModal
        licencia={selectedLicencia}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedLicencia(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Licencia"
        message={`¿Estas seguro de eliminar la licencia de "${deleteTarget?.colaborador_nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!approveTarget}
        title="Aprobar Licencia"
        message={`¿Estas seguro de aprobar la licencia de "${approveTarget?.colaborador_nombre}"?`}
        confirmText="Aprobar"
        variant="success"
        isLoading={aprobarMutation.isPending}
        onConfirm={confirmApprove}
        onClose={() => setApproveTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!rejectTarget}
        title="Rechazar Licencia"
        message={`¿Por que rechazas la licencia de "${rejectTarget?.colaborador_nombre}"?`}
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
