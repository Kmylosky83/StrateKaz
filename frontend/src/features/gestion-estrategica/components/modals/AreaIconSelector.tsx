/**
 * AreaIconSelector - Selector de iconos para Areas Organizacionales
 *
 * Componente dedicado que proporciona una seleccion de iconos relevantes
 * para areas y departamentos, sin depender de la API de IconRegistry.
 *
 * Iconos agrupados por categoria:
 * - Organizacion: Building2, Building, Users, UserCircle, etc.
 * - Operaciones: Wrench, Factory, Cog, Truck, etc.
 * - Finanzas: DollarSign, Coins, CreditCard, Receipt, etc.
 * - HSEQ: Shield, Heart, Leaf, AlertTriangle, etc.
 * - Tecnologia: Monitor, Server, Code, Database, etc.
 */
import { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/common/DynamicIcon';

// ==================== TYPES ====================

export interface AreaIconSelectorProps {
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
  /** Numero de columnas del grid (default: 8) */
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

const AREA_ICON_CATEGORIES: IconCategory[] = [
  {
    code: 'ORG',
    name: 'Organizacion',
    icons: [
      { name: 'Building2', label: 'Edificio', keywords: 'oficina empresa sede' },
      { name: 'Building', label: 'Estructura', keywords: 'torre corporativo' },
      { name: 'Users', label: 'Equipo', keywords: 'grupo personas empleados' },
      { name: 'UserCircle', label: 'Persona', keywords: 'usuario perfil' },
      { name: 'Briefcase', label: 'Maletin', keywords: 'trabajo negocios ejecutivo' },
      { name: 'Network', label: 'Red', keywords: 'conexion organizacion' },
      { name: 'GitBranch', label: 'Rama', keywords: 'jerarquia division' },
      { name: 'LayoutGrid', label: 'Cuadricula', keywords: 'estructura matriz' },
    ],
  },
  {
    code: 'OPS',
    name: 'Operaciones',
    icons: [
      { name: 'Factory', label: 'Fabrica', keywords: 'planta produccion manufactura' },
      { name: 'Wrench', label: 'Herramienta', keywords: 'mantenimiento reparacion' },
      { name: 'Cog', label: 'Engranaje', keywords: 'configuracion proceso' },
      { name: 'Settings', label: 'Ajustes', keywords: 'configuracion sistema' },
      { name: 'Truck', label: 'Camion', keywords: 'transporte logistica envio' },
      { name: 'Package', label: 'Paquete', keywords: 'almacen inventario caja' },
      { name: 'Warehouse', label: 'Bodega', keywords: 'almacenamiento deposito' },
      { name: 'Clipboard', label: 'Tablero', keywords: 'lista control chequeo' },
    ],
  },
  {
    code: 'FIN',
    name: 'Finanzas',
    icons: [
      { name: 'DollarSign', label: 'Dolar', keywords: 'dinero moneda precio' },
      { name: 'Coins', label: 'Monedas', keywords: 'dinero efectivo caja' },
      { name: 'CreditCard', label: 'Tarjeta', keywords: 'pago banco credito' },
      { name: 'Receipt', label: 'Recibo', keywords: 'factura ticket comprobante' },
      { name: 'PiggyBank', label: 'Alcancia', keywords: 'ahorro finanzas' },
      { name: 'Calculator', label: 'Calculadora', keywords: 'contabilidad numeros' },
      { name: 'TrendingUp', label: 'Tendencia', keywords: 'crecimiento grafico' },
      { name: 'BarChart3', label: 'Graficos', keywords: 'estadisticas reportes' },
    ],
  },
  {
    code: 'HSEQ',
    name: 'HSEQ y Calidad',
    icons: [
      { name: 'Shield', label: 'Escudo', keywords: 'seguridad proteccion' },
      { name: 'ShieldCheck', label: 'Verificado', keywords: 'seguridad aprobado' },
      { name: 'Heart', label: 'Corazon', keywords: 'salud bienestar' },
      { name: 'HeartPulse', label: 'Pulso', keywords: 'medicina salud vital' },
      { name: 'Leaf', label: 'Hoja', keywords: 'ambiente ecologia verde' },
      { name: 'AlertTriangle', label: 'Alerta', keywords: 'peligro riesgo advertencia' },
      { name: 'Award', label: 'Premio', keywords: 'calidad certificacion logro' },
      { name: 'CheckCircle', label: 'Check', keywords: 'aprobado correcto ok' },
    ],
  },
  {
    code: 'TI',
    name: 'Tecnologia',
    icons: [
      { name: 'Monitor', label: 'Monitor', keywords: 'computadora pantalla' },
      { name: 'Laptop', label: 'Portatil', keywords: 'computadora laptop' },
      { name: 'Server', label: 'Servidor', keywords: 'infraestructura datos' },
      { name: 'Database', label: 'Base datos', keywords: 'almacenamiento informacion' },
      { name: 'Code', label: 'Codigo', keywords: 'programacion desarrollo' },
      { name: 'Globe', label: 'Globo', keywords: 'web internet mundo' },
      { name: 'Wifi', label: 'Wifi', keywords: 'red conexion internet' },
      { name: 'Cloud', label: 'Nube', keywords: 'almacenamiento servicios' },
    ],
  },
  {
    code: 'RH',
    name: 'Talento Humano',
    icons: [
      { name: 'UserCog', label: 'Usuario Config', keywords: 'rrhh personal empleado' },
      { name: 'GraduationCap', label: 'Graduacion', keywords: 'educacion capacitacion' },
      { name: 'BookOpen', label: 'Libro', keywords: 'conocimiento formacion' },
      { name: 'FileText', label: 'Documento', keywords: 'archivo contrato' },
      { name: 'ClipboardList', label: 'Lista', keywords: 'evaluacion checklist' },
      { name: 'Calendar', label: 'Calendario', keywords: 'fecha programacion' },
      { name: 'Clock', label: 'Reloj', keywords: 'tiempo horario jornada' },
      { name: 'Target', label: 'Meta', keywords: 'objetivo desempeno' },
    ],
  },
  {
    code: 'COM',
    name: 'Comercial',
    icons: [
      { name: 'ShoppingCart', label: 'Carrito', keywords: 'ventas compras comercio' },
      { name: 'Store', label: 'Tienda', keywords: 'local punto venta' },
      { name: 'Handshake', label: 'Acuerdo', keywords: 'trato negocio cliente' },
      { name: 'Phone', label: 'Telefono', keywords: 'contacto llamada soporte' },
      { name: 'Mail', label: 'Correo', keywords: 'email mensaje comunicacion' },
      { name: 'MessageSquare', label: 'Chat', keywords: 'conversacion atencion' },
      { name: 'Megaphone', label: 'Megafono', keywords: 'marketing publicidad' },
      { name: 'Star', label: 'Estrella', keywords: 'calificacion favorito' },
    ],
  },
  {
    code: 'LEG',
    name: 'Legal y Cumplimiento',
    icons: [
      { name: 'Scale', label: 'Balanza', keywords: 'justicia legal ley' },
      { name: 'Gavel', label: 'Mazo', keywords: 'juridico tribunal' },
      { name: 'FileCheck', label: 'Archivo OK', keywords: 'documento verificado' },
      { name: 'Lock', label: 'Candado', keywords: 'seguridad privacidad' },
      { name: 'Eye', label: 'Ojo', keywords: 'vigilancia supervision' },
      { name: 'ScrollText', label: 'Pergamino', keywords: 'contrato legal' },
      { name: 'BadgeCheck', label: 'Insignia', keywords: 'certificado licencia' },
      { name: 'Stamp', label: 'Sello', keywords: 'oficial aprobacion' },
    ],
  },
];

// Aplanar todos los iconos para busqueda
const ALL_ICONS = AREA_ICON_CATEGORIES.flatMap((cat) =>
  cat.icons.map((icon) => ({ ...icon, category: cat.code, categoryName: cat.name }))
);

// ==================== COMPONENT ====================

export function AreaIconSelector({
  value,
  onChange,
  label,
  error,
  helperText,
  disabled = false,
  className,
  columns = 8,
}: AreaIconSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar iconos por busqueda
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return AREA_ICON_CATEGORIES;
    }

    const q = searchQuery.toLowerCase();
    const filtered: IconCategory[] = [];

    AREA_ICON_CATEGORIES.forEach((cat) => {
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

  // Manejar seleccion
  const handleSelect = useCallback(
    (iconName: string) => {
      if (!disabled) {
        onChange(iconName);
      }
    },
    [disabled, onChange]
  );

  // Limpiar busqueda
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Obtener info del icono seleccionado
  const selectedIconInfo = useMemo(
    () => ALL_ICONS.find((icon) => icon.name === value),
    [value]
  );

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
              placeholder="Buscar icono... (ej: edificio, usuarios, seguridad)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              className={cn(
                'w-full pl-9 pr-8 py-2 text-sm rounded-md',
                'bg-white dark:bg-gray-700',
                'border border-gray-200 dark:border-gray-600',
                'text-gray-900 dark:text-gray-100',
                'placeholder-gray-400 dark:placeholder-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
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
                  className="mt-2 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  Limpiar busqueda
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
                            ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500 dark:bg-purple-900/50 dark:text-purple-300'
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
              <DynamicIcon name={value} size={16} className="text-purple-600 dark:text-purple-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Seleccionado: <strong className="text-gray-900 dark:text-gray-100">{selectedIconInfo.label}</strong>
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

export default AreaIconSelector;
