/**
 * React Query Hooks para Seleccion y Contratacion - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Sprint 20: Refactorizado con factories (talentHubApi + thKeys).
 * Mantiene TODOS los exports existentes para compatibilidad.
 *
 * API Base: /mi-equipo/seleccion/
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { thKeys } from '../api/queryKeys';
import {
  vacanteActivaApi,
  candidatoApi,
  entrevistaApi,
  pruebaApi,
  afiliacionSSApi,
  historialContratoApi,
  tipoContratoApi,
  tipoEntidadApi,
  entidadSSApi,
  tipoPruebaApi,
  plantillaPruebaApi,
  asignacionPruebaApi,
  entrevistaAsincronicaApi,
  procesoSeleccionEstadisticasApi,
} from '../api/talentHubApi';
import { apiClient as api } from '@/lib/api-client';
import type {
  VacanteActivaFilters,
  CandidatoFilters,
  EntrevistaFilters,
  PruebaFilters,
  AfiliacionSSFilters,
  HistorialContratoFilters,
  AsignacionPruebaFilters,
  EntrevistaAsincronicaFilters,
  EstadoCandidato,
  ContratarCandidatoDTO,
  ContratarCandidatoResponse,
  RenovarContratoDTO,
  OtrosiDTO,
  TipoContrato,
  TipoEntidad,
  EntidadSeguridadSocial,
  TipoPrueba,
  PlantillaPruebaList,
  PruebaPublicaData,
  EntrevistaAsincronicaPublicData,
  ContratoPublicData,
} from '../types';

// ============================================================================
// BACKWARD-COMPAT: Legacy query keys (re-export for existing consumers)
// ============================================================================

export const seleccionKeys = {
  tiposContrato: thKeys.tiposContrato.all,
  tiposEntidad: thKeys.tiposEntidad.all,
  entidadesSS: (tipoCodigo?: string) => thKeys.entidadesSS.list({ tipo_codigo: tipoCodigo }),
  tiposPrueba: thKeys.tiposPrueba.all,
  vacantesActivas: {
    all: thKeys.vacantes.all,
    list: (filters?: VacanteActivaFilters) => thKeys.vacantes.list(filters),
    detail: (id: number) => thKeys.vacantes.detail(id),
    abiertas: () => thKeys.vacantes.custom('abiertas'),
    perfilamiento: (id: number) => thKeys.vacantes.custom('perfilamiento', id),
  },
  candidatos: {
    all: thKeys.candidatos.all,
    list: (filters?: CandidatoFilters) => thKeys.candidatos.list(filters),
    detail: (id: number) => thKeys.candidatos.detail(id),
    porVacante: (vacanteId: number) => thKeys.candidatos.custom('vacante', vacanteId),
  },
  entrevistas: {
    all: thKeys.entrevistas.all,
    list: (filters?: EntrevistaFilters) => thKeys.entrevistas.list(filters),
    detail: (id: number) => thKeys.entrevistas.detail(id),
    porCandidato: (candidatoId: number) => thKeys.entrevistas.custom('candidato', candidatoId),
  },
  pruebas: {
    all: thKeys.pruebas.all,
    list: (filters?: PruebaFilters) => thKeys.pruebas.list(filters),
    detail: (id: number) => thKeys.pruebas.detail(id),
    porCandidato: (candidatoId: number) => thKeys.pruebas.custom('candidato', candidatoId),
  },
  afiliaciones: {
    all: thKeys.afiliaciones.all,
    list: (filters?: AfiliacionSSFilters) => thKeys.afiliaciones.list(filters),
    porCandidato: (candidatoId: number) => thKeys.afiliaciones.custom('candidato', candidatoId),
  },
  historialContratos: {
    all: thKeys.contratos.all,
    list: (filters?: HistorialContratoFilters) => thKeys.contratos.list(filters),
    detail: (id: number) => thKeys.contratos.detail(id),
    porVencer: (dias?: number) => thKeys.contratos.custom('por-vencer', dias),
  },
  plantillasPrueba: {
    all: thKeys.plantillasPrueba.all,
    list: () => thKeys.plantillasPrueba.lists(),
    detail: (id: number) => thKeys.plantillasPrueba.detail(id),
    activas: () => thKeys.plantillasPrueba.custom('activas'),
  },
  asignacionesPrueba: {
    all: thKeys.asignacionesPrueba.all,
    list: (filters?: AsignacionPruebaFilters) => thKeys.asignacionesPrueba.list(filters),
    detail: (id: number) => thKeys.asignacionesPrueba.detail(id),
    porCandidato: (candidatoId: number) =>
      thKeys.asignacionesPrueba.custom('candidato', candidatoId),
  },
  entrevistasAsync: {
    all: thKeys.entrevistasAsync.all,
    list: (filters?: EntrevistaAsincronicaFilters) => thKeys.entrevistasAsync.list(filters),
    detail: (id: number) => thKeys.entrevistasAsync.detail(id),
    porCandidato: (candidatoId: number) => thKeys.entrevistasAsync.custom('candidato', candidatoId),
  },
  estadisticas: () => thKeys.estadisticasSeleccion.all,
};

// ============================================================================
// ERROR HELPER
// ============================================================================

function getMsg(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.data) {
    const d = error.response.data;
    if (typeof d === 'string') return d;
    if (d.detail) return String(d.detail);
    if (d.message) return String(d.message);
    const first = Object.values(d)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// ============================================================================
// HOOKS - CATALOGOS
// ============================================================================

export function useTiposContrato() {
  return useQuery({
    queryKey: thKeys.tiposContrato.lists(),
    queryFn: async () => {
      const res = await tipoContratoApi.getAll();
      return Array.isArray(res) ? res : ((res?.results ?? []) as TipoContrato[]);
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useTiposEntidad() {
  return useQuery({
    queryKey: thKeys.tiposEntidad.lists(),
    queryFn: async () => {
      const res = await tipoEntidadApi.getAll();
      return Array.isArray(res) ? res : ((res?.results ?? []) as TipoEntidad[]);
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useEntidadesSS(tipoCodigo?: string) {
  return useQuery({
    queryKey: thKeys.entidadesSS.list({ tipo_codigo: tipoCodigo }),
    queryFn: async () => {
      if (tipoCodigo) return entidadSSApi.porTipo(tipoCodigo);
      const res = await entidadSSApi.getAll();
      return Array.isArray(res) ? res : ((res?.results ?? []) as EntidadSeguridadSocial[]);
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useTiposPrueba() {
  return useQuery({
    queryKey: thKeys.tiposPrueba.lists(),
    queryFn: async () => {
      const res = await tipoPruebaApi.getAll();
      return Array.isArray(res) ? res : ((res?.results ?? []) as TipoPrueba[]);
    },
    staleTime: 30 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - VACANTES ACTIVAS
// ============================================================================

export function useVacantesActivas(filters?: VacanteActivaFilters) {
  return useQuery({
    queryKey: thKeys.vacantes.list(filters),
    queryFn: () => vacanteActivaApi.getAll(filters as Record<string, unknown>),
    staleTime: 3 * 60 * 1000,
  });
}

export function useVacanteActiva(id: number) {
  return useQuery({
    queryKey: thKeys.vacantes.detail(id),
    queryFn: () => vacanteActivaApi.getDetail(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useVacantesActivasAbiertas() {
  return useQuery({
    queryKey: thKeys.vacantes.custom('abiertas'),
    queryFn: () => vacanteActivaApi.abiertas(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateVacanteActiva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vacanteActivaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.vacantes.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Vacante creada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al crear la vacante')),
  });
}

export function useUpdateVacanteActiva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      vacanteActivaApi.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.vacantes.all });
      toast.success('Vacante actualizada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al actualizar la vacante')),
  });
}

export function useCerrarVacanteActiva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo_cierre }: { id: number; motivo_cierre?: string }) =>
      vacanteActivaApi.cerrar(id, motivo_cierre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.vacantes.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Vacante cerrada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al cerrar la vacante')),
  });
}

export function usePublicarVacanteActiva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, url_publicacion }: { id: number; url_publicacion?: string }) => {
      const response = await api.post(`/mi-equipo/seleccion/vacantes-activas/${id}/publicar/`, {
        url_publicacion,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.vacantes.all });
      toast.success('Estado de publicacion actualizado');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al publicar la vacante')),
  });
}

export function usePerfilamientoVacante(vacanteId: number | null) {
  return useQuery({
    queryKey: thKeys.vacantes.custom('perfilamiento', vacanteId),
    queryFn: () => vacanteActivaApi.perfilamiento(vacanteId!),
    enabled: !!vacanteId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - CANDIDATOS
// ============================================================================

export function useCandidatos(filters?: CandidatoFilters) {
  return useQuery({
    queryKey: thKeys.candidatos.list(filters),
    queryFn: () => candidatoApi.getAll(filters as Record<string, unknown>),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCandidato(id: number) {
  return useQuery({
    queryKey: thKeys.candidatos.detail(id),
    queryFn: () => candidatoApi.getDetail(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCandidatosPorVacante(vacanteId: number) {
  return useQuery({
    queryKey: thKeys.candidatos.custom('vacante', vacanteId),
    queryFn: () => candidatoApi.porVacante(vacanteId),
    enabled: !!vacanteId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCandidato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      if (data.hoja_vida || data.carta_presentacion) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof File) formData.append(key, value);
            else formData.append(key, String(value));
          }
        });
        const response = await api.post('/mi-equipo/seleccion/candidatos/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      }
      return candidatoApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.candidatos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.vacantes.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Candidato registrado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al registrar el candidato')),
  });
}

export function useUpdateCandidato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      candidatoApi.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.candidatos.all });
      toast.success('Candidato actualizado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al actualizar el candidato')),
  });
}

export function useCambiarEstadoCandidato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      _estado,
      motivo,
    }: {
      id: number;
      estado: EstadoCandidato;
      motivo?: string;
    }) => candidatoApi.cambiarEstado(id, _estado, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.candidatos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Estado del candidato actualizado');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al cambiar el estado')),
  });
}

/** Sprint 20: Contratar candidato con datos de contrato completos */
export function useContratarCandidato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & ContratarCandidatoDTO) =>
      candidatoApi.contratar(id, data),
    onSuccess: (res: ContratarCandidatoResponse) => {
      queryClient.invalidateQueries({ queryKey: thKeys.candidatos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.vacantes.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      queryClient.invalidateQueries({ queryKey: thKeys.colaboradores.all });
      queryClient.invalidateQueries({ queryKey: thKeys.contratos.all });
      toast.success(res.message || 'Candidato contratado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al contratar el candidato'), { duration: 5000 }),
  });
}

