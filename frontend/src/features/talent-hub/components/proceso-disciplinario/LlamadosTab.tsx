/**
 * LlamadosTab - CRUD de llamados de atencion
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
import { AlertTriangle, Plus, Pencil, Trash2, CheckCircle, CircleDashed } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useLlamadosAtencion,
  useDeleteLlamadoAtencion,
  useRegistrarFirmaLlamado,
} from '../../hooks/useProcesoDisciplinario';
import { tipoLlamadoOptions } from '../../types';
import type { LlamadoAtencion } from '../../types';
import { LlamadoFormModal } from './LlamadoFormModal';

const TIPO_OPTIONS = [{ value: '', label: 'Todos los tipos' }, ...tipoLlamadoOptions];

export const LlamadosTab = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.CASOS_DISCIPLINARIOS, 'create');

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [selectedLlamado, setSelectedLlamado] = useState<LlamadoAtencion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LlamadoAtencion | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: llamados, isLoading } = useLlamadosAtencion();
  const deleteMutation = useDeleteLlamadoAtencion();
  const registrarFirmaMutation = useRegistrarFirmaLlamado();

  const filtered = useMemo(() => {
    if (!llamados) return [];
    return llamados.filter((l) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !l.colaborador_nombre.toLowerCase().includes(term) &&
          !l.tipo_falta_nombre.toLowerCase().includes(term)
        )
          return false;
      }
      if (tipoFilter && l.tipo !== tipoFilter) return false;
      return true;
    });
  }, [llamados, searchTerm, tipoFilter]);

  const handleCreate = () => {
    setSelectedLlamado(null);
    setIsFormOpen(true);
  };

  const handleEdit = (llamado: LlamadoAtencion) => {
    setSelectedLlamado(llamado);
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
            <AlertTriangle className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Llamados de Atencion"
        description="Registro de llamados verbales y escritos"
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
            {canCreate && (
              <Button variant="primary" size="sm" onClick={handleCreate}>
                <Plus size={16} className="mr-1" />
                Registrar Llamado
              </Button>
            )}
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando llamados...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<AlertTriangle className="h-12 w-12 text-gray-300" />}
              title="Sin llamados de atencion"
              description={
                searchTerm || tipoFilter
                  ? 'No se encontraron llamados con los filtros aplicados.'
                  : 'Registra el primer llamado de atencion.'
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
                    Falta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha Hechos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Firmado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha Llamado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((llamado) => (
                  <tr
                    key={llamado.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {llamado.colaborador_nombre}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={llamado.tipo === 'escrito' ? 'warning' : 'info'} size="sm">
                        {llamado.tipo === 'verbal' ? 'Verbal' : 'Escrito'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {llamado.tipo_falta_nombre || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(llamado.fecha_falta).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      {llamado.firmado_colaborador ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-xs">Firmado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <CircleDashed size={16} />
                          <span className="text-xs">Pendiente</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(llamado.fecha_llamado).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!llamado.firmado_colaborador && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => registrarFirmaMutation.mutate(llamado.id)}
                            title="Registrar Firma"
                            className="text-green-500 hover:text-green-700"
                          >
                            <CheckCircle size={16} />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(llamado)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(llamado)}
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
            Mostrando {filtered.length} de {llamados?.length || 0} llamados
          </div>
        )}
      </Card>

      <LlamadoFormModal
        llamado={selectedLlamado}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedLlamado(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Llamado"
        message={`¿Estas seguro de eliminar este llamado de atencion? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
