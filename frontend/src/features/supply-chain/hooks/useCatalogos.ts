/**
 * Hooks React Query para Catálogos Dinámicos - Gestión de Proveedores
 * Sistema de gestión de catálogos configurables
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import catalogosApi from '../api/catalogos.api';
import type {
  CategoriaMateriaPrima,
  TipoMateriaPrima,
  TipoProveedor,
  ModalidadLogistica,
  FormaPago,
  TipoCuentaBancaria,
  TipoDocumentoIdentidad,
  Departamento,
  Ciudad,
  CreateCategoriaMateriaPrimaDTO,
  UpdateCategoriaMateriaPrimaDTO,
  CreateTipoMateriaPrimaDTO,
  UpdateTipoMateriaPrimaDTO,
  CreateTipoProveedorDTO,
  UpdateTipoProveedorDTO,
  CreateModalidadLogisticaDTO,
  UpdateModalidadLogisticaDTO,
  CreateFormaPagoDTO,
  UpdateFormaPagoDTO,
  CreateTipoCuentaBancariaDTO,
  UpdateTipoCuentaBancariaDTO,
  CreateTipoDocumentoIdentidadDTO,
  UpdateTipoDocumentoIdentidadDTO,
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO,
  CreateCiudadDTO,
  UpdateCiudadDTO,
} from '../types';

// ==================== QUERY KEYS ====================

export const catalogosKeys = {
  all: ['supply-chain', 'catalogos'] as const,

  // Categorías de Materia Prima
  categorias: () => [...catalogosKeys.all, 'categorias-materia-prima'] as const,
  categoriasActivas: () => [...catalogosKeys.categorias(), 'activas'] as const,

  // Tipos de Materia Prima
  tipos: () => [...catalogosKeys.all, 'tipos-materia-prima'] as const,
  tiposActivos: () => [...catalogosKeys.tipos(), 'activos'] as const,
  tiposPorCategoria: (categoriaId: number) => [...catalogosKeys.tipos(), 'categoria', categoriaId] as const,

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
  departamentosActivos: () => [...catalogosKeys.departamentos(), 'activos'] as const,

  // Ciudades
  ciudades: () => [...catalogosKeys.all, 'ciudades'] as const,
  ciudadesActivas: () => [...catalogosKeys.ciudades(), 'activas'] as const,
  ciudadesPorDepartamento: (deptoId: number) => [...catalogosKeys.ciudades(), 'departamento', deptoId] as const,
};

// ==================== CATEGORÍAS MATERIA PRIMA ====================

export function useCategoriasMateriaPrima(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? catalogosKeys.categoriasActivas() : catalogosKeys.categorias(),
    queryFn: () => (params?.is_active ? catalogosApi.categoriaMateriaPrima.getActivos() : catalogosApi.categoriaMateriaPrima.getAll()),
  });
}

export function useCreateCategoriaMateriaPrima() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoriaMateriaPrimaDTO) => catalogosApi.categoriaMateriaPrima.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogosKeys.categorias() });
      toast.success('Categoría creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear categoría');
    },
  });
}

export function useUpdateCategoriaMateriaPrima() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoriaMateriaPrimaDTO }) =>
      catalogosApi.categoriaMateriaPrima.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogosKeys.categorias() });
      toast.success('Categoría actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar categoría');
    },
  });
}

export function useDeleteCategoriaMateriaPrima() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => catalogosApi.categoriaMateriaPrima.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogosKeys.categorias() });
      toast.success('Categoría eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar categoría');
    },
  });
}

// ==================== TIPOS MATERIA PRIMA ====================

export function useTiposMateriaPrima(params?: { categoria?: number; is_active?: boolean }) {
  return useQuery({
    queryKey: params?.categoria
      ? catalogosKeys.tiposPorCategoria(params.categoria)
      : params?.is_active
        ? catalogosKeys.tiposActivos()
        : catalogosKeys.tipos(),
    queryFn: async () => {
      if (params?.categoria) {
        return catalogosApi.tipoMateriaPrima.porCategoria(params.categoria);
      }
      if (params?.is_active) {
        return catalogosApi.tipoMateriaPrima.getActivos();
      }
      return catalogosApi.tipoMateriaPrima.getAll();
    },
  });
}

export function useCreateTipoMateriaPrima() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTipoMateriaPrimaDTO) => catalogosApi.tipoMateriaPrima.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogosKeys.tipos() });
      toast.success('Tipo de materia prima creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear tipo de materia prima');
    },
  });
}

export function useUpdateTipoMateriaPrima() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoMateriaPrimaDTO }) =>
      catalogosApi.tipoMateriaPrima.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogosKeys.tipos() });
      toast.success('Tipo de materia prima actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar tipo de materia prima');
    },
  });
}

export function useDeleteTipoMateriaPrima() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => catalogosApi.tipoMateriaPrima.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogosKeys.tipos() });
      toast.success('Tipo de materia prima eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar tipo de materia prima');
    },
  });
}

// ==================== TIPOS PROVEEDOR ====================

export function useTiposProveedor(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? catalogosKeys.tiposProveedorActivos() : catalogosKeys.tiposProveedor(),
    queryFn: () => (params?.is_active ? catalogosApi.tipoProveedor.getActivos() : catalogosApi.tipoProveedor.getAll()),
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
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear tipo de proveedor');
    },
  });
}

// ==================== DEPARTAMENTOS Y CIUDADES ====================

export function useDepartamentos(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? catalogosKeys.departamentosActivos() : catalogosKeys.departamentos(),
    queryFn: () => (params?.is_active ? catalogosApi.departamento.getActivos() : catalogosApi.departamento.getAll()),
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
    queryFn: () => (params?.is_active ? catalogosApi.formaPago.getActivos() : catalogosApi.formaPago.getAll()),
  });
}

// ==================== TIPOS CUENTA BANCARIA ====================

export function useTiposCuentaBancaria(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? catalogosKeys.tiposCuentaActivas() : catalogosKeys.tiposCuenta(),
    queryFn: () => (params?.is_active ? catalogosApi.tipoCuentaBancaria.getActivos() : catalogosApi.tipoCuentaBancaria.getAll()),
  });
}

// ==================== TIPOS DOCUMENTO ====================

export function useTiposDocumento(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? catalogosKeys.tiposDocumentoActivos() : catalogosKeys.tiposDocumento(),
    queryFn: () => (params?.is_active ? catalogosApi.tipoDocumentoIdentidad.getActivos() : catalogosApi.tipoDocumentoIdentidad.getAll()),
  });
}

// ==================== MODALIDADES LOGÍSTICAS ====================

export function useModalidadesLogistica(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? catalogosKeys.modalidadesActivas() : catalogosKeys.modalidades(),
    queryFn: () => (params?.is_active ? catalogosApi.modalidadLogistica.getActivos() : catalogosApi.modalidadLogistica.getAll()),
  });
}
