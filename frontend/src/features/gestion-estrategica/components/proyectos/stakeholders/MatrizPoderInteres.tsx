/**
 * Matriz de Poder/Interés (cuadrante 2x2) para stakeholders del proyecto
 * Datos desde @action matriz-poder-interes del backend
 */
import { Card, Badge } from '@/components/common';
import { useMatrizPoderInteres } from '../../../hooks/useProyectos';
import type { InteresadoProyecto } from '../../../types/proyectos.types';

interface MatrizPoderInteresProps {
  proyectoId: number;
}

interface CuadranteProps {
  title: string;
  subtitle: string;
  items: InteresadoProyecto[];
  bgColor: string;
  borderColor: string;
}

const Cuadrante = ({ title, subtitle, items, bgColor, borderColor }: CuadranteProps) => (
  <div className={`${bgColor} ${borderColor} border rounded-lg p-3 min-h-[120px]`}>
    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
      {title}
    </h4>
    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">{subtitle}</p>
    <div className="flex flex-wrap gap-1">
      {items.map((i) => (
        <Badge key={i.id} variant="gray" size="sm" className="text-[10px]">
          {i.nombre}
        </Badge>
      ))}
      {items.length === 0 && (
        <span className="text-[10px] text-gray-400 italic">Sin interesados</span>
      )}
    </div>
  </div>
);

export const MatrizPoderInteres = ({ proyectoId }: MatrizPoderInteresProps) => {
  const { data: matriz, isLoading } = useMatrizPoderInteres(proyectoId);

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse-subtle">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </Card>
    );
  }

  if (!matriz) return null;

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Matriz Poder/Interés
        </h3>

        {/* Labels eje Y */}
        <div className="flex gap-2">
          <div className="flex flex-col justify-between w-6 shrink-0 py-1">
            <span className="text-[9px] text-gray-500 font-medium -rotate-90 origin-center whitespace-nowrap translate-y-4">
              PODER ALTO
            </span>
            <span className="text-[9px] text-gray-500 font-medium -rotate-90 origin-center whitespace-nowrap translate-y-4">
              PODER BAJO
            </span>
          </div>

          <div className="flex-1">
            {/* Fila superior: Alto poder */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Cuadrante
                title="Mantener Satisfecho"
                subtitle="Alto poder, bajo interés"
                items={matriz.mantener_satisfecho || []}
                bgColor="bg-yellow-50 dark:bg-yellow-900/10"
                borderColor="border-yellow-200 dark:border-yellow-800"
              />
              <Cuadrante
                title="Gestionar de Cerca"
                subtitle="Alto poder, alto interés"
                items={matriz.gestionar_cerca || []}
                bgColor="bg-red-50 dark:bg-red-900/10"
                borderColor="border-red-200 dark:border-red-800"
              />
            </div>

            {/* Fila inferior: Bajo poder */}
            <div className="grid grid-cols-2 gap-2">
              <Cuadrante
                title="Monitorear"
                subtitle="Bajo poder, bajo interés"
                items={matriz.monitorear || []}
                bgColor="bg-gray-50 dark:bg-gray-800/50"
                borderColor="border-gray-200 dark:border-gray-700"
              />
              <Cuadrante
                title="Mantener Informado"
                subtitle="Bajo poder, alto interés"
                items={matriz.mantener_informado || []}
                bgColor="bg-blue-50 dark:bg-blue-900/10"
                borderColor="border-blue-200 dark:border-blue-800"
              />
            </div>

            {/* Labels eje X */}
            <div className="flex justify-between mt-1 px-2">
              <span className="text-[9px] text-gray-500 font-medium">INTERÉS BAJO</span>
              <span className="text-[9px] text-gray-500 font-medium">INTERÉS ALTO</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
