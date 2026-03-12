/**
 * Hooks de TanStack Query para el modulo Workflow Engine
 *
 * Cubre: plantillas, nodos, transiciones, roles, campos,
 * instancias, tareas, historial, notificaciones, monitoreo
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createQueryKeys } from '@/lib/query-keys';
import {
  plantillasApi,
  categoriasApi,
  nodosApi,
  transicionesApi,
  camposApi,
  rolesApi,
  instanciasApi,
  tareasApi,
  historialApi,
  notificacionesApi,
  monitoreoApi,
} from '../api/workflowApi';
import type {
  PlantillaFilters,
  InstanciaFilters,
  TareaFilters,
  NotificacionFilters,
  CreatePlantillaDTO,
  UpdatePlantillaDTO,
  CreateNodoDTO,
  UpdateNodoDTO,
  CreateTransicionDTO,
  UpdateTransicionDTO,
  CreateCampoFormularioDTO,
  CreateRolFlujoDTO,
  IniciarFlujoDTO,
  CompletarTareaDTO,
  RechazarTareaDTO,
} from '../types/workflow.types';

// ============================================================
// QUERY KEYS
// ============================================================

const categoriaKeys = createQueryKeys('wf-categorias');
const plantillaKeys = createQueryKeys<PlantillaFilters>('wf-plantillas');
const nodoKeys = createQueryKeys('wf-nodos');
const transicionKeys = createQueryKeys('wf-transiciones');
const campoKeys = createQueryKeys('wf-campos');
const rolKeys = createQueryKeys('wf-roles');
const instanciaKeys = createQueryKeys<InstanciaFilters>('wf-instancias');
const tareaKeys = createQueryKeys<TareaFilters>('wf-tareas');
const historialKeys = createQueryKeys('wf-historial');
const notificacionKeys = createQueryKeys<NotificacionFilters>('wf-notificaciones');
const monitoreoKeys = createQueryKeys('wf-monitoreo');

// ============================================================
// CATEGORIAS
// ============================================================

export function useCategorias() {
  return useQuery({
    queryKey: categoriaKeys.lists(),
    queryFn: () => categoriasApi.getAll(),
  });
}

// ============================================================
// PLANTILLAS (Templates)
// ============================================================

export function usePlantillas(filters?: PlantillaFilters) {
  return useQuery({
    queryKey: plantillaKeys.list(filters),
    queryFn: () => plantillasApi.getAll(filters),
  });
}

export function usePlantillasActivas() {
  return useQuery({
    queryKey: plantillaKeys.custom('activas'),
    queryFn: () => plantillasApi.getActivas(),
  });
}

export function usePlantilla(id: number | null) {
  return useQuery({
    queryKey: plantillaKeys.detail(id ?? 0),
    queryFn: () => plantillasApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreatePlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlantillaDTO) => plantillasApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plantillaKeys.lists() });
      toast.success('Plantilla creada exitosamente');
    },
    onError: () => toast.error('Error al crear la plantilla'),
  });
}

export function useUpdatePlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlantillaDTO }) =>
      plantillasApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: plantillaKeys.lists() });
      qc.invalidateQueries({ queryKey: plantillaKeys.detail(id) });
      toast.success('Plantilla actualizada');
    },
    onError: () => toast.error('Error al actualizar la plantilla'),
  });
}

export function useDeletePlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plantillasApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plantillaKeys.lists() });
      toast.success('Plantilla eliminada');
    },
    onError: () => toast.error('Error al eliminar la plantilla'),
  });
}

export function useActivarPlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plantillasApi.activar(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: plantillaKeys.lists() });
      qc.invalidateQueries({ queryKey: plantillaKeys.detail(id) });
      toast.success('Plantilla activada');
    },
    onError: () => toast.error('Error al activar la plantilla'),
  });
}

export function useCrearVersionPlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plantillasApi.crearVersion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plantillaKeys.lists() });
      toast.success('Nueva version creada');
    },
    onError: () => toast.error('Error al crear nueva version'),
  });
}

// ============================================================
// NODOS (Nodes)
// ============================================================

export function useNodos(_plantillaId: number | null) {
  return useQuery({
    queryKey: nodoKeys.list({ plantilla: _plantillaId }),
    queryFn: () => nodosApi.getAll({ plantilla: _plantillaId! }),
    enabled: !!_plantillaId,
  });
}

export function useCreateNodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNodoDTO) => nodosApi.create(data),
    onSuccess: (nodo) => {
      qc.invalidateQueries({ queryKey: nodoKeys.list({ plantilla: nodo.plantilla }) });
      qc.invalidateQueries({ queryKey: plantillaKeys.detail(nodo.plantilla) });
    },
    onError: () => toast.error('Error al crear el nodo'),
  });
}

export function useUpdateNodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNodoDTO }) => nodosApi.update(id, data),
    onSuccess: (nodo) => {
      qc.invalidateQueries({ queryKey: nodoKeys.list({ plantilla: nodo.plantilla }) });
    },
  });
}

export function useDeleteNodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, _plantillaId }: { id: number; _plantillaId: number }) => nodosApi.delete(id),
    onSuccess: (_, { _plantillaId }) => {
      qc.invalidateQueries({ queryKey: nodoKeys.list({ plantilla: _plantillaId }) });
      qc.invalidateQueries({ queryKey: transicionKeys.list({ plantilla: _plantillaId }) });
      qc.invalidateQueries({ queryKey: plantillaKeys.detail(_plantillaId) });
    },
    onError: () => toast.error('Error al eliminar el nodo'),
  });
}

// ============================================================
// TRANSICIONES (Edges)
// ============================================================

export function useTransiciones(_plantillaId: number | null) {
  return useQuery({
    queryKey: transicionKeys.list({ plantilla: _plantillaId }),
    queryFn: () => transicionesApi.getAll({ plantilla: _plantillaId! }),
    enabled: !!_plantillaId,
  });
}

export function useCreateTransicion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransicionDTO) => transicionesApi.create(data),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: transicionKeys.list({ plantilla: t.plantilla }) });
      qc.invalidateQueries({ queryKey: plantillaKeys.detail(t.plantilla) });
    },
    onError: () => toast.error('Error al crear la transicion'),
  });
}

export function useUpdateTransicion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransicionDTO }) =>
      transicionesApi.update(id, data),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: transicionKeys.list({ plantilla: t.plantilla }) });
    },
  });
}

export function useDeleteTransicion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, _plantillaId }: { id: number; _plantillaId: number }) =>
      transicionesApi.delete(id),
    onSuccess: (_, { _plantillaId }) => {
      qc.invalidateQueries({ queryKey: transicionKeys.list({ plantilla: _plantillaId }) });
      qc.invalidateQueries({ queryKey: plantillaKeys.detail(_plantillaId) });
    },
    onError: () => toast.error('Error al eliminar la transicion'),
  });
}

// ============================================================
// CAMPOS FORMULARIO
// ============================================================

export function useCamposFormulario(_nodoId: number | null) {
  return useQuery({
    queryKey: campoKeys.list({ nodo: _nodoId }),
    queryFn: () => camposApi.getAll({ nodo: _nodoId! }),
    enabled: !!_nodoId,
  });
}

export function useCreateCampo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampoFormularioDTO) => camposApi.create(data),
    onSuccess: (campo) => {
      qc.invalidateQueries({ queryKey: campoKeys.list({ nodo: campo.nodo }) });
    },
    onError: () => toast.error('Error al crear el campo'),
  });
}

export function useDeleteCampo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, _nodoId }: { id: number; _nodoId: number }) => camposApi.delete(id),
    onSuccess: (_, { _nodoId }) => {
      qc.invalidateQueries({ queryKey: campoKeys.list({ nodo: _nodoId }) });
    },
    onError: () => toast.error('Error al eliminar el campo'),
  });
}

// ============================================================
// ROLES FLUJO
// ============================================================

export function useRolesFlujo() {
  return useQuery({
    queryKey: rolKeys.lists(),
    queryFn: () => rolesApi.getAll({ activo: true }),
  });
}

export function useCreateRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRolFlujoDTO) => rolesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rolKeys.lists() });
      toast.success('Rol creado exitosamente');
    },
    onError: () => toast.error('Error al crear el rol'),
  });
}

// ============================================================
// INSTANCIAS (Execution)
// ============================================================

export function useInstancias(filters?: InstanciaFilters) {
  return useQuery({
    queryKey: instanciaKeys.list(filters),
    queryFn: () => instanciasApi.getAll(filters),
  });
}

export function useInstancia(id: number | null) {
  return useQuery({
    queryKey: instanciaKeys.detail(id ?? 0),
    queryFn: () => instanciasApi.getById(id!),
    enabled: !!id,
  });
}

export function useMisInstancias() {
  return useQuery({
    queryKey: instanciaKeys.custom('mis-instancias'),
    queryFn: () => instanciasApi.misInstancias(),
  });
}

export function useInstanciasVencidas() {
  return useQuery({
    queryKey: instanciaKeys.custom('vencidas'),
    queryFn: () => instanciasApi.vencidas(),
  });
}

export function useIniciarFlujo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IniciarFlujoDTO) => instanciasApi.iniciarFlujo(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instanciaKeys.lists() });
      qc.invalidateQueries({ queryKey: tareaKeys.lists() });
      toast.success('Flujo iniciado exitosamente');
    },
    onError: () => toast.error('Error al iniciar el flujo'),
  });
}

export function useEstadisticasInstancias() {
  return useQuery({
    queryKey: instanciaKeys.custom('estadisticas'),
    queryFn: () => instanciasApi.estadisticas(),
  });
}

// ============================================================
// TAREAS
// ============================================================

export function useTareas(filters?: TareaFilters) {
  return useQuery({
    queryKey: tareaKeys.list(filters),
    queryFn: () => tareasApi.getAll(filters),
  });
}

export function useTarea(id: number | null) {
  return useQuery({
    queryKey: tareaKeys.detail(id ?? 0),
    queryFn: () => tareasApi.getById(id!),
    enabled: !!id,
  });
}

export function useMisTareas(estado?: string) {
  return useQuery({
    queryKey: tareaKeys.custom('mis-tareas', estado),
    queryFn: () => tareasApi.misTareas(estado ? { estado } : undefined),
  });
}

export function useCompletarTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompletarTareaDTO }) =>
      tareasApi.completar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tareaKeys.lists() });
      qc.invalidateQueries({ queryKey: tareaKeys.custom('mis-tareas') });
      qc.invalidateQueries({ queryKey: instanciaKeys.lists() });
      toast.success('Tarea completada');
    },
    onError: () => toast.error('Error al completar la tarea'),
  });
}

export function useRechazarTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RechazarTareaDTO }) =>
      tareasApi.rechazar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tareaKeys.lists() });
      qc.invalidateQueries({ queryKey: tareaKeys.custom('mis-tareas') });
      qc.invalidateQueries({ queryKey: instanciaKeys.lists() });
      toast.success('Tarea rechazada');
    },
    onError: () => toast.error('Error al rechazar la tarea'),
  });
}

export function useEstadisticasTareas() {
  return useQuery({
    queryKey: tareaKeys.custom('estadisticas'),
    queryFn: () => tareasApi.estadisticas(),
  });
}

// ============================================================
// HISTORIAL
// ============================================================

export function useHistorialTarea(tareaId: number | null) {
  return useQuery({
    queryKey: historialKeys.list({ tarea: tareaId }),
    queryFn: () => historialApi.getAll({ tarea: tareaId! }),
    enabled: !!tareaId,
  });
}

// ============================================================
// NOTIFICACIONES
// ============================================================

export function useNotificacionesFlujo(filters?: NotificacionFilters) {
  return useQuery({
    queryKey: notificacionKeys.list(filters),
    queryFn: () => notificacionesApi.getAll(filters),
  });
}

export function useNotificacionesNoLeidas() {
  return useQuery({
    queryKey: notificacionKeys.custom('no-leidas'),
    queryFn: () => notificacionesApi.noLeidas(),
    refetchInterval: 30000, // Cada 30s
  });
}

export function useMarcarNotificacionLeida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificacionesApi.marcarLeida(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificacionKeys.lists() });
      qc.invalidateQueries({ queryKey: notificacionKeys.custom('no-leidas') });
    },
  });
}

// ============================================================
// MONITOREO
// ============================================================

export function useMonitoreoDashboard() {
  return useQuery({
    queryKey: monitoreoKeys.custom('dashboard'),
    queryFn: () => monitoreoApi.getDashboard(),
  });
}

export function useMonitoreoMetricas(params?: { plantilla?: number; periodo?: string }) {
  return useQuery({
    queryKey: monitoreoKeys.list(params),
    queryFn: () => monitoreoApi.getMetricas(params),
  });
}

export function useMonitoreoAlertas(params?: { estado?: string; tipo?: string }) {
  return useQuery({
    queryKey: monitoreoKeys.custom('alertas', params),
    queryFn: () => monitoreoApi.getAlertas(params),
  });
}
