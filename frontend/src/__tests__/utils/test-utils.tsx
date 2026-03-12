/* eslint-disable react-refresh/only-export-components */
/**
 * Testing Utilities
 *
 * Helpers comunes para testing con React Testing Library
 * Incluye wrappers para QueryClient y Router
 */
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Suprimir warnings de React Router en tests
const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('React Router Future Flag Warning')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

/**
 * Crea un QueryClient de testing con configuración optimizada
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper que incluye todos los providers necesarios
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render que incluye todos los providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions) {
  const { queryClient, ...renderOptions } = options || {};
  const client = queryClient || createTestQueryClient();

  return {
    ...render(ui, {
      wrapper: ({ children }) => <AllProviders queryClient={client}>{children}</AllProviders>,
      ...renderOptions,
    }),
    queryClient: client,
  };
}

/**
 * Mock para toast notifications
 */
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  custom: vi.fn(),
  dismiss: vi.fn(),
};

/**
 * Limpia todos los mocks de toast
 */
export function clearToastMocks() {
  Object.values(mockToast).forEach((mock) => mock.mockClear());
}

/**
 * Espera a que las queries se resuelvan
 */
export async function waitForQueryClient(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
}

/**
 * Helpers para crear datos de prueba
 */
export const createMockEmpresa = (overrides = {}) => ({
  id: 1,
  nit: '900123456-7',
  razon_social: 'StrateKaz.',
  nombre_comercial: 'StrateKaz',
  tipo_sociedad: 'SAS',
  tipo_sociedad_display: 'Sociedad por Acciones Simplificada',
  regimen_tributario: 'COMUN',
  regimen_tributario_display: 'Régimen Común',
  representante_legal: 'Juan Pérez',
  cedula_representante: '1234567890',
  actividad_economica: '1011',
  descripcion_actividad: 'Procesamiento de carne',
  direccion_fiscal: 'Calle 123 #45-67',
  ciudad: 'Bogotá',
  departamento: 'CUNDINAMARCA',
  departamento_display: 'Cundinamarca',
  pais: 'Colombia',
  codigo_postal: '110111',
  telefono_principal: '3001234567',
  telefono_secundario: '3009876543',
  email_corporativo: 'contacto@empresa-demo.com',
  sitio_web: 'https://www.empresa-demo.com',
  matricula_mercantil: '123456',
  camara_comercio: 'Cámara de Comercio de Bogotá',
  fecha_constitucion: '2020-01-15',
  fecha_inscripcion_registro: '2020-01-20',
  zona_horaria: 'America/Bogota',
  zona_horaria_display: 'Bogotá (GMT-5)',
  formato_fecha: 'DD/MM/YYYY',
  formato_fecha_display: 'DD/MM/YYYY',
  moneda: 'COP',
  moneda_display: 'Peso Colombiano',
  simbolo_moneda: '$',
  separador_miles: '.',
  separador_decimales: ',',
  direccion_completa: 'Calle 123 #45-67, Bogotá, Cundinamarca',
  configured: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
  updated_by_name: 'Admin Usuario',
  ...overrides,
});

/**
 * Mock de CorporateIdentity - v4.0
 * Las políticas se gestionan desde Gestión Documental (tipo_documento=POL)
 */
export const createMockIdentity = (overrides = {}) => ({
  id: 1,
  mission: '<p>Nuestra misión es ser líderes en gestión estratégica</p>',
  vision: '<p>Ser la empresa más innovadora del sector</p>',
  is_active: true,
  version: '1.0',
  effective_date: '2024-01-01',
  values: [],
  values_count: 0,
  alcances_count: 0,
  politicas_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
  ...overrides,
});

export const createMockValue = (overrides = {}) => ({
  id: 1,
  name: 'Integridad',
  description: 'Actuamos con honestidad y transparencia',
  icon: 'Shield',
  order: 1,
  is_active: true,
  identity: 1,
  ...overrides,
});

export const createMockBranding = (overrides = {}) => ({
  logo: null,
  logoDark: null,
  colorPrimario: null,
  colorSecundario: null,
  gradienteMision: null,
  gradienteVision: null,
  gradientePolitica: null,
  gradienteValores: null,
  slogan: null,
  isLoading: false,
  isConfigured: false,
  ...overrides,
});

export const createMockArea = (overrides = {}) => ({
  id: 1,
  code: 'PROD',
  name: 'Producción',
  description: 'Área de producción',
  parent: null,
  cost_center: 'CC-001',
  manager: 1,
  manager_name: 'Carlos Manager',
  is_active: true,
  order: 1,
  level: 0,
  children_count: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockAreaList = (overrides = {}) => ({
  id: 1,
  code: 'PROD',
  name: 'Producción',
  parent: null,
  is_active: true,
  order: 1,
  level: 0,
  children_count: 2,
  ...overrides,
});

/**
 * Crea una respuesta paginada mock
 */
export const createMockPaginatedResponse = <T,>(results: T[], overrides = {}) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
  ...overrides,
});

/**
 * Helper para envolver acciones asíncronas en act()
 * Útil para evitar warnings de React sobre actualizaciones de estado
 */
export async function actWait(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/**
 * Re-exportar utilidades comunes de testing-library
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { renderWithProviders as render };
export { act };
