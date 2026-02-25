/**
 * Rutas: Admin Finance (Administracion y Finanzas)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const TesoreriaPage = lazy(() =>
  import('@/features/admin-finance').then((m) => ({ default: m.TesoreriaPage }))
);
const PresupuestoPage = lazy(() =>
  import('@/features/admin-finance').then((m) => ({ default: m.PresupuestoPage }))
);
const ActivosFijosPage = lazy(() =>
  import('@/features/admin-finance').then((m) => ({ default: m.ActivosFijosPage }))
);
const ServiciosGeneralesPage = lazy(() =>
  import('@/features/admin-finance').then((m) => ({ default: m.ServiciosGeneralesPage }))
);

export const adminFinanceRoutes = (
  <>
    <Route path="/finanzas" element={<Navigate to="/finanzas/tesoreria" replace />} />
    <Route path="/finanzas/tesoreria" element={withModuleGuard(TesoreriaPage, 'admin_finance')} />
    <Route
      path="/finanzas/presupuesto"
      element={withModuleGuard(PresupuestoPage, 'admin_finance')}
    />
    <Route
      path="/finanzas/activos-fijos"
      element={withModuleGuard(ActivosFijosPage, 'admin_finance')}
    />
    <Route
      path="/finanzas/servicios-generales"
      element={withModuleGuard(ServiciosGeneralesPage, 'admin_finance')}
    />
  </>
);
