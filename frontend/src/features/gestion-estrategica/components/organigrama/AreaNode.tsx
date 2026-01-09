/**
 * AreaNode - Nodo de Área para el Organigrama
 *
 * Muestra información del área con sus cargos asociados
 * Usa DynamicIcon para renderizar iconos dinámicos desde el backend
 * Usa colores dinámicos basados en area.color
 */

import { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Users,
  Briefcase,
  ChevronDown,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Badge, DynamicIcon } from '@/components/common';
import type { AreaNodeData } from '../../types/organigrama.types';

// Mapa de clases de color para cada color disponible
const COLOR_CLASSES: Record<string, {
  bg: string;
  bgLight: string;
  bgLightDark: string;
  border: string;
  borderDark: string;
  text: string;
  textDark: string;
  hover: string;
  hoverDark: string;
}> = {
  purple: {
    bg: 'bg-purple-500',
    bgLight: 'from-purple-50 to-purple-100',
    bgLightDark: 'dark:from-purple-900/30 dark:to-purple-900/20',
    border: 'border-purple-200',
    borderDark: 'dark:border-purple-800',
    text: 'text-purple-600',
    textDark: 'dark:text-purple-400',
    hover: 'hover:bg-purple-200',
    hoverDark: 'dark:hover:bg-purple-800',
  },
  blue: {
    bg: 'bg-blue-500',
    bgLight: 'from-blue-50 to-blue-100',
    bgLightDark: 'dark:from-blue-900/30 dark:to-blue-900/20',
    border: 'border-blue-200',
    borderDark: 'dark:border-blue-800',
    text: 'text-blue-600',
    textDark: 'dark:text-blue-400',
    hover: 'hover:bg-blue-200',
    hoverDark: 'dark:hover:bg-blue-800',
  },
  green: {
    bg: 'bg-green-500',
    bgLight: 'from-green-50 to-green-100',
    bgLightDark: 'dark:from-green-900/30 dark:to-green-900/20',
    border: 'border-green-200',
    borderDark: 'dark:border-green-800',
    text: 'text-green-600',
    textDark: 'dark:text-green-400',
    hover: 'hover:bg-green-200',
    hoverDark: 'dark:hover:bg-green-800',
  },
  red: {
    bg: 'bg-red-500',
    bgLight: 'from-red-50 to-red-100',
    bgLightDark: 'dark:from-red-900/30 dark:to-red-900/20',
    border: 'border-red-200',
    borderDark: 'dark:border-red-800',
    text: 'text-red-600',
    textDark: 'dark:text-red-400',
    hover: 'hover:bg-red-200',
    hoverDark: 'dark:hover:bg-red-800',
  },
  amber: {
    bg: 'bg-amber-500',
    bgLight: 'from-amber-50 to-amber-100',
    bgLightDark: 'dark:from-amber-900/30 dark:to-amber-900/20',
    border: 'border-amber-200',
    borderDark: 'dark:border-amber-800',
    text: 'text-amber-600',
    textDark: 'dark:text-amber-400',
    hover: 'hover:bg-amber-200',
    hoverDark: 'dark:hover:bg-amber-800',
  },
  orange: {
    bg: 'bg-orange-500',
    bgLight: 'from-orange-50 to-orange-100',
    bgLightDark: 'dark:from-orange-900/30 dark:to-orange-900/20',
    border: 'border-orange-200',
    borderDark: 'dark:border-orange-800',
    text: 'text-orange-600',
    textDark: 'dark:text-orange-400',
    hover: 'hover:bg-orange-200',
    hoverDark: 'dark:hover:bg-orange-800',
  },
  teal: {
    bg: 'bg-teal-500',
    bgLight: 'from-teal-50 to-teal-100',
    bgLightDark: 'dark:from-teal-900/30 dark:to-teal-900/20',
    border: 'border-teal-200',
    borderDark: 'dark:border-teal-800',
    text: 'text-teal-600',
    textDark: 'dark:text-teal-400',
    hover: 'hover:bg-teal-200',
    hoverDark: 'dark:hover:bg-teal-800',
  },
  cyan: {
    bg: 'bg-cyan-500',
    bgLight: 'from-cyan-50 to-cyan-100',
    bgLightDark: 'dark:from-cyan-900/30 dark:to-cyan-900/20',
    border: 'border-cyan-200',
    borderDark: 'dark:border-cyan-800',
    text: 'text-cyan-600',
    textDark: 'dark:text-cyan-400',
    hover: 'hover:bg-cyan-200',
    hoverDark: 'dark:hover:bg-cyan-800',
  },
  indigo: {
    bg: 'bg-indigo-500',
    bgLight: 'from-indigo-50 to-indigo-100',
    bgLightDark: 'dark:from-indigo-900/30 dark:to-indigo-900/20',
    border: 'border-indigo-200',
    borderDark: 'dark:border-indigo-800',
    text: 'text-indigo-600',
    textDark: 'dark:text-indigo-400',
    hover: 'hover:bg-indigo-200',
    hoverDark: 'dark:hover:bg-indigo-800',
  },
  pink: {
    bg: 'bg-pink-500',
    bgLight: 'from-pink-50 to-pink-100',
    bgLightDark: 'dark:from-pink-900/30 dark:to-pink-900/20',
    border: 'border-pink-200',
    borderDark: 'dark:border-pink-800',
    text: 'text-pink-600',
    textDark: 'dark:text-pink-400',
    hover: 'hover:bg-pink-200',
    hoverDark: 'dark:hover:bg-pink-800',
  },
  gray: {
    bg: 'bg-gray-500',
    bgLight: 'from-gray-50 to-gray-100',
    bgLightDark: 'dark:from-gray-800/50 dark:to-gray-800/30',
    border: 'border-gray-200',
    borderDark: 'dark:border-gray-700',
    text: 'text-gray-600',
    textDark: 'dark:text-gray-400',
    hover: 'hover:bg-gray-200',
    hoverDark: 'dark:hover:bg-gray-700',
  },
};

