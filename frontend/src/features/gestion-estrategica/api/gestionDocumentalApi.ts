/**
 * API Client para Gestion Documental - Gestion Estrategica (N1)
 * Sistema de Gestion StrateKaz
 *
 * Migrado desde: features/hseq/api/sistemaDocumentalApi.ts
 * NOTA: FirmaDocumento eliminado - usar workflow_engine.firma_digital
 */
import { apiClient } from '@/lib/api-client';
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
} from '../types/gestion-documental.types';
import type { PaginatedResponse } from '@/types';

// Nueva ruta base en Gestion Estrategica (N1)
const BASE_URL = '/api/gestion-estrategica/gestion-documental';

// ==================== TIPO DOCUMENTO ====================

export const tipoDocumentoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    nivel_documento?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<TipoDocumento>> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-documento/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoDocumento> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-documento/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoDocumentoDTO): Promise<TipoDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/tipos-documento/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoDocumentoDTO): Promise<TipoDocumento> => {
    const response = await apiClient.patch(`${BASE_URL}/tipos-documento/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-documento/${id}/`);
  },

  listActive: async (): Promise<TipoDocumento[]> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-documento/`, {
      params: { is_active: true },
    });
    return response.data.results || response.data;
  },
};

// ==================== PLANTILLA DOCUMENTO ====================

export const plantillaDocumentoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_documento?: number;
    tipo_plantilla?: string;
    estado?: string;
  }): Promise<PaginatedResponse<PlantillaDocumento>> => {
    const response = await apiClient.get(`${BASE_URL}/plantillas/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PlantillaDocumento> => {
    const response = await apiClient.get(`${BASE_URL}/plantillas/${id}/`);
    return response.data;
  },

  create: async (data: CreatePlantillaDocumentoDTO): Promise<PlantillaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/plantillas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePlantillaDocumentoDTO): Promise<PlantillaDocumento> => {
    const response = await apiClient.patch(`${BASE_URL}/plantillas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/plantillas/${id}/`);
  },

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
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_documento?: number;
    estado?: string;
    clasificacion?: string;
    fecha_creacion_desde?: string;
    fecha_creacion_hasta?: string;
    elaborado_por?: number;
  }): Promise<PaginatedResponse<Documento>> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Documento> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/${id}/`);
    return response.data;
  },

  create: async (data: CreateDocumentoDTO): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateDocumentoDTO): Promise<Documento> => {
    const response = await apiClient.patch(`${BASE_URL}/documentos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/documentos/${id}/`);
  },

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
    data: {
      motivo: string;
      documento_sustituto_id?: number;
    }
  ): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/marcar-obsoleto/`, data);
    return response.data;
  },

  enviarRevision: async (
    id: number,
    data: {
      revisores: number[];
      mensaje?: string;
    }
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
  }): Promise<Documento[]> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/listado-maestro/`, { params });
    return response.data;
  },

  /**
   * Obtener firmas digitales del documento (usa workflow_engine.firma_digital)
   */
  getFirmas: async (id: number): Promise<unknown[]> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/${id}/firmas/`);
    return response.data;
  },

  /**
   * Estadísticas del sistema documental
   */
  estadisticas: async (): Promise<EstadisticasDocumentales> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/estadisticas/`);
    return response.data;
  },
};

// ==================== VERSION DOCUMENTO ====================

export const versionDocumentoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    documento?: number;
  }): Promise<PaginatedResponse<VersionDocumento>> => {
    const response = await apiClient.get(`${BASE_URL}/versiones/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<VersionDocumento> => {
    const response = await apiClient.get(`${BASE_URL}/versiones/${id}/`);
    return response.data;
  },

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
    diferencias: Array<{
      campo: string;
      valor_anterior: string;
      valor_nuevo: string;
    }>;
  }> => {
    const response = await apiClient.get(`${BASE_URL}/versiones/${versionId1}/comparar/`, {
      params: { version2_id: versionId2 },
    });
    return response.data;
  },
};

// ==================== CAMPO FORMULARIO ====================

export const campoFormularioApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    plantilla?: number;
    tipo_documento?: number;
    is_active?: boolean;
  }): Promise<PaginatedResponse<CampoFormulario>> => {
    const response = await apiClient.get(`${BASE_URL}/campos-formulario/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<CampoFormulario> => {
    const response = await apiClient.get(`${BASE_URL}/campos-formulario/${id}/`);
    return response.data;
  },

  create: async (data: CreateCampoFormularioDTO): Promise<CampoFormulario> => {
    const response = await apiClient.post(`${BASE_URL}/campos-formulario/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCampoFormularioDTO): Promise<CampoFormulario> => {
    const response = await apiClient.patch(`${BASE_URL}/campos-formulario/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/campos-formulario/${id}/`);
  },

  reordenar: async (
    data: Array<{
      id: number;
      orden: number;
    }>
  ): Promise<CampoFormulario[]> => {
    const response = await apiClient.post(`${BASE_URL}/campos-formulario/reordenar/`, {
      campos: data,
    });
    return response.data;
  },
};

// ==================== CONTROL DOCUMENTAL ====================

export const controlDocumentalApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    documento?: number;
    tipo_control?: string;
    fecha_distribucion_desde?: string;
    fecha_distribucion_hasta?: string;
  }): Promise<PaginatedResponse<ControlDocumental>> => {
    const response = await apiClient.get(`${BASE_URL}/controles/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ControlDocumental> => {
    const response = await apiClient.get(`${BASE_URL}/controles/${id}/`);
    return response.data;
  },

  create: async (data: CreateControlDocumentalDTO): Promise<ControlDocumental> => {
    const response = await apiClient.post(`${BASE_URL}/controles/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateControlDocumentalDTO): Promise<ControlDocumental> => {
    const response = await apiClient.patch(`${BASE_URL}/controles/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/controles/${id}/`);
  },

  confirmarRecepcion: async (
    id: number,
    data?: {
      comentarios?: string;
      fecha_recepcion?: string;
    }
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
