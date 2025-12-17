/**
 * AreaNode - Nodo de Área para el Organigrama
 *
 * Muestra información del área con sus cargos asociados
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Building2,
  Users,
  Briefcase,
  ChevronDown,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Badge } from '@/components/common';
import type { AreaNodeData } from '../../types/organigrama.types';

interface AreaNodeProps {
  data: AreaNodeData;
  selected?: boolean;
}

const AreaNode = memo(({ data, selected }: AreaNodeProps) => {
  const { area, expanded, onExpand, cargos = [] } = data;

  const hasChildren = (area.children_count ?? 0) > 0 || cargos.length > 0;

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

      {/* Header del área */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/20 rounded-t-xl border-b border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {area.name}
            </h3>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              {area.code}
            </p>
          </div>
          {hasChildren && (
            <button
              onClick={onExpand}
              className="p-1 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
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

      {/* Handle de salida (abajo) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-gray-900"
      />
    </div>
  );
});

AreaNode.displayName = 'AreaNode';

export default AreaNode;
