/**
 * Hooks React Query para Gestion Documental - Gestion Estrategica (N1)
 * Sistema de gestion documental con control de versiones
 *
 * Usa createCrudHooks factory para CRUD basico.
 * Hooks custom (aprobar, publicar, etc.) se mantienen manuales.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createQueryKeys } from '@/lib/query-keys';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import {
  tipoDocumentoApi,
  plantillaDocumentoApi,
  documentoApi,
  versionDocumentoApi,
  campoFormularioApi,
  controlDocumentalApi,
} from '../api/gestionDocumentalApi';
import type {
  TipoDocumento,
  PlantillaDocumento,
  Documento,
  CreateTipoDocumentoDTO,
  UpdateTipoDocumentoDTO,
  CreatePlantillaDocumentoDTO,
  UpdatePlantillaDocumentoDTO,
  CreateDocumentoDTO,
  UpdateDocumentoDTO,
  CreateCampoFormularioDTO,
  UpdateCampoFormularioDTO,
  CreateControlDocumentalDTO,
} from '../types/gestion-documental.types';

// ==================== QUERY KEYS ====================

const gdTiposKeys = createQueryKeys('gd-tipos-documento');
const gdPlantillasKeys = createQueryKeys('gd-plantillas');
const gdDocumentosKeys = createQueryKeys('gd-documentos');

// Legacy keys for custom hooks that need specific patterns
export const gestionDocumentalKeys = {
  all: ['gestion-estrategica', 'gestion-documental'] as const,
  plantillasByTipo: (tipoId: number) =>
    ['gd-plantillas', 'list', { tipo_documento: tipoId }] as const,
  versiones: (documentoId: number) => ['gd-versiones', documentoId] as const,
  camposFormulario: (plantillaId: number) => ['gd-campos', plantillaId] as const,
  firmas: (documentoId: number) => ['gd-firmas', documentoId] as const,
  controles: (documentoId: number) => ['gd-controles', documentoId] as const,
  listadoMaestro: () => ['gd-listado-maestro'] as const,
};

// ==================== TIPOS DE DOCUMENTO (via factory) ====================

const tipoDocHooks = createCrudHooks<TipoDocumento, CreateTipoDocumentoDTO, UpdateTipoDocumentoDTO>(
  tipoDocumentoApi,
  gdTiposKeys,
  'Tipo de documento'
);

export const useTiposDocumento = tipoDocHooks.useList;
export const useTipoDocumento = tipoDocHooks.useDetail;
export const useCreateTipoDocumento = tipoDocHooks.useCreate;
export const useUpdateTipoDocumento = tipoDocHooks.useUpdate;
export const useDeleteTipoDocumento = tipoDocHooks.useDelete;

// ==================== PLANTILLAS (via factory + custom) ====================

const plantillaHooks = createCrudHooks<
  PlantillaDocumento,
  CreatePlantillaDocumentoDTO,
  UpdatePlantillaDocumentoDTO
>(plantillaDocumentoApi, gdPlantillasKeys, 'Plantilla', { isFeminine: true });

// Override useList to support backward-compatible signature (number | params object)
export function usePlantillasDocumento(
  params?: { tipo_documento?: number; estado?: string } | number
) {
  const normalizedParams = typeof params === 'number' ? { tipo_documento: params } : params;

  return useQuery({
    queryKey: gdPlantillasKeys.list(normalizedParams),
    queryFn: async () => {
      const response = await plantillaDocumentoApi.getAll(normalizedParams || {});
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
  });
}

export const usePlantillaDocumento = plantillaHooks.useDetail;
export const useCreatePlantillaDocumento = plantillaHooks.useCreate;
export const useUpdatePlantillaDocumento = plantillaHooks.useUpdate;
export const useDeletePlantillaDocumento = plantillaHooks.useDelete;

export function useActivarPlantilla() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plantillaDocumentoApi.activar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdPlantillasKeys.lists() });
      toast.success('Plantilla activada exitosamente');
    },
    onError: () => {
      toast.error('Error al activar plantilla');
    },
  });
}

/** Preview de resolución de firmantes por defecto a usuarios actuales */
export function useResolverFirmantes(plantillaId: number | null) {
  return useQuery({
    queryKey: ['gd-plantillas', 'resolver-firmantes', plantillaId],
    queryFn: () => plantillaDocumentoApi.resolverFirmantes(plantillaId!),
    enabled: !!plantillaId && plantillaId > 0,
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

// ==================== DOCUMENTOS (via factory + custom) ====================

const documentoHooks = createCrudHooks<Documento, CreateDocumentoDTO, UpdateDocumentoDTO>(
  documentoApi,
  gdDocumentosKeys,
  'Documento'
);

// Override useList to support typed filters
export function useDocumentos(filters?: {
  tipo_documento?: number;
  tipo_documento_codigo?: string;
  estado?: string;
  /** Búsqueda full-text — pasa como ?buscar= al backend (≥3 chars usa tsvector) */
  buscar?: string;
}) {
  return useQuery({
    queryKey: gdDocumentosKeys.list(filters),
    queryFn: async () => {
      const response = await documentoApi.getAll(filters);
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
  });
}

export const useDocumento = documentoHooks.useDetail;
export const useCreateDocumento = documentoHooks.useCreate;
export const useUpdateDocumento = documentoHooks.useUpdate;
export const useDeleteDocumento = documentoHooks.useDelete;

export function useAprobarDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
      documentoApi.aprobar(id, observaciones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      toast.success('Documento aprobado exitosamente');
    },
    onError: () => {
      toast.error('Error al aprobar documento');
    },
  });
}

export function usePublicarDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      fecha_vigencia,
      lectura_obligatoria,
      aplica_a_todos,
    }: {
      id: number;
      fecha_vigencia?: string;
      lectura_obligatoria?: boolean;
      aplica_a_todos?: boolean;
    }) => documentoApi.publicar(id, fecha_vigencia, lectura_obligatoria, aplica_a_todos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.listadoMaestro() });
      toast.success('Documento publicado exitosamente');
    },
    onError: () => {
      toast.error('Error al publicar documento');
    },
  });
}

