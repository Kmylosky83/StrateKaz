/**
 * EstrategiasTOWSGrid - Grid de estrategias TOWS (cruce DOFA)
 */
import { cn } from '@/utils/cn';
import { Target, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { EstrategiaTOWS, TipoEstrategiaTOWS } from '../../types';

interface EstrategiasTOWSGridProps {
  estrategias: EstrategiaTOWS[];
  onEstrategiaClick?: (estrategia: EstrategiaTOWS) => void;
  className?: string;
}

const TIPO_CONFIG: Record<TipoEstrategiaTOWS, {
  titulo: string;
  subtitulo: string;
  color: string;
  bgColor: string;
}> = {
  fo: {
    titulo: 'FO - Maxi-Maxi',
    subtitulo: 'Usar Fortalezas para aprovechar Oportunidades',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  fa: {
    titulo: 'FA - Maxi-Mini',
    subtitulo: 'Usar Fortalezas para evitar Amenazas',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  do: {
    titulo: 'DO - Mini-Maxi',
    subtitulo: 'Superar Debilidades aprovechando Oportunidades',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  da: {
    titulo: 'DA - Mini-Mini',
    subtitulo: 'Minimizar Debilidades y evitar Amenazas',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
  },
};

const ESTADO_ICON = {
  pendiente: Clock,
  en_proceso: Target,
  completada: CheckCircle2,
  cancelada: XCircle,
};

const ESTADO_STYLES = {
  pendiente: 'text-gray-500',
  en_proceso: 'text-blue-500',
  completada: 'text-green-500',
  cancelada: 'text-red-500',
};

export function EstrategiasTOWSGrid({
  estrategias,
  onEstrategiaClick,
  className,
}: EstrategiasTOWSGridProps) {
  const estrategiasPorTipo = (tipo: TipoEstrategiaTOWS) =>
    estrategias.filter((e) => e.tipo === tipo);

  const renderCuadrante = (tipo: TipoEstrategiaTOWS) => {
    const config = TIPO_CONFIG[tipo];
    const items = estrategiasPorTipo(tipo);

    return (
      <div className={cn('rounded-lg border p-4', config.bgColor)}>
        <div className={cn('font-semibold mb-1', config.color)}>
          {config.titulo}
        </div>
        <p className="text-xs text-muted-foreground mb-3">{config.subtitulo}</p>

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin estrategias</p>
          ) : (
            items.map((estrategia) => {
              const StatusIcon = ESTADO_ICON[estrategia.estado];
              return (
                <div
                  key={estrategia.id}
                  className="bg-white rounded p-2 text-sm cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => onEstrategiaClick?.(estrategia)}
                >
                  <div className="flex items-start gap-2">
                    <StatusIcon
                      className={cn('w-4 h-4 mt-0.5 flex-shrink-0', ESTADO_STYLES[estrategia.estado])}
                    />
                    <p className="line-clamp-2 flex-1">{estrategia.descripcion}</p>
                  </div>
                  {estrategia.responsable_detail && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {estrategia.responsable_detail.first_name} {estrategia.responsable_detail.last_name}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Resumen de estados
  const resumenEstados = {
    pendiente: estrategias.filter((e) => e.estado === 'pendiente').length,
    en_proceso: estrategias.filter((e) => e.estado === 'en_proceso').length,
    completada: estrategias.filter((e) => e.estado === 'completada').length,
    cancelada: estrategias.filter((e) => e.estado === 'cancelada').length,
  };

  return (
    <div className={className}>
      {/* Resumen */}
      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-muted-foreground">
          Total: <strong>{estrategias.length}</strong>
        </span>
        <span className="text-gray-500">
          Pendientes: {resumenEstados.pendiente}
        </span>
        <span className="text-blue-500">
          En proceso: {resumenEstados.en_proceso}
        </span>
        <span className="text-green-500">
          Completadas: {resumenEstados.completada}
        </span>
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-2 gap-4">
        {renderCuadrante('fo')}
        {renderCuadrante('fa')}
        {renderCuadrante('do')}
        {renderCuadrante('da')}
      </div>
    </div>
  );
}

export default EstrategiasTOWSGrid;
