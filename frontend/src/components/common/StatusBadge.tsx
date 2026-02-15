/**
 * StatusBadge - Badge inteligente para estados
 *
 * Reemplaza el patrón duplicado en 15+ tablas HSEQ/Cumplimiento/Riesgos:
 *   const formatEstado = (estado: string) => estado.replace(/_/g, ' ')...
 *   const getGravedadBadgeVariant = (gravedad: string) => { switch... }
 *   <Badge variant={getGravedadBadgeVariant(item.gravedad)} size="sm">
 *     {formatEstado(item.gravedad)}
 *   </Badge>
 *
 * Uso:
 * ```tsx
 * <StatusBadge status="EN_REVISION" />
 * <StatusBadge status="GRAVE" preset="gravedad" />
 * <StatusBadge status="ALTA" preset="prioridad" />
 * <StatusBadge status={90} preset="cumplimiento" />
 * ```
 */
import { Badge, type BadgeVariant, type BadgeSize } from './Badge';
import { cn } from '@/utils/cn';

// =============================================================================
// TYPES
// =============================================================================

export type StatusPreset =
  | 'default'
  | 'gravedad'
  | 'prioridad'
  | 'cumplimiento'
  | 'proceso'
  | 'documento'
  | 'firma'
  | 'plantilla'
  | 'control';

export interface StatusBadgeProps {
  /** Estado a mostrar (string o número para cumplimiento) */
  status: string | number;
  /** Preset de colores predefinido */
  preset?: StatusPreset;
  /** Override manual del variant de Badge */
  variant?: BadgeVariant;
  /** Tamaño del badge */
  size?: BadgeSize;
  /** Override de la etiqueta formateada */
  label?: string;
  /** Icono opcional antes del texto */
  icon?: React.ReactNode;
  /** Clases adicionales */
  className?: string;
}

// =============================================================================
// FORMAT HELPER (replaces formatEstado duplicated in 4+ files)
// =============================================================================

export function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// =============================================================================
// PRESET MAPS
// =============================================================================

/** Preset: gravedad (accidentes, enfermedades) */
const GRAVEDAD_MAP: Record<string, BadgeVariant> = {
  LEVE: 'warning',
  MODERADO: 'warning',
  GRAVE: 'danger',
  MORTAL: 'danger',
  CRITICO: 'danger',
  BAJO: 'success',
  MEDIO: 'warning',
  ALTO: 'danger',
  MUY_ALTO: 'danger',
};

/** Preset: prioridad (acciones, cambios, tareas) */
const PRIORIDAD_MAP: Record<string, BadgeVariant> = {
  BAJA: 'gray',
  MEDIA: 'info',
  ALTA: 'warning',
  CRITICA: 'danger',
  URGENTE: 'danger',
};

/** Preset: proceso (estados de flujo de trabajo) */
const PROCESO_MAP: Record<string, BadgeVariant> = {
  PENDIENTE: 'gray',
  EN_PROCESO: 'info',
  EN_REVISION: 'warning',
  EN_DESARROLLO: 'info',
  COMPLETADO: 'success',
  COMPLETADA: 'success',
  APROBADO: 'success',
  APROBADA: 'success',
  RECHAZADO: 'danger',
  RECHAZADA: 'danger',
  CANCELADO: 'gray',
  CANCELADA: 'gray',
  CERRADO: 'success',
  CERRADA: 'success',
  ABIERTO: 'info',
  ABIERTA: 'info',
  VENCIDO: 'danger',
  VENCIDA: 'danger',
  ACTIVO: 'success',
  ACTIVA: 'success',
  INACTIVO: 'gray',
  INACTIVA: 'gray',
  EJECUTADA: 'success',
  BLOQUEADO: 'danger',
  BLOQUEADA: 'danger',
  PROGRAMADO: 'info',
  PROGRAMADA: 'info',
  REALIZADO: 'success',
  EN_TRATAMIENTO: 'warning',
  RESUELTO: 'success',
  RESUELTA: 'success',
  EN_VERIFICACION: 'warning',
  IMPLEMENTADO: 'success',
  IMPLEMENTADA: 'success',
  VIGENTE: 'success',
  BORRADOR: 'gray',
  OBSOLETO: 'danger',
  OBSOLETA: 'danger',
};

/** Preset: documento (estados de documentos) */
const DOCUMENTO_MAP: Record<string, BadgeVariant> = {
  BORRADOR: 'gray',
  EN_REVISION: 'warning',
  APROBADO: 'success',
  PUBLICADO: 'success',
  OBSOLETO: 'danger',
  ARCHIVADO: 'gray',
};

/** Preset: firma (estados de firma digital) */
const FIRMA_MAP: Record<string, BadgeVariant> = {
  PENDIENTE: 'warning',
  FIRMADO: 'success',
  RECHAZADO: 'danger',
  DELEGADO: 'info',
};

/** Preset: plantilla (estados de plantilla de documento) */
const PLANTILLA_MAP: Record<string, BadgeVariant> = {
  BORRADOR: 'gray',
  ACTIVA: 'success',
  OBSOLETA: 'danger',
};

/** Preset: control (tipos de control documental) */
const CONTROL_MAP: Record<string, BadgeVariant> = {
  DISTRIBUCION: 'info',
  ACTUALIZACION: 'warning',
  RETIRO: 'danger',
  DESTRUCCION: 'danger',
  ARCHIVO: 'gray',
};

function getCumplimientoVariant(value: number): BadgeVariant {
  if (value >= 90) return 'success';
  if (value >= 70) return 'primary';
  if (value >= 50) return 'warning';
  return 'danger';
}

function getVariantForPreset(preset: StatusPreset, status: string | number): BadgeVariant {
  if (preset === 'cumplimiento' && typeof status === 'number') {
    return getCumplimientoVariant(status);
  }

  const statusStr = String(status).toUpperCase();

  switch (preset) {
    case 'gravedad':
      return GRAVEDAD_MAP[statusStr] || 'gray';
    case 'prioridad':
      return PRIORIDAD_MAP[statusStr] || 'gray';
    case 'proceso':
      return PROCESO_MAP[statusStr] || 'gray';
    case 'documento':
      return DOCUMENTO_MAP[statusStr] || 'gray';
    case 'firma':
      return FIRMA_MAP[statusStr] || 'gray';
    case 'plantilla':
      return PLANTILLA_MAP[statusStr] || 'gray';
    case 'control':
      return CONTROL_MAP[statusStr] || 'gray';
    case 'default':
    default:
      // Try all maps in order of specificity
      return (
        PROCESO_MAP[statusStr] ||
        GRAVEDAD_MAP[statusStr] ||
        PRIORIDAD_MAP[statusStr] ||
        DOCUMENTO_MAP[statusStr] ||
        'gray'
      );
  }
}

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

export function StatusBadge({
  status,
  preset = 'default',
  variant: variantOverride,
  size = 'sm',
  label,
  icon,
  className,
}: StatusBadgeProps) {
  const resolvedVariant = variantOverride || getVariantForPreset(preset, status);

  const displayLabel =
    label || (typeof status === 'number' ? `${status}%` : formatStatusLabel(String(status)));

  return (
    <Badge variant={resolvedVariant} size={size} className={className}>
      {icon && <span className="mr-1 inline-flex">{icon}</span>}
      {displayLabel}
    </Badge>
  );
}
