/**
 * DashboardLayout - Enterprise Level Responsive
 *
 * Layout principal con soporte completo para:
 * - Desktop: Sidebar fijo expandible/colapsado
 * - Tablet: Sidebar colapsado por defecto
 * - Mobile: Drawer overlay con animaciones + BottomNavigation
 * - Header contextual con tabs dinamicos
 *
 * PWA-ready con gestos tactiles y transiciones suaves.
 */
import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { HeaderProvider } from '@/contexts/HeaderContext';
import { cn } from '@/utils/cn';
import { useRouteTracker } from '@/hooks/useLastRoute';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { BottomNavigation } from '@/components/mobile';
import { useAuthStore } from '@/store/authStore';
import { ImpersonationBanner } from '@/components/common/ImpersonationBanner';

export const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isImpersonating = useAuthStore((state) => state.isImpersonating);

  // Estado del sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persistir ultima ruta visitada para landing inteligente
  useRouteTracker();

  // Cargar perfil del User (core.User) cuando hay tenant pero no user
  // Esto cubre: recarga de página (F5), navegación directa, primer acceso
  const currentTenantId = useAuthStore((state) => state.currentTenantId);
  const user = useAuthStore((state) => state.user);
  const loadUserProfile = useAuthStore((state) => state.loadUserProfile);

  useEffect(() => {
    if (currentTenantId && !user) {
      loadUserProfile();
    }
  }, [currentTenantId, user, loadUserProfile]);

  // Auto-collapse en tablet, auto-close en mobile cuando cambia el viewport
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
      setIsSidebarCollapsed(true);
    } else if (isTablet) {
      setIsSidebarCollapsed(true);
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isTablet]);

  // Cerrar menu movil al cambiar de ruta
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Toggle sidebar (desktop/tablet: collapse, mobile: drawer)
  const handleToggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  // Cerrar drawer movil
  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Prevenir scroll del body cuando el drawer esta abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <HeaderProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Impersonation Banner — empuja todo hacia abajo cuando activo */}
        <ImpersonationBanner />

        {/* Header */}
        <Header
          onToggleSidebar={handleToggleSidebar}
          isMobileMenuOpen={isMobileMenuOpen}
          impersonationOffset={isImpersonating}
        />

        {/* Mobile Overlay */}
        {isMobile && (
          <div
            className={cn(
              'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
              isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={handleCloseMobileMenu}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          isMobile={isMobile}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={handleCloseMobileMenu}
          impersonationOffset={isImpersonating}
        />

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 min-h-screen flex flex-col',
            isImpersonating ? 'pt-[104px]' : 'pt-16',
            // En mobile: sin margen izquierdo (sidebar es overlay)
            // En tablet/desktop: margen segun estado del sidebar
            isMobile ? 'ml-0' : isSidebarCollapsed ? 'ml-16' : 'ml-64'
          )}
        >
          {/* Content Area - Padding responsive */}
          <div
            className={cn(
              'flex-1',
              // Padding responsive: menor en mobile
              'p-3 sm:p-4 md:p-6',
              // Padding inferior extra en mobile para BottomNavigation (h-16 + safe-area)
              isMobile && 'pb-20'
            )}
          >
            <Outlet />
          </div>

          {/* Footer - Oculto en mobile (BottomNav lo reemplaza) */}
          {!isMobile && <Footer />}
        </main>

        {/* Bottom Navigation - Solo visible en mobile */}
        <BottomNavigation onOpenMenu={() => setIsMobileMenuOpen(true)} />
      </div>
    </HeaderProvider>
  );
};