// ============================================================================
// HOOKS - ENTREVISTAS
// ============================================================================

export function useEntrevistas(filters?: EntrevistaFilters) {
  return useQuery({
    queryKey: thKeys.entrevistas.list(filters),
    queryFn: () => entrevistaApi.getAll(filters as Record<string, unknown>),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEntrevistasPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: thKeys.entrevistas.custom('candidato', candidatoId),
    queryFn: () => entrevistaApi.porCandidato(candidatoId),
    enabled: !!candidatoId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEntrevista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: entrevistaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.entrevistas.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Entrevista programada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al programar la entrevista')),
  });
}

export function useUpdateEntrevista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      entrevistaApi.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.entrevistas.all });
      toast.success('Entrevista actualizada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al actualizar la entrevista')),
  });
}

export function useRealizarEntrevista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      entrevistaApi.realizar(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.entrevistas.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Entrevista registrada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al registrar la entrevista')),
  });
}

export function useCancelarEntrevista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      _estado,
      motivo,
      _fecha_reprogramada,
    }: {
      id: number;
      estado: string;
      motivo: string;
      fecha_reprogramada?: string;
    }) => entrevistaApi.cancelar(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.entrevistas.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Entrevista actualizada');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al actualizar la entrevista')),
  });
}

// ============================================================================
// HOOKS - PRUEBAS
// ============================================================================

