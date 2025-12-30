/**
 * PorterDiagram - Diagrama de las 5 Fuerzas de Porter
 */
import { cn } from '@/utils/cn';
import {
  Swords,
  UserPlus,
  RefreshCw,
  Factory,
  ShoppingCart,
} from 'lucide-react';
import type { FuerzaPorter, TipoFuerzaPorter, IntensidadFuerza } from '../../types';

interface PorterDiagramProps {
  fuerzas: FuerzaPorter[];
  onFuerzaClick?: (fuerza: FuerzaPorter) => void;
  className?: string;
}

const FUERZA_CONFIG: Record<TipoFuerzaPorter, {
  titulo: string;
  descripcion: string;
  icon: typeof Swords;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
}> = {
  rivalidad: {
    titulo: 'Rivalidad Competitiva',
    descripcion: 'Competencia entre empresas existentes',
    icon: Swords,
    position: 'center',
  },
  nuevos_entrantes: {
    titulo: 'Amenaza de Nuevos Entrantes',
    descripcion: 'Barreras de entrada al mercado',
    icon: UserPlus,
    position: 'top',
  },
  sustitutos: {
    titulo: 'Amenaza de Sustitutos',
    descripcion: 'Productos o servicios alternativos',
    icon: RefreshCw,
    position: 'bottom',
  },
  poder_proveedores: {
    titulo: 'Poder de Proveedores',
    descripcion: 'Capacidad de negociación de proveedores',
    icon: Factory,
    position: 'left',
  },
  poder_clientes: {
    titulo: 'Poder de Clientes',
    descripcion: 'Capacidad de negociación de compradores',
    icon: ShoppingCart,
    position: 'right',
  },
};

const INTENSIDAD_CONFIG: Record<IntensidadFuerza, {
  label: string;
  color: string;
  bgColor: string;
  size: number;
}> = {
  muy_alta: { label: 'Muy Alta', color: 'text-red-700', bgColor: 'bg-red-100', size: 100 },
  alta: { label: 'Alta', color: 'text-orange-700', bgColor: 'bg-orange-100', size: 80 },
  media: { label: 'Media', color: 'text-amber-700', bgColor: 'bg-amber-100', size: 60 },
  baja: { label: 'Baja', color: 'text-green-700', bgColor: 'bg-green-100', size: 40 },
  muy_baja: { label: 'Muy Baja', color: 'text-emerald-700', bgColor: 'bg-emerald-100', size: 20 },
};

export function PorterDiagram({
  fuerzas,
  onFuerzaClick,
  className,
}: PorterDiagramProps) {
  const getFuerza = (tipo: TipoFuerzaPorter) =>
    fuerzas.find((f) => f.tipo === tipo);

  const renderFuerzaCard = (tipo: TipoFuerzaPorter) => {
    const config = FUERZA_CONFIG[tipo];
    const fuerza = getFuerza(tipo);
    const Icon = config.icon;
    const intensidad = fuerza?.intensidad || 'media';
    const intensidadConfig = INTENSIDAD_CONFIG[intensidad];

    return (
      <div
        className={cn(
          'rounded-lg border-2 p-4 cursor-pointer hover:shadow-md transition-all',
          intensidadConfig.bgColor,
          fuerza ? 'opacity-100' : 'opacity-50'
        )}
        onClick={() => fuerza && onFuerzaClick?.(fuerza)}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('p-2 rounded-full bg-white', intensidadConfig.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{config.titulo}</h4>
            <p className="text-xs text-muted-foreground">{config.descripcion}</p>
          </div>
        </div>

        {fuerza ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-sm font-medium', intensidadConfig.color)}>
                Intensidad: {intensidadConfig.label}
              </span>
            </div>
            {/* Barra de intensidad */}
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', {
                  'bg-red-500': intensidad === 'muy_alta',
                  'bg-orange-500': intensidad === 'alta',
                  'bg-amber-500': intensidad === 'media',
                  'bg-green-500': intensidad === 'baja',
                  'bg-emerald-500': intensidad === 'muy_baja',
                })}
                style={{ width: `${intensidadConfig.size}%` }}
              />
            </div>
            {fuerza.factores_clave.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Factores clave:</p>
                <div className="flex flex-wrap gap-1">
                  {fuerza.factores_clave.slice(0, 3).map((factor, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white px-2 py-0.5 rounded border"
                    >
                      {factor}
                    </span>
                  ))}
                  {fuerza.factores_clave.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{fuerza.factores_clave.length - 3} más
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sin evaluar</p>
        )}
      </div>
    );
  };

  return (
    <div className={cn('max-w-3xl mx-auto', className)}>
      {/* Estructura de diamante */}
      <div className="grid grid-rows-3 gap-4">
        {/* Fila superior - Nuevos entrantes */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            {renderFuerzaCard('nuevos_entrantes')}
          </div>
        </div>

        {/* Fila media - Proveedores, Rivalidad, Clientes */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <div>{renderFuerzaCard('poder_proveedores')}</div>
          <div>{renderFuerzaCard('rivalidad')}</div>
          <div>{renderFuerzaCard('poder_clientes')}</div>
        </div>

        {/* Fila inferior - Sustitutos */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            {renderFuerzaCard('sustitutos')}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
        {Object.entries(INTENSIDAD_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={cn('w-3 h-3 rounded', config.bgColor)} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PorterDiagram;
