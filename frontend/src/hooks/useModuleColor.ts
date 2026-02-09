/**
 * Hook para obtener el color efectivo de un módulo
 *
 * Características:
 * - Busca el módulo por código en el árbol de módulos
 * - Aplica el mapeo de colores extendidos (igual que Sidebar)
 * - Retorna fallback 'blue' si no encuentra el módulo
 * - Resultado memoizado para optimizar performance
 *
 * Uso:
 * ```tsx
 * const { color, isLoading, module } = useModuleColor('GESTION_ESTRATEGICA');
 * // color: 'purple' | 'blue' | 'green' | etc.
 * ```
 */
import { useMemo } from 'react';
import { useModulesTree } from '@/features/gestion-estrategica/hooks/useModules';
import type { ModuleColor } from '@/features/gestion-estrategica/types/modules.types';

// Re-export ModuleColor para uso externo
export type { ModuleColor };

/**
 * Mapeo de colores extendidos de Tailwind a los 10 colores soportados
 * Sincronizado con Sidebar.tsx (líneas 30-55)
 */
const colorMapping: Record<string, ModuleColor> = {
  // Colores directos (ya soportados)
  purple: 'purple',
  blue: 'blue',
  green: 'green',
  orange: 'orange',
  gray: 'gray',
  teal: 'teal',
  red: 'red',
  yellow: 'yellow',
  pink: 'pink',
  indigo: 'indigo',
  // Colores extendidos → mapeados al más cercano
  amber: 'orange',
  cyan: 'teal',
  rose: 'pink',
  violet: 'purple',
  emerald: 'green',
  lime: 'green',
  slate: 'gray',
  stone: 'gray',
  zinc: 'gray',
  neutral: 'gray',
  fuchsia: 'pink',
  sky: 'blue',
};

/**
 * Valor de retorno del hook useModuleColor
 */
export interface UseModuleColorReturn {
  /** Color efectivo del módulo (con mapeo aplicado y fallback) */
  color: ModuleColor;
  /** Indica si los datos están cargando */
  isLoading: boolean;
  /** Módulo encontrado (undefined si no existe) */
  module?: {
    id: number;
    code: string;
    name: string;
    color?: ModuleColor;
    category: string;
  };
  /** Color raw sin mapear (null si no tiene color configurado) */
  rawColor: string | null;
}

/**
 * Hook para obtener el color efectivo de un módulo
 *
 * @param moduleCode - Código del módulo (ej: 'GESTION_ESTRATEGICA', 'SST', 'PESV')
 * @returns Objeto con color mapeado, estado de carga y módulo
 *
 * @example
 * ```tsx
 * const { color, isLoading, module } = useModuleColor('GESTION_ESTRATEGICA');
 *
 * if (isLoading) return <Spinner />;
 *
 * // Usar el color en clases de Tailwind
 * <div className={`bg-${color}-100 text-${color}-700`}>
 *   {module?.name}
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Con color raw para debugging
 * const { color, rawColor } = useModuleColor('HSEQ');
 * // rawColor: 'violet', color: 'purple'
 * ```
 */
export const useModuleColor = (moduleCode: string): UseModuleColorReturn => {
  const { data: tree, isLoading } = useModulesTree();

  // Memoizar la búsqueda del módulo y aplicación del mapeo
  const result = useMemo(() => {
    // Si está cargando o no hay datos, retornar fallback
    if (isLoading || !tree) {
      return {
        color: 'blue' as ModuleColor,
        isLoading: true,
        module: undefined,
        rawColor: null,
      };
    }

    // Buscar el módulo por código
    const foundModule = tree.modules.find((m) => m.code === moduleCode);

    // Si no existe el módulo, retornar fallback
    if (!foundModule) {
      return {
        color: 'blue' as ModuleColor,
        isLoading: false,
        module: undefined,
        rawColor: null,
      };
    }

    // Guardar el color raw (antes del mapeo)
    const rawColor = foundModule.color || null;

    // Aplicar mapeo de colores extendidos
    let mappedColor: ModuleColor = 'blue'; // Fallback por defecto

    if (foundModule.color) {
      mappedColor = colorMapping[foundModule.color] || 'blue';
    }

    return {
      color: mappedColor,
      isLoading: false,
      module: {
        id: foundModule.id,
        code: foundModule.code,
        name: foundModule.name,
        color: foundModule.color,
        category: foundModule.category,
      },
      rawColor,
    };
  }, [tree, moduleCode, isLoading]);

  return result;
};

export default useModuleColor;
