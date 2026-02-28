/**
 * Hooks React Query para Módulo de Gestión de Comités - HSEQ Management
 * Sistema de gestión integral de comités HSEQ
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import comitesApi from '../api/comitesApi';

/** Extrae el mensaje de error de un AxiosError o Error genérico */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as Record<string, unknown> | undefined)?.detail;
    if (typeof detail === 'string') return detail;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
import type {
  CreateTipoComiteDTO,
  UpdateTipoComiteDTO,
  CreateComiteDTO,
  UpdateComiteDTO,
  CreateMiembroComiteDTO,
  UpdateMiembroComiteDTO,
  CreateReunionDTO,
  UpdateReunionDTO,
  CreateActaReunionDTO,
  CreateCompromisoDTO,
  CreateVotacionDTO,
  CreateVotoMiembroDTO,
  RegistrarAsistenciaDTO,
  AprobarActaDTO,
  CerrarCompromisoDTO,
  CerrarVotacionDTO,
  ActualizarAvanceCompromisoDTO,
  RetirarMiembroDTO,
} from '../types/comites.types';

// ==================== QUERY KEYS ====================

export const comitesKeys = {
  all: ['hseq', 'comites'] as const,

  // Tipos de Comité
  tiposComite: () => [...comitesKeys.all, 'tipos-comite'] as const,
  tipoComiteById: (id: number) => [...comitesKeys.tiposComite(), id] as const,
  tiposComiteActivos: () => [...comitesKeys.tiposComite(), 'activos'] as const,

  // Comités
  comites: () => [...comitesKeys.all, 'comites'] as const,
  comiteById: (id: number) => [...comitesKeys.comites(), id] as const,
  comitesFiltered: (filters: Record<string, unknown>) =>
    [...comitesKeys.comites(), 'filtered', filters] as const,
  comitesVigentes: () => [...comitesKeys.comites(), 'vigentes'] as const,
  comiteEstadisticas: (id: number) => [...comitesKeys.comites(), id, 'estadisticas'] as const,

  // Miembros
  miembros: () => [...comitesKeys.all, 'miembros'] as const,
  miembroById: (id: number) => [...comitesKeys.miembros(), id] as const,
  miembrosFiltered: (filters: Record<string, unknown>) =>
    [...comitesKeys.miembros(), 'filtered', filters] as const,

  // Reuniones
  reuniones: () => [...comitesKeys.all, 'reuniones'] as const,
  reunionById: (id: number) => [...comitesKeys.reuniones(), id] as const,
  reunionesFiltered: (filters: Record<string, unknown>) =>
    [...comitesKeys.reuniones(), 'filtered', filters] as const,

  // Actas
  actas: () => [...comitesKeys.all, 'actas'] as const,
  actaById: (id: number) => [...comitesKeys.actas(), id] as const,
  actasFiltered: (filters: Record<string, unknown>) =>
    [...comitesKeys.actas(), 'filtered', filters] as const,

  // Compromisos
  compromisos: () => [...comitesKeys.all, 'compromisos'] as const,
  compromisoById: (id: number) => [...comitesKeys.compromisos(), id] as const,
  compromisosFiltered: (filters: Record<string, unknown>) =>
    [...comitesKeys.compromisos(), 'filtered', filters] as const,
  compromisosVencidos: () => [...comitesKeys.compromisos(), 'vencidos'] as const,
  compromisosProximosVencer: () => [...comitesKeys.compromisos(), 'proximos-vencer'] as const,

  // Seguimientos
  seguimientos: () => [...comitesKeys.all, 'seguimientos'] as const,
  seguimientoById: (id: number) => [...comitesKeys.seguimientos(), id] as const,
  seguimientosFiltered: (filters: Record<string, unknown>) =>
    [...comitesKeys.seguimientos(), 'filtered', filters] as const,

  // Votaciones
  votaciones: () => [...comitesKeys.all, 'votaciones'] as const,
  votacionById: (id: number) => [...comitesKeys.votaciones(), id] as const,
  votacionesFiltered: (filters: Record<string, unknown>) =>
    [...comitesKeys.votaciones(), 'filtered', filters] as const,
  votacionResultados: (id: number) => [...comitesKeys.votaciones(), id, 'resultados'] as const,

  // Votos
  votos: () => [...comitesKeys.all, 'votos'] as const,
  votoById: (id: number) => [...comitesKeys.votos(), id] as const,
  votosFiltered: (filters: Record<string, unknown>) =>
    [...comitesKeys.votos(), 'filtered', filters] as const,
};

