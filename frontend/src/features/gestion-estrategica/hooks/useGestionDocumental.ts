/**
 * Hooks React Query para Gestion Documental - Gestion Estrategica (N1)
 * Sistema de gestion documental con control de versiones
 *
 * Migrado desde: features/hseq/hooks/useSistemaDocumental.ts
 * NOTA: Firmas digitales ahora usan workflow_engine.firma_digital
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  tipoDocumentoApi,
  plantillaDocumentoApi,
  documentoApi,
  versionDocumentoApi,
  campoFormularioApi,
  controlDocumentalApi,
} from '../api/gestionDocumentalApi';
import type {
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

export const gestionDocumentalKeys = {
  all: ['gestion-estrategica', 'gestion-documental'] as const,

  // Tipos de Documento
  tiposDocumento: () => [...gestionDocumentalKeys.all, 'tipos'] as const,
  tipoDocumento: (id: number) => [...gestionDocumentalKeys.tiposDocumento(), id] as const,

  // Plantillas
  plantillas: () => [...gestionDocumentalKeys.all, 'plantillas'] as const,
  plantilla: (id: number) => [...gestionDocumentalKeys.plantillas(), id] as const,
  plantillasByTipo: (tipoId: number) =>
    [...gestionDocumentalKeys.plantillas(), 'tipo', tipoId] as const,

  // Documentos
  documentos: () => [...gestionDocumentalKeys.all, 'documentos'] as const,
  documento: (id: number) => [...gestionDocumentalKeys.documentos(), id] as const,
  documentosByTipo: (tipoId: number) =>
    [...gestionDocumentalKeys.documentos(), 'tipo', tipoId] as const,
  documentosByEstado: (estado: string) =>
    [...gestionDocumentalKeys.documentos(), 'estado', estado] as const,

  // Versiones
  versiones: (documentoId: number) =>
    [...gestionDocumentalKeys.all, 'versiones', documentoId] as const,

  // Campos Formulario
  camposFormulario: (plantillaId: number) =>
    [...gestionDocumentalKeys.all, 'campos', plantillaId] as const,

  // Firmas (ahora usa workflow_engine.firma_digital)
  firmas: (documentoId: number) => [...gestionDocumentalKeys.all, 'firmas', documentoId] as const,

  // Control Documental
  controles: (documentoId: number) =>
    [...gestionDocumentalKeys.all, 'controles', documentoId] as const,

  // Listado Maestro
  listadoMaestro: () => [...gestionDocumentalKeys.all, 'listado-maestro'] as const,
};

// ==================== TIPOS DE DOCUMENTO HOOKS ====================

export function useTiposDocumento(params?: { is_active?: boolean; search?: string }) {
  return useQuery({
    queryKey: [...gestionDocumentalKeys.tiposDocumento(), params],
    queryFn: async () => {
      const response = await tipoDocumentoApi.getAll(params);
      return response.results || response;
    },
  });
}

export function useTipoDocumento(id: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.tipoDocumento(id),
    queryFn: () => tipoDocumentoApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTipoDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTipoDocumentoDTO) => tipoDocumentoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.tiposDocumento() });
      toast.success('Tipo de documento creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear tipo de documento');
    },
  });
}

export function useUpdateTipoDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoDocumentoDTO }) =>
      tipoDocumentoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.tiposDocumento() });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.tipoDocumento(id) });
      toast.success('Tipo de documento actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar tipo de documento');
    },
  });
}

export function useDeleteTipoDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tipoDocumentoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.tiposDocumento() });
      toast.success('Tipo de documento eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar tipo de documento');
    },
  });
}

// ==================== PLANTILLAS HOOKS ====================

export function usePlantillasDocumento(tipoDocumentoId?: number) {
  return useQuery({
    queryKey: tipoDocumentoId
      ? gestionDocumentalKeys.plantillasByTipo(tipoDocumentoId)
      : gestionDocumentalKeys.plantillas(),
    queryFn: async () => {
      const params = tipoDocumentoId ? { tipo_documento: tipoDocumentoId } : {};
      const response = await plantillaDocumentoApi.getAll(params);
      return response.results || response;
    },
  });
}

export function usePlantillaDocumento(id: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.plantilla(id),
    queryFn: () => plantillaDocumentoApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePlantillaDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlantillaDocumentoDTO) => plantillaDocumentoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.plantillas() });
      toast.success('Plantilla creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear plantilla');
    },
  });
}

export function useUpdatePlantillaDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlantillaDocumentoDTO }) =>
      plantillaDocumentoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.plantillas() });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.plantilla(id) });
      toast.success('Plantilla actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar plantilla');
    },
  });
}

export function useDeletePlantillaDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plantillaDocumentoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.plantillas() });
      toast.success('Plantilla eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar plantilla');
    },
  });
}

export function useActivarPlantilla() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plantillaDocumentoApi.activar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.plantillas() });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.plantilla(id) });
      toast.success('Plantilla activada exitosamente');
    },
    onError: () => {
      toast.error('Error al activar plantilla');
    },
  });
}

// ==================== DOCUMENTOS HOOKS ====================

export function useDocumentos(filters?: {
  tipo_documento?: number;
  estado?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: [...gestionDocumentalKeys.documentos(), filters],
    queryFn: async () => {
      const response = await documentoApi.getAll(filters);
      return response.results || response;
    },
  });
}

export function useDocumento(id: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.documento(id),
    queryFn: () => documentoApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentoDTO) => documentoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documentos() });
      toast.success('Documento creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear documento');
    },
  });
}

export function useUpdateDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDocumentoDTO }) =>
      documentoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documentos() });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documento(id) });
      toast.success('Documento actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar documento');
    },
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documentos() });
      toast.success('Documento eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar documento');
    },
  });
}

export function useAprobarDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
      documentoApi.aprobar(id, observaciones),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documento(id) });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documentos() });
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documento(id) });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documentos() });
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documento(id) });
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documento(id) });
      queryClient.invalidateQueries({ queryKey: gestionDocumentalKeys.documentos() });
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

// ==================== VERSIONES HOOKS ====================

export function useVersionesDocumento(documentoId: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.versiones(documentoId),
    queryFn: () => versionDocumentoApi.porDocumento(documentoId),
    enabled: !!documentoId,
  });
}

// ==================== CAMPOS FORMULARIO HOOKS ====================

export function useCamposFormulario(plantillaId: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.camposFormulario(plantillaId),
    queryFn: async () => {
      const response = await campoFormularioApi.getAll({ plantilla: plantillaId });
      return response.results || response;
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

// ==================== FIRMAS HOOKS (usa workflow_engine) ====================

export function useFirmasDocumento(documentoId: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.firmas(documentoId),
    queryFn: () => documentoApi.getFirmas(documentoId),
    enabled: !!documentoId,
  });
}

// ==================== CONTROL DOCUMENTAL HOOKS ====================

export function useControlDocumental(documentoId: number) {
  return useQuery({
    queryKey: gestionDocumentalKeys.controles(documentoId),
    queryFn: async () => {
      const response = await controlDocumentalApi.getAll({ documento: documentoId });
      return response.results || response;
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

// ==================== ESTADISTICAS HOOK ====================

export function useEstadisticasDocumentales() {
  return useQuery({
    queryKey: [...gestionDocumentalKeys.all, 'estadisticas'],
    queryFn: () => documentoApi.estadisticas(),
  });
}
