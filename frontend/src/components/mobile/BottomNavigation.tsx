/**
 * BottomNavigation - Navegación móvil tipo app nativa
 *
 * Barra de navegación fija en la parte inferior para dispositivos móviles.
 * Solo visible en pantallas < 768px (md breakpoint).
 *
 * Características:
 * - 5 items máximo (UX best practice)
 * - Safe area insets para dispositivos con notch
 * - Badges para notificaciones
 * - Animaciones suaves
 * - Soporte dark mode
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Bell,
  User,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useIsMobile } from '@/hooks/useMediaQuery';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Path para navegación, o 'action:xxx' para acciones especiales */
  path: string;
  badge?: number;
  color?: string;
}

export interface BottomNavigationProps {
  /** Items de navegación (máximo 5) */
  items?: BottomNavItem[];
  /** Callback para abrir el sidebar/menú */
  onOpenMenu?: () => void;
  /** Callback para abrir búsqueda */
  onOpenSearch?: () => void;
  /** Callback para abrir perfil */
  onOpenProfile?: () => void;
  /** Número de notificaciones pendientes */
  notificationCount?: number;
  /** Clase CSS adicional */
  className?: string;
}

/** Items por defecto - acciones transversales (no módulos) */
const defaultItems: BottomNavItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    icon: Home,
    path: '/dashboard',
  },
  {
    id: 'search',
    label: 'Buscar',
    icon: Search,
    path: 'action:search',
  },
  {
    id: 'notifications',
    label: 'Alertas',
    icon: Bell,
    path: '/notificaciones',
  },
  {
    id: 'profile',
    label: 'Perfil',
    icon: User,
    path: 'action:profile',
  },
  {
    id: 'menu',
    label: 'Menú',
    icon: Menu,
    path: 'action:menu',
  },
];

export const BottomNavigation = ({
  items = defaultItems,
  onOpenMenu,
  onOpenSearch,
  onOpenProfile,
  notificationCount,
  className,
}: BottomNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Solo renderizar en móvil
  if (!isMobile) return null;

  const isActive = (path: string) => {
    // Las acciones nunca están "activas" visualmente
    if (path.startsWith('action:')) return false;
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleItemClick = (item: BottomNavItem) => {
    if (item.path.startsWith('action:')) {
      const action = item.path.replace('action:', '');
      switch (action) {
        case 'menu':
          onOpenMenu?.();
          break;
        case 'search':
          onOpenSearch?.();
          break;
        case 'profile':
          // Fallback: navegar a perfil si no hay callback
          if (onOpenProfile) {
            onOpenProfile();
          } else {
            navigate('/perfil');
          }
          break;
      }
    } else {
      navigate(item.path);
    }
  };

  // Agregar badge de notificaciones al item correspondiente
  const itemsWithBadges = items.map(item => {
    if (item.id === 'notifications' && notificationCount) {
      return { ...item, badge: notificationCount };
    }
    return item;
  });

  return (
    <nav
      className={cn(
        // Posición fija en bottom
        'fixed bottom-0 left-0 right-0 z-50',
        // Fondo con blur
        'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg',
        // Borde superior
        'border-t border-gray-200 dark:border-gray-700',
        // Safe area para dispositivos con notch (iPhone X+)
        'pb-[env(safe-area-inset-bottom)]',
        // Sombra superior sutil
        'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]',
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {itemsWithBadges.slice(0, 5).map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                // Touch target mínimo 44x44px
                'relative flex flex-col items-center justify-center',
                'min-w-[56px] min-h-[44px] px-2 py-1',
                // Transición suave
                'transition-all duration-200',
                // Estado activo/inactivo
                active
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400',
                // Hover/Active states
                'active:scale-95'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Indicador de fondo activo */}
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className={cn(
                    'absolute inset-x-1 top-0 h-1 rounded-b-full',
                    'bg-primary-500 dark:bg-primary-400'
                  )}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icono con badge */}
              <div className="relative">
                <Icon
                  className={cn(
                    'w-6 h-6 transition-transform duration-200',
                    active && 'scale-110',
                    active && item.color
                  )}
                />
                {/* Badge de notificación */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1',
                      'min-w-[18px] h-[18px] px-1',
                      'flex items-center justify-center',
                      'text-[10px] font-bold text-white',
                      'bg-red-500 rounded-full',
                      'animate-pulse'
                    )}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium mt-1 truncate max-w-full',
                  'transition-all duration-200',
                  active && 'font-semibold'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export type { BottomNavItem as BottomNavigationItem };
