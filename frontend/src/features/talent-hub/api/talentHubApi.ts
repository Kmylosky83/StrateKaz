/**
 * API Clients para Talent Hub - Sprint 20
 * Sistema de Gestion StrateKaz
 *
 * Usa createApiClient factory para CRUD basico (~5 lineas por entidad).
 * Metodos custom se agregan con spread operator.
 *
 * Base URLs:
 *   /talent-hub/seleccion/   → Seleccion y Contratacion
 *   /talent-hub/empleados/   → Colaboradores
 *   /talent-hub/onboarding/  → Onboarding e Induccion
 */
import { apiClient } from '@/lib/api-client';
import { createApiClient } from '@/lib/api-factory';
import type {
  // Seleccion y Contratacion
  VacanteActiva,
  VacanteActivaDetail,
  VacanteActivaFormData,
  Candidato,
  CandidatoDetail,
  CandidatoFormData,
  Entrevista,
  EntrevistaFormData,
  Prueba,
  PruebaFormData,
  TipoContrato,
  TipoEntidad,
  EntidadSeguridadSocial,
  TipoPrueba,
  AfiliacionSS,
  AfiliacionSSFormData,
  HistorialContrato,
  HistorialContratoDetail,
  HistorialContratoFormData,
  ContratarCandidatoDTO,
  ContratarCandidatoResponse,
  RenovarContratoDTO,
  OtrosiDTO,
  ContratoWarnings,
  EnviarContratoResponse,
  ProcesoSeleccionEstadisticas,
  PerfilamientoResponse,
  EstadoCandidato,
  // Pruebas Dinamicas
  PlantillaPruebaList,
  PlantillaPruebaDetail,
  PlantillaPruebaFormData,
  AsignacionPruebaList,
  AsignacionPruebaDetail,
  AsignacionPruebaFormData,
  // Entrevistas Asincronicas
  EntrevistaAsincronicaList,
  EntrevistaAsincronicaDetail,
  EntrevistaAsincronicaFormData,
  // Colaboradores
  Colaborador,
  ColaboradorFormData,
  ColaboradorEstadisticas,
  HojaVida,
  HojaVidaFormData,
  InfoPersonal,
  InfoPersonalFormData,
  HistorialLaboral,
  HistorialLaboralFormData,
  // Onboarding
  ModuloInduccion,
  ModuloInduccionFormData,
  AsignacionPorCargo,
  ItemChecklist,
  ItemChecklistFormData,
  ChecklistIngreso,
  EjecucionIntegral,
  EjecucionCreateData,
  EntregaEPP,
  EntregaEPPFormData,
  EntregaActivo,
  EntregaActivoFormData,
  FirmaDocumento,
  FirmaDocumentoFormData,
  OnboardingEstadisticas,
} from '../types';

// =============================================================================
// BASE URLS
// =============================================================================

const SELECCION_URL = '/talent-hub/seleccion';
const EMPLEADOS_URL = '/talent-hub/empleados';
const ONBOARDING_URL = '/talent-hub/onboarding';

// =============================================================================
// SELECCION Y CONTRATACION — Catalogos
// =============================================================================

export const tipoContratoApi = {
  ...createApiClient<TipoContrato>(SELECCION_URL, 'tipos-contrato'),
};

export const tipoEntidadApi = {
  ...createApiClient<TipoEntidad>(SELECCION_URL, 'tipos-entidad'),
};