export function useEnviarRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      revisores,
      mensaje,
    }: {
      id: number;
      revisores: number[];
      mensaje?: string;
    }) => documentoApi.enviarRevision(id, { revisores, mensaje }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      toast.success('Documento enviado a revision');
    },
    onError: () => {
      toast.error('Error al enviar documento a revision');
    },
  });
}

export function useDevolverBorrador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      documentoApi.devolverBorrador(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      toast.success('Documento devuelto a borrador');
    },
    onError: () => {
      toast.error('Error al devolver documento a borrador');
    },
  });
}

export function useMarcarObsoleto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      motivo,
      documento_sustituto_id,
    }: {
      id: number;
      motivo: string;
      documento_sustituto_id?: number;
    }) => documentoApi.marcarObsoleto(id, { motivo, documento_sustituto_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.listadoMaestro() });
      toast.success('Documento marcado como obsoleto');
    },
    onError: () => {
      toast.error('Error al marcar documento como obsoleto');
    },
  });
}

export function useListadoMaestro() {
  return useQuery({
    queryKey: gestionDocumentalKeys.listadoMaestro(),
    queryFn: () => documentoApi.listadoMaestro(),
  });
}

// ==================== VERSIONES ====================

export function useVersionesDocumento(documentoId: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.versiones(documentoId),
    queryFn: () => versionDocumentoApi.porDocumento(documentoId),
    enabled: !!documentoId,
  });
}

export function useCompararVersiones(versionId: number | null) {
  return useQuery({
    queryKey: ['gd-version-comparar', versionId],
    queryFn: () => versionDocumentoApi.comparar(versionId!, 0),
    enabled: !!versionId,
  });
}

// ==================== CAMPOS FORMULARIO ====================

export function useCamposFormulario(plantillaId: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.camposFormulario(plantillaId),
    queryFn: async () => {
      const response = await campoFormularioApi.getAll({ plantilla: plantillaId });
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
    enabled: !!plantillaId,
  });
}

export function useCreateCampoFormulario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampoFormularioDTO) => campoFormularioApi.create(data),
    onSuccess: (data) => {
      if (data.plantilla) {
        queryClient.invalidateQueries({
          queryKey: gestionDocumentalKeys.camposFormulario(data.plantilla),
        });
      }
      toast.success('Campo de formulario creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear campo de formulario');
    },
  });
}

export function useUpdateCampoFormulario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCampoFormularioDTO }) =>
      campoFormularioApi.update(id, data),
    onSuccess: (data) => {
      if (data.plantilla) {
        queryClient.invalidateQueries({
          queryKey: gestionDocumentalKeys.camposFormulario(data.plantilla),
        });
      }
      toast.success('Campo de formulario actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar campo de formulario');
    },
  });
}

export function useDeleteCampoFormulario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plantillaId }: { id: number; plantillaId: number }) =>
      campoFormularioApi.delete(id).then(() => plantillaId),
    onSuccess: (plantillaId) => {
      queryClient.invalidateQueries({
        queryKey: gestionDocumentalKeys.camposFormulario(plantillaId),
      });
      toast.success('Campo de formulario eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar campo de formulario');
    },
  });
}

