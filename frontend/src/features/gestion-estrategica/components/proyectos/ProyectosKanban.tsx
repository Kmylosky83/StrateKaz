/**
 * Board Kanban para visualizar proyectos por estado
 * Permite arrastrar y soltar proyectos entre estados
 */
import { useState } from 'react';
import { Card, Badge } from '@/components/common';
import { useProyectosPorEstado, useCambiarEstadoProyecto } from '../../hooks/useProyectos';
import type { Proyecto, EstadoProyecto } from '../../types/proyectos';
import {
  GripVertical,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// Configuración de columnas del Kanban
const KANBAN_COLUMNS = [
  {
    id: 'PROPUESTO',
    label: 'Propuesto',
    color: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300',
  },
  {
    id: 'INICIACION',
    label: 'Iniciación',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-300',
  },
  {
    id: 'PLANIFICACION',
    label: 'Planificación',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-300',
  },
  {
    id: 'EJECUCION',
    label: 'Ejecución',
    color: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-300',
  },
  {
    id: 'MONITOREO',
    label: 'Monitoreo',
    color: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300',
  },
  {
    id: 'CIERRE',
    label: 'Cierre',
    color: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-300',
  },
  {
    id: 'COMPLETADO',
    label: 'Completado',
    color: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300',
  },
];

// Badge de salud del proyecto
const HealthBadge = ({ status }: { status: string }) => {
  const config = {
    VERDE: { color: 'success', label: 'Saludable' },
    AMARILLO: { color: 'warning', label: 'En Riesgo' },
    ROJO: { color: 'danger', label: 'Crítico' },
  };

  const { color, label } = config[status as keyof typeof config] || {
    color: 'gray',
    label: status,
  };

  return (
    <Badge variant={color as 'success' | 'warning' | 'danger'} size="sm">
      {label}
    </Badge>
  );
};

// Badge de prioridad
const PriorityBadge = ({ priority }: { priority: string }) => {
  const config = {
    CRITICA: { color: 'danger', label: 'Crítica' },
    ALTA: { color: 'warning', label: 'Alta' },
    MEDIA: { color: 'info', label: 'Media' },
    BAJA: { color: 'gray', label: 'Baja' },
  };

  const { color, label } = config[priority as keyof typeof config] || {
    color: 'gray',
    label: priority,
  };

  return (
    <Badge variant={color as 'danger' | 'warning' | 'info' | 'gray'} size="sm">
      {label}
    </Badge>
  );
};

// Tarjeta de proyecto
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
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 cursor-move hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {proyecto.code}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
            {proyecto.name}
          </h4>
        </div>
        <HealthBadge status={proyecto.health_status} />
      </div>

      {/* Prioridad y Tipo */}
      <div className="flex gap-2 mb-3">
        <PriorityBadge priority={proyecto.prioridad} />
        <Badge variant="gray" size="sm">
          {proyecto.tipo_display}
        </Badge>
      </div>

      {/* Detalles */}
      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
        {proyecto.project_manager_name && (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{proyecto.project_manager_name}</span>
          </div>
        )}

        {proyecto.fecha_fin_prevista && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(proyecto.fecha_fin_prevista).toLocaleDateString('es-CO')}</span>
          </div>
        )}

        {proyecto.presupuesto_estimado && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" />
            <span>${proyecto.presupuesto_estimado}</span>
          </div>
        )}

        {proyecto.progreso_general !== undefined && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-purple-600 h-1.5 rounded-full"
                  style={{ width: `${proyecto.progreso_general}%` }}
                />
              </div>
            </div>
            <span className="font-medium">{proyecto.progreso_general}%</span>
          </div>
        )}
      </div>

      {/* Footer - Estadísticas */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        {proyecto.hitos_count !== undefined && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{proyecto.hitos_count} hitos</span>
          </div>
        )}
        {proyecto.equipo_count !== undefined && (
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>{proyecto.equipo_count} miembros</span>
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
}

const KanbanColumn = ({
  column,
  proyectos,
  onDragOver,
  onDrop,
  onProjectClick,
  onDragStart,
}: KanbanColumnProps) => {
  return (
    <div className="flex-shrink-0 w-80">
      <div
        className={`${column.color} border-t-4 ${column.borderColor} rounded-lg p-4 h-full`}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, column.id as EstadoProyecto)}
      >
        {/* Header de la columna */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{column.label}</h3>
          <Badge variant="gray" size="sm">
            {proyectos.length}
          </Badge>
        </div>

        {/* Proyectos */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
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
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              No hay proyectos
            </div>
          )}
        </div>
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

  const handleDragStart = (e: React.DragEvent, proyecto: Proyecto) => {
    setDraggedProject(proyecto);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, estadoDestino: EstadoProyecto) => {
    e.preventDefault();

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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card>
              <div className="p-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Indicadores de arrastre */}
      {draggedProject && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
            <AlertCircle className="h-4 w-4" />
            <span>
              Arrastrando: <strong>{draggedProject.name}</strong> - Suelta en la columna deseada
            </span>
          </div>
        </div>
      )}

      {/* Board Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            proyectos={proyectosPorEstado?.[column.id] || []}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onProjectClick={onProjectClick}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
};
