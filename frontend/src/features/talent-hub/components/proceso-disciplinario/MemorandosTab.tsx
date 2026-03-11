/**
 * MemorandosTab - CRUD de memorandos y sanciones
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
import { BaseModal } from '@/components/modals/BaseModal';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Send,
  FileSignature,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  useMemorandos,
  useDeleteMemorando,
  useNotificarMemorando,
  useRegistrarApelacion,
} from '../../hooks/useProcesoDisciplinario';
import { tipoSancionOptions } from '../../types';
import type { Memorando, RegistrarApelacionData } from '../../types';
import { MemorandoFormModal } from './MemorandoFormModal';

const SANCION_OPTIONS = [{ value: '', label: 'Todas las sanciones' }, ...tipoSancionOptions];

const SANCION_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  amonestacion: 'warning',
  suspension: 'danger',
  multa: 'warning',
  terminacion_justa_causa: 'danger',
};

export const MemorandosTab = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.CASOS_DISCIPLINARIOS, 'create');

  const [searchTerm, setSearchTerm] = useState('');
  const [sancionFilter, setSancionFilter] = useState('');
  const [selectedMemorando, setSelectedMemorando] = useState<Memorando | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Memorando | null>(null);

  // Modal apelacion
  const [apelacionModal, setApelacionModal] = useState<Memorando | null>(null);
  const [apelacionText, setApelacionText] = useState('');

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: memorandos, isLoading } = useMemorandos();
  const deleteMutation = useDeleteMemorando();
  const notificarMutation = useNotificarMemorando();
  const apelacionMutation = useRegistrarApelacion();

  const filtered = useMemo(() => {
    if (!memorandos) return [];
    return memorandos.filter((m) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !m.numero_memorando.toLowerCase().includes(term) &&
          !m.colaborador_nombre.toLowerCase().includes(term) &&
          !m.tipo_falta_nombre.toLowerCase().includes(term)
        )
          return false;
      }
      if (sancionFilter && m.sancion_aplicada !== sancionFilter) return false;
      return true;
    });
  }, [memorandos, searchTerm, sancionFilter]);

  const handleCreate = () => {
    setSelectedMemorando(null);
    setIsFormOpen(true);
  };

  const handleEdit = (memorando: Memorando) => {
    setSelectedMemorando(memorando);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleRegistrarApelacion = async () => {
    if (!apelacionModal) return;
    const data: RegistrarApelacionData = {
      apelacion: apelacionText,
    };
    await apelacionMutation.mutateAsync({ id: apelacionModal.id, data });
    setApelacionModal(null);
    setApelacionText('');
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <FileText className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Memorandos"
        description="Sanciones formales y memorandos disciplinarios"
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
              value={sancionFilter}
              onChange={(e) => setSancionFilter(e.target.value)}
              options={SANCION_OPTIONS}
              className="w-44"
            />
            {canCreate && (
              <Button variant="primary" size="sm" onClick={handleCreate}>
                <Plus size={16} className="mr-1" />
                Crear Memorando
              </Button>
            )}
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando memorandos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<FileText className="h-12 w-12 text-gray-300" />}
              title="Sin memorandos"
              description={
                searchTerm || sancionFilter
                  ? 'No se encontraron memorandos con los filtros aplicados.'
                  : 'Crea el primer memorando disciplinario.'
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
                    Falta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Sancion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Dias Susp.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Apelado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((memo) => (
                  <tr
                    key={memo.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">
                      {memo.numero_memorando}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {memo.colaborador_nombre}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {memo.tipo_falta_nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(memo.fecha_memorando).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={SANCION_BADGE[memo.sancion_aplicada] || 'gray'} size="sm">
                        {tipoSancionOptions.find((o) => o.value === memo.sancion_aplicada)?.label ||
                          memo.sancion_aplicada}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">
                      {memo.dias_suspension || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {memo.apelacion ? (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <CheckCircle size={16} />
                          <span className="text-xs">Si</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <XCircle size={16} />
                          <span className="text-xs">No</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!memo.notificado && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => notificarMutation.mutate(memo.id)}
                            title="Notificar"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Send size={16} />
                          </Button>
                        )}
                        {!memo.apelacion && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setApelacionModal(memo)}
                            title="Registrar Apelacion"
                            className="text-purple-500 hover:text-purple-700"
                          >
                            <FileSignature size={16} />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(memo)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(memo)}
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
            Mostrando {filtered.length} de {memorandos?.length || 0} memorandos
          </div>
        )}
      </Card>

      <MemorandoFormModal
        memorando={selectedMemorando}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedMemorando(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Memorando"
        message={`¿Estas seguro de eliminar el memorando "${deleteTarget?.numero_memorando}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Modal Registrar Apelacion */}
      <BaseModal
        isOpen={!!apelacionModal}
        onClose={() => setApelacionModal(null)}
        title="Registrar Apelacion del Colaborador"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setApelacionModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleRegistrarApelacion}
              disabled={apelacionMutation.isPending}
            >
              {apelacionMutation.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Apelacion del Colaborador *
            </label>
            <Textarea
              value={apelacionText}
              onChange={(e) => setApelacionText(e.target.value)}
              placeholder="Registro de la apelacion presentada por el colaborador contra la sancion impuesta..."
              rows={6}
            />
          </div>
        </div>
      </BaseModal>
    </div>
  );
};
