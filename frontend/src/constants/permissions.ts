/**
 * Constantes de permisos del sistema RBAC
 *
 * IMPORTANTE: Estos codigos deben coincidir exactamente con los del backend
 * (backend/apps/core/permissions_constants.py)
 *
 * Los permisos se verifican dinamicamente a traves de la API,
 * estas constantes solo se usan para referenciar los codigos.
 */

// ==================== CODIGOS DE MODULOS Y SECCIONES ====================

export const Modules = {
  // ── Infraestructura ──
  CORE: 'core',
  AUDIT_SYSTEM: 'audit_system',

  // ── PLANEAR ──
  FUNDACION: 'fundacion',
  GESTION_DOCUMENTAL: 'gestion_documental',
  WORKFLOW_ENGINE: 'workflow_engine',
  MI_EQUIPO: 'mi_equipo',
  PLANIFICACION_OPERATIVA: 'planificacion_operativa',
  PLANEACION_ESTRATEGICA: 'planeacion_estrategica',

  // ── HACER ──
  PROTECCION_CUMPLIMIENTO: 'proteccion_cumplimiento',
  GESTION_INTEGRAL: 'gestion_integral',
  SUPPLY_CHAIN: 'supply_chain',
  PRODUCTION_OPS: 'production_ops',
  LOGISTICS_FLEET: 'logistics_fleet',
  SALES_CRM: 'sales_crm',
  TALENT_HUB: 'talent_hub',
  ADMINISTRACION: 'administracion',
  TESORERIA: 'tesoreria',
  ACCOUNTING: 'accounting',

  // ── VERIFICAR + ACTUAR ──
  ANALYTICS: 'analytics',
  REVISION_DIRECCION: 'revision_direccion',
  ACCIONES_MEJORA: 'acciones_mejora',

  // ── INFRAESTRUCTURA ──
  CONFIGURACION_PLATAFORMA: 'configuracion_plataforma',
  CATALOGO_PRODUCTOS: 'catalogo_productos',

  // ── Legacy aliases (V1 → V2, para compatibilidad durante migración) ──
  /** @deprecated Use GESTION_INTEGRAL */
  HSEQ_MANAGEMENT: 'gestion_integral',
  /** @deprecated Use PROTECCION_CUMPLIMIENTO */
  MOTOR_CUMPLIMIENTO: 'proteccion_cumplimiento',
  /** @deprecated Use PROTECCION_CUMPLIMIENTO */
  MOTOR_RIESGOS: 'proteccion_cumplimiento',
  /** @deprecated Use GESTION_DOCUMENTAL */
  SISTEMA_GESTION: 'gestion_documental',
} as const;

