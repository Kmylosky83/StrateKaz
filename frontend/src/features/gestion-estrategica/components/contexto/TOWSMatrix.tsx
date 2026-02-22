/**
 * TOWSMatrix - Matriz Interactiva 2x2 para Estrategias TOWS
 * Sistema de Gestión StrateKaz
 *
 * Matriz visual con 4 cuadrantes de estrategias:
 * ┌──────────────────────┬──────────────────────┐
 * │  FO - Ofensiva       │  FA - Defensiva      │
 * │  (Fortalezas-Opor)   │  (Fortalezas-Amenz)  │
 * ├──────────────────────┼──────────────────────┤
 * │  DO - Adaptativa     │  DA - Supervivencia  │
 * │  (Debilidades-Opor)  │  (Debilidades-Amenz) │
 * └──────────────────────┴──────────────────────┘
 *
 * Características:
 * - Card por estrategia con estado visual (badge)
 * - Botón "Convertir a Objetivo" visible solo si aprobada/en_ejecución
 * - Icono de check si ya convertida (con código del objetivo)
 * - Progress bar si tiene progreso_porcentaje
 * - Días restantes si tiene fecha_limite
 * - Workflow completo: Aprobar → Ejecutar → Completar → Convertir
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  Users,
  Play,
  Check,
  XCircle,
  Pause,
} from 'lucide-react';
import { Card, Badge, Button, Progress } from '@/components/common';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import {
  useEstrategiasTows,
  useAprobarEstrategiaTows,
  useEjecutarEstrategiaTows,
  useCompletarEstrategiaTows,
} from '../../hooks/useContexto';
import { ConvertirObjetivoModal } from '../modals/ConvertirObjetivoModal';
import {
  TIPO_ESTRATEGIA_TOWS_CONFIG,
  ESTADO_ESTRATEGIA_CONFIG,
  PRIORIDAD_CONFIG,
  type EstrategiaTOWS,
  type TipoEstrategiaTOWS,
  type EstadoEstrategia,
} from '../../types/contexto.types';
import { cn } from '@/utils/cn';

// ============================================================================
// TIPOS
// ============================================================================

interface TOWSMatrixProps {
  analisisId: number;
  onEditEstrategia?: (estrategia: EstrategiaTOWS) => void;
  readOnly?: boolean;
}

// ============================================================================
// ESTRATEGIA CARD
// ============================================================================

interface EstrategiaCardProps {
  estrategia: EstrategiaTOWS;
  onConvertir: () => void;
  onEdit?: () => void;
  onAprobar: () => void;
  onEjecutar: () => void;
  onCompletar: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

const EstrategiaCard = ({
  estrategia,
  onConvertir,
  onEdit,
  onAprobar,
  onEjecutar,
  onCompletar,
  isLoading,
  readOnly,
}: EstrategiaCardProps) => {
  const tipoConfig = TIPO_ESTRATEGIA_TOWS_CONFIG[estrategia.tipo];
  const estadoConfig = ESTADO_ESTRATEGIA_CONFIG[estrategia.estado];
  const prioridadConfig = estrategia.prioridad ? PRIORIDAD_CONFIG[estrategia.prioridad] : null;

  const yaConvertida = !!estrategia.objetivo_estrategico;
  const puedeConvertir =
    (estrategia.estado === 'aprobada' || estrategia.estado === 'en_ejecucion') && !yaConvertida;

  const getIconoEstado = (estado: EstadoEstrategia) => {
    const iconos = {
      propuesta: Clock,
      aprobada: CheckCircle2,
      en_ejecucion: Play,
      completada: Check,
      cancelada: XCircle,
      suspendida: Pause,
    };
    return iconos[estado];
  };

  const IconoEstado = getIconoEstado(estrategia.estado);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: readOnly ? 1 : 1.02 }}
      className="h-full"
    >
      <Card
        className="h-full flex flex-col p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onEdit}
      >
        {/* Header con badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant={estadoConfig.color} size="sm">
              <IconoEstado className="w-3 h-3 mr-1" />
              {estadoConfig.label}
            </Badge>
            {prioridadConfig && (
              <Badge variant={prioridadConfig.color} size="sm">
                {prioridadConfig.label}
              </Badge>
            )}
          </div>
          {yaConvertida && (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Convertida
            </Badge>
          )}
        </div>

        {/* Descripción */}
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 line-clamp-3">
          {estrategia.descripcion}
        </p>

        {/* Objetivo esperado */}
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          <span className="font-semibold">Objetivo:</span> {estrategia.objetivo}
        </p>

        {/* Progress Bar si existe */}
        {estrategia.progreso_porcentaje > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progreso</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {estrategia.progreso_porcentaje}%
              </span>
            </div>
            <Progress value={estrategia.progreso_porcentaje} className="h-2" />
          </div>
        )}

        {/* Info adicional */}
        <div className="space-y-2 mb-3 text-xs">
          {estrategia.area_responsable && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-3 h-3" />
              <span className="truncate">{estrategia.area_responsable.nombre}</span>
            </div>
          )}
          {estrategia.dias_restantes !== null && estrategia.dias_restantes !== undefined && (
            <div
              className={cn(
                'flex items-center gap-2',
                estrategia.dias_restantes < 0
                  ? 'text-red-600 dark:text-red-400'
                  : estrategia.dias_restantes < 30
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <Calendar className="w-3 h-3" />
              <span>
                {estrategia.dias_restantes < 0
                  ? `Vencida hace ${Math.abs(estrategia.dias_restantes)} días`
                  : `${estrategia.dias_restantes} días restantes`}
              </span>
            </div>
          )}
        </div>

        {/* Objetivo BSC vinculado */}
        {yaConvertida && estrategia.objetivo_estrategico_code && (
          <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-800 dark:text-green-300">
              Objetivo: <span className="font-mono">{estrategia.objetivo_estrategico_code}</span>
            </p>
            {estrategia.objetivo_estrategico_name && (
              <p className="text-xs text-green-700 dark:text-green-400 mt-1 line-clamp-1">
                {estrategia.objetivo_estrategico_name}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {!readOnly && (
          <div className="mt-auto space-y-2">
            {/* Workflow buttons */}
            {estrategia.estado === 'propuesta' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAprobar();
                }}
                disabled={isLoading}
                className="w-full"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Aprobar
              </Button>
            )}

            {estrategia.estado === 'aprobada' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEjecutar();
                }}
                disabled={isLoading}
                className="w-full"
              >
                <Play className="w-3 h-3 mr-1" />
                Ejecutar
              </Button>
            )}

            {estrategia.estado === 'en_ejecucion' && !yaConvertida && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompletar();
                }}
                disabled={isLoading}
                className="w-full"
              >
                <Check className="w-3 h-3 mr-1" />
                Completar
              </Button>
            )}

            {/* Botón Convertir a Objetivo */}
            {puedeConvertir && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onConvertir();
                }}
                disabled={isLoading}
                className="w-full"
              >
                <Target className="w-3 h-3 mr-1" />
                Convertir a Objetivo BSC
              </Button>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// ============================================================================
