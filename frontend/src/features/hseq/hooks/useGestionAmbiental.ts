/**
 * Hooks React Query para Módulo de Gestión Ambiental - HSEQ Management
 * Sistema de gestión ambiental integral
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import gestionAmbientalApi from '../api/gestionAmbientalApi';
import type {
  CreateTipoResiduoDTO,
  UpdateTipoResiduoDTO,
  CreateGestorAmbientalDTO,
  CreateRegistroResiduoDTO,
  UpdateRegistroResiduoDTO,
  CreateVertimientoDTO,
  UpdateVertimientoDTO,
  CreateRegistroEmisionDTO,
  UpdateRegistroEmisionDTO,
  CreateConsumoRecursoDTO,
  UpdateConsumoRecursoDTO,
  CreateCertificadoAmbientalDTO,
  UpdateCertificadoAmbientalDTO,
  GenerarCertificadoDTO,
  CalcularHuellaInputDTO,
} from '../types/gestion-ambiental.types';

// Helper para extraer mensaje de error de respuestas API
const getApiError = (error: unknown, fallback: string): string => {
  const err = error as { response?: { data?: { detail?: string } } };
  return err?.response?.data?.detail || fallback;
};

// ==================== QUERY KEYS ====================

export const gestionAmbientalKeys = {
  all: ['hseq', 'gestion-ambiental'] as const,

  // Tipos de Residuos
  tiposResiduos: () => [...gestionAmbientalKeys.all, 'tipos-residuos'] as const,
  tipoResiduoById: (id: number) => [...gestionAmbientalKeys.tiposResiduos(), id] as const,
  tiposResiduosPorClase: () => [...gestionAmbientalKeys.tiposResiduos(), 'por-clase'] as const,

  // Gestores
  gestores: () => [...gestionAmbientalKeys.all, 'gestores'] as const,
  gestorById: (id: number) => [...gestionAmbientalKeys.gestores(), id] as const,

  // Residuos
  residuos: () => [...gestionAmbientalKeys.all, 'residuos'] as const,
  residuoById: (id: number) => [...gestionAmbientalKeys.residuos(), id] as const,
  residuosResumen: (filters: Record<string, unknown>) =>
    [...gestionAmbientalKeys.residuos(), 'resumen', filters] as const,

  // Vertimientos
  vertimientos: () => [...gestionAmbientalKeys.all, 'vertimientos'] as const,
  vertimientoById: (id: number) => [...gestionAmbientalKeys.vertimientos(), id] as const,
  vertimientosNoConformes: () => [...gestionAmbientalKeys.vertimientos(), 'no-conformes'] as const,

  // Fuentes de Emisión
  fuentesEmision: () => [...gestionAmbientalKeys.all, 'fuentes-emision'] as const,
  fuenteEmisionById: (id: number) => [...gestionAmbientalKeys.fuentesEmision(), id] as const,

  // Emisiones
  emisiones: () => [...gestionAmbientalKeys.all, 'emisiones'] as const,
  emisionById: (id: number) => [...gestionAmbientalKeys.emisiones(), id] as const,
  emisionesNoConformes: () => [...gestionAmbientalKeys.emisiones(), 'no-conformes'] as const,

  // Tipos de Recursos
  tiposRecursos: () => [...gestionAmbientalKeys.all, 'tipos-recursos'] as const,
  tipoRecursoById: (id: number) => [...gestionAmbientalKeys.tiposRecursos(), id] as const,

  // Consumos
  consumos: () => [...gestionAmbientalKeys.all, 'consumos'] as const,
  consumoById: (id: number) => [...gestionAmbientalKeys.consumos(), id] as const,
  consumosResumenAnual: (empresaId: number, year?: number) =>
    [...gestionAmbientalKeys.consumos(), 'resumen-anual', empresaId, year] as const,

  // Huella de Carbono
  huellasCarbono: () => [...gestionAmbientalKeys.all, 'huella-carbono'] as const,
  huellaCarbonoById: (id: number) => [...gestionAmbientalKeys.huellasCarbono(), id] as const,
  huellaCarbonoComparativa: (empresaId: number) =>
    [...gestionAmbientalKeys.huellasCarbono(), 'comparativa', empresaId] as const,

  // Certificados
  certificados: () => [...gestionAmbientalKeys.all, 'certificados'] as const,
  certificadoById: (id: number) => [...gestionAmbientalKeys.certificados(), id] as const,
  certificadosProximosVencer: () =>
    [...gestionAmbientalKeys.certificados(), 'proximos-vencer'] as const,
  certificadosVencidos: () => [...gestionAmbientalKeys.certificados(), 'vencidos'] as const,
};

// ==================== TIPOS DE RESIDUOS ====================

export function useTiposResiduos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.tiposResiduos(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.tipoResiduo.getAll(params);
      return data;
    },
  });
}

export function useTiposResiduosPorClase() {
  return useQuery({
    queryKey: gestionAmbientalKeys.tiposResiduosPorClase(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.tipoResiduo.porClase();
      return data;
    },
  });
}

export function useCreateTipoResiduo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateTipoResiduoDTO) => {
      const data = await gestionAmbientalApi.tipoResiduo.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.tiposResiduos() });
      toast.success('Tipo de residuo creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al crear tipo de residuo'));
    },
  });
}

export function useUpdateTipoResiduo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateTipoResiduoDTO }) => {
      const data = await gestionAmbientalApi.tipoResiduo.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.tiposResiduos() });
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.tipoResiduoById(id) });
      toast.success('Tipo de residuo actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al actualizar tipo de residuo'));
    },
  });
}

// ==================== GESTORES AMBIENTALES ====================

export function useGestores(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.gestores(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.gestorAmbiental.getAll(params);
      return data;
    },
  });
}

export function useCreateGestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateGestorAmbientalDTO) => {
      const data = await gestionAmbientalApi.gestorAmbiental.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.gestores() });
      toast.success('Gestor ambiental creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al crear gestor ambiental'));
    },
  });
}

// ==================== REGISTROS DE RESIDUOS ====================

export function useResiduos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.residuos(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.registroResiduo.getAll(params);
      return data;
    },
  });
}

export function useResiduosResumen(params: {
  empresa_id: number;
  fecha_inicio: string;
  fecha_fin: string;
}) {
  return useQuery({
    queryKey: gestionAmbientalKeys.residuosResumen(params),
    queryFn: async () => {
      const data = await gestionAmbientalApi.registroResiduo.getResumen(params);
      return data;
    },
    enabled: !!(params.empresa_id && params.fecha_inicio && params.fecha_fin),
  });
}

export function useCreateResiduo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateRegistroResiduoDTO) => {
      const data = await gestionAmbientalApi.registroResiduo.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.residuos() });
      toast.success('Registro de residuo creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al crear registro de residuo'));
    },
  });
}

export function useUpdateResiduo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateRegistroResiduoDTO }) => {
      const data = await gestionAmbientalApi.registroResiduo.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.residuos() });
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.residuoById(id) });
      toast.success('Registro de residuo actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al actualizar registro de residuo'));
    },
  });
}

export function useDeleteResiduo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await gestionAmbientalApi.registroResiduo.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.residuos() });
      toast.success('Registro de residuo eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al eliminar registro de residuo'));
    },
  });
}

export function useGenerarCertificado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: GenerarCertificadoDTO) => {
      const data = await gestionAmbientalApi.registroResiduo.generarCertificado(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.certificados() });
      toast.success('Certificado generado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al generar certificado'));
    },
  });
}

// ==================== VERTIMIENTOS ====================

export function useVertimientos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.vertimientos(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.vertimiento.getAll(params);
      return data;
    },
  });
}

export function useVertimientosNoConformes(empresaId?: number) {
  return useQuery({
    queryKey: gestionAmbientalKeys.vertimientosNoConformes(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.vertimiento.getNoConformes(empresaId);
      return data;
    },
  });
}

export function useUpdateVertimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateVertimientoDTO }) => {
      const data = await gestionAmbientalApi.vertimiento.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.vertimientos() });
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.vertimientoById(id) });
      toast.success('Vertimiento actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al actualizar vertimiento'));
    },
  });
}

export function useDeleteVertimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await gestionAmbientalApi.vertimiento.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.vertimientos() });
      toast.success('Vertimiento eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al eliminar vertimiento'));
    },
  });
}

export function useCreateVertimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateVertimientoDTO) => {
      const data = await gestionAmbientalApi.vertimiento.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.vertimientos() });
      toast.success('Vertimiento registrado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al registrar vertimiento'));
    },
  });
}

// ==================== EMISIONES ====================

export function useFuentesEmision(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.fuentesEmision(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.fuenteEmision.getAll(params);
      return data;
    },
  });
}

export function useEmisiones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.emisiones(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.registroEmision.getAll(params);
      return data;
    },
  });
}

export function useUpdateEmision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateRegistroEmisionDTO }) => {
      const data = await gestionAmbientalApi.registroEmision.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.emisiones() });
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.emisionById(id) });
      toast.success('Emisión actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al actualizar emisión'));
    },
  });
}

export function useDeleteEmision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await gestionAmbientalApi.registroEmision.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.emisiones() });
      toast.success('Emisión eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al eliminar emisión'));
    },
  });
}

export function useCreateEmision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateRegistroEmisionDTO) => {
      const data = await gestionAmbientalApi.registroEmision.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.emisiones() });
      toast.success('Emisión registrada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al registrar emisión'));
    },
  });
}

// ==================== CONSUMO DE RECURSOS ====================

export function useTiposRecursos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.tiposRecursos(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.tipoRecurso.getAll(params);
      return data;
    },
  });
}

export function useConsumos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.consumos(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.consumoRecurso.getAll(params);
      return data;
    },
  });
}

export function useConsumosResumenAnual(empresaId: number, year?: number) {
  return useQuery({
    queryKey: gestionAmbientalKeys.consumosResumenAnual(empresaId, year),
    queryFn: async () => {
      const data = await gestionAmbientalApi.consumoRecurso.getResumenAnual(empresaId, year);
      return data;
    },
    enabled: !!empresaId,
  });
}

export function useUpdateConsumo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateConsumoRecursoDTO }) => {
      const data = await gestionAmbientalApi.consumoRecurso.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.consumos() });
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.consumoById(id) });
      toast.success('Consumo actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al actualizar consumo'));
    },
  });
}

export function useDeleteConsumo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await gestionAmbientalApi.consumoRecurso.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.consumos() });
      toast.success('Consumo eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al eliminar consumo'));
    },
  });
}

export function useCreateConsumo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateConsumoRecursoDTO) => {
      const data = await gestionAmbientalApi.consumoRecurso.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.consumos() });
      toast.success('Consumo registrado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al registrar consumo'));
    },
  });
}

// ==================== HUELLA DE CARBONO ====================

export function useHuellasCarbono(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.huellasCarbono(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.huellaCarbono.getAll(params);
      return data;
    },
  });
}

export function useHuellaCarbonoComparativa(empresaId: number) {
  return useQuery({
    queryKey: gestionAmbientalKeys.huellaCarbonoComparativa(empresaId),
    queryFn: async () => {
      const data = await gestionAmbientalApi.huellaCarbono.getComparativaAnual(empresaId);
      return data;
    },
    enabled: !!empresaId,
  });
}

export function useCalcularHuella() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CalcularHuellaInputDTO) => {
      const data = await gestionAmbientalApi.huellaCarbono.calcularHuella(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.huellasCarbono() });
      toast.success('Huella de carbono calculada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al calcular huella de carbono'));
    },
  });
}

export function useVerificarHuella() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, verificador }: { id: number; verificador?: string }) => {
      const data = await gestionAmbientalApi.huellaCarbono.verificar(id, verificador);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.huellasCarbono() });
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.huellaCarbonoById(id) });
      toast.success('Huella de carbono verificada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al verificar huella de carbono'));
    },
  });
}

// ==================== CERTIFICADOS AMBIENTALES ====================

export function useCertificados(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: gestionAmbientalKeys.certificados(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.certificadoAmbiental.getAll(params);
      return data;
    },
  });
}

export function useCertificadosProximosVencer() {
  return useQuery({
    queryKey: gestionAmbientalKeys.certificadosProximosVencer(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.certificadoAmbiental.getProximosVencer();
      return data;
    },
  });
}

export function useCertificadosVencidos() {
  return useQuery({
    queryKey: gestionAmbientalKeys.certificadosVencidos(),
    queryFn: async () => {
      const data = await gestionAmbientalApi.certificadoAmbiental.getVencidos();
      return data;
    },
  });
}

export function useUpdateCertificado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateCertificadoAmbientalDTO }) => {
      const data = await gestionAmbientalApi.certificadoAmbiental.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.certificados() });
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.certificadoById(id) });
      toast.success('Certificado actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al actualizar certificado'));
    },
  });
}

export function useDeleteCertificado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await gestionAmbientalApi.certificadoAmbiental.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.certificados() });
      toast.success('Certificado eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al eliminar certificado'));
    },
  });
}

export function useCreateCertificado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateCertificadoAmbientalDTO) => {
      const data = await gestionAmbientalApi.certificadoAmbiental.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionAmbientalKeys.certificados() });
      toast.success('Certificado creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'Error al crear certificado'));
    },
  });
}
