/**
 * Rutas: Workflow Engine (Flujos de Trabajo)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const DisenadorFlujosPage = lazy(() =>
  import('@/features/workflows').then((m) => ({ default: m.DisenadorFlujosPage }))
);
const EjecucionPage = lazy(() =>
  import('@/features/workflows').then((m) => ({ default: m.EjecucionPage }))
);
const MonitoreoPage = lazy(() =>
  import('@/features/workflows').then((m) => ({ default: m.MonitoreoPage }))
);

export const workflowsRoutes = (
  <>
    <Route path="/workflows" element={<Navigate to="/workflows/disenador" replace />} />
    <Route
      path="/workflows/disenador"
      element={withModuleGuard(DisenadorFlujosPage, 'workflow_engine')}
    />
    <Route
      path="/workflows/ejecucion"
      element={withModuleGuard(EjecucionPage, 'workflow_engine')}
    />
    <Route
      path="/workflows/monitoreo"
      element={withModuleGuard(MonitoreoPage, 'workflow_engine')}
    />
  </>
);
