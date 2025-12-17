/**
 * Vista de Calendario para Programaciones
 *
 * Características:
 * - Vista mensual con días de la semana
 * - Eventos coloreados según estado
 * - Click en evento para ver detalles
 * - Navegación entre meses
 * - Filtros aplicables
 */
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/utils/dateUtils';
import type { Programacion } from '../types/programacion.types';

interface CalendarioViewProps {
  programaciones: Programacion[];
  onProgramacionClick: (programacion: Programacion) => void;
  isLoading?: boolean;
}

export const CalendarioView = ({
  programaciones,
  onProgramacionClick,
  isLoading,
}: CalendarioViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: es });
  const calendarEnd = endOfWeek(monthEnd, { locale: es });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Agrupar programaciones por día (usando parseLocalDate para evitar timezone issues)
  const programacionesPorDia = useMemo(() => {
    const map = new Map<string, Programacion[]>();

    programaciones.forEach((prog) => {
      // Usar parseLocalDate para evitar que las fechas se muestren un día antes
      const fechaObj = parseLocalDate(prog.fecha_programada);
      if (fechaObj) {
        const fecha = format(fechaObj, 'yyyy-MM-dd');
        const existentes = map.get(fecha) || [];
        map.set(fecha, [...existentes, prog]);
      }
    });

    return map;
  }, [programaciones]);

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEstadoColor = (programacion: Programacion): string => {
    // Si está vencida, mostrar en rojo
    if (programacion.esta_vencida) {
      return 'bg-red-600';
    }

    const colorMap: Record<string, string> = {
      PROGRAMADA: 'bg-gray-500',
      CONFIRMADA: 'bg-blue-500',
      EN_RUTA: 'bg-yellow-500',
      COMPLETADA: 'bg-green-500',
      CANCELADA: 'bg-red-500',
      REPROGRAMADA: 'bg-purple-500',
    };
    return colorMap[programacion.estado] || 'bg-gray-500';
  };


  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* CONTROLES DEL CALENDARIO */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoy
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">Estados:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Programada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Vencida</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Confirmada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600 dark:text-gray-400">En Ruta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Completada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Cancelada</span>
        </div>
      </div>

      {/* CALENDARIO */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {/* CABECERA - DÍAS DE LA SEMANA */}
          {diasSemana.map((dia) => (
            <div
              key={dia}
              className="bg-gray-50 dark:bg-gray-800 px-2 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase"
            >
              {dia}
            </div>
          ))}

          {/* DÍAS DEL CALENDARIO */}
          {calendarDays.map((dia) => {
            const diaStr = format(dia, 'yyyy-MM-dd');
            const programacionesDelDia = programacionesPorDia.get(diaStr) || [];
            const esDelMesActual = isSameMonth(dia, currentDate);
            const esHoy = isToday(dia);

            return (
              <div
                key={diaStr}
                className={`bg-white dark:bg-gray-800 min-h-[120px] p-2 ${
                  !esDelMesActual ? 'opacity-40' : ''
                }`}
              >
                {/* NÚMERO DEL DÍA */}
                <div
                  className={`text-sm font-medium mb-1 ${
                    esHoy
                      ? 'bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : esDelMesActual
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {format(dia, 'd')}
                </div>

                {/* PROGRAMACIONES DEL DÍA */}
                <div className="space-y-1">
                  {programacionesDelDia.slice(0, 3).map((prog) => (
                    <button
                      key={prog.id}
                      onClick={() => onProgramacionClick(prog)}
                      className="w-full text-left px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity border-l-2 border-l-primary-500 bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <div
                          className={`w-2 h-2 rounded-full ${getEstadoColor(prog)}`}
                        ></div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {prog.ecoaliado_codigo}
                        </span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 truncate">
                        {prog.ecoaliado_razon_social}
                      </div>
                      {prog.recolector_asignado_nombre && (
                        <div className="text-gray-500 dark:text-gray-500 text-[10px] truncate">
                          {prog.recolector_asignado_nombre}
                        </div>
                      )}
                    </button>
                  ))}

                  {/* INDICADOR DE MÁS PROGRAMACIONES */}
                  {programacionesDelDia.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                      +{programacionesDelDia.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ESTADÍSTICAS DEL MES */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total del Mes</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {programaciones.length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Programadas</div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
            {programaciones.filter((p) => p.estado === 'PROGRAMADA' && !p.esta_vencida).length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Vencidas</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {programaciones.filter((p) => p.esta_vencida).length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">En Proceso</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {programaciones.filter((p) => ['CONFIRMADA', 'EN_RUTA'].includes(p.estado)).length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completadas</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {programaciones.filter((p) => p.estado === 'COMPLETADA').length}
          </div>
        </Card>
      </div>
    </div>
  );
};
