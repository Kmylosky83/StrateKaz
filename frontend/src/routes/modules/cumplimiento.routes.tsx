/**
 * Rutas: Motor de Cumplimiento
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const MatrizLegalPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.MatrizLegalPage }))
);
const RequisitosLegalesPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.RequisitosLegalesPage }))
);
const PartesInteresadasPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.PartesInteresadasPage }))
);
const ReglamentosInternosPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.ReglamentosInternosPage }))
);

export const cumplimientoRoutes = (
  <>
    <Route path="/cumplimiento" element={<Navigate to="/cumplimiento/matriz-legal" replace />} />
    <Route
      path="/cumplimiento/matriz-legal"
      element={withModuleGuard(MatrizLegalPage, 'motor_cumplimiento')}
    />
    <Route
      path="/cumplimiento/requisitos-legales"
      element={withModuleGuard(RequisitosLegalesPage, 'motor_cumplimiento')}
    />
    <Route
      path="/cumplimiento/partes-interesadas"
      element={withModuleGuard(PartesInteresadasPage, 'motor_cumplimiento')}
    />
    <Route
      path="/cumplimiento/reglamentos-internos"
      element={withModuleGuard(ReglamentosInternosPage, 'motor_cumplimiento')}
    />
  </>
);
