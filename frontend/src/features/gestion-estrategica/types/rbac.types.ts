/**
 * Tipos TypeScript para Sistema RBAC Híbrido
 *
 * Sistema que combina:
 * - Cargos organizacionales (base)
 * - Roles funcionales (adicionales)
 * - Grupos de trabajo
 * - Permisos granulares
 */

// =============================================================================
// PERMISOS
// =============================================================================

export interface Permiso {
  id: number;
  code: string;
  name: string;
  description: string;
  module: string;
  action: 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'APPROVE' | 'MANAGE' | 'EXPORT';
  scope: 'ALL' | 'OWN' | 'TEAM' | 'AREA';
  is_active: boolean;
  is_system: boolean;
}

export interface PermisoAgrupado {
  module: string;
  moduleName: string;
  permisos: Permiso[];
  totalCount: number;
  selectedCount: number;
}

// =============================================================================
// ROLES ADICIONALES
// =============================================================================

export type TipoRolAdicional = 'LEGAL_OBLIGATORIO' | 'SISTEMA_GESTION' | 'OPERATIVO' | 'CUSTOM';

export interface RolAdicional {
  id: number;
  code: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoRolAdicional;
  permisos: Permiso[];
  permisos_codes: string[];

  // Metadata legal
  justificacion_legal?: string;
  requiere_certificacion: boolean;
  certificacion_requerida?: string;
  vigencia_certificacion_dias?: number;

  // Requisitos y restricciones
  requisitos_minimos: string[];
  cargos_compatibles: number[];
  requiere_aprobacion: boolean;

  // Control
  is_system: boolean;
  is_active: boolean;

  // Estadísticas
  usuarios_count: number;
  usuarios_vigentes_count: number;

  // Auditoría
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface RolAdicionalFormData {
  code: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoRolAdicional;
  permisos_codes: string[];

  justificacion_legal?: string;
  requiere_certificacion: boolean;
  certificacion_requerida?: string;
  vigencia_certificacion_dias?: number;

  requisitos_minimos: string[];
  cargos_compatibles: number[];
  requiere_aprobacion: boolean;
}

// =============================================================================
// PLANTILLAS DE ROLES SUGERIDOS
// =============================================================================

export interface RolSugerido {
  code: string;
  nombre: string;
  descripcion: string;
  tipo: TipoRolAdicional;
  permisos_sugeridos: string[];
  justificacion_legal?: string;
  requiere_certificacion: boolean;
  certificacion_requerida?: string;
  vigencia_certificacion_dias?: number;
  icon: string;
  category: 'LEGAL' | 'GESTION' | 'OPERATIVO';
}

// =============================================================================
// ASIGNACIÓN DE ROLES A USUARIOS
// =============================================================================

export type EstadoAsignacionRol =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'VIGENTE'
  | 'EXPIRADO'
  | 'SUSPENDIDO';

export interface UsuarioRolAdicional {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_email: string;
  usuario_cargo?: string;

  rol_adicional_id: number;
  rol_adicional_code: string;
  rol_adicional_nombre: string;

  estado: EstadoAsignacionRol;
  fecha_asignacion: string;
  fecha_inicio?: string;
  fecha_expiracion?: string;

  // Certificación
  certificado_numero?: string;
  certificado_entidad?: string;
  certificado_vigencia?: string;
  certificado_documento?: string;

  // Aprobación
  requiere_aprobacion: boolean;
  aprobado_por_id?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  motivo_rechazo?: string;

  // Control
  is_active: boolean;
  asignado_por_id?: number;
  asignado_por_nombre?: string;
  notas?: string;
  updated_at: string;

  // Computados
  is_vigente: boolean;
  certificado_vigente?: boolean;
  dias_hasta_expiracion?: number;
  dias_hasta_expiracion_certificado?: number;
}

export interface AsignarRolUsuarioFormData {
  usuario_id: number;
  rol_adicional_id: number;
  fecha_inicio?: string;
  fecha_expiracion?: string;

  certificado_numero?: string;
  certificado_entidad?: string;
  certificado_vigencia?: string;
  certificado_documento?: File;

  notas?: string;
}

// =============================================================================
// CARGOS Y PERMISOS
// =============================================================================

export interface Cargo {
  id: number;
  code: string;
  name: string;
  descripcion?: string;
  level: number;
  area_id?: number;
  area_nombre?: string;
  permisos: Permiso[];
  permisos_codes: string[];
  usuarios_count: number;
  is_active: boolean;
}

export interface CargoPermisoAsignacion {
  cargo_id: number;
  permiso_id: number;
  granted_at: string;
  granted_by_id?: number;
  granted_by_nombre?: string;
}

// =============================================================================
// FILTROS Y PAGINACIÓN
// =============================================================================

export interface RolesAdicionalesFilters {
  search?: string;
  tipo?: TipoRolAdicional | 'ALL';
  is_active?: boolean;
  requiere_certificacion?: boolean;
}

export interface UsuarioRolesFilters {
  search?: string;
  rol_adicional_id?: number;
  estado?: EstadoAsignacionRol | 'ALL';
  vigencia?: 'VIGENTES' | 'EXPIRADOS' | 'POR_VENCER' | 'ALL';
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}
