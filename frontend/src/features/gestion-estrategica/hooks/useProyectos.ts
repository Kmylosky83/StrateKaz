/**
 * React Query Hooks para Gestión de Proyectos PMI
 * Sistema de Gestión StrateKaz
 * Hooks alineados con backend viewsets y @actions
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import {
  proyectosApi,
  chartersApi,
  interesadosApi,
  fasesApi,
  actividadesApi,
  recursosApi,
  riesgosProyectoApi,
  seguimientosApi,
  leccionesApi,
  actasCierreApi,
} from '../api/proyectosApi';
import type {
  CreateProyectoDTO,
  UpdateProyectoDTO,
  ProyectoFilters,
  CreateCharterDTO,
  UpdateCharterDTO,
  CreateInteresadoDTO,
  UpdateInteresadoDTO,
  InteresadoFilters,
  CreateFaseDTO,
  UpdateFaseDTO,
  FaseFilters,
  CreateActividadDTO,
  UpdateActividadDTO,
  ActividadFilters,
  KanbanReorderItem,
  CreateRecursoDTO,
  UpdateRecursoDTO,
  RecursoFilters,
  CreateRiesgoDTO,
  UpdateRiesgoDTO,
  RiesgoFilters,
  CreateSeguimientoDTO,
  UpdateSeguimientoDTO,
  SeguimientoFilters,
  CreateLeccionDTO,
  UpdateLeccionDTO,
  LeccionFilters,
  CreateActaCierreDTO,
  UpdateActaCierreDTO,
  ActaCierreFilters,
} from '../types/proyectos';

// ==================== QUERY KEYS ====================

export const proyectosKeys = {
  all: ['proyectos'] as const,
  proyectos: (filters?: ProyectoFilters) => ['proyectos', 'list', filters] as const,
  proyecto: (id: number) => ['proyectos', 'detail', id] as const,
  proyectosDashboard: ['proyectos', 'dashboard'] as const,
  proyectosPorEstado: ['proyectos', 'por-estado'] as const,
  // Sub-models
  charters: (filters?: { proyecto?: number }) => ['proyectos', 'charters', filters] as const,
  charter: (id: number) => ['proyectos', 'charters', 'detail', id] as const,
  interesados: (filters?: InteresadoFilters) => ['proyectos', 'interesados', filters] as const,
  matrizPoderInteres: (proyectoId: number) =>
    ['proyectos', 'interesados', 'matriz', proyectoId] as const,
  fases: (filters?: FaseFilters) => ['proyectos', 'fases', filters] as const,
  actividades: (filters?: ActividadFilters) => ['proyectos', 'actividades', filters] as const,
  gantt: (proyectoId: number) => ['proyectos', 'actividades', 'gantt', proyectoId] as const,
  kanban: (proyectoId: number) => ['proyectos', 'actividades', 'kanban', proyectoId] as const,
  recursos: (filters?: RecursoFilters) => ['proyectos', 'recursos', filters] as const,
  riesgos: (filters?: RiesgoFilters) => ['proyectos', 'riesgos', filters] as const,
  matrizRiesgos: (proyectoId: number) => ['proyectos', 'riesgos', 'matriz', proyectoId] as const,
  seguimientos: (filters?: SeguimientoFilters) => ['proyectos', 'seguimientos', filters] as const,
  curvaS: (proyectoId: number) => ['proyectos', 'seguimientos', 'curva-s', proyectoId] as const,
  lecciones: (filters?: LeccionFilters) => ['proyectos', 'lecciones', filters] as const,
  actasCierre: (filters?: ActaCierreFilters) => ['proyectos', 'actas-cierre', filters] as const,
};

// ==================== HELPERS ====================

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'object' && !Array.isArray(data)) {
      const messages: string[] = [];
      for (const [field, value] of Object.entries(data as Record<string, unknown>)) {
        if (field === 'detail' || field === 'message') return String(value);
        if (Array.isArray(value)) messages.push(`${field}: ${value.join(', ')}`);
        else if (typeof value === 'string') messages.push(`${field}: ${value}`);
      }
      if (messages.length > 0) return messages.join('\n');
    }
    if (typeof data === 'string') return data;
  }
  if (error instanceof Error) return error.message;
  return defaultMessage;
};

// ==================== PROYECTOS ====================

export const useProyectos = (filters?: ProyectoFilters) => {
  return useQuery({
    queryKey: proyectosKeys.proyectos(filters),
    queryFn: () => proyectosApi.getAll(filters),
  });
};

export const useProyecto = (id: number) => {
  return useQuery({
    queryKey: proyectosKeys.proyecto(id),
    queryFn: () => proyectosApi.getById(id),
    enabled: !!id,
  });
};

export const useProyectosDashboard = () => {
  return useQuery({
    queryKey: proyectosKeys.proyectosDashboard,
    queryFn: proyectosApi.getDashboard,
  });
};

export const useProyectosPorEstado = () => {
  return useQuery({
    queryKey: proyectosKeys.proyectosPorEstado,
    queryFn: proyectosApi.getPorEstado,
  });
};

export const useCreateProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProyectoDTO) => proyectosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Proyecto creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear el proyecto'));
    },
  });
};

export const useUpdateProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProyectoDTO }) =>
      proyectosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Proyecto actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el proyecto'));
    },
  });
};

export const useDeleteProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => proyectosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Proyecto eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el proyecto'));
    },
  });
};

export const useCambiarEstadoProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      proyectosApi.cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Estado del proyecto actualizado');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al cambiar el estado del proyecto'));
    },
  });
};

// ==================== CHARTERS ====================

export const useCharters = (filters?: { proyecto?: number }) => {
  return useQuery({
    queryKey: proyectosKeys.charters(filters),
    queryFn: () => chartersApi.getAll(filters),
    enabled: !!filters?.proyecto,
  });
};

export const useCharter = (id: number) => {
  return useQuery({
    queryKey: proyectosKeys.charter(id),
    queryFn: () => chartersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCharter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCharterDTO) => chartersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Charter creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear el charter'));
    },
  });
};

export const useUpdateCharter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCharterDTO }) =>
      chartersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Charter actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el charter'));
    },
  });
};

export const useDeleteCharter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => chartersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Charter eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el charter'));
    },
  });
};

export const useAprobarCharter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { observaciones_aprobacion?: string } }) =>
      chartersApi.aprobar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Charter aprobado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al aprobar el charter'));
    },
  });
};

// ==================== INTERESADOS (STAKEHOLDERS) ====================

export const useInteresados = (filters?: InteresadoFilters) => {
  return useQuery({
    queryKey: proyectosKeys.interesados(filters),
    queryFn: () => interesadosApi.getAll(filters),
    enabled: !!filters?.proyecto,
  });
};

export const useCreateInteresado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInteresadoDTO) => interesadosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Interesado agregado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al agregar el interesado'));
    },
  });
};

export const useUpdateInteresado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInteresadoDTO }) =>
      interesadosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Interesado actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el interesado'));
    },
  });
};

export const useDeleteInteresado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => interesadosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Interesado eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el interesado'));
    },
  });
};

export const useMatrizPoderInteres = (proyectoId: number) => {
  return useQuery({
    queryKey: proyectosKeys.matrizPoderInteres(proyectoId),
    queryFn: () => interesadosApi.getMatrizPoderInteres(proyectoId),
    enabled: !!proyectoId,
  });
};

export const useImportarStakeholders = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { proyecto_id: number; partes_interesadas_ids: number[] }) =>
      interesadosApi.importarDesdeContexto(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success(`${result.creados} interesados importados exitosamente`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al importar interesados'));
    },
  });
};

// ==================== FASES ====================

export const useFases = (filters?: FaseFilters) => {
  return useQuery({
    queryKey: proyectosKeys.fases(filters),
    queryFn: () => fasesApi.getAll(filters),
    enabled: !!filters?.proyecto,
  });
};

export const useCreateFase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFaseDTO) => fasesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Fase creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear la fase'));
    },
  });
};

export const useUpdateFase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFaseDTO }) => fasesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Fase actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar la fase'));
    },
  });
};

export const useDeleteFase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fasesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Fase eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar la fase'));
    },
  });
};

// ==================== ACTIVIDADES ====================

export const useActividades = (filters?: ActividadFilters) => {
  return useQuery({
    queryKey: proyectosKeys.actividades(filters),
    queryFn: () => actividadesApi.getAll(filters),
    enabled: !!filters?.proyecto,
  });
};

export const useCreateActividad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActividadDTO) => actividadesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Actividad creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear la actividad'));
    },
  });
};

export const useUpdateActividad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateActividadDTO }) =>
      actividadesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Actividad actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar la actividad'));
    },
  });
};

export const useDeleteActividad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => actividadesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Actividad eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar la actividad'));
    },
  });
};

export const useGantt = (proyectoId: number) => {
  return useQuery({
    queryKey: proyectosKeys.gantt(proyectoId),
    queryFn: () => actividadesApi.getGantt(proyectoId),
    enabled: !!proyectoId,
  });
};

export const useKanban = (proyectoId: number) => {
  return useQuery({
    queryKey: proyectosKeys.kanban(proyectoId),
    queryFn: () => actividadesApi.getKanban(proyectoId),
    enabled: !!proyectoId,
  });
};

export const useReorderKanban = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: KanbanReorderItem[]) => actividadesApi.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al reordenar actividades'));
    },
  });
};

// ==================== RECURSOS ====================

export const useRecursos = (filters?: RecursoFilters) => {
  return useQuery({
    queryKey: proyectosKeys.recursos(filters),
    queryFn: () => recursosApi.getAll(filters),
    enabled: !!filters?.proyecto,
  });
};

export const useCreateRecurso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecursoDTO) => recursosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Recurso agregado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al agregar el recurso'));
    },
  });
};

export const useUpdateRecurso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRecursoDTO }) =>
      recursosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Recurso actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el recurso'));
    },
  });
};

export const useDeleteRecurso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recursosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Recurso eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el recurso'));
    },
  });
};

// ==================== RIESGOS ====================

export const useRiesgosProyecto = (filters?: RiesgoFilters) => {
  return useQuery({
    queryKey: proyectosKeys.riesgos(filters),
    queryFn: () => riesgosProyectoApi.getAll(filters),
    enabled: !!filters?.proyecto,
  });
};

export const useCreateRiesgo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRiesgoDTO) => riesgosProyectoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Riesgo registrado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al registrar el riesgo'));
    },
  });
};

export const useUpdateRiesgo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRiesgoDTO }) =>
      riesgosProyectoApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Riesgo actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el riesgo'));
    },
  });
};

export const useDeleteRiesgo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => riesgosProyectoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Riesgo eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el riesgo'));
    },
  });
};

export const useMatrizRiesgos = (proyectoId: number) => {
  return useQuery({
    queryKey: proyectosKeys.matrizRiesgos(proyectoId),
    queryFn: () => riesgosProyectoApi.getMatrizRiesgos(proyectoId),
    enabled: !!proyectoId,
  });
};

// ==================== SEGUIMIENTOS (EVM) ====================

export const useSeguimientos = (filters?: SeguimientoFilters) => {
  return useQuery({
    queryKey: proyectosKeys.seguimientos(filters),
    queryFn: () => seguimientosApi.getAll(filters),
    enabled: !!filters?.proyecto,
  });
};

export const useCreateSeguimiento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSeguimientoDTO) => seguimientosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Seguimiento registrado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al registrar el seguimiento'));
    },
  });
};

export const useUpdateSeguimiento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSeguimientoDTO }) =>
      seguimientosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Seguimiento actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el seguimiento'));
    },
  });
};

export const useDeleteSeguimiento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => seguimientosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Seguimiento eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el seguimiento'));
    },
  });
};

export const useCurvaS = (proyectoId: number) => {
  return useQuery({
    queryKey: proyectosKeys.curvaS(proyectoId),
    queryFn: () => seguimientosApi.getCurvaS(proyectoId),
    enabled: !!proyectoId,
  });
};

// ==================== LECCIONES APRENDIDAS ====================

export const useLecciones = (filters?: LeccionFilters) => {
  return useQuery({
    queryKey: proyectosKeys.lecciones(filters),
    queryFn: () => leccionesApi.getAll(filters),
    enabled: !!filters?.proyecto,
  });
};

export const useCreateLeccion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeccionDTO) => leccionesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Lección aprendida registrada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al registrar la lección'));
    },
  });
};

export const useUpdateLeccion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLeccionDTO }) =>
      leccionesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Lección actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar la lección'));
    },
  });
};

export const useDeleteLeccion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leccionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Lección eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar la lección'));
    },
  });
};

export const useBuscarLecciones = (q: string) => {
  return useQuery({
    queryKey: ['proyectos', 'lecciones', 'buscar', q] as const,
    queryFn: () => leccionesApi.buscar(q),
    enabled: q.length >= 2,
  });
};

// ==================== ACTAS DE CIERRE ====================

export const useActasCierre = (filters?: ActaCierreFilters) => {
  return useQuery({
    queryKey: proyectosKeys.actasCierre(filters),
    queryFn: () => actasCierreApi.getAll(filters),
    enabled: !!filters?.proyecto,
  });
};

export const useCreateActaCierre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActaCierreDTO) => actasCierreApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Acta de cierre creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear el acta de cierre'));
    },
  });
};

export const useUpdateActaCierre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateActaCierreDTO }) =>
      actasCierreApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Acta de cierre actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el acta de cierre'));
    },
  });
};

export const useDeleteActaCierre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => actasCierreApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
      toast.success('Acta de cierre eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el acta de cierre'));
    },
  });
};
