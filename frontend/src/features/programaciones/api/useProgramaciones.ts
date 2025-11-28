import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programacionesAPI } from './programacionesApi';
import toast from 'react-hot-toast';
import type {
  ProgramacionFilters,
  CreateProgramacionDTO,
  UpdateProgramacionDTO,
  AsignarRecolectorDTO,
  CambiarEstadoDTO,
  ReprogramarDTO,
} from '../types/programacion.types';

// ==================== PROGRAMACIONES ====================

export const useProgramaciones = (filters?: ProgramacionFilters) => {
  return useQuery({
    queryKey: ['programaciones', filters],
    queryFn: () => programacionesAPI.getProgramaciones(filters),
  });
};

export const useProgramacion = (id: number) => {
  return useQuery({
    queryKey: ['programacion', id],
    queryFn: () => programacionesAPI.getProgramacion(id),
    enabled: !!id,
  });
};

export const useCreateProgramacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProgramacionDTO) => programacionesAPI.createProgramacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-programaciones'] });
      toast.success('Programación creada exitosamente');
    },
    onError: (error: any) => {
      const errorData = error.response?.data;

      if (errorData && typeof errorData === 'object') {
        // Manejo de errores específicos por campo
        if (errorData.proveedor) {
          toast.error(
            `Proveedor: ${
              Array.isArray(errorData.proveedor) ? errorData.proveedor[0] : errorData.proveedor
            }`
          );
          return;
        }
        if (errorData.fecha_programada) {
          toast.error(
            `Fecha: ${
              Array.isArray(errorData.fecha_programada)
                ? errorData.fecha_programada[0]
                : errorData.fecha_programada
            }`
          );
          return;
        }

        // Mensaje genérico si hay otros campos con error
        const firstError = Object.values(errorData)[0];
        if (firstError) {
          const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(`Error: ${errorMsg}`);
          return;
        }
      }

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al crear la programación';
      toast.error(message);
    },
  });
};

export const useUpdateProgramacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProgramacionDTO }) =>
      programacionesAPI.updateProgramacion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      queryClient.invalidateQueries({ queryKey: ['programacion', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-programaciones'] });
      toast.success('Programación actualizada exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al actualizar la programación';
      toast.error(message);
    },
  });
};

export const useDeleteProgramacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => programacionesAPI.deleteProgramacion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-programaciones'] });
      toast.success('Programación eliminada exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al eliminar la programación';
      toast.error(message);
    },
  });
};

// ==================== ACCIONES DE PROGRAMACIÓN ====================

export const useAsignarRecolector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AsignarRecolectorDTO }) =>
      programacionesAPI.asignarRecolector(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['programaciones'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['programacion', variables.id],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['estadisticas-programaciones'],
        refetchType: 'active',
      });

      await queryClient.refetchQueries({ queryKey: ['programaciones'] });

      toast.success('Recolector asignado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al asignar recolector';
      toast.error(message);
    },
  });
};

export const useCambiarEstado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CambiarEstadoDTO }) =>
      programacionesAPI.cambiarEstado(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['programaciones'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['programacion', variables.id],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['estadisticas-programaciones'],
        refetchType: 'active',
      });

      await queryClient.refetchQueries({ queryKey: ['programaciones'] });

      toast.success('Estado actualizado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al cambiar el estado';
      toast.error(message);
    },
  });
};

export const useReprogramar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReprogramarDTO }) =>
      programacionesAPI.reprogramar(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['programaciones'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['programacion', variables.id],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['estadisticas-programaciones'],
        refetchType: 'active',
      });

      await queryClient.refetchQueries({ queryKey: ['programaciones'] });

      toast.success('Recolección reprogramada exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al reprogramar';
      toast.error(message);
    },
  });
};

export const useCancelarProgramacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      programacionesAPI.cancelarProgramacion(id, motivo),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['estadisticas-programaciones'] });
      toast.success('Programación cancelada');
    },
    onError: (error: any) => {
      toast.error('Error al cancelar la programación');
    },
  });
};

export const useIniciarRuta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => programacionesAPI.iniciarRuta(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['estadisticas-programaciones'] });
      toast.success('Ruta iniciada');
    },
    onError: (error: any) => {
      toast.error('Error al iniciar la ruta');
    },
  });
};

export const useCompletarRecoleccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      cantidadKg,
      observaciones,
    }: {
      id: number;
      cantidadKg: number;
      observaciones?: string;
    }) => programacionesAPI.completarRecoleccion(id, cantidadKg, observaciones),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['estadisticas-programaciones'] });
      toast.success('Recolección completada exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al completar la recolección');
    },
  });
};

// ==================== ESTADÍSTICAS ====================

export const useEstadisticasProgramaciones = (fechaDesde?: string, fechaHasta?: string) => {
  return useQuery({
    queryKey: ['estadisticas-programaciones', fechaDesde, fechaHasta],
    queryFn: () => programacionesAPI.getEstadisticas(fechaDesde, fechaHasta),
    staleTime: 30000, // 30 segundos
  });
};

// ==================== HISTORIAL ====================

export const useHistorialProgramacion = (id: number) => {
  return useQuery({
    queryKey: ['historial-programacion', id],
    queryFn: () => programacionesAPI.getHistorial(id),
    enabled: !!id,
  });
};

// ==================== RECOLECTORES ====================

export const useRecolectores = () => {
  return useQuery({
    queryKey: ['recolectores'],
    queryFn: () => programacionesAPI.getRecolectores(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useRecolectoresDisponibles = (fecha: string) => {
  return useQuery({
    queryKey: ['recolectores-disponibles', fecha],
    queryFn: () => programacionesAPI.getRecolectoresDisponibles(fecha),
    enabled: !!fecha,
  });
};

// ==================== ECOALIADOS Y UNIDADES ====================

export const useEcoaliadosProgramacion = (unidadNegocio?: number) => {
  return useQuery({
    queryKey: ['ecoaliados-programacion', unidadNegocio],
    queryFn: () => programacionesAPI.getEcoaliados(unidadNegocio),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useUnidadesNegocioProgramacion = () => {
  return useQuery({
    queryKey: ['unidades-negocio-programacion'],
    queryFn: () => programacionesAPI.getUnidadesNegocio(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// ==================== CALENDARIO ====================

export const useProgramacionesCalendario = (
  fechaInicio: string,
  fechaFin: string,
  filtros?: {
    estado?: string;
    recolector_asignado?: number;
    prioridad?: string;
  }
) => {
  return useQuery({
    queryKey: ['programaciones-calendario', fechaInicio, fechaFin, filtros],
    queryFn: () => programacionesAPI.getProgramacionesCalendario(fechaInicio, fechaFin, filtros),
    enabled: !!fechaInicio && !!fechaFin,
  });
};
