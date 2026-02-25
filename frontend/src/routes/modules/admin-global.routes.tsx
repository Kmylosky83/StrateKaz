/**
 * Rutas: Admin Global (Solo Superusuarios)
 * Capa 0 — Plataforma
 */
import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { SectionGuard } from '../SectionGuard';
import { PageLoader } from '@/components/common/PageLoader';

const AdminGlobalPage = lazy(() =>
  import('@/features/admin-global').then((m) => ({ default: m.AdminGlobalPage }))
);

export const adminGlobalRoutes = (
  <Route
    path="/admin-global"
    element={
      <SectionGuard requireSuperadmin>
        <Suspense fallback={<PageLoader />}>
          <AdminGlobalPage />
        </Suspense>
      </SectionGuard>
    }
  />
);
