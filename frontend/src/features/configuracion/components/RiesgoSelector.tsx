/**
 * Selector de Riesgos Ocupacionales para Formulario de Cargo
 *
 * Diseño UX optimizado para manejar 78 riesgos clasificados en 7 categorías GTC 45:
 * - Acordeón expandible/colapsable por categoría
 * - Búsqueda global con highlighting
 * - Selección masiva por categoría
 * - Badges de nivel de riesgo con código de color
 * - Contador de selección por categoría y global
 *
 * @design-rationale
 * 1. Acordeón: Reduce sobrecarga cognitiva mostrando 7 categorías vs 78 items planos
 * 2. Búsqueda: Permite acceso rápido sin scroll excesivo
 * 3. Selección masiva: Casos comunes (ej: todo BIOLOGICO) en 1 click
 * 4. Visual hierarchy: Iconos + badges + contadores = navegación intuitiva
 * 5. Mobile-first: Diseño responsive que funciona en modal sin scroll horizontal
 */
import { useState, useMemo } from 'react';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { cn } from '@/utils/cn';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Biohazard,
  Radio,
  FlaskConical,
  Brain,
  PersonStanding,
  AlertTriangle,
  CloudRain,
  Check,
  Minus,
} from 'lucide-react';
import type { RiesgoOcupacional } from '../types/rbac.types';

interface RiesgoSelectorProps {
  /** IDs de riesgos seleccionados */
  selectedIds: number[];
  /** Callback cuando cambia la selección */
  onChange: (selectedIds: number[]) => void;
  /** Lista de todos los riesgos disponibles */
  riesgos: RiesgoOcupacional[];
  /** Deshabilitar selector */
  disabled?: boolean;
}

// Iconos por clasificación GTC 45
const CLASIFICACION_ICONS = {
  BIOLOGICO: Biohazard,
  FISICO: Radio,
  QUIMICO: FlaskConical,
  PSICOSOCIAL: Brain,
  BIOMECANICO: PersonStanding,
  CONDICIONES_SEGURIDAD: AlertTriangle,
  FENOMENOS_NATURALES: CloudRain,
} as const;

// Labels legibles para clasificaciones
const CLASIFICACION_LABELS: Record<string, string> = {
  BIOLOGICO: 'Biológico',
  FISICO: 'Físico',
  QUIMICO: 'Químico',
  PSICOSOCIAL: 'Psicosocial',
  BIOMECANICO: 'Biomecánico',
  CONDICIONES_SEGURIDAD: 'Condiciones de Seguridad',
  FENOMENOS_NATURALES: 'Fenómenos Naturales',
};

// Variantes de Badge para niveles de riesgo (GTC 45)
const NIVEL_RIESGO_VARIANTS = {
  'I': 'danger', // Crítico - rojo
  'II': 'warning', // Alto - naranja
  'III': 'warning', // Medio - amarillo
  'IV': 'success', // Bajo - verde
} as const;

/**
 * Componente RiesgoSelector
 *
 * Permite seleccionar múltiples riesgos ocupacionales de forma eficiente
 * mediante agrupación por categoría, búsqueda y selección masiva.
 */
