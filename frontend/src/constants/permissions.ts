/**
 * Constantes de permisos del sistema RBAC
 *
 * IMPORTANTE: Estos codigos deben coincidir exactamente con los del backend
 * (backend/apps/core/permissions_constants.py)
 *
 * Los permisos se verifican dinamicamente a traves de la API,
 * estas constantes solo se usan para referenciar los codigos.
 */

// ==================== CODIGOS DE PERMISOS ====================

export const PermissionCodes = {
  // ==================== RECOLECCIONES ====================
  RECOLECCIONES: {
    MODULE: 'recolecciones',
    VIEW_LIST: 'recolecciones.view_list',
    VIEW_DETAIL: 'recolecciones.view_detail',
    VIEW_VOUCHER: 'recolecciones.view_voucher',
    VIEW_CERTIFICADO: 'recolecciones.view_certificado',
    CREATE: 'recolecciones.create',
    UPDATE: 'recolecciones.update',
    DELETE: 'recolecciones.delete',
    REGISTER: 'recolecciones.register',
    GENERATE_VOUCHER: 'recolecciones.generate_voucher',
    GENERATE_CERTIFICATE: 'recolecciones.generate_certificate',
    APPROVE: 'recolecciones.approve',
    REJECT: 'recolecciones.reject',
    CANCEL: 'recolecciones.cancel',
  },

  // ==================== PROGRAMACIONES ====================
  PROGRAMACIONES: {
    MODULE: 'programaciones',
    VIEW_LIST: 'programaciones.view_list',
    VIEW_DETAIL: 'programaciones.view_detail',
    VIEW_CALENDAR: 'programaciones.view_calendar',
    CREATE: 'programaciones.create',
    UPDATE: 'programaciones.update',
    DELETE: 'programaciones.delete',
    ASSIGN_COLLECTOR: 'programaciones.assign_collector',
    CHANGE_STATE: 'programaciones.change_state',
    REPROGRAM: 'programaciones.reprogram',
    CONFIRM: 'programaciones.confirm',
    START_ROUTE: 'programaciones.start_route',
    COMPLETE: 'programaciones.complete',
  },

  // ==================== PROVEEDORES ====================
  PROVEEDORES: {
    MODULE: 'proveedores',
    VIEW_LIST: 'proveedores.view_list',
    VIEW_DETAIL: 'proveedores.view_detail',
    CREATE: 'proveedores.create',
    UPDATE: 'proveedores.update',
    DELETE: 'proveedores.delete',
    MANAGE_PRICES: 'proveedores.manage_prices',
    VIEW_PRICE_HISTORY: 'proveedores.view_price_history',
  },

  // ==================== ECOALIADOS ====================
  ECOALIADOS: {
    MODULE: 'ecoaliados',
    VIEW_LIST: 'ecoaliados.view_list',
    VIEW_DETAIL: 'ecoaliados.view_detail',
    CREATE: 'ecoaliados.create',
    UPDATE: 'ecoaliados.update',
    DELETE: 'ecoaliados.delete',
    MANAGE_PRICES: 'ecoaliados.manage_prices',
    VIEW_PRICE_HISTORY: 'ecoaliados.view_price_history',
    ASSIGN_COMMERCIAL: 'ecoaliados.assign_commercial',
  },

  // ==================== RECEPCIONES ====================
  RECEPCIONES: {
    MODULE: 'recepciones',
    VIEW_LIST: 'recepciones.view_list',
    VIEW_DETAIL: 'recepciones.view_detail',
    CREATE: 'recepciones.create',
    UPDATE: 'recepciones.update',
    DELETE: 'recepciones.delete',
    INITIATE: 'recepciones.initiate',
    WEIGH: 'recepciones.weigh',
    CONFIRM: 'recepciones.confirm',
    CANCEL: 'recepciones.cancel',
    STANDBY: 'recepciones.standby',
  },

  // ==================== CERTIFICADOS ====================
  CERTIFICADOS: {
    MODULE: 'certificados',
    VIEW_LIST: 'certificados.view_list',
    VIEW_DETAIL: 'certificados.view_detail',
    CREATE: 'certificados.create',
    DELETE: 'certificados.delete',
    GENERATE: 'certificados.generate',
    DOWNLOAD: 'certificados.download',
  },

  // ==================== USUARIOS (CORE) ====================
  USERS: {
    MODULE: 'users',
    VIEW_LIST: 'users.view_list',
    VIEW_DETAIL: 'users.view_detail',
    CREATE: 'users.create',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    ASSIGN_ROLES: 'users.assign_roles',
    ASSIGN_GROUPS: 'users.assign_groups',
    ASSIGN_CARGO: 'users.assign_cargo',
    MANAGE_PERMISSIONS: 'users.manage_permissions',
  },

  // ==================== CONFIGURACION ====================
  CONFIG: {
    MODULE: 'config',
    VIEW_SETTINGS: 'config.view_settings',
    MANAGE_SETTINGS: 'config.manage_settings',
    MANAGE_ROLES: 'config.manage_roles',
    MANAGE_GROUPS: 'config.manage_groups',
    MANAGE_CARGOS: 'config.manage_cargos',
    MANAGE_PERMISSIONS: 'config.manage_permissions',
  },

  // ==================== SST ====================
  SST: {
    MODULE: 'sst',
    VIEW_LIST: 'sst.view_list',
    VIEW_DETAIL: 'sst.view_detail',
    CREATE: 'sst.create',
    UPDATE: 'sst.update',
    DELETE: 'sst.delete',
    MANAGE_COPASST: 'sst.manage_copasst',
    MANAGE_EMERGENCIAS: 'sst.manage_emergencias',
    MANAGE_MEDICINA: 'sst.manage_medicina',
  },
} as const;

