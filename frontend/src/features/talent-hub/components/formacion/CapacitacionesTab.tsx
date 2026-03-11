/**
 * CapacitacionesTab - CRUD de capacitaciones
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
import { GraduationCap, Plus, Pencil, Trash2, Clock, Send } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useCapacitaciones,
  useDeleteCapacitacion,
  usePublicarCapacitacion,
} from '../../hooks/useFormacionReinduccion';
import type { Capacitacion } from '../../types';
import { CapacitacionFormModal } from './CapacitacionFormModal';

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'induccion', label: 'Induccion' },
  { value: 'reinduccion', label: 'Reinduccion' },
  { value: 'tecnica', label: 'Tecnica' },
  { value: 'habilidades_blandas', label: 'Habilidades Blandas' },
  { value: 'sst', label: 'SST' },
  { value: 'calidad', label: 'Calidad' },
  { value: 'ambiente', label: 'Ambiente' },
  { value: 'pesv', label: 'PESV' },
  { value: 'liderazgo', label: 'Liderazgo' },
  { value: 'normativa', label: 'Normativa' },
  { value: 'otro', label: 'Otro' },
];

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'publicada', label: 'Publicada' },
  { value: 'en_ejecucion', label: 'En Ejecucion' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const ESTADO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  borrador: 'gray',
  publicada: 'info',
  en_ejecucion: 'warning',
  finalizada: 'success',
  cancelada: 'danger',
};

const MODALIDAD_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  asincronica: 'Asincronica',
  mixta: 'Mixta',
  outdoor: 'Outdoor',
};

export const CapacitacionesTab = () => {
  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.CAPACITACIONES, 'create');
  const canEdit = canDo(Modules.TALENT_HUB, Sections.CAPACITACIONES, 'edit');
  const canDelete = canDo(Modules.TALENT_HUB, Sections.CAPACITACIONES, 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedCap, setSelectedCap] = useState<Capacitacion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Capacitacion | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: capacitaciones, isLoading } = useCapacitaciones();
  const deleteMutation = useDeleteCapacitacion();
  const publicarMutation = usePublicarCapacitacion();

  const filtered = useMemo(() => {
    if (!capacitaciones) return [];
    return capacitaciones.filter((c) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!c.codigo.toLowerCase().includes(term) && !c.nombre.toLowerCase().includes(term))
          return false;
      }
      if (tipoFilter && c.tipo_capacitacion !== tipoFilter) return false;
      if (estadoFilter && c.estado !== estadoFilter) return false;
      return true;
    });
  }, [capacitaciones, searchTerm, tipoFilter, estadoFilter]);

  const handleCreate = () => {
    setSelectedCap(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cap: Capacitacion) => {
    setSelectedCap(cap);
    setIsFormOpen(true);
  };

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
            <GraduationCap className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Capacitaciones"
        description="Cursos, talleres y programas de formacion"
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
            {canCreate && (
              <Button variant="primary" size="sm" onClick={handleCreate}>
                <Plus size={16} className="mr-1" />
                Nueva
              </Button>
            )}
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando capacitaciones...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<GraduationCap className="h-12 w-12 text-gray-300" />}
              title="Sin capacitaciones"
              description={
                searchTerm || tipoFilter || estadoFilter
                  ? 'No se encontraron capacitaciones con los filtros aplicados.'
                  : 'Crea la primera capacitacion.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Codigo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Modalidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Duracion
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
                {filtered.map((cap) => (
                  <tr
                    key={cap.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">
                      {cap.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cap.nombre}
                      </p>
                      {cap.instructor_nombre || cap.instructor_externo ? (
                        <p className="text-xs text-gray-500">
                          {cap.instructor_nombre || cap.instructor_externo}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray" size="sm">
                        {cap.tipo_display || cap.tipo_capacitacion}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {MODALIDAD_LABELS[cap.modalidad] || cap.modalidad}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <Clock size={14} className="text-gray-400" />
                        {cap.duracion_horas}h / {cap.numero_sesiones} ses.
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[cap.estado] || 'gray'} size="sm">
                        {cap.estado_display || cap.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && cap.estado === 'borrador' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => publicarMutation.mutate(cap.id)}
                            title="Publicar"
                            className="text-green-500 hover:text-green-700"
                          >
                            <Send size={16} />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cap)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(cap)}
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
            Mostrando {filtered.length} de {capacitaciones?.length || 0} capacitaciones
          </div>
        )}
      </Card>

      <CapacitacionFormModal
        capacitacion={selectedCap}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCap(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Capacitacion"
        message={`¿Estas seguro de eliminar "${deleteTarget?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
