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
  ScoreResumen,
  DriveExportResult,
  VerificacionSellado,
  AceptacionDocumental,
  AsignarLecturaDTO,
  RegistrarProgresoDTO,
  AceptacionResumen,
  BibliotecaPlantilla,
  FirmanteResuelto,
  AnexoMeta,
  IngestarLoteResult,
  CoberturaDocumental,
  TablaRetencionDocumental,
  CreateTRDDTO,
  UpdateTRDDTO,
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
  resolverFirmantes: async (
    id: number
  ): Promise<{ firmantes: FirmanteResuelto[]; mensaje?: string }> => {
    const response = await apiClient.get(`${BASE_URL}/plantillas/${id}/resolver-firmantes/`);
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
  publicar: async (
    id: number,
    fecha_vigencia?: string,
    lectura_obligatoria?: boolean,
    aplica_a_todos?: boolean
  ): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/publicar/`, {
      fecha_vigencia,
      ...(lectura_obligatoria !== undefined && { lectura_obligatoria }),
      ...(aplica_a_todos !== undefined && { aplica_a_todos }),
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
  devolverBorrador: async (id: number, motivo?: string): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/devolver-borrador/`, {
      motivo,
    });
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
  listadoMaestroPdf: async (): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/listado-maestro/`, {
      params: { formato: 'pdf' },
      responseType: 'blob',
    });
    return response.data as Blob;
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

  // Digitalizar — documento externo ingestado
  digitalizar: async (
    id: number,
    data: {
      titulo: string;
      secciones: { id: string; label: string; contenido: string }[];
      responsables_cargo_ids: number[];
    }
  ): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/digitalizar/`, data);
    return response.data;
  },

  // Camino B — Adoptar PDF externo al ciclo de firmas
  adoptarPdf: async (data: FormData): Promise<Documento> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/adoptar-pdf/`, data);
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

  // Scoring — Fase 6
  calcularScore: async (
    id: number
  ): Promise<{ score: number; detalle: Record<string, unknown> }> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/calcular-score/`);
    return response.data;
  },
  scoreResumen: async (): Promise<ScoreResumen> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/score-resumen/`);
    return response.data;
  },

  // Sellado PDF — Mejora 2
  sellarPdf: async (id: number): Promise<{ mensaje: string; sellado_estado: string }> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/sellar-pdf/`);
    return response.data;
  },
  verificarSellado: async (id: number): Promise<VerificacionSellado> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/${id}/verificar-sellado/`);
    return response.data;
  },

  // Anexos — Sprint 2: Subir / eliminar archivos adjuntos
  subirAnexo: async (
    id: number,
    file: File
  ): Promise<{ anexo: AnexoMeta; total_anexos: number }> => {
    const formData = new FormData();
    formData.append('archivo', file);
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/subir-anexo/`, formData);
    return response.data;
  },
  eliminarAnexo: async (id: number, anexoId: string): Promise<{ mensaje: string }> => {
    const response = await apiClient.delete(
      `${BASE_URL}/documentos/${id}/eliminar-anexo/${anexoId}/`
    );
    return response.data;
  },

  // Ingesta en lote — Sprint 2: Subir hasta 20 PDFs de una vez
  ingestarLote: async (data: FormData): Promise<IngestarLoteResult> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/ingestar-lote/`, data);
    return response.data;
  },

  // Cobertura documental — Sprint 3: Dashboard de cobertura por tipo
  coberturaDocumental: async (): Promise<CoberturaDocumental> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/cobertura-documental/`);
    return response.data;
  },

  // Habeas Data — Estado de la política del tenant
  habeasDataStatus: async (): Promise<{
    tiene_politica: boolean;
    estado: string | null;
    documento_id?: number;
    codigo?: string;
    mensaje?: string;
    fecha_publicacion?: string | null;
  }> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/habeas-data-status/`);
    return response.data;
  },

  // Lecturas obligatorias pendientes del usuario
  misLecturasCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get(`${BASE_URL}/documentos/mis-lecturas-count/`);
    return response.data;
  },

  // Google Drive — Fase 7
  exportarDrive: async (id: number, folderId?: string): Promise<DriveExportResult> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/${id}/exportar-drive/`, {
      folder_id: folderId,
    });
    return response.data;
  },
  exportarDriveLote: async (data: {
    folder_id?: string;
    filtros?: Record<string, unknown>;
  }): Promise<{ mensaje: string }> => {
    const response = await apiClient.post(`${BASE_URL}/documentos/exportar-drive-lote/`, data);
    return response.data;
  },
};

