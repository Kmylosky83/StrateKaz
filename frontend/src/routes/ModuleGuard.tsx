/**
 * ModuleGuard - Protección de rutas por módulo activo
 *
 * Valida que el módulo esté habilitado (is_enabled=true) antes de renderizar.
 * Si el módulo está desactivado, muestra mensaje y redirige al dashboard.
 *
 * Sincronizado con ModuleAccessMiddleware del backend para doble protección:
 * - Backend: Middleware bloquea APIs de módulos desactivados (403)
 * - Frontend: ModuleGuard bloquea navegación a rutas de módulos desactivados
 */

import { useModuleEnabled } from '@/hooks/useModules';
import { PageLoader } from '@/components/common/PageLoader';
import { ShieldOff } from 'lucide-react';

interface ModuleGuardProps {
  moduleCode: string;
  children: React.ReactNode;
}

/**
 * Componente que protege rutas verificando que el módulo esté activo.
 *
 * @param moduleCode - Código del módulo en SystemModule (ej: 'hseq_management')
 * @param children - Contenido a renderizar si el módulo está activo
 *
 * @example
 * ```tsx
 * <Route path="/hseq/*" element={
 *   <ModuleGuard moduleCode="hseq_management">
 *     <Outlet />
 *   </ModuleGuard>
 * } />
 * ```
 */
export const ModuleGuard = ({ moduleCode, children }: ModuleGuardProps) => {
  const { isEnabled, isLoading } = useModuleEnabled(moduleCode);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isEnabled) {
    return <ModuleDisabledPage />;
  }

  return <>{children}</>;
};

/**
 * Página mostrada cuando un usuario intenta acceder a un módulo desactivado.
 * Ofrece un botón para volver al dashboard.
 */
const ModuleDisabledPage = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
      <ShieldOff className="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      Modulo no disponible
    </h2>
    <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
      Este modulo no esta activo en su empresa. Contacte al administrador para habilitarlo.
    </p>
    <a
      href="/dashboard"
      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
    >
      Volver al Dashboard
    </a>
  </div>
);
