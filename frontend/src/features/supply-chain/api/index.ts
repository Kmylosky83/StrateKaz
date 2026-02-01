/**
 * API Barrel Export - Gestión de Proveedores (Supply Chain)
 * Sistema de Gestión StrateKaz
 */

// ==================== CATÁLOGOS ====================
export { default as catalogosApi } from './catalogos.api';
export {
  categoriaMateriaPrimaApi,
  tipoMateriaPrimaApi,
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
export {
  unidadNegocioApi,
  proveedorApi,
  historialPrecioApi,
  condicionComercialApi,
} from './proveedores.api';

// ==================== EVALUACIONES ====================
export { default as evaluacionesApi } from './evaluaciones.api';
export {
  criterioEvaluacionApi,
  evaluacionProveedorApi,
  detalleEvaluacionApi,
} from './evaluaciones.api';

// ==================== PRUEBAS DE ACIDEZ ====================
export { default as pruebaAcidezApi } from './pruebas-acidez.api';
export { pruebaAcidezApi as pruebasAcidezApi } from './pruebas-acidez.api';

// ==================== PROGRAMACIÓN DE ABASTECIMIENTO ====================
export { default as programacionAbastecimientoApi } from './programacionApi';

// ==================== COMPRAS ====================
export { default as comprasApi } from './comprasApi';

// ==================== ALMACENAMIENTO ====================
export { default as almacenamientoApi } from './almacenamientoApi';
