/**
 * Rutas: Motor de Riesgos
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const RiesgosProcesosPage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.RiesgosProcesosPage }))
);
const IPEVRPage = lazy(() => import('@/features/riesgos').then((m) => ({ default: m.IPEVRPage })));
const AspectosAmbientalesPage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.AspectosAmbientalesPage }))
);
const RiesgosVialesPage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.RiesgosVialesPage }))
);
const SagrilaftPteePage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.SagrilaftPteePage }))
);
const SeguridadInformacionPage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.SeguridadInformacionPage }))
);

export const riesgosRoutes = (
  <>
    <Route path="/riesgos" element={<Navigate to="/riesgos/procesos" replace />} />
    <Route
      path="/riesgos/procesos"
      element={withModuleGuard(RiesgosProcesosPage, 'motor_riesgos')}
    />
    <Route path="/riesgos/ipevr" element={withModuleGuard(IPEVRPage, 'motor_riesgos')} />
    <Route
      path="/riesgos/ambientales"
      element={withModuleGuard(AspectosAmbientalesPage, 'motor_riesgos')}
    />
    <Route path="/riesgos/viales" element={withModuleGuard(RiesgosVialesPage, 'motor_riesgos')} />
    <Route
      path="/riesgos/sagrilaft"
      element={withModuleGuard(SagrilaftPteePage, 'motor_riesgos')}
    />
    <Route
      path="/riesgos/seguridad-info"
      element={withModuleGuard(SeguridadInformacionPage, 'motor_riesgos')}
    />
  </>
);
