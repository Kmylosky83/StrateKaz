/**
 * Pagina Principal: Contabilidad (Módulo Activable)
 *
 * Dashboard de contabilidad con datos reales del backend
 */
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  Link2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Calculator,
  FileText,
  Settings,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Button, Badge } from '@/components/common';
import { cn } from '@/utils/cn';
import {
  useConfiguracionContable,
  usePlanesCuentas,
  useCuentasContables,
  useComprobantes,
  useInformes,
  useGeneraciones,
  useColaPendientes,
  useColaErrores,
  useParametrosIntegracion,
} from '../hooks';

const dec = (v: string | number | null | undefined): number => Number(v ?? 0);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);

const extractResults = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const d = data as { results?: T[] };
  return d.results ?? [];
};

// ==================== COMPONENTS ====================

const ModuloCard = ({
  titulo,
  icono,
  color,
  stats,
  ruta,
}: {
  titulo: string;
  icono: React.ReactNode;
  color: string;
  stats: { label: string; value: string | number }[];
  ruta: string;
}) => {
  const navigate = useNavigate();

  return (
    <Card
      variant="bordered"
      padding="md"
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(ruta)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', color)}>
          {icono}
        </div>
        <ArrowUpRight className="w-5 h-5 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{titulo}</h3>

      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{stat.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

export default function AccountingPage() {
  const navigate = useNavigate();

  const { data: configData } = useConfiguracionContable();
  const { data: planesData } = usePlanesCuentas();
  const { data: cuentasData } = useCuentasContables({ is_active: true });
  const { data: comprobantesData } = useComprobantes({ ordering: '-created_at' });
  const { data: borradoresData } = useComprobantes({ estado: 'borrador' });
  const { data: informesData } = useInformes();
  const { data: generacionesData } = useGeneraciones({ ordering: '-created_at' });
  const { data: colaPendientesData } = useColaPendientes();
  const { data: colaErroresData } = useColaErrores();
  const { data: parametrosData } = useParametrosIntegracion();

  const configs = extractResults(configData);
  const config = configs[0];
  const planes = extractResults(planesData);
  const planActivo = planes.find((p) => p.es_activo);
  const cuentas = extractResults(cuentasData);
  const comprobantes = extractResults(comprobantesData);
  const borradores = extractResults(borradoresData);
  const informes = extractResults(informesData);
  const generaciones = extractResults(generacionesData);
  const colaPendientes = Array.isArray(colaPendientesData) ? colaPendientesData : [];
  const colaErrores = Array.isArray(colaErroresData) ? colaErroresData : [];
  const parametros = extractResults(parametrosData);
  const modulosActivos = new Set(parametros.filter((p) => p.activo).map((p) => p.modulo)).size;

  // KPIs de comprobantes del mes
  const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
  const compMes = comprobantes.filter((c) => c.fecha_comprobante?.startsWith(mesActual));
  const totalDebitos = compMes.reduce((sum, c) => sum + dec(c.total_debito), 0);
  const totalCreditos = compMes.reduce((sum, c) => sum + dec(c.total_credito), 0);

  // Últimas generaciones
  const ultimaGeneracion = generaciones[0];

  // Comprobantes recientes (top 5)
  const recientes = comprobantes.slice(0, 5);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'contabilizado':
        return { variant: 'success' as const, label: 'Contabilizado' };
      case 'aprobado':
        return { variant: 'primary' as const, label: 'Aprobado' };
      case 'pendiente_aprobacion':
        return { variant: 'warning' as const, label: 'Pend. Aprobación' };
      case 'borrador':
        return { variant: 'warning' as const, label: 'Borrador' };
      case 'anulado':
        return { variant: 'danger' as const, label: 'Anulado' };
      default:
        return { variant: 'secondary' as const, label: estado };
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contabilidad"
        description="Sistema de contabilidad integrado - Plan Único de Cuentas (PUC) Colombia"
      />

      {/* Información del Periodo */}
      <Card
        variant="bordered"
        padding="md"
        className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow">
              <Calculator className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {config
                  ? `Ejercicio ${config.fecha_inicio_ejercicio?.slice(0, 4) ?? '-'} - Periodo ${config.periodo_actual}`
                  : 'Cargando configuración...'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {planActivo?.nombre ?? 'Sin plan activo'} &bull; {cuentas.length} cuentas activas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config && (
              <Badge variant={config.ejercicio_abierto ? 'success' : 'danger'}>
                {config.ejercicio_abierto ? 'Periodo Abierto' : 'Periodo Cerrado'}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Settings className="w-4 h-4" />}
              onClick={() => navigate('/contabilidad/configuracion')}
            >
              Configuración
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Débitos del Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalDebitos)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Créditos del Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalCreditos)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprobantes</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{compMes.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          {borradores.length > 0 && (
            <p className="text-sm text-warning-600 mt-2">{borradores.length} pendientes</p>
          )}
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cola Integración</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {colaPendientes.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Link2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          {colaErrores.length > 0 && (
            <p className="text-sm text-danger-600 mt-2">{colaErrores.length} errores</p>
          )}
        </Card>
      </div>

      {/* Módulos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModuloCard
          titulo="Configuración Contable"
          icono={<BookOpen className="w-6 h-6 text-white" />}
          color="bg-primary-600"
          stats={[
            { label: 'Plan de cuentas', value: planActivo?.nombre ?? 'Sin plan' },
            { label: 'Cuentas activas', value: cuentas.length },
            { label: 'Ejercicio', value: config?.fecha_inicio_ejercicio?.slice(0, 4) ?? '-' },
          ]}
          ruta="/contabilidad/configuracion"
        />

        <ModuloCard
          titulo="Movimientos"
          icono={<FileSpreadsheet className="w-6 h-6 text-white" />}
          color="bg-blue-600"
          stats={[
            { label: 'Comprobantes mes', value: compMes.length },
            { label: 'Pendientes', value: borradores.length },
            {
              label: 'Débitos = Créditos',
              value: totalDebitos === totalCreditos ? 'Cuadrado' : 'Descuadrado',
            },
          ]}
          ruta="/contabilidad/movimientos"
        />

        <ModuloCard
          titulo="Informes Contables"
          icono={<BarChart3 className="w-6 h-6 text-white" />}
          color="bg-green-600"
          stats={[
            { label: 'Definiciones', value: informes.length },
            { label: 'Generados', value: generaciones.length },
            { label: 'Último', value: ultimaGeneracion?.created_at?.slice(0, 10) ?? '-' },
          ]}
          ruta="/contabilidad/informes"
        />

        <ModuloCard
          titulo="Integración"
          icono={<Link2 className="w-6 h-6 text-white" />}
          color="bg-orange-600"
          stats={[
            { label: 'Módulos integrados', value: modulosActivos },
            { label: 'En cola', value: colaPendientes.length },
            { label: 'Errores', value: colaErrores.length },
          ]}
          ruta="/contabilidad/integracion"
        />
      </div>

      {/* Comprobantes Recientes */}
      <Card variant="bordered" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comprobantes Recientes
          </h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/contabilidad/movimientos')}>
            Ver todos
          </Button>
        </div>
        {recientes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay comprobantes registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Débito
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Crédito
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recientes.map((comp) => {
                  const badge = getEstadoBadge(comp.estado);
                  return (
                    <tr key={comp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {comp.numero_comprobante}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="primary" size="sm">
                          {comp.tipo_documento_codigo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{comp.fecha_comprobante}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                        {comp.concepto}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-blue-600">
                        {formatCurrency(dec(comp.total_debito))}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-green-600">
                        {formatCurrency(dec(comp.total_credito))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
