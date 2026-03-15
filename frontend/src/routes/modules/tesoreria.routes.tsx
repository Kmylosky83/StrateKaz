/**
 * Rutas: Tesorería (módulo independiente V2)
 * Nivel 11B — Soporte (HACER)
 *
 * 2 tabs: Flujo de Caja, Pagos y Dispersión
 * Página en features/admin-finance/pages/ (mismo backend)
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const TesoreriaPage = lazy(() =>
  import('@/features/admin-finance').then((m) => ({ default: m.TesoreriaPage }))
);

export const tesoreriaRoutes = (
  <>
    <Route path="/tesoreria" element={<Navigate to="/tesoreria/tesoreria" replace />} />
    <Route path="/tesoreria/tesoreria" element={withModuleGuard(TesoreriaPage, 'tesoreria')} />
    <Route path="/tesoreria/pagos" element={withModuleGuard(TesoreriaPage, 'tesoreria')} />
  </>
);
