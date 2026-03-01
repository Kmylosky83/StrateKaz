/**
 * DashboardTiempo - Dashboard principal de Control de Tiempo
 * KPIs del mes actual, últimos 6 meses, acciones rápidas y calendario.
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Progress } from '@/components/common/Progress';
import { Spinner } from '@/components/common/Spinner';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import {
  UserCheck,
  Timer,
  AlertCircle,
  TrendingUp,
  Clock,
  LogIn,
  LogOut,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import {
  useEstadisticasAsistencia,
  useHorasExtras,
  useRegistrarMarcaje,
  useMisMarcajes,
} from '../../hooks/useControlTiempo';
import { CalendarioAsistencia } from './CalendarioAsistencia';
import type { MarcajeData } from '../../types';

interface KPICardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  colorBg: string;
  colorText: string;
  progress?: number;
}

const KPICard = ({ label, value, sublabel, icon, colorBg, colorText, progress }: KPICardProps) => (
  <Card variant="bordered" className="p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className={`mt-1 text-2xl font-bold ${colorText}`}>{value}</p>
        {sublabel && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sublabel}</p>}
        {progress !== undefined && (
          <div className="mt-2">
            <Progress value={progress} size="sm" />
          </div>
        )}
      </div>
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorBg}`}>{icon}</div>
    </div>
  </Card>
);

interface MarcajeRapidoProps {
  colaboradorId: number;
}

const MarcajeRapido = ({ colaboradorId }: MarcajeRapidoProps) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data: misMarcajes, isLoading } = useMisMarcajes(today);
  const registrarMarcaje = useRegistrarMarcaje();

  const marcajeHoy = misMarcajes || [];
  const tieneEntrada = marcajeHoy.some((m) => m.tipo === 'entrada');
  const tieneSalida = marcajeHoy.some((m) => m.tipo === 'salida');
  const tieneEntradaAlmuerzo = marcajeHoy.some((m) => m.tipo === 'entrada_almuerzo');
  const tieneSalidaAlmuerzo = marcajeHoy.some((m) => m.tipo === 'salida_almuerzo');

  const handleMarcaje = (tipo: MarcajeData['tipo']) => {
    registrarMarcaje.mutate({ colaborador_id: colaboradorId, tipo, metodo: 'web' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        HOY —{' '}
        {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={tieneEntrada ? 'ghost' : 'primary'}
          size="sm"
          onClick={() => handleMarcaje('entrada')}
          disabled={tieneEntrada || registrarMarcaje.isPending}
          className="w-full justify-center"
        >
          <LogIn size={14} className="mr-1.5" />
          {tieneEntrada ? 'Entrada ✓' : 'Marcar Entrada'}
        </Button>
        <Button
          variant={tieneSalida ? 'ghost' : 'primary'}
          size="sm"
          onClick={() => handleMarcaje('salida')}
          disabled={!tieneEntrada || tieneSalida || registrarMarcaje.isPending}
          className="w-full justify-center"
        >
          <LogOut size={14} className="mr-1.5" />
          {tieneSalida ? 'Salida ✓' : 'Marcar Salida'}
        </Button>
        <Button
          variant={tieneEntradaAlmuerzo ? 'ghost' : 'ghost'}
          size="sm"
          onClick={() => handleMarcaje('entrada_almuerzo')}
          disabled={!tieneEntrada || tieneEntradaAlmuerzo || registrarMarcaje.isPending}
          className="w-full justify-center text-xs"
        >
          {tieneEntradaAlmuerzo ? 'Salida Almuerzo ✓' : 'Salida Almuerzo'}
        </Button>
        <Button
          variant={tieneSalidaAlmuerzo ? 'ghost' : 'ghost'}
          size="sm"
          onClick={() => handleMarcaje('salida_almuerzo')}
          disabled={!tieneEntradaAlmuerzo || tieneSalidaAlmuerzo || registrarMarcaje.isPending}
          className="w-full justify-center text-xs"
        >
          {tieneSalidaAlmuerzo ? 'Regreso Almuerzo ✓' : 'Regreso Almuerzo'}
        </Button>
      </div>
      {marcajeHoy.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
          Últimos marcajes:{' '}
          {marcajeHoy
            .slice(-2)
            .map(
              (m) =>
                `${m.tipo_display} ${new Date(m.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
            )
            .join(' • ')}
        </div>
      )}
    </div>
  );
};

interface DashboardTiempoProps {
  /** Si se pasa, muestra el widget de marcaje rápido del colaborador */
  colaboradorId?: number;
  /** Función para ir a pestaña específica */
  onNavigateTab?: (tab: string) => void;
}

