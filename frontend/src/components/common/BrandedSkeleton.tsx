/**
 * BrandedSkeleton - Skeleton de carga con logo de la empresa
 *
 * Muestra el logo del branding activo con animación sutil mientras carga el contenido.
 * Usa el logo según el tema actual (claro/oscuro) con fallback a StrateKaz.
 */
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/cn';

export interface BrandedSkeletonProps {
  /** Altura del contenedor */
  height?: string;
  /** Clases adicionales */
  className?: string;
  /** Tamaño del logo: sm (32px), md (48px), lg (64px), xl (80px) */
  logoSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Mostrar texto de cargando */
  showText?: boolean;
}

const logoSizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
};

export function BrandedSkeleton({
  height = 'h-64',
  className,
  logoSize = 'lg',
  showText = false,
}: BrandedSkeletonProps) {
  const { logo, logoWhite, companyShortName } = useBrandingConfig();
  const theme = useThemeStore((state) => state.theme);

  // Seleccionar logo según tema
  const currentLogo = theme === 'dark' ? logoWhite : logo;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'bg-gray-50 dark:bg-gray-800/50 rounded-lg',
        height,
        className
      )}
    >
      <img
        src={currentLogo}
        alt={companyShortName}
        className={cn(
          logoSizes[logoSize],
          'object-contain animate-pulse-subtle opacity-40'
        )}
      />
      {showText && (
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-500 animate-pulse-subtle">
          Cargando...
        </p>
      )}
    </div>
  );
}

export default BrandedSkeleton;
