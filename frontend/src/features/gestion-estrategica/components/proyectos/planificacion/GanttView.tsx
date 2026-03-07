/**
 * Gantt View — Cronograma estilo Monday.com
 * Tabla izquierda + barras horizontales derecha
 * Pure Tailwind, sin librería externa
 */
import { useState, useMemo, useRef } from 'react';
import { Card, Badge, EmptyState } from '@/components/common';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGantt } from '../../../hooks/useProyectos';
import type { GanttItem } from '../../../types/proyectos.types';

interface GanttViewProps {
  proyectoId: number;
  onTaskClick?: (taskId: number) => void;
}

type ZoomLevel = 'week' | 'month' | 'quarter';

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-gray-400',
  en_progreso: 'bg-blue-500',
  completada: 'bg-green-500',
  bloqueada: 'bg-red-500',
  cancelada: 'bg-gray-300',
};

const ESTADO_BORDER: Record<string, string> = {
  pendiente: 'border-gray-500',
  en_progreso: 'border-blue-600',
  completada: 'border-green-600',
  bloqueada: 'border-red-600',
  cancelada: 'border-gray-400',
};

// ==================== DATE UTILITIES ====================

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const diffDays = (a: Date, b: Date): number => {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

// ==================== GANTT HEADER (TIMELINE) ====================

interface TimelineHeaderProps {
  startDate: Date;
  totalDays: number;
  dayWidth: number;
  zoom: ZoomLevel;
}

const TimelineHeader = ({ startDate, totalDays, dayWidth, zoom }: TimelineHeaderProps) => {
  const cells: { label: string; span: number }[] = [];

  if (zoom === 'week') {
    // Show individual days
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startDate, i);
      cells.push({
        label: d.toLocaleDateString('es-CO', { day: '2-digit', weekday: 'narrow' }),
        span: 1,
      });
    }
  } else if (zoom === 'month') {
    // Group by weeks
    let i = 0;
    while (i < totalDays) {
      const d = addDays(startDate, i);
      const weekEnd = Math.min(i + 7, totalDays);
      cells.push({
        label: formatDate(d),
        span: weekEnd - i,
      });
      i = weekEnd;
    }
  } else {
    // Group by months
    let i = 0;
    while (i < totalDays) {
      const d = addDays(startDate, i);
      const monthName = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const daysInGroup = Math.min(diffDays(d, nextMonth), totalDays - i);
      cells.push({ label: monthName, span: Math.max(daysInGroup, 1) });
      i += daysInGroup;
    }
  }

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      {cells.map((cell, idx) => (
        <div
          key={idx}
          className="text-xs text-center text-gray-500 dark:text-gray-400 py-1 border-r border-gray-200 dark:border-gray-700 shrink-0 truncate"
          style={{ width: cell.span * dayWidth }}
        >
          {cell.label}
        </div>
      ))}
    </div>
  );
};

// ==================== TODAY LINE ====================

interface TodayLineProps {
  startDate: Date;
  totalDays: number;
  dayWidth: number;
  height: number;
}

const TodayLine = ({ startDate, totalDays, dayWidth, height }: TodayLineProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = diffDays(startDate, today);
  if (offset < 0 || offset > totalDays) return null;

  return (
    <div
      className="absolute top-0 w-0.5 bg-red-500 z-10 pointer-events-none"
      style={{ left: offset * dayWidth, height }}
    />
  );
};

// ==================== GANTT BAR ====================

interface GanttBarProps {
  item: GanttItem;
  startDate: Date;
  dayWidth: number;
  onClick?: () => void;
}

