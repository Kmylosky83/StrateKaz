/**
 * API Client para Gestión Ambiental - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Gestión de Residuos (Tipos, Gestores, Registros)
 * - Vertimientos
 * - Emisiones Atmosféricas
 * - Consumo de Recursos
 * - Huella de Carbono
 * - Certificados Ambientales
 */
import { apiClient } from '@/lib/api-client';
import type {
  TipoResiduo,
  TipoResiduoList,
  GestorAmbiental,
  GestorAmbientalList,
  RegistroResiduo,
  RegistroResiduoList,
  Vertimiento,
  VertimientoList,
  FuenteEmision,
  FuenteEmisionList,
  RegistroEmision,
  RegistroEmisionList,
  TipoRecurso,
  TipoRecursoList,
  ConsumoRecurso,
  ConsumoRecursoList,
  CalculoHuellaCarbono,
  CalculoHuellaCarbonoList,
  CertificadoAmbiental,
  CertificadoAmbientalList,
  CreateTipoResiduoDTO,
  UpdateTipoResiduoDTO,
  CreateGestorAmbientalDTO,
  UpdateGestorAmbientalDTO,
  CreateRegistroResiduoDTO,
  UpdateRegistroResiduoDTO,
  CreateVertimientoDTO,
  UpdateVertimientoDTO,
  CreateFuenteEmisionDTO,
  UpdateFuenteEmisionDTO,
  CreateRegistroEmisionDTO,
  UpdateRegistroEmisionDTO,
  CreateTipoRecursoDTO,
  UpdateTipoRecursoDTO,
  CreateConsumoRecursoDTO,
  UpdateConsumoRecursoDTO,
  CreateCalculoHuellaCarbonoDTO,
  UpdateCalculoHuellaCarbonoDTO,
  CreateCertificadoAmbientalDTO,
  UpdateCertificadoAmbientalDTO,
  GenerarCertificadoDTO,
  CalcularHuellaInputDTO,
  ResumenGestionResiduos,
  ConsumoRecursoResumen,
  PaginatedResponse,
} from '../types/gestion-ambiental.types';

const BASE_URL = '/api/hseq/gestion-ambiental';

// ==================== TIPOS DE RESIDUOS ====================

export const tipoResiduoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    clase?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<TipoResiduoList>> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-residuos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoResiduo> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-residuos/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoResiduoDTO): Promise<TipoResiduo> => {
    const response = await apiClient.post(`${BASE_URL}/tipos-residuos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoResiduoDTO): Promise<TipoResiduo> => {
    const response = await apiClient.patch(`${BASE_URL}/tipos-residuos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-residuos/${id}/`);
  },

  porClase: async (): Promise<Record<string, any>> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-residuos/por_clase/`);
    return response.data;
  },
};

// ==================== GESTORES AMBIENTALES ====================

export const gestorAmbientalApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    empresa_id?: number;
    tipo_gestor?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<GestorAmbientalList>> => {
    const response = await apiClient.get(`${BASE_URL}/gestores/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<GestorAmbiental> => {
    const response = await apiClient.get(`${BASE_URL}/gestores/${id}/`);
    return response.data;
  },

  create: async (data: CreateGestorAmbientalDTO): Promise<GestorAmbiental> => {
    const response = await apiClient.post(`${BASE_URL}/gestores/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateGestorAmbientalDTO): Promise<GestorAmbiental> => {
    const response = await apiClient.patch(`${BASE_URL}/gestores/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/gestores/${id}/`);
  },

  verificarLicencia: async (id: number): Promise<any> => {
    const response = await apiClient.get(`${BASE_URL}/gestores/${id}/licencias_vencidas/`);
    return response.data;
  },
};

// ==================== REGISTROS DE RESIDUOS ====================

export const registroResiduoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    empresa_id?: number;
    tipo_movimiento?: string;
    tipo_residuo?: number;
    gestor?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<PaginatedResponse<RegistroResiduoList>> => {
    const response = await apiClient.get(`${BASE_URL}/residuos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<RegistroResiduo> => {
    const response = await apiClient.get(`${BASE_URL}/residuos/${id}/`);
    return response.data;
  },

  create: async (data: CreateRegistroResiduoDTO): Promise<RegistroResiduo> => {
    const response = await apiClient.post(`${BASE_URL}/residuos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRegistroResiduoDTO): Promise<RegistroResiduo> => {
    const response = await apiClient.patch(`${BASE_URL}/residuos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/residuos/${id}/`);
  },

  getResumen: async (params: {
    empresa_id: number;
    fecha_inicio: string;
    fecha_fin: string;
  }): Promise<ResumenGestionResiduos> => {
    const response = await apiClient.get(`${BASE_URL}/residuos/resumen/`, { params });
    return response.data;
  },

  generarCertificado: async (data: GenerarCertificadoDTO): Promise<{ mensaje: string; certificado: CertificadoAmbiental }> => {
    const response = await apiClient.post(`${BASE_URL}/residuos/generar_certificado/`, data);
    return response.data;
  },
};

