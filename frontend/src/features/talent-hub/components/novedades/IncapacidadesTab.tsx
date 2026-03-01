/**
 * IncapacidadesTab - CRUD de incapacidades
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { Stethoscope, Plus, Pencil, Trash2, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import {
  useIncapacidades,
  useDeleteIncapacidad,
  useAprobarIncapacidad,
  useRechazarIncapacidad,
  useRadicarCobroIncapacidad,
} from '../../hooks/useNovedades';
import type { Incapacidad } from '../../types';
import { estadoIncapacidadOptions } from '../../types';
import { IncapacidadFormModal } from './IncapacidadFormModal';

const ESTADO_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...estadoIncapacidadOptions];

const ESTADO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  pendiente: 'warning',
  aprobada: 'info',
  en_cobro: 'info',
  pagada: 'success',
  rechazada: 'danger',
};

export const IncapacidadesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedIncapacidad, setSelectedIncapacidad] = useState<Incapacidad | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Incapacidad | null>(null);
  const [approveTarget, setApproveTarget] = useState<Incapacidad | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Incapacidad | null>(null);
  const [rejectObservations, setRejectObservations] = useState('');
  const [radicarTarget, setRadicarTarget] = useState<Incapacidad | null>(null);
  const [fechaRadicacion, setFechaRadicacion] = useState('');

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: incapacidades, isLoading } = useIncapacidades();
  const deleteMutation = useDeleteIncapacidad();
  const aprobarMutation = useAprobarIncapacidad();
  const rechazarMutation = useRechazarIncapacidad();
  const radicarMutation = useRadicarCobroIncapacidad();

  const filtered = useMemo(() => {
    if (!incapacidades) return [];
    return incapacidades.filter((inc) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !inc.numero_incapacidad.toLowerCase().includes(term) &&
          !inc.colaborador_nombre.toLowerCase().includes(term) &&
          !inc.tipo_nombre.toLowerCase().includes(term)
        )
          return false;
      }
      if (estadoFilter && inc.estado !== estadoFilter) return false;
      return true;
    });
  }, [incapacidades, searchTerm, estadoFilter]);

  const handleCreate = () => {
    setSelectedIncapacidad(null);
    setIsFormOpen(true);
  };

  const handleEdit = (inc: Incapacidad) => {
    setSelectedIncapacidad(inc);
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

  const confirmRadicar = async () => {
    if (!radicarTarget || !fechaRadicacion) return;
    await radicarMutation.mutateAsync({
      id: radicarTarget.id,
      fecha_radicacion_cobro: fechaRadicacion,
    });
    setRadicarTarget(null);
    setFechaRadicacion('');
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Stethoscope className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Incapacidades"
        description="Registro y seguimiento de incapacidades laborales"
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
              Registrar
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando incapacidades...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Stethoscope className="h-12 w-12 text-gray-300" />}
              title="Sin incapacidades"
              description={
                searchTerm || estadoFilter
                  ? 'No se encontraron incapacidades con los filtros aplicados.'
                  : 'Registra la primera incapacidad.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Numero
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
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
                    EPS/ARL
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
                {filtered.map((inc) => (
                  <tr
                    key={inc.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">
                      {inc.numero_incapacidad}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {inc.colaborador_nombre}
                      </p>
                      {inc.es_prorroga && (
                        <Badge variant="gray" size="sm" className="mt-1">
                          Prorroga
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{inc.tipo_nombre}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(inc.fecha_inicio).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(inc.fecha_fin).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {inc.dias_incapacidad}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {inc.eps_arl}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[inc.estado] || 'gray'} size="sm">
                        {estadoIncapacidadOptions.find((o) => o.value === inc.estado)?.label ||
                          inc.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {inc.estado === 'pendiente' && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setApproveTarget(inc)}
                              title="Aprobar"
                              className="text-green-500 hover:text-green-700"
                            >
                              <CheckCircle size={16} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setRejectTarget(inc)}
                              title="Rechazar"
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}
                        {inc.estado === 'aprobada' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRadicarTarget(inc)}
                            title="Radicar Cobro"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <DollarSign size={16} />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(inc)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(inc)}
                          title="Eliminar"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
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
            Mostrando {filtered.length} de {incapacidades?.length || 0} incapacidades
          </div>
        )}
      </Card>

      <IncapacidadFormModal
        incapacidad={selectedIncapacidad}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedIncapacidad(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Incapacidad"
        message={`¿Estas seguro de eliminar la incapacidad "${deleteTarget?.numero_incapacidad}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!approveTarget}
        title="Aprobar Incapacidad"
        message={`¿Estas seguro de aprobar la incapacidad "${approveTarget?.numero_incapacidad}"?`}
        confirmText="Aprobar"
        variant="info"
        isLoading={aprobarMutation.isPending}
        onConfirm={confirmApprove}
        onClose={() => setApproveTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!rejectTarget}
        title="Rechazar Incapacidad"
        message={`¿Por que rechazas la incapacidad "${rejectTarget?.numero_incapacidad}"?`}
        confirmText="Rechazar"
        variant="danger"
        isLoading={rechazarMutation.isPending}
        onConfirm={confirmReject}
        onClose={() => {
          setRejectTarget(null);
          setRejectObservations('');
        }}
      >
        <Textarea
          value={rejectObservations}
          onChange={(e) => setRejectObservations(e.target.value)}
          placeholder="Observaciones (obligatorio)"
          rows={3}
          required
        />
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!radicarTarget}
        title="Radicar Cobro"
        message={`Radica el cobro de la incapacidad "${radicarTarget?.numero_incapacidad}". Ingresa la fecha de radicacion:`}
        confirmText="Radicar"
        variant="info"
        isLoading={radicarMutation.isPending}
        onConfirm={confirmRadicar}
        onClose={() => {
          setRadicarTarget(null);
          setFechaRadicacion('');
        }}
      >
        <Input
          type="date"
          value={fechaRadicacion}
          onChange={(e) => setFechaRadicacion(e.target.value)}
          required
        />
      </ConfirmDialog>
    </div>
  );
};
