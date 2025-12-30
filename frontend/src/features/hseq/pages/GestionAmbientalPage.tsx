/**
 * Página: Gestión Ambiental HSEQ
 *
 * Sistema completo de gestión ambiental con 6 subsecciones:
 * - Aspectos Ambientales
 * - Gestión de Residuos
 * - Vertimientos
 * - Emisiones Atmosféricas
 * - Consumo de Recursos
 * - Certificados Ambientales
 */
import { useState } from 'react';
import {
  Leaf,
  Trash2,
  Droplet,
  Wind,
  Zap,
  FileCheck,
  Plus,
  Download,
  Filter,
  Eye,
  Edit,
  Trash,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  useResiduos,
  useVertimientos,
  useEmisiones,
  useConsumos,
  useHuellasCarbono,
  useCertificados,
} from '../hooks/useGestionAmbiental';

import type {
  ClaseResiduo,
  TipoVertimiento,
  CuerpoReceptor,
  CategoriaRecurso,
  TipoCertificado,
} from '../types/gestion-ambiental.types';

// ==================== UTILITY FUNCTIONS ====================

const getClaseResiduoVariant = (clase: ClaseResiduo): 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<ClaseResiduo, 'success' | 'warning' | 'danger' | 'info'> = {
    PELIGROSO: 'danger',
    NO_PELIGROSO: 'success',
    RECICLABLE: 'info',
    ORGANICO: 'success',
    RAEE: 'warning',
    RCD: 'warning',
    ESPECIAL: 'warning',
  };
  return map[clase] || 'info';
};

const formatEstado = (estado: string): string => {
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

// ==================== ASPECTOS AMBIENTALES SECTION ====================

const AspectosAmbientalesSection = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Residuos Generados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">2,450 kg</p>
              <p className="text-xs text-success-600 mt-1">-12% vs mes anterior</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Reciclaje</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">68%</p>
              <p className="text-xs text-success-600 mt-1">+5% vs mes anterior</p>
            </div>
            <div className="w-12 h-12 bg-info-100 dark:bg-info-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-info-600 dark:text-info-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Huella de Carbono</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">12.5 tCO₂e</p>
              <p className="text-xs text-warning-600 mt-1">+3% vs año anterior</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Consumo de Agua</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">1,850 m³</p>
              <p className="text-xs text-success-600 mt-1">-8% vs mes anterior</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Droplet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>
      </div>

      <EmptyState
        icon={<Leaf className="w-16 h-16" />}
        title="Dashboard de Aspectos Ambientales"
        description="Vista general del desempeño ambiental de la organización"
      />
    </div>
  );
};

// ==================== GESTIÓN DE RESIDUOS SECTION ====================

