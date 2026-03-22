/**
 * Rutas: Analytics (Analitica e Inteligencia de Negocios)
 * Capa 3 — Inteligencia (read-only)
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

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
      element={withFullGuard(ConfigIndicadoresPage, 'analytics', 'config_indicadores')}
    />
    <Route
      path="/analytics/dashboards"
      element={withFullGuard(DashboardGerencialPage, 'analytics', 'dashboard_gerencial')}
    />
    <Route
      path="/analytics/indicadores"
      element={withFullGuard(IndicadoresAreaPage, 'analytics', 'indicadores_area')}
    />
    <Route
      path="/analytics/analisis"
      element={withFullGuard(AnalisisTendenciasPage, 'analytics', 'analisis_tendencias')}
    />
    <Route
      path="/analytics/informes"
      element={withFullGuard(GeneradorInformesPage, 'analytics', 'generador_informes')}
    />
    <Route
      path="/analytics/acciones"
      element={withFullGuard(AccionesIndicadorPage, 'analytics', 'acciones_indicador')}
    />
    <Route
      path="/analytics/exportacion"
      element={withFullGuard(ExportacionPage, 'analytics', 'exportacion')}
    />
    <Route
      path="/analytics/builder"
      element={withFullGuard(DashboardBuilderPage, 'analytics', 'dashboard_builder')}
    />
    <Route path="/analytics/demo" element={withFullGuard(AnalyticsDemoPage, 'analytics', 'demo')} />
  </>
);
