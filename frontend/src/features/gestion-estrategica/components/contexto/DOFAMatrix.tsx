/**
 * DOFAMatrix - Matriz Interactiva 2x2 para Análisis DOFA
 * Sistema de Gestión StrateKaz
 *
 * Matriz visual con 4 cuadrantes:
 * ┌──────────────────┬──────────────────┐
 * │  Fortalezas (F)  │  Debilidades (D) │
 * ├──────────────────┼──────────────────┤
 * │ Oportunidades(O) │   Amenazas (A)   │
 * └──────────────────┴──────────────────┘
 *
 * Características:
 * - Drag & Drop con @dnd-kit para reorganizar factores
 * - Colores por tipo (verde=F, azul=O, naranja=D, rojo=A)
 * - Click para editar factor
 * - Badge de área afectada e impacto
 * - Animaciones con Framer Motion
 */

import { useMemo } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { Card, Badge } from '@/components/common';
import { Spinner } from '@/components/common/Spinner';
import { useFactoresDofa, useUpdateFactorDofa } from '../../hooks/useContexto';
import {
  TIPO_FACTOR_DOFA_CONFIG,
  NIVEL_IMPACTO_CONFIG,
  type FactorDOFA,
  type TipoFactorDOFA,
} from '../../types/contexto.types';
import { cn } from '@/utils/cn';

// ============================================================================
// TIPOS
// ============================================================================

interface DOFAMatrixProps {
  analisisId: number;
  onEditFactor?: (factor: FactorDOFA) => void;
  readOnly?: boolean;
}

// ============================================================================
// SORTABLE FACTOR CARD
// ============================================================================

interface SortableFactorCardProps {
  factor: FactorDOFA;
  onClick?: () => void;
  readOnly?: boolean;
}

