/**
 * ModulosTab - CRUD de modulos de induccion
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
import { BookOpen, Plus, Pencil, Trash2, Clock, CheckCircle } from 'lucide-react';
import { useModulosInduccion, useDeleteModuloInduccion } from '../../hooks/useOnboardingInduccion';
import type { ModuloInduccion, TipoModuloInduccion } from '../../types';
import { ModuloFormModal } from './ModuloFormModal';

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'induccion_general', label: 'Induccion General' },
  { value: 'induccion_especifica', label: 'Induccion Especifica' },
  { value: 'reinduccion', label: 'Reinduccion' },
  { value: 'sst', label: 'SST' },
  { value: 'calidad', label: 'Calidad' },
  { value: 'ambiente', label: 'Ambiente' },
  { value: 'etica', label: 'Etica' },
  { value: 'pesv', label: 'PESV' },
  { value: 'otro', label: 'Otro' },
];

const FORMATO_LABELS: Record<string, string> = {
  video: 'Video',
  presentacion: 'Presentacion',
  documento: 'Documento',
  quiz: 'Quiz',
  actividad: 'Actividad',
  presencial: 'Presencial',
  mixto: 'Mixto',
};

export const ModulosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [selectedModulo, setSelectedModulo] = useState<ModuloInduccion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ModuloInduccion | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: modulos, isLoading } = useModulosInduccion();
  const deleteMutation = useDeleteModuloInduccion();

  const filtered = useMemo(() => {
    if (!modulos) return [];
    return modulos.filter((m) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!m.codigo.toLowerCase().includes(term) && !m.nombre.toLowerCase().includes(term))
          return false;
      }
      if (tipoFilter && m.tipo_modulo !== tipoFilter) return false;
      return true;
    });
  }, [modulos, searchTerm, tipoFilter]);

  const handleCreate = () => {
    setSelectedModulo(null);
    setIsFormOpen(true);
  };

  const handleEdit = (modulo: ModuloInduccion) => {
    setSelectedModulo(modulo);
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
            <BookOpen className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Modulos de Induccion"
        description="Contenido configurable para procesos de induccion y reinduccion"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar por codigo, nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56"
            />
            <Select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              options={TIPO_OPTIONS}
              className="w-44"
            />
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus size={16} className="mr-1" />
              Nuevo Modulo
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando modulos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<BookOpen className="h-12 w-12 text-gray-300" />}
              title="Sin modulos"
              description={
                searchTerm || tipoFilter
                  ? 'No se encontraron modulos con los filtros aplicados.'
                  : 'Crea el primer modulo de induccion.'
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
                    Formato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Duracion
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Obligatorio
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Evaluacion
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((modulo) => (
                  <tr
                    key={modulo.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">
                      {modulo.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {modulo.nombre}
                      </p>
                      {modulo.descripcion && (
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {modulo.descripcion}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray" size="sm">
                        {modulo.tipo_modulo_display || modulo.tipo_modulo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {FORMATO_LABELS[modulo.formato_contenido] || modulo.formato_contenido}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <Clock size={14} className="text-gray-400" />
                        {modulo.duracion_minutos} min
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {modulo.es_obligatorio ? (
                        <CheckCircle size={16} className="mx-auto text-green-500" />
                      ) : (
                        <span className="text-xs text-gray-400">Opcional</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {modulo.requiere_evaluacion ? (
                        <Badge variant="info" size="sm">
                          Min {modulo.nota_minima_aprobacion}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEdit(modulo)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(modulo)}
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
            Mostrando {filtered.length} de {modulos?.length || 0} modulos
          </div>
        )}
      </Card>

      <ModuloFormModal
        modulo={selectedModulo}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedModulo(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Modulo"
        message={`¿Estas seguro de eliminar el modulo "${deleteTarget?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
