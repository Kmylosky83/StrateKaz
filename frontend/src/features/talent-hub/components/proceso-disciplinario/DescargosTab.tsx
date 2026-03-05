/**
 * DescargosTab - CRUD de descargos y citaciones
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
import { Scale, Plus, Pencil, Trash2, FileEdit, Gavel } from 'lucide-react';
import {
  useDescargos,
  useDeleteDescargo,
  useRegistrarDescargo,
  useEmitirDecision,
} from '../../hooks/useProcesoDisciplinario';
import { estadoDescargoOptions, decisionDescargoOptions } from '../../types';
import type { Descargo, RegistrarDescargoData, EmitirDecisionData } from '../../types';
import { DescargoFormModal } from './DescargoFormModal';

const ESTADO_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...estadoDescargoOptions];

const ESTADO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  citado: 'info',
  realizado: 'warning',
  no_presentado: 'danger',
};

const DECISION_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  pendiente: 'gray',
  absuelto: 'success',
  sancionado: 'danger',
};

export const DescargosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedDescargo, setSelectedDescargo] = useState<Descargo | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Descargo | null>(null);

  // Modals para acciones inline
  const [registrarDescargoModal, setRegistrarDescargoModal] = useState<Descargo | null>(null);
  const [emitirDecisionModal, setEmitirDecisionModal] = useState<Descargo | null>(null);
  const [descargoText, setDescargoText] = useState('');
  const [pruebasText, setPruebasText] = useState('');
  const [testigosText, setTestigosText] = useState('');
  const [decision, setDecision] = useState<string>('absuelto');
  const [justificacion, setJustificacion] = useState('');

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: descargos, isLoading } = useDescargos();
  const deleteMutation = useDeleteDescargo();
  const registrarMutation = useRegistrarDescargo();
  const emitirMutation = useEmitirDecision();

  const filtered = useMemo(() => {
    if (!descargos) return [];
    return descargos.filter((d) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !d.colaborador_nombre.toLowerCase().includes(term) &&
          !d.tipo_falta_nombre.toLowerCase().includes(term)
        )
          return false;
      }
      if (estadoFilter && d.estado !== estadoFilter) return false;
      return true;
    });
  }, [descargos, searchTerm, estadoFilter]);

  const handleCreate = () => {
    setSelectedDescargo(null);
    setIsFormOpen(true);
  };

  const handleEdit = (descargo: Descargo) => {
    setSelectedDescargo(descargo);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleRegistrarDescargo = async () => {
    if (!registrarDescargoModal) return;
    const data: RegistrarDescargoData = {
      descargo_colaborador: descargoText,
      pruebas_presentadas: pruebasText,
      testigos_colaborador: testigosText,
    };
    await registrarMutation.mutateAsync({ id: registrarDescargoModal.id, data });
    setRegistrarDescargoModal(null);
    setDescargoText('');
    setPruebasText('');
    setTestigosText('');
  };

  const handleEmitirDecision = async () => {
    if (!emitirDecisionModal) return;
    const data: EmitirDecisionData = {
      decision: decision as any,
      justificacion_decision: justificacion,
    };
    await emitirMutation.mutateAsync({ id: emitirDecisionModal.id, data });
    setEmitirDecisionModal(null);
    setDecision('absuelto');
    setJustificacion('');
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Scale className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Descargos"
        description="Citaciones y descargos segun Ley 2466/2025"
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
              Crear Citacion
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando descargos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Scale className="h-12 w-12 text-gray-300" />}
              title="Sin descargos"
              description={
                searchTerm || estadoFilter
                  ? 'No se encontraron descargos con los filtros aplicados.'
                  : 'Crea la primera citacion a descargos.'
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
                    Falta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha Citacion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Lugar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Decision
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((descargo) => (
                  <tr
                    key={descargo.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {descargo.colaborador_nombre}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {descargo.tipo_falta_nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(descargo.fecha_citacion).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {descargo.hora_citacion}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {descargo.lugar_citacion}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[descargo.estado] || 'gray'} size="sm">
                        {estadoDescargoOptions.find((o) => o.value === descargo.estado)?.label ||
                          descargo.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={DECISION_BADGE[descargo.decision] || 'gray'} size="sm">
                        {decisionDescargoOptions.find((o) => o.value === descargo.decision)
                          ?.label || descargo.decision}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {descargo.estado === 'citado' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRegistrarDescargoModal(descargo)}
                            title="Registrar Descargo"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FileEdit size={16} />
                          </Button>
                        )}
                        {descargo.estado === 'realizado' && descargo.decision === 'pendiente' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEmitirDecisionModal(descargo)}
                            title="Emitir Decision"
                            className="text-purple-500 hover:text-purple-700"
                          >
                            <Gavel size={16} />
                          </Button>
                        )}
                        {descargo.estado === 'citado' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(descargo)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(descargo)}
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
            Mostrando {filtered.length} de {descargos?.length || 0} descargos
          </div>
        )}
      </Card>

      <DescargoFormModal
        descargo={selectedDescargo}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedDescargo(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Descargo"
        message={`¿Estas seguro de eliminar este descargo? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Modal Registrar Descargo */}
      <BaseModal
        isOpen={!!registrarDescargoModal}
        onClose={() => setRegistrarDescargoModal(null)}
        title="Registrar Descargo del Colaborador"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRegistrarDescargoModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleRegistrarDescargo}
              disabled={registrarMutation.isPending}
            >
              {registrarMutation.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descargo del Colaborador *
            </label>
            <Textarea
              value={descargoText}
              onChange={(e) => setDescargoText(e.target.value)}
              placeholder="Registro de los descargos presentados por el colaborador..."
              rows={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pruebas Presentadas
            </label>
            <Textarea
              value={pruebasText}
              onChange={(e) => setPruebasText(e.target.value)}
              placeholder="Pruebas documentales, testimoniales, etc."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Testigos del Colaborador
            </label>
            <Textarea
              value={testigosText}
              onChange={(e) => setTestigosText(e.target.value)}
              placeholder="Nombres de testigos presentados por el colaborador"
              rows={2}
            />
          </div>
        </div>
      </BaseModal>

      {/* Modal Emitir Decision */}
      <BaseModal
        isOpen={!!emitirDecisionModal}
        onClose={() => setEmitirDecisionModal(null)}
        title="Emitir Decision sobre el Descargo"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEmitirDecisionModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleEmitirDecision}
              disabled={emitirMutation.isPending}
            >
              {emitirMutation.isPending ? 'Guardando...' : 'Emitir Decision'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Decision *
            </label>
            <Select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              options={decisionDescargoOptions}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Justificacion de la Decision *
            </label>
            <Textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="Fundamentos legales y facticos que soportan la decision..."
              rows={6}
            />
          </div>
        </div>
      </BaseModal>
    </div>
  );
};