export function useReorderCampos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      plantillaId,
      data,
    }: {
      plantillaId: number;
      data: Array<{ id: number; orden: number }>;
    }) => campoFormularioApi.reordenar(data).then(() => plantillaId),
    onSuccess: (plantillaId) => {
      queryClient.invalidateQueries({
        queryKey: gestionDocumentalKeys.camposFormulario(plantillaId),
      });
    },
    onError: () => {
      toast.error('Error al reordenar campos');
    },
  });
}

// ==================== FIRMAS (usa workflow_engine) ====================

export function useFirmasDocumento(documentoId: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.firmas(documentoId),
    queryFn: () => documentoApi.getFirmas(documentoId),
    enabled: !!documentoId,
  });
}

// ==================== CONTROL DOCUMENTAL ====================

export function useControlDocumental(documentoId: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.controles(documentoId),
    queryFn: async () => {
      const response = await controlDocumentalApi.getAll({ documento: documentoId });
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
    enabled: !!documentoId,
  });
}

export function useCreateControlDocumental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateControlDocumentalDTO) => controlDocumentalApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.controles(data.documento) });
      toast.success('Control documental creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear control documental');
    },
  });
}

export function useConfirmarRecepcion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data?: { comentarios?: string; fecha_recepcion?: string };
    }) => controlDocumentalApi.confirmarRecepcion(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.controles(data.documento) });
      toast.success('Recepcion confirmada exitosamente');
    },
    onError: () => {
      toast.error('Error al confirmar recepcion');
    },
  });
}

export function useDistribucionesActivas() {
  return useQuery({
    queryKey: [...gestionDocumentalKeys.all, 'distribuciones-activas'],
    queryFn: () => controlDocumentalApi.distribucionesActivas(),
  });
}

// ==================== ESTADO FIRMAS ====================

export function useEstadoFirmasDocumento(documentoId: number | null) {
  return useQuery({
    queryKey: [...gestionDocumentalKeys.all, 'estado-firmas', documentoId],
    queryFn: () => documentoApi.estadoFirmas(documentoId!),
    enabled: !!documentoId,
  });
}

// ==================== ESTADISTICAS ====================

export function useEstadisticasDocumentales() {
  return useQuery({
    queryKey: [...gestionDocumentalKeys.all, 'estadisticas'],
    queryFn: () => documentoApi.estadisticas(),
  });
}

// ==================== EXPORT ====================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useExportDocumentoPdf() {
  return useMutation({
    mutationFn: async ({
      id,
      codigo,
      version,
    }: {
      id: number;
      codigo: string;
      version: string;
    }) => {
      const blob = await documentoApi.exportPdf(id);
      downloadBlob(blob, `${codigo}-v${version}.pdf`);
    },
    onSuccess: () => {
      toast.success('PDF descargado exitosamente');
    },
    onError: () => {
      toast.error('Error al exportar PDF');
    },
  });
}

export function useExportDocumentoDocx() {
  return useMutation({
    mutationFn: async ({
      id,
      codigo,
      version,
    }: {
      id: number;
      codigo: string;
      version: string;
    }) => {
      const blob = await documentoApi.exportDocx(id);
      downloadBlob(blob, `${codigo}-v${version}.docx`);
    },
    onSuccess: () => {
      toast.success('DOCX descargado exitosamente');
    },
    onError: () => {
      toast.error('Error al exportar DOCX');
    },
  });
}

// =============================================================================
// OCR — Fase 5: Ingesta, reprocesamiento y búsqueda full-text
// =============================================================================

export function useDigitalizar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        titulo: string;
        secciones: { id: string; label: string; contenido: string }[];
        responsables_cargo_ids: number[];
      };
    }) => documentoApi.digitalizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.listadoMaestro() });
      toast.success('Documento digitalizado. El original quedó archivado como referencia.');
    },
    onError: () => {
      toast.error('Error al digitalizar el documento');
    },
  });
}

export function useIngestarExterno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FormData) => {
      return documentoApi.ingestarExterno(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: gestionDocumentalKeys.listadoMaestro(),
      });
      toast.success('Documento ingresado. La extracción de texto iniciará en breve.');
    },
    onError: () => {
      toast.error('Error al ingestar el documento');
    },
  });
}

export function useReprocesarOcr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return documentoApi.reprocesarOcr(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.detail(id) });
      toast.success('OCR reprogramado. Recibirá una notificación al completar.');
    },
    onError: () => {
      toast.error('Error al reprogramar OCR');
    },
  });
}

