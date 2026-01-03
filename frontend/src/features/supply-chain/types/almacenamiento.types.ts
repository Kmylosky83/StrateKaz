/**
 * Tipos TypeScript para Gestión de Almacenamiento e Inventario - Supply Chain
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Inventario - Stock actual por almacén/producto
 * - Movimientos de Inventario
 * - Kardex - Vista consolidada de movimientos
 * - Alertas de Stock automáticas
 * - Configuración de Stock por producto/almacén
 */

// ==================== TIPOS Y ENUMS ====================

export type AfectacionStock = 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
export type PrioridadAlerta = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type TipoProducto = 'MATERIA_PRIMA' | 'PRODUCTO_TERMINADO' | 'PRODUCTO_PROCESO' | 'INSUMO' | 'REPUESTO';
export type TipoMedida = 'PESO' | 'VOLUMEN' | 'LONGITUD' | 'UNIDAD' | 'OTRO';
export type CriticidadAlerta = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

// ==================== TIPOS DE CATÁLOGOS ====================

export interface TipoMovimientoInventario {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  afecta_stock: AfectacionStock;
  requiere_origen: boolean;
  requiere_destino: boolean;
  requiere_documento: boolean;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Properties
  signo_afectacion?: string;
}

export interface EstadoInventario {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  permite_uso: boolean;
  color_hex: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoAlerta {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  prioridad: PrioridadAlerta;
  color_hex: string;
  dias_anticipacion: number;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadMedida {
  id: number;
  codigo: string;
  nombre: string;
  abreviatura: string;
  tipo: TipoMedida;
  factor_conversion_base: number;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ENTIDADES PRINCIPALES ====================

export interface Inventario {
  id: number;
  empresa: number;
  almacen: number;
  almacen_nombre?: string;
  producto_codigo: string;
  producto_nombre: string;
  producto_tipo: TipoProducto;
  lote?: string;
  fecha_vencimiento?: string;
  fecha_ingreso: string;
  cantidad_disponible: number;
  cantidad_reservada: number;
  cantidad_en_transito: number;
  unidad_medida: number;
  unidad_medida_data?: UnidadMedida;
  costo_unitario: number;
  costo_promedio: number;
  valor_total: number;
  estado: number;
  estado_data?: EstadoInventario;
  ubicacion_fisica?: string;
  zona?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  // Properties
  cantidad_total?: number;
  esta_vencido?: boolean;
  dias_para_vencer?: number;
}

export interface InventarioList {
  id: number;
  almacen_nombre?: string;
  producto_codigo: string;
  producto_nombre: string;
  lote?: string;
  cantidad_disponible: number;
  cantidad_total?: number;
  unidad_medida_data?: UnidadMedida;
  estado_data?: EstadoInventario;
  fecha_vencimiento?: string;
  dias_para_vencer?: number;
  valor_total: number;
  created_at: string;
}

export interface MovimientoInventario {
  id: number;
  empresa: number;
  almacen_origen?: number;
  almacen_origen_nombre?: string;
  almacen_destino?: number;
  almacen_destino_nombre?: string;
  codigo: string;
  tipo_movimiento: number;
  tipo_movimiento_data?: TipoMovimientoInventario;
  fecha_movimiento: string;
  producto_codigo: string;
  producto_nombre: string;
  lote?: string;
  cantidad: number;
  unidad_medida: number;
  unidad_medida_data?: UnidadMedida;
  costo_unitario: number;
  costo_total: number;
  documento_referencia?: string;
  origen_tipo?: string;
  origen_id?: number;
  observaciones?: string;
  registrado_por: number;
  registrado_por_nombre?: string;
  created_at: string;
}

export interface MovimientoInventarioList {
  id: number;
  codigo: string;
  tipo_movimiento_data?: TipoMovimientoInventario;
  producto_nombre: string;
  fecha_movimiento: string;
  cantidad: number;
  unidad_medida_data?: UnidadMedida;
  almacen_destino_nombre?: string;
  created_at: string;
}

export interface Kardex {
  id: number;
  inventario: number;
  movimiento: number;
  fecha: string;
  cantidad_entrada: number;
  cantidad_salida: number;
  saldo_cantidad: number;
  costo_entrada: number;
  costo_salida: number;
  saldo_costo: number;
  costo_unitario: number;
  created_at: string;
}

export interface KardexList extends Kardex {
  producto_nombre?: string;
  tipo_movimiento?: string;
  documento_referencia?: string;
}

export interface AlertaStock {
  id: number;
  empresa: number;
  almacen: number;
  almacen_nombre?: string;
  inventario: number;
  inventario_data?: Inventario;
  tipo_alerta: number;
  tipo_alerta_data?: TipoAlerta;
  fecha_generacion: string;
  fecha_lectura?: string;
  fecha_resolucion?: string;
  mensaje: string;
  criticidad: CriticidadAlerta;
  leida: boolean;
  resuelta: boolean;
  resuelta_por?: number;
  resuelta_por_nombre?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertaStockList {
  id: number;
  almacen_nombre?: string;
  tipo_alerta_data?: TipoAlerta;
  mensaje: string;
  criticidad: CriticidadAlerta;
  fecha_generacion: string;
  leida: boolean;
  resuelta: boolean;
  created_at: string;
}

export interface ConfiguracionStock {
  id: number;
  empresa: number;
  almacen: number;
  almacen_nombre?: string;
  producto_codigo: string;
  producto_nombre: string;
  stock_minimo: number;
  stock_maximo: number;
  punto_reorden: number;
  dias_alerta_vencimiento: number;
  lead_time_dias: number;
  cantidad_economica_pedido?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Properties
  requiere_reorden?: boolean;
}

export interface ConfiguracionStockList {
  id: number;
  almacen_nombre?: string;
  producto_codigo: string;
  producto_nombre: string;
  stock_minimo: number;
  stock_maximo: number;
  punto_reorden: number;
  requiere_reorden?: boolean;
  activo: boolean;
  created_at: string;
}

// ==================== DTOs - CREATE ====================

export interface CreateTipoMovimientoInventarioDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  afecta_stock?: AfectacionStock;
  requiere_origen?: boolean;
  requiere_destino?: boolean;
  requiere_documento?: boolean;
  orden?: number;
}

export interface CreateEstadoInventarioDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  permite_uso?: boolean;
  color_hex?: string;
  orden?: number;
}

export interface CreateTipoAlertaDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  prioridad?: PrioridadAlerta;
  color_hex?: string;
  dias_anticipacion?: number;
  orden?: number;
}

export interface CreateUnidadMedidaDTO {
  codigo: string;
  nombre: string;
  abreviatura: string;
  tipo?: TipoMedida;
  factor_conversion_base?: number;
  orden?: number;
}

export interface CreateInventarioDTO {
  almacen: number;
  producto_codigo: string;
  producto_nombre: string;
  producto_tipo?: TipoProducto;
  lote?: string;
  fecha_vencimiento?: string;
  cantidad_disponible: number;
  unidad_medida: number;
  costo_unitario: number;
  estado: number;
  ubicacion_fisica?: string;
  zona?: string;
  observaciones?: string;
}

export interface CreateMovimientoInventarioDTO {
  almacen_origen?: number;
  almacen_destino?: number;
  tipo_movimiento: number;
  fecha_movimiento?: string;
  producto_codigo: string;
  producto_nombre: string;
  lote?: string;
  cantidad: number;
  unidad_medida: number;
  costo_unitario: number;
  documento_referencia?: string;
  origen_tipo?: string;
  origen_id?: number;
  observaciones?: string;
}

export interface CreateAlertaStockDTO {
  almacen: number;
  inventario: number;
  tipo_alerta: number;
  mensaje: string;
  criticidad?: CriticidadAlerta;
}

export interface CreateConfiguracionStockDTO {
  almacen: number;
  producto_codigo: string;
  producto_nombre: string;
  stock_minimo: number;
  stock_maximo: number;
  punto_reorden: number;
  dias_alerta_vencimiento?: number;
  lead_time_dias?: number;
  cantidad_economica_pedido?: number;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateInventarioDTO extends Partial<CreateInventarioDTO> {}
export interface UpdateMovimientoInventarioDTO extends Partial<CreateMovimientoInventarioDTO> {}
export interface UpdateConfiguracionStockDTO extends Partial<CreateConfiguracionStockDTO> {
  activo?: boolean;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface EstadisticasAlmacenamientoResponse {
  total_productos: number;
  valor_total_inventario: number;
  productos_stock_bajo: number;
  productos_stock_critico: number;
  productos_por_vencer: number;
  productos_vencidos: number;
  total_movimientos_mes: number;
  total_entradas_mes: number;
  total_salidas_mes: number;
  total_alertas_activas: number;
  alertas_criticas: number;
  alertas_no_leidas: number;
  almacenes_activos: number;
}

export interface ConsultaKardexParams {
  inventario_id: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  page?: number;
  page_size?: number;
}

export interface KardexResponse extends PaginatedResponse<KardexList> {
  producto_nombre: string;
  almacen_nombre: string;
  unidad_medida: string;
  saldo_actual: number;
  valor_actual: number;
}
