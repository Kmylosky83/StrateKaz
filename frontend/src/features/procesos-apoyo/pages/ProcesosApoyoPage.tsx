/**
 * Pagina principal del Modulo 5 - Procesos de Apoyo
 *
 * Gestion de recursos y procesos de soporte:
 * - Talento Humano
 * - Financiero
 * - Tecnologia
 * - Juridico
 *
 * Usa Design System:
 * - PageHeader para encabezado
 * - StatsGrid para metricas
 * - Card para modulos
 */
import {
  Users,
  DollarSign,
  Monitor,
  Scale,
  UserCheck,
  Wallet,
  HardDrive,
  FileText
} from 'lucide-react';
import { PageHeader, StatsGrid } from '@/components/layout';
import { Card, Badge } from '@/components/common';
import type { StatItem } from '@/components/layout';
import { Link } from 'react-router-dom';

// Submodulos de Procesos de Apoyo
const subModulos = [
  {
    id: 'talento-humano',
    name: 'Talento Humano',
    description: 'Gestion de empleados, nomina, capacitaciones y bienestar',
    icon: Users,
    href: '/procesos-apoyo/talento-humano',
    color: 'blue',
  },
  {
    id: 'financiero',
    name: 'Financiero',
    description: 'Contabilidad, tesoreria, presupuesto y costos',
    icon: DollarSign,
    href: '/procesos-apoyo/financiero',
    color: 'green',
  },
  {
    id: 'tecnologia',
    name: 'Tecnologia',
    description: 'Equipos, software, soporte tecnico y seguridad IT',
    icon: Monitor,
    href: '/procesos-apoyo/tecnologia',
    color: 'purple',
  },
  {
    id: 'juridico',
    name: 'Juridico',
    description: 'Contratos, documentacion legal y cumplimiento normativo',
    icon: Scale,
    href: '/procesos-apoyo/juridico',
    color: 'orange',
  },
];

const statsItems: StatItem[] = [
  {
    label: 'Empleados Activos',
    value: '0',
    icon: UserCheck,
    iconColor: 'primary',
  },
  {
    label: 'Presupuesto Mes',
    value: '$0',
    icon: Wallet,
    iconColor: 'success',
  },
  {
    label: 'Equipos Activos',
    value: '0',
    icon: HardDrive,
    iconColor: 'info',
  },
  {
    label: 'Contratos Vigentes',
    value: '0',
    icon: FileText,
    iconColor: 'warning',
  },
];

export const ProcesosApoyoPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Procesos de Apoyo"
        description="Recursos y procesos de soporte para la operacion del negocio"
        actions={
          <Badge variant="success" size="lg">
            Modulo 5
          </Badge>
        }
      />

      {/* Stats */}
      <StatsGrid stats={statsItems} columns={4} macroprocessColor="green" />

      {/* Submodulos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Users className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Gestion de Recursos
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Este modulo centralizara la gestion de todos los recursos de apoyo necesarios
            para el funcionamiento optimo de la organizacion.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ProcesosApoyoPage;