interface AreaNodeProps {
  data: AreaNodeData;
  selected?: boolean;
}

const AreaNode = memo(({ data, selected }: AreaNodeProps) => {
  const { area, expanded, onExpand, cargos = [] } = data;

  const hasChildren = (area.children_count ?? 0) > 0 || cargos.length > 0;

  // Obtener clases de color dinámicas
  const colors = useMemo(() => {
    return COLOR_CLASSES[area.color || 'purple'] || COLOR_CLASSES.purple;
  }, [area.color]);

  return (
    <div
      className={`
        min-w-[280px] rounded-xl border-2 shadow-lg transition-all duration-200
        bg-white dark:bg-gray-900
        ${selected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      {/* Handle de entrada (arriba) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white dark:!border-gray-900"
      />

      {/* Header del área con color dinámico */}
      <div className={`px-4 py-3 bg-gradient-to-r ${colors.bgLight} ${colors.bgLightDark} rounded-t-xl border-b ${colors.border} ${colors.borderDark}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg} text-white shadow-sm`}>
            <DynamicIcon name={area.icon || 'Building2'} size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {area.name}
            </h3>
            <p className={`text-xs ${colors.text} ${colors.textDark} font-medium`}>
              {area.code}
            </p>
          </div>
          {hasChildren && (
            <button
              onClick={onExpand}
              className={`p-1 rounded ${colors.hover} ${colors.hoverDark} transition-colors`}
            >
              {expanded ? (
                <ChevronDown className={`h-4 w-4 ${colors.text} ${colors.textDark}`} />
              ) : (
                <ChevronRight className={`h-4 w-4 ${colors.text} ${colors.textDark}`} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3 space-y-2">
        {/* Responsable */}
        {area.manager_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="truncate">{area.manager_name}</span>
          </div>
        )}

        {/* Centro de costo */}
        {area.cost_center && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>CC: {area.cost_center}</span>
          </div>
        )}

        {/* Estadísticas */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          {cargos.length > 0 && (
            <Badge variant="info" size="sm">
              <Briefcase className="h-3 w-3 mr-1" />
              {cargos.length} cargos
            </Badge>
          )}
          {(area.usuarios_count ?? 0) > 0 && (
            <Badge variant="success" size="sm">
              <Users className="h-3 w-3 mr-1" />
              {area.usuarios_count} usuarios
            </Badge>
          )}
          {(area.children_count ?? 0) > 0 && (
            <Badge variant="gray" size="sm">
              {area.children_count} subáreas
            </Badge>
          )}
        </div>

        {/* Estado */}
        {!area.is_active && (
          <Badge variant="warning" size="sm" className="w-full justify-center">
            Área Inactiva
          </Badge>
        )}
      </div>

      {/* Handle de salida (abajo) con color dinámico */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!w-3 !h-3 ${colors.bg} !border-2 !border-white dark:!border-gray-900`}
      />
    </div>
  );
});

AreaNode.displayName = 'AreaNode';

export default AreaNode;
