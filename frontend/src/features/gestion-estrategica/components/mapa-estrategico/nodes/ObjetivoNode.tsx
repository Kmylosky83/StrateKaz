/**
 * ObjetivoNode - Nodo personalizado para Objetivos Estratégicos en React Flow
 * Sistema de Gestión StrateKaz
 *
 * Componente de nodo personalizado que representa un Objetivo Estratégico
 * en el Mapa Estratégico BSC. Incluye:
 *
 * - Code y nombre del objetivo
 * - Progress circular
 * - Badge de estado
 * - Badges de normas ISO
 * - Handles top y bottom para conexiones
 * - Colores según perspectiva BSC
 * - Hover effect y click para editar
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/common';
import { type ObjetivoNodeData } from '../../../types/mapa-estrategico.types';
import { cn } from '@/utils/cn';

// ============================================================================
// PROGRESS CIRCLE
// ============================================================================

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const ProgressCircle = ({
  progress,
  size = 48,
  strokeWidth = 4,
  color = '#3b82f6',
}: ProgressCircleProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {/* Progress text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// OBJETIVO NODE COMPONENT
// ============================================================================

export const ObjetivoNode = memo(({ data, selected }: NodeProps<ObjetivoNodeData>) => {
  const { objetivo, perspectiveConfig, statusConfig, onEdit } = data;

  // Color de la perspectiva (para el borde y progress)
  const perspectiveColor = {
    green: '#10b981',
    blue: '#3b82f6',
    amber: '#f59e0b',
    purple: '#a855f7',
  }[perspectiveConfig.color];

  // Truncar nombre si es muy largo
  const displayName =
    objetivo.name.length > 60 ? `${objetivo.name.substring(0, 57)}...` : objetivo.name;

  // Status icon
  const StatusIcon =
    {
      Clock: AlertCircle,
      PlayCircle: TrendingUp,
      CheckCircle: CheckCircle2,
      XCircle: AlertCircle,
      AlertTriangle: AlertCircle,
    }[statusConfig.icon] || AlertCircle;

  return (
    <>
      {/* Handle superior para conexiones entrantes */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 dark:!bg-gray-600 border-2 border-white dark:border-gray-800"
      />

      {/* Card del nodo */}
      <div
        className={cn(
          'w-64 rounded-lg shadow-md transition-all duration-200 cursor-pointer',
          'bg-white dark:bg-gray-800',
          'border-2',
          selected
            ? `border-${perspectiveConfig.color}-500 shadow-lg scale-105`
            : 'border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-105',
          perspectiveConfig.bgColorLight,
          perspectiveConfig.darkBgColor
        )}
        onClick={() => onEdit?.(objetivo.id)}
      >
        {/* Header con perspectiva */}
        <div
          className={cn(
            'px-3 py-2 rounded-t-lg border-b-2',
            perspectiveConfig.bgColor,
            perspectiveConfig.borderColor
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-white" />
              <span className="text-xs font-semibold text-white uppercase tracking-wide">
                {perspectiveConfig.shortLabel}
              </span>
            </div>
            <span className="text-xs font-bold text-white">{objetivo.code}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 space-y-3">
          {/* Nombre del objetivo */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
            {displayName}
          </h3>

          {/* Progress y Estado */}
          <div className="flex items-center justify-between gap-3">
            <ProgressCircle
              progress={objetivo.progress}
              size={48}
              strokeWidth={4}
              color={perspectiveColor}
            />
            <div className="flex-1 space-y-1">
              <Badge
                variant={statusConfig.color as unknown}
                size="sm"
                className="w-full justify-center"
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {objetivo.target_value && objetivo.current_value && (
                <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  {objetivo.current_value}/{objetivo.target_value}
                  {objetivo.unit && ` ${objetivo.unit}`}
                </div>
              )}
            </div>
          </div>

          {/* Normas ISO */}
          {objetivo.normas_iso_detail && objetivo.normas_iso_detail.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {objetivo.normas_iso_detail.map((norma) => (
                <Badge
                  key={norma.id}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  style={{
                    borderColor: norma.color || undefined,
                    color: norma.color || undefined,
                  }}
                >
                  {norma.short_name || norma.code}
                </Badge>
              ))}
            </div>
          )}

          {/* Responsable y fecha (opcional) */}
          {(objetivo.responsible_name || objetivo.due_date) && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
              {objetivo.responsible_name && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Responsable:</span>
                  <span className="truncate">{objetivo.responsible_name}</span>
                </div>
              )}
              {objetivo.due_date && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-semibold">Vence:</span>
                  <span>{new Date(objetivo.due_date).toLocaleDateString('es-CO')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Handle inferior para conexiones salientes */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 dark:!bg-gray-600 border-2 border-white dark:border-gray-800"
      />
    </>
  );
});

ObjetivoNode.displayName = 'ObjetivoNode';
