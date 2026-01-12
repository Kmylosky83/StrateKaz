/**
 * Tests Unitarios - Planificación del Sistema API y Hooks
 * Pruebas para APIs y hooks de planificación HSEQ
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  usePlanesTrabajo,
  useActividadesPlan,
  useObjetivosSistema,
  useDashboardPlanificacion,
  useAprobarPlan,
  useActualizarAvanceActividad,
  useActualizarCumplimiento,
} from '../hooks/usePlanificacion';
import { apiClient } from '@/lib/api-client';

// Mock del apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock de toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper para crear QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Wrapper para React Query
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Planificación del Sistema - API Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  // ==================== TEST 1: planTrabajoApi.getAll ====================
  describe('planTrabajoApi.getAll', () => {
    it('debe obtener todos los planes de trabajo correctamente', async () => {
      const mockPlanes = [
        {
          id: 1,
          codigo: 'PT-2025',
          nombre: 'Plan de Trabajo Anual 2025',
          año: 2025,
          estado: 'EN_EJECUCION',
          porcentaje_avance: 45,
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-12-31',
        },
        {
          id: 2,
          codigo: 'PT-2024',
          nombre: 'Plan de Trabajo Anual 2024',
          año: 2024,
          estado: 'COMPLETADO',
          porcentaje_avance: 100,
          fecha_inicio: '2024-01-01',
          fecha_fin: '2024-12-31',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPlanes });

      const { result } = renderHook(() => usePlanesTrabajo(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPlanes);
      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/planificacion/planes/', {
        params: undefined,
      });
      expect(result.current.data).toHaveLength(2);
    });

    it('debe filtrar planes por año', async () => {
      const mockPlanes = [
        {
          id: 1,
          codigo: 'PT-2025',
          nombre: 'Plan de Trabajo Anual 2025',
          año: 2025,
          estado: 'EN_EJECUCION',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPlanes });

      const { result } = renderHook(() => usePlanesTrabajo({ año: 2025 }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/planificacion/planes/', {
        params: { año: 2025 },
      });
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].año).toBe(2025);
    });
  });

  // ==================== TEST 2: planTrabajoApi.aprobar ====================
  describe('planTrabajoApi.aprobar', () => {
    it('debe aprobar un plan de trabajo correctamente', async () => {
      const mockPlanAprobado = {
        id: 1,
        codigo: 'PT-2025',
        nombre: 'Plan de Trabajo Anual 2025',
        estado: 'APROBADO',
        fecha_aprobacion: '2025-12-26',
        aprobado_por: 1,
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockPlanAprobado });

      const { result } = renderHook(() => useAprobarPlan(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/hseq/planificacion/planes/1/aprobar/');
      expect(result.current.data).toEqual(mockPlanAprobado);
      expect(result.current.data?.estado).toBe('APROBADO');
    });

    it('debe manejar errores al aprobar plan', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error('Plan no cumple requisitos para aprobación')
      );

      const { result } = renderHook(() => useAprobarPlan(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });
  });

  // ==================== TEST 3: actividadPlanApi.actualizarAvance ====================
  describe('actividadPlanApi.actualizarAvance', () => {
    it('debe actualizar el avance de una actividad correctamente', async () => {
      const mockActividadActualizada = {
        id: 1,
        codigo_actividad: 'ACT-001',
        nombre: 'Capacitación SST',
        porcentaje_avance: 75,
        estado: 'EN_PROCESO',
        fecha_inicio_real: '2025-12-01',
      };

      const avanceData = {
        porcentaje_avance: 75,
        fecha_inicio_real: '2025-12-01',
        observaciones: 'Avance satisfactorio',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockActividadActualizada });

      const { result } = renderHook(() => useActualizarAvanceActividad(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ id: 1, datos: avanceData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/hseq/planificacion/actividades/1/actualizar_avance/',
        avanceData
      );
      expect(result.current.data?.porcentaje_avance).toBe(75);
    });

    it('debe validar que el porcentaje de avance esté entre 0 y 100', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error('Porcentaje de avance debe estar entre 0 y 100')
      );

      const { result } = renderHook(() => useActualizarAvanceActividad(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        id: 1,
        datos: { porcentaje_avance: 150 },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==================== TEST 4: objetivoSistemaApi.actualizarCumplimiento ====================
  describe('objetivoSistemaApi.actualizarCumplimiento', () => {
    it('debe actualizar el cumplimiento de un objetivo correctamente', async () => {
      const mockObjetivoActualizado = {
        id: 1,
        codigo_objetivo: 'OBJ-SST-001',
        descripcion: 'Reducir accidentalidad en 20%',
        valor_actual: 8,
        porcentaje_cumplimiento: 80,
        meta_numerica: 10,
      };

      const cumplimientoData = {
        valor_actual: 8,
        observaciones: 'Buen avance en el objetivo',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockObjetivoActualizado });

      const { result } = renderHook(() => useActualizarCumplimiento(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ id: 1, datos: cumplimientoData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/hseq/planificacion/objetivos/1/actualizar_cumplimiento/',
        cumplimientoData
      );
      expect(result.current.data?.valor_actual).toBe(8);
      expect(result.current.data?.porcentaje_cumplimiento).toBe(80);
    });
  });

  // ==================== TEST 5: Hook usePlanesTrabajo ====================
  describe('Hook usePlanesTrabajo', () => {
    it('debe cargar planes de trabajo con estado de carga', async () => {
      const mockPlanes = [
        { id: 1, codigo: 'PT-2025', nombre: 'Plan 2025', año: 2025 },
        { id: 2, codigo: 'PT-2024', nombre: 'Plan 2024', año: 2024 },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPlanes });

      const { result } = renderHook(() => usePlanesTrabajo(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockPlanes);
      expect(result.current.data).toHaveLength(2);
    });

    it('debe filtrar planes por estado', async () => {
      const mockPlanes = [
        { id: 1, codigo: 'PT-2025', estado: 'EN_EJECUCION' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPlanes });

      const { result } = renderHook(() => usePlanesTrabajo({ estado: 'EN_EJECUCION' }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/planificacion/planes/', {
        params: { estado: 'EN_EJECUCION' },
      });
      expect(result.current.data?.[0].estado).toBe('EN_EJECUCION');
    });
  });

  // ==================== TEST 6: Hook useActividadesPlan ====================
  describe('Hook useActividadesPlan', () => {
    it('debe obtener actividades de un plan específico', async () => {
      const mockActividades = [
        {
          id: 1,
          plan_trabajo: 1,
          codigo_actividad: 'ACT-001',
          nombre: 'Capacitación en alturas',
          tipo_actividad: 'CAPACITACION',
          estado: 'EN_PROCESO',
          porcentaje_avance: 60,
        },
        {
          id: 2,
          plan_trabajo: 1,
          codigo_actividad: 'ACT-002',
          nombre: 'Inspección de EPP',
          tipo_actividad: 'INSPECCION',
          estado: 'COMPLETADA',
          porcentaje_avance: 100,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockActividades });

      const { result } = renderHook(() => useActividadesPlan(1), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/planificacion/planes/1/actividades/', {
        params: undefined,
      });
      expect(result.current.data).toEqual(mockActividades);
      expect(result.current.data).toHaveLength(2);
    });

    it('debe filtrar actividades por tipo', async () => {
      const mockActividades = [
        {
          id: 1,
          codigo_actividad: 'ACT-001',
          tipo_actividad: 'CAPACITACION',
          nombre: 'Capacitación SST',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockActividades });

      const { result } = renderHook(() => useActividadesPlan(1, { tipo: 'CAPACITACION' }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/planificacion/planes/1/actividades/', {
        params: { tipo: 'CAPACITACION' },
      });
      expect(result.current.data?.[0].tipo_actividad).toBe('CAPACITACION');
    });

    it('debe estar deshabilitado si no hay planId', () => {
      const { result } = renderHook(() => useActividadesPlan(0), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  // ==================== TEST 7: Hook useObjetivosSistema ====================
  describe('Hook useObjetivosSistema', () => {
    it('debe obtener objetivos del sistema para un plan', async () => {
      const mockObjetivos = [
        {
          id: 1,
          plan_trabajo: 1,
          codigo_objetivo: 'OBJ-SST-001',
          descripcion: 'Reducir accidentalidad en 20%',
          categoria: 'SST',
          tipo_objetivo: 'ESTRATEGICO',
          porcentaje_cumplimiento: 75,
          estado: 'ACTIVO',
        },
        {
          id: 2,
          plan_trabajo: 1,
          codigo_objetivo: 'OBJ-AMB-001',
          descripcion: 'Reducir consumo de agua en 15%',
          categoria: 'AMBIENTAL',
          tipo_objetivo: 'TACTICO',
          porcentaje_cumplimiento: 60,
          estado: 'ACTIVO',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockObjetivos });

      const { result } = renderHook(() => useObjetivosSistema(1), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/planificacion/planes/1/objetivos/', {
        params: undefined,
      });
      expect(result.current.data).toEqual(mockObjetivos);
      expect(result.current.data).toHaveLength(2);
    });

    it('debe filtrar objetivos por categoría', async () => {
      const mockObjetivos = [
        {
          id: 1,
          codigo_objetivo: 'OBJ-SST-001',
          categoria: 'SST',
          descripcion: 'Objetivo SST',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockObjetivos });

      const { result } = renderHook(() => useObjetivosSistema(1, { categoria: 'SST' }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/planificacion/planes/1/objetivos/', {
        params: { categoria: 'SST' },
      });
      expect(result.current.data?.[0].categoria).toBe('SST');
    });
  });

  // ==================== TEST 8: Hook useDashboardPlanificacion ====================
  describe('Hook useDashboardPlanificacion', () => {
    it('debe obtener datos completos del dashboard de planificación', async () => {
      const mockDashboard = {
        plan: {
          id: 1,
          codigo: 'PT-2025',
          nombre: 'Plan de Trabajo Anual 2025',
          porcentaje_avance: 68,
        },
        resumen: {
          total_actividades: 50,
          actividades_completadas: 34,
          actividades_en_proceso: 10,
          actividades_pendientes: 4,
          actividades_vencidas: 2,
          porcentaje_avance_global: 68,
          porcentaje_cumplimiento_cronograma: 85,
        },
        objetivos: {
          total: 12,
          completados: 5,
          en_proceso: 7,
          cumplimiento_promedio: 72.5,
        },
        programas: {
          total: 8,
          en_ejecucion: 6,
          completados: 2,
          avance_promedio: 65,
        },
        presupuesto: {
          asignado: 100000000,
          ejecutado: 68000000,
          porcentaje_ejecucion: 68,
        },
        actividades_proximas: [
          {
            id: 1,
            nombre: 'Auditoría interna',
            fecha_fin_programada: '2025-12-30',
          },
        ],
        actividades_vencidas: [
          {
            id: 2,
            nombre: 'Capacitación vencida',
            fecha_fin_programada: '2025-12-20',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDashboard });

      const { result } = renderHook(() => useDashboardPlanificacion(1), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/planificacion/planes/1/dashboard/');
      expect(result.current.data).toEqual(mockDashboard);
      expect(result.current.data?.resumen.total_actividades).toBe(50);
      expect(result.current.data?.resumen.porcentaje_avance_global).toBe(68);
      expect(result.current.data?.objetivos.cumplimiento_promedio).toBe(72.5);
      expect(result.current.data?.presupuesto.porcentaje_ejecucion).toBe(68);
    });

    it('debe incluir actividades próximas y vencidas', async () => {
      const mockDashboard = {
        plan: { id: 1 },
        resumen: { total_actividades: 10 },
        objetivos: { total: 5 },
        programas: { total: 3 },
        presupuesto: { asignado: 1000000, ejecutado: 500000, porcentaje_ejecucion: 50 },
        actividades_proximas: [
          { id: 1, nombre: 'Act próxima 1' },
          { id: 2, nombre: 'Act próxima 2' },
        ],
        actividades_vencidas: [{ id: 3, nombre: 'Act vencida 1' }],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDashboard });

      const { result } = renderHook(() => useDashboardPlanificacion(1), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.actividades_proximas).toHaveLength(2);
      expect(result.current.data?.actividades_vencidas).toHaveLength(1);
    });

    it('debe estar deshabilitado si no hay planId', () => {
      const { result } = renderHook(() => useDashboardPlanificacion(0), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('debe calcular correctamente porcentajes del dashboard', async () => {
      const mockDashboard = {
        plan: { id: 1 },
        resumen: {
          total_actividades: 100,
          actividades_completadas: 85,
          porcentaje_avance_global: 85,
          porcentaje_cumplimiento_cronograma: 90,
        },
        objetivos: {
          total: 20,
          completados: 16,
          cumplimiento_promedio: 80,
        },
        programas: {
          total: 10,
          en_ejecucion: 3,
          completados: 7,
          avance_promedio: 85,
        },
        presupuesto: {
          asignado: 200000000,
          ejecutado: 170000000,
          porcentaje_ejecucion: 85,
        },
        actividades_proximas: [],
        actividades_vencidas: [],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDashboard });

      const { result } = renderHook(() => useDashboardPlanificacion(1), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const data = result.current.data!;

      // Verificar que los porcentajes sean consistentes
      expect(data.resumen.porcentaje_avance_global).toBeGreaterThanOrEqual(80);
      expect(data.objetivos.cumplimiento_promedio).toBeGreaterThanOrEqual(80);
      expect(data.programas.avance_promedio).toBeGreaterThanOrEqual(80);
      expect(data.presupuesto.porcentaje_ejecucion).toBeGreaterThanOrEqual(80);
    });
  });
});
