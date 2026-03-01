/**
 * CalendarioAsistencia - Calendario mensual con estado de asistencia por día
 * Muestra un grid de días del mes con colores según el estado de asistencia.
 */
import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useRegistrosAsistencia } from '../../hooks/useControlTiempo';
import type { EstadoAsistencia, RegistroAsistencia } from '../../types';

interface CalendarioAsistenciaProps {
  colaboradorId?: number;
  anio: number;
  mes: number; // 1-12
  onPrevMes: () => void;
  onNextMes: () => void;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MESES_NOMBRES: Record<number, string> = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

const ESTADO_CONFIG: Record<EstadoAsistencia, { bg: string; text: string; label: string }> = {
  presente: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-800 dark:text-green-200',
    label: 'Presente',
  },
  tardanza: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-800 dark:text-yellow-200',
    label: 'Tardanza',
  },
  ausente: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-800 dark:text-red-200',
    label: 'Ausente',
  },
  permiso: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-800 dark:text-blue-200',
    label: 'Permiso',
  },
  incapacidad: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-800 dark:text-purple-200',
    label: 'Incapacidad',
  },
  vacaciones: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-800 dark:text-cyan-200',
    label: 'Vacaciones',
  },
  licencia: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'Licencia',
  },
};

interface DiaCalendario {
  dia: number | null;
  fecha: string | null;
  registro: RegistroAsistencia | null;
  esHoy: boolean;
  esFinSemana: boolean;
}

export const CalendarioAsistencia = ({
  colaboradorId,
  anio,
  mes,
  onPrevMes,
  onNextMes,
}: CalendarioAsistenciaProps) => {
  const primerDia = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const lastDia = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

  const { data: registros, isLoading } = useRegistrosAsistencia({
    colaborador: colaboradorId,
    fecha_desde: primerDia,
    fecha_hasta: lastDia,
  });

  const today = new Date().toISOString().slice(0, 10);

  const registrosPorFecha = useMemo(() => {
    const map: Record<string, RegistroAsistencia> = {};
    if (registros) {
      registros.forEach((r) => {
        map[r.fecha] = r;
      });
    }
    return map;
  }, [registros]);

  // Construir grid del calendario: semanas x 7 días (L-D)
  const semanas = useMemo((): DiaCalendario[][] => {
    const primerFecha = new Date(anio, mes - 1, 1);
    // Día de la semana del primer día (0=Dom → convertir a L=0, D=6)
    let diaSemana = primerFecha.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
    diaSemana = diaSemana === 0 ? 6 : diaSemana - 1; // Convertir: Lun=0, Dom=6

    const dias: DiaCalendario[] = [];

    // Rellenar días vacíos al inicio
    for (let i = 0; i < diaSemana; i++) {
      dias.push({ dia: null, fecha: null, registro: null, esHoy: false, esFinSemana: false });
    }

    // Días del mes
    for (let d = 1; d <= ultimoDia; d++) {
      const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const diaTotal = (diaSemana + d - 1) % 7; // 0=Lun, 6=Dom
      const esFinSemana = diaTotal >= 5; // Sáb=5, Dom=6
      dias.push({
        dia: d,
        fecha,
        registro: registrosPorFecha[fecha] || null,
        esHoy: fecha === today,
        esFinSemana,
      });
    }

    // Rellenar hasta completar semanas completas
    while (dias.length % 7 !== 0) {
      dias.push({ dia: null, fecha: null, registro: null, esHoy: false, esFinSemana: false });
    }

    // Agrupar en semanas
    const result: DiaCalendario[][] = [];
    for (let i = 0; i < dias.length; i += 7) {
      result.push(dias.slice(i, i + 7));
    }
    return result;
  }, [anio, mes, ultimoDia, registrosPorFecha, today]);

  return (
    <Card variant="bordered" className="overflow-hidden">
      {/* Header del calendario */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onPrevMes}
        >
          <ChevronLeft size={18} />
        </Button>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {MESES_NOMBRES[mes]} {anio}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onNextMes}
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <Spinner size="md" className="mx-auto" />
        </div>
      ) : (
        <div className="p-3">
          {/* Encabezado días de la semana */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Semanas */}
          <div className="space-y-1">
            {semanas.map((semana, si) => (
              <div key={si} className="grid grid-cols-7 gap-1">
                {semana.map((diaObj, di) => {
                  if (!diaObj.dia) {
                    return <div key={di} className="h-10" />;
                  }

                  const config = diaObj.registro ? ESTADO_CONFIG[diaObj.registro.estado] : null;

                  return (
                    <div
                      key={di}
                      title={
                        diaObj.registro
                          ? `${config?.label || diaObj.registro.estado}${
                              diaObj.registro.minutos_tardanza > 0
                                ? ` (${diaObj.registro.minutos_tardanza} min tardanza)`
                                : ''
                            }`
                          : diaObj.esFinSemana
                            ? 'Fin de semana'
                            : 'Sin registro'
                      }
                      className={cn(
                        'h-10 flex flex-col items-center justify-center rounded-lg text-xs transition-colors',
                        diaObj.esHoy && !diaObj.registro
                          ? 'ring-2 ring-primary-500 ring-offset-1'
                          : '',
                        diaObj.registro && config
                          ? `${config.bg} ${config.text} font-medium`
                          : diaObj.esFinSemana
                            ? 'text-gray-400 dark:text-gray-600'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      <span className="font-medium">{diaObj.dia}</span>
                      {diaObj.registro && (
                        <span className="text-[10px] leading-tight opacity-75">
                          {diaObj.registro.estado === 'tardanza'
                            ? `${diaObj.registro.minutos_tardanza}m`
                            : diaObj.registro.horas_trabajadas
                              ? `${Number(diaObj.registro.horas_trabajadas).toFixed(0)}h`
                              : config?.label.slice(0, 3)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {(
                Object.entries(ESTADO_CONFIG) as [
                  EstadoAsistencia,
                  (typeof ESTADO_CONFIG)[EstadoAsistencia],
                ][]
              ).map(([estado, cfg]) => (
                <div key={estado} className="flex items-center gap-1">
                  <div className={cn('h-3 w-3 rounded-sm', cfg.bg)} />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