const GanttBar = ({ item, startDate, dayWidth, onClick }: GanttBarProps) => {
  if (!item.inicio || !item.fin) return null;

  const taskStart = new Date(item.inicio);
  const taskEnd = new Date(item.fin);
  const offsetDays = diffDays(startDate, taskStart);
  const durationDays = Math.max(diffDays(taskStart, taskEnd) + 1, 1);

  const left = Math.max(offsetDays * dayWidth, 0);
  const width = Math.max(durationDays * dayWidth - 2, 16);

  return (
    <div
      className={`absolute top-1 h-6 rounded cursor-pointer border ${ESTADO_BORDER[item.estado] || 'border-gray-500'} ${ESTADO_COLOR[item.estado] || 'bg-gray-400'} opacity-80 hover:opacity-100 transition-opacity group`}
      style={{ left, width }}
      onClick={onClick}
      title={`${item.nombre} (${item.avance}%)`}
    >
      {/* Progress bar inside */}
      {item.avance > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-l bg-white/30"
          style={{ width: `${item.avance}%` }}
        />
      )}
      {/* Label */}
      {width > 60 && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white truncate px-1">
          {item.avance}%
        </span>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export const GanttView = ({ proyectoId, onTaskClick }: GanttViewProps) => {
  const { data: ganttData, isLoading } = useGantt(proyectoId);
  const [zoom, setZoom] = useState<ZoomLevel>('month');
  const scrollRef = useRef<HTMLDivElement>(null);

  const items: GanttItem[] = ganttData ?? [];

  // Calculate date range
  const { startDate, endDate, totalDays, dayWidth } = useMemo(() => {
    const tasksWithDates = items.filter((t) => t.inicio && t.fin);
    if (tasksWithDates.length === 0) {
      const now = new Date();
      const s = startOfWeek(now);
      return { startDate: s, endDate: addDays(s, 30), totalDays: 30, dayWidth: 30 };
    }

    const starts = tasksWithDates.map((t) => new Date(t.inicio!).getTime());
    const ends = tasksWithDates.map((t) => new Date(t.fin!).getTime());

    const minDate = startOfWeek(new Date(Math.min(...starts)));
    const maxDate = addDays(new Date(Math.max(...ends)), 7);
    const days = Math.max(diffDays(minDate, maxDate), 14);

    const dw = zoom === 'week' ? 40 : zoom === 'month' ? 20 : 8;

    return { startDate: minDate, endDate: maxDate, totalDays: days, dayWidth: dw };
  }, [items, zoom]);

  const ROW_HEIGHT = 32;

  const scrollToToday = () => {
    if (!scrollRef.current) return;
    const today = new Date();
    const offset = diffDays(startDate, today);
    scrollRef.current.scrollLeft = Math.max(offset * dayWidth - 200, 0);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse-subtle">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12" />}
        title="Sin datos para el Gantt"
        description="Crea actividades con fechas para visualizar el cronograma"
      />
    );
  }

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Diagrama de Gantt"
        subtitle={`${items.length} actividades`}
        extraActions={[
          {
            label: 'Hoy',
            icon: <Calendar className="h-4 w-4" />,
            onClick: scrollToToday,
            variant: 'secondary',
          },
        ]}
      />

      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        {(['week', 'month', 'quarter'] as ZoomLevel[]).map((z) => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              zoom === z
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {z === 'week' ? 'Semana' : z === 'month' ? 'Mes' : 'Trimestre'}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-hidden rounded-lg">
          <div className="flex">
            {/* Left table */}
            <div className="shrink-0 w-64 border-r border-gray-200 dark:border-gray-700">
              {/* Table header */}
              <div className="h-8 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center px-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Actividad
                </span>
              </div>
              {/* Table rows */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onTaskClick?.(item.id)}
                >
                  <span className="font-mono text-[10px] text-gray-400 shrink-0 w-10">
                    {item.codigo_wbs || '-'}
                  </span>
                  <span className="text-xs text-gray-900 dark:text-gray-100 truncate flex-1">
                    {item.nombre}
                  </span>
                  <Badge
                    variant={
                      item.estado === 'completada'
                        ? 'success'
                        : item.estado === 'bloqueada'
                          ? 'danger'
                          : item.estado === 'en_progreso'
                            ? 'info'
                            : 'gray'
                    }
                    size="sm"
                  >
                    {item.avance}%
                  </Badge>
                </div>
              ))}
            </div>

            {/* Right gantt area */}
            <div className="flex-1 overflow-x-auto" ref={scrollRef}>
              <div style={{ width: totalDays * dayWidth, minWidth: '100%' }}>
                {/* Timeline header */}
                <TimelineHeader
                  startDate={startDate}
                  totalDays={totalDays}
                  dayWidth={dayWidth}
                  zoom={zoom}
                />

                {/* Gantt rows */}
                <div className="relative" style={{ height: items.length * ROW_HEIGHT }}>
                  {/* Today line */}
                  <TodayLine
                    startDate={startDate}
                    totalDays={totalDays}
                    dayWidth={dayWidth}
                    height={items.length * ROW_HEIGHT}
                  />

                  {/* Grid lines (alternating rows) */}
                  {items.map((_, idx) => (
                    <div
                      key={idx}
                      className={`absolute w-full border-b border-gray-100 dark:border-gray-800 ${
                        idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'
                      }`}
                      style={{ top: idx * ROW_HEIGHT, height: ROW_HEIGHT }}
                    />
                  ))}

                  {/* Bars */}
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="absolute w-full"
                      style={{ top: idx * ROW_HEIGHT, height: ROW_HEIGHT }}
                    >
                      <GanttBar
                        item={item}
                        startDate={startDate}
                        dayWidth={dayWidth}
                        onClick={() => onTaskClick?.(item.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-400" /> Pendiente
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500" /> En Progreso
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500" /> Completada
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500" /> Bloqueada
        </span>
        <span className="flex items-center gap-1">
          <span className="w-0.5 h-3 bg-red-500" /> Hoy
        </span>
      </div>
    </div>
  );
};
