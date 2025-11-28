/**
 * Exports del modulo Recolecciones
 */

// Pages
export { RecoleccionesPage } from './pages/RecoleccionesPage';

// Components
export { RecoleccionesTable } from './components/RecoleccionesTable';
export { RegistrarRecoleccionModal } from './components/RegistrarRecoleccionModal';
export { VoucherRecoleccion } from './components/VoucherRecoleccion';
export { VoucherModal } from './components/VoucherModal';

// Hooks
export {
  useRecolecciones,
  useRecoleccion,
  useEstadisticasRecolecciones,
  useProgramacionesEnRuta,
  useVoucherRecoleccion,
  useMisRecolecciones,
  useRecoleccionesPorEcoaliado,
  useRegistrarRecoleccion,
} from './api/useRecolecciones';

// Types
export type {
  Recoleccion,
  RecoleccionDetalle,
  RegistrarRecoleccionDTO,
  RegistrarRecoleccionResponse,
  VoucherData,
  ProgramacionEnRuta,
  RecoleccionEstadisticas,
  RecoleccionFilters,
  PaginatedRecolecciones,
  PaginatedProgramacionesEnRuta,
} from './types/recoleccion.types';
