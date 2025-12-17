/**
 * Hooks de React Query para el modulo de Certificados
 * Sistema de Gestion Grasas y Huesos del Norte
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificadosAPI } from './certificadosApi';
import toast from 'react-hot-toast';
import type { CertificadoFilters } from '../types/certificado.types';

const QUERY_KEY = 'certificados';

/**
 * Hook para obtener lista de certificados con filtros
 */
export const useCertificados = (filters: CertificadoFilters = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', filters],
    queryFn: () => certificadosAPI.getCertificados(filters),
  });
};

/**
 * Hook para obtener detalle de un certificado
 */
export const useCertificado = (id: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => certificadosAPI.getCertificado(id!),
    enabled: !!id,
  });
};

/**
 * Hook para eliminar certificado
 */
export const useDeleteCertificado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => certificadosAPI.deleteCertificado(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Certificado eliminado correctamente');
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const message = error.response?.data?.detail || 'Error al eliminar el certificado';
      toast.error(message);
    },
  });
};
