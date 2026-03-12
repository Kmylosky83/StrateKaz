/**
 * ObjetivoNode - Nodo de Objetivo Estratégico para el Mapa
 *
 * Muestra información del objetivo con:
 * - Color según perspectiva BSC (tokens del Design System)
 * - Barra de progreso con componente Progress
 * - Estado con Badge del Design System
 * - Normas ISO vinculadas
 * - Handles para conexiones causa-efecto
 */

import { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge, DynamicIcon, Tooltip, Progress } from '@/components/common';
import type { BadgeVariant } from '@/components/common';
import type { ObjetivoNodeData } from '../../types/mapa-estrategico.types';
import {
  getObjectiveStatusConfig,
  BSC_PERSPECTIVES,
  type BSCPerspectiveConfig,
} from '../../constants/semantic-tokens';

/**
 * Mapeo de token de color del Design System a clases Tailwind.
 * Usa los tokens semánticos definidos en tailwind.config.js
 */
const COLOR_TOKEN_CLASSES: Record<
  string,
  {
    bg: string;
    bgLight: string;
    border: string;
    text: string;
    progress: string;
  }
> = {
  success: {
    bg: 'bg-success-500',
    bgLight: 'from-success-50 to-success-100 dark:from-success-900/30 dark:to-success-900/20',
    border: 'border-success-200 dark:border-success-700',
    text: 'text-success-700 dark:text-success-400',
    progress: 'bg-success-500',
  },
  info: {
    bg: 'bg-info-500',
    bgLight: 'from-info-50 to-info-100 dark:from-info-900/30 dark:to-info-900/20',
    border: 'border-info-200 dark:border-info-700',
    text: 'text-info-700 dark:text-info-400',
    progress: 'bg-info-500',
  },
  warning: {
    bg: 'bg-warning-500',
    bgLight: 'from-warning-50 to-warning-100 dark:from-warning-900/30 dark:to-warning-900/20',
    border: 'border-warning-200 dark:border-warning-700',
    text: 'text-warning-700 dark:text-warning-400',
    progress: 'bg-warning-500',
  },
  accent: {
    bg: 'bg-accent-500',
    bgLight: 'from-accent-50 to-accent-100 dark:from-accent-900/30 dark:to-accent-900/20',
    border: 'border-accent-200 dark:border-accent-700',
    text: 'text-accent-700 dark:text-accent-400',
    progress: 'bg-accent-500',
  },
};

/**
 * Obtiene las clases de color basándose en la perspectiva BSC
 */
const getColorClasses = (perspective: string) => {
  const config = BSC_PERSPECTIVES[perspective];
  if (!config) return COLOR_TOKEN_CLASSES.accent;
  return COLOR_TOKEN_CLASSES[config.colorToken] || COLOR_TOKEN_CLASSES.accent;
};

interface ObjetivoNodeProps {
  data: ObjetivoNodeData;
  selected?: boolean;
}

const ObjetivoNode = memo(({ data, selected }: ObjetivoNodeProps) => {
  const { objetivo, perspectiveConfig: _perspectiveConfig, onEdit } = data;

  // Obtener configuración de perspectiva BSC desde tokens semánticos
  const bscConfig = useMemo<BSCPerspectiveConfig>(() => {
    return BSC_PERSPECTIVES[objetivo.bsc_perspective] || BSC_PERSPECTIVES.APRENDIZAJE;
  }, [objetivo.bsc_perspective]);

  // Obtener clases de color según perspectiva
  const colors = useMemo(() => {
    return getColorClasses(objetivo.bsc_perspective);
  }, [objetivo.bsc_perspective]);

  // Obtener config de estado desde tokens semánticos
  const statusConfig = useMemo(() => {
    return getObjectiveStatusConfig(objetivo.status);
  }, [objetivo.status]);

  // Calcular el progreso visual (limitado a 100)
  const progressWidth = Math.min(objetivo.progress, 100);

  return (
    <div
      className={`
        w-[260px] rounded-xl border-2 shadow-md transition-all duration-200
        bg-white dark:bg-gray-900
        ${
          selected
            ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800 scale-105'
            : `${colors.border} hover:shadow-lg`
        }
      `}
      onDoubleClick={() => onEdit?.(objetivo.id)}
    >
      {/* Handle de entrada (arriba) - para recibir conexiones */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white dark:!border-gray-900"
      />

      {/* Header con color de perspectiva */}
      <div
        className={`px-3 py-2 bg-gradient-to-r ${colors.bgLight} rounded-t-xl border-b ${colors.border}`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colors.bg} text-white shadow-sm`}>
            <DynamicIcon name={bscConfig.icon} size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-medium ${colors.text} uppercase tracking-wide`}>
              {bscConfig.shortLabel}
            </p>
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{objetivo.code}</p>
          </div>
          <Badge variant={statusConfig.badgeVariant as BadgeVariant} size="sm">
            <DynamicIcon name={statusConfig.icon} size={12} className="mr-1" />
            {objetivo.progress}%
          </Badge>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3 space-y-2">
        {/* Nombre del objetivo */}
        <Tooltip content={objetivo.name}>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 cursor-help">
            {objetivo.name}
          </h4>
        </Tooltip>

        {/* Barra de progreso */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500 dark:text-gray-400">
              {objetivo.current_value ?? 0} / {objetivo.target_value ?? 100} {objetivo.unit || '%'}
            </span>
            <span className={`font-medium ${colors.text}`}>{objetivo.progress}%</span>
          </div>
          <Progress
            value={progressWidth}
            size="sm"
            variant={bscConfig.colorToken as 'success' | 'info' | 'warning' | 'accent'}
          />
        </div>

        {/* Normas ISO vinculadas */}
        {objetivo.normas_iso_detail && objetivo.normas_iso_detail.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {objetivo.normas_iso_detail.slice(0, 3).map((norma) => (
              <Tooltip key={norma.id} content={norma.short_name}>
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                  {norma.code}
                </span>
              </Tooltip>
            ))}
            {objetivo.normas_iso_detail.length > 3 && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                +{objetivo.normas_iso_detail.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Responsable y fecha */}
        {(objetivo.responsible_name || objetivo.due_date) && (
          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
            {objetivo.responsible_name && (
              <span className="truncate max-w-[120px]">{objetivo.responsible_name}</span>
            )}
            {objetivo.due_date && (
              <span>
                {new Date(objetivo.due_date).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Handle de salida (abajo) - para crear conexiones */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!w-3 !h-3 ${colors.bg} !border-2 !border-white dark:!border-gray-900`}
      />
    </div>
  );
});

ObjetivoNode.displayName = 'ObjetivoNode';

export default ObjetivoNode;
