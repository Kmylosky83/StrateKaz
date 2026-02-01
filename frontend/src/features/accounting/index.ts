/**
 * Módulo Accounting - Contabilidad (ACTIVABLE)
 *
 * Módulo opcional de contabilidad con:
 * - Configuración Contable: Plan de cuentas PUC
 * - Movimientos: Comprobantes y asientos contables
 * - Informes: Reportes financieros
 * - Integración: Conexión con otros módulos
 */

// Página Principal
export { default as AccountingPage } from './pages/AccountingPage';

// Páginas de Módulos
export { default as ConfigContablePage } from './pages/ConfigContablePage';
export { default as MovimientosContablesPage } from './pages/MovimientosContablesPage';
export { default as InformesContablesPage } from './pages/InformesContablesPage';
export { default as IntegracionContablePage } from './pages/IntegracionContablePage';

// API Clients
export * from './api';

// Types
export * from './types';

// Hooks
export * from './hooks';
