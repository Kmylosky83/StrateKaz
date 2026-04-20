/**
 * API Barrel Export - Gestión de Proveedores (Supply Chain)
 * Sistema de Gestión StrateKaz
 */

// ==================== CATÁLOGOS ====================
export { default as catalogosApi } from './catalogos.api';
export {
  tipoProveedorApi,
  modalidadLogisticaApi,
  formaPagoApi,
  tipoCuentaBancariaApi,
  tipoDocumentoIdentidadApi,
  departamentoApi,
  ciudadApi,
} from './catalogos.api';

// ==================== PROVEEDORES ====================
export { default as proveedoresApi } from './proveedores.api';
export { proveedorApi, historialPrecioApi, condicionComercialApi } from './proveedores.api';

// ==================== EVALUACIONES ====================
export { default as evaluacionesApi } from './evaluaciones.api';
export {
  criterioEvaluacionApi,
  evaluacionProveedorApi,
  detalleEvaluacionApi,
} from './evaluaciones.api';

// NOTA: Pruebas de Acidez → migradas a Production Ops (features/production-ops/api/)

// ==================== COMPRAS ====================
export { default as comprasApi } from './comprasApi';

// ==================== ALMACENAMIENTO ====================
export { default as almacenamientoApi } from './almacenamientoApi';
