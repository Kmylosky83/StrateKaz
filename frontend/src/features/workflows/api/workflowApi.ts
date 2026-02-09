/**
 * API Client para el modulo Workflow Engine
 *
 * Endpoints base:
 * - /api/workflows/disenador/  (plantillas, nodos, transiciones, campos, roles)
 * - /api/workflows/ejecucion/  (instancias, tareas, historial, archivos, notificaciones)
 * - /api/workflows/monitoreo/  (metricas, alertas)
 */
import axiosInstance from '@/api/axios-config';
import type {
  PaginatedResponse,
  CategoriaFlujo,
  PlantillaFlujo,
  NodoFlujo,
  TransicionFlujo,
  CampoFormulario,
  RolFlujo,
  InstanciaFlujo,
  TareaActiva,
  HistorialTarea,
  NotificacionFlujo,
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
  PlantillaFilters,
  InstanciaFilters,
  TareaFilters,
  NotificacionFilters,
} from '../types/workflow.types';

const DISENADOR_URL = '/workflows/disenador';
const EJECUCION_URL = '/workflows/ejecucion';
const MONITOREO_URL = '/workflows/monitoreo';

// ============================================================
// CATEGORIAS
// ============================================================

export const categoriasApi = {
  getAll: (params?: Record<string, unknown>) =>
    axiosInstance.get<PaginatedResponse<CategoriaFlujo>>(
      `${DISENADOR_URL}/categorias/`,
      { params }
    ).then(r => r.data),

  getById: (id: number) =>
    axiosInstance.get<CategoriaFlujo>(
      `${DISENADOR_URL}/categorias/${id}/`
    ).then(r => r.data),

  create: (data: Partial<CategoriaFlujo>) =>
    axiosInstance.post<CategoriaFlujo>(
      `${DISENADOR_URL}/categorias/`,
      data
    ).then(r => r.data),

  update: (id: number, data: Partial<CategoriaFlujo>) =>
    axiosInstance.patch<CategoriaFlujo>(
      `${DISENADOR_URL}/categorias/${id}/`,
      data
    ).then(r => r.data),

  delete: (id: number) =>
    axiosInstance.delete(`${DISENADOR_URL}/categorias/${id}/`),
};

// ============================================================
// PLANTILLAS (Templates)
// ============================================================

export const plantillasApi = {
  getAll: (params?: PlantillaFilters) =>
    axiosInstance.get<PaginatedResponse<PlantillaFlujo>>(
      `${DISENADOR_URL}/plantillas/`,
      { params }
    ).then(r => r.data),

  getActivas: () =>
    axiosInstance.get<PlantillaFlujo[]>(
      `${DISENADOR_URL}/plantillas/activas/`
    ).then(r => r.data),

  getById: (id: number) =>
    axiosInstance.get<PlantillaFlujo>(
      `${DISENADOR_URL}/plantillas/${id}/`
    ).then(r => r.data),

  create: (data: CreatePlantillaDTO) =>
    axiosInstance.post<PlantillaFlujo>(
      `${DISENADOR_URL}/plantillas/`,
      data
    ).then(r => r.data),

  update: (id: number, data: UpdatePlantillaDTO) =>
    axiosInstance.patch<PlantillaFlujo>(
      `${DISENADOR_URL}/plantillas/${id}/`,
      data
    ).then(r => r.data),

  delete: (id: number) =>
    axiosInstance.delete(`${DISENADOR_URL}/plantillas/${id}/`),

  activar: (id: number) =>
    axiosInstance.post<PlantillaFlujo>(
      `${DISENADOR_URL}/plantillas/${id}/activar/`
    ).then(r => r.data),

  crearVersion: (id: number) =>
    axiosInstance.post<PlantillaFlujo>(
      `${DISENADOR_URL}/plantillas/${id}/crear_nueva_version/`
    ).then(r => r.data),
};

// ============================================================
// NODOS (Nodes)
// ============================================================

