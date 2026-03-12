/* eslint-disable react-refresh/only-export-components */
/**
 * DynamicIcon - Componente para renderizar iconos de Lucide dinamicamente
 * Sistema de Gestion StrateKaz
 *
 * Renderiza iconos de Lucide por nombre de string, permitiendo
 * que los iconos vengan de la base de datos sin hardcodear imports.
 *
 * @example
 * ```tsx
 * // Uso basico
 * <DynamicIcon name="Heart" />
 *
 * // Con tamano y color
 * <DynamicIcon name="Shield" size={24} className="text-purple-600" />
 *
 * // Con fallback personalizado
 * <DynamicIcon name="InvalidIcon" fallback={<span>?</span>} />
 * ```
 */

import { memo, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ==================== TYPES ====================

export interface DynamicIconProps {
  /** Nombre del icono de Lucide (ej: "Heart", "Shield", "Star") */
  name: string | null | undefined;
  /** Tamano del icono en pixels (default: 20) */
  size?: number;
  /** Clases CSS adicionales */
  className?: string;
  /** Stroke width del icono (default: 2) */
  strokeWidth?: number;
  /** Contenido a mostrar si el icono no existe */
  fallback?: React.ReactNode;
  /** Color del icono (usa className para mas control) */
  color?: string;
}

// ==================== ICON ACCESS ====================

// Cast al tipo correcto para acceso dinamico
// lucide-react exporta ForwardRefExoticComponent que no pasa typeof === 'function' correctamente
const Icons = LucideIcons as unknown as Record<string, LucideIcon>;

// Icono de fallback por defecto
const FallbackIcon = LucideIcons.Building2;

/**
 * Normaliza el nombre del icono a formato Lucide (PascalCase)
 * Convierte: mdi-building, building, building-2 -> Building2
 */
function normalizeIconName(name: string): string {
  // Remover prefijo mdi- si existe
  let normalized = name.replace(/^mdi-/, '');

  // Convertir kebab-case o snake_case a PascalCase
  normalized = normalized
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

  return normalized;
}

/**
 * Obtiene el componente de icono por nombre
 */
function getIcon(name: string): LucideIcon | null {
  // Intentar buscar directamente
  if (Icons[name]) return Icons[name];

  // Intentar normalizar el nombre
  const normalizedName = normalizeIconName(name);
  if (Icons[normalizedName]) return Icons[normalizedName];

  // Intentar variantes comunes (building -> Building2)
  if (Icons[normalizedName + '2']) return Icons[normalizedName + '2'];

  return null;
}

// ==================== COMPONENT ====================

export const DynamicIcon = memo(function DynamicIcon({
  name,
  size = 20,
  className,
  strokeWidth = 2,
  fallback,
  color,
}: DynamicIconProps) {
  // Obtener el componente de icono
  const IconComponent = useMemo(() => {
    if (!name) return null;
    return getIcon(name);
  }, [name]);

  // Si no hay icono valido, mostrar fallback
  if (!IconComponent) {
    if (fallback) {
      return <>{fallback}</>;
    }
    // Fallback por defecto: icono Building2
    return (
      <FallbackIcon size={size} className={className} strokeWidth={strokeWidth} color={color} />
    );
  }

  return (
    <IconComponent size={size} className={className} strokeWidth={strokeWidth} color={color} />
  );
});

// ==================== UTILITIES ====================

/**
 * Verifica si un nombre de icono existe en Lucide
 */
export function isValidIconName(name: string): boolean {
  return !!getIcon(name);
}

/**
 * Obtiene la lista de todos los nombres de iconos disponibles
 * Filtra solo los que son componentes validos de Lucide
 */
export function getAvailableIconNames(): string[] {
  return Object.keys(Icons)
    .filter((key) => {
      // Excluir utilidades y solo incluir PascalCase (nombres de iconos)
      return (
        /^[A-Z]/.test(key) &&
        key !== 'Icon' &&
        !key.includes('create') &&
        typeof Icons[key] === 'object' // ForwardRefExoticComponent es un objeto
      );
    })
    .sort();
}

/**
 * Obtiene un componente de icono por nombre (para uso avanzado)
 */
export function getIconComponent(name: string): LucideIcon | null {
  return getIcon(name);
}

export default DynamicIcon;
