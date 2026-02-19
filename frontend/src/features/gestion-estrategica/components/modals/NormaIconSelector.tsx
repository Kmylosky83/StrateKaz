/**
 * NormaIconSelector - Selector de iconos para Normas y Sistemas de Gestión
 *
 * Componente dedicado que proporciona una selección de iconos relevantes
 * para normas ISO, PESV, SG-SST y otras normativas, sin depender de la API.
 *
 * Iconos agrupados por categoría:
 * - Calidad: Award, FileCheck, CheckCircle, ClipboardCheck, etc.
 * - Seguridad Vial: Car, Truck, Route, TrafficCone, etc.
 * - Salud y Seguridad: Shield, Heart, HardHat, AlertTriangle, etc.
 * - Ambiental: Leaf, Trees, Recycle, Droplets, etc.
 * - Información: Lock, Database, Server, ShieldCheck, etc.
 * - General: FileText, Book, Scale, Target, etc.
 */
import { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DynamicIcon } from '@/components/common/DynamicIcon';

// ==================== TYPES ====================

export interface NormaIconSelectorProps {
  /** Nombre del icono seleccionado */
  value?: string | null;
  /** Callback cuando se selecciona un icono */
  onChange: (iconName: string) => void;
  /** Etiqueta del campo */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Texto de ayuda */
  helperText?: string;
  /** Deshabilitar el selector */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /** Número de columnas del grid (default: 8) */
  columns?: number;
}

interface IconOption {
  name: string;
  label: string;
  keywords: string;
}

interface IconCategory {
  code: string;
  name: string;
  icons: IconOption[];
}

// ==================== ICON DATA ====================

const NORMA_ICON_CATEGORIES: IconCategory[] = [
  {
    code: 'CALIDAD',
    name: 'Calidad (ISO 9001)',
    icons: [
      { name: 'Award', label: 'Premio', keywords: 'calidad certificacion logro excelencia' },
      { name: 'FileCheck', label: 'Documento OK', keywords: 'verificado aprobado conforme' },
      { name: 'CheckCircle', label: 'Check', keywords: 'aprobado correcto cumple' },
      { name: 'ClipboardCheck', label: 'Lista Check', keywords: 'auditoria verificacion control' },
      { name: 'BadgeCheck', label: 'Insignia', keywords: 'certificado acreditacion' },
      { name: 'Medal', label: 'Medalla', keywords: 'premio reconocimiento' },
      { name: 'Star', label: 'Estrella', keywords: 'excelencia calificacion' },
      { name: 'ThumbsUp', label: 'Aprobado', keywords: 'ok bueno aceptado' },
    ],
  },
  {
    code: 'PESV',
    name: 'Seguridad Vial (PESV)',
    icons: [
      { name: 'Car', label: 'Carro', keywords: 'vehiculo automovil transporte pesv' },
      { name: 'Truck', label: 'Camión', keywords: 'vehiculo carga transporte flota' },
      { name: 'Bus', label: 'Bus', keywords: 'transporte pasajeros colectivo' },
      { name: 'Route', label: 'Ruta', keywords: 'camino trayecto via' },
      { name: 'Navigation', label: 'Navegación', keywords: 'direccion gps ubicacion' },
      { name: 'CircleParking', label: 'Parqueadero', keywords: 'estacionamiento parking' },
      { name: 'Gauge', label: 'Velocímetro', keywords: 'velocidad medidor indicador' },
      { name: 'Construction', label: 'Construcción', keywords: 'obra mantenimiento vial' },
    ],
  },
  {
    code: 'SST',
    name: 'Salud y Seguridad (SG-SST / ISO 45001)',
    icons: [
      { name: 'Shield', label: 'Escudo', keywords: 'seguridad proteccion defensa' },
      { name: 'ShieldCheck', label: 'Escudo OK', keywords: 'seguridad verificada protegido' },
      { name: 'Heart', label: 'Corazón', keywords: 'salud bienestar vida' },
      { name: 'HeartPulse', label: 'Pulso', keywords: 'salud medicina vital signos' },
      { name: 'HardHat', label: 'Casco', keywords: 'epp proteccion obra construccion' },
      { name: 'AlertTriangle', label: 'Alerta', keywords: 'peligro riesgo advertencia' },
      { name: 'Siren', label: 'Sirena', keywords: 'emergencia alarma alerta' },
      { name: 'Flame', label: 'Fuego', keywords: 'incendio riesgo emergencia' },
    ],
  },
  {
    code: 'AMBIENTAL',
    name: 'Ambiental (ISO 14001)',
    icons: [
      { name: 'Leaf', label: 'Hoja', keywords: 'ambiente naturaleza ecologia verde' },
      { name: 'TreeDeciduous', label: 'Árbol', keywords: 'bosque naturaleza forestal' },
      { name: 'Sprout', label: 'Brote', keywords: 'crecimiento sostenible vida' },
      { name: 'Recycle', label: 'Reciclar', keywords: 'reciclaje economia circular' },
      { name: 'Droplets', label: 'Gotas', keywords: 'agua recurso hidrico' },
      { name: 'Wind', label: 'Viento', keywords: 'aire emision atmosfera' },
      { name: 'Sun', label: 'Sol', keywords: 'energia renovable solar' },
      { name: 'Mountain', label: 'Montaña', keywords: 'ecosistema paisaje conservacion' },
    ],
  },
  {
    code: 'SEGINFO',
    name: 'Seguridad Información (ISO 27001)',
    icons: [
      { name: 'Lock', label: 'Candado', keywords: 'seguridad privacidad cifrado' },
      { name: 'KeyRound', label: 'Llave', keywords: 'acceso autenticación credencial' },
      { name: 'ShieldAlert', label: 'Escudo Alerta', keywords: 'amenaza vulnerabilidad' },
      { name: 'Database', label: 'Base Datos', keywords: 'información almacenamiento' },
      { name: 'Server', label: 'Servidor', keywords: 'infraestructura ti tecnología' },
      { name: 'Fingerprint', label: 'Huella', keywords: 'biometria identidad acceso' },
      { name: 'Eye', label: 'Ojo', keywords: 'vigilancia monitoreo supervisión' },
      { name: 'FileKey', label: 'Archivo Llave', keywords: 'documento seguro cifrado' },
    ],
  },
  {
    code: 'GENERAL',
    name: 'Normativas Generales',
    icons: [
      { name: 'FileText', label: 'Documento', keywords: 'archivo norma reglamento' },
      { name: 'BookOpen', label: 'Libro', keywords: 'manual guia procedimiento' },
      { name: 'Scale', label: 'Balanza', keywords: 'legal cumplimiento justicia' },
      { name: 'Target', label: 'Objetivo', keywords: 'meta indicador kpi' },
      { name: 'TrendingUp', label: 'Tendencia', keywords: 'mejora crecimiento progreso' },
      { name: 'BarChart3', label: 'Gráfico', keywords: 'estadistica reporte indicador' },
      { name: 'Users', label: 'Personas', keywords: 'equipo grupo recursos humanos' },
      { name: 'Building2', label: 'Edificio', keywords: 'empresa organizacion sede' },
    ],
  },
];

