/**
 * Endpoints de API centralizados para Gestión Estratégica
 *
 * Define todas las rutas base de la API para evitar hardcoding
 * y facilitar cambios de estructura de URLs.
 *
 * Convención:
 * - Rutas relativas a apiClient.baseURL (que incluye /api)
 * - Sin trailing slash en las constantes (se agrega en las funciones)
 */

/**
 * Endpoints base por módulo
 */
export const API_ENDPOINTS = {
  // Core del sistema
  CORE: '/core',

  // Gestión Estratégica - Submódulos
  IDENTIDAD: '/identidad',
  PLANEACION: '/planeacion',
  CONFIGURACION: '/configuracion',
  ORGANIZACION: '/organizacion',

  // Contexto Organizacional (módulo independiente)
  CONTEXTO: '/gestion-estrategica/contexto',

  // Encuestas DOFA
  ENCUESTAS: '/encuestas-dofa',

  // Revisión por la Dirección
  REVISION_DIRECCION: '/revision-direccion',

  // Proyectos
  PROYECTOS: '/gestion-proyectos',
} as const;

/**
 * Construye URL completa para un recurso
 */
export const buildEndpoint = (base: keyof typeof API_ENDPOINTS, path = ''): string => {
  const baseUrl = API_ENDPOINTS[base];
  if (!path) return baseUrl;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Endpoints específicos por recurso
 * Organizados por módulo para fácil navegación
 */
export const RESOURCE_ENDPOINTS = {
  // === IDENTIDAD ===
  CORPORATE_IDENTITY: `${API_ENDPOINTS.IDENTIDAD}/corporate-identity`,
  CORPORATE_VALUES: `${API_ENDPOINTS.IDENTIDAD}/corporate-values`,
  POLITICAS_ESPECIFICAS: `${API_ENDPOINTS.IDENTIDAD}/politicas-especificas`,
  ALCANCES_SISTEMA: `${API_ENDPOINTS.IDENTIDAD}/alcances-sistema`,

  // === CONFIGURACIÓN ===
  NORMAS_ISO: `${API_ENDPOINTS.CONFIGURACION}/normas-iso`,
  SEDES: `${API_ENDPOINTS.CONFIGURACION}/sedes`,
  INTEGRACIONES: `${API_ENDPOINTS.CONFIGURACION}/integraciones`,

  // === ORGANIZACIÓN ===
  UNIDADES_MEDIDA: `${API_ENDPOINTS.ORGANIZACION}/unidades-medida`,
  CONSECUTIVOS: `${API_ENDPOINTS.ORGANIZACION}/consecutivos`,
  AREAS: `${API_ENDPOINTS.ORGANIZACION}/areas`,

  // === PLANEACIÓN ===
  STRATEGIC_PLANS: `${API_ENDPOINTS.PLANEACION}/strategic-plans`,
  STRATEGIC_OBJECTIVES: `${API_ENDPOINTS.PLANEACION}/objetivos`,
  MAPAS_ESTRATEGICOS: `${API_ENDPOINTS.PLANEACION}/mapas`,
  KPIS: `${API_ENDPOINTS.PLANEACION}/kpis`,
  GESTION_CAMBIO: `${API_ENDPOINTS.PLANEACION}/cambios`,

  // === CONTEXTO ===
  ANALISIS_DOFA: `${API_ENDPOINTS.CONTEXTO}/analisis-dofa`,
  FACTORES_DOFA: `${API_ENDPOINTS.CONTEXTO}/factores-dofa`,
  ANALISIS_PESTEL: `${API_ENDPOINTS.CONTEXTO}/analisis-pestel`,
  FACTORES_PESTEL: `${API_ENDPOINTS.CONTEXTO}/factores-pestel`,
  FUERZAS_PORTER: `${API_ENDPOINTS.CONTEXTO}/fuerzas-porter`,
  ESTRATEGIAS_TOWS: `${API_ENDPOINTS.CONTEXTO}/estrategias-tows`,
  TIPOS_PARTE_INTERESADA: `${API_ENDPOINTS.CONTEXTO}/tipos-parte-interesada`,
  PARTES_INTERESADAS: `${API_ENDPOINTS.CONTEXTO}/partes-interesadas`,

  // === CORE ===
  SYSTEM_MODULES: `${API_ENDPOINTS.CORE}/system-modules`,
  BRANDING: `${API_ENDPOINTS.CORE}/branding`,
  STRATEGIC_STATS: `${API_ENDPOINTS.CORE}/strategic-stats`,

  // === REVISIÓN POR LA DIRECCIÓN ===
  REVISIONES: `${API_ENDPOINTS.REVISION_DIRECCION}/revisiones`,
  COMPROMISOS: `${API_ENDPOINTS.REVISION_DIRECCION}/compromisos`,
} as const;

export type ResourceEndpoint = keyof typeof RESOURCE_ENDPOINTS;
