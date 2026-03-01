/**
 * PlanesMejoraTab - Planes de desarrollo y mejora individual
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Progress } from '@/components/common/Progress';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { TrendingUp, Plus, Play, CheckCircle, Eye } from 'lucide-react';
import {
  usePlanesMejora,
  useAprobarPlanMejora,
  useIniciarPlanMejora,
} from '../../hooks/useDesempeno';
import type { PlanMejora } from '../../types';
import { PlanMejoraFormModal } from './PlanMejoraFormModal';
import { PlanMejoraDetailModal } from './PlanMejoraDetailModal';

const ESTADO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  borrador: 'gray',
  aprobado: 'info',
  en_ejecucion: 'warning',
  seguimiento: 'info',
  completado: 'success',
  cancelado: 'danger',
};

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'mejora', label: 'Mejora' },
  { value: 'alto_potencial', label: 'Alto Potencial' },
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'transicion', label: 'Transicion' },
];

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'en_ejecucion', label: 'En Ejecucion' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const PlanesMejoraTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanMejora | null>(null);
  const [detailPlan, setDetailPlan] = useState<PlanMejora | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: planes, isLoading } = usePlanesMejora();
  const aprobarMutation = useAprobarPlanMejora();
  const iniciarMutation = useIniciarPlanMejora();

  const filtered = useMemo(() => {
    if (!planes) return [];
    return (Array.isArray(planes) ? planes : []).filter((p) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !p.titulo.toLowerCase().includes(term) &&
          !p.colaborador_nombre?.toLowerCase().includes(term) &&
          !p.codigo.toLowerCase().includes(term)
        )
          return false;
      }
      if (tipoFilter && p.tipo_plan !== tipoFilter) return false;
      if (estadoFilter && p.estado !== estadoFilter) return false;
      return true;
    });
  }, [planes, searchTerm, tipoFilter, estadoFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <TrendingUp className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Planes de Mejora"
        description="Planes de desarrollo individual, mejora y alto potencial"
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedPlan(null);
                setIsFormOpen(true);
              }}
            >
              <Plus size={16} className="mr-1" />
              Nuevo Plan
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando planes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<TrendingUp className="h-12 w-12 text-gray-300" />}
              title="Sin planes de mejora"
              description={
                searchTerm || tipoFilter || estadoFilter
                  ? 'No se encontraron planes con los filtros aplicados.'
                  : 'Crea el primer plan de mejora.'
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
                    Titulo / Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Avance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Periodo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((plan) => (
                  <tr
                    key={plan.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">
                      {plan.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {plan.titulo}
                      </p>
                      <p className="text-xs text-gray-500">{plan.colaborador_nombre}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray" size="sm">
                        {plan.tipo_display || plan.tipo_plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[plan.estado] || 'gray'} size="sm">
                        {plan.estado_display || plan.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={plan.porcentaje_avance} max={100} className="h-1.5 w-20" />
                        <span className="text-xs text-gray-500">{plan.porcentaje_avance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(plan.fecha_inicio).toLocaleDateString('es-CO')} -{' '}
                      {new Date(plan.fecha_fin).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {plan.estado === 'borrador' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => aprobarMutation.mutate(String(plan.id))}
                            title="Aprobar"
                            className="text-green-500 hover:text-green-700"
                          >
                            <CheckCircle size={16} />
                          </Button>
                        )}
                        {plan.estado === 'aprobado' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => iniciarMutation.mutate(String(plan.id))}
                            title="Iniciar"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Play size={16} />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailPlan(plan)}
                          title="Ver detalle"
                        >
                          <Eye size={16} />
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
            Mostrando {filtered.length} de {(Array.isArray(planes) ? planes : []).length || 0}{' '}
            planes
          </div>
        )}
      </Card>

      <PlanMejoraFormModal
        plan={selectedPlan}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPlan(null);
        }}
      />

      <PlanMejoraDetailModal
        plan={detailPlan}
        isOpen={!!detailPlan}
        onClose={() => setDetailPlan(null)}
      />
    </div>
  );
};
