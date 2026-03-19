/**
 * PruebasDinamicasTab - Pruebas Tecnicas Dinamicas con Form Builder
 * Seleccion y Contratacion > Pruebas
 *
 * Vista enterprise con dos sub-vistas:
 * 1. Plantillas - CRUD de plantillas de prueba (Form Builder)
 * 2. Asignaciones - Pruebas asignadas a candidatos con estado
 *
 * Usa design system: Card, Badge, Button, SectionHeader, StatsGrid, EmptyState, Spinner
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { cn } from '@/utils/cn';
import {
  ClipboardCheck,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Send,
  RefreshCw,
  FileText,
  Users,
  Clock,
  CheckCircle,
  BarChart3,
  Brain,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  usePlantillasPrueba,
  useAsignacionesPrueba,
  useAsignacionPruebaDetail,
  useDeletePlantillaPrueba,
  useDuplicarPlantillaPrueba,
  useReenviarEmailPrueba,
} from '../../hooks/useSeleccionContratacion';
import type {
  PlantillaPruebaList,
  AsignacionPruebaList,
  EstadoAsignacionPrueba,
} from '../../types';
import {
  ESTADO_ASIGNACION_OPTIONS,
  ESTADO_ASIGNACION_BADGE,
  TIPO_SCORING_OPTIONS,
} from '../../types';
import { FormBuilderModal } from './FormBuilderModal';
import { AsignarPruebaModal } from './AsignarPruebaModal';
import { ResultadosPsicometricosModal } from './ResultadosPsicometricosModal';

// ============================================================================
// Sub-vista toggle
// ============================================================================

type SubView = 'plantillas' | 'asignaciones';

// ============================================================================
// Componente
// ============================================================================

export const PruebasDinamicasTab = () => {
  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.TALENT_HUB, Sections.CANDIDATOS, 'create');
  const canEdit = canDo(Modules.TALENT_HUB, Sections.CANDIDATOS, 'edit');
  const canDelete = canDo(Modules.TALENT_HUB, Sections.CANDIDATOS, 'delete');

  const [subView, setSubView] = useState<SubView>('plantillas');
  const [estadoFilter, setEstadoFilter] = useState<EstadoAsignacionPrueba | ''>('');

  // Plantilla state
  const [isFormBuilderOpen, setIsFormBuilderOpen] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaPruebaList | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlantillaPruebaList | null>(null);

  // Asignacion state
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);

  // Psicometrico modal state
  const [psicometricoAsignacion, setPsicometricoAsignacion] = useState<AsignacionPruebaList | null>(
    null
  );

  // Module color
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  // Queries
  const { data: plantillas, isLoading: isLoadingPlantillas } = usePlantillasPrueba();
  const { data: asignacionesData, isLoading: isLoadingAsignaciones } = useAsignacionesPrueba({
    estado: estadoFilter || undefined,
  });

  // Psicometrico detail (lazy, only when modal is open)
  const { data: psicometricoDetail } = useAsignacionPruebaDetail(
    psicometricoAsignacion?.id ?? null
  );

  // Mutations
  const deleteMutation = useDeletePlantillaPrueba();
  const duplicarMutation = useDuplicarPlantillaPrueba();
  const reenviarMutation = useReenviarEmailPrueba();

  // Stats
  const stats: StatItem[] = useMemo(() => {
    const allPlantillas = plantillas || [];
    const allAsignaciones = asignacionesData?.results || [];
    return [
      {
        label: 'Plantillas',
        value: allPlantillas.length,
        icon: FileText,
        iconColor: 'info' as const,
      },
      {
        label: 'Pruebas Asignadas',
        value: allAsignaciones.length,
        icon: Users,
        iconColor: 'primary' as const,
      },
      {
        label: 'Pendientes',
        value: allAsignaciones.filter((a) => a.estado === 'pendiente' || a.estado === 'en_progreso')
          .length,
        icon: Clock,
        iconColor: 'warning' as const,
      },
      {
        label: 'Calificadas',
        value: allAsignaciones.filter((a) => a.estado === 'calificada').length,
        icon: CheckCircle,
        iconColor: 'success' as const,
      },
    ];
  }, [plantillas, asignacionesData]);

  // Filter options
  const estadoOptions = useMemo(
    () => [{ value: '', label: 'Todos los estados' }, ...ESTADO_ASIGNACION_OPTIONS],
    []
  );

  // Handlers
  const handleCreatePlantilla = () => {
    setEditingPlantilla(null);
    setIsFormBuilderOpen(true);
  };

  const handleEditPlantilla = (p: PlantillaPruebaList) => {
    setEditingPlantilla(p);
    setIsFormBuilderOpen(true);
  };

  const handleDeletePlantilla = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleDuplicar = async (p: PlantillaPruebaList) => {
    await duplicarMutation.mutateAsync(p.id);
  };

  const handleReenviarEmail = async (a: AsignacionPruebaList) => {
    await reenviarMutation.mutateAsync(a.id);
  };

  const plantillasList = plantillas || [];
  const asignacionesList = asignacionesData?.results || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsGrid stats={stats} columns={4} moduleColor={moduleColor} />

      {/* Header + Sub-view toggle */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <ClipboardCheck className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Pruebas Tecnicas Dinamicas"
        description="Crea pruebas personalizadas y asignalas a candidatos"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            {/* Sub-view toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSubView('plantillas')}
                className={cn(
                  '!px-3 !py-1.5 text-xs font-medium rounded-md transition-all',
                  subView === 'plantillas'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                )}
              >
                Plantillas
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSubView('asignaciones')}
                className={cn(
                  '!px-3 !py-1.5 text-xs font-medium rounded-md transition-all',
                  subView === 'asignaciones'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                )}
              >
                Asignaciones
              </Button>
            </div>

            {subView === 'asignaciones' && (
              <Select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value as EstadoAsignacionPrueba | '')}
                options={estadoOptions}
                className="w-40"
              />
            )}

            {subView === 'plantillas'
              ? canCreate && (
                  <Button variant="primary" size="sm" onClick={handleCreatePlantilla}>
                    <Plus size={16} className="mr-1" />
                    Nueva Plantilla
                  </Button>
                )
              : canCreate && (
                  <Button variant="primary" size="sm" onClick={() => setIsAsignarOpen(true)}>
                    <Send size={16} className="mr-1" />
                    Asignar Prueba
                  </Button>
                )}
          </div>
        }
      />

      {/* PLANTILLAS VIEW */}
      {subView === 'plantillas' && (
        <Card variant="bordered" padding="none">
          {isLoadingPlantillas ? (
            <div className="py-16 text-center">
              <Spinner size="lg" className="mx-auto" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Cargando plantillas...
              </p>
            </div>
          ) : plantillasList.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={<FileText className="h-12 w-12 text-gray-300" />}
                title="Sin plantillas"
                description="Crea tu primera plantilla de prueba con el Form Builder."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Plantilla
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Categoria
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Preguntas
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Puntaje Max
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Scoring
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Asignaciones
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Duracion
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {plantillasList.map((plantilla) => (
                    <tr
                      key={plantilla.id}
                      className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                            {plantilla.nombre}
                          </p>
                          {plantilla.descripcion && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">
                              {plantilla.descripcion}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="gray" size="sm">
                          {plantilla.categoria || 'General'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {plantilla.total_campos}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {plantilla.puntaje_maximo || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            plantilla.tipo_scoring === 'automatico'
                              ? 'success'
                              : plantilla.tipo_scoring === 'mixto'
                                ? 'warning'
                                : 'gray'
                          }
                          size="sm"
                        >
                          {TIPO_SCORING_OPTIONS.find((o) => o.value === plantilla.tipo_scoring)
                            ?.label || plantilla.tipo_scoring}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {plantilla.total_asignaciones}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {plantilla.duracion_estimada_minutos} min
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPlantilla(plantilla)}
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </Button>
                          )}
                          {canCreate && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicar(plantilla)}
                              title="Duplicar"
                            >
                              <Copy size={16} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(plantilla)}
                              title="Eliminar"
                              className="text-gray-400 hover:text-danger-600"
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
        </Card>
      )}

      {/* ASIGNACIONES VIEW */}
      {subView === 'asignaciones' && (
        <Card variant="bordered" padding="none">
          {isLoadingAsignaciones ? (
            <div className="py-16 text-center">
              <Spinner size="lg" className="mx-auto" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Cargando asignaciones...
              </p>
            </div>
          ) : asignacionesList.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={<Send className="h-12 w-12 text-gray-300" />}
                title="Sin asignaciones"
                description="Asigna una prueba a un candidato para comenzar."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Candidato
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Prueba
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Score
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Tiempo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {asignacionesList.map((asignacion) => (
                    <tr
                      key={asignacion.id}
                      className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[160px]">
                          {asignacion.candidato_nombre}
                        </p>
                        {asignacion.vacante_codigo && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {asignacion.vacante_codigo}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                          {asignacion.plantilla_nombre}
                        </p>
                        {asignacion.plantilla_categoria && (
                          <Badge variant="gray" size="sm" className="mt-0.5">
                            {asignacion.plantilla_categoria}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ESTADO_ASIGNACION_BADGE[asignacion.estado]} size="sm">
                          {asignacion.estado_display}
                        </Badge>
                        {asignacion.esta_vencida && (
                          <p className="text-[10px] text-danger-500 mt-0.5">Vencida</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {asignacion.porcentaje !== null ? (
                          <span
                            className={cn(
                              'text-sm font-bold',
                              Number(asignacion.porcentaje) >= 80
                                ? 'text-green-600 dark:text-green-400'
                                : Number(asignacion.porcentaje) >= 60
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-red-600 dark:text-red-400'
                            )}
                          >
                            {Number(asignacion.porcentaje).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                        {asignacion.aprobado !== null && (
                          <p
                            className={cn(
                              'text-[10px] mt-0.5',
                              asignacion.aprobado ? 'text-green-500' : 'text-red-500'
                            )}
                          >
                            {asignacion.aprobado ? 'Aprobado' : 'No aprobado'}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {asignacion.tiempo_transcurrido_minutos !== null ? (
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {asignacion.tiempo_transcurrido_minutos} min
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {asignacion.fecha_vencimiento ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(asignacion.fecha_vencimiento).toLocaleDateString('es-CO')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin limite</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {asignacion.estado === 'pendiente' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReenviarEmail(asignacion)}
                              title="Reenviar email"
                            >
                              <RefreshCw size={16} />
                            </Button>
                          )}
                          {(asignacion.estado === 'completada' ||
                            asignacion.estado === 'calificada') && (
                            <Button type="button" variant="ghost" size="sm" title="Ver resultados">
                              <BarChart3 size={16} />
                            </Button>
                          )}
                          {asignacion.plantilla_categoria === 'psicometrico' &&
                            (asignacion.estado === 'completada' ||
                              asignacion.estado === 'calificada') && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPsicometricoAsignacion(asignacion)}
                                title="Ver perfil psicometrico"
                              >
                                <Brain size={16} />
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

          {/* Pagination info */}
          {!isLoadingAsignaciones && asignacionesList.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                Mostrando {asignacionesList.length} de {asignacionesData?.count || 0} asignaciones
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Form Builder Modal */}
      <FormBuilderModal
        plantilla={editingPlantilla}
        isOpen={isFormBuilderOpen}
        onClose={() => {
          setIsFormBuilderOpen(false);
          setEditingPlantilla(null);
        }}
      />

      {/* Asignar Prueba Modal */}
      <AsignarPruebaModal isOpen={isAsignarOpen} onClose={() => setIsAsignarOpen(false)} />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Plantilla"
        message={`¿Estas seguro de eliminar la plantilla "${deleteTarget?.nombre || ''}"? Las asignaciones existentes no se veran afectadas.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeletePlantilla}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Resultados Psicometricos Modal */}
      <ResultadosPsicometricosModal
        isOpen={!!psicometricoAsignacion}
        onClose={() => setPsicometricoAsignacion(null)}
        asignacion={psicometricoAsignacion}
        scoringConfig={
          (psicometricoDetail?.plantilla_scoring_config as Record<string, unknown>) ?? null
        }
        respuestas={(psicometricoDetail?.respuestas as Record<string, number>) ?? null}
      />
    </div>
  );
};
