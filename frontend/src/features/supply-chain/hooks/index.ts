/**
 * Hooks Barrel Export - Gestión de Proveedores (Supply Chain)
 * Sistema de Gestión StrateKaz
 */

// ==================== CATÁLOGOS ====================
export * from './useCatalogos';

// ==================== PROVEEDORES ====================
export * from './useProveedores';

// ==================== EVALUACIONES ====================
export * from './useEvaluaciones';

// NOTA: Pruebas de Acidez → migradas a Production Ops (features/production-ops/hooks/)

// ==================== COMPRAS ====================
export * from './useCompras';

// ==================== ALMACENAMIENTO ====================
export * from './useAlmacenamiento';

// ==================== RECEPCION (S3) ====================
export * from './useRecepcion';

// ==================== LIQUIDACIONES (S3) ====================
export * from './useLiquidaciones';

// ==================== TIPOS ALMACÉN (S3 — catálogo silo/contenedor/pallet/piso) ====================
export * from './useTiposAlmacen';

// ==================== ALMACENES (H-SC-07 — almacenes físicos por sede) ====================
export * from './useAlmacenes';

// ==================== RUTAS DE RECOLECCIÓN (H-SC-10) ====================
export * from './useRutas';

// ==================== QC (Fase 1 — Agent A) ====================
export * from './useParametrosCalidad';
export * from './useRangosCalidad';
export * from './useMedicionesCalidad';

// ==================== INVENTARIO / DASHBOARD (Fase 1 — Agent B) ====================
export * from './useInventario';
