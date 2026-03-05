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
  // Control de Tiempo
  Turno,
  TurnoFormData,
  AsignacionTurno,
  AsignacionTurnoFormData,
  RegistroAsistencia,
  RegistroAsistenciaFormData,
  HoraExtra,
  HoraExtraFormData,
  ConsolidadoAsistencia,
  ConfiguracionRecargo,
  ConfiguracionRecargoFormData,
  // Novedades
  TipoIncapacidad,
  TipoIncapacidadFormData,
  Incapacidad,
  IncapacidadFormData,
  TipoLicencia,
  TipoLicenciaFormData,
  Licencia,
  LicenciaFormData,
  Permiso,
  PermisoFormData,
  PeriodoVacaciones,
  PeriodoVacacionesFormData,
  SolicitudVacaciones,
  SolicitudVacacionesFormData,
  ConfiguracionDotacion,
  ConfiguracionDotacionFormData,
  EntregaDotacion,
  EntregaDotacionFormData,
  // Nomina
  ConfiguracionNomina,
  ConfiguracionNominaList,
  ConfiguracionNominaFormData,
  ConceptoNomina,
  ConceptoNominaFormData,
  PeriodoNomina,
  PeriodoNominaFormData,
  LiquidacionNomina,
  LiquidacionNominaFormData,
  DetalleLiquidacion,
  DetalleLiquidacionFormData,
  Prestacion,
  PrestacionFormData,
  PagoNomina,
  PagoNominaFormData,
  // Proceso Disciplinario
  TipoFalta,
  TipoFaltaFormData,
  LlamadoAtencion,
  LlamadoAtencionFormData,
  Descargo,
  DescargoFormData,
  Memorando,
  MemorandoFormData,
  HistorialDisciplinario,
  // Estructura de Cargos
  Profesiograma,
  ProfesiogramaFormData,
  Vacante,
  VacanteFormData,
  // Desempeno
  CicloEvaluacion,
  CicloEvaluacionFormData,
  EvaluacionDesempeno,
  EvaluacionCreateFormData,
  PlanMejora,
  PlanMejoraFormData,
  ActividadPlanMejora,
  ActividadMejoraFormData,
  Reconocimiento,
  ReconocimientoFormData,
  // Formacion y Reinduccion
  PlanFormacion,
  PlanFormacionFormData,
  Capacitacion,
  CapacitacionFormData,
  ProgramacionCapacitacion,
  ProgramacionFormData,
  EjecucionCapacitacion,
  EvaluacionEficacia,
  Certificado,
  // Off-Boarding
  TipoRetiro,
  TipoRetiroFormData,
  ProcesoRetiro,
  ProcesoRetiroFormData,
  ChecklistRetiro,
  ChecklistRetiroFormData,
  PazSalvo,
  PazSalvoFormData,
  ExamenEgreso,
  ExamenEgresoFormData,
  EntrevistaRetiro,
  EntrevistaRetiroFormData,
  LiquidacionFinal,
} from '../types';

// =============================================================================
// BASE URLS
// =============================================================================

const SELECCION_URL = '/talent-hub/seleccion';
const EMPLEADOS_URL = '/talent-hub/empleados';
const ONBOARDING_URL = '/talent-hub/onboarding';
const CONTROL_TIEMPO_URL = '/talent-hub/control-tiempo';
const NOVEDADES_URL = '/talent-hub/novedades';
const NOMINA_URL = '/talent-hub/nomina';
const DISCIPLINARIO_URL = '/talent-hub/proceso-disciplinario';
const ESTRUCTURA_CARGOS_URL = '/talent-hub/estructura-cargos';
const DESEMPENO_URL = '/talent-hub/desempeno';
const FORMACION_URL = '/talent-hub/formacion';
const OFF_BOARDING_URL = '/talent-hub/off-boarding';

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
    const response = await apiClient.get(`${SELECCION_URL}/estadisticas/`);
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
    const response = await apiClient.get(`${ONBOARDING_URL}/estadisticas/`);
    return response.data;
  },
};

// =============================================================================
// CONTROL DE TIEMPO
// =============================================================================

export const turnoApi = createApiClient<Turno, TurnoFormData, Partial<TurnoFormData>>(
  CONTROL_TIEMPO_URL,
  'turnos'
);

