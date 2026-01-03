/**
 * API Client para Sistema Documental - HSEQ Management
 * Sistema de Gestión StrateKaz
 */
import { apiClient } from '@/lib/api-client';
import type {
  TipoDocumento,
  PlantillaDocumento,
  Documento,
  VersionDocumento,
  CampoFormulario,
  FirmaDocumento,
  ControlDocumental,
  CreateTipoDocumentoDTO,
  UpdateTipoDocumentoDTO,
  CreatePlantillaDocumentoDTO,
  UpdatePlantillaDocumentoDTO,
  CreateDocumentoDTO,
  UpdateDocumentoDTO,
  CreateVersionDocumentoDTO,
  UpdateVersionDocumentoDTO,
  CreateCampoFormularioDTO,
  UpdateCampoFormularioDTO,
  CreateFirmaDocumentoDTO,
  UpdateFirmaDocumentoDTO,
  CreateControlDocumentalDTO,
  UpdateControlDocumentalDTO,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/api/hseq/sistema-documental';

// ==================== TIPO DOCUMENTO ====================

export const tipoDocumentoApi = {
  /**
   * Obtener todos los tipos de documento
   */
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

  /**
   * Obtener un tipo de documento por ID
   */
  getById: async (id: number): Promise<TipoDocumento> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-documento/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo tipo de documento
   */
  create: async (data: CreateTipoDocumentoDTO): Promise<TipoDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/tipos-documento/`, data);
    return response.data;
  },

  /**
   * Actualizar un tipo de documento
   */
  update: async (id: number, data: UpdateTipoDocumentoDTO): Promise<TipoDocumento> => {
    const response = await apiClient.patch(`${BASE_URL}/tipos-documento/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un tipo de documento
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-documento/${id}/`);
  },

  /**
   * Obtener tipos de documento activos
   */
  listActive: async (): Promise<TipoDocumento[]> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-documento/`, {
      params: { is_active: true },
    });
    return response.data.results || response.data;
  },
};

// ==================== PLANTILLA DOCUMENTO ====================

export const plantillaDocumentoApi = {
  /**
   * Obtener todas las plantillas de documento
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_documento?: number;
    tipo_plantilla?: string;
    estado?: string;
  }): Promise<PaginatedResponse<PlantillaDocumento>> => {
    const response = await apiClient.get(`${BASE_URL}/plantillas-documento/`, { params });
    return response.data;
  },

  /**
   * Obtener una plantilla de documento por ID
   */
  getById: async (id: number): Promise<PlantillaDocumento> => {
    const response = await apiClient.get(`${BASE_URL}/plantillas-documento/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva plantilla de documento
   */
  create: async (data: CreatePlantillaDocumentoDTO): Promise<PlantillaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/plantillas-documento/`, data);
    return response.data;
  },

  /**
   * Actualizar una plantilla de documento
   */
  update: async (id: number, data: UpdatePlantillaDocumentoDTO): Promise<PlantillaDocumento> => {
    const response = await apiClient.patch(`${BASE_URL}/plantillas-documento/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una plantilla de documento
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/plantillas-documento/${id}/`);
  },

  /**
   * Activar una plantilla (cambiar estado a ACTIVA)
   */
  activar: async (id: number): Promise<PlantillaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/plantillas-documento/${id}/activar/`);
    return response.data;
  },

  /**
   * Marcar plantilla como obsoleta
   */
  marcarObsoleta: async (id: number, motivo?: string): Promise<PlantillaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/plantillas-documento/${id}/marcar-obsoleta/`, {
      motivo,
    });
    return response.data;
  },

  /**
   * Establecer como plantilla por defecto para su tipo
   */
  establecerPorDefecto: async (id: number): Promise<PlantillaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/plantillas-documento/${id}/establecer-por-defecto/`);
    return response.data;
  },
};

// ==================== DOCUMENTO ====================

export const documentoApi = {
  /**
   * Obtener todos los documentos
   */
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

  /**
   * Obtener un documento por ID
   */
  getById: async (id: number): Promise<Documento> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo documento
   */
  create: async (data: CreateDocumentoDTO): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/`, data);
    return response.data;
  },

  /**
   * Actualizar un documento
   */
  update: async (id: number, data: UpdateDocumentoDTO): Promise<Documento> => {
    const response = await apiClient.patch(`${BASE_URL}/documentos/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un documento
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/documentos/${id}/`);
  },

  /**
   * Aprobar un documento
   */
  aprobar: async (id: number, observaciones?: string): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/aprobar/`, {
      observaciones,
    });
    return response.data;
  },

  /**
   * Publicar un documento (ponerlo disponible)
   */
  publicar: async (id: number, fecha_vigencia?: string): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/publicar/`, {
      fecha_vigencia,
    });
    return response.data;
  },

  /**
   * Marcar documento como obsoleto
   */
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

  /**
   * Enviar documento a revisión
   */
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

  /**
   * Incrementar contador de descargas
   */
  incrementarDescarga: async (id: number): Promise<void> => {
    await apiClient.post(`${BASE_URL}/documentos/${id}/registrar-descarga/`);
  },

  /**
   * Incrementar contador de impresiones
   */
  incrementarImpresion: async (id: number): Promise<void> => {
    await apiClient.post(`${BASE_URL}/documentos/${id}/registrar-impresion/`);
  },

  /**
   * Obtener documentos pendientes de revisión del usuario actual
   */
  pendientesRevision: async (): Promise<Documento[]> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/pendientes-revision/`);
    return response.data;
  },

  /**
   * Obtener listado maestro de documentos (vista consolidada)
   */
  listadoMaestro: async (params?: {
    tipo_documento?: number;
    estado?: string;
    formato?: 'json' | 'pdf' | 'excel';
  }): Promise<Documento[]> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/listado-maestro/`, { params });
    return response.data;
  },
};