export const nodosApi = {
  getAll: (params?: { plantilla?: number }) =>
    axiosInstance.get<PaginatedResponse<NodoFlujo>>(
      `${DISENADOR_URL}/nodos/`,
      { params }
    ).then(r => r.data),

  getById: (id: number) =>
    axiosInstance.get<NodoFlujo>(
      `${DISENADOR_URL}/nodos/${id}/`
    ).then(r => r.data),

  create: (data: CreateNodoDTO) =>
    axiosInstance.post<NodoFlujo>(
      `${DISENADOR_URL}/nodos/`,
      data
    ).then(r => r.data),

  update: (id: number, data: UpdateNodoDTO) =>
    axiosInstance.patch<NodoFlujo>(
      `${DISENADOR_URL}/nodos/${id}/`,
      data
    ).then(r => r.data),

  delete: (id: number) =>
    axiosInstance.delete(`${DISENADOR_URL}/nodos/${id}/`),
};

// ============================================================
// TRANSICIONES (Edges)
// ============================================================

export const transicionesApi = {
  getAll: (params?: { plantilla?: number }) =>
    axiosInstance.get<PaginatedResponse<TransicionFlujo>>(
      `${DISENADOR_URL}/transiciones/`,
      { params }
    ).then(r => r.data),

  getById: (id: number) =>
    axiosInstance.get<TransicionFlujo>(
      `${DISENADOR_URL}/transiciones/${id}/`
    ).then(r => r.data),

  create: (data: CreateTransicionDTO) =>
    axiosInstance.post<TransicionFlujo>(
      `${DISENADOR_URL}/transiciones/`,
      data
    ).then(r => r.data),

  update: (id: number, data: UpdateTransicionDTO) =>
    axiosInstance.patch<TransicionFlujo>(
      `${DISENADOR_URL}/transiciones/${id}/`,
      data
    ).then(r => r.data),

  delete: (id: number) =>
    axiosInstance.delete(`${DISENADOR_URL}/transiciones/${id}/`),
};

// ============================================================
// CAMPOS FORMULARIO (Form Fields)
// ============================================================

export const camposApi = {
  getAll: (params?: { nodo?: number }) =>
    axiosInstance.get<PaginatedResponse<CampoFormulario>>(
      `${DISENADOR_URL}/campos-formulario/`,
      { params }
    ).then(r => r.data),

  getById: (id: number) =>
    axiosInstance.get<CampoFormulario>(
      `${DISENADOR_URL}/campos-formulario/${id}/`
    ).then(r => r.data),

  create: (data: CreateCampoFormularioDTO) =>
    axiosInstance.post<CampoFormulario>(
      `${DISENADOR_URL}/campos-formulario/`,
      data
    ).then(r => r.data),

  update: (id: number, data: Partial<CreateCampoFormularioDTO>) =>
    axiosInstance.patch<CampoFormulario>(
      `${DISENADOR_URL}/campos-formulario/${id}/`,
      data
    ).then(r => r.data),

  delete: (id: number) =>
    axiosInstance.delete(`${DISENADOR_URL}/campos-formulario/${id}/`),
};

// ============================================================
// ROLES FLUJO (Workflow Roles)
// ============================================================

export const rolesApi = {
  getAll: (params?: { activo?: boolean }) =>
    axiosInstance.get<PaginatedResponse<RolFlujo>>(
      `${DISENADOR_URL}/roles/`,
      { params }
    ).then(r => r.data),

  getById: (id: number) =>
    axiosInstance.get<RolFlujo>(
      `${DISENADOR_URL}/roles/${id}/`
    ).then(r => r.data),

  create: (data: CreateRolFlujoDTO) =>
    axiosInstance.post<RolFlujo>(
      `${DISENADOR_URL}/roles/`,
      data
    ).then(r => r.data),

  update: (id: number, data: Partial<CreateRolFlujoDTO>) =>
    axiosInstance.patch<RolFlujo>(
      `${DISENADOR_URL}/roles/${id}/`,
      data
    ).then(r => r.data),

  delete: (id: number) =>
    axiosInstance.delete(`${DISENADOR_URL}/roles/${id}/`),
};

// ============================================================
// INSTANCIAS (Workflow Instances)
// ============================================================

