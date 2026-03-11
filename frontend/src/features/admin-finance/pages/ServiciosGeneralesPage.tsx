/**
 * Página: Servicios Generales
 * Tabs: Contratos, Mantenimientos Locativos, Servicios Públicos
 */
import { useState } from 'react';
import { Wrench, FileText, Zap, Edit, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
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
import {
  useContratosServicios,
  useContratosVigentes,
  useContratosPorVencer,
  useMantenimientosLocativos,
  useServiciosPublicos,
  useCreateServicioPublico,
} from '../hooks';
import type {
  ContratoServicio,
  ContratoServicioList,
  MantenimientoLocativo,
  MantenimientoLocativoList,
  ServicioPublico,
  ServicioPublicoList,
} from '../types';
import ContratoServicioFormModal from '../components/ContratoServicioFormModal';
import MantenimientoLocativoFormModal from '../components/MantenimientoLocativoFormModal';
import ServicioPublicoFormModal from '../components/ServicioPublicoFormModal';

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
    vigente: { variant: 'success', label: 'Vigente' },
    suspendido: { variant: 'warning', label: 'Suspendido' },
    terminado: { variant: 'gray', label: 'Terminado' },
    vencido: { variant: 'danger', label: 'Vencido' },
    solicitado: { variant: 'primary', label: 'Solicitado' },
    programado: { variant: 'primary', label: 'Programado' },
    en_ejecucion: { variant: 'warning', label: 'En ejecución' },
    completado: { variant: 'success', label: 'Completado' },
    cancelado: { variant: 'gray', label: 'Cancelado' },
    pendiente: { variant: 'warning', label: 'Pendiente' },
    pagado: { variant: 'success', label: 'Pagado' },
  };
  return map[estado] ?? { variant: 'gray', label: estado };
};

// ==================== MAIN COMPONENT ====================