// ==================== VERSION DOCUMENTO ====================

export const versionDocumentoApi = {
  /**
   * Obtener todas las versiones
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    documento?: number;
  }): Promise<PaginatedResponse<VersionDocumento>> => {
    const response = await apiClient.get(`${BASE_URL}/versiones-documento/`, { params });
    return response.data;
  },

  /**
   * Obtener una versión por ID
   */
  getById: async (id: number): Promise<VersionDocumento> => {
    const response = await apiClient.get(`${BASE_URL}/versiones-documento/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva versión de documento
   */
  create: async (data: CreateVersionDocumentoDTO): Promise<VersionDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/versiones-documento/`, data);
    return response.data;
  },

  /**
   * Actualizar una versión
   */
  update: async (id: number, data: UpdateVersionDocumentoDTO): Promise<VersionDocumento> => {
    const response = await apiClient.patch(`${BASE_URL}/versiones-documento/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una versión
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/versiones-documento/${id}/`);
  },

  /**
   * Obtener todas las versiones de un documento específico
   */
  porDocumento: async (documentoId: number): Promise<VersionDocumento[]> => {
    const response = await apiClient.get(`${BASE_URL}/versiones-documento/`, {
      params: { documento: documentoId },
    });
    return response.data.results || response.data;
  },

  /**
   * Comparar dos versiones de un documento
   */
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
    const response = await apiClient.post(`${BASE_URL}/versiones-documento/comparar/`, {
      version1_id: versionId1,
      version2_id: versionId2,
    });
    return response.data;
  },
};

// ==================== CAMPO FORMULARIO ====================

