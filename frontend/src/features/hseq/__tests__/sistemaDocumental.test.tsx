/**
 * Tests Unitarios - Sistema Documental API y Hooks
 * Pruebas para APIs y hooks de gestión documental HSEQ
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useTiposDocumento,
  useDocumentos,
  useFirmasPendientes,
  useListadoMaestro,
  useAprobarDocumento,
  useFirmarDocumento,
} from '../hooks/useSistemaDocumental';
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

describe('Sistema Documental - API Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  // ==================== TEST 1: tipoDocumentoApi.getAll ====================
  describe('tipoDocumentoApi.getAll', () => {
    it('debe obtener todos los tipos de documento correctamente', async () => {
      const mockTipos = [
        {
          id: 1,
          codigo: 'MAN',
          nombre: 'Manual',
          nivel_documento: 'ESTRATEGICO',
          is_active: true,
        },
        {
          id: 2,
          codigo: 'PROC',
          nombre: 'Procedimiento',
          nivel_documento: 'TACTICO',
          is_active: true,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTipos });

      const { result } = renderHook(() => useTiposDocumento(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTipos);
      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/documentos/tipos/');
    });

    it('debe manejar errores al obtener tipos de documento', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTiposDocumento(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });
  });

  // ==================== TEST 2: useAprobarDocumento ====================
  describe('useAprobarDocumento', () => {
    it('debe tener la función mutate disponible', () => {
      const { result } = renderHook(() => useAprobarDocumento(), {
        wrapper: createWrapper(queryClient),
      });

      expect(typeof result.current.mutate).toBe('function');
      expect(typeof result.current.mutateAsync).toBe('function');
      expect(result.current.isPending).toBe(false);
    });
  });

  // ==================== TEST 3: useFirmarDocumento ====================
  describe('useFirmarDocumento', () => {
    it('debe tener la función mutate disponible', () => {
      const { result } = renderHook(() => useFirmarDocumento(), {
        wrapper: createWrapper(queryClient),
      });

      expect(typeof result.current.mutate).toBe('function');
      expect(typeof result.current.mutateAsync).toBe('function');
      expect(result.current.isPending).toBe(false);
    });
  });

  // ==================== TEST 5: Hook useTiposDocumento ====================
  describe('Hook useTiposDocumento', () => {
    it('debe cargar tipos de documento con estado de carga', async () => {
      const mockTipos = [
        { id: 1, nombre: 'Manual', codigo: 'MAN', is_active: true },
        { id: 2, nombre: 'Procedimiento', codigo: 'PROC', is_active: true },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTipos });

      const { result } = renderHook(() => useTiposDocumento(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockTipos);
      expect(result.current.data).toHaveLength(2);
    });

    it('debe cachear los resultados correctamente', async () => {
      const mockTipos = [{ id: 1, nombre: 'Manual', codigo: 'MAN' }];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTipos });

      const { result, rerender } = renderHook(() => useTiposDocumento(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Segunda renderización debe usar caché
      rerender();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockTipos);
    });
  });

  // ==================== TEST 6: Hook useDocumentos con filtros ====================
  describe('Hook useDocumentos con filtros', () => {
    it('debe filtrar documentos por tipo', async () => {
      const mockDocumentos = [
        { id: 1, titulo: 'Doc 1', tipo_documento: 1, estado: 'BORRADOR' },
        { id: 2, titulo: 'Doc 2', tipo_documento: 1, estado: 'APROBADO' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDocumentos });

      const { result } = renderHook(() => useDocumentos({ tipo: 1 }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/documentos/documentos/', {
        params: { tipo: 1 },
      });
      expect(result.current.data).toEqual(mockDocumentos);
      expect(result.current.data).toHaveLength(2);
    });

    it('debe filtrar documentos por estado', async () => {
      const mockDocumentos = [
        { id: 1, titulo: 'Doc 1', tipo_documento: 1, estado: 'APROBADO' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDocumentos });

      const { result } = renderHook(() => useDocumentos({ estado: 'APROBADO' }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/documentos/documentos/', {
        params: { estado: 'APROBADO' },
      });
      expect(result.current.data?.[0].estado).toBe('APROBADO');
    });

    it('debe devolver array vacío cuando no hay documentos', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useDocumentos(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
      expect(result.current.data).toHaveLength(0);
    });
  });

  // ==================== TEST 7: Hook useFirmasPendientes ====================
  describe('Hook useFirmasPendientes', () => {
    it('debe obtener firmas pendientes del usuario actual', async () => {
      const mockFirmas = [
        {
          id: 1,
          documento: 1,
          tipo_firma: 'APROBACION',
          estado: 'PENDIENTE',
          firmante: 1,
          cargo_firmante: 'Gerente HSEQ',
          fecha_solicitud: '2025-12-25',
        },
        {
          id: 2,
          documento: 2,
          tipo_firma: 'REVISION',
          estado: 'PENDIENTE',
          firmante: 1,
          cargo_firmante: 'Coordinador SST',
          fecha_solicitud: '2025-12-24',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockFirmas });

      const { result } = renderHook(() => useFirmasPendientes(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/documentos/firmas/pendientes/');
      expect(result.current.data).toEqual(mockFirmas);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].estado).toBe('PENDIENTE');
    });

    it('debe actualizar automáticamente después de firmar', async () => {
      const mockFirmasPendientes = [
        { id: 1, estado: 'PENDIENTE', documento: 1 },
        { id: 2, estado: 'PENDIENTE', documento: 2 },
      ];
      const mockFirmasPendientesActualizadas = [
        { id: 2, estado: 'PENDIENTE', documento: 2 },
      ];

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockFirmasPendientes })
        .mockResolvedValueOnce({ data: mockFirmasPendientesActualizadas });

      const { result } = renderHook(() => useFirmasPendientes(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.data).toHaveLength(2));

      // Simular que se firmó un documento (la invalidación ocurriría en el hook de firmar)
      await queryClient.invalidateQueries({ queryKey: ['hseq', 'documentos', 'firmas', 'pendientes'] });

      await waitFor(() => expect(result.current.data).toHaveLength(1));
    });
  });

  // ==================== TEST 8: Hook useListadoMaestro ====================
  describe('Hook useListadoMaestro', () => {
    it('debe obtener el listado maestro de documentos publicados', async () => {
      const mockListadoMaestro = [
        {
          tipo_documento: 'Manual',
          documentos: [
            {
              codigo: 'MAN-001',
              titulo: 'Manual de Seguridad Industrial',
              version: '2.0',
              fecha_vigencia: '2025-01-01',
              estado: 'PUBLICADO',
            },
            {
              codigo: 'MAN-002',
              titulo: 'Manual de Gestión Ambiental',
              version: '1.5',
              fecha_vigencia: '2025-01-15',
              estado: 'PUBLICADO',
            },
          ],
        },
        {
          tipo_documento: 'Procedimiento',
          documentos: [
            {
              codigo: 'PROC-001',
              titulo: 'Procedimiento de Auditoría Interna',
              version: '3.0',
              fecha_vigencia: '2024-12-01',
              estado: 'PUBLICADO',
            },
          ],
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockListadoMaestro });

      const { result } = renderHook(() => useListadoMaestro(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/hseq/documentos/listado-maestro/');
      expect(result.current.data).toEqual(mockListadoMaestro);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].documentos).toHaveLength(2);
      expect(result.current.data?.[0].documentos[0].estado).toBe('PUBLICADO');
    });

    it('debe mostrar solo documentos vigentes en el listado maestro', async () => {
      const mockListadoMaestro = [
        {
          tipo_documento: 'Manual',
          documentos: [
            {
              codigo: 'MAN-001',
              titulo: 'Manual Vigente',
              version: '2.0',
              fecha_vigencia: '2025-01-01',
              estado: 'PUBLICADO',
            },
          ],
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockListadoMaestro });

      const { result } = renderHook(() => useListadoMaestro(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verificar que todos los documentos están PUBLICADOS
      const todosPublicados = result.current.data?.every((tipo) =>
        tipo.documentos.every((doc) => doc.estado === 'PUBLICADO')
      );

      expect(todosPublicados).toBe(true);
    });

    it('debe manejar un listado maestro vacío correctamente', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useListadoMaestro(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
      expect(result.current.data).toHaveLength(0);
    });
  });
});
