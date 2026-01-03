/**
 * API Client para Medicina Laboral - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Tipos de Exámenes Médicos
 * - Exámenes Médicos Ocupacionales
 * - Restricciones Médicas
 * - Programas de Vigilancia Epidemiológica (PVE)
 * - Casos en Vigilancia
 * - Diagnósticos Ocupacionales (CIE-10)
 * - Estadísticas Médicas
 */
import { apiClient } from '@/lib/api-client';
import type {
  TipoExamenMedico,
  TipoExamenMedicoList,
  ExamenMedico,
  ExamenMedicoList,
  ExamenMedicoDetail,
  RestriccionMedica,
  RestriccionMedicaList,
  RestriccionMedicaDetail,
  ProgramaVigilancia,
  ProgramaVigilanciaList,
  ProgramaVigilanciaDetail,
  CasoVigilancia,
  CasoVigilanciaList,
  DiagnosticoOcupacional,
  DiagnosticoOcupacionalList,
  EstadisticaMedica,
  EstadisticaMedicaList,
  CreateTipoExamenMedicoDTO,
  UpdateTipoExamenMedicoDTO,
  CreateExamenMedicoDTO,
  UpdateExamenMedicoDTO,
  CreateRestriccionMedicaDTO,
  UpdateRestriccionMedicaDTO,
  CreateProgramaVigilanciaDTO,
  UpdateProgramaVigilanciaDTO,
  CreateCasoVigilanciaDTO,
  UpdateCasoVigilanciaDTO,
  CreateDiagnosticoOcupacionalDTO,
  UpdateDiagnosticoOcupacionalDTO,
  CreateEstadisticaMedicaDTO,
  UpdateEstadisticaMedicaDTO,
  PaginatedResponse,
  DashboardMedicinaLaboral,
  ConceptoAptitud,
  EstadoProgramaVigilancia,
  SeveridadCaso,
  OrigenDiagnostico,
  CategoriaRestriccion,
  TipoExamen,
} from '../types/medicina-laboral.types';

const BASE_URL = '/api/hseq/medicina-laboral';

// ==================== TIPO EXAMEN ====================

export const tipoExamenApi = {
  /**
   * Obtener todos los tipos de examen
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo?: TipoExamen;
    periodicidad?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<TipoExamenMedicoList>> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-examen/`, { params });
    return response.data;
  },

  /**
   * Obtener un tipo de examen por ID
   */
  getById: async (id: number): Promise<TipoExamenMedico> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-examen/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo tipo de examen
   */
  create: async (data: CreateTipoExamenMedicoDTO): Promise<TipoExamenMedico> => {
    const response = await apiClient.post(`${BASE_URL}/tipos-examen/`, data);
    return response.data;
  },

  /**
   * Actualizar un tipo de examen
   */
  update: async (id: number, data: UpdateTipoExamenMedicoDTO): Promise<TipoExamenMedico> => {
    const response = await apiClient.patch(`${BASE_URL}/tipos-examen/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un tipo de examen
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-examen/${id}/`);
  },

  /**
   * Obtener tipos de examen por tipo
   */
  porTipo: async (tipo: TipoExamen): Promise<TipoExamenMedicoList[]> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-examen/`, {
      params: { tipo },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener tipos de examen activos
   */
  activos: async (): Promise<TipoExamenMedicoList[]> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-examen/`, {
      params: { is_active: true },
    });
    return response.data.results || response.data;
  },
};

// ==================== EXAMEN MEDICO ====================