// ==================== CODIGOS DE CARGOS ====================

export const CargoCodes = {
  // Nivel 3 - Direccion
  GERENTE_GENERAL: 'gerente_general',
  GERENTE: 'gerente',
  ADMIN: 'admin',

  // Nivel 2 - Coordinacion
  LIDER_COMERCIAL: 'lider_comercial',
  LIDER_COMPRAS: 'lider_compras',
  LIDER_COMERCIAL_ECONORTE: 'lider_com_econorte',
  LIDER_LOGISTICA_ECONORTE: 'lider_log_econorte',
  LIDER_CALIDAD: 'lider_calidad',
  LIDER_SST: 'lider_sst',
  LIDER_TALENTO_HUMANO: 'lider_talento_humano',
  CONTADOR: 'contador',
  JEFE_PLANTA: 'jefe_planta',

  // Nivel 1 - Supervision
  COMERCIAL_ECONORTE: 'comercial_econorte',
  COORDINADOR_RECOLECCION: 'coordinador_recoleccion',
  OPERADOR_BASCULA: 'operador_bascula',
  SUPERVISOR_PLANTA: 'supervisor_planta',
  PROFESIONAL_SST: 'profesional_sst',
  PROFESIONAL_CALIDAD: 'profesional_calidad',
  PROFESIONAL_AMBIENTAL: 'profesional_ambiental',

  // Nivel 0 - Operativo
  RECOLECTOR_ECONORTE: 'recolector_econorte',
  AUXILIAR_OPERACIONES: 'auxiliar_operaciones',
} as const;

// ==================== CODIGOS DE ROLES ====================

export const RoleCodes = {
  // Roles administrativos
  SUPERADMIN: 'superadmin',
  ADMIN_SISTEMA: 'admin_sistema',

  // Roles de aprobacion
  APROBADOR_RECOLECCIONES: 'aprobador_recolecciones',
  APROBADOR_RECEPCIONES: 'aprobador_recepciones',
  APROBADOR_COMPRAS: 'aprobador_compras',

  // Roles operativos
  GESTOR_PROGRAMACIONES: 'gestor_programaciones',
  GESTOR_PROVEEDORES: 'gestor_proveedores',
  GESTOR_ECOALIADOS: 'gestor_ecoaliados',

  // Roles de consulta
  VISUALIZADOR: 'visualizador',
  REPORTEADOR: 'reporteador',
} as const;

