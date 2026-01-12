/**
 * useWorkflowFirmas Hook
 *
 * Hook especializado para el workflow de firmas digitales de políticas
 * y documentos de identidad corporativa.
 *
 * Características:
 * - Integración con backend de workflow de firmas
 * - Gestión de firmas pendientes del usuario
 * - Creación de procesos de firma con múltiples firmantes
 * - Verificación de integridad (SHA-256)
 * - Cache con TanStack Query
 *
 * @example
 * ```tsx
 * const {
 *   firmasPendientes,
 *   crearProcesoFirma,
 *   firmarDocumento,
 *   verificarIntegridad,
 *   isLoading
 * } = useWorkflowFirmas();
 *
 * // Obtener firmas pendientes
 * const { data: pendientes } = firmasPendientes();
 *
 * // Crear proceso de firma para una política
 * await crearProcesoFirma({
 *   content_type: 'politica_integral',
 *   object_id: 123,
 *   firmantes: [1, 2, 3],
 *   requiere_orden: true
 * });
 *
 * // Firmar documento
 * await firmarDocumento(firmaId, signatureData);
 * ```
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { SignatureData } from '@/components/modals/SignatureModal';

// ==================== TYPES ====================

export interface FirmaDigital {
  id: number;
  // Referencia al documento
  content_type: number;
  content_type_model?: string;
  object_id: number;
  // Firmante
  firmante: number;
  firmante_name?: string;
  firmante_email?: string;
  rol_firma: 'APROBO' | 'REVISO' | 'ELABORO' | 'FIRMO';
  rol_firma_display?: string;
  // Estado
  status: 'PENDIENTE' | 'FIRMADO' | 'RECHAZADO' | 'DELEGADO';
  status_display?: string;
  orden: number;
  es_mi_turno: boolean;
  // Firma
  firma_base64?: string | null;
  firma_hash?: string | null;
  fecha_firma?: string | null;
  observaciones?: string | null;
  // Rechazo/Delegación
  motivo_rechazo?: string | null;
  delegado_a?: number | null;
  delegado_a_name?: string | null;
  motivo_delegacion?: string | null;
  // Auditoría
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracionWorkflowFirma {
  id: number;
  content_type: number;
  object_id: number;
  requiere_firma: boolean;
  requiere_orden: boolean;
  notificar_firmantes: boolean;
  dias_recordatorio: number;
  created_at: string;
  updated_at: string;
}

export interface FirmaPendiente {
  id: number;
  documento_tipo: string;
  documento_id: number;
  documento_titulo: string;
  rol_firma: string;
  rol_firma_display: string;
  orden: number;
  es_mi_turno: boolean;
  fecha_limite?: string | null;
  dias_pendiente: number;
}

export interface FirmaEstadisticas {
  total_firmas: number;
  pendientes: number;
  firmadas: number;
  rechazadas: number;
  delegadas: number;
  promedio_dias_firma: number;
  tasa_aprobacion: number;
}

// ==================== DTO TYPES ====================

export interface CreateProcesoFirmaDTO {
  content_type: number;
  object_id: number;
  firmantes: Array<{
    firmante_id: number;
    rol_firma: 'APROBO' | 'REVISO' | 'ELABORO' | 'FIRMO';
    orden?: number;
  }>;
  requiere_orden?: boolean;
  notificar_firmantes?: boolean;
  dias_recordatorio?: number;
}

export interface FirmarDocumentoDTO {
  firma_base64: string;
  firma_hash?: string;
  observaciones?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface RechazarFirmaDTO {
  motivo: string;
}

export interface DelegarFirmaDTO {
  nuevo_firmante_id: number;
  motivo: string;
}

// ==================== HOOK ====================

/**
 * Hook principal para gestión de workflow de firmas
 */
