/**
 * React Query Hooks para Seguridad Industrial - HSEQ Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  tipoPermisoTrabajoApi,
  permisoTrabajoApi,
  tipoInspeccionApi,
  plantillaInspeccionApi,
  inspeccionApi,
  tipoEPPApi,
  entregaEPPApi,
  programaSeguridadApi,
} from '../api/seguridadIndustrialApi';
import type {
  CreateTipoPermisoTrabajoDTO,
  UpdateTipoPermisoTrabajoDTO,
  CreatePermisoTrabajoDTO,
  UpdatePermisoTrabajoDTO,
  AprobarPermisoDTO,
  CerrarPermisoDTO,
  CreateTipoInspeccionDTO,
  UpdateTipoInspeccionDTO,
  CreatePlantillaInspeccionDTO,
  UpdatePlantillaInspeccionDTO,
  CreateInspeccionDTO,
  UpdateInspeccionDTO,
  CompletarInspeccionDTO,
  CreateTipoEPPDTO,
  UpdateTipoEPPDTO,
  CreateEntregaEPPDTO,
  UpdateEntregaEPPDTO,
  DevolverEPPDTO,
  CreateProgramaSeguridadDTO,
  UpdateProgramaSeguridadDTO,
  ActualizarAvanceProgramaDTO,
  EstadoPermisoTrabajo,
  EstadoInspeccion,
  EstadoEntregaEPP,
  EstadoProgramaSeguridad,
  CategoriaEPP,
} from '../types/seguridad-industrial.types';

// ==================== QUERY KEYS ====================

export const seguridadIndustrialKeys = {
  all: ['hseq', 'seguridad-industrial'] as const,
  tiposPermiso: () => [...seguridadIndustrialKeys.all, 'tipos-permiso'] as const,
  tipoPermiso: (id: number) => [...seguridadIndustrialKeys.tiposPermiso(), id] as const,
  permisos: () => [...seguridadIndustrialKeys.all, 'permisos'] as const,
  permiso: (id: number) => [...seguridadIndustrialKeys.permisos(), id] as const,
  permisosEstadisticas: () => [...seguridadIndustrialKeys.permisos(), 'estadisticas'] as const,
  tiposInspeccion: () => [...seguridadIndustrialKeys.all, 'tipos-inspeccion'] as const,
  tipoInspeccion: (id: number) => [...seguridadIndustrialKeys.tiposInspeccion(), id] as const,
  plantillas: () => [...seguridadIndustrialKeys.all, 'plantillas'] as const,
  plantilla: (id: number) => [...seguridadIndustrialKeys.plantillas(), id] as const,
  inspecciones: () => [...seguridadIndustrialKeys.all, 'inspecciones'] as const,
  inspeccion: (id: number) => [...seguridadIndustrialKeys.inspecciones(), id] as const,
  inspeccionesEstadisticas: () =>
    [...seguridadIndustrialKeys.inspecciones(), 'estadisticas'] as const,
  tiposEPP: () => [...seguridadIndustrialKeys.all, 'tipos-epp'] as const,
  tipoEPP: (id: number) => [...seguridadIndustrialKeys.tiposEPP(), id] as const,
  tiposEPPCategoria: () => [...seguridadIndustrialKeys.tiposEPP(), 'por-categoria'] as const,
  entregas: () => [...seguridadIndustrialKeys.all, 'entregas-epp'] as const,
  entrega: (id: number) => [...seguridadIndustrialKeys.entregas(), id] as const,
  entregasColaborador: (id: number) =>
    [...seguridadIndustrialKeys.entregas(), 'colaborador', id] as const,
  entregasPorVencer: () => [...seguridadIndustrialKeys.entregas(), 'por-vencer'] as const,
  programas: () => [...seguridadIndustrialKeys.all, 'programas'] as const,
  programa: (id: number) => [...seguridadIndustrialKeys.programas(), id] as const,
  programasEstadisticas: () => [...seguridadIndustrialKeys.programas(), 'estadisticas'] as const,
};

// ==================== TIPOS DE PERMISO ====================

export function useTiposPermisoTrabajo(params?: { activo?: boolean }) {
  return useQuery({
    queryKey: [...seguridadIndustrialKeys.tiposPermiso(), params],
    queryFn: () => tipoPermisoTrabajoApi.getAll(params),
  });
}

export function useTipoPermisoTrabajo(id: number) {
  return useQuery({
    queryKey: seguridadIndustrialKeys.tipoPermiso(id),
    queryFn: () => tipoPermisoTrabajoApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTipoPermisoTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTipoPermisoTrabajoDTO) => tipoPermisoTrabajoApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tiposPermiso() });
      toast.success('Tipo de permiso creado exitosamente');
    },
    onError: () => toast.error('Error al crear tipo de permiso'),
  });
}

export function useUpdateTipoPermisoTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateTipoPermisoTrabajoDTO }) =>
      tipoPermisoTrabajoApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tiposPermiso() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tipoPermiso(id) });
      toast.success('Tipo de permiso actualizado');
    },
    onError: () => toast.error('Error al actualizar tipo de permiso'),
  });
}

export function useDeleteTipoPermisoTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tipoPermisoTrabajoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tiposPermiso() });
      toast.success('Tipo de permiso eliminado');
    },
    onError: () => toast.error('Error al eliminar tipo de permiso'),
  });
}

// ==================== PERMISOS DE TRABAJO ====================

export function usePermisosTrabajo(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoPermisoTrabajo;
  tipo_permiso?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  solicitante?: number;
}) {
  return useQuery({
    queryKey: [...seguridadIndustrialKeys.permisos(), params],
    queryFn: () => permisoTrabajoApi.getAll(params),
  });
}

export function usePermisoTrabajo(id: number) {
  return useQuery({
    queryKey: seguridadIndustrialKeys.permiso(id),
    queryFn: () => permisoTrabajoApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePermisoTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePermisoTrabajoDTO) => permisoTrabajoApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.permisos() });
      toast.success('Permiso de trabajo creado exitosamente');
    },
    onError: () => toast.error('Error al crear permiso de trabajo'),
  });
}

export function useUpdatePermisoTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePermisoTrabajoDTO }) =>
      permisoTrabajoApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.permisos() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.permiso(id) });
      toast.success('Permiso actualizado');
    },
    onError: () => toast.error('Error al actualizar permiso'),
  });
}

export function useDeletePermisoTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => permisoTrabajoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.permisos() });
      toast.success('Permiso eliminado');
    },
    onError: () => toast.error('Error al eliminar permiso'),
  });
}

export function useAprobarPermiso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AprobarPermisoDTO }) =>
      permisoTrabajoApi.aprobar(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.permisos() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.permiso(id) });
      toast.success('Permiso aprobado');
    },
    onError: () => toast.error('Error al aprobar permiso'),
  });
}

export function useCerrarPermiso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CerrarPermisoDTO }) =>
      permisoTrabajoApi.cerrar(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.permisos() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.permiso(id) });
      toast.success('Permiso cerrado');
    },
    onError: () => toast.error('Error al cerrar permiso'),
  });
}

export function usePermisosEstadisticas() {
  return useQuery({
    queryKey: seguridadIndustrialKeys.permisosEstadisticas(),
    queryFn: () => permisoTrabajoApi.estadisticas(),
  });
}

// ==================== TIPOS DE INSPECCION ====================

export function useTiposInspeccion(params?: { activo?: boolean }) {
  return useQuery({
    queryKey: [...seguridadIndustrialKeys.tiposInspeccion(), params],
    queryFn: () => tipoInspeccionApi.getAll(params),
  });
}

export function useTipoInspeccion(id: number) {
  return useQuery({
    queryKey: seguridadIndustrialKeys.tipoInspeccion(id),
    queryFn: () => tipoInspeccionApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTipoInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTipoInspeccionDTO) => tipoInspeccionApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tiposInspeccion() });
      toast.success('Tipo de inspección creado');
    },
    onError: () => toast.error('Error al crear tipo de inspección'),
  });
}

export function useUpdateTipoInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateTipoInspeccionDTO }) =>
      tipoInspeccionApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tiposInspeccion() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tipoInspeccion(id) });
      toast.success('Tipo de inspección actualizado');
    },
    onError: () => toast.error('Error al actualizar tipo de inspección'),
  });
}

export function useDeleteTipoInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tipoInspeccionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tiposInspeccion() });
      toast.success('Tipo de inspección eliminado');
    },
    onError: () => toast.error('Error al eliminar tipo de inspección'),
  });
}

// ==================== PLANTILLAS ====================

export function usePlantillasInspeccion(params?: { tipo_inspeccion?: number; activo?: boolean }) {
  return useQuery({
    queryKey: [...seguridadIndustrialKeys.plantillas(), params],
    queryFn: () => plantillaInspeccionApi.getAll(params),
  });
}

export function usePlantillaInspeccion(id: number) {
  return useQuery({
    queryKey: seguridadIndustrialKeys.plantilla(id),
    queryFn: () => plantillaInspeccionApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePlantillaInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePlantillaInspeccionDTO) => plantillaInspeccionApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.plantillas() });
      toast.success('Plantilla creada');
    },
    onError: () => toast.error('Error al crear plantilla'),
  });
}

export function useUpdatePlantillaInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePlantillaInspeccionDTO }) =>
      plantillaInspeccionApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.plantillas() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.plantilla(id) });
      toast.success('Plantilla actualizada');
    },
    onError: () => toast.error('Error al actualizar plantilla'),
  });
}

export function useDeletePlantillaInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plantillaInspeccionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.plantillas() });
      toast.success('Plantilla eliminada');
    },
    onError: () => toast.error('Error al eliminar plantilla'),
  });
}

// ==================== INSPECCIONES ====================

export function useInspecciones(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoInspeccion;
  tipo_inspeccion?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  inspector?: number;
}) {
  return useQuery({
    queryKey: [...seguridadIndustrialKeys.inspecciones(), params],
    queryFn: () => inspeccionApi.getAll(params),
  });
}

export function useInspeccion(id: number) {
  return useQuery({
    queryKey: seguridadIndustrialKeys.inspeccion(id),
    queryFn: () => inspeccionApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInspeccionDTO) => inspeccionApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.inspecciones() });
      toast.success('Inspección programada');
    },
    onError: () => toast.error('Error al crear inspección'),
  });
}

export function useUpdateInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateInspeccionDTO }) =>
      inspeccionApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.inspecciones() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.inspeccion(id) });
      toast.success('Inspección actualizada');
    },
    onError: () => toast.error('Error al actualizar inspección'),
  });
}

export function useDeleteInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inspeccionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.inspecciones() });
      toast.success('Inspección eliminada');
    },
    onError: () => toast.error('Error al eliminar inspección'),
  });
}

export function useCompletarInspeccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CompletarInspeccionDTO }) =>
      inspeccionApi.completar(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.inspecciones() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.inspeccion(id) });
      toast.success('Inspección completada');
    },
    onError: () => toast.error('Error al completar inspección'),
  });
}

export function useGenerarHallazgo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inspeccionId, itemId }: { inspeccionId: number; itemId: number }) =>
      inspeccionApi.generarHallazgo(inspeccionId, itemId),
    onSuccess: (_, { inspeccionId }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.inspeccion(inspeccionId) });
      toast.success('Hallazgo generado');
    },
    onError: () => toast.error('Error al generar hallazgo'),
  });
}

export function useInspeccionesEstadisticas() {
  return useQuery({
    queryKey: seguridadIndustrialKeys.inspeccionesEstadisticas(),
    queryFn: () => inspeccionApi.estadisticas(),
  });
}

// ==================== TIPOS DE EPP ====================

export function useTiposEPP(params?: { activo?: boolean; categoria?: CategoriaEPP }) {
  return useQuery({
    queryKey: [...seguridadIndustrialKeys.tiposEPP(), params],
    queryFn: () => tipoEPPApi.getAll(params),
  });
}

export function useTiposEPPPorCategoria() {
  return useQuery({
    queryKey: seguridadIndustrialKeys.tiposEPPCategoria(),
    queryFn: () => tipoEPPApi.porCategoria(),
  });
}

export function useTipoEPP(id: number) {
  return useQuery({
    queryKey: seguridadIndustrialKeys.tipoEPP(id),
    queryFn: () => tipoEPPApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTipoEPP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTipoEPPDTO) => tipoEPPApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tiposEPP() });
      toast.success('Tipo de EPP creado');
    },
    onError: () => toast.error('Error al crear tipo de EPP'),
  });
}

export function useUpdateTipoEPP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateTipoEPPDTO }) => tipoEPPApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tiposEPP() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tipoEPP(id) });
      toast.success('Tipo de EPP actualizado');
    },
    onError: () => toast.error('Error al actualizar tipo de EPP'),
  });
}

export function useDeleteTipoEPP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tipoEPPApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.tiposEPP() });
      toast.success('Tipo de EPP eliminado');
    },
    onError: () => toast.error('Error al eliminar tipo de EPP'),
  });
}

// ==================== ENTREGAS EPP ====================

export function useEntregasEPP(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoEntregaEPP;
  colaborador?: number;
  tipo_epp?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}) {
  return useQuery({
    queryKey: [...seguridadIndustrialKeys.entregas(), params],
    queryFn: () => entregaEPPApi.getAll(params),
  });
}

export function useEntregaEPP(id: number) {
  return useQuery({
    queryKey: seguridadIndustrialKeys.entrega(id),
    queryFn: () => entregaEPPApi.getById(id),
    enabled: !!id,
  });
}

export function useEntregasEPPColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: seguridadIndustrialKeys.entregasColaborador(colaboradorId),
    queryFn: () => entregaEPPApi.porColaborador(colaboradorId),
    enabled: !!colaboradorId,
  });
}

export function useEPPPorVencer() {
  return useQuery({
    queryKey: seguridadIndustrialKeys.entregasPorVencer(),
    queryFn: () => entregaEPPApi.porVencer(),
  });
}

export function useCreateEntregaEPP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEntregaEPPDTO) => entregaEPPApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.entregas() });
      toast.success('Entrega de EPP registrada');
    },
    onError: () => toast.error('Error al registrar entrega de EPP'),
  });
}

export function useUpdateEntregaEPP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateEntregaEPPDTO }) =>
      entregaEPPApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.entregas() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.entrega(id) });
      toast.success('Entrega actualizada');
    },
    onError: () => toast.error('Error al actualizar entrega'),
  });
}

export function useDeleteEntregaEPP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => entregaEPPApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.entregas() });
      toast.success('Entrega eliminada');
    },
    onError: () => toast.error('Error al eliminar entrega'),
  });
}

export function useDevolverEPP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: DevolverEPPDTO }) =>
      entregaEPPApi.devolver(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.entregas() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.entrega(id) });
      toast.success('Devolución registrada');
    },
    onError: () => toast.error('Error al registrar devolución'),
  });
}

// ==================== PROGRAMAS DE SEGURIDAD ====================

export function useProgramasSeguridad(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  estado?: EstadoProgramaSeguridad;
  tipo_programa?: string;
  responsable?: number;
  vigente?: boolean;
}) {
  return useQuery({
    queryKey: [...seguridadIndustrialKeys.programas(), params],
    queryFn: () => programaSeguridadApi.getAll(params),
  });
}

export function useProgramaSeguridad(id: number) {
  return useQuery({
    queryKey: seguridadIndustrialKeys.programa(id),
    queryFn: () => programaSeguridadApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProgramaSeguridad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProgramaSeguridadDTO) => programaSeguridadApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.programas() });
      toast.success('Programa de seguridad creado');
    },
    onError: () => toast.error('Error al crear programa'),
  });
}

export function useUpdateProgramaSeguridad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateProgramaSeguridadDTO }) =>
      programaSeguridadApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.programas() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.programa(id) });
      toast.success('Programa actualizado');
    },
    onError: () => toast.error('Error al actualizar programa'),
  });
}

export function useDeleteProgramaSeguridad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => programaSeguridadApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.programas() });
      toast.success('Programa eliminado');
    },
    onError: () => toast.error('Error al eliminar programa'),
  });
}

export function useActualizarAvanceProgramaSeguridad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarAvanceProgramaDTO }) =>
      programaSeguridadApi.actualizarAvance(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.programas() });
      queryClient.invalidateQueries({ queryKey: seguridadIndustrialKeys.programa(id) });
      toast.success('Avance actualizado');
    },
    onError: () => toast.error('Error al actualizar avance'),
  });
}

export function useProgramasEstadisticas() {
  return useQuery({
    queryKey: seguridadIndustrialKeys.programasEstadisticas(),
    queryFn: () => programaSeguridadApi.estadisticas(),
  });
}
