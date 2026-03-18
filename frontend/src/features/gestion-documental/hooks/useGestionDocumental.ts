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
  search?: string;
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
    mutationFn: ({ id, fecha_vigencia }: { id: number; fecha_vigencia?: string }) =>
      documentoApi.publicar(id, fecha_vigencia),
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
