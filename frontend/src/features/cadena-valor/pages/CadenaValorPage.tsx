/**
 * Pagina principal del Modulo 4 - Cadena de Valor
 *
 * Gestion completa de la cadena de valor:
 * - Trazabilidad de materias primas
 * - Control de calidad en cada etapa
 * - Certificaciones y documentacion
 * - Logistica y distribucion
 *
 * Usa Design System:
 * - PageHeader para encabezado
 * - StatsGrid para metricas
 * - Card para modulos
 */
import {
  GitBranch,
  FlaskConical,
  FileCheck,
  Truck,
  Package,
  AlertTriangle,
  CheckCircle2,
  Route
} from 'lucide-react';
import { PageHeader, StatsGrid } from '@/components/layout';
import { Card, Badge } from '@/components/common';
import type { StatItem } from '@/components/layout';
import { Link } from 'react-router-dom';

// Submodulos de Cadena de Valor
const subModulos = [
  {
    id: 'trazabilidad',
    name: 'Trazabilidad',
    description: 'Seguimiento completo de lotes desde origen hasta destino',
    icon: GitBranch,
    href: '/cadena-valor/trazabilidad',
    color: 'blue',
  },
  {
    id: 'calidad',
    name: 'Control de Calidad',
    description: 'Pruebas de acidez, impurezas, humedad y otros parametros',
    icon: FlaskConical,
    href: '/cadena-valor/calidad',
    color: 'green',
  },
  {
    id: 'certificaciones',
    name: 'Certificaciones',
    description: 'Emision y gestion de certificados de origen y calidad',
    icon: FileCheck,
    href: '/cadena-valor/certificaciones',
    color: 'purple',
  },
  {
    id: 'logistica',
    name: 'Logistica',
    description: 'Gestion de rutas, vehiculos y conductores',
    icon: Route,
    href: '/cadena-valor/logistica',
    color: 'orange',
  },
];

const statsItems: StatItem[] = [
  {
    label: 'Lotes en Proceso',
    value: '0',
    icon: Package,
    iconColor: 'primary',
  },
  {
    label: 'Certificados Emitidos',
    value: '0',
    icon: FileCheck,
    iconColor: 'success',
  },
  {
    label: 'Alertas Calidad',
    value: '0',
    icon: AlertTriangle,
    iconColor: 'warning',
  },
  {
    label: 'Entregas Completadas',
    value: '0',
    icon: CheckCircle2,
    iconColor: 'info',
  },
];

export const CadenaValorPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Cadena de Valor"
        description="Trazabilidad completa desde el origen hasta el destino final"
        actions={
          <Badge variant="info" size="lg">
            Modulo 4
          </Badge>
        }
      />

      {/* Stats */}
      <StatsGrid stats={statsItems} columns={4} macroprocessColor="blue" />

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
          <GitBranch className="h-12 w-12 mx-auto text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Trazabilidad Completa
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Este modulo permitira rastrear cada kilogramo de materia prima desde su origen
            hasta su transformacion y destino final, garantizando calidad y cumplimiento.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CadenaValorPage;
