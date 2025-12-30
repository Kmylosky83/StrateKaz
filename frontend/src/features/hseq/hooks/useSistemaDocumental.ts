/**
 * Hooks React Query para Sistema Documental HSEQ
 * Sistema de gestión documental con control de versiones y firmas digitales
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// ==================== TYPES ====================

export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel_documento: 'ESTRATEGICO' | 'TACTICO' | 'OPERATIVO' | 'SOPORTE';
  prefijo_codigo: string;
  requiere_aprobacion: boolean;
  requiere_firma: boolean;
  tiempo_retencion_años: number;
  plantilla_por_defecto?: string;
  campos_obligatorios: string[];
  color_identificacion: string;
  is_active: boolean;
  orden: number;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface PlantillaDocumento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_documento: number;
  tipo_plantilla: 'HTML' | 'MARKDOWN' | 'FORMULARIO';
  contenido_plantilla: string;
  variables_disponibles: string[];
  estilos_css?: string;
  encabezado?: string;
  pie_pagina?: string;
  version: string;
  estado: 'BORRADOR' | 'ACTIVA' | 'OBSOLETA';
  es_por_defecto: boolean;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface Documento {
  id: number;
  codigo: string;
  titulo: string;
  tipo_documento: number;
  plantilla?: number;
  resumen?: string;
  contenido: string;
  datos_formulario: Record<string, any>;
  palabras_clave: string[];
  version_actual: string;
  numero_revision: number;
  estado: 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'PUBLICADO' | 'OBSOLETO' | 'ARCHIVADO';
  clasificacion: 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL' | 'RESTRINGIDO';
  fecha_creacion: string;
  fecha_aprobacion?: string;
  fecha_publicacion?: string;
  fecha_vigencia?: string;
  fecha_revision_programada?: string;
  fecha_obsolescencia?: string;
  elaborado_por: number;
  revisado_por?: number;
  aprobado_por?: number;
  areas_aplicacion: string[];
  puestos_aplicacion: string[];
  archivo_pdf?: string;
  archivos_anexos: any[];
  documento_padre?: number;
  numero_descargas: number;
  numero_impresiones: number;
  observaciones?: string;
  motivo_cambio_version?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface VersionDocumento {
  id: number;
  documento: number;
  numero_version: string;
  tipo_cambio: 'CREACION' | 'REVISION_MENOR' | 'REVISION_MAYOR' | 'CORRECCION' | 'ACTUALIZACION';
  contenido_snapshot: string;
  datos_formulario_snapshot: Record<string, any>;
  descripcion_cambios: string;
  cambios_detectados: any[];
  fecha_version: string;
  creado_por: number;
  aprobado_por?: number;
  fecha_aprobacion?: string;
  archivo_pdf_version?: string;
  is_version_actual: boolean;
  checksum: string;
  empresa_id: number;
}

export interface CampoFormulario {
  id: number;
  plantilla?: number;
  tipo_documento?: number;
  nombre_campo: string;
  etiqueta: string;
  tipo_campo: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'DATETIME' | 'SELECT' | 'MULTISELECT' | 'RADIO' | 'CHECKBOX' | 'FILE' | 'EMAIL' | 'PHONE' | 'URL' | 'SIGNATURE' | 'TABLA' | 'SECCION';
  descripcion?: string;
  placeholder?: string;
  valor_por_defecto?: string;
  opciones: any[];
  es_obligatorio: boolean;
  validacion_regex?: string;
  mensaje_validacion?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  longitud_minima?: number;
  longitud_maxima?: number;
  columnas_tabla: any[];
  orden: number;
  ancho_columna: number;
  clase_css?: string;
  condicion_visible: Record<string, any>;
  is_active: boolean;
  empresa_id: number;
}

export interface FirmaDocumento {
  id: number;
  documento: number;
  version_documento?: number;
  tipo_firma: 'ELABORACION' | 'REVISION' | 'APROBACION' | 'CONFORMIDAD' | 'VALIDACION';
  firmante: number;
  cargo_firmante: string;
  estado: 'PENDIENTE' | 'FIRMADO' | 'RECHAZADO' | 'REVOCADO';
  fecha_solicitud: string;
  fecha_firma?: string;
  firma_digital?: string;
  certificado_digital?: string;
  ip_address?: string;
  user_agent?: string;
  latitud?: number;
  longitud?: number;
  comentarios?: string;
  motivo_rechazo?: string;
  orden_firma: number;
  checksum_documento: string;
  empresa_id: number;
}

export interface ControlDocumental {
  id: number;
  documento: number;
  version_documento?: number;
  tipo_control: 'DISTRIBUCION' | 'ACTUALIZACION' | 'RETIRO' | 'DESTRUCCION' | 'ARCHIVO';
  fecha_distribucion?: string;
  medio_distribucion: 'DIGITAL' | 'IMPRESO' | 'MIXTO';
  areas_distribucion: string[];
  numero_copias_impresas: number;
  numero_copias_controladas: number;
  fecha_retiro?: string;
  motivo_retiro?: string;
  documento_sustituto?: number;
  confirmaciones_recepcion: any[];
  fecha_destruccion?: string;
  metodo_destruccion?: string;
  responsable_destruccion?: number;
  acta_destruccion?: string;
  observaciones?: string;
  empresa_id: number;
}

export interface ListadoMaestro {
  tipo_documento: string;
  documentos: {
    codigo: string;
    titulo: string;
    version: string;
    fecha_vigencia: string;
    estado: string;
  }[];
}

// DTOs
export interface CreateTipoDocumentoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel_documento: string;
  prefijo_codigo: string;
  requiere_aprobacion?: boolean;
  requiere_firma?: boolean;
  tiempo_retencion_años?: number;
  campos_obligatorios?: string[];
  color_identificacion?: string;
  orden?: number;
}

export interface UpdateTipoDocumentoDTO extends Partial<CreateTipoDocumentoDTO> {}

export interface CreatePlantillaDocumentoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_documento: number;
  tipo_plantilla: string;
  contenido_plantilla: string;
  variables_disponibles?: string[];
  estilos_css?: string;
  encabezado?: string;
  pie_pagina?: string;
  version?: string;
  es_por_defecto?: boolean;
}

export interface UpdatePlantillaDocumentoDTO extends Partial<CreatePlantillaDocumentoDTO> {}

export interface CreateDocumentoDTO {
  codigo?: string;
  titulo: string;
  tipo_documento: number;
  plantilla?: number;
  resumen?: string;
  contenido: string;
  datos_formulario?: Record<string, any>;
  palabras_clave?: string[];
  clasificacion?: string;
  areas_aplicacion?: string[];
  puestos_aplicacion?: string[];
  fecha_revision_programada?: string;
  documento_padre?: number;
  observaciones?: string;
}

export interface UpdateDocumentoDTO extends Partial<CreateDocumentoDTO> {}

export interface CreateCampoFormularioDTO {
  plantilla?: number;
  tipo_documento?: number;
  nombre_campo: string;
  etiqueta: string;
  tipo_campo: string;
  descripcion?: string;
  placeholder?: string;
  valor_por_defecto?: string;
  opciones?: any[];
  es_obligatorio?: boolean;
  orden?: number;
  ancho_columna?: number;
}

export interface UpdateCampoFormularioDTO extends Partial<CreateCampoFormularioDTO> {}

export interface CreateFirmaDocumentoDTO {
  documento: number;
  tipo_firma: string;
  firmante: number;
  cargo_firmante: string;
  orden_firma?: number;
}

export interface FirmarDocumentoDTO {
  firma_digital?: string;
  comentarios?: string;
  latitud?: number;
  longitud?: number;
}

export interface RechazarFirmaDTO {
  motivo_rechazo: string;
}

// ==================== QUERY KEYS ====================

export const documentalKeys = {
  all: ['hseq', 'documentos'] as const,

  // Tipos de Documento
  tiposDocumento: () => [...documentalKeys.all, 'tipos'] as const,
  tipoDocumento: (id: number) => [...documentalKeys.tiposDocumento(), id] as const,

  // Plantillas
  plantillas: () => [...documentalKeys.all, 'plantillas'] as const,
  plantilla: (id: number) => [...documentalKeys.plantillas(), id] as const,
  plantillasByTipo: (tipoId: number) => [...documentalKeys.plantillas(), 'tipo', tipoId] as const,

  // Documentos
  documentos: () => [...documentalKeys.all, 'documentos'] as const,
  documento: (id: number) => [...documentalKeys.documentos(), id] as const,
  documentosByTipo: (tipoId: number) => [...documentalKeys.documentos(), 'tipo', tipoId] as const,
  documentosByEstado: (estado: string) => [...documentalKeys.documentos(), 'estado', estado] as const,

  // Versiones
  versiones: (documentoId: number) => [...documentalKeys.all, 'versiones', documentoId] as const,

  // Campos Formulario
  camposFormulario: (plantillaId: number) => [...documentalKeys.all, 'campos', plantillaId] as const,

  // Firmas
  firmas: (documentoId: number) => [...documentalKeys.all, 'firmas', documentoId] as const,
  firmasPendientes: () => [...documentalKeys.all, 'firmas', 'pendientes'] as const,

  // Control Documental
  controles: (documentoId: number) => [...documentalKeys.all, 'controles', documentoId] as const,

  // Listado Maestro
  listadoMaestro: () => [...documentalKeys.all, 'listado-maestro'] as const,
};

// ==================== TIPOS DE DOCUMENTO HOOKS ====================

export function useTiposDocumento() {
  return useQuery({
    queryKey: documentalKeys.tiposDocumento(),
    queryFn: async () => {
      const { data } = await apiClient.get<TipoDocumento[]>('/api/hseq/documentos/tipos/');
      return data;
    },
  });
}

export function useTipoDocumento(id: number) {
  return useQuery({
    queryKey: documentalKeys.tipoDocumento(id),
    queryFn: async () => {
      const { data } = await apiClient.get<TipoDocumento>(`/api/hseq/documentos/tipos/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTipoDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateTipoDocumentoDTO) => {
      const { data } = await apiClient.post<TipoDocumento>('/api/hseq/documentos/tipos/', datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.tiposDocumento() });
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
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateTipoDocumentoDTO }) => {
      const { data } = await apiClient.patch<TipoDocumento>(`/api/hseq/documentos/tipos/${id}/`, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.tiposDocumento() });
      queryClient.invalidateQueries({ queryKey: documentalKeys.tipoDocumento(id) });
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
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/hseq/documentos/tipos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.tiposDocumento() });
      toast.success('Tipo de documento eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar tipo de documento');
    },
  });
}

export function useToggleTipoDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<TipoDocumento>(`/api/hseq/documentos/tipos/${id}/toggle_active/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.tiposDocumento() });
      queryClient.invalidateQueries({ queryKey: documentalKeys.tipoDocumento(id) });
      toast.success('Estado del tipo de documento actualizado');
    },
    onError: () => {
      toast.error('Error al cambiar estado del tipo de documento');
    },
  });
}

// ==================== PLANTILLAS HOOKS ====================

export function usePlantillasDocumento(tipoDocumentoId?: number) {
  return useQuery({
    queryKey: tipoDocumentoId
      ? documentalKeys.plantillasByTipo(tipoDocumentoId)
      : documentalKeys.plantillas(),
    queryFn: async () => {
      const params = tipoDocumentoId ? { tipo_documento: tipoDocumentoId } : {};
      const { data } = await apiClient.get<PlantillaDocumento[]>('/api/hseq/documentos/plantillas/', { params });
      return data;
    },
  });
}

export function usePlantillaDocumento(id: number) {
  return useQuery({
    queryKey: documentalKeys.plantilla(id),
    queryFn: async () => {
      const { data } = await apiClient.get<PlantillaDocumento>(`/api/hseq/documentos/plantillas/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePlantillaDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreatePlantillaDocumentoDTO) => {
      const { data } = await apiClient.post<PlantillaDocumento>('/api/hseq/documentos/plantillas/', datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.plantillas() });
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
    mutationFn: async ({ id, datos }: { id: number; datos: UpdatePlantillaDocumentoDTO }) => {
      const { data } = await apiClient.patch<PlantillaDocumento>(`/api/hseq/documentos/plantillas/${id}/`, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.plantillas() });
      queryClient.invalidateQueries({ queryKey: documentalKeys.plantilla(id) });
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
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/hseq/documentos/plantillas/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.plantillas() });
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
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<PlantillaDocumento>(`/api/hseq/documentos/plantillas/${id}/activar/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.plantillas() });
      queryClient.invalidateQueries({ queryKey: documentalKeys.plantilla(id) });
      toast.success('Plantilla activada exitosamente');
    },
    onError: () => {
      toast.error('Error al activar plantilla');
    },
  });
}

export function useMarcarPlantillaObsoleta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<PlantillaDocumento>(`/api/hseq/documentos/plantillas/${id}/marcar_obsoleta/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.plantillas() });
      queryClient.invalidateQueries({ queryKey: documentalKeys.plantilla(id) });
      toast.success('Plantilla marcada como obsoleta');
    },
    onError: () => {
      toast.error('Error al marcar plantilla como obsoleta');
    },
  });
}

// ==================== DOCUMENTOS HOOKS ====================

export function useDocumentos(filters?: { tipo?: number; estado?: string }) {
  return useQuery({
    queryKey: filters?.tipo
      ? documentalKeys.documentosByTipo(filters.tipo)
      : filters?.estado
      ? documentalKeys.documentosByEstado(filters.estado)
      : documentalKeys.documentos(),
    queryFn: async () => {
      const { data } = await apiClient.get<Documento[]>('/api/hseq/documentos/documentos/', { params: filters });
      return data;
    },
  });
}

export function useDocumento(id: number) {
  return useQuery({
    queryKey: documentalKeys.documento(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Documento>(`/api/hseq/documentos/documentos/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateDocumentoDTO) => {
      const { data } = await apiClient.post<Documento>('/api/hseq/documentos/documentos/', datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.documentos() });
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
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateDocumentoDTO }) => {
      const { data } = await apiClient.patch<Documento>(`/api/hseq/documentos/documentos/${id}/`, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.documentos() });
      queryClient.invalidateQueries({ queryKey: documentalKeys.documento(id) });
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
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/hseq/documentos/documentos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.documentos() });
      toast.success('Documento eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar documento');
    },
  });
}

export function useEnviarRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<Documento>(`/api/hseq/documentos/documentos/${id}/enviar_revision/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.documento(id) });
      toast.success('Documento enviado a revisión');
    },
    onError: () => {
      toast.error('Error al enviar documento a revisión');
    },
  });
}

export function useAprobarDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<Documento>(`/api/hseq/documentos/documentos/${id}/aprobar/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.documento(id) });
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
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<Documento>(`/api/hseq/documentos/documentos/${id}/publicar/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.documento(id) });
      queryClient.invalidateQueries({ queryKey: documentalKeys.listadoMaestro() });
      toast.success('Documento publicado exitosamente');
    },
    onError: () => {
      toast.error('Error al publicar documento');
    },
  });
}

export function useMarcarObsoleto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo?: string }) => {
      const { data } = await apiClient.post<Documento>(`/api/hseq/documentos/documentos/${id}/marcar_obsoleto/`, { motivo });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.documento(id) });
      queryClient.invalidateQueries({ queryKey: documentalKeys.listadoMaestro() });
      toast.success('Documento marcado como obsoleto');
    },
    onError: () => {
      toast.error('Error al marcar documento como obsoleto');
    },
  });
}

export function useArchivarDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<Documento>(`/api/hseq/documentos/documentos/${id}/archivar/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.documento(id) });
      toast.success('Documento archivado exitosamente');
    },
    onError: () => {
      toast.error('Error al archivar documento');
    },
  });
}

export function useGenerarNuevaVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: { tipo_cambio: string; descripcion_cambios: string; contenido: string } }) => {
      const { data } = await apiClient.post<Documento>(`/api/hseq/documentos/documentos/${id}/nueva_version/`, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.documento(id) });
      queryClient.invalidateQueries({ queryKey: documentalKeys.versiones(id) });
      toast.success('Nueva versión generada exitosamente');
    },
    onError: () => {
      toast.error('Error al generar nueva versión');
    },
  });
}

export function useGenerarPDF() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.get(`/api/hseq/documentos/documentos/${id}/generar_pdf/`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('PDF generado exitosamente');
    },
    onError: () => {
      toast.error('Error al generar PDF');
    },
  });
}

// ==================== VERSIONES HOOKS ====================

export function useVersionesDocumento(documentoId: number) {
  return useQuery({
    queryKey: documentalKeys.versiones(documentoId),
    queryFn: async () => {
      const { data } = await apiClient.get<VersionDocumento[]>(`/api/hseq/documentos/documentos/${documentoId}/versiones/`);
      return data;
    },
    enabled: !!documentoId,
  });
}

// ==================== CAMPOS FORMULARIO HOOKS ====================

export function useCamposFormulario(plantillaId: number) {
  return useQuery({
    queryKey: documentalKeys.camposFormulario(plantillaId),
    queryFn: async () => {
      const { data } = await apiClient.get<CampoFormulario[]>(`/api/hseq/documentos/plantillas/${plantillaId}/campos/`);
      return data;
    },
    enabled: !!plantillaId,
  });
}

export function useCreateCampoFormulario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateCampoFormularioDTO) => {
      const { data } = await apiClient.post<CampoFormulario>('/api/hseq/documentos/campos/', datos);
      return data;
    },
    onSuccess: (data) => {
      if (data.plantilla) {
        queryClient.invalidateQueries({ queryKey: documentalKeys.camposFormulario(data.plantilla) });
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
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateCampoFormularioDTO }) => {
      const { data } = await apiClient.patch<CampoFormulario>(`/api/hseq/documentos/campos/${id}/`, datos);
      return data;
    },
    onSuccess: (data) => {
      if (data.plantilla) {
        queryClient.invalidateQueries({ queryKey: documentalKeys.camposFormulario(data.plantilla) });
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
    mutationFn: async ({ id, plantillaId }: { id: number; plantillaId: number }) => {
      await apiClient.delete(`/api/hseq/documentos/campos/${id}/`);
      return plantillaId;
    },
    onSuccess: (plantillaId) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.camposFormulario(plantillaId) });
      toast.success('Campo de formulario eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar campo de formulario');
    },
  });
}

// ==================== FIRMAS HOOKS ====================

export function useFirmasDocumento(documentoId: number) {
  return useQuery({
    queryKey: documentalKeys.firmas(documentoId),
    queryFn: async () => {
      const { data } = await apiClient.get<FirmaDocumento[]>(`/api/hseq/documentos/documentos/${documentoId}/firmas/`);
      return data;
    },
    enabled: !!documentoId,
  });
}

export function useFirmasPendientes() {
  return useQuery({
    queryKey: documentalKeys.firmasPendientes(),
    queryFn: async () => {
      const { data } = await apiClient.get<FirmaDocumento[]>('/api/hseq/documentos/firmas/pendientes/');
      return data;
    },
  });
}

export function useCreateFirmaDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateFirmaDocumentoDTO) => {
      const { data } = await apiClient.post<FirmaDocumento>('/api/hseq/documentos/firmas/', datos);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.firmas(data.documento) });
      toast.success('Solicitud de firma creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear solicitud de firma');
    },
  });
}

export function useFirmarDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: FirmarDocumentoDTO }) => {
      const { data } = await apiClient.post<FirmaDocumento>(`/api/hseq/documentos/firmas/${id}/firmar/`, datos);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.firmas(data.documento) });
      queryClient.invalidateQueries({ queryKey: documentalKeys.firmasPendientes() });
      queryClient.invalidateQueries({ queryKey: documentalKeys.documento(data.documento) });
      toast.success('Documento firmado exitosamente');
    },
    onError: () => {
      toast.error('Error al firmar documento');
    },
  });
}

export function useRechazarFirma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: RechazarFirmaDTO }) => {
      const { data } = await apiClient.post<FirmaDocumento>(`/api/hseq/documentos/firmas/${id}/rechazar/`, datos);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.firmas(data.documento) });
      queryClient.invalidateQueries({ queryKey: documentalKeys.firmasPendientes() });
      queryClient.invalidateQueries({ queryKey: documentalKeys.documento(data.documento) });
      toast.success('Firma rechazada');
    },
    onError: () => {
      toast.error('Error al rechazar firma');
    },
  });
}

// ==================== CONTROL DOCUMENTAL HOOKS ====================

export function useControlDocumental(documentoId: number) {
  return useQuery({
    queryKey: documentalKeys.controles(documentoId),
    queryFn: async () => {
      const { data } = await apiClient.get<ControlDocumental[]>(`/api/hseq/documentos/documentos/${documentoId}/controles/`);
      return data;
    },
    enabled: !!documentoId,
  });
}

export function useDistribuirDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: any }) => {
      const { data } = await apiClient.post<ControlDocumental>(`/api/hseq/documentos/documentos/${id}/distribuir/`, datos);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentalKeys.controles(data.documento) });
      toast.success('Documento distribuido exitosamente');
    },
    onError: () => {
      toast.error('Error al distribuir documento');
    },
  });
}

// ==================== LISTADO MAESTRO HOOKS ====================

export function useListadoMaestro() {
  return useQuery({
    queryKey: documentalKeys.listadoMaestro(),
    queryFn: async () => {
      const { data } = await apiClient.get<ListadoMaestro[]>('/api/hseq/documentos/listado-maestro/');
      return data;
    },
  });
}
