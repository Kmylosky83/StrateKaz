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