export const entidadSSApi = {
  ...createApiClient<EntidadSeguridadSocial>(SELECCION_URL, 'entidades-ss'),
  porTipo: async (tipoCodigo: string): Promise<EntidadSeguridadSocial[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/entidades-ss/`, {
      params: { tipo_entidad__codigo: tipoCodigo },
    });
    return response.data.results || response.data;
  },
};

export const tipoPruebaApi = {
  ...createApiClient<TipoPrueba>(SELECCION_URL, 'tipos-prueba'),
};

// =============================================================================
// SELECCION Y CONTRATACION — Vacantes Activas
// =============================================================================

export const vacanteActivaApi = {
  ...createApiClient<VacanteActiva, VacanteActivaFormData, VacanteActivaFormData>(
    SELECCION_URL,
    'vacantes-activas'
  ),
  getDetail: async (id: number): Promise<VacanteActivaDetail> => {
    const response = await apiClient.get(`${SELECCION_URL}/vacantes-activas/${id}/`);
    return response.data;
  },
  abiertas: async (): Promise<VacanteActiva[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/vacantes-activas/abiertas/`);
    return response.data;
  },
  cerrar: async (id: number, motivo?: string): Promise<VacanteActiva> => {
    const response = await apiClient.post(`${SELECCION_URL}/vacantes-activas/${id}/cerrar/`, {
      motivo_cierre: motivo,
    });
    return response.data;
  },
  perfilamiento: async (id: number): Promise<PerfilamientoResponse> => {
    const response = await apiClient.get(`${SELECCION_URL}/vacantes-activas/${id}/perfilamiento/`);
    return response.data;
  },
};

// =============================================================================
// SELECCION Y CONTRATACION — Candidatos
// =============================================================================

export const candidatoApi = {
  ...createApiClient<Candidato, CandidatoFormData, CandidatoFormData>(SELECCION_URL, 'candidatos'),
  getDetail: async (id: number): Promise<CandidatoDetail> => {
    const response = await apiClient.get(`${SELECCION_URL}/candidatos/${id}/`);
    return response.data;
  },
  porVacante: async (vacanteId: number): Promise<Candidato[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/candidatos/`, {
      params: { vacante: vacanteId },
    });
    return response.data.results || response.data;
  },
  cambiarEstado: async (
    id: number,
    estado: EstadoCandidato,
    motivo?: string
  ): Promise<Candidato> => {
    const response = await apiClient.post(`${SELECCION_URL}/candidatos/${id}/cambiar-estado/`, {
      estado,
      motivo_rechazo: motivo,
    });
    return response.data;
  },
  contratar: async (
    id: number,
    data: ContratarCandidatoDTO
  ): Promise<ContratarCandidatoResponse> => {
    const response = await apiClient.post(`${SELECCION_URL}/candidatos/${id}/contratar/`, data);
    return response.data;
  },
};

// =============================================================================
// SELECCION Y CONTRATACION — Entrevistas
// =============================================================================

export const entrevistaApi = {
  ...createApiClient<Entrevista, EntrevistaFormData, EntrevistaFormData>(
    SELECCION_URL,
    'entrevistas'
  ),
  porCandidato: async (candidatoId: number): Promise<Entrevista[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/entrevistas/`, {
      params: { candidato: candidatoId },
    });
    return response.data.results || response.data;
  },
  realizar: async (id: number, data: Partial<Entrevista>): Promise<Entrevista> => {
    const response = await apiClient.post(`${SELECCION_URL}/entrevistas/${id}/realizar/`, data);
    return response.data;
  },
  cancelar: async (id: number, motivo: string): Promise<Entrevista> => {
    const response = await apiClient.post(`${SELECCION_URL}/entrevistas/${id}/cancelar/`, {
      motivo_cancelacion: motivo,
    });
    return response.data;
  },
};

// =============================================================================
// SELECCION Y CONTRATACION — Pruebas
// =============================================================================

export const pruebaApi = {
  ...createApiClient<Prueba, PruebaFormData, PruebaFormData>(SELECCION_URL, 'pruebas'),
  porCandidato: async (candidatoId: number): Promise<Prueba[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/pruebas/`, {
      params: { candidato: candidatoId },
    });
    return response.data.results || response.data;
  },
};

// =============================================================================
// SELECCION Y CONTRATACION — Afiliaciones SS
// =============================================================================

export const afiliacionSSApi = {
  ...createApiClient<AfiliacionSS, AfiliacionSSFormData, AfiliacionSSFormData>(
    SELECCION_URL,
    'afiliaciones'
  ),
  porCandidato: async (candidatoId: number): Promise<AfiliacionSS[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/afiliaciones/`, {
      params: { candidato: candidatoId },
    });
    return response.data.results || response.data;
  },
};