export const campoFormularioApi = {
  /**
   * Obtener todos los campos de formulario
   */
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

  /**
   * Obtener un campo por ID
   */
  getById: async (id: number): Promise<CampoFormulario> => {
    const response = await apiClient.get(`${BASE_URL}/campos-formulario/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo campo de formulario
   */
  create: async (data: CreateCampoFormularioDTO): Promise<CampoFormulario> => {
    const response = await apiClient.post(`${BASE_URL}/campos-formulario/`, data);
    return response.data;
  },

  /**
   * Actualizar un campo de formulario
   */
  update: async (id: number, data: UpdateCampoFormularioDTO): Promise<CampoFormulario> => {
    const response = await apiClient.patch(`${BASE_URL}/campos-formulario/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un campo de formulario
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/campos-formulario/${id}/`);
  },

  /**
   * Reordenar campos de un formulario
   */
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

// ==================== FIRMA DOCUMENTO ====================

export const firmaDocumentoApi = {
  /**
   * Obtener todas las firmas
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    documento?: number;
    firmante?: number;
    estado?: string;
    tipo_firma?: string;
  }): Promise<PaginatedResponse<FirmaDocumento>> => {
    const response = await apiClient.get(`${BASE_URL}/firmas-documento/`, { params });
    return response.data;
  },

  /**
   * Obtener una firma por ID
   */
  getById: async (id: number): Promise<FirmaDocumento> => {
    const response = await apiClient.get(`${BASE_URL}/firmas-documento/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva solicitud de firma
   */
  create: async (data: CreateFirmaDocumentoDTO): Promise<FirmaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/firmas-documento/`, data);
    return response.data;
  },

  /**
   * Actualizar una firma
   */
  update: async (id: number, data: UpdateFirmaDocumentoDTO): Promise<FirmaDocumento> => {
    const response = await apiClient.patch(`${BASE_URL}/firmas-documento/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una firma
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/firmas-documento/${id}/`);
  },

  /**
   * Firmar un documento
   */
  firmar: async (
    id: number,
    data: {
      firma_digital?: string;
      comentarios?: string;
      latitud?: number;
      longitud?: number;
    }
  ): Promise<FirmaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/firmas-documento/${id}/firmar/`, data);
    return response.data;
  },

  /**
   * Rechazar firma de un documento
   */
  rechazar: async (
    id: number,
    data: {
      motivo_rechazo: string;
      comentarios?: string;
    }
  ): Promise<FirmaDocumento> => {
    const response = await apiClient.post(`${BASE_URL}/firmas-documento/${id}/rechazar/`, data);
    return response.data;
  },

  /**
   * Obtener firmas pendientes del usuario actual
   */
  pendientes: async (): Promise<FirmaDocumento[]> => {
    const response = await apiClient.get(`${BASE_URL}/firmas-documento/pendientes/`);
    return response.data;
  },

  /**
   * Obtener todas las firmas realizadas por el usuario actual
   */
  misFirmas: async (params?: {
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<FirmaDocumento[]> => {
    const response = await apiClient.get(`${BASE_URL}/firmas-documento/mis-firmas/`, { params });
    return response.data;
  },
};

// ==================== CONTROL DOCUMENTAL ====================

export const controlDocumentalApi = {
  /**
   * Obtener todos los controles documentales
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    documento?: number;
    tipo_control?: string;
    fecha_distribucion_desde?: string;
    fecha_distribucion_hasta?: string;
  }): Promise<PaginatedResponse<ControlDocumental>> => {
    const response = await apiClient.get(`${BASE_URL}/controles-documentales/`, { params });
    return response.data;
  },

  /**
   * Obtener un control documental por ID
   */
  getById: async (id: number): Promise<ControlDocumental> => {
    const response = await apiClient.get(`${BASE_URL}/controles-documentales/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo control documental
   */
  create: async (data: CreateControlDocumentalDTO): Promise<ControlDocumental> => {
    const response = await apiClient.post(`${BASE_URL}/controles-documentales/`, data);
    return response.data;
  },

  /**
   * Actualizar un control documental
   */
  update: async (id: number, data: UpdateControlDocumentalDTO): Promise<ControlDocumental> => {
    const response = await apiClient.patch(`${BASE_URL}/controles-documentales/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un control documental
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/controles-documentales/${id}/`);
  },

  /**
   * Confirmar recepción de documento por parte del usuario
   */
  confirmarRecepcion: async (
    id: number,
    data?: {
      comentarios?: string;
      fecha_recepcion?: string;
    }
  ): Promise<ControlDocumental> => {
    const response = await apiClient.post(
      `${BASE_URL}/controles-documentales/${id}/confirmar-recepcion/`,
      data
    );
    return response.data;
  },

  /**
   * Obtener distribuciones activas (documentos en circulación)
   */
  distribucionesActivas: async (): Promise<ControlDocumental[]> => {
    const response = await apiClient.get(`${BASE_URL}/controles-documentales/distribuciones-activas/`);
    return response.data;
  },

  /**
   * Obtener documentos obsoletos pendientes de retiro
   */
  documentosObsoletos: async (): Promise<
    Array<{
      control: ControlDocumental;
      documento: Documento;
      dias_obsoleto: number;
    }>
  > => {
    const response = await apiClient.get(`${BASE_URL}/controles-documentales/documentos-obsoletos/`);
    return response.data;
  },
};

// ==================== EXPORTACIÓN POR DEFECTO ====================

const sistemaDocumentalApi = {
  tipoDocumento: tipoDocumentoApi,
  plantillaDocumento: plantillaDocumentoApi,
  documento: documentoApi,
  versionDocumento: versionDocumentoApi,
  campoFormulario: campoFormularioApi,
  firmaDocumento: firmaDocumentoApi,
  controlDocumental: controlDocumentalApi,
};

export default sistemaDocumentalApi;
