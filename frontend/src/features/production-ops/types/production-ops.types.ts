/**
 * Tipos TypeScript para Módulo de Production Ops
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Incluye todos los modelos de:
 * - Recepción de Materia Prima
 * - Procesamiento y Lotes
 * - Mantenimiento de Equipos
 * - Producto Terminado
 */

// ==================== COMMON TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== RECEPCIÓN - ENUMS Y TIPOS ====================

export type EstadoRecepcionEnum =
  | 'PENDIENTE'
  | 'EN_RECEPCION'
  | 'CONTROL_CALIDAD'
  | 'COMPLETADA'
  | 'RECHAZADA'
  | 'CANCELADA';

// ==================== RECEPCIÓN - CATÁLOGOS ====================

export interface TipoRecepcion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  requiere_pesaje: boolean;
  requiere_acidez: boolean;
  requiere_temperatura: boolean;
  requiere_control_calidad: boolean;
  is_active: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface EstadoRecepcion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
  es_inicial: boolean;
  es_final: boolean;
  permite_edicion: boolean;
  genera_inventario: boolean;
  is_active: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface PuntoRecepcion {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  capacidad_kg: string | null;
  bascula_asignada: string;
  is_active: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

// ==================== RECEPCIÓN - MODELOS PRINCIPALES ====================

export interface Recepcion {
  id: number;
  empresa_id: number;
  codigo: string;
  fecha: string;
  hora_llegada: string | null;
  hora_salida: string | null;

  // Relaciones
  proveedor: number;
  proveedor_nombre?: string;
  programacion: number | null;
  tipo_recepcion: number;
  tipo_recepcion_nombre?: string;
  punto_recepcion: number;
  punto_recepcion_nombre?: string;
  estado: number;
  estado_nombre?: string;
  estado_color?: string;

  // Transporte
  vehiculo_proveedor: string;
  conductor_proveedor: string;

  // Pesaje
  peso_bruto: string | null;
  peso_tara: string | null;
  peso_neto: string | null;

  // Control
  temperatura_llegada: string | null;

  // Responsable
  recibido_por: number;
  recibido_por_nombre?: string;

  observaciones: string;

  // Propiedades calculadas
  duracion_recepcion?: number | null;
  tiene_detalles?: boolean;
  total_cantidad_detalles?: string;
  total_valor_detalles?: string;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecepcionList {
  id: number;
  codigo: string;
  fecha: string;
  proveedor_nombre?: string;
  tipo_recepcion_nombre?: string;
  estado_nombre?: string;
  estado_color?: string;
  peso_neto: string | null;
  temperatura_llegada: string | null;
  created_at: string;
}

export interface DetalleRecepcion {
  id: number;
  recepcion: number;
  tipo_materia_prima: number;
  tipo_materia_prima_nombre?: string;
  cantidad: string;
  unidad_medida: string;
  acidez_medida: string | null;
  temperatura: string | null;
  precio_unitario: string;
  subtotal: string;
  lote_asignado: string;
  observaciones: string;
  cumple_acidez?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ControlCalidadRecepcion {
  id: number;
  recepcion: number;
  parametro: string;
  valor_esperado: string;
  valor_obtenido: string;
  cumple: boolean;
  observaciones: string;
  verificado_por: number;
  verificado_por_nombre?: string;
  fecha_verificacion: string;
  created_at: string;
  updated_at: string;
}

// ==================== PROCESAMIENTO - ENUMS Y TIPOS ====================

export type EstadoProcesoEnum =
  | 'PROGRAMADA'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'PAUSADA'
  | 'CANCELADA';

export type ParametroControlProceso =
  | 'temperatura'
  | 'presion'
  | 'tiempo'
  | 'humedad'
  | 'acidez_final'
  | 'color'
  | 'textura'
  | 'granulometria'
  | 'otro';

// ==================== PROCESAMIENTO - CATÁLOGOS ====================

export interface TipoProceso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tiempo_estimado_horas: string | null;
  requiere_temperatura: boolean;
  requiere_presion: boolean;
  producto_resultante: string;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface EstadoProceso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
  es_inicial: boolean;
  es_final: boolean;
  permite_edicion: boolean;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface LineaProduccion {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  capacidad_kg_hora: string | null;
  tipo_proceso_compatible: number[];
  tipo_proceso_compatible_nombres?: string[];
  cantidad_tipos_compatibles?: number;
  is_active: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

// ==================== PROCESAMIENTO - MODELOS PRINCIPALES ====================

export interface OrdenProduccion {
  id: number;
  empresa_id: number;
  codigo: string;

  // Fechas
  fecha_programada: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;

  // Relaciones
  tipo_proceso: number;
  tipo_proceso_nombre?: string;
  linea_produccion: number;
  linea_produccion_nombre?: string;
  estado: number;
  estado_nombre?: string;
  estado_color?: string;
  recepcion_origen: number | null;

  // Cantidades
  cantidad_programada: string;
  cantidad_real: string | null;

  // Prioridad
  prioridad: 1 | 2 | 3 | 4 | 5;

  // Responsable
  responsable: number;
  responsable_nombre?: string;

  observaciones: string;

  // Propiedades calculadas
  duracion_proceso_horas?: number | null;
  porcentaje_completado?: string;
  tiene_lotes?: boolean;
  cantidad_lotes?: number;
  total_cantidad_producida?: string;
  rendimiento_promedio?: string;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrdenProduccionList {
  id: number;
  codigo: string;
  fecha_programada: string;
  tipo_proceso_nombre?: string;
  linea_produccion_nombre?: string;
  estado_nombre?: string;
  estado_color?: string;
  prioridad: number;
  cantidad_programada: string;
  cantidad_real: string | null;
  porcentaje_completado?: string;
  created_at: string;
}

export interface LoteProduccion {
  id: number;
  codigo: string;
  orden_produccion: number;
  orden_produccion_codigo?: string;

  // Entrada
  materia_prima_entrada: string;
  cantidad_entrada: string;

  // Salida
  producto_salida: string;
  cantidad_salida: string;

  // Merma y rendimiento
  merma_kg: string;
  porcentaje_rendimiento: string;

  // Fechas
  fecha_produccion: string;
  hora_inicio: string | null;
  hora_fin: string | null;

  // Operador
  operador: number;
  operador_nombre?: string;

  // Propiedades calculadas
  duracion_produccion_horas?: number | null;
  tiene_consumos?: boolean;
  total_costo_materia_prima?: string;
  tiene_controles_calidad?: boolean;
  todos_controles_cumplen?: boolean | null;

  created_at: string;
  updated_at: string;
}

export interface LoteProduccionList {
  id: number;
  codigo: string;
  orden_produccion_codigo?: string;
  producto_salida: string;
  cantidad_salida: string;
  porcentaje_rendimiento: string;
  fecha_produccion: string;
  created_at: string;
}

export interface ConsumoMateriaPrima {
  id: number;
  lote_produccion: number;
  lote_produccion_codigo?: string;
  tipo_materia_prima: number;
  tipo_materia_prima_nombre?: string;
  cantidad: string;
  unidad_medida: string;
  costo_unitario: string;
  costo_total: string;
  lote_origen: string;
  created_at: string;
  updated_at: string;
}

export interface ControlCalidadProceso {
  id: number;
  lote_produccion: number;
  lote_produccion_codigo?: string;
  parametro: ParametroControlProceso;
  parametro_display?: string;
  valor_minimo: string | null;
  valor_maximo: string | null;
  valor_obtenido: string;
  cumple: boolean;
  observaciones: string;
  verificado_por: number;
  verificado_por_nombre?: string;
  fecha_verificacion: string;
  estado_cumplimiento?: string;
  created_at: string;
  updated_at: string;
}

// ==================== MANTENIMIENTO - ENUMS Y TIPOS ====================

export type EstadoActivo =
  | 'OPERATIVO'
  | 'EN_MANTENIMIENTO'
  | 'FUERA_SERVICIO'
  | 'DADO_DE_BAJA';

export type EstadoEquipoMedicion =
  | 'OPERATIVO'
  | 'EN_CALIBRACION'
  | 'FUERA_SERVICIO'
  | 'DADO_DE_BAJA';

export type TipoParada =
  | 'FALLA_MECANICA'
  | 'FALLA_ELECTRICA'
  | 'FALTA_REPUESTOS'
  | 'FALTA_OPERADOR'
  | 'OTRO';

export type PrioridadOrden = 1 | 2 | 3 | 4 | 5;

export type EstadoOrden =
  | 'ABIERTA'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'CANCELADA';

export type ResultadoCalibracion =
  | 'APROBADO'
  | 'AJUSTADO'
  | 'RECHAZADO';

// ==================== MANTENIMIENTO - CATÁLOGOS ====================

export interface TipoActivo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  vida_util_anios: number;
  depreciacion_anual: string;
  requiere_calibracion: boolean;
  frecuencia_calibracion_meses: number | null;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface TipoMantenimiento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  es_preventivo: boolean;
  es_correctivo: boolean;
  es_predictivo: boolean;
  frecuencia_dias: number | null;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

// ==================== MANTENIMIENTO - MODELOS PRINCIPALES ====================

export interface ActivoProduccion {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;

  // Clasificación
  tipo_activo: number;
  tipo_activo_nombre?: string;
  linea_produccion: number | null;
  linea_produccion_nombre?: string;

  // Información técnica
  marca: string;
  modelo: string;
  numero_serie: string;

  // Información financiera
  fecha_adquisicion: string;
  valor_adquisicion: string;
  valor_actual: string | null;

  // Mantenimiento
  fecha_ultima_revision: string | null;
  fecha_proximo_mantenimiento: string | null;

  // Estado
  estado: EstadoActivo;

  // Ubicación
  ubicacion: string;
  manual_url: string;

  is_active: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface ActivoProduccionList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_activo_nombre?: string;
  estado: EstadoActivo;
  fecha_proximo_mantenimiento: string | null;
  created_at: string;
}

export interface EquipoMedicion {
  id: number;
  empresa_id: number;
  activo: number | null;
  activo_codigo?: string;
  codigo: string;
  nombre: string;

  // Información técnica
  marca: string;
  modelo: string;
  numero_serie: string;

  // Características de medición
  rango_medicion_min: string;
  rango_medicion_max: string;
  unidad_medida: string;
  resolucion: string | null;
  exactitud: string | null;

  // Calibración
  fecha_calibracion: string | null;
  fecha_proxima_calibracion: string | null;
  certificado_calibracion_url: string;

  // Estado
  estado: EstadoEquipoMedicion;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EquipoMedicionList {
  id: number;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  estado: EstadoEquipoMedicion;
  fecha_proxima_calibracion: string | null;
  created_at: string;
}

export interface PlanMantenimiento {
  id: number;
  empresa_id: number;
  nombre: string;
  descripcion: string;

  // Relaciones
  activo: number;
  activo_codigo?: string;
  activo_nombre?: string;
  tipo_mantenimiento: number;
  tipo_mantenimiento_nombre?: string;

  // Frecuencia
  frecuencia_dias: number | null;
  frecuencia_horas_uso: number | null;

  // Detalles
  tareas_realizar: string;
  repuestos_necesarios: string;

  // Estimaciones
  tiempo_estimado_horas: string;
  costo_estimado: string | null;

  // Control
  ultima_ejecucion: string | null;
  proxima_ejecucion: string | null;

  activo_plan: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanMantenimientoList {
  id: number;
  nombre: string;
  activo_codigo?: string;
  activo_nombre?: string;
  tipo_mantenimiento_nombre?: string;
  proxima_ejecucion: string | null;
  activo_plan: boolean;
  created_at: string;
}

export interface OrdenTrabajo {
  id: number;
  empresa_id: number;
  codigo: string;

  // Relaciones
  activo: number;
  activo_codigo?: string;
  activo_nombre?: string;
  tipo_mantenimiento: number;
  tipo_mantenimiento_nombre?: string;
  plan_mantenimiento: number | null;
  plan_mantenimiento_nombre?: string;

  // Clasificación
  prioridad: PrioridadOrden;
  estado: EstadoOrden;

  // Fechas
  fecha_solicitud: string;
  fecha_programada: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;

  // Descripción
  descripcion_problema: string;
  descripcion_trabajo_realizado: string;

  // Personal
  solicitante: number;
  solicitante_nombre?: string;
  asignado_a: number | null;
  asignado_a_nombre?: string;

  // Costos
  horas_trabajadas: string;
  costo_mano_obra: string;
  costo_repuestos: string;
  costo_total: string;

  observaciones: string;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrdenTrabajoList {
  id: number;
  codigo: string;
  activo_codigo?: string;
  tipo_mantenimiento_nombre?: string;
  prioridad: PrioridadOrden;
  estado: EstadoOrden;
  fecha_programada: string | null;
  asignado_a_nombre?: string;
  costo_total: string;
  created_at: string;
}

export interface Calibracion {
  id: number;
  empresa_id: number;
  equipo: number;
  equipo_codigo?: string;
  equipo_nombre?: string;

  // Fechas
  fecha_calibracion: string;
  fecha_vencimiento: string;

  // Datos del certificado
  numero_certificado: string;
  laboratorio_calibrador: string;

  // Resultado
  resultado: ResultadoCalibracion;

  // Datos técnicos
  patron_utilizado: string;
  incertidumbre_medicion: string | null;

  // Valores
  valores_antes: Record<string, any>;
  valores_despues: Record<string, any>;

  // Documentación
  certificado_url: string;

  // Responsable
  responsable: number;
  responsable_nombre?: string;

  observaciones: string;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalibracionList {
  id: number;
  numero_certificado: string;
  equipo_codigo?: string;
  equipo_nombre?: string;
  fecha_calibracion: string;
  fecha_vencimiento: string;
  resultado: ResultadoCalibracion;
  laboratorio_calibrador: string;
  created_at: string;
}

export interface Parada {
  id: number;
  empresa_id: number;
  activo: number;
  activo_codigo?: string;
  activo_nombre?: string;

  // Tiempo
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_horas: string | null;

  // Clasificación
  tipo: TipoParada;

  // Descripción
  causa: string;
  descripcion_falla: string;

  // Impacto
  impacto_produccion_kg: string;
  costo_estimado_parada: string | null;

  // Orden de trabajo
  orden_trabajo: number | null;
  orden_trabajo_codigo?: string;

  // Acciones
  acciones_correctivas: string;

  // Responsable
  reportado_por: number;
  reportado_por_nombre?: string;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParadaList {
  id: number;
  activo_codigo?: string;
  activo_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_horas: string | null;
  tipo: TipoParada;
  impacto_produccion_kg: string;
  created_at: string;
}

// ==================== PRODUCTO TERMINADO - ENUMS Y TIPOS ====================

export type EstadoLoteEnum =
  | 'EN_PRODUCCION'
  | 'CUARENTENA'
  | 'LIBERADO'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'DESPACHADO';

export type ResultadoLiberacion =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'APROBADO_CON_OBSERVACIONES'
  | 'RECHAZADO';

// ==================== PRODUCTO TERMINADO - CATÁLOGOS ====================

export interface TipoProducto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  unidad_medida: string;
  requiere_certificado: boolean;
  requiere_ficha_tecnica: boolean;
  vida_util_dias: number | null;
  temperatura_almacenamiento_min: string | null;
  temperatura_almacenamiento_max: string | null;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface EstadoLote {
  id: number;
  codigo: string;
  nombre: string;
  color: string;
  descripcion: string;
  permite_despacho: boolean;
  requiere_liberacion: boolean;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

// ==================== PRODUCTO TERMINADO - MODELOS PRINCIPALES ====================

export interface ProductoTerminado {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;

  // Relación
  tipo_producto: number;
  tipo_producto_nombre?: string;
  tipo_producto_unidad?: string;

  // Especificaciones
  especificaciones_tecnicas: string;

  // Precio
  precio_base: string | null;
  moneda: string;

  // Archivos
  ficha_tecnica_url: string;
  imagen_url: string;

  // Propiedades calculadas
  stock_total?: string;
  stock_por_estado?: Array<{
    estado_lote__nombre: string;
    cantidad: string;
  }>;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductoTerminadoList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_producto_nombre?: string;
  precio_base: string | null;
  stock_total?: string;
  created_at: string;
}

export interface StockProducto {
  id: number;
  empresa_id: number;
  producto: number;
  producto_codigo?: string;
  producto_nombre?: string;
  estado_lote: number;
  estado_lote_nombre?: string;
  estado_lote_color?: string;

  // Trazabilidad
  lote_produccion: number | null;
  lote_produccion_codigo?: string;
  codigo_lote_pt: string;

  // Cantidades
  cantidad_inicial: string;
  cantidad_disponible: string;
  cantidad_reservada: string;

  // Fechas
  fecha_produccion: string;
  fecha_vencimiento: string | null;

  // Ubicación
  ubicacion_almacen: string;

  // Costos
  costo_unitario: string | null;
  valor_total: string | null;

  // Propiedades calculadas
  esta_vencido?: boolean;
  dias_para_vencer?: number | null;
  porcentaje_consumido?: string;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockProductoList {
  id: number;
  codigo_lote_pt: string;
  producto_codigo?: string;
  producto_nombre?: string;
  estado_lote_nombre?: string;
  estado_lote_color?: string;
  cantidad_disponible: string;
  fecha_produccion: string;
  fecha_vencimiento: string | null;
  esta_vencido?: boolean;
  created_at: string;
}

export interface Liberacion {
  id: number;
  empresa_id: number;
  stock_producto: number;
  stock_codigo_lote?: string;
  stock_producto_nombre?: string;

  // Fechas
  fecha_solicitud: string;
  fecha_liberacion: string | null;

  // Resultado
  resultado: ResultadoLiberacion;

  // Personal
  solicitado_por: number;
  solicitado_por_nombre?: string;
  aprobado_por: number | null;
  aprobado_por_nombre?: string;

  // Parámetros
  parametros_evaluados: Array<{
    parametro: string;
    valor: string;
    cumple: boolean;
    observacion?: string;
  }>;

  observaciones: string;
  certificado_url: string;

  // Propiedades calculadas
  permite_despacho?: boolean;
  esta_pendiente?: boolean;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LiberacionList {
  id: number;
  stock_codigo_lote?: string;
  stock_producto_nombre?: string;
  fecha_solicitud: string;
  fecha_liberacion: string | null;
  resultado: ResultadoLiberacion;
  solicitado_por_nombre?: string;
  aprobado_por_nombre?: string;
  created_at: string;
}

export interface CertificadoCalidad {
  id: number;
  empresa_id: number;
  numero_certificado: string;

  // Relación
  liberacion: number;
  liberacion_stock_lote?: string;

  // Cliente
  cliente_nombre: string;

  // Fechas
  fecha_emision: string;
  fecha_vencimiento: string | null;

  // Parámetros
  parametros_certificados: Record<string, any>;

  observaciones: string;

  // Personal
  emitido_por: number;
  emitido_por_nombre?: string;

  // PDF
  pdf_url: string;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificadoCalidadList {
  id: number;
  numero_certificado: string;
  cliente_nombre: string;
  fecha_emision: string;
  emitido_por_nombre?: string;
  pdf_url: string;
  created_at: string;
}

// ==================== DTOs - CREATE ====================

export interface CreateRecepcionDTO {
  fecha: string;
  proveedor: number;
  tipo_recepcion: number;
  punto_recepcion: number;
  estado: number;
  hora_llegada?: string;
  vehiculo_proveedor?: string;
  conductor_proveedor?: string;
  peso_bruto?: string;
  peso_tara?: string;
  temperatura_llegada?: string;
  recibido_por: number;
  observaciones?: string;
  programacion?: number;
}

export interface CreateDetalleRecepcionDTO {
  recepcion: number;
  tipo_materia_prima: number;
  cantidad: string;
  unidad_medida?: string;
  acidez_medida?: string;
  temperatura?: string;
  precio_unitario: string;
  lote_asignado?: string;
  observaciones?: string;
}

export interface CreateControlCalidadRecepcionDTO {
  recepcion: number;
  parametro: string;
  valor_esperado: string;
  valor_obtenido: string;
  cumple: boolean;
  observaciones?: string;
  verificado_por: number;
}

export interface CreateOrdenProduccionDTO {
  fecha_programada: string;
  tipo_proceso: number;
  linea_produccion: number;
  estado: number;
  cantidad_programada: string;
  prioridad?: number;
  responsable: number;
  recepcion_origen?: number;
  observaciones?: string;
}

export interface CreateLoteProduccionDTO {
  orden_produccion: number;
  materia_prima_entrada: string;
  cantidad_entrada: string;
  producto_salida: string;
  cantidad_salida: string;
  fecha_produccion: string;
  hora_inicio?: string;
  hora_fin?: string;
  operador: number;
}

export interface CreateConsumoMateriaPrimaDTO {
  lote_produccion: number;
  tipo_materia_prima: number;
  cantidad: string;
  unidad_medida?: string;
  costo_unitario: string;
  lote_origen?: string;
}

export interface CreateControlCalidadProcesoDTO {
  lote_produccion: number;
  parametro: ParametroControlProceso;
  valor_minimo?: string;
  valor_maximo?: string;
  valor_obtenido: string;
  observaciones?: string;
  verificado_por: number;
}

export interface CreateActivoProduccionDTO {
  nombre: string;
  tipo_activo: number;
  fecha_adquisicion: string;
  valor_adquisicion: string;
  descripcion?: string;
  linea_produccion?: number;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  ubicacion?: string;
  manual_url?: string;
}

export interface CreateEquipoMedicionDTO {
  nombre: string;
  rango_medicion_min: string;
  rango_medicion_max: string;
  unidad_medida: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  resolucion?: string;
  exactitud?: string;
  activo?: number;
}

export interface CreatePlanMantenimientoDTO {
  nombre: string;
  activo: number;
  tipo_mantenimiento: number;
  tareas_realizar: string;
  tiempo_estimado_horas: string;
  descripcion?: string;
  frecuencia_dias?: number;
  frecuencia_horas_uso?: number;
  repuestos_necesarios?: string;
  costo_estimado?: string;
}

export interface CreateOrdenTrabajoDTO {
  activo: number;
  tipo_mantenimiento: number;
  descripcion_problema: string;
  solicitante: number;
  prioridad?: number;
  fecha_programada?: string;
  plan_mantenimiento?: number;
  asignado_a?: number;
}

export interface CreateCalibracionDTO {
  equipo: number;
  fecha_calibracion: string;
  fecha_vencimiento: string;
  numero_certificado: string;
  laboratorio_calibrador: string;
  resultado: ResultadoCalibracion;
  responsable: number;
  patron_utilizado?: string;
  incertidumbre_medicion?: string;
  valores_antes?: Record<string, any>;
  valores_despues?: Record<string, any>;
  certificado_url?: string;
  observaciones?: string;
}

export interface CreateParadaDTO {
  activo: number;
  fecha_inicio: string;
  tipo: TipoParada;
  causa: string;
  descripcion_falla: string;
  impacto_produccion_kg?: string;
  reportado_por: number;
  costo_estimado_parada?: string;
}

export interface CreateProductoTerminadoDTO {
  codigo: string;
  nombre: string;
  tipo_producto: number;
  descripcion?: string;
  especificaciones_tecnicas?: string;
  precio_base?: string;
  moneda?: string;
  ficha_tecnica_url?: string;
  imagen_url?: string;
}

export interface CreateStockProductoDTO {
  producto: number;
  estado_lote: number;
  cantidad_inicial: string;
  cantidad_disponible: string;
  fecha_produccion: string;
  lote_produccion?: number;
  codigo_lote_pt?: string;
  fecha_vencimiento?: string;
  ubicacion_almacen?: string;
  costo_unitario?: string;
}

export interface CreateLiberacionDTO {
  stock_producto: number;
  solicitado_por: number;
  parametros_evaluados?: Array<{
    parametro: string;
    valor: string;
    cumple: boolean;
    observacion?: string;
  }>;
}

export interface CreateCertificadoCalidadDTO {
  liberacion: number;
  cliente_nombre: string;
  emitido_por: number;
  parametros_certificados?: Record<string, any>;
  fecha_vencimiento?: string;
  observaciones?: string;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateRecepcionDTO extends Partial<CreateRecepcionDTO> {
  hora_salida?: string;
  cantidad_real?: string;
}

export interface UpdateOrdenProduccionDTO extends Partial<CreateOrdenProduccionDTO> {
  fecha_inicio?: string;
  fecha_fin?: string;
  cantidad_real?: string;
}

export interface UpdateActivoProduccionDTO extends Partial<CreateActivoProduccionDTO> {
  estado?: EstadoActivo;
  fecha_ultima_revision?: string;
  fecha_proximo_mantenimiento?: string;
}

export interface UpdateOrdenTrabajoDTO extends Partial<CreateOrdenTrabajoDTO> {
  estado?: EstadoOrden;
  fecha_inicio?: string;
  fecha_fin?: string;
  descripcion_trabajo_realizado?: string;
  horas_trabajadas?: string;
  costo_mano_obra?: string;
  costo_repuestos?: string;
  observaciones?: string;
}

export interface UpdateParadaDTO extends Partial<CreateParadaDTO> {
  fecha_fin?: string;
  acciones_correctivas?: string;
  orden_trabajo?: number;
}

export interface UpdateStockProductoDTO extends Partial<CreateStockProductoDTO> {
  cantidad_reservada?: string;
}

export interface UpdateLiberacionDTO {
  resultado?: ResultadoLiberacion;
  aprobado_por?: number;
  fecha_liberacion?: string;
  observaciones?: string;
  parametros_evaluados?: Array<{
    parametro: string;
    valor: string;
    cumple: boolean;
    observacion?: string;
  }>;
}

// ==================== ACTIONS ====================

export interface AprobarLiberacionDTO {
  aprobado_por: number;
  observaciones?: string;
  parametros_evaluados?: Array<{
    parametro: string;
    valor: string;
    cumple: boolean;
    observacion?: string;
  }>;
}

export interface RechazarLiberacionDTO {
  aprobado_por: number;
  observaciones: string;
  parametros_evaluados?: Array<{
    parametro: string;
    valor: string;
    cumple: boolean;
    observacion?: string;
  }>;
}

export interface IniciarOrdenProduccionDTO {
  usuario_id?: number;
}

export interface FinalizarOrdenProduccionDTO {
  usuario_id?: number;
}

export interface IniciarOrdenTrabajoDTO {
  fecha_inicio?: string;
}

export interface CompletarOrdenTrabajoDTO {
  fecha_fin?: string;
  descripcion_trabajo_realizado: string;
  horas_trabajadas?: string;
  costo_mano_obra?: string;
  costo_repuestos?: string;
}

export interface CerrarParadaDTO {
  fecha_fin?: string;
}

export interface ReservarCantidadDTO {
  cantidad: string;
}

export interface LiberarReservaDTO {
  cantidad: string;
}

export interface ConsumirCantidadDTO {
  cantidad: string;
}
