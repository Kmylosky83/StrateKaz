/**
 * Hook unificado para gestión de Políticas
 * Sistema de Gestión StrateKaz v3.0
 *
 * Este hook reemplaza los hooks legacy de políticas integrales y específicas
 * con una API unificada y dinámica.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type {
  Politica,
  CreatePoliticaDTO,
  UpdatePoliticaDTO,
  PoliticaFilters,
  TipoPolitica,
  NormaISO,
  PoliticasResponse,
  ConfiguracionFlujoFirma,
} from '../types/policies.types';

// ============================================================================
// API BASE
// ============================================================================

// Sistema unificado v3.0 - usa politicas especificas como base
// Las "políticas integrales" ahora son simplemente políticas con tipo_politica='INTEGRAL'
const API_POLITICAS = '/gestion-estrategica/identidad/politicas-especificas';
const API_NORMAS = '/gestion-estrategica/configuracion/normas-iso';
const API_WORKFLOWS = '/gestion-estrategica/identidad/workflow';

// Configuracion dinamica de Identidad Corporativa (reemplaza CHOICES hardcodeados)
const API_CONFIG_BASE = '/identidad/config';
const API_CONFIG_TIPOS = `${API_CONFIG_BASE}/tipos-politica`;
const API_CONFIG_ESTADOS = `${API_CONFIG_BASE}/estados-politica`;
const API_CONFIG_ROLES_FIRMA = `${API_CONFIG_BASE}/roles-firmante`;
const API_CONFIG_ESTADOS_FIRMA = `${API_CONFIG_BASE}/estados-firma`;
const API_CONFIG_ALL = `${API_CONFIG_BASE}/all`;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const politicaKeys = {
  // Políticas
  all: ['politicas'] as const,
  lists: () => [...politicaKeys.all, 'list'] as const,
  list: (filters?: PoliticaFilters) => [...politicaKeys.lists(), filters] as const,
  details: () => [...politicaKeys.all, 'detail'] as const,
  detail: (id: number) => [...politicaKeys.details(), id] as const,
  vigentes: () => [...politicaKeys.all, 'vigentes'] as const,
  pendingReview: () => [...politicaKeys.all, 'pending-review'] as const,
  byTipo: (tipoId: number) => [...politicaKeys.all, 'by-tipo', tipoId] as const,

  // Tipos de política
  tipos: () => ['tipos-politica'] as const,
  tipo: (id: number) => ['tipos-politica', id] as const,

  // Normas ISO
  normas: () => ['normas-iso'] as const,
  normasActivas: () => ['normas-iso', 'activas'] as const,

  // Workflows
  workflows: () => ['flujos-firma'] as const,
  workflow: (id: number) => ['flujos-firma', id] as const,
};

// ============================================================================
// TIPOS DE POLÍTICA HOOKS
// ============================================================================

/**
 * Lista todos los tipos de politica disponibles desde configuracion dinamica
 * Endpoint: GET /api/identidad/config/tipos-politica/
 *
 * Los tipos están configurados en backend via seed_config_identidad:
 * INTEGRAL, SST, CALIDAD, AMBIENTAL, SEGURIDAD_INFO, VIAL, ANTISOBORNO, CONTABLE, ADMINISTRATIVA, OTRAS
 */