// =============================================================================
// SELECCION Y CONTRATACION — Historial Contratos (Ley 2466/2025)
// =============================================================================

export const historialContratoApi = {
  ...createApiClient<HistorialContrato, HistorialContratoFormData, HistorialContratoFormData>(
    SELECCION_URL,
    'historial-contratos'
  ),
  getDetail: async (id: number): Promise<HistorialContratoDetail> => {
    const response = await apiClient.get(`${SELECCION_URL}/historial-contratos/${id}/`);
    return response.data;
  },
  porColaborador: async (colaboradorId: number): Promise<HistorialContrato[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/historial-contratos/`, {
      params: { colaborador: colaboradorId },
    });
    return response.data.results || response.data;
  },
  porVencer: async (dias?: number): Promise<HistorialContrato[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/historial-contratos/por-vencer/`, {
      params: dias ? { dias } : undefined,
    });
    return response.data;
  },
  warnings: async (id: number): Promise<ContratoWarnings> => {
    const response = await apiClient.get(`${SELECCION_URL}/historial-contratos/${id}/warnings/`);
    return response.data;
  },
  renovar: async (id: number, data: RenovarContratoDTO): Promise<HistorialContratoDetail> => {
    const response = await apiClient.post(
      `${SELECCION_URL}/historial-contratos/${id}/renovar/`,
      data
    );
    return response.data;
  },
  otrosi: async (id: number, data: OtrosiDTO): Promise<HistorialContratoDetail> => {
    const response = await apiClient.post(
      `${SELECCION_URL}/historial-contratos/${id}/otrosi/`,
      data
    );
    return response.data;
  },
  enviarContrato: async (id: number): Promise<EnviarContratoResponse> => {
    const response = await apiClient.post(
      `${SELECCION_URL}/historial-contratos/${id}/enviar-contrato/`
    );
    return response.data;
  },
  reenviarContrato: async (id: number): Promise<EnviarContratoResponse> => {
    const response = await apiClient.post(
      `${SELECCION_URL}/historial-contratos/${id}/reenviar-contrato/`
    );
    return response.data;
  },
};

// =============================================================================
// SELECCION Y CONTRATACION — Pruebas Dinamicas (Form Builder)
// =============================================================================

export const plantillaPruebaApi = {
  ...createApiClient<PlantillaPruebaList, PlantillaPruebaFormData, PlantillaPruebaFormData>(
    SELECCION_URL,
    'plantillas-prueba'
  ),
  getDetail: async (id: number): Promise<PlantillaPruebaDetail> => {
    const response = await apiClient.get(`${SELECCION_URL}/plantillas-prueba/${id}/`);
    return response.data;
  },
  activas: async (): Promise<PlantillaPruebaList[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/plantillas-prueba/`, {
      params: { is_active: true },
    });
    return response.data.results || response.data;
  },
};

export const asignacionPruebaApi = {
  ...createApiClient<
    AsignacionPruebaList,
    AsignacionPruebaFormData,
    Partial<AsignacionPruebaFormData>
  >(SELECCION_URL, 'asignaciones-prueba'),
  getDetail: async (id: number): Promise<AsignacionPruebaDetail> => {
    const response = await apiClient.get(`${SELECCION_URL}/asignaciones-prueba/${id}/`);
    return response.data;
  },
  porCandidato: async (candidatoId: number): Promise<AsignacionPruebaList[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/asignaciones-prueba/`, {
      params: { candidato: candidatoId },
    });
    return response.data.results || response.data;
  },
  calificar: async (
    id: number,
    data: { puntaje_obtenido: number; observaciones?: string }
  ): Promise<AsignacionPruebaDetail> => {
    const response = await apiClient.post(
      `${SELECCION_URL}/asignaciones-prueba/${id}/calificar/`,
      data
    );
    return response.data;
  },
  reenviarEmail: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post(
      `${SELECCION_URL}/asignaciones-prueba/${id}/reenviar-email/`
    );
    return response.data;
  },
};

