/**
 * Página: Movimientos Contables
 *
 * Gestión de comprobantes contables con datos reales del backend:
 * - Comprobantes: Lista y gestión de comprobantes
 * - Plantillas: Plantillas de asientos predefinidos
 * - Borradores: Comprobantes en estado borrador
 */
import { useState } from 'react';
import {
  FileSpreadsheet,
  Eye,
  Edit2,
  Copy,
  CheckCircle,
  Clock,
  Printer,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Tabs,
  Spinner,
  SectionToolbar,
  EmptyState,
} from '@/components/common';
import { Select } from '@/components/forms';
import {
  useComprobantes,
  useDetallesComprobante,
  useContabilizarComprobante,
  useAnularComprobante,
  useAprobarComprobante,
  usePlantillas,
  useGenerarComprobanteDesde,
  useTiposDocumento,
} from '../hooks';
import type {
  ComprobanteContableList,
  DetalleComprobante,
  AsientoPlantillaList,
  TipoDocumentoContableList,
} from '../types';
import ComprobanteFormModal from '../components/ComprobanteFormModal';
import AsientoPlantillaFormModal from '../components/AsientoPlantillaFormModal';

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

// ==================== MAIN COMPONENT ====================

export default function MovimientosContablesPage() {
  // Modal states
  const [comprobanteModal, setComprobanteModal] = useState(false);
  const [plantillaModal, setPlantillaModal] = useState(false);

  // Filter states
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Data hooks
  const { data: comprobantesData, isLoading: loadingComp } = useComprobantes({
    tipo_documento: tipoFilter ? Number(tipoFilter) : undefined,
    estado: estadoFilter || undefined,
    ordering: '-fecha_comprobante',
  });
  const { data: tiposData } = useTiposDocumento();
  const { data: detallesData } = useDetallesComprobante(selectedId ?? 0, { enabled: !!selectedId });
  const { data: borradoresData } = useComprobantes({ estado: 'borrador' });
  const { data: plantillasData, isLoading: loadingPlant } = usePlantillas();

  const contabilizar = useContabilizarComprobante();
  const anular = useAnularComprobante();
  const aprobar = useAprobarComprobante();
  const generarComprobante = useGenerarComprobanteDesde();

  const comprobantes = extractResults<ComprobanteContableList>(comprobantesData);
  const tipos = extractResults<TipoDocumentoContableList>(tiposData);
  const detalles = extractResults<DetalleComprobante>(detallesData);
  const borradores = extractResults<ComprobanteContableList>(borradoresData);
  const plantillas = extractResults<AsientoPlantillaList>(plantillasData);
  const selected = comprobantes.find((c) => c.id === selectedId);

  const tabs = [
    {
      id: 'comprobantes',
      label: 'Comprobantes',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Select label="" value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
                <option value="">Todos los tipos</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Select>
              <Select
                label=""
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="pendiente_aprobacion">Pendiente Aprobación</option>
                <option value="aprobado">Aprobado</option>
                <option value="contabilizado">Contabilizado</option>
                <option value="anulado">Anulado</option>
              </Select>
            </div>
            <Button variant="primary" size="sm" onClick={() => setComprobanteModal(true)}>
              Nuevo Comprobante
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              {loadingComp ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : comprobantes.length === 0 ? (
                <EmptyState
                  title="Sin comprobantes"
                  description="No se encontraron comprobantes con los filtros seleccionados"
                  actionLabel="Crear Comprobante"
                  onAction={() => setComprobanteModal(true)}
                />
              ) : (
                <Card variant="bordered" padding="none">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Número
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Concepto
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {comprobantes.map((comp) => {
                        const badge = getEstadoBadge(comp.estado);
                        return (
                          <tr
                            key={comp.id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${selectedId === comp.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                            onClick={() => setSelectedId(comp.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-mono text-sm font-medium text-primary-600">
                                  {comp.numero_comprobante}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {comp.tipo_documento_nombre}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {comp.fecha_comprobante}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                              {comp.concepto}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {formatCurrency(dec(comp.total_debito))}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={badge.variant} size="sm">
                                {badge.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="p-1">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {comp.estado === 'borrador' && (
                                  <Button variant="ghost" size="sm" className="p-1">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="p-1">
                                  <Printer className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>

            {/* Detalle del comprobante seleccionado */}
            <div>
              <Card variant="bordered" padding="md">
                {selected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Detalle del Comprobante
                      </h3>
                      <Badge
                        variant={
                          dec(selected.total_debito) === dec(selected.total_credito)
                            ? 'success'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {dec(selected.total_debito) === dec(selected.total_credito)
                          ? 'Cuadrado'
                          : 'Descuadrado'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Número:</span>
                        <span className="font-mono font-medium">{selected.numero_comprobante}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fecha:</span>
                        <span>{selected.fecha_comprobante}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tipo:</span>
                        <span>{selected.tipo_documento_nombre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estado:</span>
                        <Badge variant={getEstadoBadge(selected.estado).variant} size="sm">
                          {selected.estado_display ?? selected.estado}
                        </Badge>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Movimientos
                      </p>
                      {detalles.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Sin movimientos</p>
                      ) : (
                        <div className="space-y-2">
                          {detalles.map((det) => (
                            <div
                              key={det.id}
                              className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-mono text-primary-600">
                                    {det.cuenta_codigo}
                                  </span>
                                  <p className="text-gray-600 truncate max-w-[150px]">
                                    {det.cuenta_nombre}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {dec(det.debito) > 0 && (
                                    <p className="text-blue-600">
                                      {formatCurrency(dec(det.debito))}
                                    </p>
                                  )}
                                  {dec(det.credito) > 0 && (
                                    <p className="text-green-600">
                                      {formatCurrency(dec(det.credito))}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total Débitos:</span>
                        <span className="text-blue-600">
                          {formatCurrency(dec(selected.total_debito))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total Créditos:</span>
                        <span className="text-green-600">
                          {formatCurrency(dec(selected.total_credito))}
                        </span>
                      </div>
                    </div>

                    {selected.estado === 'borrador' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => contabilizar.mutate(selected.id)}
                          disabled={contabilizar.isPending}
                        >
                          {contabilizar.isPending ? 'Contabilizando...' : 'Contabilizar'}
                        </Button>
                      </div>
                    )}
                    {selected.estado === 'pendiente_aprobacion' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => aprobar.mutate(selected.id)}
                          disabled={aprobar.isPending}
                        >
                          Aprobar
                        </Button>
                      </div>
                    )}
                    {(selected.estado === 'contabilizado' || selected.estado === 'aprobado') && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() =>
                            anular.mutate({
                              id: selected.id,
                              motivo_anulacion: 'Anulación solicitada',
                            })
                          }
                          disabled={anular.isPending}
                        >
                          Anular
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Seleccione un comprobante para ver el detalle</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'plantillas',
      label: 'Plantillas',
      icon: <Copy className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <SectionToolbar
            actions={[
              {
                label: 'Nueva Plantilla',
                onClick: () => setPlantillaModal(true),
                variant: 'primary' as const,
              },
            ]}
          />

          {loadingPlant ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : plantillas.length === 0 ? (
            <EmptyState
              title="Sin plantillas"
              description="No se encontraron plantillas de asiento"
              actionLabel="Crear Plantilla"
              onAction={() => setPlantillaModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantillas.map((plantilla) => (
                <Card
                  key={plantilla.id}
                  variant="bordered"
                  padding="md"
                  className="hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <Badge variant={plantilla.is_active ? 'success' : 'secondary'} size="sm">
                      {plantilla.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {plantilla.nombre}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono mb-2">{plantilla.codigo}</p>
                  <p className="text-xs text-gray-400 mb-4">
                    Tipo: {plantilla.tipo_documento_codigo}
                  </p>
                  <div className="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        generarComprobante.mutate({
                          id: plantilla.id,
                          data: { fecha_comprobante: new Date().toISOString().split('T')[0] },
                        })
                      }
                      disabled={generarComprobante.isPending || !plantilla.is_active}
                    >
                      Usar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'borradores',
      label: 'Borradores',
      icon: <Clock className="w-4 h-4" />,
      badge: borradores.length > 0 ? String(borradores.length) : undefined,
      content: (
        <div className="space-y-4">
          {borradores.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-12 h-12 text-green-500" />}
              title="No hay borradores pendientes"
              description="Todos los comprobantes han sido contabilizados"
            />
          ) : (
            <Card variant="bordered" padding="none">
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {borradores.map((comp) => (
                    <tr key={comp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">
                        {comp.numero_comprobante}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {comp.tipo_documento_nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{comp.fecha_comprobante}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {comp.concepto}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                        {formatCurrency(dec(comp.total_debito))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {formatCurrency(dec(comp.total_credito))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => contabilizar.mutate(comp.id)}
                            disabled={contabilizar.isPending}
                          >
                            Contabilizar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos Contables"
        description="Gestión de comprobantes y asientos contables"
      />

      <Tabs tabs={tabs} defaultTab="comprobantes" />

      <ComprobanteFormModal
        item={null}
        isOpen={comprobanteModal}
        onClose={() => setComprobanteModal(false)}
      />
      <AsientoPlantillaFormModal
        item={null}
        isOpen={plantillaModal}
        onClose={() => setPlantillaModal(false)}
      />
    </div>
  );
}
