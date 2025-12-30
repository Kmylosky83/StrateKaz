/**
 * Módulo Admin Finance - Administración Financiera
 *
 * Sistema de gestión administrativa y financiera:
 * - Tesorería: Cuentas bancarias, movimientos, flujo de caja
 * - Presupuesto: Control presupuestal y seguimiento
 * - Activos Fijos: Inventario de activos y depreciaciones
 * - Servicios Generales: Control de gastos operativos
 */

// Página Principal
export { default as AdminFinancePage } from './pages/AdminFinancePage';

// Páginas de Módulos
export { default as TesoreriaPage } from './pages/TesoreriaPage';
export { default as PresupuestoPage } from './pages/PresupuestoPage';
export { default as ActivosFijosPage } from './pages/ActivosFijosPage';
export { default as ServiciosGeneralesPage } from './pages/ServiciosGeneralesPage';

// API Clients
export * from './api';

// Types
export * from './types';

// Hooks
export * from './hooks';