// CUADRANTE TOWS
// ============================================================================

interface CuadranteTOWSProps {
  tipo: TipoEstrategiaTOWS;
  estrategias: EstrategiaTOWS[];
  onConvertir: (estrategia: EstrategiaTOWS) => void;
  onEdit?: (estrategia: EstrategiaTOWS) => void;
  onAprobar: (id: number) => void;
  onEjecutar: (id: number) => void;
  onCompletar: (id: number) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

const CuadranteTOWS = ({
  tipo,
  estrategias,
  onConvertir,
  onEdit,
  onAprobar,
  onEjecutar,
  onCompletar,
  isLoading,
  readOnly,
}: CuadranteTOWSProps) => {
  const config = TIPO_ESTRATEGIA_TOWS_CONFIG[tipo];

  return (
    <Card className="h-full flex flex-col">
      {/* Header del cuadrante */}
      <div className={cn('p-4 rounded-t-lg', config.bgClass, config.borderClass, 'border-b-2')}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn('text-lg font-semibold', config.textClass)}>{config.label}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{config.description}</p>
          </div>
          <Badge variant={config.color as any}>{estrategias.length}</Badge>
        </div>
      </div>

      {/* Lista de estrategias */}
      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {estrategias.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay estrategias en este cuadrante</p>
              {!readOnly && <p className="text-xs mt-1">Crea estrategias desde el análisis DOFA</p>}
            </div>
          ) : (
            <div className="grid gap-3">
              {estrategias.map((estrategia) => (
                <EstrategiaCard
                  key={estrategia.id}
                  estrategia={estrategia}
                  onConvertir={() => onConvertir(estrategia)}
                  onEdit={() => onEdit?.(estrategia)}
                  onAprobar={() => onAprobar(estrategia.id)}
                  onEjecutar={() => onEjecutar(estrategia.id)}
                  onCompletar={() => onCompletar(estrategia.id)}
                  isLoading={isLoading}
                  readOnly={readOnly}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const TOWSMatrix = ({ analisisId, onEditEstrategia, readOnly }: TOWSMatrixProps) => {
  const [selectedEstrategia, setSelectedEstrategia] = useState<EstrategiaTOWS | null>(null);

  const { data, isLoading, error } = useEstrategiasTows({ analisis: analisisId }, 1, 100);
  const aprobarMutation = useAprobarEstrategiaTows();
  const ejecutarMutation = useEjecutarEstrategiaTows();
  const completarMutation = useCompletarEstrategiaTows();

  // Agrupar estrategias por tipo
  const estrategiasPorTipo = {
    fo: data?.results.filter((e) => e.tipo === 'fo') || [],
    fa: data?.results.filter((e) => e.tipo === 'fa') || [],
    do: data?.results.filter((e) => e.tipo === 'do') || [],
    da: data?.results.filter((e) => e.tipo === 'da') || [],
  };

  const isMutating =
    aprobarMutation.isPending || ejecutarMutation.isPending || completarMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando estrategias TOWS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="danger">
          <p>Error al cargar las estrategias TOWS</p>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-32rem)]">
        {/* Fila Superior: FO (Ofensiva) | FA (Defensiva) */}
        <CuadranteTOWS
          tipo="fo"
          estrategias={estrategiasPorTipo.fo}
          onConvertir={setSelectedEstrategia}
          onEdit={onEditEstrategia}
          onAprobar={aprobarMutation.mutate}
          onEjecutar={ejecutarMutation.mutate}
          onCompletar={completarMutation.mutate}
          isLoading={isMutating}
          readOnly={readOnly}
        />
        <CuadranteTOWS
          tipo="fa"
          estrategias={estrategiasPorTipo.fa}
          onConvertir={setSelectedEstrategia}
          onEdit={onEditEstrategia}
          onAprobar={aprobarMutation.mutate}
          onEjecutar={ejecutarMutation.mutate}
          onCompletar={completarMutation.mutate}
          isLoading={isMutating}
          readOnly={readOnly}
        />

        {/* Fila Inferior: DO (Adaptativa) | DA (Supervivencia) */}
        <CuadranteTOWS
          tipo="do"
          estrategias={estrategiasPorTipo.do}
          onConvertir={setSelectedEstrategia}
          onEdit={onEditEstrategia}
          onAprobar={aprobarMutation.mutate}
          onEjecutar={ejecutarMutation.mutate}
          onCompletar={completarMutation.mutate}
          isLoading={isMutating}
          readOnly={readOnly}
        />
        <CuadranteTOWS
          tipo="da"
          estrategias={estrategiasPorTipo.da}
          onConvertir={setSelectedEstrategia}
          onEdit={onEditEstrategia}
          onAprobar={aprobarMutation.mutate}
          onEjecutar={ejecutarMutation.mutate}
          onCompletar={completarMutation.mutate}
          isLoading={isMutating}
          readOnly={readOnly}
        />
      </div>

      {/* Modal para convertir estrategia → objetivo */}
      <ConvertirObjetivoModal
        estrategia={selectedEstrategia}
        isOpen={!!selectedEstrategia}
        onClose={() => setSelectedEstrategia(null)}
      />
    </>
  );
};