export const asignacionTurnoApi = createApiClient<
  AsignacionTurno,
  AsignacionTurnoFormData,
  Partial<AsignacionTurnoFormData>
>(CONTROL_TIEMPO_URL, 'asignaciones');

export const registroAsistenciaApi = createApiClient<
  RegistroAsistencia,
  RegistroAsistenciaFormData,
  Partial<RegistroAsistenciaFormData>
>(CONTROL_TIEMPO_URL, 'asistencias');

export const marcajeApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${CONTROL_TIEMPO_URL}/marcajes/`, { params });
    return response.data;
  },
};

export const horaExtraApi = createApiClient<
  HoraExtra,
  HoraExtraFormData,
  Partial<HoraExtraFormData>
>(CONTROL_TIEMPO_URL, 'horas-extras');

export const consolidadoApi = {
  ...createApiClient<ConsolidadoAsistencia>(CONTROL_TIEMPO_URL, 'consolidados'),
};

export const configuracionRecargoApi = createApiClient<
  ConfiguracionRecargo,
  ConfiguracionRecargoFormData
>(CONTROL_TIEMPO_URL, 'configuracion-recargos');

// =============================================================================
// NOVEDADES
// =============================================================================

export const tipoIncapacidadApi = createApiClient<
  TipoIncapacidad,
  TipoIncapacidadFormData,
  Partial<TipoIncapacidadFormData>
>(NOVEDADES_URL, 'tipos-incapacidad');

export const incapacidadApi = createApiClient<
  Incapacidad,
  IncapacidadFormData,
  Partial<IncapacidadFormData>
>(NOVEDADES_URL, 'incapacidades');

export const tipoLicenciaApi = createApiClient<
  TipoLicencia,
  TipoLicenciaFormData,
  Partial<TipoLicenciaFormData>
>(NOVEDADES_URL, 'tipos-licencia');

export const licenciaApi = createApiClient<Licencia, LicenciaFormData, Partial<LicenciaFormData>>(
  NOVEDADES_URL,
  'licencias'
);

export const permisoApi = createApiClient<Permiso, PermisoFormData, Partial<PermisoFormData>>(
  NOVEDADES_URL,
  'permisos'
);

export const periodoVacacionesApi = createApiClient<PeriodoVacaciones, PeriodoVacacionesFormData>(
  NOVEDADES_URL,
  'periodos-vacaciones'
);

export const solicitudVacacionesApi = createApiClient<
  SolicitudVacaciones,
  SolicitudVacacionesFormData,
  Partial<SolicitudVacacionesFormData>
>(NOVEDADES_URL, 'solicitudes-vacaciones');

export const dotacionConfigApi = createApiClient<
  ConfiguracionDotacion,
  ConfiguracionDotacionFormData,
  Partial<ConfiguracionDotacionFormData>
>(NOVEDADES_URL, 'dotacion-config');

export const entregaDotacionApi = createApiClient<
  EntregaDotacion,
  EntregaDotacionFormData,
  Partial<EntregaDotacionFormData>
>(NOVEDADES_URL, 'entregas-dotacion');

// =============================================================================
// NOMINA
// =============================================================================

export const configuracionNominaApi = createApiClient<
  ConfiguracionNomina,
  ConfiguracionNominaFormData,
  Partial<ConfiguracionNominaFormData>
>(NOMINA_URL, 'configuraciones');

/** List type differs from detail type for configuraciones */
export const configuracionNominaListApi = createApiClient<
  ConfiguracionNominaList,
  ConfiguracionNominaFormData
>(NOMINA_URL, 'configuraciones');

export const conceptoNominaApi = createApiClient<
  ConceptoNomina,
  ConceptoNominaFormData,
  Partial<ConceptoNominaFormData>
>(NOMINA_URL, 'conceptos');

export const periodoNominaApi = createApiClient<
  PeriodoNomina,
  PeriodoNominaFormData,
  Partial<PeriodoNominaFormData>
>(NOMINA_URL, 'periodos');

export const liquidacionNominaApi = createApiClient<LiquidacionNomina, LiquidacionNominaFormData>(
  NOMINA_URL,
  'liquidaciones'
);

export const detalleLiquidacionApi = createApiClient<
  DetalleLiquidacion,
  DetalleLiquidacionFormData
>(NOMINA_URL, 'detalles');

export const prestacionApi = createApiClient<
  Prestacion,
  PrestacionFormData,
  Partial<PrestacionFormData>
>(NOMINA_URL, 'prestaciones');

export const pagoNominaApi = createApiClient<PagoNomina, PagoNominaFormData>(NOMINA_URL, 'pagos');

// =============================================================================
// PROCESO DISCIPLINARIO
// =============================================================================

export const tipoFaltaApi = createApiClient<
  TipoFalta,
  TipoFaltaFormData,
  Partial<TipoFaltaFormData>
>(DISCIPLINARIO_URL, 'tipos-falta');

export const llamadoAtencionApi = createApiClient<
  LlamadoAtencion,
  LlamadoAtencionFormData,
  Partial<LlamadoAtencionFormData>
>(DISCIPLINARIO_URL, 'llamados-atencion');

export const descargoApi = createApiClient<Descargo, DescargoFormData, Partial<DescargoFormData>>(
  DISCIPLINARIO_URL,
  'descargos'
);

export const memorandoApi = createApiClient<
  Memorando,
  MemorandoFormData,
  Partial<MemorandoFormData>
>(DISCIPLINARIO_URL, 'memorandos');

export const historialDisciplinarioApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${DISCIPLINARIO_URL}/historial/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<HistorialDisciplinario> => {
    const response = await apiClient.get(`${DISCIPLINARIO_URL}/historial/${id}/`);
    return response.data;
  },
};

// =============================================================================
// ESTRUCTURA DE CARGOS
// =============================================================================

export const profesiogramaApi = createApiClient<
  Profesiograma,
  ProfesiogramaFormData,
  Partial<ProfesiogramaFormData>
>(ESTRUCTURA_CARGOS_URL, 'profesiogramas');

export const vacanteECApi = {
  ...createApiClient<Vacante, VacanteFormData, Partial<VacanteFormData>>(
    ESTRUCTURA_CARGOS_URL,
    'vacantes'
  ),
  cerrar: async (id: string, motivo?: string): Promise<Vacante> => {
    const response = await apiClient.post(`${ESTRUCTURA_CARGOS_URL}/vacantes/${id}/cerrar/`, {
      motivo_cierre: motivo,
    });
    return response.data;
  },
};

// =============================================================================
// DESEMPENO
// =============================================================================

export const cicloEvaluacionApi = createApiClient<
  CicloEvaluacion,
  CicloEvaluacionFormData,
  Partial<CicloEvaluacionFormData>
>(DESEMPENO_URL, 'ciclos');

export const evaluacionDesempenoApi = createApiClient<
  EvaluacionDesempeno,
  EvaluacionCreateFormData
>(DESEMPENO_URL, 'evaluaciones');

export const planMejoraApi = createApiClient<PlanMejora, PlanMejoraFormData>(
  DESEMPENO_URL,
  'planes-mejora'
);

export const actividadPlanMejoraApi = createApiClient<ActividadPlanMejora, ActividadMejoraFormData>(
  DESEMPENO_URL,
  'actividades-plan'
);

export const reconocimientoApi = createApiClient<Reconocimiento, ReconocimientoFormData>(
  DESEMPENO_URL,
  'reconocimientos'
);

// =============================================================================
// FORMACION Y REINDUCCION
// =============================================================================

export const planFormacionApi = createApiClient<
  PlanFormacion,
  PlanFormacionFormData,
  Partial<PlanFormacionFormData>
>(FORMACION_URL, 'planes-formacion');

export const capacitacionApi = createApiClient<
  Capacitacion,
  CapacitacionFormData,
  Partial<CapacitacionFormData>
>(FORMACION_URL, 'capacitaciones');

export const programacionApi = createApiClient<ProgramacionCapacitacion, ProgramacionFormData>(
  FORMACION_URL,
  'programaciones'
);

export const ejecucionFormacionApi = createApiClient<
  EjecucionCapacitacion,
  { programacion: number; colaborador: number }
>(FORMACION_URL, 'ejecuciones');

export const evaluacionEficaciaApi = createApiClient<
  EvaluacionEficacia,
  Partial<EvaluacionEficacia>
>(FORMACION_URL, 'evaluaciones-eficacia');

export const certificadoApi = createApiClient<Certificado>(FORMACION_URL, 'certificados');

// =============================================================================
// OFF-BOARDING
// =============================================================================

export const tipoRetiroApi = createApiClient<
  TipoRetiro,
  TipoRetiroFormData,
  Partial<TipoRetiroFormData>
>(OFF_BOARDING_URL, 'tipos-retiro');

export const procesoRetiroApi = createApiClient<
  ProcesoRetiro,
  ProcesoRetiroFormData,
  Partial<ProcesoRetiroFormData>
>(OFF_BOARDING_URL, 'procesos');

export const checklistRetiroApi = createApiClient<
  ChecklistRetiro,
  ChecklistRetiroFormData,
  Partial<ChecklistRetiroFormData>
>(OFF_BOARDING_URL, 'checklist');

export const pazSalvoApi = createApiClient<PazSalvo, PazSalvoFormData, Partial<PazSalvoFormData>>(
  OFF_BOARDING_URL,
  'paz-salvos'
);

export const examenEgresoApi = createApiClient<
  ExamenEgreso,
  ExamenEgresoFormData,
  Partial<ExamenEgresoFormData>
>(OFF_BOARDING_URL, 'examenes-egreso');

export const entrevistaRetiroApi = createApiClient<
  EntrevistaRetiro,
  EntrevistaRetiroFormData,
  Partial<EntrevistaRetiroFormData>
>(OFF_BOARDING_URL, 'entrevistas');

export const liquidacionFinalApi = createApiClient<LiquidacionFinal>(
  OFF_BOARDING_URL,
  'liquidaciones'
);

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
  // Control de Tiempo
  turno: turnoApi,
  asignacionTurno: asignacionTurnoApi,
  registroAsistencia: registroAsistenciaApi,
  marcaje: marcajeApi,
  horaExtra: horaExtraApi,
  consolidado: consolidadoApi,
  configuracionRecargo: configuracionRecargoApi,
  // Novedades
  tipoIncapacidad: tipoIncapacidadApi,
  incapacidad: incapacidadApi,
  tipoLicencia: tipoLicenciaApi,
  licencia: licenciaApi,
  permiso: permisoApi,
  periodoVacaciones: periodoVacacionesApi,
  solicitudVacaciones: solicitudVacacionesApi,
  dotacionConfig: dotacionConfigApi,
  entregaDotacion: entregaDotacionApi,
  // Nomina
  configuracionNomina: configuracionNominaApi,
  conceptoNomina: conceptoNominaApi,
  periodoNomina: periodoNominaApi,
  liquidacionNomina: liquidacionNominaApi,
  detalleLiquidacion: detalleLiquidacionApi,
  prestacion: prestacionApi,
  pagoNomina: pagoNominaApi,
  // Proceso Disciplinario
  tipoFalta: tipoFaltaApi,
  llamadoAtencion: llamadoAtencionApi,
  descargo: descargoApi,
  memorando: memorandoApi,
  historialDisciplinario: historialDisciplinarioApi,
  // Estructura de Cargos
  profesiograma: profesiogramaApi,
  vacanteEC: vacanteECApi,
  // Desempeno
  cicloEvaluacion: cicloEvaluacionApi,
  evaluacionDesempeno: evaluacionDesempenoApi,
  planMejora: planMejoraApi,
  actividadPlanMejora: actividadPlanMejoraApi,
  reconocimiento: reconocimientoApi,
  // Formacion
  planFormacion: planFormacionApi,
  capacitacion: capacitacionApi,
  programacion: programacionApi,
  ejecucionFormacion: ejecucionFormacionApi,
  evaluacionEficacia: evaluacionEficaciaApi,
  certificado: certificadoApi,
  // Off-Boarding
  tipoRetiro: tipoRetiroApi,
  procesoRetiro: procesoRetiroApi,
  checklistRetiro: checklistRetiroApi,
  pazSalvo: pazSalvoApi,
  examenEgreso: examenEgresoApi,
  entrevistaRetiro: entrevistaRetiroApi,
  liquidacionFinal: liquidacionFinalApi,
};

export default talentHubApi;
