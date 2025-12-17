import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Users, Package, Truck, DollarSign } from 'lucide-react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const { companyName } = useBrandingConfig();

  const stats = [
    {
      name: 'Proveedores Activos',
      value: '45',
      change: '+5%',
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100 dark:bg-primary-900/20',
    },
    {
      name: 'Recolecciones Hoy',
      value: '12',
      change: '+8%',
      icon: Truck,
      color: 'text-success-600',
      bgColor: 'bg-success-100 dark:bg-success-900/20',
    },
    {
      name: 'Lotes en Proceso',
      value: '3',
      change: '0%',
      icon: Package,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100 dark:bg-warning-900/20',
    },
    {
      name: 'Liquidación del Mes',
      value: '$2.5M',
      change: '+15%',
      icon: DollarSign,
      color: 'text-info-600',
      bgColor: 'bg-info-100 dark:bg-info-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard {user?.cargo?.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Bienvenido de nuevo, {user?.first_name || user?.username}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.name} className="relative overflow-hidden">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 rounded-lg p-3 ${stat.bgColor}`}
                >
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>

                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <Badge variant="success" size="sm">
                      {stat.change}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Welcome Card */}
      <Card>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sistema Integrado de Gestión
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Bienvenido al sistema ERP de {companyName}. Aquí podrás
            gestionar proveedores, recolecciones, lotes de planta, liquidaciones y
            certificados de manera eficiente.
          </p>
          <Badge variant="primary" size="lg">
            Versión 1.0.0
          </Badge>
        </div>
      </Card>
    </div>
  );
};
