/**
 * Analytics Feature Module
 * Business Intelligence y KPIs
 */

// Types
export * from './types';

// API
export * from './api';

// Hooks
export * from './hooks/useAnalytics';

// Pages - Semana 23
export { default as AnalyticsPage } from './pages/AnalyticsPage';
export { default as ConfigIndicadoresPage } from './pages/ConfigIndicadoresPage';
export { default as DashboardGerencialPage } from './pages/DashboardGerencialPage';
export { default as IndicadoresAreaPage } from './pages/IndicadoresAreaPage';

// Pages - Semana 24
export { default as AnalisisTendenciasPage } from './pages/AnalisisTendenciasPage';
export { default as GeneradorInformesPage } from './pages/GeneradorInformesPage';
export { default as AccionesIndicadorPage } from './pages/AccionesIndicadorPage';
export { default as ExportacionPage } from './pages/ExportacionPage';

// Pages - Sprint 10 Dashboard Builder
export { default as DashboardBuilderPage } from './pages/DashboardBuilderPage';

// Pages - Analytics Enterprise Demo
export { default as AnalyticsDemoPage } from './pages/AnalyticsDemoPage';

// Components - Analytics Charts Enterprise
export * from './components';
