/**
 * Pagina: Activos Fijos
 *
 * Tabs: Activos, Mantenimiento, Depreciaciones, Hojas de Vida
 * Conectada a hooks reales del backend.
 */
import { useState } from 'react';
import {
  Building2,
  TrendingDown,
  Wrench,
  Plus,
  Eye,
  Edit,
  DollarSign,
  MapPin,
  Loader2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import {
  useActivosFijos,
  useActivosFijosEstadisticas,
  useProgramasMantenimiento,
  useDepreciaciones,
  useHojasVida,
} from '../hooks';
import type {
  ActivoFijoList,
  ProgramaMantenimientoList,
  DepreciacionList,
  HojaVidaActivoList,
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
    activo: { variant: 'success', label: 'Activo' },
    en_mantenimiento: { variant: 'warning', label: 'En mantenimiento' },
    dado_de_baja: { variant: 'danger', label: 'Dado de baja' },
    vendido: { variant: 'gray', label: 'Vendido' },
    programado: { variant: 'primary', label: 'Programado' },
    en_proceso: { variant: 'warning', label: 'En proceso' },
    completado: { variant: 'success', label: 'Completado' },
    cancelado: { variant: 'gray', label: 'Cancelado' },
  };
  return map[estado] ?? { variant: 'gray' as const, label: estado };
};

// ==================== SECTIONS ====================

const InventarioSection = () => {
  const { data: activosData, isLoading } = useActivosFijos();
  const { data: stats } = useActivosFijosEstadisticas();

  const activos = extractResults<ActivoFijoList>(activosData);

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
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.total_activos ?? activos.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Adquisicion</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(dec(stats?.valor_total_adquisicion))}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Depreciacion Acum.</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {formatCurrency(dec(stats?.depreciacion_total_acumulada))}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor en Libros</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {formatCurrency(dec(stats?.valor_total_en_libros))}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Inventario de Activos
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Activo
        </Button>
      </div>

      {/* Table */}
      {activos.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ubicacion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Adquisicion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor Libros
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
                {activos.map((activo) => {
                  const badge = getEstadoBadge(activo.estado);
                  return (
                    <tr key={activo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {activo.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {activo.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {activo.categoria_nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {activo.ubicacion || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(dec(activo.valor_adquisicion))}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-success-600">
                        {formatCurrency(dec(activo.valor_en_libros))}
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
            No hay activos registrados
          </p>
        </Card>
      )}
    </div>
  );
};

const MantenimientoSection = () => {
  const { data: mantData, isLoading } = useProgramasMantenimiento();
  const mantenimientos = extractResults<ProgramaMantenimientoList>(mantData);

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
          Programas de Mantenimiento
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Programar Mantenimiento
        </Button>
      </div>

      {mantenimientos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mantenimientos.map((mant) => {
            const badge = getEstadoBadge(mant.estado);
            return (
              <Card key={mant.id} variant="bordered" padding="md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {mant.activo_codigo}
                    </h4>
                    <Badge
                      variant={
                        mant.tipo === 'preventivo'
                          ? 'primary'
                          : mant.tipo === 'predictivo'
                            ? 'info'
                            : 'warning'
                      }
                      size="sm"
                    >
                      {mant.tipo_display}
                    </Badge>
                  </div>
                  <Badge variant={badge.variant} size="sm">
                    {badge.label}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Proxima fecha</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {mant.proxima_fecha}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Dias restantes</span>
                    <span
                      className={cn(
                        'font-medium',
                        mant.dias_para_mantenimiento < 0
                          ? 'text-danger-600'
                          : mant.dias_para_mantenimiento < 7
                            ? 'text-warning-600'
                            : 'text-success-600'
                      )}
                    >
                      {mant.dias_para_mantenimiento < 0 ? (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Vencido (
                          {Math.abs(mant.dias_para_mantenimiento)}d)
                        </span>
                      ) : (
                        `${mant.dias_para_mantenimiento} dias`
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                    Editar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay programas de mantenimiento
          </p>
        </Card>
      )}
    </div>
  );
};

const DepreciacionesSection = () => {
  const { data: depData, isLoading } = useDepreciaciones();
  const depreciaciones = extractResults<DepreciacionList>(depData);

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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Depreciaciones</h3>
      </div>

      {depreciaciones.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Activo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Periodo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Depreciacion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acumulada
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor Libros
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {depreciaciones.map((dep) => (
                  <tr key={dep.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {dep.activo_codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {dep.periodo_label}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-danger-600">
                      {formatCurrency(dec(dep.depreciacion_periodo))}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                      {formatCurrency(dec(dep.depreciacion_acumulada))}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                      {formatCurrency(dec(dep.valor_en_libros))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay depreciaciones registradas
          </p>
        </Card>
      )}
    </div>
  );
};

const HojasVidaSection = () => {
  const { data: hvData, isLoading } = useHojasVida();
  const hojas = extractResults<HojaVidaActivoList>(hvData);

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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hojas de Vida</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Evento
        </Button>
      </div>

      {hojas.length > 0 ? (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Activo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Descripcion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Costo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {hojas.map((hv) => (
                  <tr key={hv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {hv.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {hv.activo_codigo}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="primary" size="sm">
                        {hv.tipo_evento_display}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {hv.fecha}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {hv.descripcion}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                      {formatCurrency(dec(hv.costo))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card variant="bordered" padding="lg">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay registros en hojas de vida
          </p>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ActivosFijosPage() {
  const [activeTab, setActiveTab] = useState('inventario');

  const tabs = [
    { id: 'inventario', label: 'Activos', icon: <Building2 className="w-4 h-4" /> },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: <Wrench className="w-4 h-4" /> },
    { id: 'depreciaciones', label: 'Depreciaciones', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'hojas-vida', label: 'Hojas de Vida', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activos Fijos"
        description="Inventario, depreciaciones y mantenimiento de activos fijos"
      />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      <div className="mt-6">
        {activeTab === 'inventario' && <InventarioSection />}
        {activeTab === 'mantenimiento' && <MantenimientoSection />}
        {activeTab === 'depreciaciones' && <DepreciacionesSection />}
        {activeTab === 'hojas-vida' && <HojasVidaSection />}
      </div>
    </div>
  );
}
