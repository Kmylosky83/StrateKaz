/**
 * Gantt View — Cronograma PMI
 * Fases colapsables + flechas de dependencia SVG + tooltips enriquecidos
 * Pure Tailwind + SVG overlay, sin librerías externas
 */
import { useState, useMemo, useRef } from 'react';
import { Card, Badge, EmptyState } from '@/components/common';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { useGantt } from '../../../hooks/useProyectos';
import type { GanttItem } from '../../../types/proyectos.types';

interface GanttViewProps {
  proyectoId: number;
  onTaskClick?: (taskId: number) => void;
}

type ZoomLevel = 'week' | 'month' | 'quarter';

type FaseRow = { type: 'fase'; faseKey: string; faseName: string; count: number };
type ItemRow = { type: 'item'; item: GanttItem };
type DisplayRow = FaseRow | ItemRow;

const ROW_H = 36;
const FASE_H = 28;
const LEFT_W = 284;
const HEADER_H = 28;

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-gray-400',
  en_progreso: 'bg-blue-500',
  completada: 'bg-green-500',
  bloqueada: 'bg-red-500',
  cancelada: 'bg-gray-300',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completada: 'Completada',
  bloqueada: 'Bloqueada',
  cancelada: 'Cancelada',
};

const ESTADO_BADGE: Record<string, 'success' | 'danger' | 'info' | 'gray'> = {
  pendiente: 'gray',
  en_progreso: 'info',
  completada: 'success',
  bloqueada: 'danger',
  cancelada: 'gray',
};

// ─── DATE UTILITIES ───────────────────────────────────────────────────────────

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const diffDays = (a: Date, b: Date): number => Math.ceil((b.getTime() - a.getTime()) / 86400000);

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── TIMELINE HEADER ─────────────────────────────────────────────────────────

const TimelineHeader = ({
  startDate,
  totalDays,
  dayWidth,
  zoom,
}: {
  startDate: Date;
  totalDays: number;
  dayWidth: number;
  zoom: ZoomLevel;
}) => {
  const cells: { label: string; span: number }[] = [];

  if (zoom === 'week') {
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startDate, i);
      cells.push({
        label: d.toLocaleDateString('es-CO', { day: '2-digit', weekday: 'narrow' }),
        span: 1,
      });
    }
  } else if (zoom === 'month') {
    let i = 0;
    while (i < totalDays) {
      const d = addDays(startDate, i);
      const end = Math.min(i + 7, totalDays);
      cells.push({
        label: d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
        span: end - i,
      });
      i = end;
    }
  } else {
    let i = 0;
    while (i < totalDays) {
      const d = addDays(startDate, i);
      const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const span = Math.min(diffDays(d, nextMonth), totalDays - i);
      cells.push({ label, span: Math.max(span, 1) });
      i += span;
    }
  }

  return (
    <div
      className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
      style={{ height: HEADER_H }}
    >
      {cells.map((cell, idx) => (
        <div
          key={idx}
          className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 shrink-0 truncate px-0.5"
          style={{ width: cell.span * dayWidth }}
        >
          {cell.label}
        </div>
      ))}
    </div>
  );
};

// ─── GANTT BAR ────────────────────────────────────────────────────────────────

const GanttBar = ({
  item,
  startDate,
  dayWidth,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  item: GanttItem;
  startDate: Date;
  dayWidth: number;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick?: () => void;
}) => {
  if (!item.inicio || !item.fin) return null;

  const taskStart = new Date(item.inicio);
  const taskEnd = new Date(item.fin);
  const offsetDays = diffDays(startDate, taskStart);
  const durationDays = Math.max(diffDays(taskStart, taskEnd) + 1, 1);

  const left = Math.max(offsetDays * dayWidth, 0);
  const width = Math.max(durationDays * dayWidth - 2, 14);

  return (
    <div
      className={`absolute top-1.5 h-[22px] rounded cursor-pointer ${ESTADO_COLOR[item.estado] ?? 'bg-gray-400'} opacity-90 hover:opacity-100 transition-opacity`}
      style={{ left, width }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {item.avance > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-l bg-white/30"
          style={{ width: `${item.avance}%` }}
        />
      )}
      {width > 48 && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white select-none px-1 truncate">
          {item.avance}%
        </span>
      )}
    </div>
  );
};

