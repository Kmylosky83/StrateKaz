/**
 * DisenadorFlujosPage - Diseñador de flujos BPMN
 *
 * Dos modos:
 * 1. Lista de plantillas con KPIs, filtros, CRUD (modals)
 * 2. Canvas React Flow (cuando se selecciona una plantilla para editar)
 */
import { useState } from 'react';
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
  Tags,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Badge,
  EmptyState,
  Spinner,
  StatusBadge,
  KpiCard,
  KpiCardGrid,
  KpiCardSkeleton,
  ConfirmDialog,
} from '@/components/common';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout';
import { NODE_CONFIG } from '../components/nodes/BpmnNodes';
import { WorkflowDesignerCanvas } from '../components/WorkflowDesignerCanvas';
import PlantillaFormModal from '../components/PlantillaFormModal';
import CategoriaFormModal from '../components/CategoriaFormModal';
import {
  usePlantillas,
  usePlantilla,
  useActivarPlantilla,
  useDeletePlantilla,
  useCrearVersionPlantilla,
  useCategorias,
} from '../hooks/useWorkflows';
import type {
  TipoNodo,
  PlantillaFlujo,
  EstadoPlantilla,
  CategoriaFlujo,
} from '../types/workflow.types';

// ============================================================
// COMPONENTES DE NODO ARRASTRABLES (sidebar del canvas)
// ============================================================

const DRAGGABLE_NODES: { tipo: TipoNodo; label: string }[] = [
  { tipo: 'INICIO', label: 'Inicio' },
  { tipo: 'TAREA', label: 'Tarea' },
  { tipo: 'GATEWAY_EXCLUSIVO', label: 'Decisión' },
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

interface PlantillaCardProps {
  plantilla: PlantillaFlujo;
  onSelect: (id: number) => void;
  onEdit: (plantilla: PlantillaFlujo) => void;
  onActivar: (id: number) => void;
  onNewVersion: (id: number) => void;
  onDelete: (plantilla: PlantillaFlujo) => void;
}

const PlantillaCard = ({
  plantilla,
  onSelect,
  onEdit,
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

      {plantilla.categoria_detail && (
        <div className="flex items-center gap-1.5 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: plantilla.categoria_detail.color || '#8B5CF6' }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {plantilla.categoria_detail.nombre}
          </span>
        </div>
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

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="primary" onClick={() => onSelect(plantilla.id)}>
          <Edit3 className="h-3.5 w-3.5 mr-1" />
          Diseñar
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(plantilla)}>
          <Settings className="h-3.5 w-3.5 mr-1" />
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
            Nueva Versión
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onDelete(plantilla)}>
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
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

  // Modals
  const [showPlantillaModal, setShowPlantillaModal] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaFlujo | null>(null);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaFlujo | null>(null);
  const [deletingPlantilla, setDeletingPlantilla] = useState<PlantillaFlujo | null>(null);

  // Queries
  const { data: plantillasData, isLoading } = usePlantillas(
    filterEstado ? { estado: filterEstado } : undefined
  );
  const { data: allPlantillasData } = usePlantillas();
  const { data: selectedPlantilla } = usePlantilla(selectedPlantillaId);
  const { data: categoriasData } = useCategorias();

  // Mutations
  const activarMutation = useActivarPlantilla();
  const deleteMutation = useDeletePlantilla();
  const newVersionMutation = useCrearVersionPlantilla();

  const plantillas = plantillasData?.results ?? [];
  const allPlantillas = allPlantillasData?.results ?? [];

  // KPI calculations
  const totalPlantillas = allPlantillas.length;
  const activas = allPlantillas.filter((p) => p.estado === 'ACTIVO').length;
  const borradores = allPlantillas.filter((p) => p.estado === 'BORRADOR').length;
  const categorias = Array.isArray(categoriasData)
    ? categoriasData
    : (categoriasData?.results ?? []);

  const handleOpenNew = () => {
    setEditingPlantilla(null);
    setShowPlantillaModal(true);
  };

  const handleEdit = (plantilla: PlantillaFlujo) => {
    setEditingPlantilla(plantilla);
    setShowPlantillaModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingPlantilla) return;
    deleteMutation.mutate(deletingPlantilla.id, {
      onSuccess: () => setDeletingPlantilla(null),
    });
  };

  const handleOpenCategoria = () => {
    setEditingCategoria(null);
    setShowCategoriaModal(true);
  };

  const estadoFilters = [
    { value: '' as const, label: 'Todos' },
    { value: 'BORRADOR' as const, label: 'Borrador' },
    { value: 'ACTIVO' as const, label: 'Activo' },
    { value: 'OBSOLETO' as const, label: 'Obsoleto' },
    { value: 'ARCHIVADO' as const, label: 'Archivado' },
  ];

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
                // TODO: Modal de edición de nodo
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
        title="Diseñador de Flujos"
        description="Crea y configura flujos de trabajo BPMN con el editor visual"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button variant="outline" onClick={handleOpenCategoria}>
              <Tags className="h-4 w-4 mr-2" />
              Categorías
            </Button>
            <Button variant="primary" onClick={handleOpenNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      {isLoading ? (
        <KpiCardGrid columns={4}>
          {[1, 2, 3, 4].map((i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </KpiCardGrid>
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            title="Total Plantillas"
            value={totalPlantillas}
            icon="FileText"
            color="purple"
          />
          <KpiCard title="Activas" value={activas} icon="Play" color="green" />
          <KpiCard title="En Borrador" value={borradores} icon="Edit3" color="orange" />
          <KpiCard title="Categorías" value={categorias.length} icon="Tags" color="blue" />
        </KpiCardGrid>
      )}

      {/* Filtros por estado */}
      <div className="flex gap-2 flex-wrap">
        {estadoFilters.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filterEstado === f.value ? 'primary' : 'ghost'}
            onClick={() => setFilterEstado(f.value)}
          >
            {f.label}
          </Button>
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
          description="Crea tu primera plantilla para comenzar a diseñar flujos de trabajo."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantillas.map((p) => (
            <PlantillaCard
              key={p.id}
              plantilla={p}
              onSelect={setSelectedPlantillaId}
              onEdit={handleEdit}
              onActivar={(id) => activarMutation.mutate(id)}
              onNewVersion={(id) => newVersionMutation.mutate(id)}
              onDelete={setDeletingPlantilla}
            />
          ))}
        </div>
      )}

      {/* Modal: Crear/Editar Plantilla */}
      <PlantillaFormModal
        item={editingPlantilla}
        isOpen={showPlantillaModal}
        onClose={() => {
          setShowPlantillaModal(false);
          setEditingPlantilla(null);
        }}
      />

      {/* Modal: Crear/Editar Categoría */}
      <CategoriaFormModal
        item={editingCategoria}
        isOpen={showCategoriaModal}
        onClose={() => {
          setShowCategoriaModal(false);
          setEditingCategoria(null);
        }}
      />

      {/* Confirm: Eliminar Plantilla */}
      <ConfirmDialog
        isOpen={!!deletingPlantilla}
        onClose={() => setDeletingPlantilla(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Plantilla"
        message={
          <>
            ¿Estás seguro de eliminar la plantilla <strong>{deletingPlantilla?.nombre}</strong>?
            Esta acción no se puede deshacer.
          </>
        }
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
