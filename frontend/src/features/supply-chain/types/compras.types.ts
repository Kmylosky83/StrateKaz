/**
 * Tipos TypeScript para Gestión de Compras - Supply Chain
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Requisiciones de compra internas
 * - Cotizaciones de proveedores
 * - Evaluación de cotizaciones
 * - Órdenes de compra
 * - Contratos con proveedores
 * - Recepción de materiales/productos
 */

// ==================== TIPOS DE CATÁLOGOS ====================

export interface EstadoRequisicion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  permite_edicion: boolean;
  es_estado_inicial: boolean;
  es_estado_final: boolean;
  color_hex?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadoCotizacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  permite_evaluacion: boolean;
  es_estado_inicial: boolean;
  es_estado_final: boolean;
  color_hex?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadoOrdenCompra {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  permite_edicion: boolean;
  permite_recepcion: boolean;
  es_estado_inicial: boolean;
  es_estado_final: boolean;
  color_hex?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoContrato {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_entregables: boolean;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrioridadRequisicion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel: number;
  color_hex?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Moneda {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  es_moneda_base: boolean;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadoContrato {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  permite_ordenes: boolean;
  color_hex?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadoMaterial {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_accion: boolean;
  color_hex?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ENTIDADES PRINCIPALES ====================

export interface Requisicion {
  id: number;
  codigo: string;
  empresa: number;
  sede: number;
  solicitante: number;
  solicitante_nombre?: string;
  area_solicitante: string;
  fecha_solicitud: string;
  fecha_requerida: string;
  justificacion: string;
  estado: number;
  estado_data?: EstadoRequisicion;
  prioridad: number;
  prioridad_data?: PrioridadRequisicion;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  observaciones?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Properties
  is_deleted?: boolean;
  esta_aprobada?: boolean;
  puede_editar?: boolean;
  tiene_cotizaciones?: boolean;
  tiene_orden_compra?: boolean;
  detalles?: DetalleRequisicion[];
}

export interface RequisicionList {
  id: number;
  codigo: string;
  area_solicitante: string;
  fecha_solicitud: string;
  fecha_requerida: string;
  estado_data?: EstadoRequisicion;
  prioridad_data?: PrioridadRequisicion;
  esta_aprobada?: boolean;
  created_at: string;
}

export interface DetalleRequisicion {
  id: number;
  requisicion: number;
  producto_servicio: string;
  descripcion: string;
  cantidad: number;
  unidad_medida: string;
  especificaciones?: string;
  precio_estimado?: number;
  created_at: string;
  updated_at: string;
  // Properties
  valor_estimado_total?: number;
}

export interface Cotizacion {
  id: number;
  requisicion?: number;
  requisicion_codigo?: string;
  proveedor: number;
  proveedor_nombre?: string;
  numero_cotizacion: string;
  fecha_cotizacion: string;
  fecha_vencimiento: string;
  moneda: number;
  moneda_data?: Moneda;
  subtotal: number;
  impuestos: number;
  total: number;
  tiempo_entrega_dias: number;
  condiciones_pago: string;
  archivo_cotizacion?: string;
  estado: number;
  estado_data?: EstadoCotizacion;
  observaciones?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Properties
  is_deleted?: boolean;
  esta_vigente?: boolean;
  tiene_evaluacion?: boolean;
  puede_evaluar?: boolean;
  evaluacion?: EvaluacionCotizacion;
}

export interface CotizacionList {
  id: number;
  numero_cotizacion: string;
  proveedor_nombre?: string;
  fecha_cotizacion: string;
  fecha_vencimiento: string;
  total: number;
  estado_data?: EstadoCotizacion;
  esta_vigente?: boolean;
  tiene_evaluacion?: boolean;
  created_at: string;
}

export interface EvaluacionCotizacion {
  id: number;
  cotizacion: number;
  cotizacion_numero?: string;
  evaluado_por: number;
  evaluado_por_nombre?: string;
  fecha_evaluacion: string;
  criterios_evaluacion: Record<string, any>;
  puntaje_total: number;
  recomendacion: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface OrdenCompra {
  id: number;
  numero_orden: string;
  empresa: number;
  sede: number;
  requisicion?: number;
  requisicion_codigo?: string;
  cotizacion?: number;
  cotizacion_numero?: string;
  proveedor: number;
  proveedor_nombre?: string;
  fecha_orden: string;
  fecha_entrega_esperada: string;
  estado: number;
  estado_data?: EstadoOrdenCompra;
  moneda: number;
  moneda_data?: Moneda;
  subtotal: number;
  impuestos: number;
  descuento: number;
  total: number;
  condiciones_pago: string;
  lugar_entrega: string;
  creado_por: number;
  creado_por_nombre?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Properties
  is_deleted?: boolean;
  esta_aprobada?: boolean;
  puede_editar?: boolean;
  puede_recibir?: boolean;
  tiene_recepciones?: boolean;
  porcentaje_recibido?: number;
  detalles?: DetalleOrdenCompra[];
}

export interface OrdenCompraList {
  id: number;
  numero_orden: string;
  proveedor_nombre?: string;
  fecha_orden: string;
  fecha_entrega_esperada: string;
  total: number;
  estado_data?: EstadoOrdenCompra;
  esta_aprobada?: boolean;
  porcentaje_recibido?: number;
  created_at: string;
}

export interface DetalleOrdenCompra {
  id: number;
  orden_compra: number;
  producto_servicio: string;
  descripcion: string;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  unidad_medida: string;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  // Properties
  cantidad_pendiente?: number;
  porcentaje_recibido?: number;
  esta_completo?: boolean;
}

export interface Contrato {
  id: number;
  empresa: number;
  proveedor: number;
  proveedor_nombre?: string;
  tipo_contrato: number;
  tipo_contrato_data?: TipoContrato;
  numero_contrato: string;
  objeto: string;
  fecha_inicio: string;
  fecha_fin: string;
  valor_total: number;
  moneda: number;
  moneda_data?: Moneda;
  condiciones: string;
  archivo_contrato?: string;
  estado: number;
  estado_data?: EstadoContrato;
  responsable: number;
  responsable_nombre?: string;
  observaciones?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Properties
  is_deleted?: boolean;
  esta_vigente?: boolean;
  dias_restantes?: number;
  puede_generar_ordenes?: boolean;
}

export interface ContratoList {
  id: number;
  numero_contrato: string;
  proveedor_nombre?: string;
  tipo_contrato_data?: TipoContrato;
  fecha_inicio: string;
  fecha_fin: string;
  valor_total: number;
  estado_data?: EstadoContrato;
  esta_vigente?: boolean;
  dias_restantes?: number;
  created_at: string;
}

export interface RecepcionCompra {
  id: number;
  orden_compra: number;
  orden_compra_numero?: string;
  numero_remision: string;
  fecha_recepcion: string;
  recibido_por: number;
  recibido_por_nombre?: string;
  cantidad_recibida: number;
  estado_material: number;
  estado_material_data?: EstadoMaterial;
  observaciones?: string;
  genera_movimiento_inventario: boolean;
  numero_movimiento_inventario?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Properties
  is_deleted?: boolean;
  material_conforme?: boolean;
  requiere_accion?: boolean;
}

export interface RecepcionCompraList {
  id: number;
  numero_remision: string;
  orden_compra_numero?: string;
  fecha_recepcion: string;
  cantidad_recibida: number;
  estado_material_data?: EstadoMaterial;
  material_conforme?: boolean;
  created_at: string;
}

// ==================== DTOs - CREATE ====================

export interface CreateEstadoRequisicionDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  permite_edicion?: boolean;
  es_estado_inicial?: boolean;
  es_estado_final?: boolean;
  color_hex?: string;
  orden?: number;
}

export interface CreateRequisicionDTO {
  sede: number;
  area_solicitante: string;
  fecha_requerida: string;
  justificacion: string;
  prioridad: number;
  observaciones?: string;
  detalles?: CreateDetalleRequisicionDTO[];
}

export interface CreateDetalleRequisicionDTO {
  producto_servicio: string;
  descripcion: string;
  cantidad: number;
  unidad_medida: string;
  especificaciones?: string;
  precio_estimado?: number;
}

export interface CreateCotizacionDTO {
  requisicion?: number;
  proveedor: number;
  numero_cotizacion: string;
  fecha_cotizacion: string;
  fecha_vencimiento: string;
  moneda: number;
  subtotal: number;
  impuestos?: number;
  tiempo_entrega_dias: number;
  condiciones_pago: string;
  observaciones?: string;
}

export interface CreateEvaluacionCotizacionDTO {
  cotizacion: number;
  criterios_evaluacion: Record<string, any>;
  recomendacion: string;
  observaciones?: string;
}

export interface CreateOrdenCompraDTO {
  sede: number;
  requisicion?: number;
  cotizacion?: number;
  proveedor: number;
  fecha_entrega_esperada: string;
  moneda: number;
  condiciones_pago: string;
  lugar_entrega: string;
  observaciones?: string;
  detalles: CreateDetalleOrdenCompraDTO[];
}

export interface CreateDetalleOrdenCompraDTO {
  producto_servicio: string;
  descripcion: string;
  cantidad_solicitada: number;
  unidad_medida: string;
  precio_unitario: number;
}

export interface CreateContratoDTO {
  proveedor: number;
  tipo_contrato: number;
  numero_contrato: string;
  objeto: string;
  fecha_inicio: string;
  fecha_fin: string;
  valor_total: number;
  moneda: number;
  condiciones: string;
  responsable: number;
  observaciones?: string;
}

export interface CreateRecepcionCompraDTO {
  orden_compra: number;
  numero_remision: string;
  fecha_recepcion: string;
  cantidad_recibida: number;
  estado_material: number;
  observaciones?: string;
  genera_movimiento_inventario?: boolean;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateRequisicionDTO extends Partial<CreateRequisicionDTO> {
  estado?: number;
}

export interface UpdateCotizacionDTO extends Partial<CreateCotizacionDTO> {
  estado?: number;
}

export interface UpdateOrdenCompraDTO extends Partial<CreateOrdenCompraDTO> {
  estado?: number;
}

export interface UpdateContratoDTO extends Partial<CreateContratoDTO> {
  estado?: number;
}

export type UpdateRecepcionCompraDTO = Partial<CreateRecepcionCompraDTO>;

// ==================== RESPONSE TYPES ====================

// PaginatedResponse: importar desde '@/types'

export interface EstadisticasComprasResponse {
  total_requisiciones: number;
  requisiciones_pendientes: number;
  requisiciones_aprobadas: number;
  total_cotizaciones: number;
  cotizaciones_vigentes: number;
  total_ordenes_compra: number;
  ordenes_pendientes: number;
  ordenes_aprobadas: number;
  valor_total_ordenes: number;
  total_contratos: number;
  contratos_vigentes: number;
  contratos_por_vencer: number;
  total_recepciones: number;
  recepciones_conformes: number;
  recepciones_no_conformes: number;
}