// ─── DEPENDENCY ARROWS (SVG) ──────────────────────────────────────────────────

const DependencyArrows = ({
  displayRows,
  rowHeights,
  rowYPositions,
  itemRowMap,
  startDate,
  dayWidth,
  totalHeight,
  totalWidth,
}: {
  displayRows: DisplayRow[];
  rowHeights: number[];
  rowYPositions: number[];
  itemRowMap: Record<number, number>;
  startDate: Date;
  dayWidth: number;
  totalHeight: number;
  totalWidth: number;
}) => {
  const arrows: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    key: string;
  }[] = [];

  displayRows.forEach((row, toIdx) => {
    if (row.type !== 'item') return;
    const { item } = row;
    if (!item.inicio) return;

    item.predecesoras.forEach((predId) => {
      const fromIdx = itemRowMap[predId];
      if (fromIdx === undefined) return;
      const fromRow = displayRows[fromIdx];
      if (fromRow.type !== 'item' || !fromRow.item.fin) return;

      const fromX = (diffDays(startDate, new Date(fromRow.item.fin)) + 1) * dayWidth;
      const fromY = rowYPositions[fromIdx] + rowHeights[fromIdx] / 2;
      const toX = Math.max(diffDays(startDate, new Date(item.inicio!)) * dayWidth, 0);
      const toY = rowYPositions[toIdx] + rowHeights[toIdx] / 2;

      arrows.push({ fromX, fromY, toX, toY, key: `${predId}-${item.id}` });
    });
  });

  if (arrows.length === 0) return null;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: totalWidth, height: totalHeight, overflow: 'visible' }}
    >
      <defs>
        <marker
          id="gantt-arrowhead"
          markerWidth="6"
          markerHeight="5"
          refX="6"
          refY="2.5"
          orient="auto"
        >
          <polygon points="0 0, 6 2.5, 0 5" fill="#9CA3AF" />
        </marker>
      </defs>
      {arrows.map(({ fromX, fromY, toX, toY, key }) => {
        const midX = (fromX + toX) / 2;
        return (
          <path
            key={key}
            d={`M${fromX},${fromY} C${midX},${fromY} ${midX},${toY} ${toX},${toY}`}
            fill="none"
            stroke="#9CA3AF"
            strokeWidth={1.5}
            strokeDasharray="5,3"
            markerEnd="url(#gantt-arrowhead)"
          />
        );
      })}
    </svg>
  );
};

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────

