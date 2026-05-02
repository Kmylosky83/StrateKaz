/**
 * Rutas: Workflow Engine (Flujos de Trabajo)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const DisenadorFlujosPage = lazy(() =>
  import('@/features/infraestructura/workflow-engine').then((m) => ({
    default: m.DisenadorFlujosPage,
  }))
);
const EjecucionPage = lazy(() =>
  import('@/features/infraestructura/workflow-engine').then((m) => ({ default: m.EjecucionPage }))
);
const MonitoreoPage = lazy(() =>
  import('@/features/infraestructura/workflow-engine').then((m) => ({ default: m.MonitoreoPage }))
);

export const workflowEngineRoutes = (
  <>
    <Route path="/workflows" element={<Navigate to="/workflows/disenador" replace />} />
    <Route
      path="/workflows/disenador"
      element={withFullGuard(DisenadorFlujosPage, 'infra_workflow_engine', 'disenador_flujos')}
    />
    <Route
      path="/workflows/ejecucion"
      element={withFullGuard(EjecucionPage, 'infra_workflow_engine', 'ejecucion')}
    />
    <Route
      path="/workflows/monitoreo"
      element={withFullGuard(MonitoreoPage, 'infra_workflow_engine', 'monitoreo')}
    />
  </>
);
