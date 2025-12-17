/**
 * Pagina principal del Modulo 3 - Gestion Integral
 *
 * Sistema Integrado de Gestion basado en:
 * - Decreto 1072/2015 y Resolucion 0312/2019 (SG-SST)
 * - ISO 9001:2015 (Calidad)
 * - ISO 14001:2015 (Ambiental)
 * - Resolucion 40595/2022 (PESV)
 *
 * Usa Design System:
 * - PageHeader para encabezado
 * - StatsGrid para metricas
 * - Card para modulos
 */
import {
  ShieldCheck,
  Award,
  Leaf,
  Car,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { PageHeader, StatsGrid } from '@/components/layout';
import { Card, Badge } from '@/components/common';
import type { StatItem } from '@/components/layout';
import { Link } from 'react-router-dom';

// Submodulos del Sistema Integrado de Gestion
const sistemasGestion = [
  {
    id: 'sst',
    name: 'SG-SST',
    fullName: 'Sistema de Gestion de Seguridad y Salud en el Trabajo',
    description: 'Decreto 1072/2015 - Resolucion 0312/2019',
    icon: ShieldCheck,
    href: '/gestion-integral/sst',
    color: 'orange',
    compliance: 0,
    status: 'pendiente',
  },
  {
    id: 'calidad',
    name: 'ISO 9001',
    fullName: 'Sistema de Gestion de Calidad',
    description: 'ISO 9001:2015 - Gestion de la Calidad',
    icon: Award,
    href: '/gestion-integral/calidad',
    color: 'blue',
    compliance: 0,
    status: 'pendiente',
  },
  {
    id: 'ambiental',
    name: 'ISO 14001',
    fullName: 'Sistema de Gestion Ambiental',
    description: 'ISO 14001:2015 - Gestion Ambiental',
    icon: Leaf,
    href: '/gestion-integral/ambiental',
    color: 'green',
    compliance: 0,
    status: 'pendiente',
  },
  {
    id: 'pesv',
    name: 'PESV',
    fullName: 'Plan Estrategico de Seguridad Vial',
    description: 'Resolucion 40595/2022 - Seguridad Vial',
    icon: Car,
    href: '/gestion-integral/pesv',
    color: 'purple',
    compliance: 0,
    status: 'pendiente',
  },
];

const statsItems: StatItem[] = [
  {
    label: 'Cumplimiento SG-SST',
    value: '0%',
    icon: ShieldCheck,
    iconColor: 'warning',
  },
  {
    label: 'No Conformidades',
    value: '0',
    icon: AlertTriangle,
    iconColor: 'danger',
  },
  {
    label: 'Acciones Correctivas',
    value: '0',
    icon: CheckCircle2,
    iconColor: 'success',
  },
  {
    label: 'Auditorias Pendientes',
    value: '0',
    icon: Clock,
    iconColor: 'info',
  },
];

export const GestionIntegralPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Gestion Integral"
        description="Sistema Integrado de Gestion: SST, Calidad, Ambiental y PESV"
        actions={
          <Badge variant="warning" size="lg">
            Modulo 3
          </Badge>
        }
      />

      {/* Stats */}
      <StatsGrid stats={statsItems} columns={4} macroprocessColor="orange" />

      {/* Sistemas de Gestion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sistemasGestion.map((sistema) => {
          const Icon = sistema.icon;
          return (
            <Link key={sistema.id} to={sistema.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-${sistema.color}-100 dark:bg-${sistema.color}-900/30 flex-shrink-0`}>
                      <Icon className={`h-6 w-6 text-${sistema.color}-600 dark:text-${sistema.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {sistema.name}
                        </h3>
                        <Badge variant="gray" size="sm">
                          Proximamente
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {sistema.fullName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {sistema.description}
                      </p>

                      {/* Progress bar placeholder */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Cumplimiento</span>
                          <span>{sistema.compliance}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${sistema.color}-500 transition-all`}
                            style={{ width: `${sistema.compliance}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Info Card */}
      <Card>
        <div className="p-6 text-center">
          <FileCheck className="h-12 w-12 mx-auto text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Sistema Integrado de Gestion
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Gestiona todos los sistemas de gestion de forma integrada. El modulo SG-SST
            ya se encuentra disponible con la estructura completa segun Resolucion 0312/2019.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default GestionIntegralPage;