const SortableFactorCard = ({ factor, onClick, readOnly }: SortableFactorCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: factor.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = TIPO_FACTOR_DOFA_CONFIG[factor.tipo];
  const impactoConfig = NIVEL_IMPACTO_CONFIG[factor.impacto];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: readOnly ? 1 : 1.02 }}
      className={cn(
        'group relative',
        isDragging && 'z-50'
      )}
    >
      <div
        className={cn(
          'rounded-lg border-2 p-3 cursor-pointer transition-all',
          config.bgClass,
          config.borderClass,
          'hover:shadow-md',
          isDragging && 'shadow-xl'
        )}
        onClick={onClick}
      >
        {/* Drag Handle */}
        {!readOnly && (
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Content */}
        <div className="pl-6 space-y-2">
          {/* Descripción */}
          <p className={cn('text-sm font-medium', config.textClass)}>
            {factor.descripcion}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {/* Badge de Impacto */}
            <Badge variant={impactoConfig.color} size="sm">
              {impactoConfig.label}
            </Badge>

            {/* Badge de Área */}
            {factor.area && (
              <Badge variant="secondary" size="sm">
                {factor.area.nombre}
              </Badge>
            )}

            {/* Badge de Fuente si existe */}
            {factor.fuente && (
              <Badge variant="secondary" size="sm" className="text-xs">
                {factor.fuente}
              </Badge>
            )}
          </div>

          {/* Evidencias (truncadas) */}
          {factor.evidencias && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
              {factor.evidencias}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// CUADRANTE
// ============================================================================

interface CuadranteProps {
  tipo: TipoFactorDOFA;
  factores: FactorDOFA[];
  onFactorClick?: (factor: FactorDOFA) => void;
  readOnly?: boolean;
}

const Cuadrante = ({ tipo, factores, onFactorClick, readOnly }: CuadranteProps) => {
  const config = TIPO_FACTOR_DOFA_CONFIG[tipo];

  const Icon = {
    fortaleza: TrendingUp,
    oportunidad: Zap,
    debilidad: TrendingDown,
    amenaza: AlertCircle,
  }[tipo];

  const itemIds = factores.map((f) => f.id);

  return (
    <Card className="h-full flex flex-col min-h-[260px]">
      {/* Header del cuadrante */}
      <div className={cn('p-4 rounded-t-lg', config.bgClass, config.borderClass, 'border-b-2')}>
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', config.textClass)} />
          <h3 className={cn('text-lg font-semibold', config.textClass)}>
            {config.label} ({config.shortLabel})
          </h3>
          <Badge variant={config.color} className="ml-auto">
            {factores.length}
          </Badge>
        </div>
      </div>

      {/* Lista de factores */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[300px]">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {factores.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Icon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay factores en este cuadrante</p>
                  {!readOnly && (
                    <p className="text-xs mt-1">Arrastra factores aquí o crea uno nuevo</p>
                  )}
                </div>
              ) : (
                factores.map((factor) => (
                  <SortableFactorCard
                    key={factor.id}
                    factor={factor}
                    onClick={() => onFactorClick?.(factor)}
                    readOnly={readOnly}
                  />
                ))
              )}
            </div>
          </AnimatePresence>
        </SortableContext>
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const DOFAMatrix = ({ analisisId, onEditFactor, readOnly }: DOFAMatrixProps) => {
  const { data, isLoading, error } = useFactoresDofa(
    { analisis: analisisId },
    1,
    100 // Cargar todos los factores
  );
  const updateFactorMutation = useUpdateFactorDofa();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimiento antes de activar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Agrupar factores por tipo
  const factoresPorTipo = useMemo(() => {
    if (!data?.results) return {
      fortaleza: [],
      oportunidad: [],
      debilidad: [],
      amenaza: [],
    };

    return {
      fortaleza: data.results.filter((f) => f.tipo === 'fortaleza'),
      oportunidad: data.results.filter((f) => f.tipo === 'oportunidad'),
      debilidad: data.results.filter((f) => f.tipo === 'debilidad'),
      amenaza: data.results.filter((f) => f.tipo === 'amenaza'),
    };
  }, [data?.results]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || readOnly) return;

    // Encontrar el factor que se está moviendo
    const activeFactor = data?.results.find((f) => f.id === active.id);
    if (!activeFactor) return;

    // Encontrar el cuadrante de destino
    const overFactor = data?.results.find((f) => f.id === over.id);
    if (!overFactor) return;

    // Si el tipo cambió, actualizar el factor
    if (activeFactor.tipo !== overFactor.tipo) {
      updateFactorMutation.mutate({
        id: activeFactor.id,
        data: { tipo: overFactor.tipo },
      });
    } else {
      // Mismo cuadrante, solo reordenar
      const items = factoresPorTipo[activeFactor.tipo];
      const oldIndex = items.findIndex((f) => f.id === active.id);
      const newIndex = items.findIndex((f) => f.id === over.id);

      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Actualizar orden de cada factor
        newOrder.forEach((factor, index) => {
          updateFactorMutation.mutate({
            id: factor.id,
            data: { orden: index },
          });
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando análisis DOFA...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>Error al cargar los factores DOFA</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {/* Grid 2x2 con altura mínima fija para cada cuadrante */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        {/* Fila Superior: Fortalezas | Debilidades */}
        <div className="min-h-[280px]">
          <Cuadrante
            tipo="fortaleza"
            factores={factoresPorTipo.fortaleza}
            onFactorClick={onEditFactor}
            readOnly={readOnly}
          />
        </div>
        <div className="min-h-[280px]">
          <Cuadrante
            tipo="debilidad"
            factores={factoresPorTipo.debilidad}
            onFactorClick={onEditFactor}
            readOnly={readOnly}
          />
        </div>

        {/* Fila Inferior: Oportunidades | Amenazas */}
        <div className="min-h-[280px]">
          <Cuadrante
            tipo="oportunidad"
            factores={factoresPorTipo.oportunidad}
            onFactorClick={onEditFactor}
            readOnly={readOnly}
          />
        </div>
        <div className="min-h-[280px]">
          <Cuadrante
            tipo="amenaza"
            factores={factoresPorTipo.amenaza}
            onFactorClick={onEditFactor}
            readOnly={readOnly}
          />
        </div>
      </div>
    </DndContext>
  );
};
