/**
 * Tab de Despachos
 * Sub-tabs: Despachos, Manifiestos
 */
import { useState } from 'react';
import { Package, FileText, Edit, CheckCircle, Clock, Download } from 'lucide-react';
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
import { useDespachos, useManifiestos, useGenerarPDFManifiesto } from '../hooks/useLogisticsFleet';
import type { Despacho, Manifiesto } from '../types/logistics-fleet.types';
import DespachoFormModal from './DespachoFormModal';
import ManifiestoFormModal from './ManifiestoFormModal';

export function DespachosTab() {
  const [activeSubTab, setActiveSubTab] = useState('despachos');

  // Queries
  const { data: despachosData, isLoading: loadingDespachos } = useDespachos({});
  const { data: manifiestosData, isLoading: loadingManifiestos } = useManifiestos({});

  const despachos = Array.isArray(despachosData) ? despachosData : (despachosData?.results ?? []);
  const manifiestos = Array.isArray(manifiestosData)
    ? manifiestosData
    : (manifiestosData?.results ?? []);

  const generarPDFMutation = useGenerarPDFManifiesto();

  // Modal state - Despachos
  const [despachoModalOpen, setDespachoModalOpen] = useState(false);
  const [selectedDespacho, setSelectedDespacho] = useState<Despacho | null>(null);

  // Modal state - Manifiestos
  const [manifiestoModalOpen, setManifiestoModalOpen] = useState(false);
  const [selectedManifiesto, setSelectedManifiesto] = useState<Manifiesto | null>(null);

  // Handlers - Despachos
  const handleNewDespacho = () => {
    setSelectedDespacho(null);
    setDespachoModalOpen(true);
  };
  const handleEditDespacho = (item: Despacho) => {
    setSelectedDespacho(item);
    setDespachoModalOpen(true);
  };
  const handleCloseDespacho = () => {
    setSelectedDespacho(null);
    setDespachoModalOpen(false);
  };

  // Handlers - Manifiestos
  const handleNewManifiesto = () => {
    setSelectedManifiesto(null);
    setManifiestoModalOpen(true);
  };
  const handleCloseManifiesto = () => {
    setSelectedManifiesto(null);
    setManifiestoModalOpen(false);
  };

  // KPIs
  const stats = {
    totalDespachos: despachos.length,
    entregados: despachos.filter((d) => d.fecha_entrega_real).length,
    pendientes: despachos.filter((d) => !d.fecha_entrega_real).length,
    manifiestos: manifiestos.length,
  };

  const subTabs = [
    { id: 'despachos', label: 'Despachos', icon: <Package className="h-4 w-4" /> },
    { id: 'manifiestos', label: 'Manifiestos', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Despachos"
          value={stats.totalDespachos}
          icon={<Package className="w-6 h-6" />}
          color="blue"
        />
        <KpiCard
          label="Entregados"
          value={stats.entregados}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
        />
        <KpiCard
          label="Pendientes"
          value={stats.pendientes}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
        />
        <KpiCard
          label="Manifiestos"
          value={stats.manifiestos}
          icon={<FileText className="w-6 h-6" />}
          color="info"
        />
      </KpiCardGrid>

      {/* Sub-tabs */}
      <Tabs tabs={subTabs} activeTab={activeSubTab} onChange={setActiveSubTab} variant="pills" />

      {/* ===== Despachos ===== */}
      {activeSubTab === 'despachos' && (
        <div className="space-y-4">
          <SectionToolbar
            title="Control de Despachos"
            subtitle="Gestión de despachos y entregas"
            count={despachos.length}
            primaryAction={{ label: 'Nuevo Despacho', onClick: handleNewDespacho }}
          />

          {loadingDespachos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : despachos.length === 0 ? (
            <EmptyState
              icon={<Package className="w-16 h-16" />}
              title="No hay despachos registrados"
              description="Comience creando despachos para sus programaciones"
              action={{ label: 'Nuevo Despacho', onClick: handleNewDespacho }}
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
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Peso (kg)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor Declarado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Entrega Estimada
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
                    {despachos.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {d.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {d.cliente_nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {d.peso_total_kg}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          ${new Intl.NumberFormat('es-CO').format(d.valor_declarado)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(d.fecha_entrega_estimada).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={d.fecha_entrega_real ? 'success' : 'warning'} size="sm">
                            {d.estado_nombre || (d.fecha_entrega_real ? 'Entregado' : 'Pendiente')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditDespacho(d)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* ===== Manifiestos ===== */}
      {activeSubTab === 'manifiestos' && (
        <div className="space-y-4">
          <SectionToolbar
            title="Manifiestos de Carga"
            subtitle="Documentos RNDC para transporte de mercancía"
            count={manifiestos.length}
            primaryAction={{ label: 'Nuevo Manifiesto', onClick: handleNewManifiesto }}
          />

          {loadingManifiestos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : manifiestos.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-16 h-16" />}
              title="No hay manifiestos registrados"
              description="Genere manifiestos de carga para sus despachos"
              action={{ label: 'Nuevo Manifiesto', onClick: handleNewManifiesto }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        N° Manifiesto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Remitente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Destinatario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Ruta
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Peso (kg)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor Flete
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {manifiestos.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {m.numero_manifiesto}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {m.remitente_nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {m.destinatario_nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {m.origen_ciudad} → {m.destino_ciudad}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {m.peso_kg}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          ${new Intl.NumberFormat('es-CO').format(m.valor_flete)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {m.pdf_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(m.pdf_url!, '_blank')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generarPDFMutation.mutate(m.id)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
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
      <DespachoFormModal
        item={selectedDespacho}
        isOpen={despachoModalOpen}
        onClose={handleCloseDespacho}
      />
      <ManifiestoFormModal
        item={selectedManifiesto}
        isOpen={manifiestoModalOpen}
        onClose={handleCloseManifiesto}
      />
    </div>
  );
}
