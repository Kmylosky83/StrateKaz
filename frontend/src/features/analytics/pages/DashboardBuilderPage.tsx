/**
 * Página: Dashboard Builder
 * REWRITTEN - Sprint 10
 *
 * Constructor de dashboards personalizados con grid 12 columnas.
 * Drag & drop de widgets usando @dnd-kit.
 * CRUD de vistas y widgets conectado a API real.
 */
import { useState } from 'react';
import { Plus, Edit, Trash2, Star, Grid3x3, LayoutDashboard, Settings, Eye } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageHeader } from '@/components/layout';
import {
  Button,
  Card,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  ConfirmDialog,
} from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { cn } from '@/utils/cn';
import {
  useVistasDashboard,
  useCreateVistaDashboard,
  useUpdateVistaDashboard,
  useDeleteVistaDashboard,
  useWidgetsByVista,
  useCreateWidgetDashboard,
  useUpdateWidgetDashboard,
  useDeleteWidgetDashboard,
  useFavoritos,
  useCreateFavorito,
  useDeleteFavorito,
  useCatalogosKPI,
} from '../hooks/useAnalytics';
import type { VistaDashboard, WidgetDashboard, TipoWidget } from '../types';

// ==================== WIDGET COMPONENTS (Placeholder) ====================
// TODO: Implement actual widget rendering components in Sprint 10

const WidgetRenderer = ({ widget }: { widget: WidgetDashboard }) => {
  const { data: catalogos } = useCatalogosKPI();
  const kpi = catalogos?.find((k) => k.id === widget.kpi);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium text-sm text-gray-900 dark:text-white">
            {widget.kpi_nombre || kpi?.nombre || `KPI #${widget.kpi}`}
          </h4>
          <p className="text-xs text-gray-500">{widget.tipo_widget}</p>
        </div>
        {widget.mostrar_semaforo && <div className="w-3 h-3 rounded-full bg-green-500" />}
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600">
        <p className="text-sm text-gray-500">Widget Preview</p>
      </div>
      {widget.mostrar_tendencia && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">Tendencia: +5.2%</div>
      )}
    </div>
  );
};

// ==================== SORTABLE WIDGET ITEM ====================

