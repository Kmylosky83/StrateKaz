/**
 * Hooks para Valores Vividos (Conexión Valor-Acción)
 * ===================================================
 *
 * API para:
 * - Vincular valores corporativos a acciones del sistema
 * - Obtener estadísticas para el módulo de BI
 * - Métricas de tendencia y ranking
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// =============================================================================
// TIPOS
// =============================================================================

export type CategoriaAccion =
  | 'PROYECTO'
  | 'OBJETIVO'
  | 'INICIATIVA'
  | 'ACCION_CORRECTIVA'
  | 'ACCION_PREVENTIVA'
  | 'ACCION_MEJORA'
  | 'OPORTUNIDAD_MEJORA'
  | 'GESTION_CAMBIO'
  | 'INVESTIGACION_INCIDENTE'
  | 'INSPECCION'
  | 'HALLAZGO_AUDITORIA'
  | 'NO_CONFORMIDAD'
  | 'ACCION_PESV'
  | 'OTRO';

export type TipoVinculo = 'REFLEJA' | 'PROMUEVE' | 'RESULTADO' | 'MEJORA';

export type NivelImpacto = 'BAJO' | 'MEDIO' | 'ALTO' | 'MUY_ALTO';

export interface ValorVivido {
  id: number;
  valor: number;
  valor_nombre: string;
  valor_icon: string | null;
  content_type: number;
  content_type_label: string;
  object_id: number;
  accion_titulo: string;
  categoria_accion: CategoriaAccion;
  categoria_display: string;
  tipo_vinculo: TipoVinculo;
  tipo_vinculo_display: string;
  impacto: NivelImpacto;
  impacto_display: string;
  puntaje: number;
  fecha_vinculacion: string;
  vinculado_por_nombre: string | null;
  area_nombre: string | null;
  verificado: boolean;
  created_at: string;
}

export interface ValorVividoDetail extends ValorVivido {
  valor_info: {
    id: number;
    name: string;
    icon: string | null;
    description: string;
  };
  content_type_info: {
    id: number;
    app_label: string;
    model: string;
    label: string;
  };
  justificacion: string;
  evidencia: string | null;
  archivo_evidencia: string | null;
  vinculado_por_info: {
    id: number;
    nombre: string;
    email: string;
  } | null;
  verificado_por_info: {
    id: number;
    nombre: string;
  } | null;
  fecha_verificacion: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export interface VincularValorPayload {
  valor_id: number;
  content_type: string;
  object_id: number;
  categoria_accion: CategoriaAccion;
  tipo_vinculo?: TipoVinculo;
  impacto?: NivelImpacto;
  justificacion: string;
  evidencia?: string;
  area_id?: number;
}

export interface VincularMultiplesPayload {
  valores_ids: number[];
  content_type: string;
  object_id: number;
  categoria_accion: CategoriaAccion;
  tipo_vinculo?: TipoVinculo;
  impacto?: NivelImpacto;
  justificacion: string;
}

// Estadísticas para BI
export interface EstadisticaValor {
  valor__id: number;
  valor__name: string;
  valor__icon: string | null;
  total_acciones: number;
  impacto_bajo: number;
  impacto_medio: number;
  impacto_alto: number;
  impacto_muy_alto: number;
  porcentaje_alto_impacto: number;
}

export interface TendenciaMensual {
  mes: string;
  valor__id: number;
  valor__name: string;
  total: number;
}

export interface RankingCategoria {
  categoria_accion: CategoriaAccion;
  categoria_display: string;
  total: number;
  porcentaje: number;
}

export interface ValorSubrepresentado {
  valor_id: number;
  valor_nombre: string;
  total_acciones: number;
  deficit: number;
  porcentaje_cumplimiento: number;
}

export interface ResumenValoresVividos {
  total_vinculos: number;
  total_valores_activos: number;
  valores_con_acciones: number;
  valores_sin_acciones: number;
  promedio_acciones_por_valor: number;
  puntaje_promedio: number;
  por_impacto: Record<string, number>;
  por_categoria: RankingCategoria[];
  top_valores: EstadisticaValor[];
  valores_subrepresentados: ValorSubrepresentado[];
}

export interface ConfiguracionMetricaValor {
  id: number;
  empresa: number;
  acciones_minimas_mensual: number;
  puntaje_minimo_promedio: number;
  alertar_valores_bajos: boolean;
  umbral_alerta_acciones: number;
  categorias_prioritarias: string[];
  pesos_tipo_vinculo: Record<string, number>;
  meses_analisis: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// API BASE PATH
// =============================================================================

const API_PATH = '/api/gestion-estrategica/identidad/bi';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const valoresVividosKeys = {
  all: ['valores-vividos'] as const,
  lists: () => [...valoresVividosKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...valoresVividosKeys.lists(), filters] as const,
  detail: (id: number) => [...valoresVividosKeys.all, 'detail', id] as const,
  porAccion: (contentType: string, objectId: number) =>
    [...valoresVividosKeys.all, 'por-accion', contentType, objectId] as const,
  porValor: (valorId: number) =>
    [...valoresVividosKeys.all, 'por-valor', valorId] as const,
  // BI
  estadisticas: (filters?: Record<string, unknown>) =>
    [...valoresVividosKeys.all, 'estadisticas', filters] as const,
  tendencia: (meses?: number) =>
    [...valoresVividosKeys.all, 'tendencia', meses] as const,
  rankingCategorias: (valorId?: number) =>
    [...valoresVividosKeys.all, 'ranking', valorId] as const,
  subrepresentados: (umbral?: number) =>
    [...valoresVividosKeys.all, 'subrepresentados', umbral] as const,
  resumen: () => [...valoresVividosKeys.all, 'resumen'] as const,
  config: () => [...valoresVividosKeys.all, 'config'] as const,
};

// =============================================================================
// HOOKS DE CONSULTA (QUERY)
// =============================================================================

interface UseValoresVividosParams {
  valor?: number;
  categoria_accion?: CategoriaAccion;
  impacto?: NivelImpacto;
  verificado?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
}

/**
 * Lista de valores vividos con filtros
 */