const GanttTooltip = ({ item, x, y }: { item: GanttItem; x: number; y: number }) => (
  <div
    className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 pointer-events-none text-xs max-w-[230px]"
    style={{ left: x + 14, top: y - 10 }}
  >
    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
      {item.codigo_wbs && <span className="font-mono text-gray-400 mr-1">{item.codigo_wbs}</span>}
      {item.nombre}
    </p>
    <div className="space-y-1 text-gray-600 dark:text-gray-400">
      {item.inicio && (
        <div className="flex justify-between gap-4">
          <span>Inicio</span>
          <span className="text-gray-900 dark:text-gray-200">{fmtDate(item.inicio)}</span>
        </div>
      )}
      {item.fin && (
        <div className="flex justify-between gap-4">
          <span>Fin</span>
          <span className="text-gray-900 dark:text-gray-200">{fmtDate(item.fin)}</span>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <span>Avance</span>
        <span className="font-medium text-gray-900 dark:text-gray-200">{item.avance}%</span>
      </div>
      {item.responsable && (
        <div className="flex justify-between gap-4">
          <span>Responsable</span>
          <span className="text-gray-900 dark:text-gray-200 truncate max-w-[120px]">
            {item.responsable}
          </span>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <span>Estado</span>
        <span className="text-gray-900 dark:text-gray-200">
          {ESTADO_LABEL[item.estado] ?? item.estado}
        </span>
      </div>
      {item.predecesoras.length > 0 && (
        <div className="flex justify-between gap-4">
          <span>Predecesoras</span>
          <span className="text-gray-900 dark:text-gray-200">#{item.predecesoras.join(', #')}</span>
        </div>
      )}
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const GanttView = ({ proyectoId, onTaskClick }: GanttViewProps) => {
  const { data: ganttData, isLoading } = useGantt(proyectoId);
  const [zoom, setZoom] = useState<ZoomLevel>('month');
  const [collapsedFases, setCollapsedFases] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<{ item: GanttItem; x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = useMemo<GanttItem[]>(() => ganttData ?? [], [ganttData]);

  // ── Rango de fechas
  const { startDate, totalDays, dayWidth } = useMemo(() => {
    const withDates = items.filter((t) => t.inicio && t.fin);
    if (withDates.length === 0) {
      return { startDate: startOfWeek(new Date()), totalDays: 30, dayWidth: 22 };
    }
    const starts = withDates.map((t) => new Date(t.inicio!).getTime());
    const ends = withDates.map((t) => new Date(t.fin!).getTime());
    const min = startOfWeek(new Date(Math.min(...starts)));
    const max = addDays(new Date(Math.max(...ends)), 7);
    const days = Math.max(diffDays(min, max), 14);
    const dw = zoom === 'week' ? 40 : zoom === 'month' ? 22 : 9;
    return { startDate: min, totalDays: days, dayWidth: dw };
  }, [items, zoom]);

  // ── Agrupar por fase
  const groupedByFase = useMemo(() => {
    const map = new Map<string, { faseName: string; faseOrden: number; items: GanttItem[] }>();
    items.forEach((item) => {
      const key = item.fase_id != null ? String(item.fase_id) : '__sin_fase__';
      if (!map.has(key)) {
        map.set(key, {
          faseName: item.fase_nombre ?? 'Sin fase asignada',
          faseOrden: item.fase_orden ?? 999,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].faseOrden - b[1].faseOrden)
      .map(([key, val]) => ({ faseKey: key, ...val }));
  }, [items]);

  // ── Filas planas con posiciones Y
  const { displayRows, rowHeights, rowYPositions, totalHeight, itemRowMap } = useMemo(() => {
    const rows: DisplayRow[] = [];
    const heights: number[] = [];
    const yPos: number[] = [];
    const itemMap: Record<number, number> = {};
    let y = 0;

    groupedByFase.forEach(({ faseKey, faseName, items: faseItems }) => {
      rows.push({ type: 'fase', faseKey, faseName, count: faseItems.length });
      heights.push(FASE_H);
      yPos.push(y);
      y += FASE_H;

      if (!collapsedFases.has(faseKey)) {
        faseItems.forEach((item) => {
          itemMap[item.id] = rows.length;
          rows.push({ type: 'item', item });
          heights.push(ROW_H);
          yPos.push(y);
          y += ROW_H;
        });
      }
    });

    return {
      displayRows: rows,
      rowHeights: heights,
      rowYPositions: yPos,
      totalHeight: y,
      itemRowMap: itemMap,
    };
  }, [groupedByFase, collapsedFases]);

  const toggleFase = (faseKey: string) => {
    setCollapsedFases((prev) => {
      const next = new Set(prev);
      if (next.has(faseKey)) {
        next.delete(faseKey);
      } else {
        next.add(faseKey);
      }
      return next;
    });
  };

  const scrollToToday = () => {
    if (!scrollRef.current) return;
    const offset = diffDays(startDate, new Date());
    scrollRef.current.scrollLeft = Math.max(offset * dayWidth - 200, 0);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-3 animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12" />}
        title="Sin actividades para el Gantt"
        description="Crea actividades con fechas de inicio y fin para visualizar el cronograma"
      />
    );
  }

  const totalWidth = totalDays * dayWidth;

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Diagrama de Gantt"
        subtitle={`${items.length} actividades · ${groupedByFase.length} fases`}
        extraActions={[
          {
            label: 'Hoy',
            icon: <Calendar className="h-4 w-4" />,
            onClick: scrollToToday,
            variant: 'secondary',
          },
        ]}
      />

      {/* Zoom */}
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
        <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          {/* ─── PANEL IZQUIERDO ─── */}
          <div
            className="shrink-0 border-r border-gray-200 dark:border-gray-700"
            style={{ width: LEFT_W }}
          >
            {/* Header */}
            <div
              className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center px-3"
              style={{ height: HEADER_H }}
            >
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Actividad
              </span>
            </div>

            {/* Filas */}
            <div style={{ height: totalHeight }}>
              {displayRows.map((row) =>
                row.type === 'fase' ? (
                  <div
                    key={row.faseKey}
                    className="flex items-center gap-1.5 px-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/60 select-none"
                    style={{ height: FASE_H }}
                    onClick={() => toggleFase(row.faseKey)}
                  >
                    {collapsedFases.has(row.faseKey) ? (
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate flex-1">
                      {row.faseName}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">{row.count}</span>
                  </div>
                ) : (
                  <div
                    key={row.item.id}
                    className="flex items-center gap-2 px-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                    style={{ height: ROW_H }}
                    onClick={() => onTaskClick?.(row.item.id)}
                  >
                    <span className="font-mono text-[10px] text-gray-400 shrink-0 w-9 truncate">
                      {row.item.codigo_wbs || '—'}
                    </span>
                    <span className="text-xs text-gray-800 dark:text-gray-200 truncate flex-1">
                      {row.item.nombre}
                    </span>
                    <Badge variant={ESTADO_BADGE[row.item.estado] ?? 'gray'} size="sm">
                      {row.item.avance}%
                    </Badge>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ─── PANEL DERECHO (TIMELINE) ─── */}
          <div className="flex-1 overflow-x-auto" ref={scrollRef}>
            <div style={{ width: totalWidth, minWidth: '100%' }}>
              {/* Header timeline */}
              <TimelineHeader
                startDate={startDate}
                totalDays={totalDays}
                dayWidth={dayWidth}
                zoom={zoom}
              />

              {/* Área de barras */}
              <div className="relative" style={{ height: totalHeight }}>
                {/* Línea Hoy */}
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const offset = diffDays(startDate, today);
                  if (offset < 0 || offset > totalDays) return null;
                  return (
                    <div
                      className="absolute top-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                      style={{ left: offset * dayWidth, height: totalHeight }}
                    />
                  );
                })()}

                {/* Fondo de filas */}
                {displayRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`absolute w-full border-b ${
                      row.type === 'fase'
                        ? 'bg-gray-50/80 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'
                        : idx % 2 === 0
                          ? 'border-gray-100 dark:border-gray-800'
                          : 'bg-gray-50/30 dark:bg-gray-800/10 border-gray-100 dark:border-gray-800'
                    }`}
                    style={{ top: rowYPositions[idx], height: rowHeights[idx] }}
                  />
                ))}

                {/* Flechas de dependencia */}
                <DependencyArrows
                  displayRows={displayRows}
                  rowHeights={rowHeights}
                  rowYPositions={rowYPositions}
                  itemRowMap={itemRowMap}
                  startDate={startDate}
                  dayWidth={dayWidth}
                  totalHeight={totalHeight}
                  totalWidth={totalWidth}
                />

                {/* Barras Gantt */}
                {displayRows.map((row, idx) => {
                  if (row.type !== 'item') return null;
                  return (
                    <div
                      key={row.item.id}
                      className="absolute w-full"
                      style={{ top: rowYPositions[idx], height: ROW_H }}
                    >
                      <GanttBar
                        item={row.item}
                        startDate={startDate}
                        dayWidth={dayWidth}
                        onMouseEnter={(e) =>
                          setTooltip({ item: row.item, x: e.clientX, y: e.clientY })
                        }
                        onMouseLeave={() => setTooltip(null)}
                        onClick={() => onTaskClick?.(row.item.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
        {Object.entries(ESTADO_LABEL).map(([estado, label]) => (
          <span key={estado} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded shrink-0 ${ESTADO_COLOR[estado]}`} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-0.5 h-3 bg-red-500 shrink-0" />
          Hoy
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8" className="shrink-0">
            <line
              x1="0"
              y1="4"
              x2="15"
              y2="4"
              stroke="#9CA3AF"
              strokeWidth="1.5"
              strokeDasharray="4,2"
            />
            <polygon points="15,1 21,4 15,7" fill="#9CA3AF" />
          </svg>
          Dependencia
        </span>
      </div>

      {/* Tooltip flotante */}
      {tooltip && <GanttTooltip {...tooltip} />}
    </div>
  );
};