export function usePruebas(filters?: PruebaFilters) {
  return useQuery({
    queryKey: thKeys.pruebas.list(filters),
    queryFn: () => pruebaApi.getAll(filters as Record<string, unknown>),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePruebasPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: thKeys.pruebas.custom('candidato', candidatoId),
    queryFn: () => pruebaApi.porCandidato(candidatoId),
    enabled: !!candidatoId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatePrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pruebaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.pruebas.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Prueba programada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al programar la prueba')),
  });
}

export function useCalificarPrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      calificacion,
      observaciones,
      recomendaciones,
      aprobado,
    }: {
      id: number;
      calificacion: number;
      observaciones?: string;
      recomendaciones?: string;
      aprobado?: boolean;
    }) => {
      const response = await api.post(`/mi-equipo/seleccion/pruebas/${id}/calificar/`, {
        calificacion,
        observaciones,
        recomendaciones,
        aprobado,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.pruebas.all });
      toast.success('Prueba calificada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al calificar la prueba')),
  });
}

// ============================================================================
// HOOKS - AFILIACIONES SS
// ============================================================================

export function useAfiliaciones(filters?: AfiliacionSSFilters) {
  return useQuery({
    queryKey: thKeys.afiliaciones.list(filters),
    queryFn: () => afiliacionSSApi.getAll(filters as Record<string, unknown>),
    staleTime: 3 * 60 * 1000,
  });
}

