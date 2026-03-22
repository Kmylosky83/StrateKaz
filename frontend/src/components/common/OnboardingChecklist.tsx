/**
 * OnboardingChecklist - Checklist de primeros pasos para usuarios nuevos
 *
 * Muestra una lista de acciones recomendadas para configurar la cuenta.
 * Se oculta cuando el usuario lo cierra (persiste en localStorage).
 * Usa Card, Progress del Design System + Framer Motion para animaciones.
 */

import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Card } from './Card';
import { Progress } from './Progress';
import { cn } from '@/utils/cn';

// ============================================================================
// TIPOS
// ============================================================================

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  to: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'perfil',
    label: 'Completa tu perfil',
    description: 'Agrega tu foto, datos personales y de contacto',
    to: '/mi-portal',
  },
  {
    id: 'firma',
    label: 'Configura tu firma digital',
    description: 'Registra tu firma para aprobar documentos electrónicamente',
    to: '/mi-portal?tab=firma',
  },
  {
    id: 'modulos',
    label: 'Explora los módulos disponibles',
    description: 'Conoce las herramientas de gestión asignadas a tu rol',
    to: '/dashboard',
  },
  {
    id: 'documentos',
    label: 'Revisa tus documentos pendientes',
    description: 'Consulta documentos que requieren tu revisión o firma',
    to: '/gestion-documental',
  },
];

const getStorageKey = (tenantId: number | null): string =>
  `stratekaz_onboarding_dismissed_${tenantId ?? 'global'}`;

const getCheckedKey = (tenantId: number | null): string =>
  `stratekaz_onboarding_checked_${tenantId ?? 'global'}`;

// ============================================================================
// COMPONENTE
// ============================================================================

export const OnboardingChecklist = () => {
  const currentTenantId = useAuthStore((s) => s.currentTenantId);

  const storageKey = useMemo(() => getStorageKey(currentTenantId), [currentTenantId]);
  const checkedKey = useMemo(() => getCheckedKey(currentTenantId), [currentTenantId]);

  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(checkedKey);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // localStorage no disponible
    }
    setIsDismissed(true);
  }, [storageKey]);

  const toggleItem = useCallback(
    (id: string) => {
      setCheckedItems((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        try {
          localStorage.setItem(checkedKey, JSON.stringify([...next]));
        } catch {
          // localStorage no disponible
        }
        return next;
      });
    },
    [checkedKey]
  );

  const completedCount = checkedItems.size;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressValue = Math.round((completedCount / totalCount) * 100);

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Card variant="bordered" padding="none" className="overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Primeros pasos en StrateKaz
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {completedCount} de {totalCount} completados
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Cerrar checklist de bienvenida"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-5 pb-3">
            <Progress value={progressValue} size="sm" color="primary" />
          </div>

          {/* Items */}
          <div className="px-5 pb-5 space-y-1">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = checkedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg p-3 -mx-1 transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    isChecked && 'opacity-60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="flex-shrink-0 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                    aria-label={isChecked ? `Desmarcar: ${item.label}` : `Marcar: ${item.label}`}
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-success-500 dark:text-success-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    )}
                  </button>
                  <Link
                    to={item.to}
                    className="flex-1 min-w-0 group"
                  >
                    <p
                      className={cn(
                        'text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors',
                        isChecked && 'line-through'
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingChecklist;
