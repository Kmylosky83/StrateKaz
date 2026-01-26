/**
 * Hook para gestionar iconos dinamicos desde la API
 * Sistema de Gestion StrateKaz
 *
 * Consume el endpoint /api/configuracion/icons/ para obtener
 * iconos disponibles de forma dinamica desde la base de datos.
 *
 * @example
 * ```tsx
 * const { icons, categories, getIconsByCategory, searchIcons, isLoading } = useIcons();
 *
 * // Obtener todos los iconos
 * icons.forEach(icon => console.log(icon.name, icon.label));
 *
 * // Filtrar por categoria
 * const valoresIcons = getIconsByCategory('VALORES');
 *
 * // Buscar iconos
 * const results = searchIcons('corazon');
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios-config';

// ==================== TYPES ====================

/**
 * Icono del registro de iconos
 */
export interface IconRegistryItem {
  id: number;
  name: string;
  label: string;
  category: string;
  category_display?: string;
  description?: string;
  keywords?: string;
  orden?: number;
  es_sistema?: boolean;
  is_active?: boolean;
}

/**
 * Categoria de iconos con conteo
 */
export interface IconCategory {
  code: string;
  name: string;
  icon_count: number;
}

/**
 * Opciones del hook
 */
export interface UseIconsOptions {
  category?: string;
  enabled?: boolean;
}

/**
 * Resultado del hook
 */
export interface UseIconsReturn {
  icons: IconRegistryItem[];
  categories: IconCategory[];
  isLoading: boolean;
  isCategoriesLoading: boolean;
  error: Error | null;
  getIconsByCategory: (category: string) => IconRegistryItem[];
  searchIcons: (query: string) => IconRegistryItem[];
  getIconByName: (name: string) => IconRegistryItem | undefined;
  refetch: () => void;
}

// ==================== FETCH FUNCTIONS ====================

const fetchIcons = async (category?: string): Promise<IconRegistryItem[]> => {
  const params = category ? { category } : {};
  const response = await axiosInstance.get('/configuracion/icons/', { params });
  // Manejar respuesta paginada o array directo
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  }
  // Si es respuesta paginada, extraer results
  if (data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
};

const fetchCategories = async (): Promise<IconCategory[]> => {
  const response = await axiosInstance.get('/configuracion/icons/categories/');
  return response.data;
};

const fetchIconsByCategory = async (category: string): Promise<IconRegistryItem[]> => {
  const response = await axiosInstance.get('/configuracion/icons/by_category/', {
    params: { category }
  });
  return response.data;
};

const searchIconsApi = async (query: string): Promise<IconRegistryItem[]> => {
  const response = await axiosInstance.get('/configuracion/icons/search/', {
    params: { q: query }
  });
  return response.data;
};

// ==================== HOOK ====================

export function useIcons(options: UseIconsOptions = {}): UseIconsReturn {
  const { category, enabled = true } = options;

  // Query para todos los iconos o por categoria
  const {
    data: icons = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['icons', category],
    queryFn: () => fetchIcons(category),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos - los iconos cambian poco
    gcTime: 30 * 60 * 1000, // 30 minutos en cache
  });

  // Query para categorias
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
  } = useQuery({
    queryKey: ['icon-categories'],
    queryFn: fetchCategories,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 60 * 60 * 1000, // 1 hora en cache
  });

  // Filtrar iconos por categoria (desde cache local)
  const getIconsByCategory = (cat: string): IconRegistryItem[] => {
    return icons.filter(icon => icon.category === cat);
  };

  // Buscar iconos (desde cache local)
  const searchIcons = (query: string): IconRegistryItem[] => {
    const q = query.toLowerCase();
    return icons.filter(icon =>
      icon.name.toLowerCase().includes(q) ||
      icon.label.toLowerCase().includes(q) ||
      (icon.keywords && icon.keywords.toLowerCase().includes(q))
    );
  };

  // Obtener un icono por nombre
  const getIconByName = (name: string): IconRegistryItem | undefined => {
    return icons.find(icon => icon.name === name);
  };

  return {
    icons,
    categories,
    isLoading,
    isCategoriesLoading,
    error: error as Error | null,
    getIconsByCategory,
    searchIcons,
    getIconByName,
    refetch,
  };
}

// ==================== HOOK PARA CATEGORIA ESPECIFICA ====================

/**
 * Hook para obtener iconos de una categoria especifica
 * Optimizado para selectores de iconos en formularios
 */
export function useIconsByCategory(category: string) {
  const {
    data: icons = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['icons', 'by-category', category],
    queryFn: () => fetchIconsByCategory(category),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });

  return { icons, isLoading, error };
}

// ==================== HOOK PARA BUSQUEDA ====================

/**
 * Hook para buscar iconos
 * Usa debounce internamente para evitar muchas requests
 */
export function useIconSearch(query: string, debounceMs: number = 300) {
  const {
    data: results = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['icons', 'search', query],
    queryFn: () => searchIconsApi(query),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  return { results, isLoading, error };
}

export default useIcons;
