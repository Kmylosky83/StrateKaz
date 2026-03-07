/**
 * React Query Hooks para Gestión de Proyectos PMI
 * Sistema de Gestión StrateKaz
 * Semana 5: Gestión de Proyectos
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import {
  proyectosApi,
  equipoProyectoApi,
  hitosProyectoApi,
  proyectosChoicesApi,
} from '../api/proyectosApi';
import type {
  CreateProyectoDTO,
  UpdateProyectoDTO,
  ProyectoFilters,
  CreateEquipoProyectoDTO,
  UpdateEquipoProyectoDTO,
  EquipoProyectoFilters,
  CreateHitoProyectoDTO,
  UpdateHitoProyectoDTO,
  HitoProyectoFilters,
} from '../types/proyectos';

// ==================== QUERY KEYS ====================

export const proyectosKeys = {
  // Proyectos
  proyectos: (filters?: ProyectoFilters) => ['proyectos', filters] as const,
  proyecto: (id: number) => ['proyecto', id] as const,
  proyectosDashboard: ['proyectos', 'dashboard'] as const,
  proyectosPorEstado: ['proyectos', 'por-estado'] as const,

  // Equipo
  equipos: (filters?: EquipoProyectoFilters) => ['equipo-proyecto', filters] as const,
  equipo: (id: number) => ['equipo-proyecto', id] as const,

  // Hitos
  hitos: (filters?: HitoProyectoFilters) => ['hitos-proyecto', filters] as const,
  hito: (id: number) => ['hito-proyecto', id] as const,

  // Choices
  choices: ['proyectos-choices'] as const,
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

// ==================== PROYECTOS HOOKS ====================

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
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectosDashboard });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectosPorEstado });
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyecto(id) });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectosDashboard });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectosPorEstado });
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
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectosDashboard });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectosPorEstado });
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyecto(id) });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectosPorEstado });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectosDashboard });
      toast.success('Estado del proyecto actualizado');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al cambiar el estado del proyecto'));
    },
  });
};

export const useActualizarSaludProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { health_status: string; health_notes?: string };
    }) => proyectosApi.actualizarSalud(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyecto(id) });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyectosDashboard });
      toast.success('Salud del proyecto actualizada');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar la salud del proyecto'));
    },
  });
};

// ==================== EQUIPO PROYECTO HOOKS ====================

export const useEquipoProyecto = (filters?: EquipoProyectoFilters) => {
  return useQuery({
    queryKey: proyectosKeys.equipos(filters),
    queryFn: () => equipoProyectoApi.getAll(filters),
  });
};

export const useEquipoProyectoById = (id: number) => {
  return useQuery({
    queryKey: proyectosKeys.equipo(id),
    queryFn: () => equipoProyectoApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateEquipoProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEquipoProyectoDTO) => equipoProyectoApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.equipos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyecto(variables.proyecto) });
      toast.success('Miembro del equipo agregado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al agregar miembro al equipo'));
    },
  });
};

export const useUpdateEquipoProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEquipoProyectoDTO }) =>
      equipoProyectoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.equipos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.equipo(id) });
      toast.success('Miembro del equipo actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar miembro del equipo'));
    },
  });
};

export const useDeleteEquipoProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => equipoProyectoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.equipos() });
      toast.success('Miembro del equipo eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar miembro del equipo'));
    },
  });
};

// ==================== HITOS PROYECTO HOOKS ====================

export const useHitosProyecto = (filters?: HitoProyectoFilters) => {
  return useQuery({
    queryKey: proyectosKeys.hitos(filters),
    queryFn: () => hitosProyectoApi.getAll(filters),
  });
};

export const useHitoProyecto = (id: number) => {
  return useQuery({
    queryKey: proyectosKeys.hito(id),
    queryFn: () => hitosProyectoApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateHitoProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHitoProyectoDTO) => hitosProyectoApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.hitos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.proyecto(variables.proyecto) });
      toast.success('Hito creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear el hito'));
    },
  });
};

export const useUpdateHitoProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHitoProyectoDTO }) =>
      hitosProyectoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.hitos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.hito(id) });
      toast.success('Hito actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el hito'));
    },
  });
};

export const useDeleteHitoProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => hitosProyectoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.hitos() });
      toast.success('Hito eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el hito'));
    },
  });
};

export const useCompletarHitoProyecto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, evidencia }: { id: number; evidencia?: string }) =>
      hitosProyectoApi.completar(id, { evidencia }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.hitos() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.hito(id) });
      toast.success('Hito completado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al completar el hito'));
    },
  });
};

// ==================== CHOICES HOOKS ====================

export const useProyectosChoices = () => {
  return useQuery({
    queryKey: proyectosKeys.choices,
    queryFn: proyectosChoicesApi.getChoices,
    staleTime: Infinity,
  });
};