// ==================== VERTIMIENTOS ====================

export const vertimientoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    empresa_id?: number;
    tipo_vertimiento?: string;
    cuerpo_receptor?: string;
    cumple_normativa?: boolean;
  }): Promise<PaginatedResponse<VertimientoList>> => {
    const response = await apiClient.get(`${BASE_URL}/vertimientos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Vertimiento> => {
    const response = await apiClient.get(`${BASE_URL}/vertimientos/${id}/`);
    return response.data;
  },

  create: async (data: CreateVertimientoDTO): Promise<Vertimiento> => {
    const response = await apiClient.post(`${BASE_URL}/vertimientos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateVertimientoDTO): Promise<Vertimiento> => {
    const response = await apiClient.patch(`${BASE_URL}/vertimientos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/vertimientos/${id}/`);
  },

  getNoConformes: async (empresa_id?: number): Promise<{ total: number; vertimientos: Vertimiento[] }> => {
    const response = await apiClient.get(`${BASE_URL}/vertimientos/no_conformes/`, {
      params: { empresa_id },
    });
    return response.data;
  },
};

// ==================== FUENTES DE EMISIÓN ====================

export const fuenteEmisionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    empresa_id?: number;
    tipo_fuente?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<FuenteEmisionList>> => {
    const response = await apiClient.get(`${BASE_URL}/fuentes-emision/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<FuenteEmision> => {
    const response = await apiClient.get(`${BASE_URL}/fuentes-emision/${id}/`);
    return response.data;
  },

  create: async (data: CreateFuenteEmisionDTO): Promise<FuenteEmision> => {
    const response = await apiClient.post(`${BASE_URL}/fuentes-emision/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateFuenteEmisionDTO): Promise<FuenteEmision> => {
    const response = await apiClient.patch(`${BASE_URL}/fuentes-emision/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/fuentes-emision/${id}/`);
  },
};

// ==================== REGISTROS DE EMISIONES ====================

export const registroEmisionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    empresa_id?: number;
    fuente_emision?: number;
    cumple_normativa?: boolean;
  }): Promise<PaginatedResponse<RegistroEmisionList>> => {
    const response = await apiClient.get(`${BASE_URL}/emisiones/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<RegistroEmision> => {
    const response = await apiClient.get(`${BASE_URL}/emisiones/${id}/`);
    return response.data;
  },

  create: async (data: CreateRegistroEmisionDTO): Promise<RegistroEmision> => {
    const response = await apiClient.post(`${BASE_URL}/emisiones/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRegistroEmisionDTO): Promise<RegistroEmision> => {
    const response = await apiClient.patch(`${BASE_URL}/emisiones/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/emisiones/${id}/`);
  },

  getNoConformes: async (empresa_id?: number): Promise<{ total: number; emisiones: RegistroEmision[] }> => {
    const response = await apiClient.get(`${BASE_URL}/emisiones/no_conformes/`, {
      params: { empresa_id },
    });
    return response.data;
  },
};

// ==================== TIPOS DE RECURSOS ====================

