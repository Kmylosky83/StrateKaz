/**
 * API Client para Calidad - HSEQ Management
 * Sistema de Gestion Grasas y Huesos del Norte
 *
 * Incluye:
 * - No Conformidades
 * - Acciones Correctivas/Preventivas/Mejora
 * - Salidas No Conformes
 * - Solicitudes de Cambio
 * - Control de Cambios
 */
import { apiClient } from '@/lib/api-client';
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
  PaginatedResponse,
  EstadisticasCalidad,
  EstadoNoConformidad,
  OrigenNoConformidad,
  SeveridadNoConformidad,
  MetodoAnalisis,
  EstadoAccion,
  EstadoSalidaNoConforme,
  DisposicionSalidaNoConforme,
  EstadoSolicitudCambio,
  PrioridadCambio,
} from '../types/calidad.types';

const BASE_URL = '/api/hseq/calidad';

// ==================== NO CONFORMIDAD ====================

export const noConformidadApi = {
  /**
   * Obtener todas las no conformidades
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo?: string;
    origen?: string;
    severidad?: string;
    estado?: string;
    detectado_por?: number;
    responsable_analisis?: number;
    responsable_cierre?: number;
    fecha_deteccion_desde?: string;
    fecha_deteccion_hasta?: string;
    proceso_relacionado?: string;
  }): Promise<PaginatedResponse<NoConformidad>> => {
    const response = await apiClient.get(`${BASE_URL}/no-conformidades/`, { params });
    return response.data;
  },

  /**
   * Obtener una no conformidad por ID
   */
  getById: async (id: number): Promise<NoConformidad> => {
    const response = await apiClient.get(`${BASE_URL}/no-conformidades/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva no conformidad
   */
  create: async (data: CreateNoConformidadDTO): Promise<NoConformidad> => {
    const response = await apiClient.post(`${BASE_URL}/no-conformidades/`, data);
    return response.data;
  },

  /**
   * Actualizar una no conformidad
   */
  update: async (id: number, data: UpdateNoConformidadDTO): Promise<NoConformidad> => {
    const response = await apiClient.patch(`${BASE_URL}/no-conformidades/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una no conformidad
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/no-conformidades/${id}/`);
  },

  /**
   * Cambiar estado de la no conformidad
   */
  cambiarEstado: async (id: number, estado: EstadoNoConformidad): Promise<NoConformidad> => {
    const response = await apiClient.post(`${BASE_URL}/no-conformidades/${id}/cambiar-estado/`, {
      estado,
    });
    return response.data;
  },

  /**
   * Asignar responsable a la no conformidad
   */
  asignarResponsable: async (
    id: number,
    responsable_id: number,
    tipo: 'analisis' | 'cierre'
  ): Promise<NoConformidad> => {
    const response = await apiClient.post(`${BASE_URL}/no-conformidades/${id}/asignar-responsable/`, {
      responsable_id,
      tipo,
    });
    return response.data;
  },

  /**
   * Completar analisis de causa raiz
   */
  completarAnalisis: async (
    id: number,
    analisis: string,
    metodo: MetodoAnalisis
  ): Promise<NoConformidad> => {
    const response = await apiClient.post(`${BASE_URL}/no-conformidades/${id}/completar-analisis/`, {
      analisis_causa_raiz: analisis,
      metodo_analisis: metodo,
      fecha_analisis: new Date().toISOString().split('T')[0],
    });
    return response.data;
  },

  /**
   * Verificar eficacia de la no conformidad
   */
  verificarEficacia: async (id: number, eficaz: boolean, comentarios?: string): Promise<NoConformidad> => {
    const response = await apiClient.post(`${BASE_URL}/no-conformidades/${id}/verificar-eficacia/`, {
      verificacion_eficaz: eficaz,
      comentarios_verificacion: comentarios,
      fecha_verificacion: new Date().toISOString().split('T')[0],
    });
    return response.data;
  },

  /**
   * Cerrar la no conformidad
   */
  cerrar: async (id: number, comentarios_cierre?: string): Promise<NoConformidad> => {
    const response = await apiClient.post(`${BASE_URL}/no-conformidades/${id}/cerrar/`, {
      fecha_cierre: new Date().toISOString().split('T')[0],
      comentarios_cierre,
      estado: 'CERRADA',
    });
    return response.data;
  },

  /**
   * Obtener estadisticas de no conformidades
   */
  getEstadisticas: async (): Promise<EstadisticasCalidad> => {
    const response = await apiClient.get(`${BASE_URL}/no-conformidades/estadisticas/`);
    return response.data;
  },

  /**
   * Obtener no conformidades por origen
   */
  porOrigen: async (origen: OrigenNoConformidad): Promise<NoConformidad[]> => {
    const response = await apiClient.get(`${BASE_URL}/no-conformidades/`, {
      params: { origen },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener no conformidades por severidad
   */
  porSeveridad: async (severidad: SeveridadNoConformidad): Promise<NoConformidad[]> => {
    const response = await apiClient.get(`${BASE_URL}/no-conformidades/`, {
      params: { severidad },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener no conformidades por estado
   */
  porEstado: async (estado: EstadoNoConformidad): Promise<NoConformidad[]> => {
    const response = await apiClient.get(`${BASE_URL}/no-conformidades/`, {
      params: { estado },
    });
    return response.data.results || response.data;
  },
};

// ==================== ACCION CORRECTIVA ====================

export const accionCorrectivaApi = {
  /**
   * Obtener todas las acciones correctivas
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo?: string;
    estado?: string;
    no_conformidad?: number;
    responsable?: number;
    verificador?: number;
    fecha_limite_desde?: string;
    fecha_limite_hasta?: string;
    vencidas?: boolean;
  }): Promise<PaginatedResponse<AccionCorrectiva>> => {
    const response = await apiClient.get(`${BASE_URL}/acciones-correctivas/`, { params });
    return response.data;
  },

  /**
   * Obtener una accion correctiva por ID
   */
  getById: async (id: number): Promise<AccionCorrectiva> => {
    const response = await apiClient.get(`${BASE_URL}/acciones-correctivas/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva accion correctiva
   */
  create: async (data: CreateAccionCorrectivaDTO): Promise<AccionCorrectiva> => {
    const response = await apiClient.post(`${BASE_URL}/acciones-correctivas/`, data);
    return response.data;
  },

  /**
   * Actualizar una accion correctiva
   */
  update: async (id: number, data: UpdateAccionCorrectivaDTO): Promise<AccionCorrectiva> => {
    const response = await apiClient.patch(`${BASE_URL}/acciones-correctivas/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una accion correctiva
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/acciones-correctivas/${id}/`);
  },

  /**
   * Cambiar estado de la accion correctiva
   */
  cambiarEstado: async (id: number, estado: EstadoAccion): Promise<AccionCorrectiva> => {
    const response = await apiClient.post(`${BASE_URL}/acciones-correctivas/${id}/cambiar-estado/`, {
      estado,
    });
    return response.data;
  },

  /**
   * Ejecutar una accion correctiva
   */
  ejecutar: async (
    id: number,
    comentarios: string,
    fecha?: string,
    evidencia?: string
  ): Promise<AccionCorrectiva> => {
    const response = await apiClient.post(`${BASE_URL}/acciones-correctivas/${id}/ejecutar/`, {
      fecha_ejecucion: fecha || new Date().toISOString().split('T')[0],
      comentarios_ejecucion: comentarios,
      evidencia_ejecucion: evidencia,
      estado: 'EJECUTADA',
    });
    return response.data;
  },

  /**
   * Verificar eficacia de la accion correctiva
   */
  verificarEficacia: async (
    id: number,
    eficaz: boolean,
    metodo: string,
    resultados: string
  ): Promise<AccionCorrectiva> => {
    const response = await apiClient.post(`${BASE_URL}/acciones-correctivas/${id}/verificar-eficacia/`, {
      fecha_verificacion: new Date().toISOString().split('T')[0],
      eficaz,
      metodo_verificacion: metodo,
      resultados_verificacion: resultados,
      estado: 'VERIFICADA',
    });
    return response.data;
  },

  /**
   * Obtener acciones correctivas por no conformidad
   */
  porNoConformidad: async (ncId: number): Promise<AccionCorrectiva[]> => {
    const response = await apiClient.get(`${BASE_URL}/acciones-correctivas/`, {
      params: { no_conformidad: ncId },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener acciones correctivas vencidas
   */
  vencidas: async (): Promise<AccionCorrectiva[]> => {
    const response = await apiClient.get(`${BASE_URL}/acciones-correctivas/`, {
      params: { vencidas: true },
    });
    return response.data.results || response.data;
  },
};

// ==================== SALIDA NO CONFORME ====================

export const salidaNoConformeApi = {
  /**
   * Obtener todas las salidas no conformes
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo?: string;
    estado?: string;
    disposicion?: string;
    riesgo_uso?: string;
    bloqueada?: boolean;
    detectado_por?: number;
    fecha_deteccion_desde?: string;
    fecha_deteccion_hasta?: string;
    lote_numero?: string;
  }): Promise<PaginatedResponse<SalidaNoConforme>> => {
    const response = await apiClient.get(`${BASE_URL}/salidas-no-conformes/`, { params });
    return response.data;
  },

  /**
   * Obtener una salida no conforme por ID
   */
  getById: async (id: number): Promise<SalidaNoConforme> => {
    const response = await apiClient.get(`${BASE_URL}/salidas-no-conformes/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva salida no conforme
   */
  create: async (data: CreateSalidaNoConformeDTO): Promise<SalidaNoConforme> => {
    const response = await apiClient.post(`${BASE_URL}/salidas-no-conformes/`, data);
    return response.data;
  },

  /**
   * Actualizar una salida no conforme
   */
  update: async (id: number, data: UpdateSalidaNoConformeDTO): Promise<SalidaNoConforme> => {
    const response = await apiClient.patch(`${BASE_URL}/salidas-no-conformes/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una salida no conforme
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/salidas-no-conformes/${id}/`);
  },

  /**
   * Cambiar estado de la salida no conforme
   */
  cambiarEstado: async (id: number, estado: EstadoSalidaNoConforme): Promise<SalidaNoConforme> => {
    const response = await apiClient.post(`${BASE_URL}/salidas-no-conformes/${id}/cambiar-estado/`, {
      estado,
    });
    return response.data;
  },

  /**
   * Definir disposicion de la salida no conforme
   */
  definirDisposicion: async (
    id: number,
    disposicion: DisposicionSalidaNoConforme,
    justificacion: string
  ): Promise<SalidaNoConforme> => {
    const response = await apiClient.post(`${BASE_URL}/salidas-no-conformes/${id}/definir-disposicion/`, {
      disposicion,
      justificacion_disposicion: justificacion,
      fecha_disposicion: new Date().toISOString().split('T')[0],
      estado: 'DISPOSICION_DEFINIDA',
    });
    return response.data;
  },

  /**
   * Resolver la salida no conforme
   */
  resolver: async (id: number, acciones: string, fecha?: string): Promise<SalidaNoConforme> => {
    const response = await apiClient.post(`${BASE_URL}/salidas-no-conformes/${id}/resolver/`, {
      acciones_tomadas: acciones,
      fecha_resolucion: fecha || new Date().toISOString().split('T')[0],
      estado: 'RESUELTA',
    });
    return response.data;
  },

  /**
   * Liberar la salida no conforme
   */
  liberar: async (id: number): Promise<SalidaNoConforme> => {
    const response = await apiClient.post(`${BASE_URL}/salidas-no-conformes/${id}/liberar/`, {
      bloqueada: false,
      estado: 'CERRADA',
    });
    return response.data;
  },

  /**
   * Obtener salidas no conformes por estado
   */
  porEstado: async (estado: EstadoSalidaNoConforme): Promise<SalidaNoConforme[]> => {
    const response = await apiClient.get(`${BASE_URL}/salidas-no-conformes/`, {
      params: { estado },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener salidas no conformes bloqueadas
   */
  bloqueadas: async (): Promise<SalidaNoConforme[]> => {
    const response = await apiClient.get(`${BASE_URL}/salidas-no-conformes/`, {
      params: { bloqueada: true },
    });
    return response.data.results || response.data;
  },
};

// ==================== SOLICITUD CAMBIO ====================

export const solicitudCambioApi = {
  /**
   * Obtener todas las solicitudes de cambio
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo?: string;
    estado?: string;
    prioridad?: string;
    solicitante?: number;
    aprobado_por?: number;
    responsable_implementacion?: number;
    fecha_solicitud_desde?: string;
    fecha_solicitud_hasta?: string;
  }): Promise<PaginatedResponse<SolicitudCambio>> => {
    const response = await apiClient.get(`${BASE_URL}/solicitudes-cambio/`, { params });
    return response.data;
  },

  /**
   * Obtener una solicitud de cambio por ID
   */
  getById: async (id: number): Promise<SolicitudCambio> => {
    const response = await apiClient.get(`${BASE_URL}/solicitudes-cambio/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva solicitud de cambio
   */
  create: async (data: CreateSolicitudCambioDTO): Promise<SolicitudCambio> => {
    const response = await apiClient.post(`${BASE_URL}/solicitudes-cambio/`, data);
    return response.data;
  },

  /**
   * Actualizar una solicitud de cambio
   */
  update: async (id: number, data: UpdateSolicitudCambioDTO): Promise<SolicitudCambio> => {
    const response = await apiClient.patch(`${BASE_URL}/solicitudes-cambio/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una solicitud de cambio
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/solicitudes-cambio/${id}/`);
  },

  /**
   * Cambiar estado de la solicitud de cambio
   */
  cambiarEstado: async (id: number, estado: EstadoSolicitudCambio): Promise<SolicitudCambio> => {
    const response = await apiClient.post(`${BASE_URL}/solicitudes-cambio/${id}/cambiar-estado/`, {
      estado,
    });
    return response.data;
  },

  /**
   * Aprobar la solicitud de cambio
   */
  aprobar: async (id: number, comentarios?: string, fecha?: string): Promise<SolicitudCambio> => {
    const response = await apiClient.post(`${BASE_URL}/solicitudes-cambio/${id}/aprobar/`, {
      fecha_aprobacion: fecha || new Date().toISOString().split('T')[0],
      comentarios_aprobacion: comentarios,
      estado: 'APROBADA',
    });
    return response.data;
  },

  /**
   * Rechazar la solicitud de cambio
   */
  rechazar: async (id: number, comentarios: string, motivo?: string): Promise<SolicitudCambio> => {
    const response = await apiClient.post(`${BASE_URL}/solicitudes-cambio/${id}/rechazar/`, {
      fecha_revision: new Date().toISOString().split('T')[0],
      comentarios_revision: motivo ? `${motivo} - ${comentarios}` : comentarios,
      estado: 'RECHAZADA',
    });
    return response.data;
  },

  /**
   * Obtener solicitudes de cambio por prioridad
   */
  porPrioridad: async (prioridad: PrioridadCambio): Promise<SolicitudCambio[]> => {
    const response = await apiClient.get(`${BASE_URL}/solicitudes-cambio/`, {
      params: { prioridad },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener solicitudes de cambio por estado
   */
  porEstado: async (estado: EstadoSolicitudCambio): Promise<SolicitudCambio[]> => {
    const response = await apiClient.get(`${BASE_URL}/solicitudes-cambio/`, {
      params: { estado },
    });
    return response.data.results || response.data;
  },
};

// ==================== CONTROL CAMBIO ====================

export const controlCambioApi = {
  /**
   * Obtener todos los controles de cambio
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    solicitud_cambio?: number;
    verificacion_realizada?: boolean;
    eficaz?: boolean;
    fecha_implementacion_desde?: string;
    fecha_implementacion_hasta?: string;
    capacitacion_realizada?: boolean;
    seguimiento_planificado?: boolean;
  }): Promise<PaginatedResponse<ControlCambio>> => {
    const response = await apiClient.get(`${BASE_URL}/control-cambios/`, { params });
    return response.data;
  },

  /**
   * Obtener un control de cambio por ID
   */
  getById: async (id: number): Promise<ControlCambio> => {
    const response = await apiClient.get(`${BASE_URL}/control-cambios/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo control de cambio
   */
  create: async (data: CreateControlCambioDTO): Promise<ControlCambio> => {
    const response = await apiClient.post(`${BASE_URL}/control-cambios/`, data);
    return response.data;
  },

  /**
   * Actualizar un control de cambio
   */
  update: async (id: number, data: UpdateControlCambioDTO): Promise<ControlCambio> => {
    const response = await apiClient.patch(`${BASE_URL}/control-cambios/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un control de cambio
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/control-cambios/${id}/`);
  },

  /**
   * Verificar eficacia del control de cambio
   */
  verificarEficacia: async (id: number, eficaz: boolean, resultados: string): Promise<ControlCambio> => {
    const response = await apiClient.post(`${BASE_URL}/control-cambios/${id}/verificar-eficacia/`, {
      verificacion_realizada: true,
      fecha_verificacion: new Date().toISOString().split('T')[0],
      eficaz,
      resultados_verificacion: resultados,
    });
    return response.data;
  },

  /**
   * Obtener controles de cambio por solicitud
   */
  porSolicitud: async (solicitudId: number): Promise<ControlCambio[]> => {
    const response = await apiClient.get(`${BASE_URL}/control-cambios/`, {
      params: { solicitud_cambio: solicitudId },
    });
    return response.data.results || response.data;
  },
};

// Default export para compatibilidad
const calidadApi = {
  noConformidad: noConformidadApi,
  accionCorrectiva: accionCorrectivaApi,
  salidaNoConforme: salidaNoConformeApi,
  solicitudCambio: solicitudCambioApi,
  controlCambio: controlCambioApi,
};

export default calidadApi;
