/**
 * Rutas: Mi Portal (empleado interno) + Usuarios
 *
 * Mi Portal es el único portal LIVE hoy. Los portales externos (proveedores,
 * clientes, vacantes) se construirán como apps separadas bajo apps/portales/
 * cuando se defina el patrón de acceso externo (H-PORTAL-02).
 */
import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { SectionGuard } from '../SectionGuard';
import { withSuspense } from '../helpers';
import { PageLoader } from '@/components/common/PageLoader';

const MiPortalPage = lazy(() =>
  import('@/features/mi-portal').then((m) => ({ default: m.MiPortalPage }))
);
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));

export const portalsRoutes = (
  <>
    <Route path="/mi-portal" element={withSuspense(MiPortalPage)} />

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
