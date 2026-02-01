/**
 * Página: Indicadores por Área
 *
 * Vista de KPIs organizados por 8 categorías:
 * - SST - Seguridad y Salud en el Trabajo
 * - PESV - Plan Estratégico de Seguridad Vial
 * - Ambiental
 * - Calidad
 * - Financiero
 * - Operacional
 * - RRHH
 * - Comercial
 */
import { useState } from 'react';
import {
  Shield,
  Truck,
  Leaf,
  Award,
  DollarSign,
  Settings,
  Users,
  TrendingUp,
  Plus,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== MOCK DATA ====================

const mockKPIsPorCategoria = {
  sst: [
    { id: 1, codigo: 'KPI-SST-001', nombre: 'Índice de Frecuencia de Accidentalidad', ultimo_valor: 2.3, meta: 2.5, unidad: 'IF', semaforo: 'verde', tendencia: 'descendente', variacion: -12.5, fecha: '2024-12-20' },
    { id: 2, codigo: 'KPI-SST-002', nombre: 'Índice de Severidad', ultimo_valor: 125.0, meta: 150.0, unidad: 'IS', semaforo: 'verde', tendencia: 'descendente', variacion: -16.7, fecha: '2024-12-20' },
    { id: 3, codigo: 'KPI-SST-003', nombre: 'Cobertura Exámenes Médicos', ultimo_valor: 95.0, meta: 100.0, unidad: '%', semaforo: 'amarillo', tendencia: 'ascendente', variacion: 2.2, fecha: '2024-12-18' },
    { id: 4, codigo: 'KPI-SST-004', nombre: 'Cumplimiento Capacitación SST', ultimo_valor: 88.0, meta: 90.0, unidad: '%', semaforo: 'amarillo', tendencia: 'ascendente', variacion: 4.8, fecha: '2024-12-15' },
  ],
  pesv: [
    { id: 5, codigo: 'KPI-PESV-001', nombre: 'Cumplimiento Inspección Preoperacional', ultimo_valor: 68.0, meta: 90.0, unidad: '%', semaforo: 'rojo', tendencia: 'descendente', variacion: -8.1, fecha: '2024-12-20' },
    { id: 6, codigo: 'KPI-PESV-002', nombre: 'Índice de Accidentalidad Vial', ultimo_valor: 1.2, meta: 1.5, unidad: 'IAV', semaforo: 'verde', tendencia: 'descendente', variacion: -20.0, fecha: '2024-12-20' },
    { id: 7, codigo: 'KPI-PESV-003', nombre: 'Conductores Certificados', ultimo_valor: 92.0, meta: 100.0, unidad: '%', semaforo: 'amarillo', tendencia: 'ascendente', variacion: 5.7, fecha: '2024-12-10' },
  ],
  ambiental: [
    { id: 8, codigo: 'KPI-AMB-001', nombre: 'Consumo de Agua', ultimo_valor: 12500.0, meta: 15000.0, unidad: 'm³', semaforo: 'verde', tendencia: 'descendente', variacion: -16.7, fecha: '2024-12-20' },
    { id: 9, codigo: 'KPI-AMB-002', nombre: 'Generación de Residuos Peligrosos', ultimo_valor: 125.0, meta: 100.0, unidad: 'kg', semaforo: 'rojo', tendencia: 'ascendente', variacion: 25.0, fecha: '2024-12-20' },
    { id: 10, codigo: 'KPI-AMB-003', nombre: 'Reciclaje', ultimo_valor: 45.0, meta: 50.0, unidad: '%', semaforo: 'amarillo', tendencia: 'ascendente', variacion: 12.5, fecha: '2024-12-18' },
  ],
  calidad: [
    { id: 11, codigo: 'KPI-CAL-001', nombre: 'No Conformidades Proceso', ultimo_valor: 12.0, meta: 8.0, unidad: 'NC', semaforo: 'rojo', tendencia: 'ascendente', variacion: 33.3, fecha: '2024-12-20' },
    { id: 12, codigo: 'KPI-CAL-002', nombre: 'Índice de Calidad', ultimo_valor: 96.5, meta: 95.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 1.6, fecha: '2024-12-20' },
    { id: 13, codigo: 'KPI-CAL-003', nombre: 'Cumplimiento Auditorías', ultimo_valor: 94.0, meta: 95.0, unidad: '%', semaforo: 'amarillo', tendencia: 'estable', variacion: 0.0, fecha: '2024-12-15' },
  ],
  financiero: [
    { id: 14, codigo: 'KPI-FIN-001', nombre: 'EBITDA', ultimo_valor: 18.5, meta: 15.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 23.4, fecha: '2024-12-20' },
    { id: 15, codigo: 'KPI-FIN-002', nombre: 'ROE', ultimo_valor: 22.3, meta: 20.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 11.5, fecha: '2024-12-20' },
    { id: 16, codigo: 'KPI-FIN-003', nombre: 'Liquidez Corriente', ultimo_valor: 1.8, meta: 1.5, unidad: 'ratio', semaforo: 'verde', tendencia: 'ascendente', variacion: 20.0, fecha: '2024-12-20' },
    { id: 17, codigo: 'KPI-FIN-004', nombre: 'Rotación de Cartera', ultimo_valor: 45.0, meta: 60.0, unidad: 'días', semaforo: 'amarillo', tendencia: 'descendente', variacion: -25.0, fecha: '2024-12-20' },
  ],
  operacional: [
    { id: 18, codigo: 'KPI-OP-001', nombre: 'Eficiencia Operacional', ultimo_valor: 82.0, meta: 85.0, unidad: '%', semaforo: 'amarillo', tendencia: 'estable', variacion: 0.5, fecha: '2024-12-20' },
    { id: 19, codigo: 'KPI-OP-002', nombre: 'Tiempo de Ciclo', ultimo_valor: 4.2, meta: 5.0, unidad: 'días', semaforo: 'verde', tendencia: 'descendente', variacion: -16.0, fecha: '2024-12-20' },
    { id: 20, codigo: 'KPI-OP-003', nombre: 'OEE (Efectividad Global)', ultimo_valor: 75.0, meta: 80.0, unidad: '%', semaforo: 'amarillo', tendencia: 'ascendente', variacion: 6.4, fecha: '2024-12-18' },
  ],
  rrhh: [
    { id: 21, codigo: 'KPI-RH-001', nombre: 'Rotación de Personal', ultimo_valor: 8.5, meta: 10.0, unidad: '%', semaforo: 'verde', tendencia: 'descendente', variacion: -15.0, fecha: '2024-12-20' },
    { id: 22, codigo: 'KPI-RH-002', nombre: 'Satisfacción Laboral', ultimo_valor: 4.3, meta: 4.0, unidad: '/5', semaforo: 'verde', tendencia: 'ascendente', variacion: 7.5, fecha: '2024-12-15' },
    { id: 23, codigo: 'KPI-RH-003', nombre: 'Índice de Capacitación', ultimo_valor: 92.0, meta: 90.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 8.2, fecha: '2024-12-18' },
    { id: 24, codigo: 'KPI-RH-004', nombre: 'Ausentismo', ultimo_valor: 3.5, meta: 4.0, unidad: '%', semaforo: 'verde', tendencia: 'descendente', variacion: -12.5, fecha: '2024-12-20' },
  ],
  comercial: [
    { id: 25, codigo: 'KPI-COM-001', nombre: 'Satisfacción del Cliente', ultimo_valor: 4.2, meta: 4.5, unidad: '/5', semaforo: 'amarillo', tendencia: 'descendente', variacion: -5.2, fecha: '2024-12-20' },
    { id: 26, codigo: 'KPI-COM-002', nombre: 'NPS', ultimo_valor: 65.0, meta: 70.0, unidad: 'score', semaforo: 'amarillo', tendencia: 'estable', variacion: 0.0, fecha: '2024-12-15' },
    { id: 27, codigo: 'KPI-COM-003', nombre: 'Retención de Clientes', ultimo_valor: 88.0, meta: 85.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 3.5, fecha: '2024-12-20' },
    { id: 28, codigo: 'KPI-COM-004', nombre: 'Crecimiento de Ventas', ultimo_valor: 12.5, meta: 10.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 25.0, fecha: '2024-12-20' },
  ],
};

// ==================== UTILITY FUNCTIONS ====================

const getSemaforoColor = (color: string) => {
  const colors = {
    verde: 'bg-green-500',
    amarillo: 'bg-yellow-500',
    rojo: 'bg-red-500',
  };
  return colors[color as keyof typeof colors] || 'bg-gray-500';
};

const getTendenciaIcon = (tendencia: string) => {
  if (tendencia === 'ascendente') return <ArrowUpRight className="w-4 h-4" />;
  if (tendencia === 'descendente') return <ArrowDownRight className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
};

// ==================== COMPONENTS ====================

const KPIListItem = ({ kpi }: { kpi: any }) => {
  const cumpleMeta = kpi.ultimo_valor >= kpi.meta;
  const porcentajeCumplimiento = (kpi.ultimo_valor / kpi.meta) * 100;

  return (
    <Card variant="bordered" padding="md">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn('w-3 h-3 rounded-full', getSemaforoColor(kpi.semaforo))}
              />
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {kpi.nombre}
              </h4>
            </div>
            <p className="text-xs text-gray-500">{kpi.codigo}</p>
          </div>
        </div>

        {/* Valor y Meta */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.ultimo_valor}
              <span className="text-sm font-normal text-gray-500 ml-1">
                {kpi.unidad}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              Meta: {kpi.meta} {kpi.unidad}
            </p>
          </div>

          {/* Tendencia */}
          <div className="text-right">
            <div
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mb-1',
                kpi.variacion > 0
                  ? 'bg-green-100 text-green-700'
                  : kpi.variacion < 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {getTendenciaIcon(kpi.tendencia)}
              <span>{Math.abs(kpi.variacion).toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3" />
              {format(new Date(kpi.fecha), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all', getSemaforoColor(kpi.semaforo))}
            style={{
              width: `${Math.min(porcentajeCumplimiento, 100)}%`,
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" size="sm" leftIcon={<Plus className="w-3 h-3" />}>
            Registrar Valor
          </Button>
          <Button variant="ghost" size="sm" leftIcon={<History className="w-3 h-3" />}>
            Historial
          </Button>
        </div>
      </div>
    </Card>
  );
};

const CategoriaSection = ({ categoria, kpis }: { categoria: string; kpis: any[] }) => {
  const kpisVerde = kpis.filter((k) => k.semaforo === 'verde').length;
  const kpisAmarillo = kpis.filter((k) => k.semaforo === 'amarillo').length;
  const kpisRojo = kpis.filter((k) => k.semaforo === 'rojo').length;

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total KPIs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{kpis.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Verde</p>
              <p className="text-xl font-bold text-green-600">{kpisVerde}</p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Amarillo</p>
              <p className="text-xl font-bold text-yellow-600">{kpisAmarillo}</p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Rojo</p>
              <p className="text-xl font-bold text-red-600">{kpisRojo}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* KPIs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <KPIListItem key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function IndicadoresAreaPage() {
  const [activeTab, setActiveTab] = useState('sst');

  const tabs = [
    { id: 'sst', label: 'SST', icon: <Shield className="w-4 h-4" /> },
    { id: 'pesv', label: 'PESV', icon: <Truck className="w-4 h-4" /> },
    { id: 'ambiental', label: 'Ambiental', icon: <Leaf className="w-4 h-4" /> },
    { id: 'calidad', label: 'Calidad', icon: <Award className="w-4 h-4" /> },
    { id: 'financiero', label: 'Financiero', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'operacional', label: 'Operacional', icon: <Settings className="w-4 h-4" /> },
    { id: 'rrhh', label: 'RRHH', icon: <Users className="w-4 h-4" /> },
    { id: 'comercial', label: 'Comercial', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const getTitulo = () => {
    const titulos: Record<string, string> = {
      sst: 'Seguridad y Salud en el Trabajo',
      pesv: 'Plan Estratégico de Seguridad Vial',
      ambiental: 'Gestión Ambiental',
      calidad: 'Calidad',
      financiero: 'Financiero',
      operacional: 'Operacional',
      rrhh: 'Recursos Humanos',
      comercial: 'Comercial',
    };
    return titulos[activeTab] || 'Indicadores';
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Indicadores por Área"
        description="KPIs organizados por categoría funcional y área de negocio"
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Registrar Valores
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {getTitulo()}
        </h2>

        {activeTab === 'sst' && (
          <CategoriaSection categoria="SST" kpis={mockKPIsPorCategoria.sst} />
        )}
        {activeTab === 'pesv' && (
          <CategoriaSection categoria="PESV" kpis={mockKPIsPorCategoria.pesv} />
        )}
        {activeTab === 'ambiental' && (
          <CategoriaSection categoria="Ambiental" kpis={mockKPIsPorCategoria.ambiental} />
        )}
        {activeTab === 'calidad' && (
          <CategoriaSection categoria="Calidad" kpis={mockKPIsPorCategoria.calidad} />
        )}
        {activeTab === 'financiero' && (
          <CategoriaSection categoria="Financiero" kpis={mockKPIsPorCategoria.financiero} />
        )}
        {activeTab === 'operacional' && (
          <CategoriaSection categoria="Operacional" kpis={mockKPIsPorCategoria.operacional} />
        )}
        {activeTab === 'rrhh' && (
          <CategoriaSection categoria="RRHH" kpis={mockKPIsPorCategoria.rrhh} />
        )}
        {activeTab === 'comercial' && (
          <CategoriaSection categoria="Comercial" kpis={mockKPIsPorCategoria.comercial} />
        )}
      </div>
    </div>
  );
}
