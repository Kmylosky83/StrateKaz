/**
 * PorterDiagram - Diagrama de las 5 Fuerzas de Porter
 * Sistema de Gestión StrateKaz
 *
 * Diagrama visual de las 5 fuerzas competitivas:
 *           ┌──────────────────┐
 *           │ Nuevos Entrantes │
 *           └──────────────────┘
 *                     ▼
 * ┌──────────┐  ┌──────────┐  ┌──────────┐
 * │Proveedores├─▶│Rivalidad │◀─┤ Clientes │
 * └──────────┘  └──────────┘  └──────────┘
 *                     ▲
 *           ┌──────────────────┐
 *           │    Sustitutos    │
 *           └──────────────────┘
 *
 * Características:
 * - Layout en cruz con 5 fuerzas posicionadas
 * - Cards interactivas por fuerza
 * - Badge de nivel (alto/medio/bajo) con colores
 * - Progress bar de intensidad
 * - Lista de factores clave
 * - Click para editar
 * - Responsive que colapsa a columnas en mobile
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Swords,
  UserPlus,
  Repeat,
  Truck,
  Users as UsersIcon,
  ChevronRight,
} from 'lucide-react';
import { Card, Badge, Button, Progress } from '@/components/common';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { useFuerzasPorter } from '../../hooks/useContexto';
import {
  TIPO_FUERZA_PORTER_CONFIG,
  NIVEL_IMPACTO_CONFIG,
  type FuerzaPorter,
  type TipoFuerzaPorter,
  type NivelImpacto,
} from '../../types/contexto.types';
import { cn } from '@/utils/cn';

// ============================================================================
// TIPOS
// ============================================================================

interface PorterDiagramProps {
  periodo: string;
  onEditFuerza?: (fuerza: FuerzaPorter) => void;
  readOnly?: boolean;
}

// ============================================================================
// FUERZA CARD
// ============================================================================

interface FuerzaCardProps {
  fuerza: FuerzaPorter | null;
  tipo: TipoFuerzaPorter;
  onClick?: () => void;
  readOnly?: boolean;
}

const FuerzaCard = ({ fuerza, tipo, onClick, readOnly }: FuerzaCardProps) => {
  const config = TIPO_FUERZA_PORTER_CONFIG[tipo];

  const Icon = {
    rivalidad: Swords,
    nuevos_entrantes: UserPlus,
    sustitutos: Repeat,
    poder_proveedores: Truck,
    poder_clientes: UsersIcon,
  }[tipo];

  // Si no hay fuerza configurada
  if (!fuerza) {
    return (
      <Card className="p-6 h-full flex flex-col items-center justify-center text-gray-400">
        <Icon className="w-12 h-12 mb-3 opacity-30" />
        <h3 className="text-sm font-semibold mb-1">{config.label}</h3>
        <p className="text-xs text-center mb-3">{config.description}</p>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={onClick}>
            Configurar
          </Button>
        )}
      </Card>
    );
  }

  const nivelConfig = NIVEL_IMPACTO_CONFIG[fuerza.nivel];

  // Calcular intensidad (0-100) basada en nivel
  const intensidad =
    fuerza.nivel === 'alto' ? 80 : fuerza.nivel === 'medio' ? 50 : 20;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: readOnly ? 1 : 1.03 }}
      className="h-full"
    >
      <Card
        className="p-4 h-full cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {config.shortLabel}
            </h3>
          </div>
          <Badge variant={nivelConfig.color} size="sm">
            {nivelConfig.label}
          </Badge>
        </div>

        {/* Descripción de la fuerza */}
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {config.description}
        </p>

        {/* Progress bar de intensidad */}
        <div className="mb-3">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-400">Intensidad</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {intensidad}%
            </span>
          </div>
          <Progress
            value={intensidad}
            className={cn(
              'h-2',
              fuerza.nivel === 'alto' && 'bg-red-500',
              fuerza.nivel === 'medio' && 'bg-yellow-500',
              fuerza.nivel === 'bajo' && 'bg-green-500'
            )}
          />
        </div>

        {/* Factores clave */}
        {fuerza.factores && fuerza.factores.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Factores clave:
            </p>
            <ul className="space-y-1">
              {fuerza.factores.slice(0, 3).map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-1 text-xs text-gray-600 dark:text-gray-400"
                >
                  <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{factor}</span>
                </li>
              ))}
              {fuerza.factores.length > 3 && (
                <li className="text-xs text-gray-500 dark:text-gray-500 ml-4">
                  +{fuerza.factores.length - 3} más...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Implicaciones estratégicas (truncadas) */}
        {fuerza.implicaciones_estrategicas && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              <span className="font-semibold">Implicaciones:</span>{' '}
              {fuerza.implicaciones_estrategicas}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const PorterDiagram = ({
  periodo,
  onEditFuerza,
  readOnly,
}: PorterDiagramProps) => {
  const { data, isLoading, error } = useFuerzasPorter(
    { periodo },
    1,
    10 // Máximo 5 fuerzas, pero damos margen
  );

  // Mapear fuerzas por tipo
  const fuerzasPorTipo = useMemo(() => {
    const fuerzas = data?.results || [];
    return {
      rivalidad: fuerzas.find((f) => f.tipo === 'rivalidad') || null,
      nuevos_entrantes:
        fuerzas.find((f) => f.tipo === 'nuevos_entrantes') || null,
      sustitutos: fuerzas.find((f) => f.tipo === 'sustitutos') || null,
      poder_proveedores:
        fuerzas.find((f) => f.tipo === 'poder_proveedores') || null,
      poder_clientes: fuerzas.find((f) => f.tipo === 'poder_clientes') || null,
    };
  }, [data?.results]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando fuerzas de Porter...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="danger" title="Error">
          <p>Error al cargar las fuerzas de Porter</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Layout Desktop: Cruz */}
      <div className="hidden md:grid md:grid-cols-[1fr_2fr_1fr] gap-4 items-center">
        {/* Fila 1: Nuevos Entrantes (centrado) */}
        <div className="col-start-2">
          <FuerzaCard
            fuerza={fuerzasPorTipo.nuevos_entrantes}
            tipo="nuevos_entrantes"
            onClick={() =>
              fuerzasPorTipo.nuevos_entrantes &&
              onEditFuerza?.(fuerzasPorTipo.nuevos_entrantes)
            }
            readOnly={readOnly}
          />
        </div>

        {/* Fila 2: Proveedores | Rivalidad | Clientes */}
        <div className="col-start-1">
          <FuerzaCard
            fuerza={fuerzasPorTipo.poder_proveedores}
            tipo="poder_proveedores"
            onClick={() =>
              fuerzasPorTipo.poder_proveedores &&
              onEditFuerza?.(fuerzasPorTipo.poder_proveedores)
            }
            readOnly={readOnly}
          />
        </div>
        <div className="col-start-2">
          <FuerzaCard
            fuerza={fuerzasPorTipo.rivalidad}
            tipo="rivalidad"
            onClick={() =>
              fuerzasPorTipo.rivalidad && onEditFuerza?.(fuerzasPorTipo.rivalidad)
            }
            readOnly={readOnly}
          />
        </div>
        <div className="col-start-3">
          <FuerzaCard
            fuerza={fuerzasPorTipo.poder_clientes}
            tipo="poder_clientes"
            onClick={() =>
              fuerzasPorTipo.poder_clientes &&
              onEditFuerza?.(fuerzasPorTipo.poder_clientes)
            }
            readOnly={readOnly}
          />
        </div>

        {/* Fila 3: Sustitutos (centrado) */}
        <div className="col-start-2">
          <FuerzaCard
            fuerza={fuerzasPorTipo.sustitutos}
            tipo="sustitutos"
            onClick={() =>
              fuerzasPorTipo.sustitutos && onEditFuerza?.(fuerzasPorTipo.sustitutos)
            }
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* Layout Mobile: Columnas */}
      <div className="md:hidden space-y-4">
        <FuerzaCard
          fuerza={fuerzasPorTipo.nuevos_entrantes}
          tipo="nuevos_entrantes"
          onClick={() =>
            fuerzasPorTipo.nuevos_entrantes &&
            onEditFuerza?.(fuerzasPorTipo.nuevos_entrantes)
          }
          readOnly={readOnly}
        />
        <FuerzaCard
          fuerza={fuerzasPorTipo.poder_proveedores}
          tipo="poder_proveedores"
          onClick={() =>
            fuerzasPorTipo.poder_proveedores &&
            onEditFuerza?.(fuerzasPorTipo.poder_proveedores)
          }
          readOnly={readOnly}
        />
        <FuerzaCard
          fuerza={fuerzasPorTipo.rivalidad}
          tipo="rivalidad"
          onClick={() =>
            fuerzasPorTipo.rivalidad && onEditFuerza?.(fuerzasPorTipo.rivalidad)
          }
          readOnly={readOnly}
        />
        <FuerzaCard
          fuerza={fuerzasPorTipo.poder_clientes}
          tipo="poder_clientes"
          onClick={() =>
            fuerzasPorTipo.poder_clientes &&
            onEditFuerza?.(fuerzasPorTipo.poder_clientes)
          }
          readOnly={readOnly}
        />
        <FuerzaCard
          fuerza={fuerzasPorTipo.sustitutos}
          tipo="sustitutos"
          onClick={() =>
            fuerzasPorTipo.sustitutos && onEditFuerza?.(fuerzasPorTipo.sustitutos)
          }
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};