// ==================== TIPOS DE COMITÉ ====================

export function useTiposComite(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: comitesKeys.tiposComite(),
    queryFn: () => comitesApi.tipoComite.getAll(params),
  });
}

export function useTiposComiteActivos(params?: { empresa_id?: number }) {
  return useQuery({
    queryKey: comitesKeys.tiposComiteActivos(),
    queryFn: () => comitesApi.tipoComite.getActivos(params),
  });
}

export function useCreateTipoComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateTipoComiteDTO) => comitesApi.tipoComite.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.tiposComite() });
      toast.success('Tipo de comité creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear tipo de comité'));
    },
  });
}

export function useUpdateTipoComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateTipoComiteDTO }) =>
      comitesApi.tipoComite.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.tiposComite() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.tipoComiteById(id) });
      toast.success('Tipo de comité actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar tipo de comité'));
    },
  });
}

export function useDeleteTipoComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => comitesApi.tipoComite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.tiposComite() });
      toast.success('Tipo de comité eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar tipo de comité'));
    },
  });
}

// ==================== COMITÉS ====================

export function useComites(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comitesKeys.comitesFiltered(params) : comitesKeys.comites(),
    queryFn: () => comitesApi.comite.getAll(params),
  });
}

export function useComiteById(id: number) {
  return useQuery({
    queryKey: comitesKeys.comiteById(id),
    queryFn: () => comitesApi.comite.getById(id),
    enabled: !!id,
  });
}

export function useComitesVigentes(params?: { empresa_id?: number }) {
  return useQuery({
    queryKey: comitesKeys.comitesVigentes(),
    queryFn: () => comitesApi.comite.getVigentes(params),
  });
}

export function useComiteEstadisticas(id: number) {
  return useQuery({
    queryKey: comitesKeys.comiteEstadisticas(id),
    queryFn: () => comitesApi.comite.getEstadisticas(id),
    enabled: !!id,
  });
}

export function useCreateComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateComiteDTO) => comitesApi.comite.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.comites() });
      toast.success('Comité creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear comité'));
    },
  });
}

export function useUpdateComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateComiteDTO }) =>
      comitesApi.comite.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.comites() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.comiteById(id) });
      toast.success('Comité actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar comité'));
    },
  });
}

export function useActivarComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => comitesApi.comite.activar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.comites() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.comiteById(id) });
      toast.success('Comité activado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al activar comité'));
    },
  });
}

export function useDeleteComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => comitesApi.comite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.comites() });
      toast.success('Comité eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar comité'));
    },
  });
}

// ==================== MIEMBROS ====================

export function useMiembrosComite(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comitesKeys.miembrosFiltered(params) : comitesKeys.miembros(),
    queryFn: () => comitesApi.miembroComite.getAll(params),
  });
}

export function useCreateMiembroComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateMiembroComiteDTO) => comitesApi.miembroComite.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.miembros() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.comites() });
      toast.success('Miembro agregado al comité exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al agregar miembro'));
    },
  });
}

export function useUpdateMiembroComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateMiembroComiteDTO }) =>
      comitesApi.miembroComite.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.miembros() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.miembroById(id) });
      toast.success('Miembro actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar miembro'));
    },
  });
}

export function useRetirarMiembroComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: RetirarMiembroDTO }) =>
      comitesApi.miembroComite.retirar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.miembros() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.comites() });
      toast.success('Miembro retirado del comité');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al retirar miembro'));
    },
  });
}

export function useDeleteMiembroComite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => comitesApi.miembroComite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.miembros() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.comites() });
      toast.success('Miembro eliminado del comité');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar miembro'));
    },
  });
}

// ==================== REUNIONES ====================

export function useReuniones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comitesKeys.reunionesFiltered(params) : comitesKeys.reuniones(),
    queryFn: () => comitesApi.reunion.getAll(params),
  });
}

export function useReunionById(id: number) {
  return useQuery({
    queryKey: comitesKeys.reunionById(id),
    queryFn: () => comitesApi.reunion.getById(id),
    enabled: !!id,
  });
}

export function useCreateReunion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateReunionDTO) => comitesApi.reunion.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.reuniones() });
      toast.success('Reunión creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear reunión'));
    },
  });
}

export function useUpdateReunion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateReunionDTO }) =>
      comitesApi.reunion.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.reuniones() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.reunionById(id) });
      toast.success('Reunión actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar reunión'));
    },
  });
}

