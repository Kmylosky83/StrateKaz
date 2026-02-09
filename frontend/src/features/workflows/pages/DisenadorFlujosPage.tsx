/**
 * DisenadorFlujosPage - Pagina principal del disenador de flujos BPMN
 *
 * Dos modos:
 * 1. Lista de plantillas (cuando no hay plantilla seleccionada)
 * 2. Canvas React Flow (cuando se selecciona una plantilla para editar)
 */
import { useState, useCallback } from 'react';
import {
  GitBranch,
  Plus,
  ArrowLeft,
  Play,
  Copy,
  Trash2,
  Edit3,
  Clock,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, EmptyState, Spinner, StatusBadge } from '@/components/common';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout';
import { NODE_CONFIG } from '../components/nodes/BpmnNodes';
import { WorkflowDesignerCanvas } from '../components/WorkflowDesignerCanvas';
import {
  usePlantillas,
  usePlantilla,
  useCreatePlantilla,
  useActivarPlantilla,
  useDeletePlantilla,
  useCrearVersionPlantilla,
} from '../hooks/useWorkflows';
import type { TipoNodo, PlantillaFlujo, EstadoPlantilla } from '../types/workflow.types';

// ============================================================
// COMPONENTES DE NODO ARRASTRABLES (sidebar)
// ============================================================

const DRAGGABLE_NODES: { tipo: TipoNodo; label: string }[] = [
  { tipo: 'INICIO', label: 'Inicio' },
  { tipo: 'TAREA', label: 'Tarea' },
  { tipo: 'GATEWAY_EXCLUSIVO', label: 'Decision' },
  { tipo: 'GATEWAY_PARALELO', label: 'Paralelo' },
  { tipo: 'EVENTO', label: 'Evento' },
  { tipo: 'FIN', label: 'Fin' },
];

interface DraggableNodeProps {
  tipo: TipoNodo;
  label: string;
}

const DraggableNode = ({ tipo, label }: DraggableNodeProps) => {
  const config = NODE_CONFIG[tipo];
  const Icon = config.icon;

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/bpmn-node', tipo);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`
        p-3 rounded-lg border-2 border-dashed cursor-grab active:cursor-grabbing
        hover:shadow-sm transition-all
        ${config.bgColor} ${config.borderColor}
      `}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.textColor}`} />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
      </div>
    </div>
  );
};

// ============================================================
// TARJETA DE PLANTILLA
// ============================================================

const _estadoColors: Record<EstadoPlantilla, string> = {
  BORRADOR: 'gray',
  ACTIVO: 'green',
  OBSOLETO: 'yellow',
  ARCHIVADO: 'red',
};

interface PlantillaCardProps {
  plantilla: PlantillaFlujo;
  onSelect: (id: number) => void;
  onActivar: (id: number) => void;
  onNewVersion: (id: number) => void;
  onDelete: (id: number) => void;
}

