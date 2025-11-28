/**
 * Tipos TypeScript para el módulo de Programaciones
 * Sistema de Gestión Grasas y Huesos del Norte
 */

// ==================== PROGRAMACIÓN ====================

export type EstadoProgramacion =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'EN_RUTA'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'REPROGRAMADA';

export type TipoProgramacion = 'PROGRAMADA' | 'INMEDIATA';

export interface Programacion {
  id: number;
  codigo?: string; // Only in detail view
  ecoaliado: number;
  ecoaliado_codigo: string; // From list serializer
  ecoaliado_razon_social: string;
  ecoaliado_ciudad: string;
  ecoaliado_direccion?: string;
  ecoaliado_telefono?: string;
  tipo_programacion: TipoProgramacion;
  tipo_programacion_display: string;
  fecha_programada: string; // ISO 8601 date
  fecha_reprogramada?: string | null;
  estado: EstadoProgramacion;
  estado_display: string;
  esta_vencida?: boolean; // True si fecha < hoy y estado = PROGRAMADA
  programado_por: number;
  programado_por_nombre: string;
  recolector_asignado?: number | null;
  recolector_asignado_nombre?: string | null;
  asignado_por?: number | null;
  asignado_por_nombre?: string | null;
  fecha_asignacion?: string | null;
  cantidad_estimada_kg?: number | null;
  cantidad_recolectada_kg?: number | null;
  observaciones_comercial?: string | null;
  observaciones_logistica?: string | null;
  motivo_cancelacion?: string | null;
  motivo_reprogramacion?: string | null;
  fecha_inicio_ruta?: string | null;
  fecha_completada?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  tiene_geolocalizacion?: boolean;
  created_by?: number | null;
  created_by_nombre?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  is_deleted?: boolean;
}

export interface CreateProgramacionDTO {
  ecoaliado: number;
  tipo_programacion?: TipoProgramacion;
  fecha_programada: string;
  cantidad_estimada_kg?: number;
  observaciones_comercial?: string;
}

export interface UpdateProgramacionDTO {
  tipo_programacion?: TipoProgramacion;
  fecha_programada?: string;
  cantidad_estimada_kg?: number;
  observaciones_comercial?: string;
}

export interface AsignarRecolectorDTO {
  recolector_asignado: number;
  nueva_fecha?: string; // Requerida si la fecha original ya pasó (formato YYYY-MM-DD)
  observaciones_logistica?: string;
}

export interface CambiarEstadoDTO {
  nuevo_estado: EstadoProgramacion;
  observaciones?: string;
  cantidad_recolectada_kg?: number;
  motivo_cancelacion?: string;
}

export interface ReprogramarDTO {
  fecha_reprogramada: string;
  motivo_reprogramacion: string;
  mantener_recolector?: boolean;
}

// ==================== RECOLECTOR ====================

export interface Recolector {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  is_active: boolean;
  // Campos adicionales (opcionales para compatibilidad)
  nombre_completo?: string; // Computed: full_name o first_name + last_name
  telefono?: string; // Alias de phone
  vehiculos_asignados?: string[];
  zona_asignada?: string;
}

// ==================== ECOALIADO (Simplificado para Programaciones) ====================

export interface ProveedorSimple {
  id: number;
  codigo: string;
  razon_social: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  unidad_negocio?: number;
  latitud?: number | null;
  longitud?: number | null;
  tipo_proveedor?: string;
  is_active: boolean;
}

// ==================== UNIDAD DE NEGOCIO (Simplificada) ====================

export interface UnidadNegocio {
  id: number;
  razon_social: string;
  nombre_comercial: string;
  ciudad: string;
  departamento: string;
}

// ==================== FILTROS Y PAGINACIÓN ====================

export interface ProgramacionFilters {
  search?: string;
  ecoaliado?: number | '';
  estado?: EstadoProgramacion | '';
  tipo_programacion?: TipoProgramacion | '';
  recolector_asignado?: number | '';
  fecha_desde?: string;
  fecha_hasta?: string;
  tiene_recolector?: boolean | undefined;
  programado_por?: number | '';
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== ESTADÍSTICAS ====================

export interface EstadisticasProgramaciones {
  total: number;
  pendientes: number;
  asignadas: number;
  en_ruta: number;
  completadas: number;
  canceladas: number;
  reprogramadas: number;
  total_kg_estimado: number;
  total_kg_recolectado: number;
  promedio_kg_por_recoleccion: number;
  tasa_completadas_porcentaje: number;
}

// ==================== CALENDARIO ====================

export interface EventoCalendario {
  id: number;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    programacion: Programacion;
  };
}

// ==================== HISTORIAL ====================

export interface HistorialProgramacion {
  id: number;
  programacion: number;
  accion: string;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
  observaciones?: string | null;
  usuario: number;
  usuario_nombre: string;
  fecha: string;
}
