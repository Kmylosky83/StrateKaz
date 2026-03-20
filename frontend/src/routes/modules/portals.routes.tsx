/**
 * Rutas: Portales ESS/MSS + Usuarios
 * Acceso universal (sin ModuleGuard, excepto Usuarios que requiere RBAC)
 *
 * PORTALES DESACTIVADOS (apps apagadas):
 * - Proveedor Portal → requiere supply_chain (L50) — redirige a /mi-portal
 * - Cliente Portal → requiere sales_crm (L53) — redirige a /mi-portal
 * Se reactivan cuando se libere cada level en INSTALLED_APPS.
 */
import { lazy, Suspense } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { SectionGuard } from '../SectionGuard';
import { withSuspense } from '../helpers';
import { PageLoader } from '@/components/common/PageLoader';

const MiPortalPage = lazy(() =>
  import('@/features/mi-portal').then((m) => ({ default: m.MiPortalPage }))
);
const SSTGamePage = lazy(() =>
  import('@/features/sst-game').then((m) => ({ default: m.SSTGamePage }))
);
const MiEquipoPage = lazy(() =>
  import('@/features/mi-equipo').then((m) => ({ default: m.MiEquipoPage }))
);
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
    <Route path="/mi-portal/juego-sst" element={withSuspense(SSTGamePage)} />
    <Route path="/mi-equipo" element={withSuspense(MiEquipoPage)} />

    {/* Portales desactivados — redirect a mi-portal hasta que se libere su level */}
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
