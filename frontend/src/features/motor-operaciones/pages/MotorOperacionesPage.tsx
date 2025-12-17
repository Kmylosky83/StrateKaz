/**
 * Pagina principal del Modulo 2 - Motor de Operaciones
 *
 * Submodulos:
 * - Cadena de Abastecimiento (Proveedores, Recolecciones, EcoNorte)
 * - Planta (Recepciones, Procesamiento, Lotes, Control de Calidad)
 * - Comercializacion (Clientes, Ventas, Facturacion)
 *
 * Usa Design System:
 * - PageHeader para encabezado
 * - StatsGrid para metricas
 * - Card para modulos
 */
import { Truck, Factory, ShoppingCart, TrendingUp, Package, Users } from 'lucide-react';
import { PageHeader, StatsGrid } from '@/components/layout';
import { Card, Badge } from '@/components/common';
import type { StatItem } from '@/components/layout';
import { Link } from 'react-router-dom';

// Submodulos del Motor de Operaciones
const subModulos = [
  {
    id: 'abastecimiento',
    name: 'Cadena de Abastecimiento',
    description: 'Gestion de proveedores, recolecciones y materia prima',
    icon: Truck,
    href: '/motor-operaciones/abastecimiento',
    color: 'blue',
    stats: { proveedores: 0, recolecciones: 0 },
  },
  {
    id: 'planta',
    name: 'Planta',
    description: 'Recepciones, procesamiento de lotes y control de calidad',
    icon: Factory,
    href: '/motor-operaciones/planta',
    color: 'green',
    stats: { recepciones: 0, lotes: 0 },
  },
  {
    id: 'comercializacion',
    name: 'Comercializacion',
    description: 'Gestion de clientes, ventas y facturacion',
    icon: ShoppingCart,
    href: '/motor-operaciones/comercializacion',
    color: 'orange',
    stats: { clientes: 0, ventas: 0 },
  },
];

const statsItems: StatItem[] = [
  {
    label: 'Proveedores Activos',
    value: '0',
    icon: Users,
    iconColor: 'primary',
  },
  {
    label: 'Recolecciones Mes',
    value: '0',
    icon: Truck,
    iconColor: 'info',
  },
  {
    label: 'Lotes Procesados',
    value: '0',
    icon: Package,
    iconColor: 'success',
  },
  {
    label: 'Ventas Mes',
    value: '$0',
    icon: TrendingUp,
    iconColor: 'warning',
  },
];

export const MotorOperacionesPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Motor de Operaciones"
        description="Gestiona la operacion core del negocio: abastecimiento, planta y comercializacion"
        actions={
          <Badge variant="primary" size="lg">
            Modulo 2
          </Badge>
        }
      />

      {/* Stats */}
      <StatsGrid stats={statsItems} columns={4} macroprocessColor="blue" />

      {/* Submodulos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subModulos.map((modulo) => {
          const Icon = modulo.icon;
          return (
            <Link key={modulo.id} to={modulo.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg bg-${modulo.color}-100 dark:bg-${modulo.color}-900/30`}>
                      <Icon className={`h-6 w-6 text-${modulo.color}-600 dark:text-${modulo.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {modulo.name}
                      </h3>
                      <Badge variant="gray" size="sm">
                        Proximamente
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {modulo.description}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Info Card */}
      <Card>
        <div className="p-6 text-center">
          <Factory className="h-12 w-12 mx-auto text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Modulo en Desarrollo
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Este modulo integrara todas las operaciones del negocio desde el abastecimiento
            hasta la comercializacion. Los submodulos se activaran progresivamente.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default MotorOperacionesPage;
