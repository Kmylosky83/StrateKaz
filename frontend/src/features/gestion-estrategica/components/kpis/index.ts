/**
 * KPI Components
 * Sistema de Gestión StrateKaz - Sprint 4 - Analytics Pro Edition
 */

// Tab principal (elegir según necesidad)
export { KPIsTab } from './KPIsTab'; // Clásico con Recharts
export { KPIsTabPro } from './KPIsTabPro'; // Enterprise con todas las librerías ⭐

// Componentes básicos
export { KPIDashboard } from './KPIDashboard';
export { KPITable } from './KPITable';
export { KPIProgressChart } from './KPIProgressChart';

// Analytics Enterprise (exportar todo el módulo)
export * from './analytics';
