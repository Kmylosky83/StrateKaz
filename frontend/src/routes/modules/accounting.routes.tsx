/**
 * Rutas: Accounting (Contabilidad)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const ConfigContablePage = lazy(() =>
  import('@/features/accounting').then((m) => ({ default: m.ConfigContablePage }))
);
const MovimientosContablesPage = lazy(() =>
  import('@/features/accounting').then((m) => ({ default: m.MovimientosContablesPage }))
);
const InformesContablesPage = lazy(() =>
  import('@/features/accounting').then((m) => ({ default: m.InformesContablesPage }))
);
const IntegracionContablePage = lazy(() =>
  import('@/features/accounting').then((m) => ({ default: m.IntegracionContablePage }))
);

export const accountingRoutes = (
  <>
    <Route path="/contabilidad" element={<Navigate to="/contabilidad/configuracion" replace />} />
    <Route
      path="/contabilidad/configuracion"
      element={withModuleGuard(ConfigContablePage, 'accounting')}
    />
    <Route
      path="/contabilidad/movimientos"
      element={withModuleGuard(MovimientosContablesPage, 'accounting')}
    />
    <Route
      path="/contabilidad/informes"
      element={withModuleGuard(InformesContablesPage, 'accounting')}
    />
    <Route
      path="/contabilidad/integracion"
      element={withModuleGuard(IntegracionContablePage, 'accounting')}
    />
  </>
);
