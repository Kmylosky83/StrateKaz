/**
 * Rutas: Tesorería (módulo independiente V2)
 * Nivel 11B — Soporte (HACER)
 *
 * 2 tabs: Flujo de Caja, Pagos y Dispersión
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const TesoreriaPage = lazy(() =>
  import('@/features/tesoreria').then((m) => ({ default: m.TesoreriaPage }))
);

export const tesoreriaRoutes = (
  <>
    <Route path="/tesoreria" element={<Navigate to="/tesoreria/tesoreria" replace />} />
    <Route
      path="/tesoreria/tesoreria"
      element={withFullGuard(TesoreriaPage, 'tesoreria', 'tesoreria')}
    />
    <Route path="/tesoreria/pagos" element={withFullGuard(TesoreriaPage, 'tesoreria', 'pagos')} />
  </>
);
