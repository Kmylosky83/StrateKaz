/**
 * Tab Parámetros de Calidad (Supply Chain) — Fase 1 QC.
 *
 * Master/detail: a la izquierda listado de ParametroCalidad; al seleccionar
 * uno, a la derecha listado de sus RangoCalidad con CRUD.
 */
import { useMemo, useState } from 'react';
import { Edit, FlaskConical, Plus, TestTube, Trash2 } from 'lucide-react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Spinner } from '@/components/common/Spinner';

import { Modules, Sections } from '@/constants/permissions';
import { usePermissions } from '@/hooks/usePermissions';

import { useDeleteParametroCalidad, useParametrosCalidad } from '../hooks/useParametrosCalidad';
import { useDeleteRangoCalidad, useRangosPorParametro } from '../hooks/useRangosCalidad';
import type { ParametroCalidad, RangoCalidad } from '../types/calidad.types';

import ParametroCalidadFormModal from './ParametroCalidadFormModal';
import RangoCalidadFormModal from './RangoCalidadFormModal';

export default function ParametrosCalidadTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.CATALOGOS_SC, 'create');
  const canUpdate = canDo(Modules.SUPPLY_CHAIN, Sections.CATALOGOS_SC, 'update');
  const canDelete = canDo(Modules.SUPPLY_CHAIN, Sections.CATALOGOS_SC, 'delete');

  const { data: parametros = [], isLoading } = useParametrosCalidad();

  const [selectedParamId, setSelectedParamId] = useState<number | null>(null);
  const selectedParam = useMemo(
    () => parametros.find((p) => p.id === selectedParamId) ?? null,
    [parametros, selectedParamId]
  );

  // Selección inicial
  if (selectedParamId === null && parametros.length > 0) {
    setSelectedParamId(parametros[0].id);
  }

  const { data: rangos = [], isLoading: rangosLoading } = useRangosPorParametro(selectedParamId);

  // Modales
  const [paramFormOpen, setParamFormOpen] = useState(false);
  const [paramEdit, setParamEdit] = useState<ParametroCalidad | null>(null);
  const [paramDeleteId, setParamDeleteId] = useState<number | null>(null);

  const [rangoFormOpen, setRangoFormOpen] = useState(false);
  const [rangoEdit, setRangoEdit] = useState<RangoCalidad | null>(null);
  const [rangoDeleteId, setRangoDeleteId] = useState<number | null>(null);

  const deleteParamMut = useDeleteParametroCalidad();
  const deleteRangoMut = useDeleteRangoCalidad();

  const rangosSorted = useMemo(() => [...rangos].sort((a, b) => a.order - b.order), [rangos]);

  const handleConfirmDeleteParam = async () => {
    if (!paramDeleteId) return;
    try {
      await deleteParamMut.mutateAsync(paramDeleteId);
      if (paramDeleteId === selectedParamId) setSelectedParamId(null);
    } finally {
      setParamDeleteId(null);
    }
  };

  const handleConfirmDeleteRango = async () => {
    if (!rangoDeleteId) return;
    try {
      await deleteRangoMut.mutateAsync(rangoDeleteId);
    } finally {
      setRangoDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Parámetros de Calidad"
        count={parametros.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Parámetro',
                onClick: () => {
                  setParamEdit(null);
                  setParamFormOpen(true);
                },
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {parametros.length === 0 ? (
        <EmptyState
          icon={<TestTube className="w-16 h-16" />}
          title="No hay parámetros de calidad"
          description="Define parámetros (acidez, humedad, pH...) para medir en la recepción de MP. Cada parámetro tiene rangos que clasifican el valor medido."
          action={
            canCreate
              ? {
                  label: 'Crear primer parámetro',
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => {
                    setParamEdit(null);
                    setParamFormOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Master: lista parámetros ── */}
          <Card variant="bordered" padding="none" className="lg:col-span-1">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <TestTube className="w-4 h-4" /> Parámetros ({parametros.length})
              </h3>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[480px] overflow-y-auto">
              {parametros.map((p) => {
                const isSel = p.id === selectedParamId;
                return (
                  <li
                    key={p.id}
                    className={`cursor-pointer px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                      isSel ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                    }`}
                    onClick={() => setSelectedParamId(p.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {p.nombre}
                          </span>
                          {!p.is_active && (
                            <Badge variant="gray" size="sm">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {p.codigo} · {p.unidad}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setParamEdit(p);
                              setParamFormOpen(true);
                            }}
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setParamDeleteId(p.id);
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* ── Detail: rangos del parámetro seleccionado ── */}
          <Card variant="bordered" padding="none" className="lg:col-span-2">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" /> Rangos de {selectedParam?.nombre ?? '—'}
                </h3>
                {selectedParam?.descripcion && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedParam.descripcion}
                  </p>
                )}
              </div>
              {selectedParam && canCreate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setRangoEdit(null);
                    setRangoFormOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Nuevo Rango
                </Button>
              )}
            </div>

            <div className="p-4">
              {!selectedParam ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  Seleccione un parámetro para ver sus rangos.
                </p>
              ) : rangosLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : rangosSorted.length === 0 ? (
                <EmptyState
                  icon={<FlaskConical className="w-12 h-12" />}
                  title="Sin rangos definidos"
                  description="Agrega rangos para clasificar los valores medidos de este parámetro."
                  action={
                    canCreate
                      ? {
                          label: 'Agregar rango',
                          icon: <Plus className="w-4 h-4" />,
                          onClick: () => {
                            setRangoEdit(null);
                            setRangoFormOpen(true);
                          },
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Color
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Código
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Nombre
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Rango
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Estado
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {rangosSorted.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                          <td className="px-4 py-2">
                            <span
                              className="inline-block w-4 h-4 rounded"
                              style={{ backgroundColor: r.color }}
                              title={r.color}
                            />
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-white">
                            {r.codigo}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">{r.nombre}</td>
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                            {formatRange(r, selectedParam.unidad)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Badge variant={r.is_active ? 'success' : 'gray'} size="sm">
                              {r.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canUpdate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setRangoEdit(r);
                                    setRangoFormOpen(true);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRangoDeleteId(r.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-danger-600" />
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
            </div>
          </Card>
        </div>
      )}

      {/* Modales */}
      <ParametroCalidadFormModal
        isOpen={paramFormOpen}
        onClose={() => {
          setParamFormOpen(false);
          setParamEdit(null);
        }}
        parametro={paramEdit}
      />

      {selectedParam && (
        <RangoCalidadFormModal
          isOpen={rangoFormOpen}
          onClose={() => {
            setRangoFormOpen(false);
            setRangoEdit(null);
          }}
          parametroId={selectedParam.id}
          rango={rangoEdit}
        />
      )}

      <ConfirmDialog
        isOpen={!!paramDeleteId}
        title="Eliminar parámetro"
        message="¿Eliminar este parámetro y todos sus rangos asociados? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDeleteParam}
        onClose={() => setParamDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={!!rangoDeleteId}
        title="Eliminar rango"
        message="¿Eliminar este rango? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDeleteRango}
        onClose={() => setRangoDeleteId(null)}
      />
    </div>
  );
}

function formatRange(r: RangoCalidad, unidad: string): string {
  const min = r.min_value !== null && r.min_value !== '' ? String(r.min_value) : null;
  const max = r.max_value !== null && r.max_value !== '' ? String(r.max_value) : null;
  if (min !== null && max !== null) return `${min} — ${max} ${unidad}`;
  if (min !== null) return `≥ ${min} ${unidad}`;
  if (max !== null) return `≤ ${max} ${unidad}`;
  return '—';
}