export const instanciasApi = {
  getAll: (params?: InstanciaFilters) =>
    axiosInstance.get<PaginatedResponse<InstanciaFlujo>>(
      `${EJECUCION_URL}/instancias/`,
      { params }
    ).then(r => r.data),

  getById: (id: number) =>
    axiosInstance.get<InstanciaFlujo>(
      `${EJECUCION_URL}/instancias/${id}/`
    ).then(r => r.data),

  misInstancias: () =>
    axiosInstance.get<{ total: number; instancias: InstanciaFlujo[] }>(
      `${EJECUCION_URL}/instancias/mis_instancias/`
    ).then(r => r.data),

  vencidas: () =>
    axiosInstance.get<{ total: number; instancias: InstanciaFlujo[] }>(
      `${EJECUCION_URL}/instancias/vencidas/`
    ).then(r => r.data),

  iniciarFlujo: (data: IniciarFlujoDTO) =>
    axiosInstance.post<InstanciaFlujo>(
      `${EJECUCION_URL}/instancias/iniciar_flujo/`,
      data
    ).then(r => r.data),

  estadisticas: () =>
    axiosInstance.get<{
      total: number;
      activas: number;
      completadas: number;
      canceladas: number;
    }>(`${EJECUCION_URL}/instancias/estadisticas/`).then(r => r.data),
};

// ============================================================
// TAREAS (Active Tasks)
// ============================================================

export const tareasApi = {
  getAll: (params?: TareaFilters) =>
    axiosInstance.get<PaginatedResponse<TareaActiva>>(
      `${EJECUCION_URL}/tareas/`,
      { params }
    ).then(r => r.data),

  getById: (id: number) =>
    axiosInstance.get<TareaActiva>(
      `${EJECUCION_URL}/tareas/${id}/`
    ).then(r => r.data),

  misTareas: (params?: { estado?: string }) =>
    axiosInstance.get<{ total: number; tareas: TareaActiva[] }>(
      `${EJECUCION_URL}/tareas/mis_tareas/`,
      { params }
    ).then(r => r.data),

  completar: (id: number, data: CompletarTareaDTO) =>
    axiosInstance.post<TareaActiva>(
      `${EJECUCION_URL}/tareas/${id}/completar/`,
      data
    ).then(r => r.data),

  rechazar: (id: number, data: RechazarTareaDTO) =>
    axiosInstance.post<TareaActiva>(
      `${EJECUCION_URL}/tareas/${id}/rechazar/`,
      data
    ).then(r => r.data),

  estadisticas: () =>
    axiosInstance.get<{
      pendientes: number;
      en_progreso: number;
      completadas_hoy: number;
      vencidas: number;
    }>(`${EJECUCION_URL}/tareas/estadisticas/`).then(r => r.data),
};

// ============================================================
// HISTORIAL
// ============================================================

export const historialApi = {
  getAll: (params?: { tarea?: number; instancia?: number }) =>
    axiosInstance.get<PaginatedResponse<HistorialTarea>>(
      `${EJECUCION_URL}/historial/`,
      { params }
    ).then(r => r.data),
};

// ============================================================
// NOTIFICACIONES
// ============================================================

export const notificacionesApi = {
  getAll: (params?: NotificacionFilters) =>
    axiosInstance.get<PaginatedResponse<NotificacionFlujo>>(
      `${EJECUCION_URL}/notificaciones/`,
      { params }
    ).then(r => r.data),

  marcarLeida: (id: number) =>
    axiosInstance.post(
      `${EJECUCION_URL}/notificaciones/${id}/marcar_leida/`
    ).then(r => r.data),

  noLeidas: () =>
    axiosInstance.get<{ total: number; notificaciones: NotificacionFlujo[] }>(
      `${EJECUCION_URL}/notificaciones/no_leidas/`
    ).then(r => r.data),
};

// ============================================================
// MONITOREO (Metricas)
// ============================================================

export const monitoreoApi = {
  getMetricas: (params?: { plantilla?: number; periodo?: string }) =>
    axiosInstance.get(
      `${MONITOREO_URL}/metricas/`,
      { params }
    ).then(r => r.data),

  getAlertas: (params?: { estado?: string; tipo?: string }) =>
    axiosInstance.get(
      `${MONITOREO_URL}/alertas/`,
      { params }
    ).then(r => r.data),

  getDashboard: () =>
    axiosInstance.get(
      `${MONITOREO_URL}/metricas/dashboard/`
    ).then(r => r.data),
};