export const DashboardTiempo = ({ colaboradorId, onNavigateTab }: DashboardTiempoProps) => {
  const currentDate = new Date();
  const [calAnio, setCalAnio] = useState(currentDate.getFullYear());
  const [calMes, setCalMes] = useState(currentDate.getMonth() + 1);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  // Estadísticas del mes actual
  const primerDiaMes = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
  const hoy = currentDate.toISOString().slice(0, 10);

  const { data: estadisticas, isLoading: loadingStats } = useEstadisticasAsistencia({
    colaborador: colaboradorId,
    fecha_desde: primerDiaMes,
    fecha_hasta: hoy,
  });

  const { data: horasExtrasPendientes } = useHorasExtras({ estado: 'pendiente' });
  const { data: horasExtrasAprobadas } = useHorasExtras({
    estado: 'aprobada',
    fecha_desde: primerDiaMes,
    fecha_hasta: hoy,
  });

  const handlePrevMes = () => {
    if (calMes === 1) {
      setCalMes(12);
      setCalAnio((a) => a - 1);
    } else {
      setCalMes((m) => m - 1);
    }
  };

  const handleNextMes = () => {
    if (calMes === 12) {
      setCalMes(1);
      setCalAnio((a) => a + 1);
    } else {
      setCalMes((m) => m + 1);
    }
  };

  const porcentajeAsistencia = estadisticas?.porcentaje_asistencia || 0;
  const totalHorasExtras = (horasExtrasAprobadas || []).reduce(
    (acc, h) => acc + Number(h.horas_trabajadas),
    0
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} variant="bordered" className="p-4 animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="% Asistencia"
            value={`${Number(porcentajeAsistencia).toFixed(1)}%`}
            sublabel={`${estadisticas?.presentes || 0} de ${estadisticas?.total_registros || 0} días`}
            icon={<UserCheck size={20} className="text-green-600 dark:text-green-400" />}
            colorBg="bg-green-50 dark:bg-green-900/20"
            colorText="text-green-700 dark:text-green-300"
            progress={Number(porcentajeAsistencia)}
          />
          <KPICard
            label="HE Aprobadas"
            value={`${totalHorasExtras.toFixed(1)}h`}
            sublabel="en el mes actual"
            icon={<Timer size={20} className="text-blue-600 dark:text-blue-400" />}
            colorBg="bg-blue-50 dark:bg-blue-900/20"
            colorText="text-blue-700 dark:text-blue-300"
          />
          <KPICard
            label="Tardanzas"
            value={estadisticas?.tardanzas || 0}
            sublabel={
              estadisticas?.total_minutos_tardanza
                ? `${estadisticas.total_minutos_tardanza} min acumulados`
                : 'sin tardanzas'
            }
            icon={<AlertCircle size={20} className="text-orange-600 dark:text-orange-400" />}
            colorBg="bg-orange-50 dark:bg-orange-900/20"
            colorText="text-orange-700 dark:text-orange-300"
          />
          <KPICard
            label="HE Pendientes"
            value={horasExtrasPendientes?.length || 0}
            sublabel="solicitudes por aprobar"
            icon={<TrendingUp size={20} className="text-violet-600 dark:text-violet-400" />}
            colorBg="bg-violet-50 dark:bg-violet-900/20"
            colorText="text-violet-700 dark:text-violet-300"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: marcaje rápido + estadísticas */}
        <div className="space-y-4">
          {/* Widget de marcaje rápido (si se pasa colaboradorId) */}
          {colaboradorId && (
            <Card variant="bordered" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-md ${colorClasses.badge}`}>
                  <Clock className={`h-4 w-4 ${colorClasses.icon}`} />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Marcar Asistencia
                </h4>
              </div>
              <MarcajeRapido colaboradorId={colaboradorId} />
            </Card>
          )}

          {/* Resumen del mes */}
          <Card variant="bordered" className="p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Resumen del Mes
            </h4>
            {loadingStats ? (
              <Spinner size="sm" className="mx-auto" />
            ) : (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Presentes</span>
                  <Badge variant="success" size="sm">
                    {estadisticas?.presentes || 0} días
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Ausentes</span>
                  <Badge variant="danger" size="sm">
                    {estadisticas?.ausentes || 0} días
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Tardanzas</span>
                  <Badge variant="warning" size="sm">
                    {estadisticas?.tardanzas || 0} días
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Permisos</span>
                  <Badge variant="info" size="sm">
                    {estadisticas?.permisos || 0} días
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Incapacidades</span>
                  <Badge variant="gray" size="sm">
                    {estadisticas?.incapacidades || 0} días
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Vacaciones</span>
                  <Badge variant="info" size="sm">
                    {estadisticas?.vacaciones || 0} días
                  </Badge>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Total Horas
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {Number(estadisticas?.total_horas_trabajadas || 0).toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Accesos rápidos */}
          <Card variant="bordered" className="p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Accesos Rápidos
            </h4>
            <div className="space-y-1">
              {[
                { label: 'Ver Asistencia', tab: 'asistencia', icon: <UserCheck size={14} /> },
                { label: 'Horas Extras', tab: 'horas-extras', icon: <Timer size={14} /> },
                { label: 'Turnos', tab: 'turnos', icon: <Clock size={14} /> },
                { label: 'Consolidados', tab: 'consolidados', icon: <Calendar size={14} /> },
              ].map((item) => (
                <Button
                  key={item.tab}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateTab?.(item.tab)}
                  className="w-full flex items-center justify-between !px-3 !py-2 text-sm text-gray-700 dark:text-gray-300 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500">{item.icon}</span>
                    {item.label}
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors"
                  />
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Columna derecha: Calendario de asistencia (2 columnas) */}
        <div className="lg:col-span-2">
          <CalendarioAsistencia
            colaboradorId={colaboradorId}
            anio={calAnio}
            mes={calMes}
            onPrevMes={handlePrevMes}
            onNextMes={handleNextMes}
          />
        </div>
      </div>
    </div>
  );
};
