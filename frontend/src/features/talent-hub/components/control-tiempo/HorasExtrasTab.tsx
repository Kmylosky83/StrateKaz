/**
 * HorasExtrasTab - Solicitudes y aprobaciones de horas extras
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { Timer, Plus, CheckCircle, XCircle } from 'lucide-react';
import {
  useHorasExtras,
  useAprobarHoraExtra,
  useRechazarHoraExtra,
} from '../../hooks/useControlTiempo';
import type { EstadoHoraExtra, TipoHoraExtra } from '../../types';
import { estadoHoraExtraOptions, tipoHoraExtraOptions } from '../../types/controlTiempo.types';
import { HoraExtraFormModal } from './HoraExtraFormModal';
import { RechazarHoraExtraModal } from './RechazarHoraExtraModal';

const ESTADO_BADGE: Record<EstadoHoraExtra, 'warning' | 'success' | 'danger'> = {
  pendiente: 'warning',
  aprobada: 'success',
  rechazada: 'danger',
};

export const HorasExtrasTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rechazarId, setRechazarId] = useState<number | null>(null);
  const [aprobarId, setAprobarId] = useState<number | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: horasExtras, isLoading } = useHorasExtras({
    estado: (estadoFilter as EstadoHoraExtra | undefined) || undefined,
    tipo: (tipoFilter as TipoHoraExtra | undefined) || undefined,
  });

  const aprobarMutation = useAprobarHoraExtra();
  const rechazarMutation = useRechazarHoraExtra();

  const filtered = useMemo(() => {
    if (!horasExtras) return [];
    return horasExtras.filter((h) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!h.colaborador_nombre.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [horasExtras, searchTerm]);

  const handleAprobar = () => {
    if (!aprobarId) return;
    aprobarMutation.mutate(aprobarId, {
      onSuccess: () => setAprobarId(null),
    });
  };

  const handleRechazar = (motivo: string) => {
    if (!rechazarId) return;
    rechazarMutation.mutate(
      { id: rechazarId, data: { motivo } },
      { onSuccess: () => setRechazarId(null) }
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Timer className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Horas Extras"
        description="Solicitudes y aprobaciones de horas extraordinarias (Ley 2466/2025)"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              options={[{ value: '', label: 'Todos los tipos' }, ...tipoHoraExtraOptions]}
              className="w-48"
            />
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              options={[{ value: '', label: 'Todos los estados' }, ...estadoHoraExtraOptions]}
              className="w-40"
            />
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus size={16} className="mr-1" />
              Nueva Solicitud
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando solicitudes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Timer className="h-12 w-12 text-gray-300" />}
              title="Sin solicitudes"
              description={
                searchTerm || estadoFilter || tipoFilter
                  ? 'No se encontraron solicitudes con los filtros aplicados.'
                  : 'No hay solicitudes de horas extras.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Horario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Horas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Recargo
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
                {filtered.map((hora) => (
                  <tr
                    key={hora.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(hora.fecha).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {hora.colaborador_nombre}
                      </p>
                      {hora.justificacion && (
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {hora.justificacion}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">
                        {hora.tipo_display || hora.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {hora.hora_inicio.slice(0, 5)} - {hora.hora_fin.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {Number(hora.horas_trabajadas).toFixed(2)}h
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="warning" size="sm">
                        {((Number(hora.factor_recargo) - 1) * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[hora.estado]} size="sm">
                        {hora.estado_display || hora.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {hora.estado === 'pendiente' && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setAprobarId(hora.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/20"
                            title="Aprobar"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRechazarId(hora.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                            title="Rechazar"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
            Mostrando {filtered.length} de {horasExtras?.length || 0} solicitudes
          </div>
        )}
      </Card>

      <HoraExtraFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      {/* Modal de rechazo */}
      <RechazarHoraExtraModal
        isOpen={rechazarId !== null}
        isLoading={rechazarMutation.isPending}
        onClose={() => setRechazarId(null)}
        onConfirm={handleRechazar}
      />

      {/* Diálogo de confirmación de aprobación */}
      <ConfirmDialog
        isOpen={aprobarId !== null}
        title="Aprobar horas extras"
        message="¿Confirma que desea aprobar esta solicitud de horas extras?"
        confirmText="Aprobar"
        onConfirm={handleAprobar}
        onClose={() => setAprobarId(null)}
        isLoading={aprobarMutation.isPending}
        variant="info"
      />
    </div>
  );
};
