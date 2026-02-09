/**
 * Gestión Ambiental HSEQ
 *
 * 6 subsecciones: Aspectos Ambientales, Gestión de Residuos, Vertimientos,
 * Emisiones Atmosféricas, Consumo de Recursos, Certificados Ambientales.
 */
import { useState } from 'react';
import {
  Leaf,
  Trash2,
  Droplet,
  Wind,
  Zap,
  FileCheck,
  Eye,
  Edit,
  Trash,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Tabs,
  Card,
  Button,
  EmptyState,
  Spinner,
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  StatusBadge,
} from '@/components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  useResiduos,
  useVertimientos,
  useEmisiones,
  useConsumos,
  useCertificados,
} from '../hooks/useGestionAmbiental';

// ==================== ASPECTOS AMBIENTALES SECTION ====================

const AspectosAmbientalesSection = () => {
  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Residuos Generados"
          value="2,450 kg"
          icon={<TrendingDown className="w-5 h-5" />}
          color="green"
          description="-12% vs mes anterior"
        />
        <KpiCard
          label="Tasa de Reciclaje"
          value="68%"
          icon={<BarChart3 className="w-5 h-5" />}
          color="info"
          valueColor="text-success-600 dark:text-success-400"
          description="+5% vs mes anterior"
        />
        <KpiCard
          label="Huella de Carbono"
          value="12.5 tCO₂e"
          icon={<Leaf className="w-5 h-5" />}
          color="warning"
          description="+3% vs año anterior"
        />
        <KpiCard
          label="Consumo de Agua"
          value="1,850 m³"
          icon={<Droplet className="w-5 h-5" />}
          color="primary"
          description="-8% vs mes anterior"
        />
      </KpiCardGrid>

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
          onClick: () => {},
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Registros"
          value={residuos.count}
          icon={<Trash2 className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Peligrosos"
          value="45 kg"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Reciclables"
          value="1,680 kg"
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="Orgánicos"
          value="725 kg"
          icon={<Leaf className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Registros de Residuos"
        primaryAction={{ label: 'Nuevo Registro', onClick: () => {} }}
      />

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
                    <StatusBadge status={residuo.tipo_movimiento} variant="info" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {residuo.area_generadora}
                  </td>
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
          onClick: () => {},
        }}
      />
    );
  }

  const conformes = vertimientos.results.filter((v) => v.cumple_normativa === true).length;
  const noConformes = vertimientos.results.filter((v) => v.cumple_normativa === false).length;
  const pctCumplimiento =
    vertimientos.count > 0 ? Math.round((conformes / vertimientos.count) * 100) : 0;

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Vertimientos"
          value={vertimientos.count}
          icon={<Droplet className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Conformes"
          value={conformes}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="No Conformes"
          value={noConformes}
          icon={<XCircle className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Cumplimiento"
          value={`${pctCumplimiento}%`}
          icon={<BarChart3 className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Registros de Vertimientos"
        primaryAction={{ label: 'Nuevo Vertimiento', onClick: () => {} }}
      />

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
          onClick: () => {},
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Mediciones"
          value={emisiones.count}
          icon={<Wind className="w-5 h-5" />}
          color="primary"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Emisiones Atmosféricas"
        primaryAction={{ label: 'Nueva Medición', onClick: () => {} }}
      />

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
          onClick: () => {},
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Registros"
          value={consumos.count}
          icon={<Zap className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Agua"
          value="1,850 m³"
          icon={<Droplet className="w-5 h-5" />}
          color="primary"
          valueColor="text-primary-600 dark:text-primary-400"
        />
        <KpiCard
          label="Energía"
          value="15,200 kWh"
          icon={<Zap className="w-5 h-5" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
        />
        <KpiCard
          label="CO₂ Generado"
          value="3.2 tCO₂"
          icon={<Leaf className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Consumo de Recursos"
        primaryAction={{ label: 'Nuevo Registro', onClick: () => {} }}
      />

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
          onClick: () => {},
        }}
      />
    );
  }

  const vigentes = certificados.results.filter((c) => c.vigente).length;
  const vencidos = certificados.results.filter((c) => !c.vigente).length;

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Certificados"
          value={certificados.count}
          icon={<FileCheck className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Vigentes"
          value={vigentes}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="Vencidos"
          value={vencidos}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Próximos a Vencer"
          value={3}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Certificados Ambientales"
        primaryAction={{ label: 'Nuevo Certificado', onClick: () => {} }}
      />

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

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

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
