/**
 * GanttTimeline — Vista tipo Gantt para actividades de un plan de trabajo
 * Renderiza barras horizontales por actividad con eje X de meses
 * Usa Tailwind CSS exclusivamente (sin librerías externas)
 */
import { useMemo, useState } from 'react';
import type { ActividadPlan, EstadoActividad } from '../../types/planificacion-sistema.types';

interface GanttTimelineProps {
  actividades: ActividadPlan[];
  planFechaInicio?: string;
  planFechaFin?: string;
}

interface TooltipInfo {
  actividad: ActividadPlan;
  x: number;
  y: number;
}

const ESTADO_COLORS: Record<EstadoActividad, string> = {
  PENDIENTE: 'bg-gray-400',
  EN_PROCESO: 'bg-blue-500',
  COMPLETADA: 'bg-green-500',
  CANCELADA: 'bg-gray-300',
  RETRASADA: 'bg-red-500',
};

const ESTADO_LABELS: Record<EstadoActividad, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En Proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  RETRASADA: 'Retrasada',
};

const MESES_CORTO = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

function getMonthsBetween(
  start: Date,
  end: Date
): { year: number; month: number; label: string }[] {
  const months: { year: number; month: number; label: string }[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth(),
      label: `${MESES_CORTO[current.getMonth()]} ${current.getFullYear()}`,
    });
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calcBarPosition(
  actividadStart: Date,
  actividadEnd: Date,
  rangeStart: Date,
  totalDays: number
): { left: number; width: number } {
  const startDiff = Math.max(
    0,
    (actividadStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const endDiff = Math.max(
    0,
    (actividadEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const left = clamp((startDiff / totalDays) * 100, 0, 100);
  const right = clamp((endDiff / totalDays) * 100, 0, 100);
  const width = Math.max(right - left, 0.5);

  return { left, width };
}

export function GanttTimeline({ actividades, planFechaInicio, planFechaFin }: GanttTimelineProps) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const { rangeStart, rangeEnd, months, totalDays } = useMemo(() => {
    if (!actividades.length && !planFechaInicio) {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      const months = getMonthsBetween(start, end);
      const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return { rangeStart: start, rangeEnd: end, months, totalDays };
    }

    const dates: Date[] = [];

    if (planFechaInicio) dates.push(new Date(planFechaInicio));
    if (planFechaFin) dates.push(new Date(planFechaFin));

    actividades.forEach((a) => {
      if (a.fecha_programada_inicio) dates.push(new Date(a.fecha_programada_inicio));
      if (a.fecha_programada_fin) dates.push(new Date(a.fecha_programada_fin));
    });

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    const months = getMonthsBetween(start, end);
    const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return { rangeStart: start, rangeEnd: end, months, totalDays };
  }, [actividades, planFechaInicio, planFechaFin]);

  if (!actividades.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
        <div className="text-4xl mb-3">📅</div>
        <p className="text-sm">No hay actividades para mostrar en el cronograma</p>
      </div>
    );
  }

  const today = new Date();
  const todayOffset =
    ((today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
  const showTodayLine = todayOffset >= 0 && todayOffset <= 100;

  return (
    <div className="relative">
      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400">
        {(Object.entries(ESTADO_LABELS) as [EstadoActividad, string][]).map(([estado, label]) => (
          <div key={estado} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${ESTADO_COLORS[estado]}`} />
            <span>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-4 bg-red-500" />
          <span>Hoy</span>
        </div>
      </div>

      {/* Gantt scrollable */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(months.length * 100, 600)}px` }}>
          {/* Header de meses */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-1">
            {/* Columna de nombres (fija visualmente) */}
            <div className="w-48 flex-shrink-0" />
            <div className="flex-1 flex">
              {months.map((m, idx) => (
                <div
                  key={`${m.year}-${m.month}`}
                  className={`flex-1 text-center text-xs font-medium py-2 text-gray-600 dark:text-gray-400 ${
                    idx < months.length - 1 ? 'border-r border-gray-200 dark:border-gray-700' : ''
                  }`}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Filas de actividades */}
          <div className="space-y-1">
            {actividades.map((actividad) => {
              const actStart = actividad.fecha_programada_inicio
                ? new Date(actividad.fecha_programada_inicio)
                : rangeStart;
              const actEnd = actividad.fecha_programada_fin
                ? new Date(actividad.fecha_programada_fin)
                : rangeEnd;

              const { left, width } = calcBarPosition(actStart, actEnd, rangeStart, totalDays);
              const estado = actividad.estado as EstadoActividad;
              const avance = parseFloat(actividad.porcentaje_avance ?? '0');

              return (
                <div
                  key={actividad.id}
                  className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded"
                >
                  {/* Nombre de actividad */}
                  <div className="w-48 flex-shrink-0 pr-3 py-1">
                    <p
                      className="text-xs text-gray-700 dark:text-gray-300 truncate font-medium"
                      title={actividad.nombre}
                    >
                      {actividad.nombre}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{actividad.codigo}</p>
                  </div>

                  {/* Área de barras */}
                  <div className="flex-1 relative h-8">
                    {/* Columnas de meses (fondo) */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {months.map((m, idx) => (
                        <div
                          key={`${m.year}-${m.month}`}
                          className={`flex-1 h-full ${
                            idx % 2 === 0 ? 'bg-transparent' : 'bg-gray-50/50 dark:bg-gray-800/20'
                          } ${
                            idx < months.length - 1
                              ? 'border-r border-gray-100 dark:border-gray-800'
                              : ''
                          }`}
                        />
                      ))}
                    </div>

                    {/* Línea de hoy */}
                    {showTodayLine && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
                        style={{ left: `${todayOffset}%` }}
                      />
                    )}

                    {/* Barra de actividad */}
                    <div
                      className={`absolute top-1 bottom-1 rounded cursor-pointer transition-opacity hover:opacity-80 ${ESTADO_COLORS[estado]}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ actividad, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Barra de avance interna */}
                      {avance > 0 && avance < 100 && (
                        <div
                          className="absolute top-0 left-0 bottom-0 bg-white/30 rounded-l"
                          style={{ width: `${avance}%` }}
                        />
                      )}
                      {/* Texto de % dentro de la barra si hay espacio */}
                      {width > 8 && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                          {avance}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ top: tooltip.y - 10, left: tooltip.x }}
        >
          <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 text-xs max-w-xs -translate-y-full -translate-x-1/2">
            <p className="font-semibold mb-1">{tooltip.actividad.nombre}</p>
            <p className="text-gray-300">{tooltip.actividad.codigo}</p>
            <div className="mt-2 space-y-0.5 text-gray-300">
              <p>
                Inicio:{' '}
                {tooltip.actividad.fecha_programada_inicio
                  ? new Date(tooltip.actividad.fecha_programada_inicio).toLocaleDateString('es-CO')
                  : 'N/A'}
              </p>
              <p>
                Fin:{' '}
                {tooltip.actividad.fecha_programada_fin
                  ? new Date(tooltip.actividad.fecha_programada_fin).toLocaleDateString('es-CO')
                  : 'N/A'}
              </p>
              <p>Estado: {ESTADO_LABELS[tooltip.actividad.estado as EstadoActividad]}</p>
              <p>Avance: {tooltip.actividad.porcentaje_avance ?? 0}%</p>
              {tooltip.actividad.responsable_nombre && (
                <p>Responsable: {tooltip.actividad.responsable_nombre}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GanttTimeline;