export const RiesgoSelector = ({
  selectedIds,
  onChange,
  riesgos,
  disabled = false,
}: RiesgoSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Agrupar riesgos por clasificación
  const riesgosPorClasificacion = useMemo(() => {
    const grouped = new Map<string, RiesgoOcupacional[]>();

    riesgos.forEach((riesgo) => {
      const clasif = riesgo.clasificacion;
      if (!grouped.has(clasif)) {
        grouped.set(clasif, []);
      }
      grouped.get(clasif)!.push(riesgo);
    });

    // Ordenar riesgos dentro de cada categoría por nombre
    grouped.forEach((riesgosArray) => {
      riesgosArray.sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [riesgos]);

  // Filtrar riesgos según búsqueda
  const riesgosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return riesgosPorClasificacion;

    const filtered = new Map<string, RiesgoOcupacional[]>();
    const searchLower = searchTerm.toLowerCase();

    riesgosPorClasificacion.forEach((riesgosArray, clasificacion) => {
      const matches = riesgosArray.filter((riesgo) =>
        riesgo.name.toLowerCase().includes(searchLower)
      );

      if (matches.length > 0) {
        filtered.set(clasificacion, matches);
      }
    });

    return filtered;
  }, [riesgosPorClasificacion, searchTerm]);

  // Auto-expandir categorías con resultados al buscar
  useMemo(() => {
    if (searchTerm.trim()) {
      setExpandedCategories(new Set(riesgosFiltrados.keys()));
    }
  }, [searchTerm, riesgosFiltrados]);

  // Toggle expansión de categoría
  const toggleCategory = (clasificacion: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clasificacion)) {
        newSet.delete(clasificacion);
      } else {
        newSet.add(clasificacion);
      }
      return newSet;
    });
  };

  // Manejar selección de riesgo individual
  const toggleRiesgo = (riesgoId: number) => {
    if (disabled) return;

    if (selectedIds.includes(riesgoId)) {
      onChange(selectedIds.filter((id) => id !== riesgoId));
    } else {
      onChange([...selectedIds, riesgoId]);
    }
  };

  // Manejar selección masiva de categoría
  const toggleCategorySelection = (clasificacion: string) => {
    if (disabled) return;

    const riesgosCategoria = riesgosPorClasificacion.get(clasificacion) || [];
    const idsCategoria = riesgosCategoria.map((r) => r.id);
    const todosSeleccionados = idsCategoria.every((id) => selectedIds.includes(id));

    if (todosSeleccionados) {
      // Deseleccionar todos de esta categoría
      onChange(selectedIds.filter((id) => !idsCategoria.includes(id)));
    } else {
      // Seleccionar todos de esta categoría
      const newIds = new Set([...selectedIds, ...idsCategoria]);
      onChange(Array.from(newIds));
    }
  };

  // Calcular estado de checkbox de categoría (checked, indeterminate, unchecked)
  const getCategoryCheckboxState = (clasificacion: string) => {
    const riesgosCategoria = riesgosPorClasificacion.get(clasificacion) || [];
    const idsCategoria = riesgosCategoria.map((r) => r.id);
    const seleccionados = idsCategoria.filter((id) => selectedIds.includes(id)).length;

    return {
      checked: seleccionados === idsCategoria.length && idsCategoria.length > 0,
      indeterminate: seleccionados > 0 && seleccionados < idsCategoria.length,
      count: seleccionados,
      total: idsCategoria.length,
    };
  };

  // Highlight de términos de búsqueda
  const highlightText = (text: string) => {
    if (!searchTerm.trim()) return text;

    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Total de riesgos seleccionados
  const totalSeleccionados = selectedIds.length;
  const totalRiesgos = riesgos.length;

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y contador global */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Riesgos Ocupacionales (GTC 45)
          </h4>
          <Badge variant={totalSeleccionados > 0 ? 'primary' : 'gray'} size="sm">
            {totalSeleccionados} / {totalRiesgos} seleccionados
          </Badge>
        </div>

        <Input
          type="text"
          placeholder="Buscar riesgo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
          disabled={disabled}
        />
      </div>

      {/* Acordeón de categorías */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {Array.from(riesgosFiltrados.entries()).map(([clasificacion, riesgosCategoria]) => {
          const isExpanded = expandedCategories.has(clasificacion);
          const categoryState = getCategoryCheckboxState(clasificacion);
          const Icon = CLASIFICACION_ICONS[clasificacion as keyof typeof CLASIFICACION_ICONS] || AlertTriangle;

          return (
            <div
              key={clasificacion}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Header de categoría */}
              <div
                className={cn(
                  'flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Checkbox de selección masiva */}
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={categoryState.checked}
                    onChange={() => toggleCategorySelection(clasificacion)}
                    disabled={disabled}
                    className={cn(
                      'peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white transition-colors checked:border-primary-600 checked:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:checked:bg-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:checked:border-primary-500 dark:checked:bg-primary-500'
                    )}
                  />
                  {categoryState.indeterminate ? (
                    <Minus
                      className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white"
                      strokeWidth={3}
                    />
                  ) : (
                    <Check
                      className={cn(
                        'pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100'
                      )}
                      strokeWidth={3}
                    />
                  )}
                </div>

                {/* Toggle expand/collapse */}
                <button
                  type="button"
                  onClick={() => toggleCategory(clasificacion)}
                  className="flex items-center gap-2 flex-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 transition-colors"
                  disabled={disabled}
                >
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-500" />
                  )}
                  <Icon size={18} className="text-primary-600 dark:text-primary-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {CLASIFICACION_LABELS[clasificacion] || clasificacion}
                  </span>
                  <Badge
                    variant={categoryState.count > 0 ? 'primary' : 'gray'}
                    size="sm"
                    className="ml-auto"
                  >
                    {categoryState.count} / {categoryState.total}
                  </Badge>
                </button>
              </div>

              {/* Lista de riesgos (expandible) */}
              {isExpanded && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {riesgosCategoria.map((riesgo) => (
                    <label
                      key={riesgo.id}
                      className={cn(
                        'flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(riesgo.id)}
                        onChange={() => toggleRiesgo(riesgo.id)}
                        disabled={disabled}
                        className="sr-only"
                      />

                      {/* Custom checkbox visual */}
                      <div className="relative flex items-center">
                        <div
                          className={cn(
                            'h-4 w-4 rounded border transition-colors',
                            selectedIds.includes(riesgo.id)
                              ? 'border-primary-600 bg-primary-600 dark:border-primary-500 dark:bg-primary-500'
                              : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                          )}
                        >
                          {selectedIds.includes(riesgo.id) && (
                            <Check className="h-4 w-4 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>

                      {/* Nombre del riesgo con highlighting */}
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {highlightText(riesgo.name)}
                      </span>

                      {/* Badge de nivel de riesgo */}
                      <Badge
                        variant={
                          NIVEL_RIESGO_VARIANTS[
                            riesgo.nivel_riesgo as keyof typeof NIVEL_RIESGO_VARIANTS
                          ] || 'gray'
                        }
                        size="sm"
                      >
                        Nivel {riesgo.nivel_riesgo}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Estado vacío */}
        {riesgosFiltrados.size === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? (
              <>
                <Search className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm">No se encontraron riesgos que coincidan con "{searchTerm}"</p>
              </>
            ) : (
              <p className="text-sm">No hay riesgos ocupacionales disponibles</p>
            )}
          </div>
        )}
      </div>

      {/* Footer con ayuda contextual */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
        <p className="font-medium mb-1">Niveles de riesgo según GTC 45:</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="danger" size="sm">I</Badge>
            <span>Crítico (No tolerable)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">II</Badge>
            <span>Alto (Corregir)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">III</Badge>
            <span>Medio (Mejorar)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">IV</Badge>
            <span>Bajo (Aceptable)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
