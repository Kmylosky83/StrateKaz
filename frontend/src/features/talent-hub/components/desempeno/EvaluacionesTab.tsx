/**
 * EvaluacionesTab - Ciclos de evaluacion y evaluaciones 360
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { ClipboardCheck, Plus, Play, CheckCircle, Lock, Eye } from 'lucide-react';
import {
  useCiclosEvaluacion,
  useEvaluacionesDesempeno,
  useActivarCiclo,
  useIniciarEvaluacionCiclo,
  useCerrarCiclo,
} from '../../hooks/useDesempeno';
import type { CicloEvaluacion, EvaluacionDesempeno } from '../../types';
import { CicloFormModal } from './CicloFormModal';
import { EvaluacionDetailModal } from './EvaluacionDetailModal';

const ESTADO_CICLO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  planificado: 'gray',
  en_configuracion: 'info',
  activo: 'success',
  en_evaluacion: 'warning',
  en_revision: 'info',
  cerrado: 'gray',
  cancelado: 'danger',
};

const ESTADO_EVAL_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  pendiente: 'gray',
  en_autoevaluacion: 'info',
  en_evaluacion_jefe: 'info',
  en_evaluacion_pares: 'info',
  en_revision: 'warning',
  calibracion: 'warning',
  retroalimentacion: 'info',
  completada: 'success',
  cancelada: 'danger',
};

const ESTADO_EVAL_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_autoevaluacion', label: 'Autoevaluacion' },
  { value: 'en_evaluacion_jefe', label: 'Evaluacion Jefe' },
  { value: 'en_evaluacion_pares', label: 'Evaluacion Pares' },
  { value: 'en_revision', label: 'En Revision' },
  { value: 'calibracion', label: 'Calibracion' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export const EvaluacionesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [isCicloFormOpen, setIsCicloFormOpen] = useState(false);
  const [selectedCiclo, setSelectedCiclo] = useState<CicloEvaluacion | null>(null);
  const [selectedEval, setSelectedEval] = useState<EvaluacionDesempeno | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: ciclos, isLoading: loadingCiclos } = useCiclosEvaluacion();
  const { data: evaluaciones, isLoading: loadingEvals } = useEvaluacionesDesempeno();
  const activarMutation = useActivarCiclo();
  const iniciarMutation = useIniciarEvaluacionCiclo();
  const cerrarMutation = useCerrarCiclo();

  const filteredEvals = useMemo(() => {
    if (!evaluaciones) return [];
    return (Array.isArray(evaluaciones) ? evaluaciones : []).filter((ev) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!ev.colaborador_nombre?.toLowerCase().includes(term)) return false;
      }
      if (estadoFilter && ev.estado !== estadoFilter) return false;
      return true;
    });
  }, [evaluaciones, searchTerm, estadoFilter]);

  return (
    <div className="space-y-6">
      {/* Ciclos de Evaluacion */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
              <ClipboardCheck className={`h-5 w-5 ${colorClasses.icon}`} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Ciclos de Evaluacion
            </h3>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedCiclo(null);
              setIsCicloFormOpen(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Nuevo Ciclo
          </Button>
        </div>

        {loadingCiclos ? (
          <div className="py-8 text-center">
            <Spinner size="md" className="mx-auto" />
          </div>
        ) : !ciclos || (Array.isArray(ciclos) ? ciclos : []).length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck className="h-10 w-10 text-gray-300" />}
            title="Sin ciclos"
            description="Crea el primer ciclo de evaluacion."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Array.isArray(ciclos) ? ciclos : []).map((ciclo) => (
              <div
                key={ciclo.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {ciclo.nombre}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{ciclo.codigo}</p>
                  </div>
                  <Badge variant={ESTADO_CICLO_BADGE[ciclo.estado] || 'gray'} size="sm">
                    {ciclo.estado_display || ciclo.estado}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <p>
                    {ciclo.tipo_display || ciclo.tipo_ciclo} - {ciclo.anio}
                  </p>
                  <p>
                    {new Date(ciclo.fecha_inicio).toLocaleDateString('es-CO')} -{' '}
                    {new Date(ciclo.fecha_fin).toLocaleDateString('es-CO')}
                  </p>
                  {ciclo.evaluaciones_count != null && (
                    <p>{ciclo.evaluaciones_count} evaluaciones</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {ciclo.estado === 'planificado' && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => activarMutation.mutate(String(ciclo.id))}
                      disabled={activarMutation.isPending}
                    >
                      <Play size={14} className="mr-1" />
                      Activar
                    </Button>
                  )}
                  {ciclo.estado === 'activo' && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => iniciarMutation.mutate(String(ciclo.id))}
                      disabled={iniciarMutation.isPending}
                    >
                      <ClipboardCheck size={14} className="mr-1" />
                      Iniciar Evaluacion
                    </Button>
                  )}
                  {(ciclo.estado === 'en_evaluacion' || ciclo.estado === 'en_revision') && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => cerrarMutation.mutate(String(ciclo.id))}
                      disabled={cerrarMutation.isPending}
                    >
                      <Lock size={14} className="mr-1" />
                      Cerrar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Evaluaciones individuales */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <CheckCircle className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Evaluaciones"
        description="Evaluaciones de desempeno individuales"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              options={ESTADO_EVAL_OPTIONS}
              className="w-44"
            />
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {loadingEvals ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando evaluaciones...</p>
          </div>
        ) : filteredEvals.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<CheckCircle className="h-12 w-12 text-gray-300" />}
              title="Sin evaluaciones"
              description={
                searchTerm || estadoFilter
                  ? 'No se encontraron evaluaciones con los filtros aplicados.'
                  : 'Las evaluaciones se crean al iniciar un ciclo.'
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
                    Ciclo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Auto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Jefe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Final
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Firma
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filteredEvals.map((ev) => (
                  <tr
                    key={ev.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {ev.colaborador_nombre}
                      </p>
                      {ev.jefe_nombre && (
                        <p className="text-xs text-gray-500">Jefe: {ev.jefe_nombre}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {ev.ciclo_nombre || ev.ciclo_codigo}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_EVAL_BADGE[ev.estado] || 'gray'} size="sm">
                        {ev.estado_display || ev.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {ev.calificacion_autoevaluacion != null
                        ? ev.calificacion_autoevaluacion.toFixed(1)
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {ev.calificacion_jefe != null ? ev.calificacion_jefe.toFixed(1) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {ev.calificacion_final != null
                          ? ev.calificacion_final.toFixed(1)
                          : ev.calificacion_calibrada != null
                            ? `${ev.calificacion_calibrada.toFixed(1)}*`
                            : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ev.firma_colaborador ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <span className="text-xs text-gray-400">Pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setSelectedEval(ev)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadingEvals && filteredEvals.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
            Mostrando {filteredEvals.length} evaluaciones
          </div>
        )}
      </Card>

      <CicloFormModal
        ciclo={selectedCiclo}
        isOpen={isCicloFormOpen}
        onClose={() => {
          setIsCicloFormOpen(false);
          setSelectedCiclo(null);
        }}
      />

      <EvaluacionDetailModal
        evaluacion={selectedEval}
        isOpen={!!selectedEval}
        onClose={() => setSelectedEval(null)}
      />
    </div>
  );
};