export function useAfiliacionesPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: thKeys.afiliaciones.custom('candidato', candidatoId),
    queryFn: () => afiliacionSSApi.porCandidato(candidatoId),
    enabled: !!candidatoId,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateAfiliacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: afiliacionSSApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.afiliaciones.all });
      toast.success('Afiliacion registrada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al registrar la afiliacion')),
  });
}

export function useConfirmarAfiliacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fecha_afiliacion,
      numero_afiliacion,
    }: {
      id: number;
      fecha_afiliacion?: string;
      numero_afiliacion?: string;
    }) => {
      const response = await api.post(`/mi-equipo/seleccion/afiliaciones/${id}/confirmar/`, {
        fecha_afiliacion,
        numero_afiliacion,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.afiliaciones.all });
      toast.success('Afiliacion confirmada');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al confirmar la afiliacion')),
  });
}

export function useUpdateAfiliacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      afiliacionSSApi.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.afiliaciones.all });
      toast.success('Afiliacion actualizada');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al actualizar la afiliacion')),
  });
}

// ============================================================================
// HOOKS - HISTORIAL CONTRATOS
// ============================================================================

export function useHistorialContratos(filters?: HistorialContratoFilters) {
  return useQuery({
    queryKey: thKeys.contratos.list(filters),
    queryFn: () => historialContratoApi.getAll(filters as Record<string, unknown>),
    staleTime: 5 * 60 * 1000,
  });
}

export function useHistorialContratoDetail(id: number) {
  return useQuery({
    queryKey: thKeys.contratos.detail(id),
    queryFn: () => historialContratoApi.getDetail(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useContratosPorVencer(dias = 30) {
  return useQuery({
    queryKey: thKeys.contratos.custom('por-vencer', dias),
    queryFn: () => historialContratoApi.porVencer(dias),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateHistorialContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      if (data.archivo_contrato) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof File) formData.append(key, value);
            else formData.append(key, String(value));
          }
        });
        const response = await api.post('/mi-equipo/seleccion/historial-contratos/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      }
      return historialContratoApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.contratos.all });
      toast.success('Contrato registrado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al registrar el contrato')),
  });
}