export function useBusquedaTexto(query: string) {
  return useQuery({
    queryKey: [...gestionDocumentalKeys.all, 'busqueda-texto', query],
    queryFn: () => documentoApi.busquedaTexto(query),
    enabled: query.length >= 3,
    staleTime: 30_000,
  });
}

// =============================================================================
// ANEXOS — Sprint 2: Subir / eliminar archivos adjuntos al documento
// =============================================================================

export function useSubirAnexo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) =>
      documentoApi.subirAnexo(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.detail(id) });
      toast.success('Anexo subido exitosamente');
    },
    onError: () => {
      toast.error('Error al subir el anexo');
    },
  });
}

export function useEliminarAnexo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, anexoId }: { id: number; anexoId: string }) =>
      documentoApi.eliminarAnexo(id, anexoId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.detail(id) });
      toast.success('Anexo eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar el anexo');
    },
  });
}

// =============================================================================
// INGESTA EN LOTE — Sprint 2: Subir hasta 20 PDFs de una vez
// =============================================================================

export function useIngestarLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FormData) => documentoApi.ingestarLote(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.listadoMaestro() });
      const msg =
        result.errores.length > 0
          ? `${result.creados} documentos creados, ${result.errores.length} con error`
          : `${result.creados} documentos ingresados exitosamente`;
      toast.success(msg);
    },
    onError: () => {
      toast.error('Error en la ingesta por lote');
    },
  });
}

// =============================================================================
// COBERTURA DOCUMENTAL — Sprint 3: Dashboard de cobertura por tipo
// =============================================================================

export function useCoberturaDocumental() {
  return useQuery({
    queryKey: [...gestionDocumentalKeys.all, 'cobertura-documental'],
    queryFn: () => documentoApi.coberturaDocumental(),
    staleTime: 60_000,
  });
}

// =============================================================================
// SCORING — Fase 6: Score de cumplimiento heurístico
// =============================================================================

export function useCalcScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => documentoApi.calcularScore(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      toast.success('Score calculado exitosamente');
    },
    onError: () => toast.error('Error al calcular score'),
  });
}

export function useScoreResumen() {
  return useQuery({
    queryKey: [...gestionDocumentalKeys.all, 'score-resumen'],
    queryFn: () => documentoApi.scoreResumen(),
    staleTime: 60_000,
  });
}

// =============================================================================
// SELLADO PDF — Mejora 2: Firma digital X.509 con pyHanko
// =============================================================================

export function useSellarDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => documentoApi.sellarPdf(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      toast.success('Sellado iniciado. Recibirá una notificación al completar.');
    },
    onError: () => toast.error('Error al iniciar sellado del documento'),
  });
}

export function useVerificarSellado() {
  return useMutation({
    mutationFn: async (id: number) => documentoApi.verificarSellado(id),
    onSuccess: (resultado) => {
      if (resultado.integro) {
        toast.success('Integridad verificada: el PDF sellado no ha sido alterado.');
      } else {
        toast.error('ALERTA: El PDF sellado puede haber sido modificado.');
      }
    },
    onError: () => toast.error('Error al verificar integridad del sellado'),
  });
}

// =============================================================================
// GOOGLE DRIVE — Fase 7: Exportación con Habeas Data
// =============================================================================

export function useExportarDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, folderId }: { id: number; folderId?: string }) =>
      documentoApi.exportarDrive(id, folderId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gdDocumentosKeys.lists() });
      toast.success('Documento exportado a Google Drive');
    },
    onError: () => toast.error('Error al exportar a Google Drive'),
  });
}

export function useExportarDriveLote() {
  return useMutation({
    mutationFn: async (data: { folder_id?: string; filtros?: Record<string, unknown> }) =>
      documentoApi.exportarDriveLote(data),
    onSuccess: () => {
      toast.success('Exportación a Drive iniciada. Recibirá una notificación al completar.');
    },
    onError: () => toast.error('Error al iniciar exportación masiva'),
  });
}

// =============================================================================
// BIBLIOTECA MAESTRA — Fase 8
// =============================================================================

import { bibliotecaApi } from '../api/gestionDocumentalApi';

const bibliotecaKeys = createQueryKeys('biblioteca-plantillas');

export function useBibliotecaPlantillas(params?: {
  categoria?: string;
  industria?: string;
  norma_iso_codigo?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: [...bibliotecaKeys.lists(), params],
    queryFn: () => bibliotecaApi.list(params),
  });
}

export function useImportarPlantilla() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => bibliotecaApi.importarATenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdPlantillasKeys.lists() });
      toast.success('Plantilla importada exitosamente desde la biblioteca');
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const msg = axiosError?.response?.data?.error || 'Error al importar plantilla';
      toast.error(msg);
    },
  });
}
