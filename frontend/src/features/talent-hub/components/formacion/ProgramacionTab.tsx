/**
 * ProgramacionTab - Calendario de sesiones de capacitacion
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
import { CalendarDays, Plus, Trash2, MapPin, Video, Users } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { useProgramaciones, useDeleteProgramacion } from '../../hooks/useFormacionReinduccion';
import type { ProgramacionCapacitacion } from '../../types';
import { ProgramacionFormModal } from './ProgramacionFormModal';

const ESTADO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  programada: 'info',
  confirmada: 'success',
  en_curso: 'warning',
  completada: 'success',
  cancelada: 'danger',
  reprogramada: 'gray',
};

export const ProgramacionTab = () => {
  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.CAPACITACIONES, 'create');
  const canDelete = canDo(Modules.TALENT_HUB, Sections.CAPACITACIONES, 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProgramacionCapacitacion | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: programaciones, isLoading } = useProgramaciones();
  const deleteMutation = useDeleteProgramacion();

  const filtered = useMemo(() => {
    if (!programaciones) return [];
    return programaciones.filter((p) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !(p.capacitacion_nombre || '').toLowerCase().includes(term) &&
          !(p.titulo_sesion || '').toLowerCase().includes(term) &&
          !(p.lugar || '').toLowerCase().includes(term)
        )
          return false;
      }
      if (estadoFilter && p.estado !== estadoFilter) return false;
      return true;
    });
  }, [programaciones, searchTerm, estadoFilter]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <CalendarDays className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Programacion de Sesiones"
        description="Calendario de sesiones de capacitacion"
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
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'programada', label: 'Programada' },
                { value: 'confirmada', label: 'Confirmada' },
                { value: 'en_curso', label: 'En Curso' },
                { value: 'completada', label: 'Completada' },
                { value: 'cancelada', label: 'Cancelada' },
              ]}
              className="w-40"
            />
            {canCreate && (
              <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
                <Plus size={16} className="mr-1" />
                Programar
              </Button>
            )}
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando sesiones...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<CalendarDays className="h-12 w-12 text-gray-300" />}
              title="Sin sesiones programadas"
              description={
                searchTerm || estadoFilter
                  ? 'No se encontraron sesiones con los filtros aplicados.'
                  : 'Programa la primera sesion de capacitacion.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Capacitacion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Sesion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Horario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Lugar
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Inscritos
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
                {filtered.map((prog) => (
                  <tr
                    key={prog.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {prog.capacitacion_nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {prog.titulo_sesion || `Sesion ${prog.numero_sesion}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(prog.fecha).toLocaleDateString('es-CO', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {prog.hora_inicio?.slice(0, 5)} - {prog.hora_fin?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        {prog.enlace_virtual ? (
                          <Video size={14} className="text-blue-500" />
                        ) : (
                          <MapPin size={14} className="text-gray-400" />
                        )}
                        {prog.lugar || 'Virtual'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Users size={14} className="text-gray-400" />
                        <span
                          className={
                            prog.esta_llena
                              ? 'text-red-500 font-medium'
                              : 'text-gray-600 dark:text-gray-300'
                          }
                        >
                          {prog.inscritos}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[prog.estado] || 'gray'} size="sm">
                        {prog.estado_display || prog.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {canDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(prog)}
                            title="Eliminar"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
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
            Mostrando {filtered.length} de {programaciones?.length || 0} sesiones
          </div>
        )}
      </Card>

      <ProgramacionFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Sesion"
        message={`¿Estas seguro de eliminar esta sesion de "${deleteTarget?.capacitacion_nombre}"?`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
