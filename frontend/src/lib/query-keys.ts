/**
 * Factory de Query Keys para TanStack Query
 *
 * Centraliza la creación de query keys para evitar
 * boilerplate repetitivo en cada hook.
 *
 * @example
 * // En un hook:
 * const kpiKeys = createQueryKeys('kpis');
 * // Uso:
 * useQuery({ queryKey: kpiKeys.list({ status: 'active' }), ... });
 * useQuery({ queryKey: kpiKeys.detail(id), ... });
 *
 * // En mutaciones:
 * queryClient.invalidateQueries({ queryKey: kpiKeys.all });
 */

/**
 * Tipo para query key array
 */
export type QueryKey = readonly unknown[];

/**
 * Configuración generada por createQueryKeys
 */
export interface QueryKeyConfig<TFilters = Record<string, unknown>> {
  /** Clave raíz del recurso */
  all: readonly [string];
  /** Todas las listas (para invalidación) */
  lists: () => readonly [string, 'list'];
  /** Lista con filtros específicos */
  list: (filters?: TFilters) => readonly [string, 'list', TFilters | undefined];
  /** Todos los detalles (para invalidación) */
  details: () => readonly [string, 'detail'];
  /** Detalle por ID */
  detail: (id: number | string) => readonly [string, 'detail', number | string];
  /** Clave personalizada con sufijo */
  custom: (...args: unknown[]) => readonly [string, ...unknown[]];
}

/**
 * Crea un conjunto de query keys para un recurso
 *
 * @param resource - Nombre del recurso (ej: 'kpis', 'objetivos', 'areas')
 * @returns Objeto con métodos para generar query keys
 *
 * @example
 * const objetivosKeys = createQueryKeys('objetivos');
 *
 * // Usar en queries
 * useQuery({
 *   queryKey: objetivosKeys.list({ planId: 1 }),
 *   queryFn: () => api.getObjetivos({ planId: 1 })
 * });
 *
 * // Usar en mutaciones para invalidar
 * useMutation({
 *   mutationFn: api.createObjetivo,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: objetivosKeys.lists() });
 *   }
 * });
 */
export function createQueryKeys<TFilters = Record<string, unknown>>(
  resource: string
): QueryKeyConfig<TFilters> {
  return {
    all: [resource] as const,
    lists: () => [resource, 'list'] as const,
    list: (filters?: TFilters) => [resource, 'list', filters] as const,
    details: () => [resource, 'detail'] as const,
    detail: (id: number | string) => [resource, 'detail', id] as const,
    custom: (...args: unknown[]) => [resource, ...args] as const,
  };
}

/**
 * Query keys predefinidos para módulos comunes de gestión estratégica
 */
export const queryKeys = {
  // Identidad Corporativa
  corporateIdentity: createQueryKeys('corporate-identity'),
  corporateValues: createQueryKeys('corporate-values'),
  policies: createQueryKeys('policies'),

  // Organización
  areas: createQueryKeys('areas'),
  cargos: createQueryKeys('cargos'),
  colaboradores: createQueryKeys('colaboradores'),
  sedes: createQueryKeys('sedes'),
  normasIso: createQueryKeys('normas_iso'),
  unidadesMedida: createQueryKeys('unidades-medida'),
  consecutivos: createQueryKeys('consecutivos'),

  // Planeación
  strategicPlans: createQueryKeys('strategic-plans'),
  objectives: createQueryKeys('objectives'),
  kpis: createQueryKeys('kpis'),
  medicionesKpi: createQueryKeys('mediciones-kpi'),
  mapasEstrategicos: createQueryKeys('mapas-estrategicos'),

  // Contexto
  analisisDofa: createQueryKeys('analisis-dofa'),
  factoresDofa: createQueryKeys('factores-dofa'),
  analisisPestel: createQueryKeys('analisis-pestel'),
  factoresPestel: createQueryKeys('factores-pestel'),
  fuerzasPorter: createQueryKeys('fuerzas-porter'),
  estrategiasTows: createQueryKeys('estrategias-tows'),
  partesInteresadas: createQueryKeys('partes-interesadas'),
  tiposParteInteresada: createQueryKeys('tipos-parte-interesada'),

  // Gestión del Cambio
  gestionCambio: createQueryKeys('gestion-cambio'),

  // Proyectos
  proyectos: createQueryKeys('proyectos'),
  fasesProyecto: createQueryKeys('fases-proyecto'),
  tareasProyecto: createQueryKeys('tareas-proyecto'),

  // Revisión por la Dirección
  programacionesRevision: createQueryKeys('programaciones-revision'),
  actasRevision: createQueryKeys('actas-revision'),
  compromisosRevision: createQueryKeys('compromisos-revision'),

  // Encuestas
  encuestasDofa: createQueryKeys('encuestas-dofa'),
  temasEncuesta: createQueryKeys('temas-encuesta'),
  respuestasEncuesta: createQueryKeys('respuestas-encuesta'),

  // Core
  systemModules: createQueryKeys('system-modules'),
  branding: createQueryKeys('branding'),
  empresa: createQueryKeys('empresa'),

  // Talent Hub
  peopleAnalytics: createQueryKeys('people-analytics'),
} as const;

/**
 * Helper para crear query key con namespace
 *
 * @example
 * const key = withNamespace('gestion-estrategica', 'objetivos', { planId: 1 });
 * // Result: ['gestion-estrategica', 'objetivos', { planId: 1 }]
 */
export function withNamespace(
  namespace: string,
  ...parts: unknown[]
): readonly [string, ...unknown[]] {
  return [namespace, ...parts] as const;
}

/**
 * Helper para invalidar múltiples query keys relacionados
 *
 * @example
 * import { QueryClient } from '@tanstack/react-query';
 *
 * const invalidateRelated = (queryClient: QueryClient) => {
 *   invalidateMultiple(queryClient, [
 *     queryKeys.objectives.lists(),
 *     queryKeys.kpis.lists(),
 *     queryKeys.strategicPlans.detail(planId),
 *   ]);
 * };
 */
export function invalidateMultiple(
  queryClient: { invalidateQueries: (options: { queryKey: QueryKey }) => void },
  keys: QueryKey[]
): void {
  keys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}