// =============================================================================
// SELECCION Y CONTRATACION — Entrevistas Asincronicas
// =============================================================================

export const entrevistaAsincronicaApi = {
  ...createApiClient<
    EntrevistaAsincronicaList,
    EntrevistaAsincronicaFormData,
    Partial<EntrevistaAsincronicaFormData>
  >(SELECCION_URL, 'entrevistas-async'),
  getDetail: async (id: number): Promise<EntrevistaAsincronicaDetail> => {
    const response = await apiClient.get(`${SELECCION_URL}/entrevistas-async/${id}/`);
    return response.data;
  },
  porCandidato: async (candidatoId: number): Promise<EntrevistaAsincronicaList[]> => {
    const response = await apiClient.get(`${SELECCION_URL}/entrevistas-async/`, {
      params: { candidato: candidatoId },
    });
    return response.data.results || response.data;
  },
  evaluar: async (
    id: number,
    data: {
      calificacion_general: number;
      recomendacion: string;
      observaciones_evaluador?: string;
      fortalezas_identificadas?: string;
      aspectos_mejorar?: string;
    }
  ): Promise<EntrevistaAsincronicaDetail> => {
    const response = await apiClient.post(
      `${SELECCION_URL}/entrevistas-async/${id}/evaluar/`,
      data
    );
    return response.data;
  },
  reenviarEmail: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post(
      `${SELECCION_URL}/entrevistas-async/${id}/reenviar-email/`
    );
    return response.data;
  },
};

// =============================================================================
// SELECCION Y CONTRATACION — Estadisticas
// =============================================================================

export const procesoSeleccionEstadisticasApi = {
  get: async (): Promise<ProcesoSeleccionEstadisticas> => {
    const response = await apiClient.get(`${SELECCION_URL}/estadisticas/resumen/`);
    return response.data;
  },
};

// =============================================================================
// COLABORADORES
// =============================================================================

export const colaboradorApi = {
  ...createApiClient<Colaborador, ColaboradorFormData, ColaboradorFormData>(
    EMPLEADOS_URL,
    'colaboradores'
  ),
  retirar: async (
    id: number | string,
    data: { fecha_retiro: string; motivo_retiro: string }
  ): Promise<Colaborador> => {
    const response = await apiClient.post(`${EMPLEADOS_URL}/colaboradores/${id}/retirar/`, data);
    return response.data;
  },
  estadisticas: async (): Promise<ColaboradorEstadisticas> => {
    const response = await apiClient.get(`${EMPLEADOS_URL}/colaboradores/estadisticas/`);
    return response.data;
  },
};

export const hojaVidaApi = {
  ...createApiClient<HojaVida, HojaVidaFormData, HojaVidaFormData>(EMPLEADOS_URL, 'hojas-vida'),
};

export const infoPersonalApi = {
  ...createApiClient<InfoPersonal, InfoPersonalFormData, InfoPersonalFormData>(
    EMPLEADOS_URL,
    'info-personal'
  ),
};

export const historialLaboralApi = {
  ...createApiClient<HistorialLaboral, HistorialLaboralFormData, HistorialLaboralFormData>(
    EMPLEADOS_URL,
    'historial-laboral'
  ),
};

// =============================================================================
// ONBOARDING E INDUCCION
// =============================================================================

export const moduloInduccionApi = {
  ...createApiClient<ModuloInduccion, ModuloInduccionFormData, ModuloInduccionFormData>(
    ONBOARDING_URL,
    'modulos'
  ),
};

export const asignacionPorCargoApi = {
  ...createApiClient<AsignacionPorCargo>(ONBOARDING_URL, 'asignaciones-cargo'),
};

