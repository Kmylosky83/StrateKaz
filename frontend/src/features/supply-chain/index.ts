/**
 * Módulo Supply Chain - Gestión Integral de Cadena de Suministro
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Gestión integral de:
 * - Proveedores, Precios, Calidad (Pruebas Acidez) y Evaluación
 * - Programación de Abastecimiento
 * - Compras (Requisiciones, Cotizaciones, Órdenes, Contratos, Recepciones)
 * - Almacenamiento e Inventarios (Movimientos, Kardex, Alertas)
 *
 * Estructura:
 * - 20+ Catálogos dinámicos (100% configurables desde BD)
 * - 25+ Modelos principales
 * - Funcionalidades avanzadas:
 *   - Cambio de precios con historial
 *   - Pruebas de acidez con clasificación automática
 *   - Evaluación periódica con criterios ponderados
 *   - Programación de operaciones logísticas
 *   - Flujo completo de compras (Req -> Cot -> OC -> Recepción)
 *   - Control de inventarios con kardex y alertas automáticas
 */

// ==================== PAGES ====================
export { default as GestionProveedoresPage } from './pages/GestionProveedoresPage';
export { default as SupplyChainPage } from './pages/SupplyChainPage';

// ==================== TYPES ====================
export * from './types';

// ==================== API CLIENTS ====================
export * from './api';

// ==================== HOOKS ====================
export * from './hooks';

// ==================== COMPONENTS ====================
export * from './components';