// Aplanar todos los iconos para búsqueda
const ALL_ICONS = NORMA_ICON_CATEGORIES.flatMap((cat) =>
  cat.icons.map((icon) => ({ ...icon, category: cat.code, categoryName: cat.name }))
);

// ==================== COMPONENT ====================

export function NormaIconSelector({
  value,
  onChange,
  label,
  error,
  helperText,
  disabled = false,
  className,
  columns = 8,
}: NormaIconSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar iconos por búsqueda
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return NORMA_ICON_CATEGORIES;
    }

    const q = searchQuery.toLowerCase();
    const filtered: IconCategory[] = [];

    NORMA_ICON_CATEGORIES.forEach((cat) => {
      const matchingIcons = cat.icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(q) ||
          icon.label.toLowerCase().includes(q) ||
          icon.keywords.toLowerCase().includes(q)
      );

      if (matchingIcons.length > 0) {
        filtered.push({
          ...cat,
          icons: matchingIcons,
        });
      }
    });

    return filtered;
  }, [searchQuery]);

  // Total de iconos encontrados
  const totalIcons = useMemo(
    () => filteredIcons.reduce((sum, cat) => sum + cat.icons.length, 0),
    [filteredIcons]
  );

  // Manejar selección
  const handleSelect = useCallback(
    (iconName: string) => {
      if (!disabled) {
        onChange(iconName);
      }
    },
    [disabled, onChange]
  );

  // Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Obtener info del icono seleccionado
  const selectedIconInfo = useMemo(() => ALL_ICONS.find((icon) => icon.name === value), [value]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Container */}
      <div
        className={cn(
          'border rounded-lg overflow-hidden transition-colors',
          error
            ? 'border-danger-500 dark:border-danger-400'
            : 'border-gray-300 dark:border-gray-600',
          disabled ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-gray-900'
        )}
      >
        {/* Search Bar */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar icono... (ej: carro, seguridad, calidad)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              className={cn(
                'w-full pl-9 pr-8 py-2 text-sm rounded-md',
                'bg-white dark:bg-gray-700',
                'border border-gray-200 dark:border-gray-600',
                'text-gray-900 dark:text-gray-100',
                'placeholder-gray-400 dark:placeholder-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                disabled && 'cursor-not-allowed'
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="p-3 max-h-64 overflow-y-auto">
          {totalIcons === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <DynamicIcon name="SearchX" size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron iconos</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIcons.map((category) => (
                <div key={category.code}>
                  {/* Category Header */}
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {category.name}
                  </h4>

                  {/* Icons Grid */}
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                  >
                    {category.icons.map((icon) => (
                      <button
                        key={`${category.code}-${icon.name}`}
                        type="button"
                        onClick={() => handleSelect(icon.name)}
                        disabled={disabled}
                        title={icon.label}
                        className={cn(
                          'p-2 rounded-lg transition-all flex items-center justify-center',
                          value === icon.name
                            ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500 dark:bg-primary-900/50 dark:text-primary-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                          disabled && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <DynamicIcon name={icon.name} size={20} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Icon Preview */}
        {value && selectedIconInfo && (
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2 text-sm">
              <DynamicIcon
                name={value}
                size={16}
                className="text-primary-600 dark:text-primary-400"
              />
              <span className="text-gray-600 dark:text-gray-400">
                Seleccionado:{' '}
                <strong className="text-gray-900 dark:text-gray-100">
                  {selectedIconInfo.label}
                </strong>
                <span className="text-xs ml-1 opacity-60">({selectedIconInfo.categoryName})</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
    </div>
  );
}

export default NormaIconSelector;
