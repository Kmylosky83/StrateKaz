/**
 * Barrel export para el módulo de Programaciones
 * Sistema de Gestión Grasas y Huesos del Norte
 */

// Página principal
export { ProgramacionesPage } from './pages/ProgramacionesPage';

// Componentes
export { ProgramacionesTable } from './components/ProgramacionesTable';
export { ProgramacionForm } from './components/ProgramacionForm';
export { AsignarRecolectorModal } from './components/AsignarRecolectorModal';
export { CambiarEstadoModal } from './components/CambiarEstadoModal';
export { ReprogramarModal } from './components/ReprogramarModal';
export { CalendarioView } from './components/CalendarioView';

// API
export { programacionesAPI } from './api/programacionesApi';
export {
  useProgramaciones,
  useProgramacion,
  useCreateProgramacion,
  useUpdateProgramacion,
  useDeleteProgramacion,
  useAsignarRecolector,
  useCambiarEstado,
  useReprogramar,
  useCancelarProgramacion,
  useIniciarRuta,
  useCompletarRecoleccion,
  useEstadisticasProgramaciones,
  useHistorialProgramacion,
  useRecolectores,
  useRecolectoresDisponibles,
  useEcoaliadosProgramacion,
  useUnidadesNegocioProgramacion,
  useProgramacionesCalendario,
} from './api/useProgramaciones';

// Tipos
export type {
  Programacion,
  CreateProgramacionDTO,
  UpdateProgramacionDTO,
  AsignarRecolectorDTO,
  CambiarEstadoDTO,
  ReprogramarDTO,
  EstadoProgramacion,
  TipoProgramacion,
  Recolector,
  ProveedorSimple,
  UnidadNegocio,
  ProgramacionFilters,
  PaginatedResponse,
  EstadisticasProgramaciones,
  EventoCalendario,
  HistorialProgramacion,
} from './types/programacion.types';