export const examenMedicoApi = {
  /**
   * Obtener todos los exámenes médicos
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_examen?: number;
    colaborador_id?: number;
    concepto_aptitud?: ConceptoAptitud;
    estado?: string;
    fecha_programada_desde?: string;
    fecha_programada_hasta?: string;
    fecha_realizado_desde?: string;
    fecha_realizado_hasta?: string;
    requiere_restricciones?: boolean;
    requiere_seguimiento?: boolean;
  }): Promise<PaginatedResponse<ExamenMedicoList>> => {
    const response = await apiClient.get(`${BASE_URL}/examenes/`, { params });
    return response.data;
  },

  /**
   * Obtener un examen médico por ID
   */
  getById: async (id: number): Promise<ExamenMedicoDetail> => {
    const response = await apiClient.get(`${BASE_URL}/examenes/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo examen médico
   */
  create: async (data: CreateExamenMedicoDTO): Promise<ExamenMedico> => {
    const response = await apiClient.post(`${BASE_URL}/examenes/`, data);
    return response.data;
  },

  /**
   * Actualizar un examen médico
   */
  update: async (id: number, data: UpdateExamenMedicoDTO): Promise<ExamenMedico> => {
    const response = await apiClient.patch(`${BASE_URL}/examenes/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un examen médico
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/examenes/${id}/`);
  },

  /**
   * Programar un examen médico
   */
  programar: async (data: CreateExamenMedicoDTO): Promise<ExamenMedico> => {
    const response = await apiClient.post(`${BASE_URL}/examenes/programar/`, data);
    return response.data;
  },

  /**
   * Completar un examen médico con resultados
   */
  completar: async (
    id: number,
    concepto: ConceptoAptitud,
    hallazgos: string,
    recomendaciones: string
  ): Promise<ExamenMedico> => {
    const response = await apiClient.post(`${BASE_URL}/examenes/${id}/completar/`, {
      concepto_aptitud: concepto,
      hallazgos_relevantes: hallazgos,
      recomendaciones,
      estado: 'COMPLETADO',
      fecha_realizado: new Date().toISOString().split('T')[0],
    });
    return response.data;
  },

  /**
   * Cancelar un examen médico
   */
  cancelar: async (id: number, motivo: string): Promise<ExamenMedico> => {
    const response = await apiClient.post(`${BASE_URL}/examenes/${id}/cancelar/`, {
      motivo,
      estado: 'CANCELADO',
    });
    return response.data;
  },

  /**
   * Obtener exámenes de un colaborador específico
   */
  porColaborador: async (colaboradorId: number): Promise<ExamenMedicoList[]> => {
    const response = await apiClient.get(`${BASE_URL}/examenes/`, {
      params: { colaborador_id: colaboradorId },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener exámenes por concepto de aptitud
   */
  porConcepto: async (concepto: ConceptoAptitud): Promise<ExamenMedicoList[]> => {
    const response = await apiClient.get(`${BASE_URL}/examenes/`, {
      params: { concepto_aptitud: concepto },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener exámenes vencidos
   */
  vencidos: async (): Promise<ExamenMedicoList[]> => {
    const response = await apiClient.get(`${BASE_URL}/examenes/vencidos/`);
    return response.data.results || response.data;
  },

  /**
   * Obtener exámenes próximos a vencer
   */
  proximos: async (dias: number = 30): Promise<ExamenMedicoList[]> => {
    const response = await apiClient.get(`${BASE_URL}/examenes/proximos/`, {
      params: { dias },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener estadísticas de exámenes médicos
   */
  getEstadisticas: async (params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    tipo_examen?: number;
    colaborador_id?: number;
  }): Promise<any> => {
    const response = await apiClient.get(`${BASE_URL}/examenes/estadisticas/`, { params });
    return response.data;
  },
};

// ==================== RESTRICCION MEDICA ====================

export const restriccionMedicaApi = {
  /**
   * Obtener todas las restricciones médicas
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    colaborador_id?: number;
    tipo_restriccion?: string;
    categoria?: CategoriaRestriccion;
    estado?: string;
    fecha_inicio_desde?: string;
    fecha_inicio_hasta?: string;
    fecha_fin_desde?: string;
    fecha_fin_hasta?: string;
    vigente?: boolean;
  }): Promise<PaginatedResponse<RestriccionMedicaList>> => {
    const response = await apiClient.get(`${BASE_URL}/restricciones/`, { params });
    return response.data;
  },

  /**
   * Obtener una restricción médica por ID
   */
  getById: async (id: number): Promise<RestriccionMedicaDetail> => {
    const response = await apiClient.get(`${BASE_URL}/restricciones/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva restricción médica
   */
  create: async (data: CreateRestriccionMedicaDTO): Promise<RestriccionMedica> => {
    const response = await apiClient.post(`${BASE_URL}/restricciones/`, data);
    return response.data;
  },

  /**
   * Actualizar una restricción médica
   */
  update: async (id: number, data: UpdateRestriccionMedicaDTO): Promise<RestriccionMedica> => {
    const response = await apiClient.patch(`${BASE_URL}/restricciones/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una restricción médica
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/restricciones/${id}/`);
  },

  /**
   * Levantar una restricción médica
   */
  levantar: async (id: number, motivo: string, fecha?: string): Promise<RestriccionMedica> => {
    const response = await apiClient.post(`${BASE_URL}/restricciones/${id}/levantar/`, {
      motivo_levantamiento: motivo,
      fecha_levantamiento: fecha || new Date().toISOString().split('T')[0],
      estado: 'LEVANTADA',
    });
    return response.data;
  },

  /**
   * Renovar una restricción médica (extender fecha de fin)
   */
  renovar: async (id: number, nuevaFechaFin: string): Promise<RestriccionMedica> => {
    const response = await apiClient.post(`${BASE_URL}/restricciones/${id}/renovar/`, {
      fecha_fin: nuevaFechaFin,
    });
    return response.data;
  },

  /**
   * Obtener restricciones de un colaborador específico
   */
  porColaborador: async (colaboradorId: number): Promise<RestriccionMedicaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/restricciones/`, {
      params: { colaborador_id: colaboradorId },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener restricciones activas
   */
  activas: async (): Promise<RestriccionMedicaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/restricciones/`, {
      params: { estado: 'ACTIVA' },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener restricciones próximas a vencer
   */
  porVencer: async (dias: number = 30): Promise<RestriccionMedicaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/restricciones/por-vencer/`, {
      params: { dias },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener restricciones por categoría
   */
  porCategoria: async (categoria: CategoriaRestriccion): Promise<RestriccionMedicaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/restricciones/`, {
      params: { categoria },
    });
    return response.data.results || response.data;
  },
};

// ==================== PROGRAMA VIGILANCIA ====================

export const programaVigilanciaApi = {
  /**
   * Obtener todos los programas de vigilancia
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo?: string;
    estado?: EstadoProgramaVigilancia;
    responsable_id?: number;
    fecha_inicio_desde?: string;
    fecha_inicio_hasta?: string;
  }): Promise<PaginatedResponse<ProgramaVigilanciaList>> => {
    const response = await apiClient.get(`${BASE_URL}/programas-vigilancia/`, { params });
    return response.data;
  },

  /**
   * Obtener un programa de vigilancia por ID
   */
  getById: async (id: number): Promise<ProgramaVigilanciaDetail> => {
    const response = await apiClient.get(`${BASE_URL}/programas-vigilancia/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo programa de vigilancia
   */
  create: async (data: CreateProgramaVigilanciaDTO): Promise<ProgramaVigilancia> => {
    const response = await apiClient.post(`${BASE_URL}/programas-vigilancia/`, data);
    return response.data;
  },

  /**
   * Actualizar un programa de vigilancia
   */
  update: async (id: number, data: UpdateProgramaVigilanciaDTO): Promise<ProgramaVigilancia> => {
    const response = await apiClient.patch(`${BASE_URL}/programas-vigilancia/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un programa de vigilancia
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/programas-vigilancia/${id}/`);
  },

  /**
   * Cambiar estado de un programa de vigilancia
   */
  cambiarEstado: async (id: number, estado: EstadoProgramaVigilancia): Promise<ProgramaVigilancia> => {
    const response = await apiClient.post(`${BASE_URL}/programas-vigilancia/${id}/cambiar-estado/`, {
      estado,
    });
    return response.data;
  },

  /**
   * Obtener programas por tipo
   */
  porTipo: async (tipo: string): Promise<ProgramaVigilanciaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/programas-vigilancia/`, {
      params: { tipo },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener programas activos
   */
  activos: async (): Promise<ProgramaVigilanciaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/programas-vigilancia/`, {
      params: { estado: 'ACTIVO' },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener dashboard de un programa de vigilancia
   */
  getDashboard: async (): Promise<any> => {
    const response = await apiClient.get(`${BASE_URL}/programas-vigilancia/dashboard/`);
    return response.data;
  },
};

// ==================== CASO VIGILANCIA ====================

export const casoVigilanciaApi = {
  /**
   * Obtener todos los casos de vigilancia
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    programa?: number;
    colaborador_id?: number;
    severidad?: SeveridadCaso;
    estado?: string;
    fecha_apertura_desde?: string;
    fecha_apertura_hasta?: string;
    fecha_cierre_desde?: string;
    fecha_cierre_hasta?: string;
  }): Promise<PaginatedResponse<CasoVigilanciaList>> => {
    const response = await apiClient.get(`${BASE_URL}/casos-vigilancia/`, { params });
    return response.data;
  },

  /**
   * Obtener un caso de vigilancia por ID
   */
  getById: async (id: number): Promise<CasoVigilancia> => {
    const response = await apiClient.get(`${BASE_URL}/casos-vigilancia/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo caso de vigilancia
   */
  create: async (data: CreateCasoVigilanciaDTO): Promise<CasoVigilancia> => {
    const response = await apiClient.post(`${BASE_URL}/casos-vigilancia/`, data);
    return response.data;
  },

  /**
   * Actualizar un caso de vigilancia
   */
  update: async (id: number, data: UpdateCasoVigilanciaDTO): Promise<CasoVigilancia> => {
    const response = await apiClient.patch(`${BASE_URL}/casos-vigilancia/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un caso de vigilancia
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/casos-vigilancia/${id}/`);
  },

  /**
   * Registrar seguimiento en un caso de vigilancia
   */
  registrarSeguimiento: async (id: number, descripcion: string): Promise<CasoVigilancia> => {
    const response = await apiClient.post(`${BASE_URL}/casos-vigilancia/${id}/registrar-seguimiento/`, {
      descripcion,
      fecha: new Date().toISOString().split('T')[0],
    });
    return response.data;
  },

  /**
   * Cerrar un caso de vigilancia
   */
  cerrar: async (id: number, motivo: string, resultado: string): Promise<CasoVigilancia> => {
    const response = await apiClient.post(`${BASE_URL}/casos-vigilancia/${id}/cerrar/`, {
      motivo_cierre: motivo,
      resultado_final: resultado,
      fecha_cierre: new Date().toISOString().split('T')[0],
      estado: 'CERRADO',
    });
    return response.data;
  },

  /**
   * Obtener casos de un programa específico
   */
  porPrograma: async (programaId: number): Promise<CasoVigilanciaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/casos-vigilancia/`, {
      params: { programa: programaId },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener casos de un colaborador específico
   */
  porColaborador: async (colaboradorId: number): Promise<CasoVigilanciaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/casos-vigilancia/`, {
      params: { colaborador_id: colaboradorId },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener casos por severidad
   */
  porSeveridad: async (severidad: SeveridadCaso): Promise<CasoVigilanciaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/casos-vigilancia/`, {
      params: { severidad },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener casos activos
   */
  activos: async (): Promise<CasoVigilanciaList[]> => {
    const response = await apiClient.get(`${BASE_URL}/casos-vigilancia/`, {
      params: { estado: 'ACTIVO' },
    });
    return response.data.results || response.data;
  },
};

// ==================== DIAGNOSTICO OCUPACIONAL ====================

export const diagnosticoOcupacionalApi = {
  /**
   * Obtener todos los diagnósticos ocupacionales
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    origen?: OrigenDiagnostico;
    categoria?: string;
    requiere_vigilancia?: boolean;
    requiere_reporte_arl?: boolean;
    is_active?: boolean;
  }): Promise<PaginatedResponse<DiagnosticoOcupacionalList>> => {
    const response = await apiClient.get(`${BASE_URL}/diagnosticos/`, { params });
    return response.data;
  },

  /**
   * Obtener un diagnóstico ocupacional por ID
   */
  getById: async (id: number): Promise<DiagnosticoOcupacional> => {
    const response = await apiClient.get(`${BASE_URL}/diagnosticos/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo diagnóstico ocupacional
   */
  create: async (data: CreateDiagnosticoOcupacionalDTO): Promise<DiagnosticoOcupacional> => {
    const response = await apiClient.post(`${BASE_URL}/diagnosticos/`, data);
    return response.data;
  },

  /**
   * Actualizar un diagnóstico ocupacional
   */
  update: async (id: number, data: UpdateDiagnosticoOcupacionalDTO): Promise<DiagnosticoOcupacional> => {
    const response = await apiClient.patch(`${BASE_URL}/diagnosticos/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un diagnóstico ocupacional
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/diagnosticos/${id}/`);
  },

  /**
   * Buscar diagnósticos por código o nombre CIE-10
   */
  buscarCIE10: async (query: string): Promise<DiagnosticoOcupacionalList[]> => {
    const response = await apiClient.get(`${BASE_URL}/diagnosticos/buscar-cie10/`, {
      params: { q: query },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener diagnósticos por origen
   */
  porOrigen: async (origen: OrigenDiagnostico): Promise<DiagnosticoOcupacionalList[]> => {
    const response = await apiClient.get(`${BASE_URL}/diagnosticos/`, {
      params: { origen },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener diagnósticos que requieren vigilancia
   */
  conVigilancia: async (): Promise<DiagnosticoOcupacionalList[]> => {
    const response = await apiClient.get(`${BASE_URL}/diagnosticos/`, {
      params: { requiere_vigilancia: true },
    });
    return response.data.results || response.data;
  },
};

// ==================== ESTADISTICA MEDICA ====================

export const estadisticaMedicaApi = {
  /**
   * Obtener todas las estadísticas médicas
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    anio?: number;
    mes?: number;
    anio_desde?: number;
    anio_hasta?: number;
  }): Promise<PaginatedResponse<EstadisticaMedicaList>> => {
    const response = await apiClient.get(`${BASE_URL}/estadisticas/`, { params });
    return response.data;
  },

  /**
   * Obtener una estadística médica por ID
   */
  getById: async (id: number): Promise<EstadisticaMedica> => {
    const response = await apiClient.get(`${BASE_URL}/estadisticas/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva estadística médica
   */
  create: async (data: CreateEstadisticaMedicaDTO): Promise<EstadisticaMedica> => {
    const response = await apiClient.post(`${BASE_URL}/estadisticas/`, data);
    return response.data;
  },

  /**
   * Actualizar una estadística médica
   */
  update: async (id: number, data: UpdateEstadisticaMedicaDTO): Promise<EstadisticaMedica> => {
    const response = await apiClient.patch(`${BASE_URL}/estadisticas/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una estadística médica
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/estadisticas/${id}/`);
  },

  /**
   * Obtener estadística médica por período (año y mes)
   */
  getByPeriodo: async (anio: number, mes: number): Promise<EstadisticaMedica> => {
    const response = await apiClient.get(`${BASE_URL}/estadisticas/por-periodo/`, {
      params: { anio, mes },
    });
    return response.data;
  },

  /**
   * Generar estadística médica para un período
   */
  generar: async (anio: number, mes: number): Promise<EstadisticaMedica> => {
    const response = await apiClient.post(`${BASE_URL}/estadisticas/generar/`, {
      anio,
      mes,
    });
    return response.data;
  },

  /**
   * Obtener dashboard de estadísticas médicas por año
   */
  getDashboard: async (anio: number): Promise<DashboardMedicinaLaboral> => {
    const response = await apiClient.get(`${BASE_URL}/estadisticas/dashboard/`, {
      params: { anio },
    });
    return response.data;
  },

  /**
   * Calcular indicadores de una estadística médica
   */
  calcularIndicadores: async (id: number): Promise<EstadisticaMedica> => {
    const response = await apiClient.post(`${BASE_URL}/estadisticas/${id}/calcular-indicadores/`);
    return response.data;
  },
};
