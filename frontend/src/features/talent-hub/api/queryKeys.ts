/**
 * Query Keys centralizados para Talent Hub - Sprint 20
 * Sistema de Gestion StrateKaz
 *
 * Usa createQueryKeys factory para consistencia con el patron de GE.
 * Importar thKeys en los hooks para queries y mutaciones.
 */
import { createQueryKeys } from '@/lib/query-keys';

// =============================================================================
// SELECCION Y CONTRATACION
// =============================================================================

export const thKeys = {
  // Catalogos (read-only, raramente invalidan)
  tiposContrato: createQueryKeys('th-tipos-contrato'),
  tiposEntidad: createQueryKeys('th-tipos-entidad'),
  entidadesSS: createQueryKeys('th-entidades-ss'),
  tiposPrueba: createQueryKeys('th-tipos-prueba'),

  // Principales
  vacantes: createQueryKeys('th-vacantes'),
  candidatos: createQueryKeys('th-candidatos'),
  entrevistas: createQueryKeys('th-entrevistas'),
  pruebas: createQueryKeys('th-pruebas'),
  afiliaciones: createQueryKeys('th-afiliaciones'),
  contratos: createQueryKeys('th-contratos'),

  // Pruebas Dinamicas
  plantillasPrueba: createQueryKeys('th-plantillas-prueba'),
  asignacionesPrueba: createQueryKeys('th-asignaciones-prueba'),

  // Entrevistas Asincronicas
  entrevistasAsync: createQueryKeys('th-entrevistas-async'),

  // Estadisticas Seleccion
  estadisticasSeleccion: createQueryKeys('th-estadisticas-seleccion'),

  // Colaboradores
  colaboradores: createQueryKeys('th-colaboradores'),
  hojasVida: createQueryKeys('th-hojas-vida'),
  infoPersonal: createQueryKeys('th-info-personal'),
  historialLaboral: createQueryKeys('th-historial-laboral'),
  estadisticasColaboradores: createQueryKeys('th-estadisticas-colaboradores'),

  // Onboarding
  modulosInduccion: createQueryKeys('th-modulos-induccion'),
  asignacionesCargo: createQueryKeys('th-asignaciones-cargo'),
  itemsChecklist: createQueryKeys('th-items-checklist'),
  checklistIngreso: createQueryKeys('th-checklist-ingreso'),
  ejecuciones: createQueryKeys('th-ejecuciones'),
  entregasEPP: createQueryKeys('th-entregas-epp'),
  entregasActivos: createQueryKeys('th-entregas-activos'),
  firmasDocumentos: createQueryKeys('th-firmas-documentos'),
  estadisticasOnboarding: createQueryKeys('th-estadisticas-onboarding'),

  // Control de Tiempo
  turnos: createQueryKeys('th-turnos'),
  asignacionesTurno: createQueryKeys('th-asignaciones-turno'),
  asistencias: createQueryKeys('th-asistencias'),
  marcajes: createQueryKeys('th-marcajes'),
  horasExtras: createQueryKeys('th-horas-extras'),
  consolidados: createQueryKeys('th-consolidados'),
  recargos: createQueryKeys('th-recargos'),

  // Novedades
  tiposIncapacidad: createQueryKeys('th-tipos-incapacidad'),
  incapacidades: createQueryKeys('th-incapacidades'),
  tiposLicencia: createQueryKeys('th-tipos-licencia'),
  licencias: createQueryKeys('th-licencias'),
  permisos: createQueryKeys('th-permisos'),
  periodosVacaciones: createQueryKeys('th-periodos-vacaciones'),
  solicitudesVacaciones: createQueryKeys('th-solicitudes-vacaciones'),
  dotacionConfig: createQueryKeys('th-dotacion-config'),
  entregasDotacion: createQueryKeys('th-entregas-dotacion'),

  // Nomina
  configuracionesNomina: createQueryKeys('th-configuraciones-nomina'),
  conceptosNomina: createQueryKeys('th-conceptos-nomina'),
  periodosNomina: createQueryKeys('th-periodos-nomina'),
  liquidaciones: createQueryKeys('th-liquidaciones'),
  detallesLiquidacion: createQueryKeys('th-detalles-liquidacion'),
  prestaciones: createQueryKeys('th-prestaciones'),
  pagosNomina: createQueryKeys('th-pagos-nomina'),

  // Proceso Disciplinario
  tiposFalta: createQueryKeys('th-tipos-falta'),
  llamadosAtencion: createQueryKeys('th-llamados-atencion'),
  descargos: createQueryKeys('th-descargos'),
  memorandos: createQueryKeys('th-memorandos'),
  historialDisciplinario: createQueryKeys('th-historial-disciplinario'),

  // Estructura de Cargos
  profesiogramas: createQueryKeys('th-profesiogramas'),
  vacantesEC: createQueryKeys('th-vacantes-ec'),

  // Desempeno
  ciclosEvaluacion: createQueryKeys('th-ciclos-evaluacion'),
  competenciasEvaluacion: createQueryKeys('th-competencias-evaluacion'),
  evaluacionesDesempeno: createQueryKeys('th-evaluaciones-desempeno'),
  planesMejora: createQueryKeys('th-planes-mejora'),
  actividadesPlanMejora: createQueryKeys('th-actividades-plan-mejora'),
  tiposReconocimiento: createQueryKeys('th-tipos-reconocimiento'),
  reconocimientos: createQueryKeys('th-reconocimientos'),
  muroReconocimientos: createQueryKeys('th-muro-reconocimientos'),
  estadisticasDesempeno: createQueryKeys('th-estadisticas-desempeno'),

  // Formacion y Reinduccion
  planesFormacion: createQueryKeys('th-planes-formacion'),
  capacitaciones: createQueryKeys('th-capacitaciones'),
  programaciones: createQueryKeys('th-programaciones'),
  ejecucionesFormacion: createQueryKeys('th-ejecuciones-formacion'),
  badges: createQueryKeys('th-badges'),
  evaluacionesEficacia: createQueryKeys('th-evaluaciones-eficacia'),
  certificados: createQueryKeys('th-certificados'),
  gamificacion: createQueryKeys('th-gamificacion'),
  estadisticasFormacion: createQueryKeys('th-estadisticas-formacion'),

  // Off-Boarding
  tiposRetiro: createQueryKeys('th-tipos-retiro'),
  procesosRetiro: createQueryKeys('th-procesos-retiro'),
  checklistRetiro: createQueryKeys('th-checklist-retiro'),
  pazSalvos: createQueryKeys('th-paz-salvos'),
  examenesEgreso: createQueryKeys('th-examenes-egreso'),
  entrevistasRetiro: createQueryKeys('th-entrevistas-retiro'),
  liquidacionesFinales: createQueryKeys('th-liquidaciones-finales'),
} as const;