export const itemChecklistApi = {
  ...createApiClient<ItemChecklist, ItemChecklistFormData, ItemChecklistFormData>(
    ONBOARDING_URL,
    'items-checklist'
  ),
};

export const checklistIngresoApi = {
  ...createApiClient<ChecklistIngreso>(ONBOARDING_URL, 'checklist-ingreso'),
  porColaborador: async (colaboradorId: number): Promise<ChecklistIngreso[]> => {
    const response = await apiClient.get(`${ONBOARDING_URL}/checklist-ingreso/`, {
      params: { colaborador: colaboradorId },
    });
    return response.data.results || response.data;
  },
  cumplir: async (id: number, data?: { observaciones?: string }): Promise<ChecklistIngreso> => {
    const response = await apiClient.post(
      `${ONBOARDING_URL}/checklist-ingreso/${id}/cumplir/`,
      data
    );
    return response.data;
  },
};

export const ejecucionIntegralApi = {
  ...createApiClient<EjecucionIntegral, EjecucionCreateData, Partial<EjecucionCreateData>>(
    ONBOARDING_URL,
    'ejecuciones'
  ),
  porColaborador: async (colaboradorId: number): Promise<EjecucionIntegral[]> => {
    const response = await apiClient.get(`${ONBOARDING_URL}/ejecuciones/`, {
      params: { colaborador: colaboradorId },
    });
    return response.data.results || response.data;
  },
};

export const entregaEPPApi = {
  ...createApiClient<EntregaEPP, EntregaEPPFormData, EntregaEPPFormData>(
    ONBOARDING_URL,
    'entregas-epp'
  ),
};

export const entregaActivoApi = {
  ...createApiClient<EntregaActivo, EntregaActivoFormData, EntregaActivoFormData>(
    ONBOARDING_URL,
    'entregas-activos'
  ),
};

export const firmaDocumentoApi = {
  ...createApiClient<FirmaDocumento, FirmaDocumentoFormData, FirmaDocumentoFormData>(
    ONBOARDING_URL,
    'firmas-documentos'
  ),
};

export const onboardingEstadisticasApi = {
  get: async (): Promise<OnboardingEstadisticas> => {
    const response = await apiClient.get(`${ONBOARDING_URL}/estadisticas/resumen/`);
    return response.data;
  },
};

// =============================================================================
// EXPORTACION POR DEFECTO
// =============================================================================

const talentHubApi = {
  // Catalogos
  tipoContrato: tipoContratoApi,
  tipoEntidad: tipoEntidadApi,
  entidadSS: entidadSSApi,
  tipoPrueba: tipoPruebaApi,
  // Seleccion
  vacanteActiva: vacanteActivaApi,
  candidato: candidatoApi,
  entrevista: entrevistaApi,
  prueba: pruebaApi,
  afiliacionSS: afiliacionSSApi,
  historialContrato: historialContratoApi,
  plantillaPrueba: plantillaPruebaApi,
  asignacionPrueba: asignacionPruebaApi,
  entrevistaAsincronica: entrevistaAsincronicaApi,
  estadisticasSeleccion: procesoSeleccionEstadisticasApi,
  // Colaboradores
  colaborador: colaboradorApi,
  hojaVida: hojaVidaApi,
  infoPersonal: infoPersonalApi,
  historialLaboral: historialLaboralApi,
  // Onboarding
  moduloInduccion: moduloInduccionApi,
  asignacionPorCargo: asignacionPorCargoApi,
  itemChecklist: itemChecklistApi,
  checklistIngreso: checklistIngresoApi,
  ejecucionIntegral: ejecucionIntegralApi,
  entregaEPP: entregaEPPApi,
  entregaActivo: entregaActivoApi,
  firmaDocumento: firmaDocumentoApi,
  estadisticasOnboarding: onboardingEstadisticasApi,
};

export default talentHubApi;
