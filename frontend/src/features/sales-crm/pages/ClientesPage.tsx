/**
 * Página: Clientes - Sales CRM
 * Gestión completa de clientes, contactos y scoring
 */
import { useState } from 'react';
import { Users, UserPlus, Filter, Download, TrendingUp, Star, DollarSign, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { ClienteCard } from '../components/ClienteCard';
import { useClientes, useClienteDashboard } from '../hooks';

export default function ClientesPage() {
  const [filters, setFilters] = useState<any>({});

  const { data: clientesData, isLoading: isLoadingClientes } = useClientes(filters);
  const { data: dashboard, isLoading: isLoadingDashboard } = useClienteDashboard();

  if (isLoadingClientes || isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const clientes = clientesData?.results || [];
  const stats = dashboard || {
    total_clientes: 0,
    clientes_activos: 0,
    clientes_nuevos_mes: 0,
    clientes_alto_scoring: 0,
    total_saldo_pendiente: 0,
    promedio_scoring: 0,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Gestión de clientes, contactos y scoring de clientes"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_clientes}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clientes Activos</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.clientes_activos}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alto Scoring</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.clientes_alto_scoring}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">
                ${stats.total_saldo_pendiente.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Todos los Clientes ({clientes.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Clientes Grid */}
      {clientes.length === 0 ? (
        <EmptyState
          icon={<Users className="w-16 h-16" />}
          title="No hay clientes registrados"
          description="Comience agregando clientes a su sistema CRM"
          action={{
            label: 'Nuevo Cliente',
            onClick: () => console.log('Nuevo Cliente'),
            icon: <UserPlus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onView={(id) => console.log('Ver cliente', id)}
              onEdit={(id) => console.log('Editar cliente', id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
