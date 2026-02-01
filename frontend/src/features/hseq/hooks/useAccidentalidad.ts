/**
 * React Query Hooks para Accidentalidad (ATEL) - HSEQ Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  accidenteTrabajoApi,
  enfermedadLaboralApi,
  incidenteTrabajoApi,
  investigacionATELApi,
  causaRaizApi,
  leccionAprendidaApi,
  planAccionATELApi,
  accionPlanApi,
  estadisticasApi,
} from '../api/accidentalidadApi';
import type {
  CreateAccidenteTrabajoDTO,
  UpdateAccidenteTrabajoDTO,
  CreateEnfermedadLaboralDTO,
  UpdateEnfermedadLaboralDTO,
  CreateIncidenteTrabajoDTO,
  UpdateIncidenteTrabajoDTO,
  CreateInvestigacionATELDTO,
  UpdateInvestigacionATELDTO,
  CompletarInvestigacionDTO,
  CreateCausaRaizDTO,
  UpdateCausaRaizDTO,
  CreateLeccionAprendidaDTO,
  UpdateLeccionAprendidaDTO,
  DivulgarLeccionDTO,
  CreatePlanAccionATELDTO,
  UpdatePlanAccionATELDTO,
  VerificarPlanDTO,
  CreateAccionPlanDTO,
  UpdateAccionPlanDTO,
  CompletarAccionDTO,
  VerificarAccionDTO,
  GravedadAccidente,
  TipoEventoAccidente,
  TipoEnfermedadLaboral,
  EstadoCalificacionEL,
  TipoIncidente,
  PotencialGravedad,
  EstadoInvestigacion,
  EstadoPlanAccion,
  EstadoAccion,
} from '../types/accidentalidad.types';

// ==================== QUERY KEYS ====================

export const accidentalidadKeys = {
  all: ['hseq', 'accidentalidad'] as const,
  accidentes: () => [...accidentalidadKeys.all, 'accidentes'] as const,
  accidente: (id: number) => [...accidentalidadKeys.accidentes(), id] as const,
  enfermedades: () => [...accidentalidadKeys.all, 'enfermedades'] as const,
  enfermedad: (id: number) => [...accidentalidadKeys.enfermedades(), id] as const,
  incidentes: () => [...accidentalidadKeys.all, 'incidentes'] as const,
  incidente: (id: number) => [...accidentalidadKeys.incidentes(), id] as const,
  investigaciones: () => [...accidentalidadKeys.all, 'investigaciones'] as const,
  investigacion: (id: number) => [...accidentalidadKeys.investigaciones(), id] as const,
  causasRaiz: () => [...accidentalidadKeys.all, 'causas-raiz'] as const,
  causaRaiz: (id: number) => [...accidentalidadKeys.causasRaiz(), id] as const,
  lecciones: () => [...accidentalidadKeys.all, 'lecciones'] as const,
  leccion: (id: number) => [...accidentalidadKeys.lecciones(), id] as const,
  planes: () => [...accidentalidadKeys.all, 'planes-accion'] as const,
  plan: (id: number) => [...accidentalidadKeys.planes(), id] as const,
  acciones: () => [...accidentalidadKeys.all, 'acciones'] as const,
  accion: (id: number) => [...accidentalidadKeys.acciones(), id] as const,
  estadisticas: () => [...accidentalidadKeys.all, 'estadisticas'] as const,
};

// ==================== ACCIDENTES DE TRABAJO ====================

export function useAccidentesTrabajo(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  gravedad?: GravedadAccidente;
  tipo_evento?: TipoEventoAccidente;
  fecha_desde?: string;
  fecha_hasta?: string;
  trabajador?: number;
  requiere_investigacion?: boolean;
}) {
  return useQuery({
    queryKey: [...accidentalidadKeys.accidentes(), params],
    queryFn: () => accidenteTrabajoApi.getAll(params),
  });
}

export function useAccidenteTrabajo(id: number) {
  return useQuery({
    queryKey: accidentalidadKeys.accidente(id),
    queryFn: () => accidenteTrabajoApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAccidenteTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAccidenteTrabajoDTO) => accidenteTrabajoApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accidentes() });
      toast.success('Accidente de trabajo reportado');
    },
    onError: () => toast.error('Error al reportar accidente'),
  });
}

export function useUpdateAccidenteTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateAccidenteTrabajoDTO }) =>
      accidenteTrabajoApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accidentes() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accidente(id) });
      toast.success('Accidente actualizado');
    },
    onError: () => toast.error('Error al actualizar accidente'),
  });
}

export function useDeleteAccidenteTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accidenteTrabajoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accidentes() });
      toast.success('Accidente eliminado');
    },
    onError: () => toast.error('Error al eliminar accidente'),
  });
}

export function useReportarARL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: { numero_caso_arl: string; fecha_reporte_arl: string } }) =>
      accidenteTrabajoApi.reportarARL(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accidentes() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accidente(id) });
      toast.success('Reporte a ARL registrado');
    },
    onError: () => toast.error('Error al registrar reporte a ARL'),
  });
}

export function useIniciarInvestigacionAccidente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accidenteTrabajoApi.iniciarInvestigacion(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accidente(id) });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigaciones() });
      toast.success('Investigación iniciada');
    },
    onError: () => toast.error('Error al iniciar investigación'),
  });
}

// ==================== ENFERMEDADES LABORALES ====================

export function useEnfermedadesLaborales(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  tipo_enfermedad?: TipoEnfermedadLaboral;
  estado_calificacion?: EstadoCalificacionEL;
  fecha_desde?: string;
  fecha_hasta?: string;
  trabajador?: number;
}) {
  return useQuery({
    queryKey: [...accidentalidadKeys.enfermedades(), params],
    queryFn: () => enfermedadLaboralApi.getAll(params),
  });
}

export function useEnfermedadLaboral(id: number) {
  return useQuery({
    queryKey: accidentalidadKeys.enfermedad(id),
    queryFn: () => enfermedadLaboralApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateEnfermedadLaboral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEnfermedadLaboralDTO) => enfermedadLaboralApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.enfermedades() });
      toast.success('Enfermedad laboral reportada');
    },
    onError: () => toast.error('Error al reportar enfermedad'),
  });
}

export function useUpdateEnfermedadLaboral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateEnfermedadLaboralDTO }) =>
      enfermedadLaboralApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.enfermedades() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.enfermedad(id) });
      toast.success('Enfermedad actualizada');
    },
    onError: () => toast.error('Error al actualizar enfermedad'),
  });
}

export function useDeleteEnfermedadLaboral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => enfermedadLaboralApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.enfermedades() });
      toast.success('Enfermedad eliminada');
    },
    onError: () => toast.error('Error al eliminar enfermedad'),
  });
}

// ==================== INCIDENTES DE TRABAJO ====================

export function useIncidentesTrabajo(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  tipo_incidente?: TipoIncidente;
  potencial_gravedad?: PotencialGravedad;
  fecha_desde?: string;
  fecha_hasta?: string;
  hubo_danos_materiales?: boolean;
}) {
  return useQuery({
    queryKey: [...accidentalidadKeys.incidentes(), params],
    queryFn: () => incidenteTrabajoApi.getAll(params),
  });
}

export function useIncidenteTrabajo(id: number) {
  return useQuery({
    queryKey: accidentalidadKeys.incidente(id),
    queryFn: () => incidenteTrabajoApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateIncidenteTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateIncidenteTrabajoDTO) => incidenteTrabajoApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.incidentes() });
      toast.success('Incidente reportado');
    },
    onError: () => toast.error('Error al reportar incidente'),
  });
}

export function useUpdateIncidenteTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateIncidenteTrabajoDTO }) =>
      incidenteTrabajoApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.incidentes() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.incidente(id) });
      toast.success('Incidente actualizado');
    },
    onError: () => toast.error('Error al actualizar incidente'),
  });
}

export function useDeleteIncidenteTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => incidenteTrabajoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.incidentes() });
      toast.success('Incidente eliminado');
    },
    onError: () => toast.error('Error al eliminar incidente'),
  });
}

// ==================== INVESTIGACIONES ATEL ====================

export function useInvestigacionesATEL(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoInvestigacion;
  metodologia?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  lider?: number;
}) {
  return useQuery({
    queryKey: [...accidentalidadKeys.investigaciones(), params],
    queryFn: () => investigacionATELApi.getAll(params),
  });
}

export function useInvestigacionATEL(id: number) {
  return useQuery({
    queryKey: accidentalidadKeys.investigacion(id),
    queryFn: () => investigacionATELApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateInvestigacionATEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInvestigacionATELDTO) => investigacionATELApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigaciones() });
      toast.success('Investigación creada');
    },
    onError: () => toast.error('Error al crear investigación'),
  });
}

export function useUpdateInvestigacionATEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateInvestigacionATELDTO }) =>
      investigacionATELApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigaciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigacion(id) });
      toast.success('Investigación actualizada');
    },
    onError: () => toast.error('Error al actualizar investigación'),
  });
}

export function useDeleteInvestigacionATEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => investigacionATELApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigaciones() });
      toast.success('Investigación eliminada');
    },
    onError: () => toast.error('Error al eliminar investigación'),
  });
}

export function useCompletarInvestigacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CompletarInvestigacionDTO }) =>
      investigacionATELApi.completar(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigaciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigacion(id) });
      toast.success('Investigación completada');
    },
    onError: () => toast.error('Error al completar investigación'),
  });
}

export function useAprobarInvestigacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => investigacionATELApi.aprobar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigaciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigacion(id) });
      toast.success('Investigación aprobada');
    },
    onError: () => toast.error('Error al aprobar investigación'),
  });
}

export function useCerrarInvestigacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => investigacionATELApi.cerrar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigaciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigacion(id) });
      toast.success('Investigación cerrada');
    },
    onError: () => toast.error('Error al cerrar investigación'),
  });
}

export function useAgregarCausasRaiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, causas }: { id: number; causas: CreateCausaRaizDTO[] }) =>
      investigacionATELApi.agregarCausas(id, causas),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.investigacion(id) });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.causasRaiz() });
      toast.success('Causas raíz agregadas');
    },
    onError: () => toast.error('Error al agregar causas raíz'),
  });
}

// ==================== CAUSAS RAIZ ====================

export function useCausasRaiz(params?: { investigacion?: number; tipo_causa?: string }) {
  return useQuery({
    queryKey: [...accidentalidadKeys.causasRaiz(), params],
    queryFn: () => causaRaizApi.getAll(params),
  });
}

export function useCausaRaiz(id: number) {
  return useQuery({
    queryKey: accidentalidadKeys.causaRaiz(id),
    queryFn: () => causaRaizApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCausaRaiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCausaRaizDTO) => causaRaizApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.causasRaiz() });
      toast.success('Causa raíz creada');
    },
    onError: () => toast.error('Error al crear causa raíz'),
  });
}

export function useUpdateCausaRaiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateCausaRaizDTO }) =>
      causaRaizApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.causasRaiz() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.causaRaiz(id) });
      toast.success('Causa raíz actualizada');
    },
    onError: () => toast.error('Error al actualizar causa raíz'),
  });
}

export function useDeleteCausaRaiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => causaRaizApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.causasRaiz() });
      toast.success('Causa raíz eliminada');
    },
    onError: () => toast.error('Error al eliminar causa raíz'),
  });
}

// ==================== LECCIONES APRENDIDAS ====================

export function useLeccionesAprendidas(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  categoria?: string;
  estado_divulgacion?: string;
  investigacion?: number;
}) {
  return useQuery({
    queryKey: [...accidentalidadKeys.lecciones(), params],
    queryFn: () => leccionAprendidaApi.getAll(params),
  });
}

export function useLeccionAprendida(id: number) {
  return useQuery({
    queryKey: accidentalidadKeys.leccion(id),
    queryFn: () => leccionAprendidaApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLeccionAprendida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeccionAprendidaDTO) => leccionAprendidaApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.lecciones() });
      toast.success('Lección aprendida creada');
    },
    onError: () => toast.error('Error al crear lección'),
  });
}

export function useUpdateLeccionAprendida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateLeccionAprendidaDTO }) =>
      leccionAprendidaApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.lecciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.leccion(id) });
      toast.success('Lección actualizada');
    },
    onError: () => toast.error('Error al actualizar lección'),
  });
}

export function useDeleteLeccionAprendida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leccionAprendidaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.lecciones() });
      toast.success('Lección eliminada');
    },
    onError: () => toast.error('Error al eliminar lección'),
  });
}

export function useDivulgarLeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: DivulgarLeccionDTO }) =>
      leccionAprendidaApi.divulgar(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.lecciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.leccion(id) });
      toast.success('Lección divulgada');
    },
    onError: () => toast.error('Error al divulgar lección'),
  });
}

// ==================== PLANES DE ACCION ATEL ====================

export function usePlanesAccionATEL(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoPlanAccion;
  investigacion?: number;
  responsable?: number;
  vencidos?: boolean;
}) {
  return useQuery({
    queryKey: [...accidentalidadKeys.planes(), params],
    queryFn: () => planAccionATELApi.getAll(params),
  });
}

export function usePlanAccionATEL(id: number) {
  return useQuery({
    queryKey: accidentalidadKeys.plan(id),
    queryFn: () => planAccionATELApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePlanAccionATEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePlanAccionATELDTO) => planAccionATELApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.planes() });
      toast.success('Plan de acción creado');
    },
    onError: () => toast.error('Error al crear plan de acción'),
  });
}

export function useUpdatePlanAccionATEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePlanAccionATELDTO }) =>
      planAccionATELApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.planes() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.plan(id) });
      toast.success('Plan de acción actualizado');
    },
    onError: () => toast.error('Error al actualizar plan'),
  });
}

export function useDeletePlanAccionATEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => planAccionATELApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.planes() });
      toast.success('Plan de acción eliminado');
    },
    onError: () => toast.error('Error al eliminar plan'),
  });
}

export function useVerificarPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: VerificarPlanDTO }) =>
      planAccionATELApi.verificar(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.planes() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.plan(id) });
      toast.success('Plan verificado');
    },
    onError: () => toast.error('Error al verificar plan'),
  });
}

// ==================== ACCIONES DE PLAN ====================

export function useAccionesPlan(params?: {
  plan_accion?: number;
  estado?: EstadoAccion;
  responsable?: number;
}) {
  return useQuery({
    queryKey: [...accidentalidadKeys.acciones(), params],
    queryFn: () => accionPlanApi.getAll(params),
  });
}

export function useAccionPlan(id: number) {
  return useQuery({
    queryKey: accidentalidadKeys.accion(id),
    queryFn: () => accionPlanApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAccionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAccionPlanDTO) => accionPlanApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.acciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.planes() });
      toast.success('Acción creada');
    },
    onError: () => toast.error('Error al crear acción'),
  });
}

export function useUpdateAccionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateAccionPlanDTO }) =>
      accionPlanApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.acciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accion(id) });
      toast.success('Acción actualizada');
    },
    onError: () => toast.error('Error al actualizar acción'),
  });
}

export function useDeleteAccionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accionPlanApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.acciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.planes() });
      toast.success('Acción eliminada');
    },
    onError: () => toast.error('Error al eliminar acción'),
  });
}

export function useCompletarAccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CompletarAccionDTO }) =>
      accionPlanApi.completar(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.acciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accion(id) });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.planes() });
      toast.success('Acción completada');
    },
    onError: () => toast.error('Error al completar acción'),
  });
}

export function useVerificarAccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: VerificarAccionDTO }) =>
      accionPlanApi.verificar(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.acciones() });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.accion(id) });
      queryClient.invalidateQueries({ queryKey: accidentalidadKeys.planes() });
      toast.success('Acción verificada');
    },
    onError: () => toast.error('Error al verificar acción'),
  });
}

// ==================== ESTADISTICAS ====================

export function useEstadisticasAccidentalidad(params?: {
  fecha_desde?: string;
  fecha_hasta?: string;
}) {
  return useQuery({
    queryKey: [...accidentalidadKeys.estadisticas(), params],
    queryFn: () => estadisticasApi.getEstadisticas(params),
  });
}