export const useTiposPolitica = () => {
  return useQuery({
    queryKey: politicaKeys.tipos(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ results: TipoPolitica[] } | TipoPolitica[]>(
        `${API_CONFIG_TIPOS}/`
      );
      // El endpoint puede retornar array directo o paginado
      return Array.isArray(data) ? data : data.results;
    },
    staleTime: 10 * 60 * 1000, // 10 min - tipos cambian poco
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Obtiene un tipo de politica por ID
 */
export const useTipoPolitica = (id: number) => {
  return useQuery({
    queryKey: politicaKeys.tipo(id),
    queryFn: async () => {
      const { data } = await apiClient.get<TipoPolitica>(`${API_CONFIG_TIPOS}/${id}/`);
      return data;
    },
    enabled: !!id,
  });
};

/**
 * Obtiene toda la configuracion de Identidad en una sola llamada
 * Endpoint: GET /api/identidad/config/all/
 */
export const useIdentidadConfig = () => {
  return useQuery({
    queryKey: ['identidad-config'],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        estados_politica: Array<{ code: string; label: string; color: string; bg_color: string }>;
        tipos_politica: TipoPolitica[];
        roles_firmante: Array<{ code: string; label: string; es_obligatorio: boolean }>;
        estados_firma: Array<{ code: string; label: string; color: string }>;
      }>(`${API_CONFIG_ALL}/`);
      return data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Obtiene estados de politica desde configuracion dinamica
 */
export const useEstadosPolitica = () => {
  return useQuery({
    queryKey: ['estados-politica'],
    queryFn: async () => {
      const { data } = await apiClient.get<Array<{
        code: string;
        label: string;
        color: string;
        bg_color: string;
        icon: string;
        es_editable: boolean;
        permite_firma: boolean;
        transiciones_permitidas: string[];
      }>>(`${API_CONFIG_ESTADOS}/`);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Obtiene roles de firmante desde configuracion dinamica
 */
export const useRolesFirmante = () => {
  return useQuery({
    queryKey: ['roles-firmante'],
    queryFn: async () => {
      const { data } = await apiClient.get<Array<{
        code: string;
        label: string;
        es_obligatorio: boolean;
        puede_delegar: boolean;
        icon: string;
        color: string;
      }>>(`${API_CONFIG_ROLES_FIRMA}/`);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Obtiene estados de firma desde configuracion dinamica
 */
export const useEstadosFirma = () => {
  return useQuery({
    queryKey: ['estados-firma'],
    queryFn: async () => {
      const { data } = await apiClient.get<Array<{
        code: string;
        label: string;
        color: string;
        bg_color: string;
        icon: string;
        es_estado_final: boolean;
        es_positivo: boolean;
      }>>(`${API_CONFIG_ESTADOS_FIRMA}/`);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

// ============================================================================
// NORMAS ISO HOOKS
// ============================================================================

/**
 * Lista todas las normas ISO
 */
export const useNormasISO = () => {
  return useQuery({
    queryKey: politicaKeys.normas(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ results: NormaISO[] }>(`${API_NORMAS}/`);
      return data.results;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Lista solo normas ISO activas (para selects)
 */
export const useNormasISOActivas = () => {
  return useQuery({
    queryKey: politicaKeys.normasActivas(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ results: NormaISO[] }>(`${API_NORMAS}/`, {
        params: { is_active: true },
      });
      return data.results;
    },
    staleTime: 10 * 60 * 1000,
  });
};

// ============================================================================
// WORKFLOWS HOOKS
// ============================================================================

/**
 * Lista todos los flujos de firma
 */
export const useWorkflowsFirma = () => {
  return useQuery({
    queryKey: politicaKeys.workflows(),
    queryFn: async () => {
      const { data } = await apiClient.get<ConfiguracionFlujoFirma[]>(`${API_WORKFLOWS}/`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================================================
// POLÍTICAS HOOKS - QUERIES
// ============================================================================

/**
 * Lista políticas con filtros opcionales
 */
export const usePoliticas = (filters?: PoliticaFilters) => {
  return useQuery({
    queryKey: politicaKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PoliticasResponse>(`${API_POLITICAS}/`, {
        params: filters,
      });
      return data;
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Obtiene una política por ID
 */
export const usePolitica = (id: number) => {
  return useQuery({
    queryKey: politicaKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Politica>(`${API_POLITICAS}/${id}/`);
      return data;
    },
    enabled: !!id,
  });
};

/**
 * Lista solo políticas vigentes
 */
export const usePoliticasVigentes = (identityId?: number) => {
  return useQuery({
    queryKey: politicaKeys.vigentes(),
    queryFn: async () => {
      const { data } = await apiClient.get<PoliticasResponse>(`${API_POLITICAS}/vigentes/`, {
        params: identityId ? { identity: identityId } : undefined,
      });
      return data.results;
    },
  });
};

/**
 * Lista políticas que necesitan revisión
 */
export const usePoliticasPendingReview = (identityId?: number) => {
  return useQuery({
    queryKey: politicaKeys.pendingReview(),
    queryFn: async () => {
      const { data } = await apiClient.get<PoliticasResponse>(`${API_POLITICAS}/pending_review/`, {
        params: identityId ? { identity: identityId } : undefined,
      });
      return data.results;
    },
  });
};

/**
 * Lista políticas por tipo
 */
export const usePoliticasByTipo = (tipoId: number, identityId?: number) => {
  return useQuery({
    queryKey: politicaKeys.byTipo(tipoId),
    queryFn: async () => {
      const { data } = await apiClient.get<PoliticasResponse>(`${API_POLITICAS}/`, {
        params: { tipo_id: tipoId, identity: identityId },
      });
      return data.results;
    },
    enabled: !!tipoId,
  });
};

// ============================================================================
// POLÍTICAS HOOKS - MUTATIONS
// ============================================================================

/**
 * Mapea el DTO del frontend al formato que espera el backend de PoliticaEspecifica
 *
 * IMPORTANTE: El campo `code` NO se genera aquí.
 * El código oficial de la política se asigna en el GESTOR DOCUMENTAL
 * cuando la política firmada se envía para codificación y publicación.
 *
 * Flujo: BORRADOR → EN_REVISION (firma) → FIRMADO → Enviar a Documental → VIGENTE (con código)
 */
const mapCreateDTOToBackend = (dto: CreatePoliticaDTO) => {
  return {
    identity: dto.identity,
    // code: NO SE ENVÍA - El Gestor Documental asigna el código oficial (POL-SST-001, etc.)
    title: dto.title,
    content: dto.content,
    version: dto.version || '1.0',
    status: 'BORRADOR',
    effective_date: dto.effective_date || null,
    review_date: dto.review_date || null,
    // El backend usa norma_iso (FK single), tomamos la primera
    norma_iso: dto.normas_aplicables_ids?.[0] || null,
    area: dto.area_id || null,
    responsible_cargo: dto.responsible_cargo_id || null,
    orden: dto.orden || 0,
    is_active: true,
  };
};

/**
 * Crea una nueva política
 */
export const useCreatePolitica = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePoliticaDTO) => {
      const backendDTO = mapCreateDTOToBackend(dto);
      const { data } = await apiClient.post<Politica>(`${API_POLITICAS}/`, backendDTO);
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: politicaKeys.lists() });
      toast.success('Política creada exitosamente');
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: Record<string, string[]> } };
      const errorDetail = axiosError?.response?.data;
      if (errorDetail && typeof errorDetail === 'object') {
        // Mostrar el primer error del backend
        const firstError = Object.entries(errorDetail)[0];
        if (firstError) {
          toast.error(`${firstError[0]}: ${firstError[1]}`);
          return;
        }
      }
      toast.error('Error al crear la política');
    },
  });
};

/**
 * Mapea el DTO de update del frontend al formato del backend
 *
 * NOTA: El campo `code` NO se puede modificar desde el frontend.
 * El código es asignado por el Gestor Documental y es de solo lectura.
 */
const mapUpdateDTOToBackend = (dto: UpdatePoliticaDTO) => {
  const backendDTO: Record<string, unknown> = {};

  if (dto.title !== undefined) backendDTO.title = dto.title;
  if (dto.content !== undefined) backendDTO.content = dto.content;
  // code: NO SE ACTUALIZA - Es asignado por el Gestor Documental (read-only)
  if (dto.version !== undefined) backendDTO.version = dto.version;
  if (dto.status !== undefined) backendDTO.status = dto.status;
  if (dto.effective_date !== undefined) backendDTO.effective_date = dto.effective_date;
  if (dto.review_date !== undefined) backendDTO.review_date = dto.review_date;
  if (dto.normas_aplicables_ids !== undefined) {
    backendDTO.norma_iso = dto.normas_aplicables_ids[0] || null;
  }
  if (dto.area_id !== undefined) backendDTO.area = dto.area_id;
  if (dto.responsible_cargo_id !== undefined) backendDTO.responsible_cargo = dto.responsible_cargo_id;
  if (dto.orden !== undefined) backendDTO.orden = dto.orden;
  if (dto.is_active !== undefined) backendDTO.is_active = dto.is_active;

  return backendDTO;
};

/**
 * Actualiza una política existente
 */
export const useUpdatePolitica = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePoliticaDTO }) => {
      const backendDTO = mapUpdateDTOToBackend(data);
      const { data: response } = await apiClient.patch<Politica>(`${API_POLITICAS}/${id}/`, backendDTO);
      return response;
    },
    onSuccess: async (_, { id }) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: politicaKeys.lists() }),
        queryClient.refetchQueries({ queryKey: politicaKeys.detail(id) }),
      ]);
      toast.success('Política actualizada exitosamente');
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: Record<string, string[]> } };
      const errorDetail = axiosError?.response?.data;
      if (errorDetail && typeof errorDetail === 'object') {
        const firstError = Object.entries(errorDetail)[0];
        if (firstError) {
          toast.error(`${firstError[0]}: ${firstError[1]}`);
          return;
        }
      }
      toast.error('Error al actualizar la política');
    },
  });
};

/**
 * Elimina una política
 */
export const useDeletePolitica = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`${API_POLITICAS}/${id}/`);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: politicaKeys.lists() });
      toast.success('Política eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la política');
    },
  });
};

