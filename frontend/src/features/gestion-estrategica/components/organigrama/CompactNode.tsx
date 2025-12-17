/**
 * CompactNode - Nodo compacto para el Organigrama
 *
 * Muestra información resumida de área o cargo
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Building2, UserCog } from 'lucide-react';
import type { CompactNodeData } from '../../types/organigrama.types';

interface CompactNodeProps {
  data: CompactNodeData;
  selected?: boolean;
}

const CompactNode = memo(({ data, selected }: CompactNodeProps) => {
  const { item, itemType, count } = data;

  const isArea = itemType === 'area';
  const Icon = isArea ? Building2 : UserCog;

  return (
    <div
      className={`
        min-w-[180px] rounded-lg border shadow-md transition-all duration-200
        bg-white dark:bg-gray-900
        ${selected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : isArea
            ? 'border-purple-200 dark:border-purple-800 hover:border-purple-300'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
        }
      `}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Top}
        className={`!w-2 !h-2 ${isArea ? '!bg-purple-500' : '!bg-gray-500'} !border-2 !border-white dark:!border-gray-900`}
      />

      {/* Contenido */}
      <div className="px-3 py-2 flex items-center gap-2">
        <div className={`p-1.5 rounded ${isArea ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <Icon className={`h-4 w-4 ${isArea ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {item.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {item.code}
            {count !== undefined && count > 0 && (
              <span className="ml-1 text-gray-400">• {count}</span>
            )}
          </p>
        </div>
      </div>

      {/* Handle de salida */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!w-2 !h-2 ${isArea ? '!bg-purple-500' : '!bg-gray-500'} !border-2 !border-white dark:!border-gray-900`}
      />
    </div>
  );
});

CompactNode.displayName = 'CompactNode';

export default CompactNode;
