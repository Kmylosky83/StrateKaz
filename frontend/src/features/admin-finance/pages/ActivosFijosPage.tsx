/**
 * Página: Activos Fijos
 * Tabs: Activos, Mantenimiento, Depreciaciones, Hojas de Vida
 */
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  Building2,
  TrendingDown,
  Wrench,
  Edit,
  DollarSign,
  MapPin,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Card,
  Badge,
  Button,
  Tabs,
  Spinner,
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  EmptyState,
} from '@/components/common';
import { cn } from '@/utils/cn';
import {
  useActivosFijos,
  useActivosFijosEstadisticas,
  useProgramasMantenimiento,
  useDepreciaciones,
  useHojasVida,
} from '../hooks';
import type {
  ActivoFijo,
  ActivoFijoList,
  ProgramaMantenimiento,
  ProgramaMantenimientoList,
  DepreciacionList,
  HojaVidaActivo,
  HojaVidaActivoList,
} from '../types';
import ActivoFijoFormModal from '../components/ActivoFijoFormModal';
import ProgramaMantenimientoFormModal from '../components/ProgramaMantenimientoFormModal';
import HojaVidaActivoFormModal from '../components/HojaVidaActivoFormModal';

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

const getEstadoBadge = (
  estado: string
): { variant: 'success' | 'warning' | 'danger' | 'primary' | 'gray'; label: string } => {
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
  return map[estado] ?? { variant: 'gray', label: estado };
};

// ==================== MAIN COMPONENT ====================