// ==================== CODIGOS DE GRUPOS ====================

export const GroupCodes = {
  EQUIPO_RECOLECCIONES: 'equipo_recolecciones',
  EQUIPO_COMPRAS: 'equipo_compras',
  EQUIPO_CALIDAD: 'equipo_calidad',
  EQUIPO_OPERACIONES: 'equipo_operaciones',
  EQUIPO_ADMINISTRACION: 'equipo_administracion',
  EQUIPO_SST: 'equipo_sst',
} as const;

// ==================== NIVELES DE CARGO ====================

export const CargoLevels = {
  OPERATIVO: 0,
  SUPERVISION: 1,
  COORDINACION: 2,
  DIRECCION: 3,
} as const;

// ==================== TIPOS ====================

export type PermissionCode = string;
export type CargoCode = (typeof CargoCodes)[keyof typeof CargoCodes];
export type RoleCode = (typeof RoleCodes)[keyof typeof RoleCodes];
export type GroupCode = (typeof GroupCodes)[keyof typeof GroupCodes];
export type CargoLevel = (typeof CargoLevels)[keyof typeof CargoLevels];

// ==================== HELPERS ====================

/**
 * Agrupa cargos que tienen permisos de lectura en un modulo
 */
export const VIEWERS_CARGOS: CargoCode[] = [
  CargoCodes.GERENTE_GENERAL,
  CargoCodes.GERENTE,
  CargoCodes.ADMIN,
  CargoCodes.LIDER_COMERCIAL,
  CargoCodes.LIDER_COMPRAS,
  CargoCodes.LIDER_COMERCIAL_ECONORTE,
  CargoCodes.LIDER_LOGISTICA_ECONORTE,
  CargoCodes.LIDER_CALIDAD,
  CargoCodes.LIDER_SST,
  CargoCodes.LIDER_TALENTO_HUMANO,
  CargoCodes.CONTADOR,
  CargoCodes.JEFE_PLANTA,
];

/**
 * Cargos del equipo EcoNorte (recolecciones)
 */
export const ECONORTE_CARGOS: CargoCode[] = [
  CargoCodes.LIDER_COMERCIAL_ECONORTE,
  CargoCodes.LIDER_LOGISTICA_ECONORTE,
  CargoCodes.COMERCIAL_ECONORTE,
  CargoCodes.RECOLECTOR_ECONORTE,
];

/**
 * Cargos del equipo de Planta
 */
export const PLANTA_CARGOS: CargoCode[] = [
  CargoCodes.JEFE_PLANTA,
  CargoCodes.SUPERVISOR_PLANTA,
  CargoCodes.OPERADOR_BASCULA,
];

/**
 * Cargos de Gestion Integral (SST, Calidad, Ambiental)
 */
export const GESTION_INTEGRAL_CARGOS: CargoCode[] = [
  CargoCodes.LIDER_SST,
  CargoCodes.LIDER_CALIDAD,
  CargoCodes.PROFESIONAL_SST,
  CargoCodes.PROFESIONAL_CALIDAD,
  CargoCodes.PROFESIONAL_AMBIENTAL,
];

/**
 * Cargos con nivel de coordinacion o superior
 */
export const COORDINATION_LEVEL_CARGOS: CargoCode[] = [
  CargoCodes.GERENTE_GENERAL,
  CargoCodes.GERENTE,
  CargoCodes.ADMIN,
  CargoCodes.LIDER_COMERCIAL,
  CargoCodes.LIDER_COMPRAS,
  CargoCodes.LIDER_COMERCIAL_ECONORTE,
  CargoCodes.LIDER_LOGISTICA_ECONORTE,
  CargoCodes.LIDER_CALIDAD,
  CargoCodes.LIDER_SST,
  CargoCodes.LIDER_TALENTO_HUMANO,
  CargoCodes.CONTADOR,
  CargoCodes.JEFE_PLANTA,
];