export function useRegistrarAsistenciaReunion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: RegistrarAsistenciaDTO }) =>
      comitesApi.reunion.registrarAsistencia(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.reuniones() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.reunionById(id) });
      toast.success('Asistencia registrada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al registrar asistencia'));
    },
  });
}

export function useIniciarReunion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => comitesApi.reunion.iniciar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.reuniones() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.reunionById(id) });
      toast.success('Reunión iniciada');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al iniciar reunión'));
    },
  });
}

export function useFinalizarReunion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => comitesApi.reunion.finalizar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.reuniones() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.reunionById(id) });
      toast.success('Reunión finalizada');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al finalizar reunión'));
    },
  });
}

// ==================== ACTAS ====================

export function useActasReunion(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comitesKeys.actasFiltered(params) : comitesKeys.actas(),
    queryFn: () => comitesApi.actaReunion.getAll(params),
  });
}

export function useActaById(id: number) {
  return useQuery({
    queryKey: comitesKeys.actaById(id),
    queryFn: () => comitesApi.actaReunion.getById(id),
    enabled: !!id,
  });
}

export function useCreateActaReunion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateActaReunionDTO) => comitesApi.actaReunion.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.actas() });
      toast.success('Acta creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear acta'));
    },
  });
}

export function useAprobarActa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: AprobarActaDTO }) =>
      comitesApi.actaReunion.aprobar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.actas() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.actaById(id) });
      toast.success('Acta aprobada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al aprobar acta'));
    },
  });
}

export function useDeleteActaReunion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => comitesApi.actaReunion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.actas() });
      toast.success('Acta eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar acta'));
    },
  });
}

// ==================== COMPROMISOS ====================

export function useCompromisos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comitesKeys.compromisosFiltered(params) : comitesKeys.compromisos(),
    queryFn: () => comitesApi.compromiso.getAll(params),
  });
}

export function useCompromisosVencidos(params?: { empresa_id?: number }) {
  return useQuery({
    queryKey: comitesKeys.compromisosVencidos(),
    queryFn: () => comitesApi.compromiso.getVencidos(params),
  });
}

export function useCompromisosProximosVencer(params?: { empresa_id?: number }) {
  return useQuery({
    queryKey: comitesKeys.compromisosProximosVencer(),
    queryFn: () => comitesApi.compromiso.getProximosVencer(params),
  });
}

export function useCreateCompromiso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateCompromisoDTO) => comitesApi.compromiso.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.compromisos() });
      toast.success('Compromiso creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear compromiso'));
    },
  });
}

export function useCerrarCompromiso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CerrarCompromisoDTO }) =>
      comitesApi.compromiso.cerrar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.compromisos() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.compromisoById(id) });
      toast.success('Compromiso cerrado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al cerrar compromiso'));
    },
  });
}

export function useActualizarAvanceCompromiso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarAvanceCompromisoDTO }) =>
      comitesApi.compromiso.actualizarAvance(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.compromisos() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.compromisoById(id) });
      toast.success('Avance actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar avance'));
    },
  });
}

// ==================== VOTACIONES ====================

export function useVotaciones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comitesKeys.votacionesFiltered(params) : comitesKeys.votaciones(),
    queryFn: () => comitesApi.votacion.getAll(params),
  });
}

export function useVotacionById(id: number) {
  return useQuery({
    queryKey: comitesKeys.votacionById(id),
    queryFn: () => comitesApi.votacion.getById(id),
    enabled: !!id,
  });
}

export function useCreateVotacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateVotacionDTO) => comitesApi.votacion.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.votaciones() });
      toast.success('Votación creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear votación'));
    },
  });
}

export function useCerrarVotacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CerrarVotacionDTO }) =>
      comitesApi.votacion.cerrar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.votaciones() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.votacionById(id) });
      toast.success('Votación cerrada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al cerrar votación'));
    },
  });
}

export function useDeleteVotacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => comitesApi.votacion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.votaciones() });
      toast.success('Votación eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar votación'));
    },
  });
}

export function useVotacionResultados(id: number) {
  return useQuery({
    queryKey: comitesKeys.votacionResultados(id),
    queryFn: () => comitesApi.votacion.getResultados(id),
    enabled: !!id,
  });
}

// ==================== VOTOS ====================

export function useCreateVotoMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateVotoMiembroDTO) => comitesApi.votoMiembro.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comitesKeys.votos() });
      queryClient.invalidateQueries({ queryKey: comitesKeys.votaciones() });
      toast.success('Voto registrado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al registrar voto'));
    },
  });
}
