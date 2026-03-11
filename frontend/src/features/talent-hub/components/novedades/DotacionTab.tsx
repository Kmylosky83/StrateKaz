/**
 * DotacionTab - Configuracion y entregas de dotacion
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
import { Shirt, Plus, Pencil, Trash2, Settings, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useConfiguracionDotacion,
  useEntregasDotacion,
  useDeleteEntregaDotacion,
} from '../../hooks/useNovedades';
import type { EntregaDotacion } from '../../types';
import { periodoDotacionOptions } from '../../types';
import { EntregaDotacionFormModal } from './EntregaDotacionFormModal';

const PERIODO_OPTIONS = [{ value: '', label: 'Todos los periodos' }, ...periodoDotacionOptions];

export const DotacionTab = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.REGISTRO_NOVEDADES, 'create');

  const [activeSection, setActiveSection] = useState<'config' | 'entregas'>('config');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [anioFilter, setAnioFilter] = useState('');
  const [selectedEntrega, setSelectedEntrega] = useState<EntregaDotacion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EntregaDotacion | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: configs, isLoading: loadingConfig } = useConfiguracionDotacion();
  const { data: entregas, isLoading: loadingEntregas } = useEntregasDotacion();
  const deleteMutation = useDeleteEntregaDotacion();

  const config = configs && configs.length > 0 ? configs[0] : null;

  const filtered = useMemo(() => {
    if (!entregas) return [];
    return entregas.filter((ent) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!ent.colaborador_nombre.toLowerCase().includes(term)) return false;
      }
      if (periodoFilter && ent.periodo !== periodoFilter) return false;
      if (anioFilter && ent.anio !== Number(anioFilter)) return false;
      return true;
    });
  }, [entregas, searchTerm, periodoFilter, anioFilter]);

  const handleCreate = () => {
    setSelectedEntrega(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ent: EntregaDotacion) => {
    setSelectedEntrega(ent);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const currentYear = new Date().getFullYear();
  const anioOptions = [
    { value: '', label: 'Todos los años' },
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear - 1), label: String(currentYear - 1) },
    { value: String(currentYear - 2), label: String(currentYear - 2) },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Shirt className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Dotacion"
        description="Configuracion y entregas de dotacion laboral"
        variant="compact"
      />

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1" aria-label="Secciones de dotacion">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection('config')}
            className={cn(
              '!px-4 !py-2.5 text-sm font-medium border-b-2 transition-all rounded-none',
              activeSection === 'config'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Configuracion
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection('entregas')}
            className={cn(
              '!px-4 !py-2.5 text-sm font-medium border-b-2 transition-all rounded-none',
              activeSection === 'entregas'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Entregas
          </Button>
        </nav>
      </div>

      {activeSection === 'config' ? (
        <Card variant="bordered">
          {loadingConfig ? (
            <div className="py-16 text-center">
              <Spinner size="lg" className="mx-auto" />
              <p className="mt-3 text-sm text-gray-500">Cargando configuracion...</p>
            </div>
          ) : !config ? (
            <EmptyState
              icon={<Settings className="h-12 w-12 text-gray-300" />}
              title="Sin configuracion"
              description="Configura la politica de dotacion de tu empresa."
            />
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Periodos de Entrega
                </h3>
                <div className="flex flex-wrap gap-2">
                  {config.periodos_entrega.map((periodo) => (
                    <Badge key={periodo} variant="info" size="sm">
                      {periodoDotacionOptions.find((o) => o.value === periodo)?.label || periodo}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salario Maximo (SMMLV)
                </h3>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {config.salario_maximo_smmlv}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Items Obligatorios
                </h3>
                <ul className="space-y-1">
                  {config.items_obligatorios.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <Check size={14} className="text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {config.politica_devolucion && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Politica de Devolucion
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.politica_devolucion}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  <Pencil size={16} className="mr-1" />
                  Editar Configuracion
                </Button>
              </div>
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
                value={periodoFilter}
                onChange={(e) => setPeriodoFilter(e.target.value)}
                options={PERIODO_OPTIONS}
                className="w-40"
              />
              <Select
                value={anioFilter}
                onChange={(e) => setAnioFilter(e.target.value)}
                options={anioOptions}
                className="w-32"
              />
            </div>
            {canCreate && (
              <Button variant="primary" size="sm" onClick={handleCreate}>
                <Plus size={16} className="mr-1" />
                Registrar Entrega
              </Button>
            )}
          </div>

          <Card variant="bordered" padding="none">
            {loadingEntregas ? (
              <div className="py-16 text-center">
                <Spinner size="lg" className="mx-auto" />
                <p className="mt-3 text-sm text-gray-500">Cargando entregas...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16">
                <EmptyState
                  icon={<Shirt className="h-12 w-12 text-gray-300" />}
                  title="Sin entregas"
                  description={
                    searchTerm || periodoFilter || anioFilter
                      ? 'No se encontraron entregas con los filtros aplicados.'
                      : 'Registra la primera entrega de dotacion.'
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
                        Periodo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Año
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fecha Entrega
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Firma
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Items
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {filtered.map((ent) => (
                      <tr
                        key={ent.id}
                        className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {ent.colaborador_nombre}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="info" size="sm">
                            {ent.periodo_display}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {ent.anio}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(ent.fecha_entrega).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3">
                          {ent.firma_recibido ? (
                            <Badge variant="success" size="sm">
                              Firmado
                            </Badge>
                          ) : (
                            <Badge variant="gray" size="sm">
                              Pendiente
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {ent.items_entregados.length} item(s)
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(ent)}
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(ent)}
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

            {!loadingEntregas && filtered.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
                Mostrando {filtered.length} de {entregas?.length || 0} entregas
              </div>
            )}
          </Card>
        </>
      )}

      <EntregaDotacionFormModal
        entrega={selectedEntrega}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedEntrega(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Entrega"
        message={`¿Estas seguro de eliminar la entrega de "${deleteTarget?.colaborador_nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