export function useWorkflowFirmas() {
  const queryClient = useQueryClient();

  // ==================== QUERIES ====================

  /**
   * Obtener firmas pendientes del usuario actual
   */
  const useFirmasPendientes = (esMiTurno?: boolean) => {
    return useQuery<FirmaPendiente[]>({
      queryKey: ['firmas-pendientes', esMiTurno],
      queryFn: async () => {
        const params = esMiTurno !== undefined ? { es_mi_turno: esMiTurno } : {};
        const response = await api.get<FirmaPendiente[]>(
          '/api/gestion-estrategica/identidad/workflow/firmas-digitales/mis-firmas-pendientes/',
          { params }
        );
        return response.data;
      },
    });
  };

  /**
   * Obtener detalle de una firma
   */
  const useFirmaDigital = (firmaId?: number) => {
    return useQuery<FirmaDigital>({
      queryKey: ['firma-digital', firmaId],
      queryFn: async () => {
        const response = await api.get<FirmaDigital>(
          `/api/gestion-estrategica/identidad/workflow/firmas-digitales/${firmaId}/`
        );
        return response.data;
      },
      enabled: !!firmaId,
    });
  };

  /**
   * Obtener firmas de un documento específico
   */
  const useFirmasDocumento = (contentType?: number, objectId?: number) => {
    return useQuery<FirmaDigital[]>({
      queryKey: ['firmas-documento', contentType, objectId],
      queryFn: async () => {
        const response = await api.get<FirmaDigital[]>(
          `/api/gestion-estrategica/identidad/workflow/firmas-digitales/documento/${contentType}/${objectId}/`
        );
        return response.data;
      },
      enabled: !!contentType && !!objectId,
    });
  };

  /**
   * Obtener estadísticas de firmas
   */
  const useEstadisticasFirmas = (fechaDesde?: string, fechaHasta?: string) => {
    return useQuery<FirmaEstadisticas>({
      queryKey: ['estadisticas-firmas', fechaDesde, fechaHasta],
      queryFn: async () => {
        const params: Record<string, string> = {};
        if (fechaDesde) params.fecha_desde = fechaDesde;
        if (fechaHasta) params.fecha_hasta = fechaHasta;

        const response = await api.get<FirmaEstadisticas>(
          '/api/gestion-estrategica/identidad/workflow/firmas-digitales/estadisticas/',
          { params }
        );
        return response.data;
      },
    });
  };

  // ==================== MUTATIONS ====================

  /**
   * Crear proceso de firma para un documento
   */
  const crearProcesoFirmaMutation = useMutation({
    mutationFn: async (data: CreateProcesoFirmaDTO) => {
      const response = await api.post<ConfiguracionWorkflowFirma>(
        '/api/gestion-estrategica/identidad/workflow/workflow-firmas/',
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar firmas del documento
      queryClient.invalidateQueries({
        queryKey: ['firmas-documento', variables.content_type, variables.object_id],
      });
      // Invalidar firmas pendientes
      queryClient.invalidateQueries({ queryKey: ['firmas-pendientes'] });
    },
  });

  /**
   * Firmar documento con SignatureData del modal
   */
  const firmarDocumentoMutation = useMutation({
    mutationFn: async ({
      firmaId,
      signatureData,
    }: {
      firmaId: number;
      signatureData: SignatureData;
    }) => {
      const dto: FirmarDocumentoDTO = {
        firma_base64: signatureData.signatureDataUrl,
        firma_hash: signatureData.signatureHash,
        observaciones: signatureData.metadata?.userAgent,
        ip_address: signatureData.metadata?.ipAddress,
        user_agent: signatureData.metadata?.userAgent,
      };

      const response = await api.post<FirmaDigital>(
        `/api/gestion-estrategica/identidad/workflow/firmas-digitales/${firmaId}/firmar/`,
        dto
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar firma específica
      queryClient.invalidateQueries({ queryKey: ['firma-digital', data.id] });
      // Invalidar firmas del documento
      queryClient.invalidateQueries({
        queryKey: ['firmas-documento', data.content_type, data.object_id],
      });
      // Invalidar firmas pendientes
      queryClient.invalidateQueries({ queryKey: ['firmas-pendientes'] });
      // Invalidar estadísticas
      queryClient.invalidateQueries({ queryKey: ['estadisticas-firmas'] });
    },
  });

  /**
   * Rechazar firma
   */
  const rechazarFirmaMutation = useMutation({
    mutationFn: async ({ firmaId, motivo }: { firmaId: number; motivo: string }) => {
      const response = await api.post<FirmaDigital>(
        `/api/gestion-estrategica/identidad/workflow/firmas-digitales/${firmaId}/rechazar/`,
        { motivo }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['firma-digital', data.id] });
      queryClient.invalidateQueries({
        queryKey: ['firmas-documento', data.content_type, data.object_id],
      });
      queryClient.invalidateQueries({ queryKey: ['firmas-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-firmas'] });
    },
  });

  /**
   * Delegar firma
   */
  const delegarFirmaMutation = useMutation({
    mutationFn: async ({
      firmaId,
      nuevoFirmanteId,
      motivo,
    }: {
      firmaId: number;
      nuevoFirmanteId: number;
      motivo: string;
    }) => {
      const response = await api.post<FirmaDigital>(
        `/api/gestion-estrategica/identidad/workflow/firmas-digitales/${firmaId}/delegar/`,
        {
          nuevo_firmante_id: nuevoFirmanteId,
          motivo,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['firma-digital', data.id] });
      queryClient.invalidateQueries({
        queryKey: ['firmas-documento', data.content_type, data.object_id],
      });
      queryClient.invalidateQueries({ queryKey: ['firmas-pendientes'] });
    },
  });

  /**
   * Verificar integridad de firma
   */
  const verificarIntegridadMutation = useMutation({
    mutationFn: async (firmaId: number) => {
      const response = await api.get<{ is_valid: boolean; message: string }>(
        `/api/gestion-estrategica/identidad/workflow/firmas-digitales/${firmaId}/verificar-integridad/`
      );
      return response.data;
    },
  });

  // ==================== RETURN ====================

  return {
    // Queries (hooks)
    useFirmasPendientes,
    useFirmaDigital,
    useFirmasDocumento,
    useEstadisticasFirmas,

    // Mutations (async functions)
    crearProcesoFirma: crearProcesoFirmaMutation.mutateAsync,
    firmarDocumento: firmarDocumentoMutation.mutateAsync,
    rechazarFirma: rechazarFirmaMutation.mutateAsync,
    delegarFirma: delegarFirmaMutation.mutateAsync,
    verificarIntegridad: verificarIntegridadMutation.mutateAsync,

    // Estados
    isLoading:
      crearProcesoFirmaMutation.isPending ||
      firmarDocumentoMutation.isPending ||
      rechazarFirmaMutation.isPending ||
      delegarFirmaMutation.isPending ||
      verificarIntegridadMutation.isPending,

    isFirmando: firmarDocumentoMutation.isPending,
    isRechazando: rechazarFirmaMutation.isPending,
    isDelegando: delegarFirmaMutation.isPending,
    isVerificando: verificarIntegridadMutation.isPending,

    // Errores
    firmarError: firmarDocumentoMutation.error,
    rechazarError: rechazarFirmaMutation.error,
    delegarError: delegarFirmaMutation.error,
    verificarError: verificarIntegridadMutation.error,
  };
}

/**
 * Hook simplificado para firmas de un documento específico
 */
export function useDocumentoFirmas(contentType: number, objectId: number) {
  const {
    useFirmasDocumento,
    firmarDocumento,
    crearProcesoFirma,
    isFirmando,
    firmarError,
  } = useWorkflowFirmas();

  const { data: firmas, isLoading: isLoadingFirmas } = useFirmasDocumento(contentType, objectId);

  const todasFirmadas = firmas?.every((f) => f.status === 'FIRMADO') ?? false;
  const algunaRechazada = firmas?.some((f) => f.status === 'RECHAZADO') ?? false;
  const totalFirmas = firmas?.length ?? 0;
  const firmasCompletadas = firmas?.filter((f) => f.status === 'FIRMADO').length ?? 0;

  return {
    firmas,
    todasFirmadas,
    algunaRechazada,
    totalFirmas,
    firmasCompletadas,
    progreso: totalFirmas > 0 ? (firmasCompletadas / totalFirmas) * 100 : 0,
    firmarDocumento,
    crearProcesoFirma,
    isLoading: isLoadingFirmas || isFirmando,
    error: firmarError,
  };
}

/**
 * Hook simplificado para firmas pendientes del usuario
 */
export function useMisFirmasPendientes(soloMiTurno = true) {
  const { useFirmasPendientes, firmarDocumento, isFirmando } = useWorkflowFirmas();
  const { data: firmasPendientes, isLoading } = useFirmasPendientes(soloMiTurno);

  const totalPendientes = firmasPendientes?.length ?? 0;
  const miTurno = firmasPendientes?.filter((f) => f.es_mi_turno).length ?? 0;

  return {
    firmasPendientes,
    totalPendientes,
    miTurno,
    firmarDocumento,
    isLoading: isLoading || isFirmando,
  };
}
