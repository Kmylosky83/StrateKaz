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
} as const;
