/**
 * SeccionISOCard — Tarjeta reutilizable para cada sección ISO del informe gerencial
 *
 * Cada una de las 15 entradas ISO se envuelve en esta tarjeta que provee:
 * - Header con número de sección, título y referencia ISO
 * - Badge de disponibilidad
 * - KPI summary row
 * - Gráfico mini (children)
 * - Sección expandible "Ver detalle"
 *
 * Usa componentes del Design System exclusivamente.
 */
import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '@/components/common';
import { cn } from '@/utils/cn';

export interface SeccionISOCardProps {
  /** Número de sección (e.g. "1", "2a", "3") */
  seccionNumero: string;
  /** Título de la sección */
  titulo: string;
  /** Referencia ISO (e.g. "§9.3.2a", "§9.3.2c") */
  isoRef: string;
  /** Ícono de la sección */
  icon: ReactNode;
  /** Color del ícono */
  iconColor?: string;
  /** Si el módulo tiene datos disponibles */
  disponible: boolean;
  /** Contenido principal (KPIs + chart) */
  children: ReactNode;
  /** Contenido expandible (detalle) */
  detalle?: ReactNode;
  /** Clases adicionales */
  className?: string;
}

export function SeccionISOCard({
  seccionNumero,
  titulo,
  isoRef,
  icon,
  iconColor = 'text-blue-600 dark:text-blue-400',
  disponible,
  children,
  detalle,
  className,
}: SeccionISOCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-md',
        !disponible && 'opacity-60',
        className
      )}
      padding="none"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                'flex-shrink-0 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50',
                iconColor
              )}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                  {seccionNumero}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {titulo}
                </h3>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{isoRef}</span>
            </div>
          </div>
          <Badge variant={disponible ? 'success' : 'gray'} size="sm">
            {disponible ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Disponible
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                No disponible
              </span>
            )}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {disponible ? (
          children
        ) : (
          <div className="flex items-center justify-center py-6 text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Modulo no disponible en este periodo</p>
            </div>
          </div>
        )}
      </div>

      {/* Expandable detail section */}
      {disponible && detalle && (
        <>
          <div className="px-5 pb-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full !justify-center !text-xs text-gray-500"
            >
              {expanded ? (
                <>
                  Ocultar detalle <ChevronUp className="w-3 h-3 ml-1" />
                </>
              ) : (
                <>
                  Ver detalle <ChevronDown className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700">
                  {detalle}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </Card>
  );
}
