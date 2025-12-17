/**
 * Modulo de Certificados de Recoleccion
 * Sistema de Gestion Grasas y Huesos del Norte
 */

// Pages
export { CertificadosPage } from './pages/CertificadosPage';

// API
export { certificadosAPI } from './api/certificadosApi';
export { useCertificados, useCertificado, useDeleteCertificado } from './api/useCertificados';

// Types
export type {
  Certificado,
  CertificadoDetalle,
  CertificadoFilters,
  CertificadoRecoleccionData,
  PaginatedCertificados,
  PeriodoCertificado,
  RecoleccionResumen,
} from './types/certificado.types';
