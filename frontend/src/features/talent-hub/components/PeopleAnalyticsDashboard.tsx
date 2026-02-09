/**
 * PeopleAnalyticsDashboard - Dashboard de metricas de talento humano
 */

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserMinus,
  UserPlus,
  Clock,
  TrendingDown,
  GraduationCap,
} from 'lucide-react';
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
import { api } from '@/lib/api-client';

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

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#f97316',
];

const GENERO_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
  no_especificado: 'No especificado',
};

function usePeopleAnalytics() {
  return useQuery({
    queryKey: ['people-analytics'],
    queryFn: async () => {
      const response = await api.get<PeopleAnalyticsData>(
        '/talent-hub/people-analytics/'
      );
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6"><Skeleton className="h-64" /></Card>
          <Card className="p-6"><Skeleton className="h-64" /></Card>
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

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          label="Activos"
          value={data.headcount_activo}
        />
        <KPICard
          icon={<UserPlus className="w-5 h-5" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          label="Ingresos 12m"
          value={data.ingresos_12m}
        />
        <KPICard
          icon={<UserMinus className="w-5 h-5" />}
          iconBg="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
          label="Retiros 12m"
          value={data.retiros_12m}
        />
        <KPICard
          icon={<TrendingDown className="w-5 h-5" />}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          label="Rotacion"
          value={`${data.rotacion_12m}%`}
        />
        <KPICard
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          label="Antiguedad prom."
          value={
            data.antiguedad_promedio_meses != null
              ? `${data.antiguedad_promedio_meses}m`
              : '-'
          }
        />
        <KPICard
          icon={<GraduationCap className="w-5 h-5" />}
          iconBg="bg-teal-100 dark:bg-teal-900/30"
          iconColor="text-teal-600 dark:text-teal-400"
          label="Formacion"
          value={
            data.cumplimiento_formacion != null
              ? `${data.cumplimiento_formacion}%`
              : '-'
          }
        />
      </div>

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
                <YAxis
                  type="category"
                  dataKey="area"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              Sin datos de areas
            </p>
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
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  dataKey="value"
                >
                  {generoData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              Sin datos de genero
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}
