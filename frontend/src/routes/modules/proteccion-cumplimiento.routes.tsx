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
import { withFullGuard } from '../helpers';

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
      element={withFullGuard(MatrizLegalPage, MODULE, 'cumplimiento_legal')}
    />
    <Route
      path="/proteccion/requisitos-legales"
      element={withFullGuard(RequisitosLegalesPage, MODULE, 'requisitos_legales')}
    />
    <Route
      path="/proteccion/reglamentos-internos"
      element={withFullGuard(ReglamentosInternosPage, MODULE, 'reglamentos_internos')}
    />

    {/* Tab 2: Riesgos por Proceso */}
    <Route
      path="/proteccion/riesgos-procesos"
      element={withFullGuard(RiesgosProcesosPage, MODULE, 'riesgos_procesos')}
    />

    {/* Tab 3: IPEVR (GTC-45) */}
    <Route path="/proteccion/ipevr" element={withFullGuard(IPEVRPage, MODULE, 'ipevr')} />

    {/* Tab 4: Aspectos Ambientales */}
    <Route
      path="/proteccion/aspectos-ambientales"
      element={withFullGuard(AspectosAmbientalesPage, MODULE, 'aspectos_ambientales')}
    />

    {/* Tab 5: Riesgos Viales */}
    <Route
      path="/proteccion/riesgos-viales"
      element={withFullGuard(RiesgosVialesPage, MODULE, 'riesgos_viales')}
    />

    {/* Tab 6: Seguridad de la Información */}
    <Route
      path="/proteccion/seguridad-info"
      element={withFullGuard(SeguridadInformacionPage, MODULE, 'seguridad_informacion')}
    />

    {/* Tab 7: SAGRILAFT/PTEE */}
    <Route
      path="/proteccion/sagrilaft"
      element={withFullGuard(SagrilaftPteePage, MODULE, 'sagrilaft')}
    />
  </>
);