// ============================================================================
// INTEGRACIÓN CON GESTOR DOCUMENTAL (Flujo simplificado v4.0)
// ============================================================================

/**
 * Envía una política en BORRADOR al Gestor Documental.
 *
 * Flujo simplificado v4.0:
 * 1. IDENTIDAD: Política creada en BORRADOR
 * 2. Usuario hace clic en "Enviar a Gestión"
 * 3. Estado cambia a EN_GESTION (ya no editable desde Identidad)
 * 4. GESTOR DOCUMENTAL: Maneja firma, codificación, publicación
 * 5. Callback desde Gestor Documental actualiza estado a VIGENTE
 *
 * NOTA: Todo el workflow de firmas se maneja en Gestor Documental.
 * Identidad solo crea y envía políticas.
 */
export const useEnviarAGestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (politicaId: number) => {
      const { data } = await apiClient.post(
        `${API_POLITICAS}/${politicaId}/enviar-a-gestion/`
      );
      return data;
    },
    onSuccess: async (data, politicaId) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: politicaKeys.lists() }),
        queryClient.refetchQueries({ queryKey: politicaKeys.detail(politicaId) }),
      ]);
      toast.success(data.mensaje || 'Política enviada a gestión documental');
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const message = axiosError?.response?.data?.detail || 'Error al enviar la política a gestión';
      toast.error(message);
    },
  });
};

