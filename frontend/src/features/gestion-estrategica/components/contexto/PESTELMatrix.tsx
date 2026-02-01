/**
 * PESTELMatrix - Matriz Interactiva 3x2 para Análisis PESTEL
 * Sistema de Gestión StrateKaz
 *
 * Matriz visual con 6 cuadrantes para factores:
 * ┌──────────────┬──────────────┬──────────────┐
 * │  Político    │  Económico   │   Social     │
 * ├──────────────┼──────────────┼──────────────┤
 * │ Tecnológico  │  Ecológico   │    Legal     │
 * └──────────────┴──────────────┴──────────────┘
 *
 * Características:
 * - 6 cuadrantes con colores distintivos por tipo
 * - Cards interactivas por factor con badges de impacto, probabilidad y tendencia
 * - Click para editar factor
 * - Botón "+ Agregar factor" por cuadrante
 * - EmptyState cuando no hay factores
 * - Animaciones con Framer Motion
 * - Responsive: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  DollarSign,
  Users,
  Cpu,
  Leaf,
  Scale,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { useFactoresPestel } from '../../hooks/useContexto';
import {
  TIPO_FACTOR_PESTEL_CONFIG,
  NIVEL_IMPACTO_CONFIG,
  TENDENCIA_FACTOR_CONFIG,
  type FactorPESTEL,
  type TipoFactorPESTEL,
} from '../../types/contexto.types';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS
// ============================================================================

interface PESTELMatrixProps {
  analisisId: number;
  onEditFactor?: (factor: FactorPESTEL) => void;
  onAddFactor?: (tipo: TipoFactorPESTEL) => void;
  readOnly?: boolean;
}

// ============================================================================
// FACTOR CARD
// ============================================================================

interface FactorCardProps {
  factor: FactorPESTEL;
  onClick?: () => void;
  readOnly?: boolean;
}

const FactorCard = ({ factor, onClick, readOnly }: FactorCardProps) => {
  const tipoConfig = TIPO_FACTOR_PESTEL_CONFIG[factor.tipo];
  const impactoConfig = NIVEL_IMPACTO_CONFIG[factor.impacto];
  const probabilidadConfig = NIVEL_IMPACTO_CONFIG[factor.probabilidad];
  const tendenciaConfig = TENDENCIA_FACTOR_CONFIG[factor.tendencia];

  const TrendIcon = {
    mejorando: TrendingUp,
    estable: Minus,
    empeorando: TrendingDown,
  }[factor.tendencia];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: readOnly ? 1 : 1.02 }}
      className="h-full"
    >
      <div
        className={cn(
          'rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-md',
          tipoConfig.bgClass,
          'border-gray-200 dark:border-gray-700'
        )}
        onClick={onClick}
      >
        {/* Descripción */}
        <p className={cn('text-sm font-medium mb-2', tipoConfig.textClass)}>
          {factor.descripcion}
        </p>

        {/* Badges en fila */}
        <div className="flex flex-wrap gap-2 mb-2">
          {/* Impacto */}
          <Badge variant={impactoConfig.color} size="sm">
            Impacto: {impactoConfig.label}
          </Badge>

          {/* Probabilidad */}
          <Badge variant={probabilidadConfig.color} size="sm">
            Prob: {probabilidadConfig.label}
          </Badge>

          {/* Tendencia */}
          <Badge variant={tendenciaConfig.color} size="sm">
            <TrendIcon className="w-3 h-3 mr-1" />
            {tendenciaConfig.label}
          </Badge>
        </div>

        {/* Implicaciones (truncadas) */}
        {factor.implicaciones && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {factor.implicaciones}
          </p>
        )}

        {/* Fuentes (si existen, truncadas) */}
        {factor.fuentes && (
          <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1 mt-1">
            Fuente: {factor.fuentes}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// CUADRANTE PESTEL
// ============================================================================

interface CuadrantePESTELProps {
  tipo: TipoFactorPESTEL;
  factores: FactorPESTEL[];
  onFactorClick?: (factor: FactorPESTEL) => void;
  onAddFactor?: () => void;
  readOnly?: boolean;
}

const CuadrantePESTEL = ({
  tipo,
  factores,
  onFactorClick,
  onAddFactor,
  readOnly,
}: CuadrantePESTELProps) => {
  const config = TIPO_FACTOR_PESTEL_CONFIG[tipo];

  const Icon = {
    politico: Building2,
    economico: DollarSign,
    social: Users,
    tecnologico: Cpu,
    ecologico: Leaf,
    legal: Scale,
  }[tipo];

  return (
    <Card className="h-full flex flex-col">
      {/* Header del cuadrante */}
      <div
        className={cn('p-4 rounded-t-lg border-b-2', config.bgClass, 'border-gray-300 dark:border-gray-600')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', config.textClass)} />
            <h3 className={cn('text-base font-semibold', config.textClass)}>
              {config.label} ({config.shortLabel})
            </h3>
          </div>
          <Badge variant="secondary" size="sm">
            {factores.length}
          </Badge>
        </div>
      </div>

      {/* Lista de factores */}
      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {factores.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Icon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay factores</p>
              {!readOnly && (
                <p className="text-xs mt-1">Agrega factores de este tipo</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {factores.map((factor) => (
                <FactorCard
                  key={factor.id}
                  factor={factor}
                  onClick={() => onFactorClick?.(factor)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer con botón agregar */}
      {!readOnly && onAddFactor && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddFactor}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar factor
          </Button>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const PESTELMatrix = ({
  analisisId,
  onEditFactor,
  onAddFactor,
  readOnly,
}: PESTELMatrixProps) => {
  const { data, isLoading, error } = useFactoresPestel(
    { analisis: analisisId },
    1,
    100 // Cargar todos los factores
  );

  // Agrupar factores por tipo
  const factoresPorTipo = useMemo(() => {
    if (!data?.results)
      return {
        politico: [],
        economico: [],
        social: [],
        tecnologico: [],
        ecologico: [],
        legal: [],
      };

    return {
      politico: data.results.filter((f) => f.tipo === 'politico'),
      economico: data.results.filter((f) => f.tipo === 'economico'),
      social: data.results.filter((f) => f.tipo === 'social'),
      tecnologico: data.results.filter((f) => f.tipo === 'tecnologico'),
      ecologico: data.results.filter((f) => f.tipo === 'ecologico'),
      legal: data.results.filter((f) => f.tipo === 'legal'),
    };
  }, [data?.results]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando análisis PESTEL...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="error" title="Error">
          <p>Error al cargar los factores PESTEL</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[calc(100vh-20rem)]">
      {/* Fila Superior: Político | Económico | Social */}
      <CuadrantePESTEL
        tipo="politico"
        factores={factoresPorTipo.politico}
        onFactorClick={onEditFactor}
        onAddFactor={() => onAddFactor?.('politico')}
        readOnly={readOnly}
      />
      <CuadrantePESTEL
        tipo="economico"
        factores={factoresPorTipo.economico}
        onFactorClick={onEditFactor}
        onAddFactor={() => onAddFactor?.('economico')}
        readOnly={readOnly}
      />
      <CuadrantePESTEL
        tipo="social"
        factores={factoresPorTipo.social}
        onFactorClick={onEditFactor}
        onAddFactor={() => onAddFactor?.('social')}
        readOnly={readOnly}
      />

      {/* Fila Inferior: Tecnológico | Ecológico | Legal */}
      <CuadrantePESTEL
        tipo="tecnologico"
        factores={factoresPorTipo.tecnologico}
        onFactorClick={onEditFactor}
        onAddFactor={() => onAddFactor?.('tecnologico')}
        readOnly={readOnly}
      />
      <CuadrantePESTEL
        tipo="ecologico"
        factores={factoresPorTipo.ecologico}
        onFactorClick={onEditFactor}
        onAddFactor={() => onAddFactor?.('ecologico')}
        readOnly={readOnly}
      />
      <CuadrantePESTEL
        tipo="legal"
        factores={factoresPorTipo.legal}
        onFactorClick={onEditFactor}
        onAddFactor={() => onAddFactor?.('legal')}
        readOnly={readOnly}
      />
    </div>
  );
};
