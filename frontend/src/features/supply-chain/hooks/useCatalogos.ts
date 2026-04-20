/**
 * Hooks React Query para Catálogos Dinámicos - Gestión de Proveedores
 * Sistema de gestión de catálogos configurables
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import catalogosApi from '../api/catalogos.api';
import { getApiErrorMessage } from '@/utils/errorUtils';
import type { CreateTipoProveedorDTO } from '../types';

// ==================== QUERY KEYS ====================

export const catalogosKeys = {
  all: ['supply-chain', 'catalogos'] as const,

  // Tipos de Proveedor
  tiposProveedor: () => [...catalogosKeys.all, 'tipos-proveedor'] as const,
  tiposProveedorActivos: () => [...catalogosKeys.tiposProveedor(), 'activos'] as const,

  // Modalidades Logísticas
  modalidades: () => [...catalogosKeys.all, 'modalidades-logistica'] as const,
  modalidadesActivas: () => [...catalogosKeys.modalidades(), 'activas'] as const,

  // Formas de Pago
  formasPago: () => [...catalogosKeys.all, 'formas-pago'] as const,
  formasPagoActivas: () => [...catalogosKeys.formasPago(), 'activas'] as const,

  // Tipos de Cuenta Bancaria
  tiposCuenta: () => [...catalogosKeys.all, 'tipos-cuenta-bancaria'] as const,
  tiposCuentaActivas: () => [...catalogosKeys.tiposCuenta(), 'activas'] as const,

  // Tipos de Documento
  tiposDocumento: () => [...catalogosKeys.all, 'tipos-documento'] as const,
  tiposDocumentoActivos: () => [...catalogosKeys.tiposDocumento(), 'activos'] as const,

  // Departamentos
  departamentos: () => [...catalogosKeys.all, 'departamentos'] as const,
  departamentosActivos: () => [...catalogosKeys.departamentos(), 'activas'] as const,

  // Ciudades
  ciudades: () => [...catalogosKeys.all, 'ciudades'] as const,
  ciudadesActivas: () => [...catalogosKeys.ciudades(), 'activas'] as const,
  ciudadesPorDepartamento: (deptoId: number) =>
    [...catalogosKeys.ciudades(), 'departamento', deptoId] as const,
};

// ==================== PRODUCTOS (MATERIA PRIMA) ====================
// Fuente unica: catalogo_productos.Producto con tipo='MATERIA_PRIMA'.

export function useTiposMateriaPrima(_params?: { categoria?: number; is_active?: boolean }) {
  return useQuery({
    queryKey: ['catalogo-productos', 'productos', 'materia-prima'],
    queryFn: async () => {
      const { productoApi } =
        await import('@/features/catalogo-productos/api/catalogoProductos.api');
      const response = await productoApi.getAll({ page_size: 1000 });
      // Filter tipo=MATERIA_PRIMA client-side (backend aun no tiene filter server-side)
      const all = Array.isArray(response) ? response : (response?.results ?? []);
      return all.filter((p) => p.tipo === 'MATERIA_PRIMA');
    },
  });
}

// ==================== TIPOS PROVEEDOR ====================

export function useTiposProveedor(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active
      ? catalogosKeys.tiposProveedorActivos()
      : catalogosKeys.tiposProveedor(),
    queryFn: () =>
      params?.is_active
        ? catalogosApi.tipoProveedor.getActivos()
        : catalogosApi.tipoProveedor.getAll(),
  });
}

export function useCreateTipoProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTipoProveedorDTO) => catalogosApi.tipoProveedor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogosKeys.tiposProveedor() });
      toast.success('Tipo de proveedor creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear tipo de proveedor'));
    },
  });
}

// ==================== DEPARTAMENTOS Y CIUDADES ====================

export function useDepartamentos(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active
      ? catalogosKeys.departamentosActivos()
      : catalogosKeys.departamentos(),
    queryFn: () =>
      params?.is_active
        ? catalogosApi.departamento.getActivos()
        : catalogosApi.departamento.getAll(),
  });
}

export function useCiudades(params?: { departamento?: number; is_active?: boolean }) {
  return useQuery({
    queryKey: params?.departamento
      ? catalogosKeys.ciudadesPorDepartamento(params.departamento)
      : params?.is_active
        ? catalogosKeys.ciudadesActivas()
        : catalogosKeys.ciudades(),
    queryFn: async () => {
      if (params?.departamento) {
        return catalogosApi.ciudad.porDepartamento(params.departamento);
      }
      if (params?.is_active) {
        return catalogosApi.ciudad.getActivos();
      }
      return catalogosApi.ciudad.getAll();
    },
  });
}

// ==================== FORMAS DE PAGO ====================

export function useFormasPago(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? catalogosKeys.formasPagoActivas() : catalogosKeys.formasPago(),
    queryFn: () =>
      params?.is_active ? catalogosApi.formaPago.getActivos() : catalogosApi.formaPago.getAll(),
  });
}

// ==================== TIPOS CUENTA BANCARIA ====================

export function useTiposCuentaBancaria(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? catalogosKeys.tiposCuentaActivas() : catalogosKeys.tiposCuenta(),
    queryFn: () =>
      params?.is_active
        ? catalogosApi.tipoCuentaBancaria.getActivos()
        : catalogosApi.tipoCuentaBancaria.getAll(),
  });
}

// ==================== TIPOS DOCUMENTO ====================

export function useTiposDocumento(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active
      ? catalogosKeys.tiposDocumentoActivos()
      : catalogosKeys.tiposDocumento(),
    queryFn: () =>
      params?.is_active
        ? catalogosApi.tipoDocumentoIdentidad.getActivos()
        : catalogosApi.tipoDocumentoIdentidad.getAll(),
  });
}

// ==================== MODALIDADES LOGÍSTICAS ====================

export function useModalidadesLogistica(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? catalogosKeys.modalidadesActivas() : catalogosKeys.modalidades(),
    queryFn: () =>
      params?.is_active
        ? catalogosApi.modalidadLogistica.getActivos()
        : catalogosApi.modalidadLogistica.getAll(),
  });
}
