/**
 * Tipos TypeScript para Programación de Abastecimiento - Supply Chain
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Programación de operaciones de recolección y compra
 * - Asignación de recursos (vehículos, conductores)
 * - Ejecución de programaciones
 * - Liquidación económica de operaciones
 */

// ==================== TIPOS DE CATÁLOGOS ====================

export interface TipoOperacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_vehiculo: boolean;
  requiere_conductor: boolean;
  color_hex?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadoProgramacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  es_estado_inicial: boolean;
  es_estado_final: boolean;
  color_hex?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadMedida {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  descripcion?: string;
  factor_conversion_kg?: number;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadoEjecucion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  es_estado_inicial: boolean;
  es_estado_final: boolean;
  color_hex?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadoLiquidacion {
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

// ==================== ENTIDADES PRINCIPALES ====================

export interface Programacion {
  id: number;
  codigo: string;
  empresa: number;
  sede: number;
  tipo_operacion: number;
  tipo_operacion_data?: TipoOperacion;
  fecha_programada: string;
  fecha_ejecucion?: string;
  proveedor: number;
  proveedor_nombre?: string;
  responsable: number;
  responsable_nombre?: string;
  estado: number;
  estado_data?: EstadoProgramacion;
  observaciones?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Properties
  is_deleted?: boolean;
  tiene_ejecucion?: boolean;
  tiene_liquidacion?: boolean;
  asignacion_recurso?: AsignacionRecurso;
  ejecucion?: Ejecucion;
}

export interface ProgramacionList {
  id: number;
  codigo: string;
  tipo_operacion_data?: TipoOperacion;
  fecha_programada: string;
  proveedor_nombre?: string;
  estado_data?: EstadoProgramacion;
  tiene_ejecucion?: boolean;
  tiene_liquidacion?: boolean;
  created_at: string;
}

export interface AsignacionRecurso {
  id: number;
  programacion: number;
  programacion_codigo?: string;
  vehiculo?: string;
  conductor?: number;
  conductor_nombre?: string;
  fecha_asignacion: string;
  observaciones?: string;
  asignado_por?: number;
  asignado_por_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface Ejecucion {
  id: number;
  programacion: number;
  programacion_codigo?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  kilometraje_inicial?: number;
  kilometraje_final?: number;
  cantidad_recolectada: number;
  unidad_medida: number;
  unidad_medida_data?: UnidadMedida;
  estado: number;
  estado_data?: EstadoEjecucion;
  ejecutado_por: number;
  ejecutado_por_nombre?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  // Properties
  kilometros_recorridos?: number;
  duracion_horas?: number;
  tiene_liquidacion?: boolean;
  liquidacion?: Liquidacion;
}

export interface Liquidacion {
  id: number;
  ejecucion: number;
  ejecucion_data?: Ejecucion;
  fecha_liquidacion: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  deducciones: number;
  detalle_deducciones?: string;
  valor_total: number;
  liquidado_por: number;
  liquidado_por_nombre?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  estado: number;
  estado_data?: EstadoLiquidacion;
  genera_cxp: boolean;
  numero_cxp?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  // Properties
  proveedor_nombre?: string;
  puede_editar?: boolean;
  esta_aprobada?: boolean;
}

// ==================== DTOs - CREATE ====================

export interface CreateTipoOperacionDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_vehiculo?: boolean;
  requiere_conductor?: boolean;
  color_hex?: string;
  orden?: number;
}

export interface CreateEstadoProgramacionDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  es_estado_inicial?: boolean;
  es_estado_final?: boolean;
  color_hex?: string;
  orden?: number;
}

export interface CreateUnidadMedidaDTO {
  codigo: string;
  nombre: string;
  simbolo: string;
  descripcion?: string;
  factor_conversion_kg?: number;
  orden?: number;
}

export interface CreateEstadoEjecucionDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  es_estado_inicial?: boolean;
  es_estado_final?: boolean;
  color_hex?: string;
  orden?: number;
}

export interface CreateEstadoLiquidacionDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  permite_edicion?: boolean;
  es_estado_inicial?: boolean;
  es_estado_final?: boolean;
  color_hex?: string;
  orden?: number;
}

export interface CreateProgramacionDTO {
  sede: number;
  tipo_operacion: number;
  fecha_programada: string;
  proveedor: number;
  responsable: number;
  observaciones?: string;
}

export interface CreateAsignacionRecursoDTO {
  programacion: number;
  vehiculo?: string;
  conductor?: number;
  observaciones?: string;
}

export interface CreateEjecucionDTO {
  programacion: number;
  fecha_inicio: string;
  fecha_fin?: string;
  kilometraje_inicial?: number;
  kilometraje_final?: number;
  cantidad_recolectada: number;
  unidad_medida: number;
  ejecutado_por: number;
  observaciones?: string;
}

export interface CreateLiquidacionDTO {
  ejecucion: number;
  precio_unitario: number;
  cantidad: number;
  deducciones?: number;
  detalle_deducciones?: string;
  observaciones?: string;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateTipoOperacionDTO extends Partial<CreateTipoOperacionDTO> {}
export interface UpdateEstadoProgramacionDTO extends Partial<CreateEstadoProgramacionDTO> {}
export interface UpdateUnidadMedidaDTO extends Partial<CreateUnidadMedidaDTO> {}
export interface UpdateEstadoEjecucionDTO extends Partial<CreateEstadoEjecucionDTO> {}
export interface UpdateEstadoLiquidacionDTO extends Partial<CreateEstadoLiquidacionDTO> {}

export interface UpdateProgramacionDTO extends Partial<CreateProgramacionDTO> {
  estado?: number;
  fecha_ejecucion?: string;
}

export interface UpdateAsignacionRecursoDTO extends Partial<CreateAsignacionRecursoDTO> {}

export interface UpdateEjecucionDTO extends Partial<CreateEjecucionDTO> {
  estado?: number;
}

export interface UpdateLiquidacionDTO extends Partial<CreateLiquidacionDTO> {
  estado?: number;
  aprobado_por?: number;
  fecha_aprobacion?: string;
  genera_cxp?: boolean;
  numero_cxp?: string;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CalendarioEvent {
  id: number;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    programacion_id: number;
    codigo: string;
    tipo_operacion: string;
    proveedor: string;
    estado: string;
  };
}

export interface EstadisticasResponse {
  total_programaciones: number;
  programaciones_pendientes: number;
  programaciones_confirmadas: number;
  programaciones_completadas: number;
  total_ejecuciones: number;
  cantidad_total_recolectada: number;
  total_liquidaciones: number;
  valor_total_liquidaciones: number;
  liquidaciones_pendientes: number;
  liquidaciones_aprobadas: number;
}