const GestionResiduosSection = () => {
  const { data: residuos, isLoading } = useResiduos();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!residuos || residuos.results.length === 0) {
    return (
      <EmptyState
        icon={<Trash2 className="w-16 h-16" />}
        title="No hay registros de residuos"
        description="Comience registrando la generación y disposición de residuos"
        action={{
          label: 'Nuevo Registro',
          onClick: () => console.log('Nuevo Registro'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Registros</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{residuos.count}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Peligrosos</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">45 kg</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reciclables</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">1,680 kg</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Orgánicos</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">725 kg</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Registros de Residuos</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Registro
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo Residuo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Movimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {residuos.results.map((residuo) => (
                <tr key={residuo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(residuo.fecha), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {residuo.tipo_residuo_detalle?.nombre || `Residuo #${residuo.tipo_residuo}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {residuo.cantidad} {residuo.unidad_medida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="info" size="sm">
                      {formatEstado(residuo.tipo_movimiento)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{residuo.area_generadora}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash className="w-4 h-4 text-danger-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== VERTIMIENTOS SECTION ====================

const VertimientosSection = () => {
  const { data: vertimientos, isLoading } = useVertimientos();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!vertimientos || vertimientos.results.length === 0) {
    return (
      <EmptyState
        icon={<Droplet className="w-16 h-16" />}
        title="No hay registros de vertimientos"
        description="Comience registrando los vertimientos de aguas residuales"
        action={{
          label: 'Nuevo Vertimiento',
          onClick: () => console.log('Nuevo Vertimiento'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const conformes = vertimientos.results.filter((v) => v.cumple_normativa === true).length;
  const noConformes = vertimientos.results.filter((v) => v.cumple_normativa === false).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vertimientos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{vertimientos.count}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Droplet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Conformes</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{conformes}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">No Conformes</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{noConformes}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cumplimiento</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {vertimientos.count > 0 ? Math.round((conformes / vertimientos.count) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Registros de Vertimientos</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Vertimiento
          </Button>
        </div>
      </div>

      {/* Table Preview */}
      <Card variant="bordered" padding="md">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total de {vertimientos.count} vertimientos registrados
        </p>
      </Card>
    </div>
  );
};

// ==================== EMISIONES SECTION ====================

const EmisionesSection = () => {
  const { data: emisiones, isLoading } = useEmisiones();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!emisiones || emisiones.results.length === 0) {
    return (
      <EmptyState
        icon={<Wind className="w-16 h-16" />}
        title="No hay registros de emisiones"
        description="Comience registrando las emisiones atmosféricas de sus fuentes"
        action={{
          label: 'Nueva Emisión',
          onClick: () => console.log('Nueva Emisión'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Mediciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{emisiones.count}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Wind className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emisiones Atmosféricas</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Medición
        </Button>
      </div>

      <Card variant="bordered" padding="md">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total de {emisiones.count} mediciones registradas
        </p>
      </Card>
    </div>
  );
};

// ==================== CONSUMO DE RECURSOS SECTION ====================

const ConsumoRecursosSection = () => {
  const { data: consumos, isLoading } = useConsumos();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!consumos || consumos.results.length === 0) {
    return (
      <EmptyState
        icon={<Zap className="w-16 h-16" />}
        title="No hay registros de consumo"
        description="Comience registrando el consumo de recursos (agua, energía, etc.)"
        action={{
          label: 'Nuevo Consumo',
          onClick: () => console.log('Nuevo Consumo'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Registros</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{consumos.count}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Agua</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">1,850 m³</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Droplet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Energía</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">15,200 kWh</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">CO₂ Generado</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">3.2 tCO₂</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consumo de Recursos</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Registro
        </Button>
      </div>

      <Card variant="bordered" padding="md">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total de {consumos.count} registros de consumo
        </p>
      </Card>
    </div>
  );
};

// ==================== CERTIFICADOS SECTION ====================

const CertificadosSection = () => {
  const { data: certificados, isLoading } = useCertificados();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!certificados || certificados.results.length === 0) {
    return (
      <EmptyState
        icon={<FileCheck className="w-16 h-16" />}
        title="No hay certificados ambientales"
        description="Registre los certificados de disposición y cumplimiento ambiental"
        action={{
          label: 'Nuevo Certificado',
          onClick: () => console.log('Nuevo Certificado'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const vigentes = certificados.results.filter((c) => c.vigente).length;
  const vencidos = certificados.results.filter((c) => !c.vigente).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Certificados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{certificados.count}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vigentes</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{vigentes}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidos</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{vencidos}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Próximos a Vencer</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">3</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Certificados Ambientales</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Certificado
        </Button>
      </div>

      <Card variant="bordered" padding="md">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total de {certificados.count} certificados registrados
        </p>
      </Card>
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================

export default function GestionAmbientalPage() {
  const [activeTab, setActiveTab] = useState('aspectos');

  const tabs = [
    {
      id: 'aspectos',
      label: 'Aspectos Ambientales',
      icon: <Leaf className="w-4 h-4" />,
    },
    {
      id: 'residuos',
      label: 'Gestión de Residuos',
      icon: <Trash2 className="w-4 h-4" />,
    },
    {
      id: 'vertimientos',
      label: 'Vertimientos',
      icon: <Droplet className="w-4 h-4" />,
    },
    {
      id: 'emisiones',
      label: 'Emisiones Atmosféricas',
      icon: <Wind className="w-4 h-4" />,
    },
    {
      id: 'consumos',
      label: 'Consumo de Recursos',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: 'certificados',
      label: 'Certificados Ambientales',
      icon: <FileCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión Ambiental"
        description="Sistema integral de gestión ambiental: residuos, vertimientos, emisiones, consumo de recursos y certificados"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'aspectos' && <AspectosAmbientalesSection />}
        {activeTab === 'residuos' && <GestionResiduosSection />}
        {activeTab === 'vertimientos' && <VertimientosSection />}
        {activeTab === 'emisiones' && <EmisionesSection />}
        {activeTab === 'consumos' && <ConsumoRecursosSection />}
        {activeTab === 'certificados' && <CertificadosSection />}
      </div>
    </div>
  );
}
