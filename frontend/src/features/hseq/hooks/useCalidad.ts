/**
 * Hooks React Query para Módulo de Calidad - HSEQ Management
 * Sistema de gestión de calidad con No Conformidades, Acciones Correctivas,
 * Salidas No Conformes, Solicitudes de Cambio y Control de Cambios
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import calidadApi from '../api/calidadApi';
import type {
  NoConformidad,
  AccionCorrectiva,
  SalidaNoConforme,
  SolicitudCambio,
  ControlCambio,
  CreateNoConformidadDTO,
  UpdateNoConformidadDTO,
  CreateAccionCorrectivaDTO,
  UpdateAccionCorrectivaDTO,
  CreateSalidaNoConformeDTO,
  UpdateSalidaNoConformeDTO,
  CreateSolicitudCambioDTO,
  UpdateSolicitudCambioDTO,
  CreateControlCambioDTO,
  UpdateControlCambioDTO,
  EstadoNoConformidad,
  TipoNoConformidad,
  OrigenNoConformidad,
  SeveridadNoConformidad,
  EstadoAccion,
  TipoAccion,
  EstadoSalidaNC,
  TipoSalidaNC,
  DisposicionSalidaNC,
  EstadoSolicitudCambio,
  TipoSolicitudCambio,
  PrioridadCambio,
  EstadisticasNoConformidades,
  PaginatedResponse,
} from '../types/calidad.types';

// ==================== QUERY KEYS ====================

export const calidadKeys = {
  all: ['hseq', 'calidad'] as const,

  // No Conformidades
  noConformidades: () => [...calidadKeys.all, 'no-conformidades'] as const,
  noConformidad: (id: number) => [...calidadKeys.noConformidades(), id] as const,
  noConformidadesFiltered: (filters: Record<string, any>) =>
    [...calidadKeys.noConformidades(), 'filtered', filters] as const,
  noConformidadesEstadisticas: () => [...calidadKeys.noConformidades(), 'estadisticas'] as const,

  // Acciones Correctivas
  acciones: () => [...calidadKeys.all, 'acciones'] as const,
  accion: (id: number) => [...calidadKeys.acciones(), id] as const,
  accionesFiltered: (filters: Record<string, any>) =>
    [...calidadKeys.acciones(), 'filtered', filters] as const,
  accionesPorNC: (ncId: number) => [...calidadKeys.acciones(), 'por-nc', ncId] as const,
  accionesVencidas: () => [...calidadKeys.acciones(), 'vencidas'] as const,

  // Salidas No Conformes
  salidas: () => [...calidadKeys.all, 'salidas-no-conformes'] as const,
  salida: (id: number) => [...calidadKeys.salidas(), id] as const,
  salidasFiltered: (filters: Record<string, any>) =>
    [...calidadKeys.salidas(), 'filtered', filters] as const,

  // Solicitudes de Cambio
  solicitudes: () => [...calidadKeys.all, 'solicitudes-cambio'] as const,
  solicitud: (id: number) => [...calidadKeys.solicitudes(), id] as const,
  solicitudesFiltered: (filters: Record<string, any>) =>
    [...calidadKeys.solicitudes(), 'filtered', filters] as const,

  // Control de Cambios
  controles: () => [...calidadKeys.all, 'control-cambios'] as const,
  control: (id: number) => [...calidadKeys.controles(), id] as const,
  controlesFiltered: (filters: Record<string, any>) =>
    [...calidadKeys.controles(), 'filtered', filters] as const,
};

// ==================== NO CONFORMIDADES HOOKS ====================

/**
 * Hook para obtener listado de no conformidades con filtros opcionales
 */
export function useNoConformidades(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoNoConformidad;
  tipo?: TipoNoConformidad;
  origen?: OrigenNoConformidad;
  severidad?: SeveridadNoConformidad;
  responsable?: number;
  vencidas?: boolean;
}) {
  return useQuery({
    queryKey: params ? calidadKeys.noConformidadesFiltered(params) : calidadKeys.noConformidades(),
    queryFn: async () => {
      const data = await calidadApi.noConformidad.getAll(params);
      return data;
    },
  });
}

/**
 * Hook para obtener una no conformidad específica
 */
