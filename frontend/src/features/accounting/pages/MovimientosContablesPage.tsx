/**
 * Pagina: Movimientos Contables
 *
 * Gestion de comprobantes contables con datos reales del backend:
 * - Comprobantes: Lista y gestion de comprobantes
 * - Plantillas: Plantillas de asientos predefinidos
 * - Borradores: Comprobantes en estado borrador
 */
import { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  Clock,
  Download,
  Printer,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
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
import type { ComprobanteContableList, DetalleComprobante, AsientoPlantillaList } from '../types';

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
      return { variant: 'warning' as const, label: 'Pend. Aprobacion' };
    case 'borrador':
      return { variant: 'warning' as const, label: 'Borrador' };
    case 'anulado':
      return { variant: 'danger' as const, label: 'Anulado' };
    default:
      return { variant: 'secondary' as const, label: estado };
  }
};

// ==================== COMPONENTS ====================

const ComprobantesSection = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const { data: comprobantesData, isLoading } = useComprobantes({
    search: searchTerm || undefined,
    tipo_documento: tipoFilter ? Number(tipoFilter) : undefined,
    estado: estadoFilter || undefined,
    ordering: '-fecha_comprobante',
  });
  const { data: tiposData } = useTiposDocumento();
  const { data: detallesData } = useDetallesComprobante(selectedId ?? 0, { enabled: !!selectedId });
  const contabilizar = useContabilizarComprobante();
  const anular = useAnularComprobante();
  const aprobar = useAprobarComprobante();

  const comprobantes = extractResults<ComprobanteContableList>(comprobantesData);
  const tipos = extractResults(tiposData);
  const detalles = extractResults<DetalleComprobante>(detallesData);
  const selected = comprobantes.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar comprobante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
            />
          </div>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
          >
            <option value="">Todos los tipos</option>
            {tipos.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
          >
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="pendiente_aprobacion">Pendiente Aprobacion</option>
            <option value="aprobado">Aprobado</option>
            <option value="contabilizado">Contabilizado</option>
            <option value="anulado">Anulado</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de comprobantes */}
        <div className="lg:col-span-2">
          <Card variant="bordered" padding="none">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : comprobantes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No se encontraron comprobantes</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Numero
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
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                              {comp.concepto}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comp.tercero_nombre ?? '-'}
                            </span>
                          </div>
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
            )}
          </Card>
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
                    <span className="text-gray-500">Numero:</span>
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

                {/* Detalles / movimientos */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Movimientos</p>
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
                                <p className="text-blue-600">{formatCurrency(dec(det.debito))}</p>
                              )}
                              {dec(det.credito) > 0 && (
                                <p className="text-green-600">{formatCurrency(dec(det.credito))}</p>
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
                    <span>Total Debitos:</span>
                    <span className="text-blue-600">
                      {formatCurrency(dec(selected.total_debito))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Creditos:</span>
                    <span className="text-green-600">
                      {formatCurrency(dec(selected.total_credito))}
                    </span>
                  </div>
                </div>

                {/* Acciones segun estado */}
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
                      onClick={() => anular.mutate(selected.id)}
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
  );
};

const PlantillasSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: plantillasData, isLoading } = usePlantillas({ search: searchTerm || undefined });
  const generarComprobante = useGenerarComprobanteDesde();

  const plantillas = extractResults<AsientoPlantillaList>(plantillasData);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar plantilla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : plantillas.length === 0 ? (
        <Card variant="bordered" padding="lg">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sin plantillas
            </h3>
            <p className="text-gray-500">No se encontraron plantillas de asiento</p>
          </div>
        </Card>
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

              <h3 className="font-semibold text-gray-900 dark:text-white">{plantilla.nombre}</h3>
              <p className="text-sm text-gray-500 font-mono mb-2">{plantilla.codigo}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {plantilla.descripcion || '-'}
              </p>
              <p className="text-xs text-gray-400 mb-4">Tipo: {plantilla.tipo_documento_nombre}</p>

              <div className="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => generarComprobante.mutate(plantilla.id)}
                    disabled={generarComprobante.isPending || !plantilla.is_active}
                  >
                    Usar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const BorradoresSection = () => {
  const { data: borradoresData, isLoading } = useComprobantes({
    estado: 'borrador',
    ordering: '-created_at',
  });
  const contabilizar = useContabilizarComprobante();

  const borradores = extractResults<ComprobanteContableList>(borradoresData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {borradores.length === 0 ? (
        <Card variant="bordered" padding="lg">
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay borradores pendientes
            </h3>
            <p className="text-gray-500">Todos los comprobantes han sido contabilizados</p>
          </div>
        </Card>
      ) : (
        <Card variant="bordered" padding="none">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Numero
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
                  Debito
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Credito
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
                  <td className="px-4 py-3 text-sm text-gray-600">{comp.tipo_documento_nombre}</td>
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
  );
};

// ==================== MAIN COMPONENT ====================

export default function MovimientosContablesPage() {
  const { data: borradoresData } = useComprobantes({ estado: 'borrador' });
  const borradoresCount = extractResults(borradoresData).length;

  const tabs = [
    {
      id: 'comprobantes',
      label: 'Comprobantes',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      content: <ComprobantesSection />,
    },
    {
      id: 'plantillas',
      label: 'Plantillas',
      icon: <Copy className="w-4 h-4" />,
      content: <PlantillasSection />,
    },
    {
      id: 'borradores',
      label: 'Borradores',
      icon: <Clock className="w-4 h-4" />,
      badge: borradoresCount > 0 ? String(borradoresCount) : undefined,
      content: <BorradoresSection />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos Contables"
        description="Gestion de comprobantes y asientos contables"
      />

      <Tabs tabs={tabs} defaultTab="comprobantes" />
    </div>
  );
}
