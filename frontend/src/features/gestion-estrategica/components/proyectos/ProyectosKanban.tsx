/**
 * Board Kanban para visualizar proyectos por estado
 * Permite arrastrar y soltar proyectos entre estados
 * Layout responsive: grid que se adapta al viewport
 */
import { useState } from 'react';
import { Badge } from '@/components/common';
import { useProyectosPorEstado, useCambiarEstadoProyecto } from '../../hooks/useProyectos';
import type { Proyecto, EstadoProyecto } from '../../types/proyectos';
import {
  GripVertical,
  Calendar,
  User,
  TrendingUp,
  AlertCircle,
  FileText,
  Rocket,
  Ruler,
  Zap,
  BarChart3,
  Package,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

// Configuración de columnas del Kanban
const KANBAN_COLUMNS: {
  id: string;
  label: string;
  color: string;
  borderColor: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'propuesto',
    label: 'Propuesto',
    color: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300',
    icon: FileText,
  },
  {
    id: 'iniciacion',
    label: 'Iniciación',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-300',
    icon: Rocket,
  },
  {
    id: 'planificacion',
    label: 'Planificación',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-300',
    icon: Ruler,
  },
  {
    id: 'ejecucion',
    label: 'Ejecución',
    color: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-300',
    icon: Zap,
  },
  {
    id: 'monitoreo',
    label: 'Monitoreo',
    color: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300',
    icon: BarChart3,
  },
  {
    id: 'cierre',
    label: 'Cierre',
    color: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-300',
    icon: Package,
  },
  {
    id: 'completado',
    label: 'Completado',
    color: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300',
    icon: CheckCircle2,
  },
];

// Badge de prioridad
const PriorityBadge = ({ priority }: { priority: string }) => {
  const config: Record<string, { color: string; label: string }> = {
    critica: { color: 'danger', label: 'Crítica' },
    alta: { color: 'warning', label: 'Alta' },
    media: { color: 'info', label: 'Media' },
    baja: { color: 'gray', label: 'Baja' },
  };

  const { color, label } = config[priority] || { color: 'gray', label: priority };

  return (
    <Badge variant={color as 'danger' | 'warning' | 'info' | 'gray'} size="sm">
      {label}
    </Badge>
  );
};

// Tarjeta de proyecto (compacta para caber en grid)
interface ProjectCardProps {
  proyecto: Proyecto;
  onDragStart: (e: React.DragEvent, proyecto: Proyecto) => void;
  onClick?: () => void;
}

const ProjectCard = ({ proyecto, onDragStart, onClick }: ProjectCardProps) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, proyecto)}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <GripVertical className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
              {proyecto.codigo}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
            {proyecto.nombre}
          </h4>
        </div>
        <PriorityBadge priority={proyecto.prioridad} />
      </div>

      {/* Info compacta */}
      <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
        {proyecto.gerente_nombre && (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{proyecto.gerente_nombre}</span>
          </div>
        )}

        {proyecto.fecha_fin_plan && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{new Date(proyecto.fecha_fin_plan).toLocaleDateString('es-CO')}</span>
          </div>
        )}

        {proyecto.porcentaje_avance !== undefined && proyecto.porcentaje_avance > 0 && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 flex-shrink-0" />
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className="bg-purple-600 h-1 rounded-full"
                  style={{ width: `${proyecto.porcentaje_avance}%` }}
                />
              </div>
            </div>
            <span className="font-medium">{proyecto.porcentaje_avance}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Columna del Kanban
interface KanbanColumnProps {
  column: (typeof KANBAN_COLUMNS)[0];
  proyectos: Proyecto[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, estadoDestino: EstadoProyecto) => void;
  onProjectClick?: (proyecto: Proyecto) => void;
  onDragStart: (e: React.DragEvent, proyecto: Proyecto) => void;
  isDragTarget: boolean;
}

const KanbanColumn = ({
  column,
  proyectos,
  onDragOver,
  onDrop,
  onProjectClick,
  onDragStart,
  isDragTarget,
}: KanbanColumnProps) => {
  return (
    <div
      className={`${column.color} border-t-4 ${column.borderColor} rounded-lg p-3 min-h-[200px] transition-all ${
        isDragTarget ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900' : ''
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id as EstadoProyecto)}
    >
      {/* Header de la columna */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <column.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{column.label}</h3>
        </div>
        <Badge variant="gray" size="sm">
          {proyectos.length}
        </Badge>
      </div>

      {/* Proyectos */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {proyectos.length > 0 ? (
          proyectos.map((proyecto) => (
            <ProjectCard
              key={proyecto.id}
              proyecto={proyecto}
              onDragStart={onDragStart}
              onClick={() => onProjectClick?.(proyecto)}
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">
            Sin proyectos
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal
interface ProyectosKanbanProps {
  onProjectClick?: (proyecto: Proyecto) => void;
}

export const ProyectosKanban = ({ onProjectClick }: ProyectosKanbanProps) => {
  const { data: proyectosPorEstado, isLoading } = useProyectosPorEstado();
  const cambiarEstadoMutation = useCambiarEstadoProyecto();
  const [draggedProject, setDraggedProject] = useState<Proyecto | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, proyecto: Proyecto) => {
    setDraggedProject(proyecto);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, estadoDestino: EstadoProyecto) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedProject && draggedProject.estado !== estadoDestino) {
      cambiarEstadoMutation.mutate({
        id: draggedProject.id,
        estado: estadoDestino,
      });
    }

    setDraggedProject(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {KANBAN_COLUMNS.map((column) => (
          <div
            key={column.id}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 animate-pulse-subtle min-h-[200px]"
          >
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Indicador de arrastre */}
      {draggedProject && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              Arrastrando: <strong>{draggedProject.nombre}</strong> — Suelta en la columna destino
            </span>
          </div>
        </div>
      )}

      {/* Board Kanban - Grid responsive */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3"
        onDragLeave={handleDragLeave}
      >
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            proyectos={proyectosPorEstado?.[column.id] || []}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={handleDrop}
            onProjectClick={onProjectClick}
            onDragStart={handleDragStart}
            isDragTarget={dragOverColumn === column.id && draggedProject?.estado !== column.id}
          />
        ))}
      </div>
    </div>
  );
};
