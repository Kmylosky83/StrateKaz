/**
 * HistorialTab - Historial disciplinario por colaborador
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { History, TrendingUp, AlertCircle } from 'lucide-react';
import { useHistorialDisciplinario } from '../../hooks/useProcesoDisciplinario';

interface HistorialResumen {
  colaborador_id: number;
  colaborador_nombre: string;
  total_llamados_atencion: number;
  total_descargos: number;
  total_memorandos: number;
  total_suspensiones: number;
  dias_suspension_acumulados: number;
  ultima_falta: string | null;
  ultima_sancion: string | null;
}

export const HistorialTab = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: historial, isLoading } = useHistorialDisciplinario();

  // Agrupar por colaborador y calcular resumen
  const resumenPorColaborador = useMemo(() => {
    if (!historial) return [];

    const agrupado = historial.reduce(
      (acc, evento) => {
        const key = evento.colaborador;
        if (!acc[key]) {
          acc[key] = {
            colaborador_id: evento.colaborador,
            colaborador_nombre: evento.colaborador_nombre,
            total_llamados_atencion: 0,
            total_descargos: 0,
            total_memorandos: 0,
            total_suspensiones: 0,
            dias_suspension_acumulados: 0,
            ultima_falta: null,
            ultima_sancion: null,
            ultima_fecha: '',
          };
        }

        // Contadores
        if (evento.tipo_evento === 'llamado_atencion') acc[key].total_llamados_atencion++;
        if (evento.tipo_evento === 'descargo') acc[key].total_descargos++;
        if (evento.tipo_evento === 'memorando') acc[key].total_memorandos++;
        if (evento.tipo_evento === 'suspension') {
          acc[key].total_suspensiones++;
          acc[key].dias_suspension_acumulados += evento.dias_suspension || 0;
        }

        // Ultima falta y sancion
        if (!acc[key].ultima_fecha || evento.fecha_evento > acc[key].ultima_fecha) {
          acc[key].ultima_fecha = evento.fecha_evento;
          acc[key].ultima_falta = evento.descripcion;
          acc[key].ultima_sancion = evento.sancion_aplicada || '-';
        }

        return acc;
      },
      {} as Record<number, any>
    );

    return Object.values(agrupado) as HistorialResumen[];
  }, [historial]);

  const filtered = useMemo(() => {
    if (!resumenPorColaborador) return [];
    return resumenPorColaborador.filter((r) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!r.colaborador_nombre.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [resumenPorColaborador, searchTerm]);

  // Calcular nivel de riesgo
  const calcularRiesgo = (
    resumen: HistorialResumen
  ): { nivel: string; color: 'danger' | 'warning' | 'success' | 'gray' } => {
    const total = resumen.total_llamados_atencion + resumen.total_memorandos;
    if (total === 0) return { nivel: 'Sin Antecedentes', color: 'gray' };
    if (total >= 5 || resumen.total_suspensiones >= 2) return { nivel: 'Alto', color: 'danger' };
    if (total >= 3 || resumen.total_suspensiones >= 1) return { nivel: 'Medio', color: 'warning' };
    return { nivel: 'Bajo', color: 'success' };
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <History className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Historial Disciplinario"
        description="Resumen disciplinario por colaborador"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando historial...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<History className="h-12 w-12 text-gray-300" />}
              title="Sin historial disciplinario"
              description={
                searchTerm
                  ? 'No se encontraron colaboradores con los filtros aplicados.'
                  : 'No hay eventos disciplinarios registrados.'
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
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Llamados
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Descargos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Memorandos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Suspensiones
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Dias Susp.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ultima Falta
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Riesgo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((resumen) => {
                  const riesgo = calcularRiesgo(resumen);
                  return (
                    <tr
                      key={resumen.colaborador_id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {resumen.colaborador_nombre}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                          {resumen.total_llamados_atencion}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold">
                          {resumen.total_descargos}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold">
                          {resumen.total_memorandos}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold">
                          {resumen.total_suspensiones}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {resumen.dias_suspension_acumulados > 0 && (
                          <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                            <TrendingUp size={14} />
                            <span className="text-sm font-semibold">
                              {resumen.dias_suspension_acumulados}
                            </span>
                          </div>
                        )}
                        {resumen.dias_suspension_acumulados === 0 && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {resumen.ultima_falta || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={riesgo.color} size="sm">
                          <div className="flex items-center gap-1">
                            {riesgo.color === 'danger' && <AlertCircle size={14} />}
                            {riesgo.nivel}
                          </div>
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
            Mostrando {filtered.length} de {resumenPorColaborador?.length || 0} colaboradores con
            historial
          </div>
        )}
      </Card>

      {/* Leyenda de riesgo */}
      <Card variant="bordered" padding="compact">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Niveles de Riesgo Disciplinario
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="gray" size="sm">
                Sin Antecedentes
              </Badge>
              <span className="text-xs text-gray-500">0 eventos</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                Bajo
              </Badge>
              <span className="text-xs text-gray-500">1-2 eventos</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm">
                Medio
              </Badge>
              <span className="text-xs text-gray-500">3-4 eventos o 1 suspension</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="danger" size="sm">
                Alto
              </Badge>
              <span className="text-xs text-gray-500">5+ eventos o 2+ suspensiones</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