export default function ActivosFijosPage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.ADMIN_FINANCE, Sections.INVENTARIO_ACTIVOS, 'create');

  const [activeTab, setActiveTab] = useState('inventario');

  // Modal state
  const [activoModal, setActivoModal] = useState(false);
  const [selectedActivo, setSelectedActivo] = useState<ActivoFijo | null>(null);
  const [mantModal, setMantModal] = useState(false);
  const [selectedMant, setSelectedMant] = useState<ProgramaMantenimiento | null>(null);
  const [hvModal, setHvModal] = useState(false);
  const [selectedHv, setSelectedHv] = useState<HojaVidaActivo | null>(null);

  // Queries
  const { data: activosData, isLoading: loadingActivos } = useActivosFijos();
  const { data: stats } = useActivosFijosEstadisticas();
  const { data: mantData, isLoading: loadingMant } = useProgramasMantenimiento();
  const { data: depData, isLoading: loadingDep } = useDepreciaciones();
  const { data: hvData, isLoading: loadingHv } = useHojasVida();

  const activos = extractResults<ActivoFijoList>(activosData);
  const mantenimientos = extractResults<ProgramaMantenimientoList>(mantData);
  const depreciaciones = extractResults<DepreciacionList>(depData);
  const hojas = extractResults<HojaVidaActivoList>(hvData);

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

      {/* ===== Inventario ===== */}
      {activeTab === 'inventario' && (
        <div className="space-y-6">
          <KpiCardGrid columns={4}>
            <KpiCard
              label="Total Activos"
              value={stats?.total_activos ?? activos.length}
              icon={<Building2 className="w-6 h-6" />}
              color="blue"
            />
            <KpiCard
              label="Valor Adquisición"
              value={formatCurrency(dec(stats?.valor_total_adquisicion))}
              icon={<DollarSign className="w-6 h-6" />}
              color="info"
            />
            <KpiCard
              label="Depreciación Acum."
              value={formatCurrency(dec(stats?.depreciacion_total_acumulada))}
              icon={<TrendingDown className="w-6 h-6" />}
              color="danger"
            />
            <KpiCard
              label="Valor en Libros"
              value={formatCurrency(dec(stats?.valor_total_en_libros))}
              icon={<DollarSign className="w-6 h-6" />}
              color="success"
            />
          </KpiCardGrid>

          <SectionToolbar
            title="Inventario de Activos"
            count={activos.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Nuevo Activo',
                    onClick: () => {
                      setSelectedActivo(null);
                      setActivoModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingActivos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : activos.length === 0 ? (
            <EmptyState
              icon={<Building2 className="w-16 h-16" />}
              title="No hay activos registrados"
              description="Registre los activos fijos de su empresa"
              action={{ label: 'Nuevo Activo', onClick: () => setActivoModal(true) }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Categoría
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Ubicación
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Adquisición
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor Libros
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {activos.map((activo) => {
                      const badge = getEstadoBadge(activo.estado);
                      return (
                        <tr key={activo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {activo.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {activo.nombre}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {activo.categoria_nombre}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {activo.ubicacion || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                            {formatCurrency(dec(activo.valor_adquisicion))}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right text-success-600">
                            {formatCurrency(dec(activo.valor_en_libros))}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={badge.variant} size="sm">
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedActivo(activo as unknown as ActivoFijo);
                                setActivoModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ===== Mantenimiento ===== */}
      {activeTab === 'mantenimiento' && (
        <div className="space-y-6">
          <SectionToolbar
            title="Programas de Mantenimiento"
            count={mantenimientos.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Programar Mantenimiento',
                    onClick: () => {
                      setSelectedMant(null);
                      setMantModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingMant ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : mantenimientos.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-16 h-16" />}
              title="No hay programas de mantenimiento"
              description="Programe mantenimientos preventivos o correctivos para sus activos"
              action={{ label: 'Programar Mantenimiento', onClick: () => setMantModal(true) }}
            />
          ) : (
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
                        <span className="text-gray-600 dark:text-gray-400">Próxima fecha</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {mant.proxima_fecha}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Días restantes</span>
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
                            `${mant.dias_para_mantenimiento} días`
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== Depreciaciones ===== */}
      {activeTab === 'depreciaciones' && (
        <div className="space-y-6">
          <SectionToolbar title="Depreciaciones" count={depreciaciones.length} />

          {loadingDep ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : depreciaciones.length === 0 ? (
            <EmptyState
              icon={<TrendingDown className="w-16 h-16" />}
              title="No hay depreciaciones registradas"
              description="Las depreciaciones se calculan automáticamente según la vida útil de los activos"
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Activo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Período
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Depreciación
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acumulada
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor Libros
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {depreciaciones.map((dep) => (
                      <tr key={dep.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {dep.activo_codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {dep.periodo_label}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-danger-600">
                          {formatCurrency(dec(dep.depreciacion_periodo))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                          {formatCurrency(dec(dep.depreciacion_acumulada))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(dec(dep.valor_en_libros))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ===== Hojas de Vida ===== */}
      {activeTab === 'hojas-vida' && (
        <div className="space-y-6">
          <SectionToolbar
            title="Hojas de Vida"
            count={hojas.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Nuevo Evento',
                    onClick: () => {
                      setSelectedHv(null);
                      setHvModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingHv ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : hojas.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-16 h-16" />}
              title="No hay registros en hojas de vida"
              description="Registre eventos de mantenimiento, reparaciones y traslados de activos"
              action={{ label: 'Nuevo Evento', onClick: () => setHvModal(true) }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Activo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tipo Evento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Costo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {hojas.map((hv) => (
                      <tr key={hv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {hv.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {hv.activo_codigo}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="primary" size="sm">
                            {hv.tipo_evento_display}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {hv.fecha}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                          {hv.descripcion}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(dec(hv.costo))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modals */}
      <ActivoFijoFormModal
        item={selectedActivo}
        isOpen={activoModal}
        onClose={() => {
          setSelectedActivo(null);
          setActivoModal(false);
        }}
      />
      <ProgramaMantenimientoFormModal
        item={selectedMant}
        isOpen={mantModal}
        onClose={() => {
          setSelectedMant(null);
          setMantModal(false);
        }}
      />
      <HojaVidaActivoFormModal
        item={selectedHv}
        isOpen={hvModal}
        onClose={() => {
          setSelectedHv(null);
          setHvModal(false);
        }}
      />
    </div>
  );
}
