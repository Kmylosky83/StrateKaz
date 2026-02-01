/**
 * Sección Resumen de Riesgos y Oportunidades
 * Vista general con KPIs y estadísticas
 */
import { useMemo } from 'react';
import { Card, Spinner, EmptyState } from '@/components/common';
import { StatsGrid, type StatItem } from '@/components/layout';
import {
  AlertTriangle,
  TrendingUp,
  Shield,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';

interface ResumenRiesgosSectionProps {
  triggerNewForm?: number;
}

// Datos mock para demostración
const MOCK_STATS = {
  totalRiesgos: 24,
  riesgosAltos: 5,
  riesgosMedios: 12,
  riesgosBajos: 7,
  totalOportunidades: 15,
  tratamientosActivos: 18,
  tratamientosCompletados: 32,
  efectividadPromedio: 78,
};

export function ResumenRiesgosSection({ triggerNewForm }: ResumenRiesgosSectionProps) {
  const stats: StatItem[] = useMemo(() => [
    {
      label: 'Total Riesgos',
      value: MOCK_STATS.totalRiesgos,
      icon: AlertTriangle,
      iconColor: 'text-orange-500',
      description: 'Riesgos identificados',
    },
    {
      label: 'Riesgos Altos',
      value: MOCK_STATS.riesgosAltos,
      icon: XCircle,
      iconColor: 'text-red-500',
      description: 'Requieren atención inmediata',
    },
    {
      label: 'Oportunidades',
      value: MOCK_STATS.totalOportunidades,
      icon: TrendingUp,
      iconColor: 'text-green-500',
      description: 'Identificadas',
    },
    {
      label: 'Efectividad',
      value: `${MOCK_STATS.efectividadPromedio}%`,
      icon: Target,
      iconColor: 'text-primary-500',
      description: 'Tratamientos efectivos',
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <StatsGrid stats={stats} columns={4} />

      {/* Distribución por nivel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Distribución de Riesgos
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Alto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-32">
                  <div className="h-2 bg-red-500 rounded-full" style={{ width: '21%' }} />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8">{MOCK_STATS.riesgosAltos}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Medio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-32">
                  <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '50%' }} />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8">{MOCK_STATS.riesgosMedios}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Bajo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-32">
                  <div className="h-2 bg-green-500 rounded-full" style={{ width: '29%' }} />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8">{MOCK_STATS.riesgosBajos}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-500" />
            Estado de Tratamientos
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">En progreso</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{MOCK_STATS.tratamientosActivos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Completados</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{MOCK_STATS.tratamientosCompletados}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Efectividad promedio</span>
              </div>
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{MOCK_STATS.efectividadPromedio}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ResumenRiesgosSection;
