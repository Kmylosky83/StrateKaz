import { vi } from 'vitest';

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<{ data: T }>((resolve) => {
    setTimeout(() => {
      resolve({ data });
    }, delay);
  });
};

// Mock error response
export const mockApiError = (message: string, status = 400, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject({
        response: {
          status,
          data: { message },
        },
      });
    }, delay);
  });
};

// Mock user data
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  nombre: 'Test User',
  apellido: 'Test Apellido',
  rol: 'ADMIN',
  cargo: 'GERENTE',
  is_active: true,
  tenant: 1,
  created_at: '2024-01-01T00:00:00Z',
};

// Mock proveedor data
export const mockProveedor = {
  id: 1,
  codigo_interno: 'MP-001',
  nombre_empresa: 'Test Provider',
  nit: '123456789',
  tipo_proveedor: 'MATERIA_PRIMA',
  materias_primas: [
    {
      id: 1,
      tipo_materia: 'SEBOS',
      subtipo: 'SEBO_PRIMERA',
      precio_actual: 1500,
      unidad: 'kg',
    },
  ],
  contacto_principal: {
    nombre: 'John Doe',
    cargo: 'Sales Manager',
    telefono: '1234567890',
    email: 'john@example.com',
  },
  estado: 'ACTIVO',
  fecha_registro: '2024-01-01',
  tenant: 1,
};

// Mock router navigation
export const mockNavigate = vi.fn();

// Mock localStorage
export const createMockLocalStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

// Mock toast notifications
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  custom: vi.fn(),
};

// Mock axios instance
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  request: vi.fn(),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  },
};

// Mock file upload
export const createMockFile = (name = 'test.pdf', _size = 1024, type = 'application/pdf') => {
  const blob = new Blob(['test content'], { type });
  return new File([blob], name, { type });
};

// Mock FormData
export const createMockFormData = () => {
  const formData = new FormData();
  formData.append = vi.fn();
  formData.delete = vi.fn();
  formData.get = vi.fn();
  formData.getAll = vi.fn();
  formData.has = vi.fn();
  formData.set = vi.fn();
  return formData;
};