export function useNoConformidad(id: number) {
  return useQuery({
    queryKey: calidadKeys.noConformidad(id),
    queryFn: async () => {
      const data = await calidadApi.noConformidad.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para crear una nueva no conformidad
 */
export function useCreateNoConformidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateNoConformidadDTO) => {
      const data = await calidadApi.noConformidad.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidades() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidadesEstadisticas() });
      toast.success('No conformidad creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear no conformidad');
    },
  });
}

/**
 * Hook para actualizar una no conformidad
 */
export function useUpdateNoConformidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateNoConformidadDTO }) => {
      const data = await calidadApi.noConformidad.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidades() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidad(id) });
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidadesEstadisticas() });
      toast.success('No conformidad actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar no conformidad');
    },
  });
}

/**
 * Hook para eliminar una no conformidad
 */
export function useDeleteNoConformidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await calidadApi.noConformidad.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidades() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidadesEstadisticas() });
      toast.success('No conformidad eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar no conformidad');
    },
  });
}

/**
 * Hook para cambiar estado de una no conformidad (asignar responsable)
 */
export function useCambiarEstadoNC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      tipo,
      responsable_id,
    }: {
      id: number;
      tipo: 'analisis' | 'cierre';
      responsable_id: number;
    }) => {
      const data = await calidadApi.noConformidad.asignarResponsable(id, { tipo, responsable_id });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidades() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidad(id) });
      toast.success('Responsable asignado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al asignar responsable');
    },
  });
}

/**
 * Hook para cerrar una no conformidad
 */
export function useCerrarNC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: number;
      datos: {
        verificacion_eficaz?: boolean;
        comentarios_verificacion?: string;
        evidencia_cierre?: File;
      };
    }) => {
      const data = await calidadApi.noConformidad.cerrar(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidades() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidad(id) });
      queryClient.invalidateQueries({ queryKey: calidadKeys.noConformidadesEstadisticas() });
      toast.success('No conformidad cerrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cerrar no conformidad');
    },
  });
}

/**
 * Hook para obtener estadísticas de no conformidades
 */
export function useEstadisticasNC() {
  return useQuery({
    queryKey: calidadKeys.noConformidadesEstadisticas(),
    queryFn: async () => {
      const data = await calidadApi.noConformidad.estadisticas();
      return data;
    },
  });
}

// ==================== ACCIONES CORRECTIVAS HOOKS ====================

/**
 * Hook para obtener listado de acciones correctivas con filtros
 */
export function useAccionesCorrectivas(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoAccion;
  tipo?: TipoAccion;
  responsable?: number;
  no_conformidad?: number;
  vencidas?: boolean;
}) {
  return useQuery({
    queryKey: params ? calidadKeys.accionesFiltered(params) : calidadKeys.acciones(),
    queryFn: async () => {
      const data = await calidadApi.accionCorrectiva.getAll(params);
      return data;
    },
  });
}

/**
 * Hook para obtener una acción correctiva específica
 */
export function useAccionCorrectiva(id: number) {
  return useQuery({
    queryKey: calidadKeys.accion(id),
    queryFn: async () => {
      const data = await calidadApi.accionCorrectiva.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para crear una nueva acción correctiva
 */
export function useCreateAccionCorrectiva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateAccionCorrectivaDTO) => {
      const data = await calidadApi.accionCorrectiva.create(datos);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.acciones() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.accionesPorNC(data.no_conformidad) });
      queryClient.invalidateQueries({
        queryKey: calidadKeys.noConformidad(data.no_conformidad),
      });
      toast.success('Acción correctiva creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear acción correctiva');
    },
  });
}

/**
 * Hook para actualizar una acción correctiva
 */
export function useUpdateAccionCorrectiva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateAccionCorrectivaDTO }) => {
      const data = await calidadApi.accionCorrectiva.update(id, datos);
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.acciones() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.accion(id) });
      queryClient.invalidateQueries({ queryKey: calidadKeys.accionesPorNC(data.no_conformidad) });
      toast.success('Acción correctiva actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar acción correctiva');
    },
  });
}

/**
 * Hook para eliminar una acción correctiva
 */
export function useDeleteAccionCorrectiva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await calidadApi.accionCorrectiva.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.acciones() });
      toast.success('Acción correctiva eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar acción correctiva');
    },
  });
}

/**
 * Hook para ejecutar una acción correctiva
 */
