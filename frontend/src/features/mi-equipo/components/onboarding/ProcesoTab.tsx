/**
 * ProcesoTab - Ejecuciones de induccion y checklist por colaborador
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { Progress } from '@/components/common/Progress';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { ListChecks, Play, CheckCircle, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { useColaboradores } from '@/features/talent-hub/hooks/useColaboradores';
import {
  useEjecucionesPorColaborador,
  useChecklistPorColaborador,
  useIniciarModulo,
  useCompletarModulo,
  useVerificarItemChecklist,
} from '@/features/talent-hub/hooks/useOnboardingInduccion';

const ESTADO_BADGE: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'gray'> = {
  pendiente: 'warning',
  en_progreso: 'info',
  completado: 'success',
  reprobado: 'danger',
  cancelado: 'gray',
};

const CHECKLIST_BADGE: Record<string, 'warning' | 'success' | 'gray' | 'danger'> = {
  pendiente: 'warning',
  cumplido: 'success',
  no_aplica: 'gray',
  incompleto: 'danger',
};

export const ProcesoTab = () => {
  const [selectedColaboradorId, setSelectedColaboradorId] = useState(0);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: colaboradoresData } = useColaboradores({ estado: 'activo' });
  const { data: ejecucionesData, isLoading: loadingEjecuciones } =
    useEjecucionesPorColaborador(selectedColaboradorId);
  const { data: checklistData, isLoading: loadingChecklist } =
    useChecklistPorColaborador(selectedColaboradorId);

  const iniciarMutation = useIniciarModulo();
  const completarMutation = useCompletarModulo();
  const verificarMutation = useVerificarItemChecklist();

  const colaboradorOptions = [
    { value: '', label: 'Selecciona un colaborador...' },
    ...(colaboradoresData?.results || []).map(
      (c: {
        id: number;
        nombre_completo?: string;
        primer_nombre?: string;
        primer_apellido?: string;
      }) => ({
        value: String(c.id),
        label: c.nombre_completo || `${c.primer_nombre} ${c.primer_apellido}`,
      })
    ),
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <ListChecks className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Proceso de Induccion"
        description="Seguimiento de ejecuciones y checklist por colaborador"
        variant="compact"
        actions={
          <Select
            value={String(selectedColaboradorId || '')}
            onChange={(e) => setSelectedColaboradorId(Number(e.target.value) || 0)}
            options={colaboradorOptions}
            className="w-72"
          />
        }
      />

      {!selectedColaboradorId ? (
        <Card className="p-8">
          <EmptyState
            icon={<ListChecks className="h-12 w-12 text-gray-300" />}
            title="Selecciona un colaborador"
            description="Elige un colaborador para ver su proceso de induccion y checklist de ingreso."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Ejecuciones de Induccion */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-primary-500" />
              Modulos de Induccion
              {ejecucionesData?.resumen && (
                <Badge variant="info" size="sm">
                  {ejecucionesData.resumen.porcentaje_avance}% completado
                </Badge>
              )}
            </h3>

            {ejecucionesData?.resumen && (
              <div className="mb-4">
                <Progress
                  value={ejecucionesData.resumen.porcentaje_avance}
                  max={100}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>
                    {ejecucionesData.resumen.completadas}/{ejecucionesData.resumen.total}{' '}
                    completadas
                  </span>
                  {ejecucionesData.resumen.vencidas > 0 && (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {ejecucionesData.resumen.vencidas} vencidas
                    </span>
                  )}
                </div>
              </div>
            )}

            {loadingEjecuciones ? (
              <div className="py-8 text-center">
                <Spinner size="md" className="mx-auto" />
              </div>
            ) : !ejecucionesData?.inducciones?.length ? (
              <EmptyState
                icon={<ClipboardCheck className="h-10 w-10 text-gray-300" />}
                title="Sin inducciones asignadas"
                description="Este colaborador no tiene modulos de induccion asignados."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Modulo
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Tipo
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Estado
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Progreso
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Fecha Limite
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Nota
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">
                        Accion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {ejecucionesData.inducciones.map((ej) => (
                      <tr key={ej.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {ej.modulo_nombre}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {ej.modulo_tipo}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={ESTADO_BADGE[ej.estado] || 'gray'} size="sm">
                            {ej.estado_display || ej.estado}
                          </Badge>
                          {ej.esta_vencido && (
                            <AlertTriangle size={14} className="inline ml-1 text-red-500" />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Number(ej.progreso_porcentaje)}
                              max={100}
                              className="h-1.5 w-16"
                            />
                            <span className="text-xs text-gray-500">{ej.progreso_porcentaje}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(ej.fecha_limite).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {ej.nota_obtenida != null ? `${ej.nota_obtenida}%` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {ej.estado === 'pendiente' && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => iniciarMutation.mutate(ej.id)}
                              disabled={iniciarMutation.isPending}
                            >
                              <Play size={14} className="mr-1" />
                              Iniciar
                            </Button>
                          )}
                          {ej.estado === 'en_progreso' && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => completarMutation.mutate({ id: ej.id })}
                              disabled={completarMutation.isPending}
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Completar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Checklist de Ingreso */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <ListChecks size={18} className="text-green-500" />
              Checklist de Ingreso
              {checklistData?.resumen && (
                <Badge variant="info" size="sm">
                  {checklistData.resumen.porcentaje_avance}% completado
                </Badge>
              )}
            </h3>

            {checklistData?.resumen && (
              <div className="mb-4">
                <Progress
                  value={checklistData.resumen.porcentaje_avance}
                  max={100}
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {checklistData.resumen.cumplidos}/{checklistData.resumen.total} cumplidos
                </p>
              </div>
            )}

            {loadingChecklist ? (
              <div className="py-8 text-center">
                <Spinner size="md" className="mx-auto" />
              </div>
            ) : !checklistData?.items?.length ? (
              <EmptyState
                icon={<ListChecks className="h-10 w-10 text-gray-300" />}
                title="Sin items de checklist"
                description="No se han asignado items de checklist a este colaborador."
              />
            ) : (
              <div className="space-y-2">
                {checklistData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={CHECKLIST_BADGE[item.estado] || 'gray'} size="sm">
                        {item.estado_display || item.estado}
                      </Badge>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {item.item_descripcion}
                        </p>
                        {item.item_categoria && (
                          <p className="text-xs text-gray-500">{item.item_categoria}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.fecha_cumplimiento && (
                        <span className="text-xs text-gray-400">
                          {new Date(item.fecha_cumplimiento).toLocaleDateString('es-CO')}
                        </span>
                      )}
                      {item.estado === 'pendiente' && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => verificarMutation.mutate(item.id)}
                          disabled={verificarMutation.isPending}
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Verificar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
