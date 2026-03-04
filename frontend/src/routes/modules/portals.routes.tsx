/**
 * Rutas: Portales ESS/MSS + Usuarios
 * Acceso universal (sin ModuleGuard, excepto Usuarios que requiere RBAC)
 */
import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { SectionGuard } from '../SectionGuard';
import { withSuspense } from '../helpers';
import { PageLoader } from '@/components/common/PageLoader';

const MiPortalPage = lazy(() =>
  import('@/features/mi-portal').then((m) => ({ default: m.MiPortalPage }))
);
const MiEquipoPage = lazy(() =>
  import('@/features/mi-equipo').then((m) => ({ default: m.MiEquipoPage }))
);
const ProveedorPortalPage = lazy(() =>
  import('@/features/proveedor-portal').then((m) => ({ default: m.ProveedorPortalPage }))
);
const ClientePortalPage = lazy(() =>
  import('@/features/cliente-portal').then((m) => ({ default: m.ClientePortalPage }))
);
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));

export const portalsRoutes = (
  <>
    <Route path="/mi-portal" element={withSuspense(MiPortalPage)} />
    <Route path="/mi-equipo" element={withSuspense(MiEquipoPage)} />
    <Route path="/proveedor-portal" element={withSuspense(ProveedorPortalPage)} />
    <Route path="/cliente-portal" element={withSuspense(ClientePortalPage)} />

    {/* Usuarios - Modulo transversal (requiere acceso RBAC) */}
    <Route
      path="/usuarios"
      element={
        <SectionGuard moduleCode="core" sectionCode="users_management">
          <Suspense fallback={<PageLoader />}>
            <UsersPage />
          </Suspense>
        </SectionGuard>
      }
    />
  </>
);