interface SortableWidgetProps {
  widget: WidgetDashboard;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableWidget = ({ widget, isEditMode, onEdit, onDelete }: SortableWidgetProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.ancho}`,
    gridRow: `span ${widget.alto}`,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card
        variant="bordered"
        padding="md"
        className={cn('h-full', isDragging && 'ring-2 ring-blue-500', isEditMode && 'cursor-move')}
      >
        {isEditMode && (
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
              <Grid3x3 className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        )}

        {isEditMode && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 bg-white dark:bg-gray-800 shadow-lg"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 bg-white dark:bg-gray-800 shadow-lg text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        <WidgetRenderer widget={widget} />
      </Card>
    </div>
  );
};

// ==================== MODALS ====================

interface VistaDashboardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vista?: VistaDashboard | null;
}

const VistaDashboardFormModal = ({ isOpen, onClose, vista }: VistaDashboardFormModalProps) => {
  const createMutation = useCreateVistaDashboard();
  const updateMutation = useUpdateVistaDashboard();
  const [formData, setFormData] = useState({
    codigo: vista?.codigo || '',
    nombre: vista?.nombre || '',
    descripcion: vista?.descripcion || '',
    perspectiva: vista?.perspectiva || 'general',
    categoria: vista?.categoria || '',
    es_publica: vista?.es_publica ?? false,
    activa: vista?.activa ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (vista) {
        await updateMutation.mutateAsync({ id: vista.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving vista:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vista ? 'Editar Vista' : 'Nueva Vista Dashboard'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código *"
            required
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
          />
          <Input
            label="Nombre *"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
        </div>

        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Perspectiva BSC"
            value={formData.perspectiva}
            onChange={(e) => setFormData({ ...formData, perspectiva: e.target.value as any })}
            options={[
              { value: 'general', label: 'General' },
              { value: 'financiera', label: 'Financiera' },
              { value: 'cliente', label: 'Cliente' },
              { value: 'procesos', label: 'Procesos Internos' },
              { value: 'aprendizaje', label: 'Aprendizaje y Crecimiento' },
            ]}
          />
          <Select
            label="Categoría"
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
            options={[
              { value: '', label: 'Todas' },
              { value: 'sst', label: 'SST' },
              { value: 'pesv', label: 'PESV' },
              { value: 'ambiental', label: 'Ambiental' },
              { value: 'calidad', label: 'Calidad' },
              { value: 'financiero', label: 'Financiero' },
              { value: 'operacional', label: 'Operacional' },
              { value: 'rrhh', label: 'RRHH' },
              { value: 'comercial', label: 'Comercial' },
            ]}
          />
        </div>

        <div className="flex items-center gap-4">
          <Checkbox
            label="Vista Pública"
            checked={formData.es_publica}
            onChange={(e) => setFormData({ ...formData, es_publica: e.target.checked })}
          />
          <Checkbox
            label="Activa"
            checked={formData.activa}
            onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {vista ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface WidgetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vistaId: number;
}

const WidgetSelectorModal = ({ isOpen, onClose, vistaId }: WidgetSelectorModalProps) => {
  const { data: catalogos, isLoading } = useCatalogosKPI({ activo: true });
  const createMutation = useCreateWidgetDashboard();
  const [selectedKPI, setSelectedKPI] = useState<number | null>(null);
  const [tipoWidget, setTipoWidget] = useState<TipoWidget>('kpi_card');
  const [config, setConfig] = useState({
    posicion_fila: 1,
    posicion_columna: 1,
    ancho: 3,
    alto: 2,
    mostrar_tendencia: true,
    mostrar_meta: true,
    mostrar_semaforo: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKPI) return;

    try {
      await createMutation.mutateAsync({
        vista: vistaId,
        kpi: selectedKPI,
        tipo_widget: tipoWidget,
        ...config,
      });
      onClose();
    } catch (error) {
      console.error('Error creating widget:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Widget" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <Select
              label="Seleccionar KPI *"
              required
              value={selectedKPI !== null ? String(selectedKPI) : ''}
              onChange={(e) => setSelectedKPI(e.target.value ? Number(e.target.value) : null)}
              options={[
                { value: '', label: '-- Seleccione un KPI --' },
                ...(catalogos?.map((kpi) => ({
                  value: String(kpi.id),
                  label: `${kpi.codigo} - ${kpi.nombre}`,
                })) || []),
              ]}
            />

            <Select
              label="Tipo de Widget *"
              value={tipoWidget}
              onChange={(e) => setTipoWidget(e.target.value as TipoWidget)}
              options={[
                { value: 'kpi_card', label: 'Tarjeta KPI' },
                { value: 'grafico_linea', label: 'Gráfico de Línea' },
                { value: 'grafico_barra', label: 'Gráfico de Barras' },
                { value: 'grafico_pie', label: 'Gráfico Circular' },
                { value: 'tabla', label: 'Tabla' },
                { value: 'gauge', label: 'Gauge' },
                { value: 'mapa_calor', label: 'Mapa de Calor' },
              ]}
            />

            <div className="grid grid-cols-4 gap-3">
              <Input
                label="Ancho"
                type="number"
                min={1}
                max={12}
                value={String(config.ancho)}
                onChange={(e) => setConfig({ ...config, ancho: Number(e.target.value) })}
              />
              <Input
                label="Alto"
                type="number"
                min={1}
                max={6}
                value={String(config.alto)}
                onChange={(e) => setConfig({ ...config, alto: Number(e.target.value) })}
              />
              <Input
                label="Fila"
                type="number"
                min={1}
                value={String(config.posicion_fila)}
                onChange={(e) => setConfig({ ...config, posicion_fila: Number(e.target.value) })}
              />
              <Input
                label="Columna"
                type="number"
                min={1}
                max={12}
                value={String(config.posicion_columna)}
                onChange={(e) => setConfig({ ...config, posicion_columna: Number(e.target.value) })}
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <Checkbox
                label="Mostrar Tendencia"
                checked={config.mostrar_tendencia}
                onChange={(e) => setConfig({ ...config, mostrar_tendencia: e.target.checked })}
              />
              <Checkbox
                label="Mostrar Meta"
                checked={config.mostrar_meta}
                onChange={(e) => setConfig({ ...config, mostrar_meta: e.target.checked })}
              />
              <Checkbox
                label="Mostrar Semáforo"
                checked={config.mostrar_semaforo}
                onChange={(e) => setConfig({ ...config, mostrar_semaforo: e.target.checked })}
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!selectedKPI || createMutation.isPending}>
            Agregar Widget
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ==================== MAIN COMPONENT ====================

export default function DashboardBuilderPage() {
  const [selectedVista, setSelectedVista] = useState<VistaDashboard | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [vistaModalOpen, setVistaModalOpen] = useState(false);
  const [editingVista, setEditingVista] = useState<VistaDashboard | null>(null);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [deleteVistaId, setDeleteVistaId] = useState<number | null>(null);
  const [deleteWidgetId, setDeleteWidgetId] = useState<number | null>(null);

  const { data: vistas, isLoading: vistasLoading } = useVistasDashboard();
  const { data: favoritos } = useFavoritos();
  const { data: widgets, isLoading: widgetsLoading } = useWidgetsByVista(selectedVista?.id || 0);

  const deleteVistaMutation = useDeleteVistaDashboard();
  const deleteWidgetMutation = useDeleteWidgetDashboard();
  const updateWidgetMutation = useUpdateWidgetDashboard();
  const createFavoritoMutation = useCreateFavorito();
  const deleteFavoritoMutation = useDeleteFavorito();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredVistas = showFavoritesOnly
    ? vistas?.filter((v) => favoritos?.some((f) => f.vista === v.id))
    : vistas;

  const isFavorite = (vistaId: number) => favoritos?.some((f) => f.vista === vistaId);

  const toggleFavorite = async (vistaId: number) => {
    const favorito = favoritos?.find((f) => f.vista === vistaId);
    if (favorito) {
      await deleteFavoritoMutation.mutateAsync(favorito.id);
    } else {
      await createFavoritoMutation.mutateAsync({ vista: vistaId });
    }
  };

  const handleDeleteVista = async () => {
    if (!deleteVistaId) return;
    try {
      await deleteVistaMutation.mutateAsync(deleteVistaId);
      if (selectedVista?.id === deleteVistaId) {
        setSelectedVista(null);
      }
      setDeleteVistaId(null);
    } catch (error) {
      console.error('Error deleting vista:', error);
    }
  };

  const handleDeleteWidget = async () => {
    if (!deleteWidgetId) return;
    try {
      await deleteWidgetMutation.mutateAsync(deleteWidgetId);
      setDeleteWidgetId(null);
    } catch (error) {
      console.error('Error deleting widget:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !widgets) return;

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedWidgets = arrayMove(widgets, oldIndex, newIndex);

    // Update position for all affected widgets
    try {
      await Promise.all(
        reorderedWidgets.map((widget, index) =>
          updateWidgetMutation.mutateAsync({
            id: widget.id,
            data: {
              posicion_fila: Math.floor(index / 4) + 1,
              posicion_columna: (index % 4) * 3 + 1,
            },
          })
        )
      );
    } catch (error) {
      console.error('Error reordering widgets:', error);
    }
  };

  if (vistasLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Builder"
        subtitle="Constructor de dashboards personalizados con widgets arrastrables"
        icon={LayoutDashboard}
      />

      {/* Vista Selector */}
      <Card variant="bordered" padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Vistas</h3>
            <Badge variant="outline">{filteredVistas?.length || 0}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(showFavoritesOnly && 'bg-yellow-100 dark:bg-yellow-900/20')}
            >
              <Star
                className={cn('w-4 h-4', showFavoritesOnly && 'fill-yellow-500 text-yellow-500')}
              />
            </Button>
          </div>
          <Button onClick={() => setVistaModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Vista
          </Button>
        </div>

        {!filteredVistas || filteredVistas.length === 0 ? (
          <EmptyState
            icon={LayoutDashboard}
            title={showFavoritesOnly ? 'No tienes vistas favoritas' : 'No hay vistas disponibles'}
            description={
              showFavoritesOnly
                ? 'Marca vistas como favoritas para acceso rápido'
                : 'Crea tu primera vista dashboard personalizada'
            }
            action={
              !showFavoritesOnly ? (
                <Button onClick={() => setVistaModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Vista
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVistas.map((vista) => (
              <Card
                key={vista.id}
                variant="bordered"
                padding="md"
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedVista?.id === vista.id &&
                    'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                )}
                onClick={() => setSelectedVista(vista)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                      {vista.nombre}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{vista.codigo}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(vista.id);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Star
                        className={cn(
                          'w-4 h-4',
                          isFavorite(vista.id) && 'fill-yellow-500 text-yellow-500'
                        )}
                      />
                    </Button>
                  </div>
                </div>

                {vista.descripcion && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {vista.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-3">
                  {vista.perspectiva && (
                    <Badge variant="secondary" size="sm">
                      {vista.perspectiva}
                    </Badge>
                  )}
                  {vista.categoria && (
                    <Badge variant="outline" size="sm">
                      {vista.categoria}
                    </Badge>
                  )}
                  {vista.es_publica && (
                    <Badge variant="outline" size="sm">
                      Pública
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500">{vista.creado_por_nombre}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVista(vista);
                        setVistaModalOpen(true);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteVistaId(vista.id);
                      }}
                      className="h-7 w-7 p-0 text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Dashboard Grid */}
      {selectedVista && (
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedVista.nombre}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedVista.descripcion || 'Sin descripción'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isEditMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Modo Vista
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Modo Edición
                  </>
                )}
              </Button>
              {isEditMode && (
                <Button onClick={() => setWidgetModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Widget
                </Button>
              )}
            </div>
          </div>

          {widgetsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : !widgets || widgets.length === 0 ? (
            <EmptyState
              icon={Grid3x3}
              title="No hay widgets en esta vista"
              description="Agrega widgets para visualizar tus KPIs"
              action={
                <Button onClick={() => setWidgetModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Widget
                </Button>
              }
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-12 gap-4 auto-rows-[150px]">
                  {widgets.map((widget) => (
                    <SortableWidget
                      key={widget.id}
                      widget={widget}
                      isEditMode={isEditMode}
                      onEdit={() => {
                        // TODO: Implement widget edit modal
                      }}
                      onDelete={() => setDeleteWidgetId(widget.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </Card>
      )}

      {/* Modals */}
      <VistaDashboardFormModal
        isOpen={vistaModalOpen}
        onClose={() => {
          setVistaModalOpen(false);
          setEditingVista(null);
        }}
        vista={editingVista}
      />

      <WidgetSelectorModal
        isOpen={widgetModalOpen}
        onClose={() => setWidgetModalOpen(false)}
        vistaId={selectedVista?.id || 0}
      />

      <ConfirmDialog
        isOpen={!!deleteVistaId}
        onClose={() => setDeleteVistaId(null)}
        onConfirm={handleDeleteVista}
        title="Eliminar Vista"
        message="¿Está seguro de eliminar esta vista? Se eliminarán todos los widgets asociados."
        confirmText="Eliminar"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!deleteWidgetId}
        onClose={() => setDeleteWidgetId(null)}
        onConfirm={handleDeleteWidget}
        title="Eliminar Widget"
        message="¿Está seguro de eliminar este widget?"
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
