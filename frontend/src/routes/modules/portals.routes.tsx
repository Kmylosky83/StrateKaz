/**
 * Rutas: Portales ESS/MSS + Usuarios
 * Acceso universal (sin ModuleGuard, excepto Usuarios que requiere RBAC)
 *
 * PORTALES EXTERNOS:
 * - Proveedor Portal → redirige a /mi-portal (PortalProveedorView se muestra auto)
 * - Cliente Portal → redirige a /mi-portal (PortalClienteView se muestra auto)
 * La detección interna en MiPortalPage distingue proveedor/cliente por user.proveedor/cliente.
 */
import { lazy, Suspense } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { SectionGuard } from '../SectionGuard';
import { withSuspense } from '../helpers';
import { PageLoader } from '@/components/common/PageLoader';

const MiPortalPage = lazy(() =>
  import('@/features/mi-portal').then((m) => ({ default: m.MiPortalPage }))
);
// Juego SST desactivado — requiere refactor completo
// const SSTGamePage = lazy(() =>
//   import('@/features/sst-game').then((m) => ({ default: m.SSTGamePage }))
// );
// MiEquipoPage (MSS jefe) ELIMINADO — ahora es JefePortalSection dentro de Mi Portal.
// El módulo RRHH "Gestión de Personas" se sirve desde mi-equipo.routes.tsx.
// Portales desactivados — se reactivan con su level
// const ProveedorPortalPage = lazy(() =>
//   import('@/features/proveedor-portal').then((m) => ({ default: m.ProveedorPortalPage }))
// );
// const ClientePortalPage = lazy(() =>
//   import('@/features/cliente-portal').then((m) => ({ default: m.ClientePortalPage }))
// );
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));

export const portalsRoutes = (
  <>
    <Route path="/mi-portal" element={withSuspense(MiPortalPage)} />
    {/* Juego SST desactivado — requiere refactor completo */}
    {/* <Route path="/mi-portal/juego-sst" element={withSuspense(SSTGamePage)} /> */}
    {/* MiEquipoPage MSS eliminado — equipo del jefe vive en Mi Portal */}

    {/* Portales externos — redirigen a mi-portal donde la detección interna
        muestra PortalProveedorView o PortalClienteView según user.proveedor/cliente */}
    <Route path="/proveedor-portal" element={<Navigate to="/mi-portal" replace />} />
    <Route path="/cliente-portal" element={<Navigate to="/mi-portal" replace />} />

    {/* Usuarios - Modulo transversal (requiere acceso RBAC) */}
    <Route
      path="/usuarios"
      element={
        <SectionGuard moduleCode="core" sectionCode="usuarios">
          <Suspense fallback={<PageLoader />}>
            <UsersPage />
          </Suspense>
        </SectionGuard>
      }
    />
  </>
);
