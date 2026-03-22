/**
 * Rutas: Accounting (Contabilidad)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

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
      element={withFullGuard(ConfigContablePage, 'accounting', 'config_contable')}
    />
    <Route
      path="/contabilidad/movimientos"
      element={withFullGuard(MovimientosContablesPage, 'accounting', 'movimientos')}
    />
    <Route
      path="/contabilidad/informes"
      element={withFullGuard(InformesContablesPage, 'accounting', 'informes')}
    />
    <Route
      path="/contabilidad/integracion"
      element={withFullGuard(IntegracionContablePage, 'accounting', 'integracion')}
    />
  </>
);
