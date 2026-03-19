/**
 * Hooks para Mi Equipo
 *
 * Hooks propios del módulo MSS + re-exports centralizados de hooks compartidos.
 * Todos los componentes de mi-equipo importan desde aquí — NUNCA directamente
 * de @/features/talent-hub/.
 */

// MSS (Manager Self-Service) — hooks propios
export {
  miEquipoKeys,
  useMiEquipo,
  useAprobacionesPendientes,
  useAprobarSolicitud,
  useAsistenciaEquipo,
  useEvaluacionesEquipo,
} from '../api/miEquipoApi';

// Colaboradores — compartidos con talent-hub
export * from './useColaboradores';

// Selección y Contratación — compartidos con talent-hub
export * from './useSeleccionContratacion';

// Onboarding e Inducción — compartidos con talent-hub
export * from './useOnboardingInduccion';