export default function ServiciosGeneralesPage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.ADMIN_FINANCE, Sections.GESTION_SERVICIOS, 'create');

  const [activeTab, setActiveTab] = useState('contratos');

  // Modal state
  const [contratoModal, setContratoModal] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<ContratoServicio | null>(null);
  const [mantModal, setMantModal] = useState(false);
  const [selectedMant, setSelectedMant] = useState<MantenimientoLocativo | null>(null);
  const [spModal, setSpModal] = useState(false);
  const [selectedSp, setSelectedSp] = useState<ServicioPublico | null>(null);

  // Queries
  const { data: contratosData, isLoading: loadingContratos } = useContratosServicios();
  const { data: vigentesData } = useContratosVigentes();
  const { data: porVencerData } = useContratosPorVencer();
  const { data: mantData, isLoading: loadingMant } = useMantenimientosLocativos();
  const { data: spData, isLoading: loadingSp } = useServiciosPublicos();

  // Mutations
  const createSpMut = useCreateServicioPublico();

  const contratos = extractResults<ContratoServicioList>(contratosData);
  const numVigentes = vigentesData?.count ?? extractResults(vigentesData).length;
  const numPorVencer = porVencerData?.count ?? extractResults(porVencerData).length;
  const mantenimientos = extractResults<MantenimientoLocativoList>(mantData);
  const servicios = extractResults<ServicioPublicoList>(spData);

  const totalMensual = contratos
    .filter((c) => c.contrato_vigente)
    .reduce((s, c) => s + dec(c.valor_mensual), 0);
  const totalValorSp = servicios.reduce((s, sp) => s + dec(sp.valor), 0);
  const pendientesSp = servicios.filter((s) => s.estado_pago === 'pendiente').length;
  const vencidosSp = servicios.filter((s) => s.esta_vencido).length;

  const tabs = [
    { id: 'contratos', label: 'Contratos', icon: <FileText className="w-4 h-4" /> },
    { id: 'mantenimientos', label: 'Mantenimientos', icon: <Wrench className="w-4 h-4" /> },
    { id: 'servicios', label: 'Servicios Públicos', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Servicios Generales"
        description="Gestión de contratos, mantenimientos locativos y servicios públicos"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* ===== Contratos ===== */}
      {activeTab === 'contratos' && (
        <div className="space-y-6">
          <KpiCardGrid columns={4}>
            <KpiCard
              label="Contratos Vigentes"
              value={numVigentes}
              icon={<FileText className="w-6 h-6" />}
              color="blue"
            />
            <KpiCard
              label="Gasto Mensual"
              value={formatCurrency(totalMensual)}
              icon={<DollarSign className="w-6 h-6" />}
              color="success"
            />
            <KpiCard
              label="Por Vencer"
              value={numPorVencer}
              icon={<Clock className="w-6 h-6" />}
              color="warning"
            />
            <KpiCard
              label="Total Contratos"
              value={contratos.length}
              icon={<FileText className="w-6 h-6" />}
              color="info"
            />
          </KpiCardGrid>

          <SectionToolbar
            title="Contratos de Servicios"
            count={contratos.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Nuevo Contrato',
                    onClick: () => {
                      setSelectedContrato(null);
                      setContratoModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingContratos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : contratos.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-16 h-16" />}
              title="No hay contratos registrados"
              description="Registre los contratos de servicios tercerizados"
              action={{ label: 'Nuevo Contrato', onClick: () => setContratoModal(true) }}
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
                        Proveedor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Vigencia
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Mensual
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Total
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
                    {contratos.map((c) => {
                      const badge = getEstadoBadge(c.estado);
                      return (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {c.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {c.proveedor_nombre ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {c.tipo_servicio_display}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              {c.fecha_inicio} - {c.fecha_fin ?? 'Indefinido'}
                              {c.proximo_a_vencer && (
                                <AlertTriangle className="w-4 h-4 text-warning-600" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right">
                            {formatCurrency(dec(c.valor_mensual))}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right">
                            {formatCurrency(dec(c.valor_total))}
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
                                setSelectedContrato(c as unknown as ContratoServicio);
                                setContratoModal(true);
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

      {/* ===== Mantenimientos Locativos ===== */}
      {activeTab === 'mantenimientos' && (
        <div className="space-y-6">
          <SectionToolbar
            title="Mantenimientos Locativos"
            count={mantenimientos.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Nueva Solicitud',
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
              title="No hay mantenimientos locativos"
              description="Registre solicitudes de mantenimiento locativo"
              action={{ label: 'Nueva Solicitud', onClick: () => setMantModal(true) }}
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
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Ubicación
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha Solicitud
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Programada
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Responsable
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Costo Est.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Costo Real
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {mantenimientos.map((m) => {
                      const badge = getEstadoBadge(m.estado);
                      return (
                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {m.codigo}
                          </td>
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {m.ubicacion}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {m.fecha_solicitud}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {m.fecha_programada ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {m.responsable_nombre}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {formatCurrency(dec(m.costo_estimado))}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right">
                            {m.costo_real ? formatCurrency(dec(m.costo_real)) : '-'}
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
            </Card>
          )}
        </div>
      )}

      {/* ===== Servicios Públicos ===== */}
      {activeTab === 'servicios' && (
        <div className="space-y-6">
          <KpiCardGrid columns={4}>
            <KpiCard
              label="Total Servicios"
              value={formatCurrency(totalValorSp)}
              icon={<Zap className="w-6 h-6" />}
              color="blue"
            />
            <KpiCard
              label="Registrados"
              value={servicios.length}
              icon={<FileText className="w-6 h-6" />}
              color="info"
            />
            <KpiCard
              label="Pendientes"
              value={pendientesSp}
              icon={<Clock className="w-6 h-6" />}
              color="warning"
            />
            <KpiCard
              label="Vencidos"
              value={vencidosSp}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="danger"
            />
          </KpiCardGrid>

          <SectionToolbar
            title="Servicios Públicos"
            count={servicios.length}
            primaryAction={
              canCreate
                ? {
                    label: 'Registrar Servicio',
                    onClick: () => {
                      setSelectedSp(null);
                      setSpModal(true);
                    },
                  }
                : undefined
            }
          />

          {loadingSp ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : servicios.length === 0 ? (
            <EmptyState
              icon={<Zap className="w-16 h-16" />}
              title="No hay servicios públicos registrados"
              description="Registre los servicios públicos de la empresa"
              action={{ label: 'Registrar Servicio', onClick: () => setSpModal(true) }}
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
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Proveedor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Período
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Vencimiento
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {servicios.map((sp) => {
                      const badge = getEstadoBadge(sp.estado_pago);
                      return (
                        <tr key={sp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {sp.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {sp.tipo_servicio_display}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {sp.proveedor_nombre}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {sp.periodo_mes}/{sp.periodo_anio}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              {sp.fecha_vencimiento}
                              {sp.esta_vencido && (
                                <AlertTriangle className="w-4 h-4 text-danger-600" />
                              )}
                              {sp.proximo_a_vencer && !sp.esta_vencido && (
                                <Clock className="w-4 h-4 text-warning-600" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                            {formatCurrency(dec(sp.valor))}
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
            </Card>
          )}
        </div>
      )}

      {/* Modals */}
      <ContratoServicioFormModal
        item={selectedContrato}
        isOpen={contratoModal}
        onClose={() => {
          setSelectedContrato(null);
          setContratoModal(false);
        }}
      />
      <MantenimientoLocativoFormModal
        item={selectedMant}
        isOpen={mantModal}
        onClose={() => {
          setSelectedMant(null);
          setMantModal(false);
        }}
      />
      <ServicioPublicoFormModal
        item={selectedSp}
        isOpen={spModal}
        onClose={() => {
          setSelectedSp(null);
          setSpModal(false);
        }}
        onCreate={(data) =>
          createSpMut.mutate(data, {
            onSuccess: () => {
              setSelectedSp(null);
              setSpModal(false);
            },
          })
        }
        isLoading={createSpMut.isPending}
      />
    </div>
  );
}
