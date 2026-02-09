/**
 * Nodos BPMN personalizados para React Flow
 *
 * 6 tipos de nodo que mapean a TipoNodo del backend:
 * INICIO, FIN, TAREA, GATEWAY_EXCLUSIVO, GATEWAY_PARALELO, EVENTO
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Play,
  Square,
  ClipboardCheck,
  GitBranch,
  GitMerge,
  Zap,
  Clock,
  Users,
  FileText,
  Settings,
  Trash2,
} from 'lucide-react';
import type { WorkflowNodeData, TipoNodo } from '../../types/workflow.types';

// ============================================================
// CONFIGURACION VISUAL POR TIPO
// ============================================================

interface NodeVisualConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  shape: 'circle' | 'rounded' | 'diamond';
}

const NODE_CONFIG: Record<TipoNodo, NodeVisualConfig> = {
  INICIO: {
    icon: Play,
    label: 'Inicio',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    borderColor: 'border-green-400 dark:border-green-600',
    textColor: 'text-green-700 dark:text-green-300',
    shape: 'circle',
  },
  FIN: {
    icon: Square,
    label: 'Fin',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    borderColor: 'border-red-400 dark:border-red-600',
    textColor: 'text-red-700 dark:text-red-300',
    shape: 'circle',
  },
  TAREA: {
    icon: ClipboardCheck,
    label: 'Tarea',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-400 dark:border-blue-600',
    textColor: 'text-blue-700 dark:text-blue-300',
    shape: 'rounded',
  },
  GATEWAY_EXCLUSIVO: {
    icon: GitBranch,
    label: 'Decision',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-400 dark:border-amber-600',
    textColor: 'text-amber-700 dark:text-amber-300',
    shape: 'diamond',
  },
  GATEWAY_PARALELO: {
    icon: GitMerge,
    label: 'Paralelo',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    borderColor: 'border-purple-400 dark:border-purple-600',
    textColor: 'text-purple-700 dark:text-purple-300',
    shape: 'diamond',
  },
  EVENTO: {
    icon: Zap,
    label: 'Evento',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    borderColor: 'border-orange-400 dark:border-orange-600',
    textColor: 'text-orange-700 dark:text-orange-300',
    shape: 'circle',
  },
};

// ============================================================
// HANDLE STYLES
// ============================================================

const handleStyle = {
  width: 10,
  height: 10,
  background: '#6b7280',
  border: '2px solid white',
};

const handleActiveStyle = {
  ...handleStyle,
  background: '#9333ea',
};

// ============================================================
// NODO INICIO
// ============================================================

const InicioNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = NODE_CONFIG.INICIO;
  const Icon = config.icon;

  return (
    <div className={`
      flex flex-col items-center gap-1
      ${selected ? 'ring-2 ring-purple-500 ring-offset-2 rounded-full' : ''}
    `}>
      <div className={`
        w-16 h-16 rounded-full flex items-center justify-center
        border-2 ${config.bgColor} ${config.borderColor}
        shadow-sm hover:shadow-md transition-shadow cursor-pointer
      `}>
        <Icon className={`h-7 w-7 ${config.textColor}`} />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[100px] text-center truncate">
        {nodeData.nodo?.nombre || 'Inicio'}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleActiveStyle}
      />
    </div>
  );
});
InicioNode.displayName = 'InicioNode';

// ============================================================
// NODO FIN
// ============================================================

const FinNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = NODE_CONFIG.FIN;
  const Icon = config.icon;

  return (
    <div className={`
      flex flex-col items-center gap-1
      ${selected ? 'ring-2 ring-purple-500 ring-offset-2 rounded-full' : ''}
    `}>
      <Handle
        type="target"
        position={Position.Top}
        style={handleActiveStyle}
      />
      <div className={`
        w-16 h-16 rounded-full flex items-center justify-center
        border-[3px] ${config.bgColor} ${config.borderColor}
        shadow-sm hover:shadow-md transition-shadow cursor-pointer
      `}>
        <Icon className={`h-7 w-7 ${config.textColor}`} />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[100px] text-center truncate">
        {nodeData.nodo?.nombre || 'Fin'}
      </span>
    </div>
  );
});
FinNode.displayName = 'FinNode';

// ============================================================
// NODO TAREA (el mas complejo - muestra info del rol y formulario)
// ============================================================

const TareaNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = NODE_CONFIG.TAREA;
  const Icon = config.icon;
  const nodo = nodeData.nodo;

  return (
    <div className={`
      min-w-[200px] max-w-[260px]
      ${selected ? 'ring-2 ring-purple-500 ring-offset-2 rounded-lg' : ''}
    `}>
      <Handle
        type="target"
        position={Position.Top}
        style={handleActiveStyle}
      />
      <div className={`
        rounded-lg border-2 ${config.borderColor} ${config.bgColor}
        shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden
      `}>
        {/* Cabecera */}
        <div className={`px-3 py-2 border-b ${config.borderColor} flex items-center gap-2`}>
          <Icon className={`h-4 w-4 ${config.textColor} flex-shrink-0`} />
          <span className={`text-sm font-semibold ${config.textColor} truncate`}>
            {nodo?.nombre || 'Tarea'}
          </span>
        </div>

        {/* Cuerpo */}
        <div className="px-3 py-2 space-y-1.5">
          {nodo?.descripcion && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {nodo.descripcion}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {/* Rol asignado */}
            {nodeData.rolDetail && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <Users className="h-3 w-3" />
                {nodeData.rolDetail.nombre}
              </span>
            )}

            {/* Campos de formulario */}
            {(nodeData.camposCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <FileText className="h-3 w-3" />
                {nodeData.camposCount} campos
              </span>
            )}

            {/* Tiempo estimado */}
            {nodo?.tiempo_estimado_horas && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <Clock className="h-3 w-3" />
                {nodo.tiempo_estimado_horas}h
              </span>
            )}
          </div>
        </div>

        {/* Acciones (visible al hover) */}
        {(nodeData.onEdit || nodeData.onDelete) && (
          <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
            {nodeData.onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); nodeData.onEdit!(nodo.id); }}
                className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="Editar nodo"
              >
                <Settings className="h-3.5 w-3.5 text-gray-500" />
              </button>
            )}
            {nodeData.onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); nodeData.onDelete!(nodo.id); }}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                title="Eliminar nodo"
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-500" />
              </button>
            )}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleActiveStyle}
      />
    </div>
  );
});
TareaNode.displayName = 'TareaNode';

