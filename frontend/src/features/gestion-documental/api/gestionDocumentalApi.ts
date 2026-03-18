/**
 * API Client para Gestion Documental - Gestion Estrategica (N1)
 * Sistema de Gestion StrateKaz
 *
 * Usa createApiClient factory para CRUD basico (~5 lineas por entidad).
 * Metodos custom se agregan con spread operator.
 */
import { apiClient } from '@/lib/api-client';
import { createApiClient } from '@/lib/api-factory';
import type {
  TipoDocumento,
  PlantillaDocumento,
  Documento,
  VersionDocumento,
  CampoFormulario,
  ControlDocumental,
  CreateTipoDocumentoDTO,
  UpdateTipoDocumentoDTO,
  CreatePlantillaDocumentoDTO,
  UpdatePlantillaDocumentoDTO,
  CreateDocumentoDTO,
  UpdateDocumentoDTO,
  CreateCampoFormularioDTO,
  UpdateCampoFormularioDTO,
  CreateControlDocumentalDTO,
  UpdateControlDocumentalDTO,
  EstadisticasDocumentales,
  BusquedaTextoResult,
} from '../types/gestion-documental.types';

const BASE_URL = '/gestion-estrategica/gestion-documental';

// ==================== TIPO DOCUMENTO ====================

export const tipoDocumentoApi = {
  ...createApiClient<TipoDocumento, CreateTipoDocumentoDTO, UpdateTipoDocumentoDTO>(
    BASE_URL,
    'tipos-documento'
  ),
  listActive: async (): Promise<TipoDocumento[]> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-documento/`, {
      params: { is_active: true },
    });
    return response.data.results || response.data;
  },
};

// ==================== PLANTILLA DOCUMENTO ====================

export const plantillaDocumentoApi = {
  ...createApiClient<PlantillaDocumento, CreatePlantillaDocumentoDTO, UpdatePlantillaDocumentoDTO>(
    BASE_URL,
    'plantillas'
  ),
  activar: async (id: number): Promise<PlantillaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/plantillas/${id}/activar/`);
    return response.data;
  },
  marcarObsoleta: async (id: number, motivo?: string): Promise<PlantillaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/plantillas/${id}/marcar-obsoleta/`, {
      motivo,
    });
    return response.data;
  },
};

// ==================== DOCUMENTO ====================

export const documentoApi = {
  ...createApiClient<Documento, CreateDocumentoDTO, UpdateDocumentoDTO>(BASE_URL, 'documentos'),

  aprobar: async (id: number, observaciones?: string): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/aprobar/`, {
      observaciones,
    });
    return response.data;
  },
  publicar: async (id: number, fecha_vigencia?: string): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/publicar/`, {
      fecha_vigencia,
    });
    return response.data;
  },
  marcarObsoleto: async (
    id: number,
    data: { motivo: string; documento_sustituto_id?: number }
  ): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/marcar-obsoleto/`, data);
    return response.data;
  },
  enviarRevision: async (
    id: number,
    data: { revisores: number[]; mensaje?: string }
  ): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/enviar-revision/`, data);
    return response.data;
  },
  pendientesRevision: async (): Promise<Documento[]> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/pendientes-revision/`);
    return response.data;
  },
  listadoMaestro: async (params?: {
    tipo_documento?: number;
    estado?: string;
    formato?: 'json' | 'pdf' | 'excel';
  }): Promise<Record<string, { tipo: string; documentos: Documento[] }>> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/listado-maestro/`, { params });
    return response.data;
  },
  getFirmas: async (id: number): Promise<unknown[]> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/${id}/firmas/`);
    return response.data;
  },
  estadoFirmas: async (
    id: number
  ): Promise<{
    total: number;
    firmadas: number;
    pendientes: number;
    rechazadas: number;
    puede_publicar: boolean;
  }> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/${id}/estado-firmas/`);
    return response.data;
  },
  estadisticas: async (): Promise<EstadisticasDocumentales> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/estadisticas/`);
    return response.data;
  },
  exportPdf: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/export/documento/${id}/pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },
  exportDocx: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/export/documento/${id}/docx/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // OCR — Fase 5
  ingestarExterno: async (data: FormData): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/ingestar-externo/`, data);
    return response.data;
  },
  reprocesarOcr: async (id: number): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/reprocesar-ocr/`);
    return response.data;
  },
  busquedaTexto: async (q: string): Promise<BusquedaTextoResult[]> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/busqueda-texto/`, {
      params: { q },
    });
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
};

// ==================== VERSION DOCUMENTO ====================

export const versionDocumentoApi = {
  ...createApiClient<VersionDocumento>(BASE_URL, 'versiones'),

  porDocumento: async (documentoId: number): Promise<VersionDocumento[]> => {
    const response = await apiClient.get(`${BASE_URL}/versiones/`, {
      params: { documento: documentoId },
    });
    return response.data.results || response.data;
  },
  comparar: async (
    versionId1: number,
    versionId2: number
  ): Promise<{
    version1: VersionDocumento;
    version2: VersionDocumento;
    diferencias: Array<{ campo: string; valor_anterior: string; valor_nuevo: string }>;
  }> => {
    const response = await apiClient.get(`${BASE_URL}/versiones/${versionId1}/comparar/`, {
      params: { version2_id: versionId2 },
    });
    return response.data;
  },
};

// ==================== CAMPO FORMULARIO ====================

export const campoFormularioApi = {
  ...createApiClient<CampoFormulario, CreateCampoFormularioDTO, UpdateCampoFormularioDTO>(
    BASE_URL,
    'campos-formulario'
  ),
  reordenar: async (data: Array<{ id: number; orden: number }>): Promise<CampoFormulario[]> => {
    const response = await apiClient.post(`${BASE_URL}/campos-formulario/reordenar/`, {
      campos: data,
    });
    return response.data;
  },
};

// ==================== CONTROL DOCUMENTAL ====================

export const controlDocumentalApi = {
  ...createApiClient<ControlDocumental, CreateControlDocumentalDTO, UpdateControlDocumentalDTO>(
    BASE_URL,
    'controles'
  ),
  confirmarRecepcion: async (
    id: number,
    data?: { comentarios?: string; fecha_recepcion?: string }
  ): Promise<ControlDocumental> => {
    const response = await apiClient.post(`${BASE_URL}/controles/${id}/confirmar-recepcion/`, data);
    return response.data;
  },
  distribucionesActivas: async (): Promise<ControlDocumental[]> => {
    const response = await apiClient.get(`${BASE_URL}/controles/distribuciones-activas/`);
    return response.data;
  },
};

// ==================== EXPORTACION POR DEFECTO ====================

const gestionDocumentalApi = {
  tipoDocumento: tipoDocumentoApi,
  plantillaDocumento: plantillaDocumentoApi,
  documento: documentoApi,
  versionDocumento: versionDocumentoApi,
  campoFormulario: campoFormularioApi,
  controlDocumental: controlDocumentalApi,
};

export default gestionDocumentalApi;
