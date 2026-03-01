/**
 * Tab PESV Operativo
 * Sub-tabs: Verificaciones, Costos de Operación
 * Cumplimiento Resolución 40595/2022
 */
import { useState } from 'react';
import { ClipboardCheck, DollarSign, CheckCircle, AlertTriangle, Clock, Edit } from 'lucide-react';
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
import { useVerificaciones, useCostosOperacion } from '../hooks/useLogisticsFleet';
import {
  TipoVerificacionLabels,
  ResultadoVerificacionLabels,
  ResultadoVerificacionColors,
  TipoCostoLabels,
} from '../types/logistics-fleet.types';
import type { VerificacionTercero, CostoOperacion } from '../types/logistics-fleet.types';
import VerificacionFormModal from './VerificacionFormModal';
import CostoOperacionFormModal from './CostoOperacionFormModal';

const colorToBadge = (color: string): 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
    green: 'success',
    yellow: 'warning',
    red: 'danger',
    blue: 'info',
    purple: 'info',
  };
  return map[color] || 'gray';
};

export function PesvOperativoTab() {
  const [activeSubTab, setActiveSubTab] = useState('verificaciones');

  // Queries
  const { data: verificacionesData, isLoading: loadingVerificaciones } = useVerificaciones({});
  const { data: costosData, isLoading: loadingCostos } = useCostosOperacion({});

  const verificaciones = Array.isArray(verificacionesData)
    ? verificacionesData
    : (verificacionesData?.results ?? []);
  const costos = Array.isArray(costosData) ? costosData : (costosData?.results ?? []);

  // Modal state - Verificaciones
  const [verificacionModalOpen, setVerificacionModalOpen] = useState(false);
  const [selectedVerificacion, setSelectedVerificacion] = useState<VerificacionTercero | null>(
    null
  );

  // Modal state - Costos
  const [costoModalOpen, setCostoModalOpen] = useState(false);
  const [selectedCosto, setSelectedCosto] = useState<CostoOperacion | null>(null);

  // Handlers - Verificaciones
  const handleNewVerificacion = () => {
    setSelectedVerificacion(null);
    setVerificacionModalOpen(true);
  };
  const handleCloseVerificacion = () => {
    setSelectedVerificacion(null);
    setVerificacionModalOpen(false);
  };

  // Handlers - Costos
  const handleNewCosto = () => {
    setSelectedCosto(null);
    setCostoModalOpen(true);
  };
  const handleCloseCosto = () => {
    setSelectedCosto(null);
    setCostoModalOpen(false);
  };

  // KPIs
  const statsVerificaciones = {
    total: verificaciones.length,
    aprobadas: verificaciones.filter((v) => v.resultado === 'APROBADO').length,
    conObservaciones: verificaciones.filter((v) => v.resultado === 'APROBADO_CON_OBSERVACIONES')
      .length,
    rechazadas: verificaciones.filter((v) => v.resultado === 'RECHAZADO').length,
  };

  const totalCostos = costos.reduce((sum, c) => sum + c.valor, 0);

  const subTabs = [
    { id: 'verificaciones', label: 'Verificaciones', icon: <ClipboardCheck className="h-4 w-4" /> },
    { id: 'costos', label: 'Costos de Operación', icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Verificaciones"
          value={statsVerificaciones.total}
          icon={<ClipboardCheck className="w-6 h-6" />}
          color="blue"
        />
        <KpiCard
          label="Aprobadas"
          value={statsVerificaciones.aprobadas}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
        />
        <KpiCard
          label="Con Observaciones"
          value={statsVerificaciones.conObservaciones}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
        />
        <KpiCard
          label="Rechazadas"
          value={statsVerificaciones.rechazadas}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
        />
      </KpiCardGrid>

      {/* Sub-tabs */}
      <Tabs tabs={subTabs} activeTab={activeSubTab} onChange={setActiveSubTab} variant="pills" />

      {/* ===== Verificaciones ===== */}
      {activeSubTab === 'verificaciones' && (
        <div className="space-y-4">
          <SectionToolbar
            title="Verificaciones PESV"
            subtitle="Inspecciones preoperacionales según Resolución 40595/2022"
            count={verificaciones.length}
            primaryAction={{ label: 'Nueva Verificación', onClick: handleNewVerificacion }}
          />

          {loadingVerificaciones ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : verificaciones.length === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="w-16 h-16" />}
              title="No hay verificaciones registradas"
              description="Realice inspecciones preoperacionales de sus vehículos"
              action={{ label: 'Nueva Verificación', onClick: handleNewVerificacion }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Vehículo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Inspector
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Resultado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Cumplimiento
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {verificaciones.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {v.vehiculo_placa}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {TipoVerificacionLabels[v.tipo]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(v.fecha).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {v.inspector_name || v.inspector_externo || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={colorToBadge(ResultadoVerificacionColors[v.resultado])}
                            size="sm"
                          >
                            {ResultadoVerificacionLabels[v.resultado]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {v.porcentaje_cumplimiento !== undefined
                            ? `${v.porcentaje_cumplimiento}%`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVerificacion(v);
                              setVerificacionModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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

      {/* ===== Costos de Operación ===== */}
      {activeSubTab === 'costos' && (
        <div className="space-y-4">
          <SectionToolbar
            title="Costos de Operación"
            subtitle={`Control de costos variables — Total: $${new Intl.NumberFormat('es-CO').format(totalCostos)}`}
            count={costos.length}
            primaryAction={{ label: 'Nuevo Costo', onClick: handleNewCosto }}
          />

          {loadingCostos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : costos.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-16 h-16" />}
              title="No hay costos registrados"
              description="Registre los costos operativos de sus vehículos"
              action={{ label: 'Nuevo Costo', onClick: handleNewCosto }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Vehículo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Factura
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        $/km
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {costos.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {c.vehiculo_placa}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {TipoCostoLabels[c.tipo_costo]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(c.fecha).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          ${new Intl.NumberFormat('es-CO').format(c.valor)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {c.factura_numero || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {c.costo_por_km
                            ? `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(c.costo_por_km)}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCosto(c);
                              setCostoModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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
      <VerificacionFormModal
        item={selectedVerificacion}
        isOpen={verificacionModalOpen}
        onClose={handleCloseVerificacion}
      />
      <CostoOperacionFormModal
        item={selectedCosto}
        isOpen={costoModalOpen}
        onClose={handleCloseCosto}
      />
    </div>
  );
}