export function useEjecutarAccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: number;
      datos: { comentarios?: string; evidencia?: File };
    }) => {
      const data = await calidadApi.accionCorrectiva.ejecutar(id, datos);
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.acciones() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.accion(id) });
      queryClient.invalidateQueries({ queryKey: calidadKeys.accionesPorNC(data.no_conformidad) });
      toast.success('Acción marcada como ejecutada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al ejecutar acción');
    },
  });
}

/**
 * Hook para verificar eficacia de una acción correctiva
 */
export function useVerificarEficaciaAccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: number;
      datos: {
        eficaz?: boolean;
        metodo_verificacion?: string;
        resultados?: string;
        evidencia?: File;
      };
    }) => {
      const data = await calidadApi.accionCorrectiva.verificarEficacia(id, datos);
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.acciones() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.accion(id) });
      queryClient.invalidateQueries({ queryKey: calidadKeys.accionesPorNC(data.no_conformidad) });
      queryClient.invalidateQueries({
        queryKey: calidadKeys.noConformidad(data.no_conformidad),
      });
      toast.success('Eficacia verificada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al verificar eficacia');
    },
  });
}

/**
 * Hook para obtener acciones vencidas
 */
export function useAccionesVencidas() {
  return useQuery({
    queryKey: calidadKeys.accionesVencidas(),
    queryFn: async () => {
      const data = await calidadApi.accionCorrectiva.getAll({ vencidas: true });
      return data;
    },
  });
}

/**
 * Hook para obtener acciones de una no conformidad específica
 */
export function useAccionesPorNC(ncId: number) {
  return useQuery({
    queryKey: calidadKeys.accionesPorNC(ncId),
    queryFn: async () => {
      const data = await calidadApi.accionCorrectiva.porNoConformidad(ncId);
      return data;
    },
    enabled: !!ncId,
  });
}

// ==================== SALIDAS NO CONFORMES HOOKS ====================

/**
 * Hook para obtener listado de salidas no conformes con filtros
 */
export function useSalidasNoConformes(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoSalidaNC;
  tipo?: TipoSalidaNC;
  bloqueada?: boolean;
  disposicion?: DisposicionSalidaNC;
}) {
  return useQuery({
    queryKey: params ? calidadKeys.salidasFiltered(params) : calidadKeys.salidas(),
    queryFn: async () => {
      const data = await calidadApi.salidaNoConforme.getAll(params);
      return data;
    },
  });
}

/**
 * Hook para obtener una salida no conforme específica
 */
export function useSalidaNoConforme(id: number) {
  return useQuery({
    queryKey: calidadKeys.salida(id),
    queryFn: async () => {
      const data = await calidadApi.salidaNoConforme.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para crear una nueva salida no conforme
 */
export function useCreateSalidaNoConforme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateSalidaNoConformeDTO) => {
      const data = await calidadApi.salidaNoConforme.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.salidas() });
      toast.success('Salida no conforme creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear salida no conforme');
    },
  });
}

/**
 * Hook para actualizar una salida no conforme
 */
export function useUpdateSalidaNoConforme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateSalidaNoConformeDTO }) => {
      const data = await calidadApi.salidaNoConforme.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.salidas() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.salida(id) });
      toast.success('Salida no conforme actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar salida no conforme');
    },
  });
}

/**
 * Hook para eliminar una salida no conforme
 */
export function useDeleteSalidaNoConforme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await calidadApi.salidaNoConforme.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.salidas() });
      toast.success('Salida no conforme eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar salida no conforme');
    },
  });
}

/**
 * Hook para definir disposición de salida no conforme
 */
export function useDefinirDisposicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: number;
      datos: { disposicion: DisposicionSalidaNC; justificacion?: string };
    }) => {
      const data = await calidadApi.salidaNoConforme.definirDisposicion(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.salidas() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.salida(id) });
      toast.success('Disposición definida exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al definir disposición');
    },
  });
}

/**
 * Hook para resolver una salida no conforme
 * (Alias de liberar - mantener para compatibilidad)
 */
export function useResolverSalida() {
  return useLiberarSalida();
}

/**
 * Hook para liberar producto de bloqueo
 */
export function useLiberarSalida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await calidadApi.salidaNoConforme.liberar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.salidas() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.salida(id) });
      toast.success('Producto liberado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al liberar producto');
    },
  });
}

// ==================== SOLICITUDES DE CAMBIO HOOKS ====================