export const useValoresVividos = (params?: UseValoresVividosParams) => {
  return useQuery({
    queryKey: valoresVividosKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<{ results: ValorVivido[]; count: number }>(
        `${API_PATH}/valores-vividos/`,
        { params }
      );
      return data;
    },
  });
};

/**
 * Detalle de un valor vivido
 */
export const useValorVividoDetail = (id: number) => {
  return useQuery({
    queryKey: valoresVividosKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ValorVividoDetail>(
        `${API_PATH}/valores-vividos/${id}/`
      );
      return data;
    },
    enabled: id > 0,
  });
};

/**
 * Valores vinculados a una acción específica
 */
export const useValoresPorAccion = (contentType: string, objectId: number) => {
  return useQuery({
    queryKey: valoresVividosKeys.porAccion(contentType, objectId),
    queryFn: async () => {
      const { data } = await api.get<{
        count: number;
        accion: { content_type: string; object_id: string };
        valores: ValorVivido[];
      }>(`${API_PATH}/valores-vividos/por-accion/${contentType}/${objectId}/`);
      return data;
    },
    enabled: !!contentType && objectId > 0,
  });
};

/**
 * Acciones vinculadas a un valor específico
 */
export const useAccionesPorValor = (
  valorId: number,
  params?: { categoria?: CategoriaAccion; fecha_desde?: string }
) => {
  return useQuery({
    queryKey: valoresVividosKeys.porValor(valorId),
    queryFn: async () => {
      const { data } = await api.get<{
        count: number;
        valor: { id: number; name: string };
        acciones: ValorVivido[];
      }>(`${API_PATH}/valores-vividos/por-valor/${valorId}/`, { params });
      return data;
    },
    enabled: valorId > 0,
  });
};

// =============================================================================
// HOOKS DE BI (ESTADÍSTICAS)
// =============================================================================

interface UseEstadisticasParams {
  fecha_desde?: string;
  fecha_hasta?: string;
}

/**
 * Estadísticas por valor corporativo
 */
export const useEstadisticasValores = (params?: UseEstadisticasParams) => {
  return useQuery({
    queryKey: valoresVividosKeys.estadisticas(params),
    queryFn: async () => {
      const { data } = await api.get<EstadisticaValor[]>(
        `${API_PATH}/valores-vividos/estadisticas/`,
        { params }
      );
      return data;
    },
  });
};

/**
 * Tendencia mensual de valores vividos
 */
export const useTendenciaValores = (meses = 12) => {
  return useQuery({
    queryKey: valoresVividosKeys.tendencia(meses),
    queryFn: async () => {
      const { data } = await api.get<TendenciaMensual[]>(
        `${API_PATH}/valores-vividos/tendencia/`,
        { params: { meses } }
      );
      return data;
    },
  });
};

/**
 * Ranking de categorías de acciones
 */
export const useRankingCategorias = (valorId?: number) => {
  return useQuery({
    queryKey: valoresVividosKeys.rankingCategorias(valorId),
    queryFn: async () => {
      const { data } = await api.get<RankingCategoria[]>(
        `${API_PATH}/valores-vividos/ranking-categorias/`,
        { params: valorId ? { valor_id: valorId } : undefined }
      );
      return data;
    },
  });
};

/**
 * Valores subrepresentados (con pocas acciones)
 */
export const useValoresSubrepresentados = (umbral = 5) => {
  return useQuery({
    queryKey: valoresVividosKeys.subrepresentados(umbral),
    queryFn: async () => {
      const { data } = await api.get<ValorSubrepresentado[]>(
        `${API_PATH}/valores-vividos/subrepresentados/`,
        { params: { umbral } }
      );
      return data;
    },
  });
};

/**
 * Resumen ejecutivo para dashboard BI
 */
export const useResumenValoresVividos = () => {
  return useQuery({
    queryKey: valoresVividosKeys.resumen(),
    queryFn: async () => {
      const { data } = await api.get<ResumenValoresVividos>(
        `${API_PATH}/valores-vividos/resumen/`
      );
      return data;
    },
  });
};