// ============================================================
// NODO GATEWAY (Exclusivo y Paralelo - forma de diamante)
// ============================================================

interface GatewayNodeProps extends NodeProps {
  gatewayType: 'GATEWAY_EXCLUSIVO' | 'GATEWAY_PARALELO';
}

const GatewayNodeBase = memo(({ data, selected, gatewayType }: GatewayNodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = NODE_CONFIG[gatewayType];
  const Icon = config.icon;

  return (
    <div className={`
      flex flex-col items-center gap-1
      ${selected ? 'ring-2 ring-purple-500 ring-offset-2 rounded-lg' : ''}
    `}>
      <Handle
        type="target"
        position={Position.Top}
        style={handleActiveStyle}
      />
      <div className={`
        w-14 h-14 flex items-center justify-center
        border-2 ${config.borderColor} ${config.bgColor}
        shadow-sm hover:shadow-md transition-shadow cursor-pointer
        rotate-45 rounded-sm
      `}>
        <div className="-rotate-45">
          <Icon className={`h-5 w-5 ${config.textColor}`} />
        </div>
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[120px] text-center truncate mt-1">
        {nodeData.nodo?.nombre || config.label}
      </span>
      {/* Handles laterales para ramificacion */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={handleActiveStyle}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleActiveStyle, top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ ...handleActiveStyle, top: '50%' }}
      />
    </div>
  );
});
GatewayNodeBase.displayName = 'GatewayNodeBase';

const GatewayExclusivoNode = memo((props: NodeProps) => (
  <GatewayNodeBase {...props} gatewayType="GATEWAY_EXCLUSIVO" />
));
GatewayExclusivoNode.displayName = 'GatewayExclusivoNode';

const GatewayParaleloNode = memo((props: NodeProps) => (
  <GatewayNodeBase {...props} gatewayType="GATEWAY_PARALELO" />
));
GatewayParaleloNode.displayName = 'GatewayParaleloNode';

// ============================================================
// NODO EVENTO
// ============================================================

const EventoNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = NODE_CONFIG.EVENTO;
  const Icon = config.icon;
  const nodo = nodeData.nodo;
  const tipoEvento = nodo?.configuracion?.tipo_evento as string | undefined;

  return (
    <div className={`
      flex flex-col items-center gap-1
      ${selected ? 'ring-2 ring-purple-500 ring-offset-2 rounded-full' : ''}
    `}>
      <Handle
        type="target"
        position={Position.Top}
        style={handleActiveStyle}
      />
      <div className={`
        w-14 h-14 rounded-full flex items-center justify-center
        border-2 border-dashed ${config.borderColor} ${config.bgColor}
        shadow-sm hover:shadow-md transition-shadow cursor-pointer
      `}>
        {tipoEvento === 'temporizador' ? (
          <Clock className={`h-5 w-5 ${config.textColor}`} />
        ) : (
          <Icon className={`h-5 w-5 ${config.textColor}`} />
        )}
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[100px] text-center truncate">
        {nodo?.nombre || 'Evento'}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleActiveStyle}
      />
    </div>
  );
});
EventoNode.displayName = 'EventoNode';

// ============================================================
// REGISTRO DE TIPOS DE NODOS
// ============================================================

export const bpmnNodeTypes = {
  INICIO: InicioNode,
  FIN: FinNode,
  TAREA: TareaNode,
  GATEWAY_EXCLUSIVO: GatewayExclusivoNode,
  GATEWAY_PARALELO: GatewayParaleloNode,
  EVENTO: EventoNode,
};

export { NODE_CONFIG };
export type { NodeVisualConfig };
