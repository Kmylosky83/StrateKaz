/**
 * Rutas: Perfil de Usuario
 * Acceso universal (sin ModuleGuard)
 */
import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { withSuspense } from '../helpers';

const PerfilPage = lazy(() => import('@/features/perfil').then((m) => ({ default: m.PerfilPage })));
const SeguridadPage = lazy(() =>
  import('@/features/perfil').then((m) => ({ default: m.SeguridadPage }))
);
const PreferenciasPage = lazy(() =>
  import('@/features/perfil').then((m) => ({ default: m.PreferenciasPage }))
);

export const perfilRoutes = (
  <>
    <Route path="/perfil" element={withSuspense(PerfilPage)} />
    <Route path="/perfil/seguridad" element={withSuspense(SeguridadPage)} />
    <Route path="/perfil/preferencias" element={withSuspense(PreferenciasPage)} />
  </>
);