// ============================================================================
// VERSIONAMIENTO DE POLÍTICAS
// ============================================================================

/**
 * DTO para crear nueva versión de una política
 */
interface CrearNuevaVersionDTO {
  change_reason?: string;
}

/**
 * Respuesta del endpoint crear-nueva-version
 */
interface NuevaVersionResponse {
  detail: string;
  nueva_politica_id: number;
  version_anterior: string;
  version_nueva: string;
  status: string;
  mensaje: string;
  politica_original: {
    id: number;
    version: string;
    status: string;
    code: string | null;
  };
  siguiente_paso: string;
  politica: Politica;
}

/**
 * Crea una nueva versión de una política VIGENTE.
 *
 * Flujo de versionamiento:
 * 1. Política VIGENTE (POL-SST-001 v1.0)
 * 2. Usuario solicita nueva versión con motivo de cambio
 * 3. Se crea COPIA de la política como BORRADOR con versión incrementada (v2.0)
 * 4. El usuario edita la nueva versión si es necesario
 * 5. La nueva versión pasa por el mismo proceso de firma
 * 6. Al publicar, la versión anterior pasa a OBSOLETO
 * 7. El Gestor Documental recibe la nueva versión con el MISMO código
 *
 * IMPORTANTE: Solo funciona con políticas en estado VIGENTE
 */
export const useCrearNuevaVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      politicaId,
      dto = {},
    }: {
      politicaId: number;
      dto?: CrearNuevaVersionDTO;
    }) => {
      const { data } = await apiClient.post<NuevaVersionResponse>(
        `${API_POLITICAS}/${politicaId}/crear-nueva-version/`,
        dto
      );
      return data;
    },
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ queryKey: politicaKeys.lists() });
      toast.success(
        `Nueva versión ${data.version_nueva} creada. La versión anterior (${data.version_anterior}) se marcará como obsoleta cuando publique la nueva.`
      );
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string; mensaje?: string } } };
      const message =
        axiosError?.response?.data?.detail ||
        axiosError?.response?.data?.mensaje ||
        'Error al crear nueva versión de la política';
      toast.error(message);
    },
  });
};

/**
 * Verifica si una política puede ser editada directamente.
 *
 * Estados v4.0 (simplificado):
 * - BORRADOR: Editable directamente (único estado editable)
 * - EN_GESTION: NO editable (enviada al Gestor Documental)
 * - VIGENTE: NO editable (usar crear-nueva-version)
 * - OBSOLETO: NO editable (versión histórica)
 *
 * NOTA: El flujo de firmas se maneja completamente en Gestor Documental.
 * Identidad solo crea políticas en BORRADOR y las envía.
 */
export const usePuedeEditarPolitica = (status: string) => {
  const puedeEditar = status === 'BORRADOR';
  const necesitaNuevaVersion = status === 'VIGENTE';
  const enGestion = status === 'EN_GESTION';
  const esHistorico = status === 'OBSOLETO';

  let mensaje = '';
  if (enGestion) {
    mensaje = 'La política está en gestión documental. El flujo de firmas se maneja desde allí.';
  } else if (necesitaNuevaVersion) {
    mensaje = 'Para modificar esta política, debe crear una nueva versión.';
  } else if (esHistorico) {
    mensaje = 'Las políticas obsoletas no pueden ser editadas.';
  }

  return {
    puedeEditar,
    necesitaNuevaVersion,
    enGestion,
    esHistorico,
    mensaje,
  };
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Hook para obtener el color del status de una política
 *
 * Estados v4.0:
 * - BORRADOR: Gris (en edición)
 * - EN_GESTION: Azul (en Gestor Documental)
 * - VIGENTE: Verde (publicada)
 * - OBSOLETO: Rojo (versión anterior)
 */
export const usePoliticaStatusColor = (status: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    BORRADOR: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
    EN_GESTION: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    VIGENTE: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    OBSOLETO: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    // Estados legacy para retrocompatibilidad
    EN_REVISION: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    FIRMADO: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  };
  return colors[status] || colors.BORRADOR;
};
