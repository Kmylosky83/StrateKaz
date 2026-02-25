/**
 * Rutas: Analytics (Analitica e Inteligencia de Negocios)
 * Capa 3 — Inteligencia (read-only)
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const ConfigIndicadoresPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.ConfigIndicadoresPage }))
);
const DashboardGerencialPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.DashboardGerencialPage }))
);
const IndicadoresAreaPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.IndicadoresAreaPage }))
);
const AnalisisTendenciasPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.AnalisisTendenciasPage }))
);
const GeneradorInformesPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.GeneradorInformesPage }))
);
const AccionesIndicadorPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.AccionesIndicadorPage }))
);
const ExportacionPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.ExportacionPage }))
);
const AnalyticsDemoPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.AnalyticsDemoPage }))
);
const DashboardBuilderPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.DashboardBuilderPage }))
);

export const analyticsRoutes = (
  <>
    <Route path="/analytics" element={<Navigate to="/analytics/configuracion" replace />} />
    <Route
      path="/analytics/configuracion"
      element={withModuleGuard(ConfigIndicadoresPage, 'analytics')}
    />
    <Route
      path="/analytics/dashboards"
      element={withModuleGuard(DashboardGerencialPage, 'analytics')}
    />
    <Route
      path="/analytics/indicadores"
      element={withModuleGuard(IndicadoresAreaPage, 'analytics')}
    />
    <Route
      path="/analytics/analisis"
      element={withModuleGuard(AnalisisTendenciasPage, 'analytics')}
    />
    <Route
      path="/analytics/informes"
      element={withModuleGuard(GeneradorInformesPage, 'analytics')}
    />
    <Route
      path="/analytics/acciones"
      element={withModuleGuard(AccionesIndicadorPage, 'analytics')}
    />
    <Route path="/analytics/exportacion" element={withModuleGuard(ExportacionPage, 'analytics')} />
    <Route path="/analytics/builder" element={withModuleGuard(DashboardBuilderPage, 'analytics')} />
    <Route path="/analytics/demo" element={withModuleGuard(AnalyticsDemoPage, 'analytics')} />
  </>
);