/**
 * Hook para obtener listado de solicitudes de cambio con filtros
 */
export function useSolicitudesCambio(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoSolicitudCambio;
  tipo?: TipoSolicitudCambio;
  prioridad?: PrioridadCambio;
}) {
  return useQuery({
    queryKey: params ? calidadKeys.solicitudesFiltered(params) : calidadKeys.solicitudes(),
    queryFn: async () => {
      const data = await calidadApi.solicitudCambio.getAll(params);
      return data;
    },
  });
}

/**
 * Hook para obtener una solicitud de cambio específica
 */
export function useSolicitudCambio(id: number) {
  return useQuery({
    queryKey: calidadKeys.solicitud(id),
    queryFn: async () => {
      const data = await calidadApi.solicitudCambio.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para crear una nueva solicitud de cambio
 */
export function useCreateSolicitudCambio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateSolicitudCambioDTO) => {
      const data = await calidadApi.solicitudCambio.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.solicitudes() });
      toast.success('Solicitud de cambio creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear solicitud de cambio');
    },
  });
}

/**
 * Hook para actualizar una solicitud de cambio
 */
export function useUpdateSolicitudCambio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateSolicitudCambioDTO }) => {
      const data = await calidadApi.solicitudCambio.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.solicitudes() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.solicitud(id) });
      toast.success('Solicitud de cambio actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar solicitud de cambio');
    },
  });
}

/**
 * Hook para eliminar una solicitud de cambio
 */
export function useDeleteSolicitudCambio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await calidadApi.solicitudCambio.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.solicitudes() });
      toast.success('Solicitud de cambio eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar solicitud de cambio');
    },
  });
}

/**
 * Hook para aprobar una solicitud de cambio
 */
export function useAprobarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos?: { comentarios?: string } }) => {
      const data = await calidadApi.solicitudCambio.aprobar(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.solicitudes() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.solicitud(id) });
      toast.success('Solicitud de cambio aprobada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al aprobar solicitud');
    },
  });
}

/**
 * Hook para rechazar una solicitud de cambio
 */
export function useRechazarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: { comentarios: string } }) => {
      const data = await calidadApi.solicitudCambio.rechazar(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.solicitudes() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.solicitud(id) });
      toast.success('Solicitud de cambio rechazada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al rechazar solicitud');
    },
  });
}

// ==================== CONTROL DE CAMBIOS HOOKS ====================

/**
 * Hook para obtener listado de controles de cambio con filtros
 */
export function useControlesCambio(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  verificacion_realizada?: boolean;
  eficaz?: boolean;
}) {
  return useQuery({
    queryKey: params ? calidadKeys.controlesFiltered(params) : calidadKeys.controles(),
    queryFn: async () => {
      const data = await calidadApi.controlCambio.getAll(params);
      return data;
    },
  });
}

/**
 * Hook para obtener un control de cambio específico
 */
export function useControlCambio(id: number) {
  return useQuery({
    queryKey: calidadKeys.control(id),
    queryFn: async () => {
      const data = await calidadApi.controlCambio.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para crear un nuevo control de cambio
 */
export function useCreateControlCambio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateControlCambioDTO) => {
      const data = await calidadApi.controlCambio.create(datos);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.controles() });
      queryClient.invalidateQueries({
        queryKey: calidadKeys.solicitud(data.solicitud_cambio),
      });
      toast.success('Control de cambio creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear control de cambio');
    },
  });
}

/**
 * Hook para actualizar un control de cambio
 */
export function useUpdateControlCambio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateControlCambioDTO }) => {
      const data = await calidadApi.controlCambio.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.controles() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.control(id) });
      toast.success('Control de cambio actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar control de cambio');
    },
  });
}

/**
 * Hook para verificar eficacia de un cambio implementado
 */
export function useVerificarControlCambio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: number;
      datos: {
        eficaz: boolean;
        metodo_verificacion: string;
        resultados_verificacion: string;
      };
    }) => {
      const data = await calidadApi.controlCambio.verificarEficacia(id, datos);
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: calidadKeys.controles() });
      queryClient.invalidateQueries({ queryKey: calidadKeys.control(id) });
      queryClient.invalidateQueries({
        queryKey: calidadKeys.solicitud(data.solicitud_cambio),
      });
      toast.success('Verificación de cambio completada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al verificar cambio');
    },
  });
}
