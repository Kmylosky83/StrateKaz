/**
 * Tipos para el sistema RBAC - Roles y Permisos
 */

// ==================== PERMISOS ====================

export interface Permiso {
  id: number;
  code: string;
  name: string;
  module: ModuloSistema;
  action: AccionPermiso;
  scope: AlcancePermiso;
  description?: string;
}

export type ModuloSistema =
  | 'RECOLECCIONES'
  | 'PROGRAMACIONES'
  | 'PROVEEDORES'
  | 'ECOALIADOS'
  | 'RECEPCIONES'
  | 'CERTIFICADOS'
  | 'CORE'
  | 'GESTION_INTEGRAL'
  | 'GESTION_ESTRATEGICA'
  | 'CADENA_VALOR'
  | 'PROCESOS_APOYO';

export type AccionPermiso = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'APPROVE' | 'EXPORT' | 'MANAGE';

export type AlcancePermiso = 'OWN' | 'TEAM' | 'ALL';

export interface PermisoAgrupado {
  module: ModuloSistema;
  label: string;
  permissions: Permiso[];
}

// ==================== CARGO ====================

export interface CargoPermiso {
  cargo_id: number;
  permiso_id: number;
  granted_by?: number;
  granted_at?: string;
}

export interface CargoConPermisos {
  id: number;
  code: string;
  name: string;
  nivel_jerarquico: 0 | 1 | 2 | 3;
  area_id?: number;
  area_nombre?: string;
  permissions: Permiso[];
  permissions_count: number;
  users_count: number;
  is_system: boolean;
}

// ==================== ROL ADICIONAL ====================

export interface RolAdicional {
  id: number;
  code: string;
  name: string;
  description?: string;
  tipo_rol: TipoRol;
  requiere_certificacion: boolean;
  certificacion_requerida?: string;
  permissions: Permiso[];
  permissions_count: number;
  users_count: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TipoRol =
  | 'OPERATIVO'
  | 'ADMINISTRATIVO'
  | 'LEGAL'
  | 'SISTEMA_GESTION'
  | 'TECNICO'
  | 'ESTRATEGICO';

export interface CreateRolAdicionalDTO {
  code: string;
  name: string;
  description?: string;
  tipo_rol: TipoRol;
  requiere_certificacion: boolean;
  certificacion_requerida?: string;
  permission_ids: number[];
  is_active?: boolean;
}

export type UpdateRolAdicionalDTO = Partial<CreateRolAdicionalDTO>;

// ==================== FILTROS ====================

export interface PermisosFilters {
  search?: string;
  module?: ModuloSistema;
  action?: AccionPermiso;
}

export interface RolesFilters {
  search?: string;
  tipo_rol?: TipoRol;
  requiere_certificacion?: boolean;
  is_active?: boolean;
}

// ==================== OPCIONES ====================

export const TIPO_ROL_OPTIONS = [
  { value: 'OPERATIVO', label: 'Operativo', color: 'blue' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo', color: 'purple' },
  { value: 'LEGAL', label: 'Legal / Normativo', color: 'red' },
  { value: 'SISTEMA_GESTION', label: 'Sistema de Gestión', color: 'green' },
  { value: 'TECNICO', label: 'Técnico', color: 'orange' },
  { value: 'ESTRATEGICO', label: 'Estratégico', color: 'indigo' },
] as const;

export const MODULO_OPTIONS = [
  { value: 'RECOLECCIONES', label: 'Recolecciones' },
  { value: 'PROGRAMACIONES', label: 'Programaciones' },
  { value: 'PROVEEDORES', label: 'Proveedores' },
  { value: 'ECOALIADOS', label: 'EcoAliados' },
  { value: 'RECEPCIONES', label: 'Recepciones' },
  { value: 'CERTIFICADOS', label: 'Certificados' },
  { value: 'CORE', label: 'Configuración' },
  { value: 'GESTION_INTEGRAL', label: 'Gestión Integral' },
  { value: 'GESTION_ESTRATEGICA', label: 'Gestión Estratégica' },
  { value: 'CADENA_VALOR', label: 'Cadena de Valor' },
  { value: 'PROCESOS_APOYO', label: 'Procesos de Apoyo' },
] as const;

export const ACCION_OPTIONS = [
  { value: 'VIEW', label: 'Ver', icon: 'Eye' },
  { value: 'CREATE', label: 'Crear', icon: 'Plus' },
  { value: 'EDIT', label: 'Editar', icon: 'Edit' },
  { value: 'DELETE', label: 'Eliminar', icon: 'Trash' },
  { value: 'APPROVE', label: 'Aprobar', icon: 'CheckCircle' },
  { value: 'EXPORT', label: 'Exportar', icon: 'Download' },
  { value: 'MANAGE', label: 'Gestionar', icon: 'Settings' },
] as const;