export function useFirmarContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/mi-equipo/seleccion/historial-contratos/${id}/firmar/`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.contratos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.contratos.detail(id) });
      toast.success('Contrato firmado');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al firmar el contrato')),
  });
}

/** Sprint 20: Renovar contrato (Ley 2466/2025) */
export function useRenovarContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RenovarContratoDTO }) =>
      historialContratoApi.renovar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.contratos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.colaboradores.all });
      toast.success('Contrato renovado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al renovar el contrato'), { duration: 5000 }),
  });
}

/** Sprint 20: Crear otrosi */
export function useCrearOtrosi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OtrosiDTO }) =>
      historialContratoApi.otrosi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.contratos.all });
      toast.success('Otrosi creado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al crear el otrosi'), { duration: 5000 }),
  });
}

/** Sprint 20: Obtener warnings Ley 2466 */
export function useContratoWarnings(id: number | null) {
  return useQuery({
    queryKey: thKeys.contratos.custom('warnings', id),
    queryFn: () => historialContratoApi.warnings(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - FIRMA DIGITAL DE CONTRATOS
// ============================================================================

/** Enviar contrato para firma digital (genera token + email) */
export function useEnviarContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => historialContratoApi.enviarContrato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.contratos.all });
      toast.success('Contrato enviado para firma digital');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al enviar el contrato para firma')),
  });
}

/** Reenviar email de firma digital */
export function useReenviarContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => historialContratoApi.reenviarContrato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.contratos.all });
      toast.success('Email de firma reenviado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al reenviar el email de firma')),
  });
}

/** Obtener contrato público para firma (AllowAny, por token) */
export function useContratoPublico(token: string) {
  return useQuery({
    queryKey: ['contrato-publico', token],
    queryFn: async () => {
      const response = await api.get<ContratoPublicData>(
        `/mi-equipo/seleccion/firmar-contrato/${token}/`
      );
      return response.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

/** Firmar contrato público (AllowAny, por token) */
export function useFirmarContratoPublico() {
  return useMutation({
    mutationFn: async ({ token, firma_imagen }: { token: string; firma_imagen: string }) => {
      const response = await api.put(`/mi-equipo/seleccion/firmar-contrato/${token}/`, {
        firma_imagen,
      });
      return response.data;
    },
    onSuccess: () => toast.success('Contrato firmado exitosamente'),
    onError: (e) => toast.error(getMsg(e, 'Error al firmar el contrato')),
  });
}

// ============================================================================
// HOOKS - ESTADISTICAS
// ============================================================================

export function useProcesoSeleccionEstadisticas() {
  return useQuery({
    queryKey: thKeys.estadisticasSeleccion.all,
    queryFn: () => procesoSeleccionEstadisticasApi.get(),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - PLANTILLAS PRUEBA DINAMICA
// ============================================================================

export function usePlantillasPrueba() {
  return useQuery({
    queryKey: thKeys.plantillasPrueba.lists(),
    queryFn: async () => {
      const res = await plantillaPruebaApi.getAll();
      return Array.isArray(res) ? res : ((res?.results ?? []) as PlantillaPruebaList[]);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlantillasPruebaActivas() {
  return useQuery({
    queryKey: thKeys.plantillasPrueba.custom('activas'),
    queryFn: () => plantillaPruebaApi.activas(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlantillaPrueba(id: number) {
  return useQuery({
    queryKey: thKeys.plantillasPrueba.detail(id),
    queryFn: () => plantillaPruebaApi.getDetail(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePlantillaPrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plantillaPruebaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.plantillasPrueba.all });
      toast.success('Plantilla de prueba creada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al crear la plantilla')),
  });
}

export function useUpdatePlantillaPrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      plantillaPruebaApi.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.plantillasPrueba.all });
      toast.success('Plantilla actualizada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al actualizar la plantilla')),
  });
}

export function useDeletePlantillaPrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plantillaPruebaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.plantillasPrueba.all });
      toast.success('Plantilla eliminada');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al eliminar la plantilla')),
  });
}

export function useDuplicarPlantillaPrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/mi-equipo/seleccion/plantillas-prueba/${id}/duplicar/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.plantillasPrueba.all });
      toast.success('Plantilla duplicada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al duplicar')),
  });
}

// ============================================================================
// HOOKS - ASIGNACIONES PRUEBA DINAMICA
// ============================================================================

export function useAsignacionesPrueba(filters?: AsignacionPruebaFilters) {
  return useQuery({
    queryKey: thKeys.asignacionesPrueba.list(filters),
    queryFn: () => asignacionPruebaApi.getAll(filters as Record<string, unknown>),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAsignacionesPruebaPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: thKeys.asignacionesPrueba.custom('candidato', candidatoId),
    queryFn: () => asignacionPruebaApi.porCandidato(candidatoId),
    enabled: !!candidatoId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAsignacionPruebaDetail(id: number | null) {
  return useQuery({
    queryKey: thKeys.asignacionesPrueba.detail(id!),
    queryFn: () => asignacionPruebaApi.getDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAsignacionPrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: asignacionPruebaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.asignacionesPrueba.all });
      queryClient.invalidateQueries({ queryKey: thKeys.plantillasPrueba.all });
      toast.success('Prueba asignada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al asignar la prueba')),
  });
}

export function useReenviarEmailPrueba() {
  return useMutation({
    mutationFn: (id: number) => asignacionPruebaApi.reenviarEmail(id),
    onSuccess: () => toast.success('Email reenviado exitosamente'),
    onError: (e) => toast.error(getMsg(e, 'Error al reenviar el email')),
  });
}

// ============================================================================
// HOOKS - RESPONDER PRUEBA (PUBLICO, SIN AUTH)
// ============================================================================

export function usePruebaPublica(token: string) {
  return useQuery({
    queryKey: ['prueba-publica', token],
    queryFn: async () => {
      const response = await api.get<PruebaPublicaData>(
        `/mi-equipo/seleccion/responder-prueba/${token}/`
      );
      return response.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

export function useResponderPrueba() {
  return useMutation({
    mutationFn: async ({
      token,
      respuestas,
    }: {
      token: string;
      respuestas: Record<string, unknown>;
    }) => {
      const response = await api.put(`/mi-equipo/seleccion/responder-prueba/${token}/`, {
        respuestas,
      });
      return response.data;
    },
    onSuccess: () => toast.success('Prueba enviada exitosamente'),
    onError: (e) => toast.error(getMsg(e, 'Error al enviar la prueba')),
  });
}

// ============================================================================
// HOOKS - ENTREVISTAS ASINCRONICAS
// ============================================================================

export function useEntrevistasAsync(filters?: EntrevistaAsincronicaFilters) {
  return useQuery({
    queryKey: thKeys.entrevistasAsync.list(filters),
    queryFn: () => entrevistaAsincronicaApi.getAll(filters as Record<string, unknown>),
    staleTime: 30 * 1000,
  });
}

export function useEntrevistaAsyncDetail(id: number) {
  return useQuery({
    queryKey: thKeys.entrevistasAsync.detail(id),
    queryFn: () => entrevistaAsincronicaApi.getDetail(id),
    enabled: !!id,
  });
}

export function useEntrevistasAsyncPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: thKeys.entrevistasAsync.custom('candidato', candidatoId),
    queryFn: () => entrevistaAsincronicaApi.porCandidato(candidatoId),
    enabled: !!candidatoId,
  });
}

export function useCreateEntrevistaAsync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: entrevistaAsincronicaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.entrevistasAsync.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Entrevista asincronica creada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al crear la entrevista')),
  });
}

export function useEvaluarEntrevistaAsync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      entrevistaAsincronicaApi.evaluar(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.entrevistasAsync.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Entrevista evaluada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al evaluar la entrevista')),
  });
}

export function useReenviarEmailEntrevistaAsync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => entrevistaAsincronicaApi.reenviarEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.entrevistasAsync.all });
      toast.success('Email reenviado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al reenviar el email')),
  });
}

export function useCancelarEntrevistaAsync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/mi-equipo/seleccion/entrevistas-async/${id}/cancelar/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.entrevistasAsync.all });
      queryClient.invalidateQueries({ queryKey: thKeys.estadisticasSeleccion.all });
      toast.success('Entrevista cancelada');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al cancelar la entrevista')),
  });
}

// ============================================================================
// HOOKS - ENTREVISTA ASINCRONICA PUBLICA (AllowAny)
// ============================================================================

export function useEntrevistaPublica(token: string) {
  return useQuery({
    queryKey: ['entrevista-publica', token],
    queryFn: async () => {
      const response = await api.get<EntrevistaAsincronicaPublicData>(
        `/mi-equipo/seleccion/responder-entrevista/${token}/`
      );
      return response.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

export function useResponderEntrevistaAsync() {
  return useMutation({
    mutationFn: async ({
      token,
      respuestas,
    }: {
      token: string;
      respuestas: Record<string, string>;
    }) => {
      const response = await api.put(`/mi-equipo/seleccion/responder-entrevista/${token}/`, {
        respuestas,
      });
      return response.data;
    },
    onSuccess: () => toast.success('Entrevista enviada exitosamente'),
    onError: (e) => toast.error(getMsg(e, 'Error al enviar las respuestas')),
  });
}