/**
 * Configuración de métricas de la empresa
 */
export const useConfiguracionMetricas = () => {
  return useQuery({
    queryKey: valoresVividosKeys.config(),
    queryFn: async () => {
      const { data } = await api.get<ConfiguracionMetricaValor>(
        `${API_PATH}/config-metricas/mi-configuracion/`
      );
      return data;
    },
  });
};

// =============================================================================
// HOOKS DE MUTACIÓN
// =============================================================================

/**
 * Vincular un valor a una acción
 */
export const useVincularValor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: VincularValorPayload) => {
      const { data } = await api.post<ValorVividoDetail>(
        `${API_PATH}/valores-vividos/vincular/`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valoresVividosKeys.all });
    },
  });
};

/**
 * Vincular múltiples valores a una acción
 */
export const useVincularMultiplesValores = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: VincularMultiplesPayload) => {
      const { data } = await api.post<{
        creados: number;
        existentes: number;
        vinculos: ValorVividoDetail[];
      }>(`${API_PATH}/valores-vividos/vincular-multiples/`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valoresVividosKeys.all });
    },
  });
};

/**
 * Verificar un vínculo valor-acción
 */
export const useVerificarValorVivido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      observaciones,
    }: {
      id: number;
      observaciones?: string;
    }) => {
      const { data } = await api.post<ValorVividoDetail>(
        `${API_PATH}/valores-vividos/${id}/verificar/`,
        { observaciones }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valoresVividosKeys.all });
    },
  });
};

/**
 * Actualizar un valor vivido
 */
export const useUpdateValorVivido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data: updateData,
    }: {
      id: number;
      data: Partial<{
        tipo_vinculo: TipoVinculo;
        impacto: NivelImpacto;
        justificacion: string;
        evidencia: string;
        area: number;
      }>;
    }) => {
      const { data } = await api.patch<ValorVividoDetail>(
        `${API_PATH}/valores-vividos/${id}/`,
        updateData
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: valoresVividosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: valoresVividosKeys.lists() });
    },
  });
};

/**
 * Eliminar un vínculo (soft delete)
 */
export const useDeleteValorVivido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${API_PATH}/valores-vividos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valoresVividosKeys.all });
    },
  });
};

/**
 * Actualizar configuración de métricas
 */
export const useUpdateConfiguracionMetricas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data: updateData,
    }: {
      id: number;
      data: Partial<Omit<ConfiguracionMetricaValor, 'id' | 'empresa' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data } = await api.patch<ConfiguracionMetricaValor>(
        `${API_PATH}/config-metricas/${id}/`,
        updateData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valoresVividosKeys.config() });
    },
  });
};

// =============================================================================
// CONSTANTES PARA UI
// =============================================================================

export const CATEGORIAS_ACCION_OPTIONS: { value: CategoriaAccion; label: string }[] = [
  { value: 'PROYECTO', label: 'Proyecto' },
  { value: 'OBJETIVO', label: 'Objetivo Estratégico' },
  { value: 'INICIATIVA', label: 'Iniciativa' },
  { value: 'ACCION_CORRECTIVA', label: 'Acción Correctiva' },
  { value: 'ACCION_PREVENTIVA', label: 'Acción Preventiva' },
  { value: 'ACCION_MEJORA', label: 'Acción de Mejora' },
  { value: 'OPORTUNIDAD_MEJORA', label: 'Oportunidad de Mejora' },
  { value: 'GESTION_CAMBIO', label: 'Gestión del Cambio' },
  { value: 'INVESTIGACION_INCIDENTE', label: 'Investigación de Incidente' },
  { value: 'INSPECCION', label: 'Inspección' },
  { value: 'HALLAZGO_AUDITORIA', label: 'Hallazgo de Auditoría' },
  { value: 'NO_CONFORMIDAD', label: 'No Conformidad' },
  { value: 'ACCION_PESV', label: 'Acción PESV' },
  { value: 'OTRO', label: 'Otro' },
];

export const TIPOS_VINCULO_OPTIONS: { value: TipoVinculo; label: string; description: string }[] = [
  { value: 'REFLEJA', label: 'Refleja el valor', description: 'La acción ejemplifica el valor' },
  { value: 'PROMUEVE', label: 'Promueve el valor', description: 'La acción fomenta el valor' },
  { value: 'RESULTADO', label: 'Es resultado del valor', description: 'La acción es consecuencia del valor' },
  { value: 'MEJORA', label: 'Mejora el valor', description: 'La acción fortalece el valor' },
];

export const NIVELES_IMPACTO_OPTIONS: {
  value: NivelImpacto;
  label: string;
  puntaje: number;
  color: string;
}[] = [
  { value: 'BAJO', label: 'Bajo', puntaje: 2, color: 'text-gray-500' },
  { value: 'MEDIO', label: 'Medio', puntaje: 5, color: 'text-yellow-500' },
  { value: 'ALTO', label: 'Alto', puntaje: 8, color: 'text-orange-500' },
  { value: 'MUY_ALTO', label: 'Muy Alto', puntaje: 10, color: 'text-red-500' },
];
