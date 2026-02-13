/**
 * PerfilamientoTab - Matching y scoring de candidatos por vacante
 * Seleccion y Contratacion > Perfilamiento
 *
 * Muestra score de compatibilidad (0-100) para cada candidato,
 * desglosado por: educacion, experiencia, salario, entrevistas, pruebas, evaluacion HR
 *
 * Endpoint: GET /api/talent-hub/seleccion/vacantes-activas/{id}/perfilamiento/
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/forms/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { cn } from '@/utils/cn';
import {
  Target,
  GraduationCap,
  Briefcase,
  DollarSign,
  MessageSquare,
  ClipboardCheck,
  UserCheck,
  Award,
} from 'lucide-react';
import {
  useVacantesActivasAbiertas,
  usePerfilamientoVacante,
} from '../../hooks/useSeleccionContratacion';
import type { PerfilamientoCandidato, NivelMatching } from '../../types';
import { NIVEL_MATCHING_BADGE } from '../../types';

// ============================================================================
// Helpers
// ============================================================================

const SCORE_FACTORS = [
  { key: 'educacion', label: 'Educacion', max: 20, icon: GraduationCap, color: 'text-blue-500' },
  { key: 'experiencia', label: 'Experiencia', max: 20, icon: Briefcase, color: 'text-violet-500' },
  { key: 'salario', label: 'Salario', max: 15, icon: DollarSign, color: 'text-green-500' },
  {
    key: 'entrevistas',
    label: 'Entrevistas',
    max: 20,
    icon: MessageSquare,
    color: 'text-amber-500',
  },
  { key: 'pruebas', label: 'Pruebas', max: 15, icon: ClipboardCheck, color: 'text-indigo-500' },
  { key: 'evaluacion_hr', label: 'Eval. HR', max: 10, icon: UserCheck, color: 'text-pink-500' },
] as const;

function getNivelLabel(nivel: NivelMatching) {
  switch (nivel) {
    case 'excelente':
      return 'Excelente';
    case 'bueno':
      return 'Bueno';
    case 'regular':
      return 'Regular';
    case 'bajo':
      return 'Bajo';
  }
}

function getScoreColor(total: number) {
  if (total >= 75) return 'text-green-600 dark:text-green-400';
  if (total >= 55) return 'text-blue-600 dark:text-blue-400';
  if (total >= 35) return 'text-amber-600 dark:text-amber-400';
  return 'text-gray-500';
}

function getScoreBarColor(total: number) {
  if (total >= 75) return 'bg-green-500';
  if (total >= 55) return 'bg-blue-500';
  if (total >= 35) return 'bg-amber-500';
  return 'bg-gray-400';
}

// ============================================================================
// Score Breakdown (mini bar chart per candidato)
// ============================================================================

interface ScoreBreakdownProps {
  scores: PerfilamientoCandidato['scores'];
}

const ScoreBreakdown = ({ scores }: ScoreBreakdownProps) => (
  <div className="flex items-end gap-0.5 h-8">
    {SCORE_FACTORS.map((factor) => {
      const val = scores[factor.key as keyof typeof scores];
      const pct = factor.max > 0 ? (val / factor.max) * 100 : 0;
      return (
        <div key={factor.key} className="flex-1 flex flex-col items-center group relative">
          <div
            className={cn(
              'w-full rounded-t-sm transition-all min-h-[2px]',
              pct >= 70
                ? 'bg-green-400'
                : pct >= 40
                  ? 'bg-blue-400'
                  : 'bg-gray-300 dark:bg-gray-600'
            )}
            style={{ height: `${Math.max(pct * 0.32, 2)}px` }}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
            <div className="bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
              {factor.label}: {val}/{factor.max}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// ============================================================================
// Componente Principal
// ============================================================================

export const PerfilamientoTab = () => {
  const [selectedVacante, setSelectedVacante] = useState<number | null>(null);

  const { data: vacantes = [] } = useVacantesActivasAbiertas();
  const { data: perfilamiento, isLoading } = usePerfilamientoVacante(selectedVacante);

  // Stats resumen
  const statsResumen = useMemo(() => {
    if (!perfilamiento) return null;
    const candidatos = perfilamiento.candidatos;
    const total = candidatos.length;
    if (total === 0) return null;

    const avgScore = Math.round(candidatos.reduce((s, c) => s + c.total, 0) / total);
    const excelentes = candidatos.filter((c) => c.nivel === 'excelente').length;
    const buenos = candidatos.filter((c) => c.nivel === 'bueno').length;

    return { total, avgScore, excelentes, buenos };
  }, [perfilamiento]);

  return (
    <div className="space-y-4">
      {/* Selector de vacante */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
            <Target size={16} className="text-violet-500" />
            Perfilamiento
          </div>
          <Select
            value={selectedVacante || ''}
            onChange={(e) => setSelectedVacante(e.target.value ? Number(e.target.value) : null)}
            className="flex-1"
          >
            <option value="">Seleccionar vacante para analizar...</option>
            {vacantes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.codigo_vacante} — {v.titulo} ({v.area})
              </option>
            ))}
          </Select>
        </div>

        {/* Stats resumen */}
        {statsResumen && (
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {statsResumen.total}
              </p>
              <p className="text-[10px] text-gray-500">Candidatos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-violet-600">{statsResumen.avgScore}%</p>
              <p className="text-[10px] text-gray-500">Score Promedio</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{statsResumen.excelentes}</p>
              <p className="text-[10px] text-gray-500">Excelentes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{statsResumen.buenos}</p>
              <p className="text-[10px] text-gray-500">Buenos</p>
            </div>
          </div>
        )}
      </Card>

      {/* Estado: sin vacante seleccionada */}
      {!selectedVacante && (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <Target size={24} className="text-violet-500" />
              </div>
            }
            title="Selecciona una vacante"
            description="Elige una vacante abierta para ver el score de compatibilidad de cada candidato"
          />
        </Card>
      )}

      {/* Loading */}
      {selectedVacante && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Sin candidatos */}
      {selectedVacante && !isLoading && perfilamiento?.total_candidatos === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Target size={24} className="text-gray-400" />
              </div>
            }
            title="Sin candidatos"
            description="Esta vacante aun no tiene candidatos para evaluar"
          />
        </Card>
      )}

      {/* Resultados */}
      {selectedVacante && !isLoading && perfilamiento && perfilamiento.candidatos.length > 0 && (
        <>
          {/* Leyenda de factores */}
          <div className="flex flex-wrap gap-3 px-1">
            {SCORE_FACTORS.map((f) => (
              <div key={f.key} className="flex items-center gap-1 text-[10px] text-gray-500">
                <f.icon size={10} className={f.color} />
                {f.label} ({f.max}pts)
              </div>
            ))}
          </div>

          {/* Ranking table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-10">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Candidato
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">
                      Score
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-32">
                      Desglose
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">
                      Nivel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {perfilamiento.candidatos.map((candidato, index) => {
                    const isTop3 = index < 3;
                    return (
                      <tr
                        key={candidato.candidato_id}
                        className={cn(
                          'transition-colors',
                          isTop3 && 'bg-green-50/30 dark:bg-green-900/5'
                        )}
                      >
                        {/* Ranking */}
                        <td className="px-4 py-3 text-center">
                          {index < 3 ? (
                            <div
                              className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                                index === 0
                                  ? 'bg-amber-400'
                                  : index === 1
                                    ? 'bg-gray-400'
                                    : 'bg-amber-600'
                              )}
                            >
                              {index + 1}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">{index + 1}</span>
                          )}
                        </td>

                        {/* Candidato */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {candidato.candidato_nombre}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="gray" size="sm">
                              {candidato.estado_display}
                            </Badge>
                          </div>
                        </td>

                        {/* Score total */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={cn('text-xl font-bold', getScoreColor(candidato.total))}
                            >
                              {candidato.total}
                            </span>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-700',
                                  getScoreBarColor(candidato.total)
                                )}
                                style={{ width: `${candidato.total}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Mini bar chart */}
                        <td className="px-4 py-3">
                          <ScoreBreakdown scores={candidato.scores} />
                        </td>

                        {/* Nivel badge */}
                        <td className="px-4 py-3 text-center">
                          <Badge variant={NIVEL_MATCHING_BADGE[candidato.nivel]} size="sm">
                            {candidato.nivel === 'excelente' && (
                              <Award size={10} className="mr-0.5" />
                            )}
                            {getNivelLabel(candidato.nivel)}
                          </Badge>
                        </td>

                        {/* Detalles */}
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-500 space-y-0.5">
                            <p>
                              <GraduationCap size={10} className="inline mr-1" />
                              {candidato.nivel_educativo_display}
                            </p>
                            <p>
                              <Briefcase size={10} className="inline mr-1" />
                              {candidato.anos_experiencia} anos exp.
                            </p>
                            {candidato.pretension_salarial && (
                              <p>
                                <DollarSign size={10} className="inline mr-1" />$
                                {Number(candidato.pretension_salarial).toLocaleString('es-CO')}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer con rango salarial vacante */}
            {perfilamiento.salario_rango && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                Rango salarial vacante:{' '}
                <span className="font-medium">{perfilamiento.salario_rango}</span>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