export const Sections = {
  // ── CORE ──
  USERS: 'usuarios',
  USUARIOS: 'usuarios',
  COLABORADORES: 'colaboradores',
  ROLES: 'roles',
  GROUPS: 'groups',

  // ── FUNDACION — Tab 1: Mi Empresa ──
  EMPRESA: 'empresa',
  SEDES: 'sedes',
  UNIDADES_NEGOCIO: 'unidades_negocio',

  // ── FUNDACION — Tab 2: Mi Contexto e Identidad ──
  PARTES_INTERESADAS: 'partes_interesadas',
  ANALISIS_CONTEXTO: 'analisis_contexto',
  MISION_VISION: 'mision_vision',
  VALORES: 'valores',
  NORMAS_ISO: 'normas_iso',
  ALCANCE: 'alcance_sig',

  // ── FUNDACION — Tab 3: Mi Organización ──
  AREAS: 'areas',
  CARGOS: 'cargos',
  ORGANIGRAMA: 'organigrama',
  CARACTERIZACIONES: 'caracterizaciones',
  MAPA_PROCESOS: 'mapa_procesos',

  // ── CONFIGURACIÓN DE PLATAFORMA ──
  MODULOS: 'modulos',
  CONSECUTIVOS: 'consecutivos',
  CATALOGOS: 'catalogos',
  PLANTILLAS_NOTIFICACION: 'plantillas_notificacion',
  AUTOMATIZACIONES: 'automatizaciones',
  INTEGRACIONES: 'integraciones',
  IMPORTACION_EXPORTACION: 'importacion_exportacion',
  CONFIG_INDICADORES: 'config_indicadores',
  AUDITORIA_CONFIGURACION: 'auditoria_configuracion',
  UNIDADES_MEDIDA: 'unidades_medida',

  // ── FUNDACION — Legacy aliases ──
  IDENTIDAD_CORPORATIVA: 'identidad_corporativa',
  IDENTITY: 'identidad_corporativa',
  BRANDING: 'branding',
  ESTRATEGIA: 'estrategia',

  // ── GESTIÓN DOCUMENTAL (sección codes actuales) ──
  DASHBOARD_DOCUMENTAL: 'dashboard',
  REPOSITORIO: 'repositorio',
  EN_PROCESO: 'en_proceso',
  ARCHIVO: 'archivo',
  CONFIGURACION_DOCUMENTAL: 'configuracion',
  // @deprecated — usar los códigos de arriba
  TIPOS_DOCUMENTO: 'tipos_documento',
  DOCUMENTOS: 'documentos',
  CONTROL_CAMBIOS: 'control_cambios',
  DISTRIBUCION: 'distribucion',
  EJECUCION_AUDITORIA: 'ejecucion_auditoria',
  INFORMES_AUDITORIA: 'informes',

  // ── WORKFLOW ENGINE ──
  FLUJOS: 'flujos',
  INSTANCIAS: 'instancias',
  METRICAS: 'metricas',

  // ── MI EQUIPO ──
  PERFILES_CARGO: 'perfiles_cargo',
  VACANTES: 'vacantes',
  CANDIDATOS: 'candidatos',
  CONTRATACION: 'contratacion',
  DIRECTORIO: 'directorio',
  HOJA_VIDA: 'hoja_vida',
  CONTRATOS: 'contratos',
  PROGRAMAS_INDUCCION: 'programas_induccion',
  AFILIACIONES: 'afiliaciones',
  ENTREGA_DOTACION: 'entrega_dotacion',

  // ── PLANIFICACIÓN OPERATIVA ──
  PLAN_TRABAJO: 'plan_trabajo',
  PROGRAMAS: 'programas',
  RECURSOS_PROCESO: 'recursos_proceso',

  // ── PLANEACIÓN ESTRATÉGICA ──
  DOFA_ESTRATEGIAS: 'dofa_estrategias',
  OBJETIVOS_BSC: 'objetivos_bsc',
  MAPA_ESTRATEGICO: 'mapa_estrategico',
  GESTION_CAMBIO: 'gestion_cambio',
  MAPA_CALOR: 'mapa_calor',
  RIESGOS_PROCESO: 'riesgos_proceso',
  PORTAFOLIO: 'portafolio',
  INICIACION: 'iniciacion',
  PLANIFICACION: 'planificacion',
  EJECUCION_MONITOREO: 'ejecucion_monitoreo',
  CIERRE: 'cierre',
  STAKEHOLDERS: 'stakeholders',

  // ── PROTECCIÓN Y CUMPLIMIENTO ──
  NORMAS: 'normas',
  REQUISITOS: 'requisitos',
  REGLAMENTOS: 'reglamentos',
  EVALUACION: 'evaluacion',
  MATRIZ_RIESGOS: 'matriz_riesgos',
  CONTROLES: 'controles',
  IDENTIFICACION_PELIGROS: 'identificacion_peligros',
  MATRIZ_ASPECTOS: 'matriz_aspectos',
  MATRIZ_VIAL: 'matriz_vial',
  ACTIVOS_INFO: 'activos_info',
  RIESGOS_LAFT: 'riesgos_laft',
  MATRIZ_LEGAL: 'matriz_legal',
  RIESGOS_PROCESOS: 'riesgos_procesos',
  IPEVR: 'ipevr',
  ASPECTOS_AMBIENTALES: 'aspectos_ambientales',

  // ── GESTIÓN INTEGRAL (HSEQ) ──
  EXAMENES_MEDICOS: 'examenes_medicos',
  CONDICIONES_SALUD: 'condiciones_salud',
  INSPECCIONES: 'inspecciones',
  MEDICIONES: 'mediciones',
  COMITES: 'comites',
  REGISTRO_ATEL: 'registro_atel',
  INVESTIGACION: 'investigacion',
  PLAN_EMERGENCIAS: 'plan_emergencias',
  PROGRAMAS_AMBIENTALES: 'programas_ambientales',

  // ── SUPPLY CHAIN ──
  REGISTRO_PROVEEDORES: 'registro_proveedores',
  IMPORTACION_PROVEEDORES: 'importacion_proveedores',
  PRECIOS_MATERIA_PRIMA: 'precios_materia_prima',
  ORDENES_COMPRA: 'ordenes_compra',
  RECEPCION_MP_SC: 'recepcion_mp_sc',
  LIQUIDACIONES_SC: 'liquidaciones_sc',
  INVENTARIO: 'inventario',
  PROGRAMACION_SC: 'programacion_sc',
  EVALUACIONES_PROV: 'evaluaciones_prov',
  CATALOGOS_SC: 'catalogos_sc',
  PROVEEDORES: 'proveedores',

  // ── CATÁLOGO DE PRODUCTOS (CT) ──
  GESTION_PRODUCTOS: 'gestion_productos',
  GESTION_CATEGORIAS: 'gestion_categorias',
  GESTION_UNIDADES: 'gestion_unidades',

  // ── PRODUCTION OPS ──
  RECEPCION_MP: 'recepcion_mp',
  ORDENES_PRODUCCION: 'ordenes_produccion',
  PLAN_MANTENIMIENTO: 'plan_mantenimiento',
  LOTES: 'lotes',

  // ── LOGISTICS FLEET ──
  RUTAS: 'rutas',
  ORDENES_DESPACHO: 'ordenes_despacho',
  VEHICULOS: 'vehiculos',
  PESV: 'pesv',

  // ── SALES CRM ──
  CLIENTES: 'clientes',
  OPORTUNIDADES_VENTA: 'oportunidades_venta',
  PEDIDOS: 'pedidos',
  PQRS: 'pqrs',

  // ── TALENT HUB (gestión continua) ──
  PLAN_FORMACION: 'plan_formacion',
  CAPACITACIONES: 'capacitaciones',
  REINDUCCION: 'reinduccion',
  EVALUACIONES_DESEMPENO: 'evaluaciones_desempeno',
  PLANES_DESARROLLO: 'planes_desarrollo',
  TURNOS: 'turnos',
  MARCAJES: 'marcajes',
  AUSENCIAS: 'ausencias',
  REGISTRO_NOVEDADES: 'registro_novedades',
  LIQUIDACION_NOMINA: 'liquidacion_nomina',
  PRESTACIONES: 'prestaciones',
  CASOS_DISCIPLINARIOS: 'casos_disciplinarios',
  PROCESO_RETIRO: 'proceso_retiro',
  LIQUIDACION_FINAL: 'liquidacion_final',
  PAZ_SALVO: 'paz_salvo',
  CONSULTORES_EXTERNOS: 'consultores_externos',

  // ── ADMINISTRACIÓN ──
  INVENTARIO_ACTIVOS: 'inventario_activos',
  HOJAS_VIDA: 'hojas_vida',
  DEPRECIACION: 'depreciacion',
  GESTION_SERVICIOS: 'gestion_servicios',
  PARTIDAS_PRESUPUESTALES: 'partidas_presupuestales',
  EJECUCION_PRESUPUESTAL: 'ejecucion_presupuestal',

  // ── TESORERÍA ──
  FLUJO_CAJA: 'flujo_caja',
  CUENTAS_BANCARIAS: 'cuentas_bancarias',
  PAGOS_PROVEEDORES: 'pagos_proveedores',
  PAGOS_NOMINA: 'pagos_nomina',
  PAGOS_HONORARIOS: 'pagos_honorarios',

  // ── ACCOUNTING ──
  PLAN_CUENTAS: 'plan_cuentas',
  CENTROS_COSTO: 'centros_costo',
  PERIODOS_CONTABLES: 'periodos_contables',
  COMPROBANTES: 'comprobantes',
  LIBRO_DIARIO: 'libro_diario',
  BALANCE_GENERAL: 'balance_general',
  ESTADO_RESULTADOS: 'estado_resultados',
  INTEGRACION_CONTABLE: 'integracion_contable',

  // ── ANALYTICS ──
  TABLEROS: 'tableros',
  INDICADORES: 'indicadores',
  MEDICIONES_IND: 'mediciones',
  TENDENCIAS: 'tendencias',
  PLANTILLAS_INFORME: 'plantillas_informe',
  ACCIONES_MEJORA_IND: 'acciones_mejora_ind',
  TIPOS_INDICADOR: 'tipos_indicador',
  FUENTES_DATOS: 'fuentes_datos',
  EXPORTACION: 'exportacion',

  // ── REVISIÓN POR LA DIRECCIÓN ──
  PROGRAMACION_REVISION: 'programacion',
  ACTAS: 'actas',
  COMPROMISOS: 'compromisos',

  // ── ACCIONES DE MEJORA ──
  NO_CONFORMIDADES: 'no_conformidades',
  ACCIONES_CORRECTIVAS: 'acciones_correctivas',
  ACCIONES_PREVENTIVAS: 'acciones_preventivas',
  OPORTUNIDADES_MEJORA: 'oportunidades_mejora',

  // ── AUDIT SYSTEM (Infraestructura) ──
  LOGS_AUDITORIA: 'logs_auditoria',
  NOTIFICACIONES: 'notificaciones',
  REGLAS_ALERTA: 'reglas_alerta',
  TAREAS: 'tareas',
} as const;

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
  LIDER_CALIDAD: 'lider_calidad',
  LIDER_SST: 'lider_sst',
  LIDER_TALENTO_HUMANO: 'lider_talento_humano',
  CONTADOR: 'contador',
  JEFE_PLANTA: 'jefe_planta',

  // Nivel 1 - Supervision
  COORDINADOR_RECOLECCION: 'coordinador_recoleccion',
  OPERADOR_BASCULA: 'operador_bascula',
  SUPERVISOR_PLANTA: 'supervisor_planta',
  PROFESIONAL_SST: 'profesional_sst',
  PROFESIONAL_CALIDAD: 'profesional_calidad',
  PROFESIONAL_AMBIENTAL: 'profesional_ambiental',

  // Nivel 0 - Operativo
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
  CargoCodes.LIDER_CALIDAD,
  CargoCodes.LIDER_SST,
  CargoCodes.LIDER_TALENTO_HUMANO,
  CargoCodes.CONTADOR,
  CargoCodes.JEFE_PLANTA,
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
  CargoCodes.LIDER_CALIDAD,
  CargoCodes.LIDER_SST,
  CargoCodes.LIDER_TALENTO_HUMANO,
  CargoCodes.CONTADOR,
  CargoCodes.JEFE_PLANTA,
];