// ==================== BIBLIOTECA MAESTRA (Fase 8) ====================

export const bibliotecaApi = {
  list: async (params?: {
    categoria?: string;
    industria?: string;
    norma_iso_codigo?: string;
    search?: string;
  }): Promise<BibliotecaPlantilla[]> => {
    const response = await apiClient.get('/shared-library/plantillas/', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
  getById: async (id: number): Promise<BibliotecaPlantilla> => {
    const response = await apiClient.get(`/shared-library/plantillas/${id}/`);
    return response.data;
  },
  importarATenant: async (id: number): Promise<PlantillaDocumento> => {
    const response = await apiClient.post(`/shared-library/plantillas/${id}/importar-a-tenant/`);
    return response.data;
  },
  choices: async (): Promise<{
    categorias: Array<[string, string]>;
    industrias: Array<[string, string]>;
  }> => {
    const response = await apiClient.get('/shared-library/plantillas/choices/');
    return response.data;
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

// ==================== ACEPTACIÓN DOCUMENTAL (Mejora 3 — Lectura Verificada) ====================

export const aceptacionApi = {
  misPendientes: async (): Promise<AceptacionDocumental[]> => {
    const response = await apiClient.get(`${BASE_URL}/aceptaciones/mis-pendientes/`);
    return response.data;
  },
  asignar: async (
    data: AsignarLecturaDTO
  ): Promise<{ mensaje: string; creados: number; omitidos: number }> => {
    const response = await apiClient.post(`${BASE_URL}/aceptaciones/asignar/`, data);
    return response.data;
  },
  registrarProgreso: async (
    id: number,
    data: RegistrarProgresoDTO
  ): Promise<{
    porcentaje_lectura: number;
    tiempo_lectura_seg: number;
    estado: string;
  }> => {
    const response = await apiClient.post(
      `${BASE_URL}/aceptaciones/${id}/registrar-progreso/`,
      data
    );
    return response.data;
  },
  aceptar: async (id: number, textoAceptacion?: string): Promise<AceptacionDocumental> => {
    const response = await apiClient.post(`${BASE_URL}/aceptaciones/${id}/aceptar/`, {
      texto_aceptacion: textoAceptacion,
    });
    return response.data;
  },
  rechazar: async (id: number, motivo: string): Promise<AceptacionDocumental> => {
    const response = await apiClient.post(`${BASE_URL}/aceptaciones/${id}/rechazar/`, {
      motivo_rechazo: motivo,
    });
    return response.data;
  },
  resumen: async (documentoId?: number): Promise<AceptacionResumen> => {
    const response = await apiClient.get(`${BASE_URL}/aceptaciones/resumen/`, {
      params: documentoId ? { documento: documentoId } : undefined,
    });
    return response.data;
  },
  porDocumento: async (documentoId: number): Promise<AceptacionDocumental[]> => {
    const response = await apiClient.get(`${BASE_URL}/aceptaciones/`, {
      params: { documento: documentoId },
    });
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
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

// ==================== TABLA DE RETENCIÓN DOCUMENTAL (TRD) ====================

export const trdApi = createApiClient<TablaRetencionDocumental, CreateTRDDTO, UpdateTRDDTO>(
  BASE_URL,
  'trd'
);

export default gestionDocumentalApi;
