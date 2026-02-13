/**
 * VacacionesTab - Gestion de periodos y solicitudes de vacaciones
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
import { Palmtree, Plus, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import {
  usePeriodosVacaciones,
  useActualizarAcumulacion,
  useSolicitudesVacaciones,
  useDeleteSolicitudVacaciones,
  useAprobarVacaciones,
  useRechazarVacaciones,
} from '../../hooks/useNovedades';
import type { PeriodoVacaciones, SolicitudVacaciones } from '../../types';
import { estadoVacacionesOptions } from '../../types';
import { SolicitudVacacionesFormModal } from './SolicitudVacacionesFormModal';

const ESTADO_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...estadoVacacionesOptions];

const ESTADO_BADGE: Record<string, 'gray' | 'warning' | 'info' | 'success' | 'danger'> = {
  solicitada: 'warning',
  aprobada: 'info',
  rechazada: 'danger',
  disfrutada: 'success',
  cancelada: 'gray',
};

export const VacacionesTab = () => {
  const [activeSection, setActiveSection] = useState<'periodos' | 'solicitudes'>('periodos');
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudVacaciones | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SolicitudVacaciones | null>(null);
  const [approveTarget, setApproveTarget] = useState<SolicitudVacaciones | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SolicitudVacaciones | null>(null);
  const [rejectObservations, setRejectObservations] = useState('');
  const [updateTarget, setUpdateTarget] = useState<PeriodoVacaciones | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: periodos, isLoading: loadingPeriodos } = usePeriodosVacaciones();
  const { data: solicitudes, isLoading: loadingSolicitudes } = useSolicitudesVacaciones();
  const deleteMutation = useDeleteSolicitudVacaciones();
  const aprobarMutation = useAprobarVacaciones();
  const rechazarMutation = useRechazarVacaciones();
  const actualizarMutation = useActualizarAcumulacion();

  const filteredSolicitudes = useMemo(() => {
    if (!solicitudes) return [];
    return solicitudes.filter((sol) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!sol.colaborador_nombre.toLowerCase().includes(term)) return false;
      }
      if (estadoFilter && sol.estado !== estadoFilter) return false;
      return true;
    });
  }, [solicitudes, searchTerm, estadoFilter]);

  const handleCreate = () => {
    setSelectedSolicitud(null);
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

  const confirmUpdate = async () => {
    if (!updateTarget) return;
    await actualizarMutation.mutateAsync(updateTarget.id);
    setUpdateTarget(null);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Palmtree className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Vacaciones"
        description="Periodos y solicitudes de vacaciones"
        variant="compact"
      />

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1" aria-label="Secciones de vacaciones">
          <button
            type="button"
            onClick={() => setActiveSection('periodos')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeSection === 'periodos'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Periodos de Vacaciones
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('solicitudes')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeSection === 'solicitudes'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Solicitudes
          </button>
        </nav>
      </div>

      {activeSection === 'periodos' ? (
        <Card variant="bordered" padding="none">
          {loadingPeriodos ? (
            <div className="py-16 text-center">
              <Spinner size="lg" className="mx-auto" />
              <p className="mt-3 text-sm text-gray-500">Cargando periodos...</p>
            </div>
          ) : !periodos || periodos.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={<Palmtree className="h-12 w-12 text-gray-300" />}
                title="Sin periodos de vacaciones"
                description="Los periodos se crean automaticamente al registrar colaboradores."
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
                      Fecha Ingreso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Dias Acumulados
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Dias Disfrutados
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Dias Pendientes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ultimo Corte
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {periodos.map((per) => (
                    <tr
                      key={per.id}
                      className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {per.colaborador_nombre}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(per.fecha_ingreso).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {per.dias_acumulados}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {per.dias_disfrutados}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {per.dias_pendientes}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(per.ultimo_corte).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setUpdateTarget(per)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                            title="Actualizar Acumulacion"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            </div>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus size={16} className="mr-1" />
              Nueva Solicitud
            </Button>
          </div>

          <Card variant="bordered" padding="none">
            {loadingSolicitudes ? (
              <div className="py-16 text-center">
                <Spinner size="lg" className="mx-auto" />
                <p className="mt-3 text-sm text-gray-500">Cargando solicitudes...</p>
              </div>
            ) : filteredSolicitudes.length === 0 ? (
              <div className="py-16">
                <EmptyState
                  icon={<Palmtree className="h-12 w-12 text-gray-300" />}
                  title="Sin solicitudes"
                  description={
                    searchTerm || estadoFilter
                      ? 'No se encontraron solicitudes con los filtros aplicados.'
                      : 'Registra la primera solicitud de vacaciones.'
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
                        Fecha Inicio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fecha Fin
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Dias Habiles
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Dias Calendario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Prima
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
                    {filteredSolicitudes.map((sol) => (
                      <tr
                        key={sol.id}
                        className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {sol.colaborador_nombre}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(sol.fecha_inicio).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(sol.fecha_fin).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {sol.dias_habiles}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {sol.dias_calendario}
                        </td>
                        <td className="px-4 py-3">
                          {sol.incluye_prima && (
                            <Badge variant="info" size="sm">
                              Si
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ESTADO_BADGE[sol.estado] || 'gray'} size="sm">
                            {estadoVacacionesOptions.find((o) => o.value === sol.estado)?.label ||
                              sol.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {sol.estado === 'solicitada' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setApproveTarget(sol)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/20"
                                  title="Aprobar"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectTarget(sol)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                                  title="Rechazar"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(sol)}
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

            {!loadingSolicitudes && filteredSolicitudes.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
                Mostrando {filteredSolicitudes.length} de {solicitudes?.length || 0} solicitudes
              </div>
            )}
          </Card>
        </>
      )}

      <SolicitudVacacionesFormModal
        solicitud={selectedSolicitud}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSolicitud(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Solicitud"
        message={`¿Estas seguro de eliminar la solicitud de "${deleteTarget?.colaborador_nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!approveTarget}
        title="Aprobar Vacaciones"
        message={`¿Estas seguro de aprobar las vacaciones de "${approveTarget?.colaborador_nombre}"? Se descontaran ${approveTarget?.dias_habiles} dias del periodo.`}
        confirmText="Aprobar"
        variant="success"
        isLoading={aprobarMutation.isPending}
        onConfirm={confirmApprove}
        onClose={() => setApproveTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!rejectTarget}
        title="Rechazar Vacaciones"
        message={`¿Por que rechazas las vacaciones de "${rejectTarget?.colaborador_nombre}"?`}
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

      <ConfirmDialog
        isOpen={!!updateTarget}
        title="Actualizar Acumulacion"
        message={`¿Actualizar la acumulacion de vacaciones de "${updateTarget?.colaborador_nombre}"? Se recalcularan los dias acumulados hasta la fecha actual.`}
        confirmText="Actualizar"
        variant="info"
        isLoading={actualizarMutation.isPending}
        onConfirm={confirmUpdate}
        onClose={() => setUpdateTarget(null)}
      />
    </div>
  );
};
