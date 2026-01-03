/**
 * Types Index - Gestión de Proveedores (Supply Chain)
 * Sistema de Gestión StrateKaz
 *
 * Exporta todos los tipos del módulo de Gestión de Proveedores
 */

// ==================== RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// ==================== CATÁLOGOS DINÁMICOS ====================

export type {
  // Base
  BaseTimestamped,
  BaseCatalogo,

  // Catálogos
  CategoriaMateriaPrima,
  TipoMateriaPrima,
  TipoProveedor,
  ModalidadLogistica,
  FormaPago,
  TipoCuentaBancaria,
  TipoDocumentoIdentidad,
  Departamento,
  Ciudad,

  // DTOs Catálogos
  CreateCategoriaMateriaPrimaDTO,
  UpdateCategoriaMateriaPrimaDTO,
  CreateTipoMateriaPrimaDTO,
  UpdateTipoMateriaPrimaDTO,
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
  // Unidad de Negocio
  UnidadNegocio,
  CreateUnidadNegocioDTO,
  UpdateUnidadNegocioDTO,

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

// ==================== PRUEBAS DE ACIDEZ ====================

export type {
  // Pruebas
  PruebaAcidez,
  CreatePruebaAcidezDTO,
  UpdatePruebaAcidezDTO,

  // Simulación
  SimularPruebaAcidezDTO,
  SimularPruebaAcidezResponse,

  // Estadísticas
  EstadisticasPruebasAcidez,
} from './prueba-acidez.types';

// ==================== PROGRAMACIÓN DE ABASTECIMIENTO ====================

export type {
  // Catálogos
  TipoOperacion,
  EstadoProgramacion,
  UnidadMedida as UnidadMedidaProgramacion,
  EstadoEjecucion,
  EstadoLiquidacion,

  // Entidades
  Programacion,
  ProgramacionList,
  AsignacionRecurso,
  Ejecucion,
  Liquidacion,

  // DTOs
  CreateTipoOperacionDTO,
  UpdateTipoOperacionDTO,
  CreateEstadoProgramacionDTO,
  UpdateEstadoProgramacionDTO,
  CreateUnidadMedidaDTO as CreateUnidadMedidaProgramacionDTO,
  UpdateUnidadMedidaDTO as UpdateUnidadMedidaProgramacionDTO,
  CreateEstadoEjecucionDTO,
  UpdateEstadoEjecucionDTO,
  CreateEstadoLiquidacionDTO,
  UpdateEstadoLiquidacionDTO,
  CreateProgramacionDTO,
  UpdateProgramacionDTO,
  CreateAsignacionRecursoDTO,
  UpdateAsignacionRecursoDTO,
  CreateEjecucionDTO,
  UpdateEjecucionDTO,
  CreateLiquidacionDTO,
  UpdateLiquidacionDTO,

  // Responses
  CalendarioEvent,
  EstadisticasResponse as EstadisticasProgramacion,
} from './programacion.types';

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
  RecepcionCompra,
  RecepcionCompraList,

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
  CreateRecepcionCompraDTO,
  UpdateRecepcionCompraDTO,

  // Responses
  EstadisticasComprasResponse,
} from './compras.types';

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
