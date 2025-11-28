/**
 * Módulo Ecoaliados - Exports
 */

// Pages
export { EcoaliadosPage } from './pages/EcoaliadosPage';

// Components
export { EcoaliadosTable } from './components/EcoaliadosTable';
export { EcoaliadoForm } from './components/EcoaliadoForm';
export { GeolocationButton } from './components/GeolocationButton';
export { CambiarPrecioModal } from './components/CambiarPrecioModal';
export { HistorialPrecioModal } from './components/HistorialPrecioModal';

// API & Hooks
export * from './api/useEcoaliados';
export { ecoaliadosAPI } from './api/ecoaliadosApi';

// Types
export type {
  Ecoaliado,
  CreateEcoaliadoDTO,
  UpdateEcoaliadoDTO,
  CambiarPrecioEcoaliadoDTO,
  HistorialPrecioEcoaliado,
  EcoaliadoFilters,
  UnidadNegocio,
  GeolocationCoordinates,
  GeolocationError,
  TipoDocumento,
  TipoCambioPrecio,
} from './types/ecoaliado.types';