export const tipoRecursoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    categoria?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<TipoRecursoList>> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-recursos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoRecurso> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-recursos/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoRecursoDTO): Promise<TipoRecurso> => {
    const response = await apiClient.post(`${BASE_URL}/tipos-recursos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoRecursoDTO): Promise<TipoRecurso> => {
    const response = await apiClient.patch(`${BASE_URL}/tipos-recursos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-recursos/${id}/`);
  },
};

// ==================== CONSUMO DE RECURSOS ====================

export const consumoRecursoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    empresa_id?: number;
    tipo_recurso?: number;
    periodo_year?: number;
    periodo_month?: number;
  }): Promise<PaginatedResponse<ConsumoRecursoList>> => {
    const response = await apiClient.get(`${BASE_URL}/consumos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ConsumoRecurso> => {
    const response = await apiClient.get(`${BASE_URL}/consumos/${id}/`);
    return response.data;
  },

  create: async (data: CreateConsumoRecursoDTO): Promise<ConsumoRecurso> => {
    const response = await apiClient.post(`${BASE_URL}/consumos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateConsumoRecursoDTO): Promise<ConsumoRecurso> => {
    const response = await apiClient.patch(`${BASE_URL}/consumos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/consumos/${id}/`);
  },

  getResumenAnual: async (empresa_id: number, year?: number): Promise<{
    year: number;
    por_recurso: any[];
    por_mes: any[];
    total_costo_anual: number;
    total_emision_co2_anual: number;
  }> => {
    const response = await apiClient.get(`${BASE_URL}/consumos/resumen_anual/`, {
      params: { empresa_id, year },
    });
    return response.data;
  },
};

// ==================== HUELLA DE CARBONO ====================

export const huellaCarbonoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    empresa_id?: number;
    periodo_year?: number;
    verificado?: boolean;
  }): Promise<PaginatedResponse<CalculoHuellaCarbonoList>> => {
    const response = await apiClient.get(`${BASE_URL}/huella-carbono/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<CalculoHuellaCarbono> => {
    const response = await apiClient.get(`${BASE_URL}/huella-carbono/${id}/`);
    return response.data;
  },

  create: async (data: CreateCalculoHuellaCarbonoDTO): Promise<CalculoHuellaCarbono> => {
    const response = await apiClient.post(`${BASE_URL}/huella-carbono/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCalculoHuellaCarbonoDTO): Promise<CalculoHuellaCarbono> => {
    const response = await apiClient.patch(`${BASE_URL}/huella-carbono/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/huella-carbono/${id}/`);
  },

  calcularHuella: async (data: CalcularHuellaInputDTO): Promise<{
    mensaje: string;
    calculo: CalculoHuellaCarbono;
  }> => {
    const response = await apiClient.post(`${BASE_URL}/huella-carbono/calcular_huella/`, data);
    return response.data;
  },

  verificar: async (id: number, verificador_externo?: string): Promise<{
    mensaje: string;
    calculo: CalculoHuellaCarbono;
  }> => {
    const response = await apiClient.post(`${BASE_URL}/huella-carbono/${id}/verificar/`, {
      verificador_externo,
    });
    return response.data;
  },

  getComparativaAnual: async (empresa_id: number): Promise<{
    empresa_id: number;
    comparativa: Array<{
      year: number;
      huella_total: number;
      alcance_1: number;
      alcance_2: number;
      alcance_3: number;
      huella_per_capita: number | null;
      verificado: boolean;
    }>;
  }> => {
    const response = await apiClient.get(`${BASE_URL}/huella-carbono/comparativa_anual/`, {
      params: { empresa_id },
    });
    return response.data;
  },
};

// ==================== CERTIFICADOS AMBIENTALES ====================

export const certificadoAmbientalApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    empresa_id?: number;
    tipo_certificado?: string;
    vigente?: boolean;
    gestor?: number;
  }): Promise<PaginatedResponse<CertificadoAmbientalList>> => {
    const response = await apiClient.get(`${BASE_URL}/certificados/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<CertificadoAmbiental> => {
    const response = await apiClient.get(`${BASE_URL}/certificados/${id}/`);
    return response.data;
  },

  create: async (data: CreateCertificadoAmbientalDTO): Promise<CertificadoAmbiental> => {
    const response = await apiClient.post(`${BASE_URL}/certificados/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCertificadoAmbientalDTO): Promise<CertificadoAmbiental> => {
    const response = await apiClient.patch(`${BASE_URL}/certificados/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/certificados/${id}/`);
  },

  getProximosVencer: async (): Promise<{
    total: number;
    certificados: CertificadoAmbiental[];
  }> => {
    const response = await apiClient.get(`${BASE_URL}/certificados/proximos_vencer/`);
    return response.data;
  },

  getVencidos: async (): Promise<{
    total: number;
    certificados: CertificadoAmbiental[];
  }> => {
    const response = await apiClient.get(`${BASE_URL}/certificados/vencidos/`);
    return response.data;
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  tipoResiduo: tipoResiduoApi,
  gestorAmbiental: gestorAmbientalApi,
  registroResiduo: registroResiduoApi,
  vertimiento: vertimientoApi,
  fuenteEmision: fuenteEmisionApi,
  registroEmision: registroEmisionApi,
  tipoRecurso: tipoRecursoApi,
  consumoRecurso: consumoRecursoApi,
  huellaCarbono: huellaCarbonoApi,
  certificadoAmbiental: certificadoAmbientalApi,
};
