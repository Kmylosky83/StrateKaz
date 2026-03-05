/**
 * PeopleAnalyticsDashboard - Dashboard de metricas de talento humano
 */

import { useQuery } from '@tanstack/react-query';
import { Users, UserMinus, UserPlus, Clock, TrendingDown, GraduationCap } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, Skeleton } from '@/components/common';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
import apiClient from '@/api/axios-config';
import { CHART_COLORS } from '@/constants/chart-colors';
import { queryKeys } from '@/lib/query-keys';

interface PeopleAnalyticsData {
  headcount_activo: number;
  headcount_inactivo: number;
  headcount_total: number;
  rotacion_12m: number;
  retiros_12m: number;
  ingresos_12m: number;
  antiguedad_promedio_meses: number | null;
  genero_distribucion: Record<string, number>;
  por_area: Array<{ area: string; total: number }>;
  cumplimiento_formacion: number | null;
}

const GENERO_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
  no_especificado: 'No especificado',
};

function usePeopleAnalytics() {
  return useQuery({
    queryKey: queryKeys.peopleAnalytics.all,
    queryFn: async () => {
      const response = await apiClient.get<PeopleAnalyticsData>('/talent-hub/people-analytics/');
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function PeopleAnalyticsDashboard() {
  const { data, isLoading } = usePeopleAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatsGridSkeleton count={6} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <Skeleton className="h-64" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-64" />
          </Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Preparar datos para charts
  const generoData = Object.entries(data.genero_distribucion).map(([key, value]) => ({
    name: GENERO_LABELS[key] || key,
    value,
  }));

  const areaData = data.por_area.slice(0, 10); // Top 10 areas

  const kpiStats: StatItem[] = [
    {
      label: 'Activos',
      value: data.headcount_activo,
      icon: Users,
      iconColor: 'info',
    },
    {
      label: 'Ingresos 12m',
      value: data.ingresos_12m,
      icon: UserPlus,
      iconColor: 'success',
    },
    {
      label: 'Retiros 12m',
      value: data.retiros_12m,
      icon: UserMinus,
      iconColor: 'danger',
    },
    {
      label: 'Rotacion',
      value: `${data.rotacion_12m}%`,
      icon: TrendingDown,
      iconColor: 'warning',
    },
    {
      label: 'Antiguedad prom.',
      value: data.antiguedad_promedio_meses != null ? `${data.antiguedad_promedio_meses}m` : '-',
      icon: Clock,
      iconColor: 'primary',
    },
    {
      label: 'Formacion',
      value: data.cumplimiento_formacion != null ? `${data.cumplimiento_formacion}%` : '-',
      icon: GraduationCap,
      iconColor: 'info',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <StatsGrid stats={kpiStats} columns={3} variant="compact" moduleColor="green" />

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Headcount por area */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Headcount por area
          </h3>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="area" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Sin datos de areas</p>
          )}
        </Card>

        {/* Distribucion por genero */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Distribucion por genero
          </h3>
          {generoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={generoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {generoData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Sin datos de genero</p>
          )}
        </Card>
      </div>
    </div>
  );
}