const PlantillaCard = ({
  plantilla,
  onSelect,
  onActivar,
  onNewVersion,
  onDelete,
}: PlantillaCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {plantilla.nombre}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{plantilla.codigo}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="gray" size="sm">
            v{plantilla.version}
          </Badge>
          <StatusBadge status={plantilla.estado} />
        </div>
      </div>

      {plantilla.descripcion && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {plantilla.descripcion}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {plantilla.total_nodos ?? 0} nodos
        </span>
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          {plantilla.total_transiciones ?? 0} transiciones
        </span>
        {plantilla.tiempo_estimado_horas && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {plantilla.tiempo_estimado_horas}h
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => onSelect(plantilla.id)}>
          <Edit3 className="h-3.5 w-3.5 mr-1" />
          Editar
        </Button>
        {plantilla.estado === 'BORRADOR' && (
          <Button size="sm" variant="outline" onClick={() => onActivar(plantilla.id)}>
            <Play className="h-3.5 w-3.5 mr-1" />
            Activar
          </Button>
        )}
        {plantilla.estado === 'ACTIVO' && (
          <Button size="sm" variant="outline" onClick={() => onNewVersion(plantilla.id)}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            Nueva Version
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onDelete(plantilla.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </Card>
);

// ============================================================
// PAGINA PRINCIPAL
// ============================================================

export default function DisenadorFlujosPage() {
  const navigate = useNavigate();
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<number | null>(null);
  const [filterEstado, setFilterEstado] = useState<EstadoPlantilla | ''>('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');

  // Queries
  const { data: plantillasData, isLoading } = usePlantillas(
    filterEstado ? { estado: filterEstado } : undefined
  );
  const { data: selectedPlantilla } = usePlantilla(selectedPlantillaId);

  // Mutations
  const createMutation = useCreatePlantilla();
  const activarMutation = useActivarPlantilla();
  const deleteMutation = useDeletePlantilla();
  const newVersionMutation = useCrearVersionPlantilla();

  const plantillas = plantillasData?.results ?? [];

  const handleCreate = useCallback(() => {
    if (!newName.trim() || !newCode.trim()) return;
    createMutation.mutate(
      { nombre: newName.trim(), codigo: newCode.trim().toUpperCase() },
      {
        onSuccess: (p) => {
          setSelectedPlantillaId(p.id);
          setShowNewForm(false);
          setNewName('');
          setNewCode('');
        },
      }
    );
  }, [newName, newCode, createMutation]);

  // ---- MODO CANVAS (editando plantilla) ----
  if (selectedPlantilla) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={selectedPlantilla.nombre}
          description={`${selectedPlantilla.codigo} - v${selectedPlantilla.version} (${selectedPlantilla.estado})`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedPlantillaId(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Lista
              </Button>
              {selectedPlantilla.estado === 'BORRADOR' && (
                <Button
                  variant="primary"
                  onClick={() => activarMutation.mutate(selectedPlantilla.id)}
                  disabled={activarMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Activar Flujo
                </Button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Sidebar - Componentes arrastrables */}
          <Card className="lg:col-span-1">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Componentes BPMN
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Arrastra al canvas</p>
            </div>
            <div className="p-3 space-y-2">
              {DRAGGABLE_NODES.map(({ tipo, label }) => (
                <DraggableNode key={tipo} tipo={tipo} label={label} />
              ))}
            </div>
          </Card>

          {/* Canvas */}
          <div className="lg:col-span-4 h-[650px]">
            <WorkflowDesignerCanvas
              plantilla={selectedPlantilla}
              onEditNode={() => {
                // TODO: Abrir modal de edicion del nodo
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ---- MODO LISTA ----
  return (
    <div className="space-y-6">
      <PageHeader
        title="Disenador de Flujos"
        description="Crea y configura flujos de trabajo BPMN con el editor visual"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button variant="primary" onClick={() => setShowNewForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>
        }
      />

      {/* Formulario rapido de creacion */}
      {showNewForm && (
        <Card className="border-purple-200 dark:border-purple-800">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Nueva Plantilla de Flujo
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Codigo
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="ej: APROBACION_COMPRAS"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ej: Flujo de Aprobacion de Compras"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreate}
                disabled={createMutation.isPending || !newName.trim() || !newCode.trim()}
              >
                Crear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewForm(false);
                  setNewName('');
                  setNewCode('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        {(['', 'BORRADOR', 'ACTIVO', 'OBSOLETO', 'ARCHIVADO'] as const).map((estado) => (
          <button
            key={estado}
            onClick={() => setFilterEstado(estado)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterEstado === estado
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {estado || 'Todos'}
          </button>
        ))}
      </div>

      {/* Lista de plantillas */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : plantillas.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-12 w-12" />}
          title="Sin plantillas de flujo"
          description="Crea tu primera plantilla para comenzar a disenar flujos de trabajo."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantillas.map((p) => (
            <PlantillaCard
              key={p.id}
              plantilla={p}
              onSelect={setSelectedPlantillaId}
              onActivar={(id) => activarMutation.mutate(id)}
              onNewVersion={(id) => newVersionMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
