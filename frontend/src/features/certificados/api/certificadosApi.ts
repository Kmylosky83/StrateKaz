/**
 * API Client para el modulo de Certificados
 * Sistema de Gestion Grasas y Huesos del Norte
 */
import axiosInstance from '@/api/axios-config';
import type {
  Certificado,
  CertificadoDetalle,
  CertificadoFilters,
  PaginatedCertificados,
} from '../types/certificado.types';

/**
 * API Client para gestion de Certificados de Recoleccion
 */
export const certificadosAPI = {
  /**
   * Obtener lista de certificados con paginacion y filtros
   */
  getCertificados: async (filters?: CertificadoFilters): Promise<PaginatedCertificados> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.ecoaliado) params.append('ecoaliado', filters.ecoaliado.toString());
    if (filters?.periodo) params.append('periodo', filters.periodo);
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    const url = queryString ? `/certificados/?${queryString}` : '/certificados/';

    const response = await axiosInstance.get<PaginatedCertificados>(url);
    return response.data;
  },

  /**
   * Obtener detalle de un certificado (con datos completos para reimprimir)
   */
  getCertificado: async (id: number): Promise<CertificadoDetalle> => {
    const response = await axiosInstance.get<CertificadoDetalle>(`/certificados/${id}/`);
    return response.data;
  },

  /**
   * Eliminar certificado (soft delete)
   */
  deleteCertificado: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/certificados/${id}/`);
  },
};
