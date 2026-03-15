/**
 * Rutas: Protección y Cumplimiento (módulo independiente V2)
 * Nivel 7 — Protección (HACER)
 *
 * Consolida motor_cumplimiento + motor_riesgos en un solo módulo.
 * 7 tabs: Cumplimiento Legal, Riesgos Procesos, IPEVR,
 *         Aspectos Ambientales, Riesgos Viales, Seguridad Info, SAGRILAFT
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

// ── Cumplimiento Legal ──
const MatrizLegalPage = lazy(() => import('@/features/cumplimiento/pages/MatrizLegalPage'));
const RequisitosLegalesPage = lazy(
  () => import('@/features/cumplimiento/pages/RequisitosLegalesPage')
);
const ReglamentosInternosPage = lazy(
  () => import('@/features/cumplimiento/pages/ReglamentosInternosPage')
);

// ── Riesgos ──
const RiesgosProcesosPage = lazy(() => import('@/features/riesgos/pages/RiesgosProcesosPage'));
const IPEVRPage = lazy(() => import('@/features/riesgos/pages/IPEVRPage'));
const AspectosAmbientalesPage = lazy(
  () => import('@/features/riesgos/pages/AspectosAmbientalesPage')
);
const RiesgosVialesPage = lazy(() => import('@/features/riesgos/pages/RiesgosVialesPage'));
const SeguridadInformacionPage = lazy(
  () => import('@/features/riesgos/pages/SeguridadInformacionPage')
);
const SagrilaftPteePage = lazy(() => import('@/features/riesgos/pages/SagrilaftPteePage'));

const MODULE = 'proteccion_cumplimiento';

export const proteccionCumplimientoRoutes = (
  <>
    <Route path="/proteccion" element={<Navigate to="/proteccion/cumplimiento-legal" replace />} />

    {/* Tab 1: Cumplimiento Legal */}
    <Route
      path="/proteccion/cumplimiento-legal"
      element={withModuleGuard(MatrizLegalPage, MODULE)}
    />
    <Route
      path="/proteccion/requisitos-legales"
      element={withModuleGuard(RequisitosLegalesPage, MODULE)}
    />
    <Route
      path="/proteccion/reglamentos-internos"
      element={withModuleGuard(ReglamentosInternosPage, MODULE)}
    />

    {/* Tab 2: Riesgos por Proceso */}
    <Route
      path="/proteccion/riesgos-procesos"
      element={withModuleGuard(RiesgosProcesosPage, MODULE)}
    />

    {/* Tab 3: IPEVR (GTC-45) */}
    <Route path="/proteccion/ipevr" element={withModuleGuard(IPEVRPage, MODULE)} />

    {/* Tab 4: Aspectos Ambientales */}
    <Route
      path="/proteccion/aspectos-ambientales"
      element={withModuleGuard(AspectosAmbientalesPage, MODULE)}
    />

    {/* Tab 5: Riesgos Viales */}
    <Route path="/proteccion/riesgos-viales" element={withModuleGuard(RiesgosVialesPage, MODULE)} />

    {/* Tab 6: Seguridad de la Información */}
    <Route
      path="/proteccion/seguridad-info"
      element={withModuleGuard(SeguridadInformacionPage, MODULE)}
    />

    {/* Tab 7: SAGRILAFT/PTEE */}
    <Route path="/proteccion/sagrilaft" element={withModuleGuard(SagrilaftPteePage, MODULE)} />
  </>
);
