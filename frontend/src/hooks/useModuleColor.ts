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
import { useModulesTree } from '@/hooks/useModules';
import type { ModuleColor } from '@/hooks/useModules';
import { colorMapping } from '@/utils/moduleColors';

// Re-export ModuleColor para uso externo
export type { ModuleColor };

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
