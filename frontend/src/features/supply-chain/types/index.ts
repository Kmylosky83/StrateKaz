/**
 * Types Index - Gestión de Proveedores (Supply Chain)
 * Sistema de Gestión StrateKaz
 *
 * Exporta todos los tipos del módulo de Gestión de Proveedores
 */

// ==================== RESPONSE TYPES ====================
import { PaginatedResponse, ApiResponse } from '@/types';
export type { PaginatedResponse, ApiResponse };

// ==================== CATÁLOGOS DINÁMICOS ====================

export type {
  // Base
  BaseTimestamped,
  BaseCatalogo,

  // Catálogos
  TipoProveedor,
  ModalidadLogistica,
  FormaPago,
  TipoCuentaBancaria,
  TipoDocumentoIdentidad,
  Departamento,
  Ciudad,

  // DTOs Catálogos
  CreateTipoProveedorDTO,
  UpdateTipoProveedorDTO,
  CreateModalidadLogisticaDTO,
  UpdateModalidadLogisticaDTO,
  CreateFormaPagoDTO,
  UpdateFormaPagoDTO,
  CreateTipoCuentaBancariaDTO,
  UpdateTipoCuentaBancariaDTO,
  CreateTipoDocumentoIdentidadDTO,
  UpdateTipoDocumentoIdentidadDTO,
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO,
  CreateCiudadDTO,
  UpdateCiudadDTO,
} from './catalogos.types';

// ==================== PROVEEDORES Y PRECIOS ====================

export type {
  // Proveedor
  Proveedor,
  ProveedorList,
  CreateProveedorDTO,
  UpdateProveedorDTO,

  // Precios
  PrecioMateriaPrima,
  HistorialPrecioProveedor,
  CambiarPrecioDTO,

  // Condiciones Comerciales
  CondicionComercialProveedor,
  CreateCondicionComercialDTO,
  UpdateCondicionComercialDTO,

  // Estadísticas
  EstadisticasProveedores,
} from './proveedor.types';

// ==================== EVALUACIÓN ====================

export type {
  // Criterios
  CriterioEvaluacion,
  CreateCriterioEvaluacionDTO,
  UpdateCriterioEvaluacionDTO,

  // Evaluaciones
  EvaluacionProveedor,
  DetalleEvaluacion,
  CreateEvaluacionProveedorDTO,
  UpdateEvaluacionProveedorDTO,
  AprobarEvaluacionDTO,

  // Estadísticas
  EstadisticasEvaluacion,
} from './evaluacion.types';

// NOTA: Pruebas de Acidez → migradas a Production Ops (features/production-ops/types/)

// ==================== COMPRAS ====================

export type {
  // Catálogos
  EstadoRequisicion,
  EstadoCotizacion,
  EstadoOrdenCompra,
  TipoContrato,
  PrioridadRequisicion,
  Moneda,
  EstadoContrato,
  EstadoMaterial,

  // Entidades
  Requisicion,
  RequisicionList,
  DetalleRequisicion,
  Cotizacion,
  CotizacionList,
  EvaluacionCotizacion,
  OrdenCompra,
  OrdenCompraList,
  DetalleOrdenCompra,
  Contrato,
  ContratoList,
  // Nota: RecepcionCompra/RecepcionCompraList eliminadas en S3.

  // DTOs
  CreateEstadoRequisicionDTO,
  CreateRequisicionDTO,
  UpdateRequisicionDTO,
  CreateDetalleRequisicionDTO,
  CreateCotizacionDTO,
  UpdateCotizacionDTO,
  CreateEvaluacionCotizacionDTO,
  CreateOrdenCompraDTO,
  UpdateOrdenCompraDTO,
  CreateDetalleOrdenCompraDTO,
  CreateContratoDTO,
  UpdateContratoDTO,

  // Responses
  EstadisticasComprasResponse,
} from './compras.types';

// S3: Recepcion + Liquidaciones
export * from './recepcion.types';
export * from './liquidaciones.types';

// Fase 1 QC (Agent A)
export * from './calidad.types';

// Fase 1 Inventario/Dashboard (Agent B)
export * from './inventario.types';

// ==================== ALMACENES (catálogo CT, H-SC-07) ====================

export type {
  Almacen,
  AlmacenList,
  CreateAlmacenDTO,
  UpdateAlmacenDTO,
  AlmacenesFilterParams,
} from './almacenes.types';

// ==================== RUTAS DE RECOLECCIÓN (catálogo CT, H-SC-10) ====================

export type {
  RutaRecoleccion,
  RutaRecoleccionList,
  CreateRutaDTO,
  UpdateRutaDTO,
  RutasFilterParams,
} from './rutas.types';

// ==================== ALMACENAMIENTO ====================

export type {
  // Tipos y Enums
  AfectacionStock,
  PrioridadAlerta,
  TipoProducto,
  TipoMedida,
  CriticidadAlerta,

  // Catálogos
  TipoMovimientoInventario,
  EstadoInventario,
  TipoAlerta,
  UnidadMedida as UnidadMedidaAlmacenamiento,

  // Entidades
  Inventario,
  InventarioList,
  MovimientoInventario,
  MovimientoInventarioList,
  Kardex,
  KardexList,
  AlertaStock,
  AlertaStockList,
  ConfiguracionStock,
  ConfiguracionStockList,

  // DTOs
  CreateTipoMovimientoInventarioDTO,
  CreateEstadoInventarioDTO,
  CreateTipoAlertaDTO,
  CreateUnidadMedidaDTO as CreateUnidadMedidaAlmacenamientoDTO,
  CreateInventarioDTO,
  UpdateInventarioDTO,
  CreateMovimientoInventarioDTO,
  UpdateMovimientoInventarioDTO,
  CreateAlertaStockDTO,
  CreateConfiguracionStockDTO,
  UpdateConfiguracionStockDTO,

  // Responses
  EstadisticasAlmacenamientoResponse,
  ConsultaKardexParams,
  KardexResponse,
} from './almacenamiento.types';
