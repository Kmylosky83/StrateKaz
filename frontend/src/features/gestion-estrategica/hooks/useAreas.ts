/**
 * React Query Hooks para el módulo de Áreas/Departamentos
 * Sistema de Gestión StrateKaz
 *
 * Gestiona:
 * - CRUD completo de áreas
 * - Vista jerárquica (árbol)
 * - Toggle de estado activo/inactivo
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import {
  areasApi,
  type Area,
  type AreaList,
  type CreateAreaDTO,
  type UpdateAreaDTO,
  type AreaFilters,
  type PaginatedResponse,
} from '../api/organizacionApi';

// ==================== ERROR HANDLING ====================

interface ValidationErrors {
  [key: string]: string | string[];
}

/**
 * Extrae mensaje de error legible desde respuesta de API
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data;

    // Si es un objeto con errores de validación
    if (typeof data === 'object' && !Array.isArray(data)) {
      const errors = data as ValidationErrors;
      const messages: string[] = [];

      for (const [field, value] of Object.entries(errors)) {
        const fieldName = getFieldLabel(field);
        if (Array.isArray(value)) {
          messages.push(`${fieldName}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${fieldName}: ${value}`);
        }
      }

      if (messages.length > 0) {
        return messages.join('\n');
      }
    }

    // Si es un string directo
    if (typeof data === 'string') {
      return data;
    }

    // Si tiene campo detail (DRF)
    if (data.detail) {
      return data.detail;
    }

    // Si tiene campo message
    if (data.message) {
      return data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Error desconocido';
};

/**
 * Traduce nombres de campos a etiquetas legibles
 */
const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    code: 'Código',
    name: 'Nombre',
    description: 'Descripción',
    parent: 'Área padre',
    cost_center: 'Centro de costo',
    manager: 'Responsable',
    is_active: 'Estado',
    orden: 'Orden',
    non_field_errors: 'Error general',
  };
  return labels[field] || field;
};

// ==================== QUERY KEYS ====================

export const areaKeys = {
  all: ['areas'] as const,
  lists: () => [...areaKeys.all, 'list'] as const,
  list: (filters?: AreaFilters) => [...areaKeys.lists(), filters] as const,
  details: () => [...areaKeys.all, 'detail'] as const,
  detail: (id: number) => [...areaKeys.details(), id] as const,
  tree: () => [...areaKeys.all, 'tree'] as const,
  root: () => [...areaKeys.all, 'root'] as const,
  children: (parentId: number) => [...areaKeys.all, 'children', parentId] as const,
};

// ==================== QUERIES ====================

/**
 * Obtener lista paginada de áreas con filtros
 */
export const useAreas = (filters?: AreaFilters) => {
  return useQuery<PaginatedResponse<AreaList>>({
    queryKey: areaKeys.list(filters),
    queryFn: () => areasApi.getAll(filters),
  });
};

/**
 * Obtener detalle de un área por ID
 */
export const useArea = (id: number) => {
  return useQuery<Area>({
    queryKey: areaKeys.detail(id),
    queryFn: () => areasApi.getById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Obtener árbol completo de áreas (jerarquía)
 */
export const useAreasTree = () => {
  return useQuery<Area[]>({
    queryKey: areaKeys.tree(),
    queryFn: areasApi.getTree,
  });
};

/**
 * Obtener solo áreas raíz (sin padre)
 */
export const useAreasRoot = () => {
  return useQuery<Area[]>({
    queryKey: areaKeys.root(),
    queryFn: areasApi.getRoot,
  });
};

/**
 * Obtener hijos directos de un área
 */
export const useAreaChildren = (parentId: number) => {
  return useQuery<Area[]>({
    queryKey: areaKeys.children(parentId),
    queryFn: () => areasApi.getChildren(parentId),
    enabled: !!parentId && parentId > 0,
  });
};

// ==================== MUTATIONS ====================

/**
 * Crear nueva área
 */
export const useCreateArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAreaDTO) => areasApi.create(data),
    onSuccess: (newArea) => {
      // Invalidar todas las queries de áreas
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      toast.success(`Área "${newArea.name}" creada exitosamente`);
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message, { duration: 5000 });
    },
  });
};

/**
 * Actualizar área existente
 */
export const useUpdateArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAreaDTO }) =>
      areasApi.update(id, data),
    onSuccess: (updatedArea, { id }) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      queryClient.setQueryData(areaKeys.detail(id), updatedArea);
      toast.success(`Área "${updatedArea.name}" actualizada exitosamente`);
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message, { duration: 5000 });
    },
  });
};

/**
 * Eliminar área
 */
export const useDeleteArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => areasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      toast.success('Área eliminada exitosamente');
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message, { duration: 5000 });
    },
  });
};

/**
 * Toggle estado activo/inactivo del área
 */
export const useToggleArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive?: boolean }) =>
      areasApi.toggle(id, isActive),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      const estado = result.is_active ? 'activada' : 'desactivada';
      toast.success(`Área ${estado} exitosamente`);
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message, { duration: 5000 });
    },
  });
};

// ==================== EXPORT TYPES ====================

export type { Area, AreaList, CreateAreaDTO, UpdateAreaDTO, AreaFilters };
