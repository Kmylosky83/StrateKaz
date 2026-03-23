/**
 * SmartOnboardingChecklist — Checklist de onboarding dinámico y personalizado.
 *
 * Consume el endpoint /api/core/onboarding/ y renderiza pasos específicos
 * según el tipo de usuario (admin, jefe, empleado, proveedor, cliente).
 * Desaparece cuando se completa o el usuario lo descarta.
 *
 * Diseño: card profesional tipo top SaaS con:
 * - Borde gradiente superior con color primario del branding
 * - Encabezado con icono + título dinámico + fracción de progreso + botón dismiss
 * - Barra de progreso
 * - Lista de pasos con animaciones stagger (Framer Motion)
 * - Soporte dark mode via Tailwind dark:
 */
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  X,
  Rocket,
  Building2,
  Users,
  PenTool,
  FileText,
  Eye,
  Shield,
  User,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { Progress } from './Progress';
import { Badge } from './Badge';
import { Button } from './Button';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useOnboarding, useDismissOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/utils/cn';

// ============================================================================
// CONSTANTES
// ============================================================================

const TITLE_MAP: Record<string, string> = {
  admin: 'Configura tu empresa',
  jefe: 'Primeros pasos como líder',
  contratista: 'Bienvenido como contratista',
  empleado: 'Bienvenido al equipo',
  proveedor: 'Bienvenido al portal',
  cliente: 'Bienvenido al portal',
};

/**
 * Mapeo de claves de icono (del backend) a componentes Lucide.
 * El backend envía el nombre del icono como string.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // Empresa / estructura
  empresa: Building2,
  estructura: Building2,
  identidad: Building2,
  building: Building2,
  // Perfil
  perfil: User,
  user: User,
  // Firma
  firma: PenTool,
  signature: PenTool,
  pen: PenTool,
  // Equipo
  invitar: Users,
  equipo: Users,
  usuarios: Users,
  team: Users,
  // Portal / explorar
  explorar: Eye,
  portal: Eye,
  // Documentos
  documentos: FileText,
  pendientes: FileText,
  politicas: FileText,
  documents: FileText,
  // Emergencia
  emergencia: AlertTriangle,
  alert: AlertTriangle,
  // HSEQ / seguridad
  hseq: Shield,
  seguridad: Shield,
  shield: Shield,
};

const DEFAULT_ICON: LucideIcon = Rocket;

/**
 * Resuelve el icono por clave desde el backend.
 * Si la clave no coincide, intenta resolver por step.key.
 */
const resolveIcon = (iconKey: string, stepKey?: string): LucideIcon => {
  if (iconKey && ICON_MAP[iconKey.toLowerCase()]) {
    return ICON_MAP[iconKey.toLowerCase()];
  }
  if (stepKey) {
    for (const [mapKey, icon] of Object.entries(ICON_MAP)) {
      if (stepKey.toLowerCase().includes(mapKey)) {
        return icon;
      }
    }
  }
  return DEFAULT_ICON;
};

// ============================================================================
// VARIANTES FRAMER MOTION
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.25, ease: [0.55, 0, 1, 0.45] },
  },
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const SmartOnboardingChecklist = () => {
  const user = useAuthStore((s) => s.user);
  const tenantUser = useAuthStore((s) => s.tenantUser);
  const { companyName, primaryColor } = useBrandingConfig();

  const { data: onboarding, isLoading } = useOnboarding();
  const dismissMutation = useDismissOnboarding();

  // No renderizar mientras carga o si hay error
  if (isLoading || !onboarding) return null;

  // Ocultar si completado o descartado
  if (onboarding.completed || onboarding.dismissed) return null;

  const handleDismiss = () => {
    dismissMutation.mutate();
  };

  // Título dinámico según tipo de usuario
  const title =
    onboarding.onboarding_type === 'empleado'
      ? `Bienvenido a ${companyName}`
      : (TITLE_MAP[onboarding.onboarding_type] ?? 'Primeros pasos');

  // Subtítulo con fracción de pasos
  const subtitle = `${onboarding.done_count} de ${onboarding.total} pasos completados`;

  // Nombre del usuario para saludo personalizado
  const userName =
    user?.first_name || tenantUser?.first_name || tenantUser?.email?.split('@')[0] || '';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="smart-onboarding"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <Card variant="bordered" padding="none" className="overflow-hidden">
          {/* Borde superior con color primario del branding */}
          <div
            className="h-0.5 w-full"
            style={{ backgroundColor: primaryColor }}
            aria-hidden="true"
          />

          {/* Header */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              {/* Icono + Títulos */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Rocket className="w-5 h-5" style={{ color: primaryColor }} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      {title}
                    </h3>
                    {onboarding.overall_progress > 0 && (
                      <Badge variant="success" size="sm">
                        {onboarding.overall_progress}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {userName ? `Hola, ${userName} — ` : ''}
                    {subtitle}
                  </p>
                </div>
              </div>

              {/* Botón dismiss */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                disabled={dismissMutation.isPending}
                aria-label="Cerrar checklist de bienvenida"
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 -mt-1 -mr-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3">
              <Progress value={onboarding.overall_progress} size="sm" color="primary" />
            </div>
          </div>

          {/* Lista de pasos */}
          <div className="px-5 pb-5">
            <motion.div
              className="space-y-1"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {onboarding.steps.map((step) => {
                const StepIcon = resolveIcon(step.icon, step.key);
                return (
                  <motion.div key={step.key} variants={itemVariants}>
                    <Link
                      to={step.link}
                      className={cn(
                        'flex items-start gap-3 rounded-lg px-3 py-2.5 -mx-1 transition-colors group',
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        step.completed && 'opacity-60'
                      )}
                    >
                      {/* Indicador de estado */}
                      <div className="flex-shrink-0 mt-0.5">
                        {step.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                        )}
                      </div>

                      {/* Icono del paso */}
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                          step.completed
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : 'bg-gray-50 dark:bg-gray-800 group-hover:bg-gray-100 dark:group-hover:bg-gray-700'
                        )}
                      >
                        <StepIcon
                          className={cn(
                            'w-3.5 h-3.5',
                            step.completed
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                          )}
                          strokeWidth={2}
                        />
                      </div>

                      {/* Texto */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium transition-colors',
                            step.completed
                              ? 'text-gray-400 dark:text-gray-500 line-through'
                              : 'text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'
                          )}
                        >
                          {step.label}
                        </p>
                        {!step.completed && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                            {step.description}
                          </p>
                        )}
                      </div>

                      {/* CTA text (solo pasos pendientes) */}
                      {!step.completed && step.cta_text && (
                        <span
                          className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            color: primaryColor,
                            backgroundColor: `${primaryColor}15`,
                          }}
                        >
                          {step.cta_text}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartOnboardingChecklist;
