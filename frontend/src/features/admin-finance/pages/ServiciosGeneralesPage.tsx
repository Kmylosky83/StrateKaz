/**
 * Pagina: Servicios Generales
 *
 * Tabs: Contratos, Mantenimientos Locativos, Servicios Publicos
 * Conectada a hooks reales del backend.
 */
import { useState } from 'react';
import {
  Wrench,
  FileText,
  Zap,
  Plus,
  Eye,
  Edit,
  Clock,
  AlertTriangle,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import {
  useContratosServicios,
  useContratosVigentes,
  useContratosPorVencer,
  useMantenimientosLocativos,
  useServiciosPublicos,
} from '../hooks';
import type {
  ContratoServicioList,
  MantenimientoLocativoList,
  ServicioPublicoList,
} from '../types';

// ==================== HELPERS ====================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);

const dec = (val: string | number | undefined | null): number =>
  val != null ? Number(val) || 0 : 0;

const extractResults = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  return ((data as { results?: T[] }).results ?? []) as T[];
};

const getEstadoBadge = (estado: string) => {
  const map: Record<
    string,
    { variant: 'success' | 'warning' | 'danger' | 'primary' | 'gray'; label: string }
  > = {
    vigente: { variant: 'success', label: 'Vigente' },
    suspendido: { variant: 'warning', label: 'Suspendido' },
    terminado: { variant: 'gray', label: 'Terminado' },
    vencido: { variant: 'danger', label: 'Vencido' },
    solicitado: { variant: 'primary', label: 'Solicitado' },
    programado: { variant: 'primary', label: 'Programado' },
    en_ejecucion: { variant: 'warning', label: 'En ejecucion' },
    completado: { variant: 'success', label: 'Completado' },
    cancelado: { variant: 'gray', label: 'Cancelado' },
    pendiente: { variant: 'warning', label: 'Pendiente' },
    pagado: { variant: 'success', label: 'Pagado' },
  };
  return map[estado] ?? { variant: 'gray' as const, label: estado };
};

// ==================== SECTIONS ====================

const ContratosSection = () => {
  const { data: contratosData, isLoading } = useContratosServicios();
  const { data: vigentesData } = useContratosVigentes();
  const { data: porVencerData } = useContratosPorVencer();

  const contratos = extractResults<ContratoServicioList>(contratosData);
  const numVigentes = vigentesData?.count ?? extractResults(vigentesData).length;
  const numPorVencer = porVencerData?.count ?? extractResults(porVencerData).length;

  const totalMensual = contratos
    .filter((c) => c.contrato_vigente)
    .reduce((s, c) => s + dec(c.valor_mensual), 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contratos Vigentes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{numVigentes}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gasto Mensual</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalMensual)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Por Vencer</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{numPorVencer}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Contratos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {contratos.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Contratos de Servicios
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Contrato
        </Button>
      </div>

      {contratos.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vigencia
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Mensual
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contratos.map((c) => {
                  const badge = getEstadoBadge(c.estado);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {c.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {c.proveedor_nombre ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {c.tipo_servicio_display}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          {c.fecha_inicio} - {c.fecha_fin ?? 'Indefinido'}
                          {c.proximo_a_vencer && (
                            <AlertTriangle className="w-4 h-4 text-warning-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right">
                        {formatCurrency(dec(c.valor_mensual))}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right">
                        {formatCurrency(dec(c.valor_total))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay contratos registrados
          </p>
        </Card>
      )}
    </div>
  );
};

const MantenimientosLocativosSection = () => {
  const { data: mantData, isLoading } = useMantenimientosLocativos();
  const mantenimientos = extractResults<MantenimientoLocativoList>(mantData);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Mantenimientos Locativos
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Solicitud
        </Button>
      </div>

      {mantenimientos.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ubicacion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Solicitud
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Programada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Responsable
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Costo Est.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Costo Real
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mantenimientos.map((m) => {
                  const badge = getEstadoBadge(m.estado);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {m.codigo}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            m.tipo === 'preventivo'
                              ? 'primary'
                              : m.tipo === 'correctivo'
                                ? 'warning'
                                : 'info'
                          }
                          size="sm"
                        >
                          {m.tipo_display}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {m.ubicacion}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {m.fecha_solicitud}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {m.fecha_programada ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {m.responsable_nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {formatCurrency(dec(m.costo_estimado))}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right">
                        {m.costo_real ? formatCurrency(dec(m.costo_real)) : '-'}
                      </td>
                      <td className="px-6 py-4">
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
        </Card>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay mantenimientos locativos
          </p>
        </Card>
      )}
    </div>
  );
};

const ServiciosPublicosSection = () => {
  const { data: spData, isLoading } = useServiciosPublicos();
  const servicios = extractResults<ServicioPublicoList>(spData);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const totalValor = servicios.reduce((s, sp) => s + dec(sp.valor), 0);
  const pendientes = servicios.filter((s) => s.estado_pago === 'pendiente').length;
  const vencidos = servicios.filter((s) => s.esta_vencido).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Servicios</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalValor)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Registrados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {servicios.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{pendientes}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidos</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">{vencidos}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Servicios Publicos</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Registrar Servicio
        </Button>
      </div>

      {servicios.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Periodo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {servicios.map((sp) => {
                  const badge = getEstadoBadge(sp.estado_pago);
                  return (
                    <tr key={sp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {sp.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {sp.tipo_servicio_display}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {sp.proveedor_nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {sp.periodo_mes}/{sp.periodo_anio}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          {sp.fecha_vencimiento}
                          {sp.esta_vencido && <AlertTriangle className="w-4 h-4 text-danger-600" />}
                          {sp.proximo_a_vencer && !sp.esta_vencido && (
                            <Clock className="w-4 h-4 text-warning-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                        {formatCurrency(dec(sp.valor))}
                      </td>
                      <td className="px-6 py-4">
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
        </Card>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay servicios publicos registrados
          </p>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ServiciosGeneralesPage() {
  const [activeTab, setActiveTab] = useState('contratos');

  const tabs = [
    { id: 'contratos', label: 'Contratos', icon: <FileText className="w-4 h-4" /> },
    { id: 'mantenimientos', label: 'Mantenimientos', icon: <Wrench className="w-4 h-4" /> },
    { id: 'servicios', label: 'Servicios Publicos', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Servicios Generales"
        description="Gestion de contratos, mantenimientos locativos y servicios publicos"
      />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      <div className="mt-6">
        {activeTab === 'contratos' && <ContratosSection />}
        {activeTab === 'mantenimientos' && <MantenimientosLocativosSection />}
        {activeTab === 'servicios' && <ServiciosPublicosSection />}
      </div>
    </div>
  );
}
