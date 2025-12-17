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

export type AccionPermiso =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'APPROVE'
  | 'EXPORT'
  | 'MANAGE';

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

export interface UpdateRolAdicionalDTO extends Partial<CreateRolAdicionalDTO> {}

// ==================== PLANTILLAS DE ROLES ====================

export interface PlantillaRol {
  code: string;
  name: string;
  description: string;
  tipo_rol: TipoRol;
  requiere_certificacion: boolean;
  certificacion_requerida?: string;
  permission_codes: string[];
  icon: string;
  color: string;
}

// Plantillas predefinidas
export const PLANTILLAS_ROLES: PlantillaRol[] = [
  // ROLES LEGALES
  {
    code: 'coordinador_sst',
    name: 'Coordinador SST',
    description: 'Responsable del Sistema de Gestión de Seguridad y Salud en el Trabajo',
    tipo_rol: 'LEGAL',
    requiere_certificacion: true,
    certificacion_requerida: 'Licencia SST Res. 4927/2016',
    permission_codes: [
      'sst.view_list',
      'sst.view_detail',
      'sst.create',
      'sst.update',
      'sst.manage_copasst',
      'sst.manage_emergencias',
      'sst.manage_medicina',
    ],
    icon: 'Shield',
    color: 'red',
  },
  {
    code: 'responsable_ambiental',
    name: 'Responsable Ambiental',
    description: 'Gestor de permisos ambientales y cumplimiento normativo',
    tipo_rol: 'LEGAL',
    requiere_certificacion: true,
    certificacion_requerida: 'Profesional ambiental certificado',
    permission_codes: [
      'certificados.view_list',
      'certificados.create',
      'certificados.generate',
      'certificados.download',
    ],
    icon: 'Leaf',
    color: 'green',
  },
  {
    code: 'auditor_interno',
    name: 'Auditor Interno',
    description: 'Auditor interno para sistemas de gestión ISO',
    tipo_rol: 'SISTEMA_GESTION',
    requiere_certificacion: true,
    certificacion_requerida: 'Auditor ISO 9001/14001/45001',
    permission_codes: [
      'recolecciones.view_list',
      'recolecciones.view_detail',
      'programaciones.view_list',
      'programaciones.view_detail',
      'proveedores.view_list',
      'recepciones.view_list',
    ],
    icon: 'ClipboardCheck',
    color: 'purple',
  },

  // ROLES DE SISTEMA DE GESTIÓN
  {
    code: 'gestor_calidad',
    name: 'Gestor de Calidad',
    description: 'Responsable del Sistema de Gestión de Calidad',
    tipo_rol: 'SISTEMA_GESTION',
    requiere_certificacion: true,
    certificacion_requerida: 'ISO 9001 Lead Auditor',
    permission_codes: [
      'recepciones.view_list',
      'recepciones.view_detail',
      'recepciones.confirm',
      'proveedores.view_price_history',
    ],
    icon: 'Award',
    color: 'blue',
  },
  {
    code: 'representante_direccion',
    name: 'Representante de la Dirección',
    description: 'Representante de la dirección para sistemas de gestión',
    tipo_rol: 'SISTEMA_GESTION',
    requiere_certificacion: false,
    permission_codes: [
      'config.view_settings',
      'users.view_list',
      'users.assign_roles',
      'config.manage_roles',
    ],
    icon: 'UserCog',
    color: 'indigo',
  },

  // ROLES OPERATIVOS
  {
    code: 'aprobador_recolecciones',
    name: 'Aprobador de Recolecciones',
    description: 'Puede aprobar o rechazar recolecciones',
    tipo_rol: 'OPERATIVO',
    requiere_certificacion: false,
    permission_codes: [
      'recolecciones.view_list',
      'recolecciones.view_detail',
      'recolecciones.approve',
      'recolecciones.reject',
    ],
    icon: 'CheckCircle',
    color: 'green',
  },
  {
    code: 'gestor_proveedores',
    name: 'Gestor de Proveedores',
    description: 'Gestiona proveedores y sus precios',
    tipo_rol: 'OPERATIVO',
    requiere_certificacion: false,
    permission_codes: [
      'proveedores.view_list',
      'proveedores.view_detail',
      'proveedores.create',
      'proveedores.update',
      'proveedores.manage_prices',
      'proveedores.view_price_history',
    ],
    icon: 'Truck',
    color: 'orange',
  },
  {
    code: 'gestor_ecoaliados',
    name: 'Gestor de EcoAliados',
    description: 'Gestiona EcoAliados y comerciales',
    tipo_rol: 'OPERATIVO',
    requiere_certificacion: false,
    permission_codes: [
      'ecoaliados.view_list',
      'ecoaliados.view_detail',
      'ecoaliados.create',
      'ecoaliados.update',
      'ecoaliados.manage_prices',
      'ecoaliados.assign_commercial',
    ],
    icon: 'Users',
    color: 'cyan',
  },

  // ROLES ADMINISTRATIVOS
  {
    code: 'admin_sistema',
    name: 'Administrador del Sistema',
    description: 'Gestiona configuración general y usuarios',
    tipo_rol: 'ADMINISTRATIVO',
    requiere_certificacion: false,
    permission_codes: [
      'users.view_list',
      'users.create',
      'users.update',
      'users.assign_roles',
      'users.assign_cargo',
      'config.view_settings',
      'config.manage_settings',
      'config.manage_roles',
      'config.manage_cargos',
    ],
    icon: 'Settings',
    color: 'gray',
  },
  {
    code: 'visualizador_general',
    name: 'Visualizador General',
    description: 'Acceso de solo lectura a todos los módulos',
    tipo_rol: 'ADMINISTRATIVO',
    requiere_certificacion: false,
    permission_codes: [
      'recolecciones.view_list',
      'recolecciones.view_detail',
      'programaciones.view_list',
      'programaciones.view_detail',
      'proveedores.view_list',
      'proveedores.view_detail',
      'ecoaliados.view_list',
      'ecoaliados.view_detail',
      'recepciones.view_list',
      'recepciones.view_detail',
    ],
    icon: 'Eye',
    color: 'gray',
  },
];

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
