/**
 * Tab de Gestión de Compras - Supply Chain
 *
 * Gestión de requisiciones, cotizaciones, órdenes de compra, contratos y recepciones
 */
import { useState } from 'react';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import {
  FileText,
  TrendingUp,
  ShoppingCart,
  FileSignature,
  PackageCheck,
  Plus,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useRequisiciones,
  useCotizaciones,
  useOrdenesCompra,
  useContratos,
  useRecepcionesCompra,
} from '../hooks';

// ==================== UTILITY FUNCTIONS ====================

const formatEstado = (estado: string): string => {
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

const getEstadoBadgeVariant = (estado: string): 'success' | 'primary' | 'warning' | 'danger' | 'gray' => {
  const estadosSuccess = ['APROBADA', 'COMPLETADA', 'VIGENTE', 'CONFORME'];
  const estadosPrimary = ['EN_PROCESO', 'EVALUACION', 'SELECCIONADA'];
  const estadosWarning = ['BORRADOR', 'PENDIENTE', 'SOLICITADA'];
  const estadosDanger = ['RECHAZADA', 'CANCELADA', 'VENCIDO', 'NO_CONFORME'];

  if (estadosSuccess.some(e => estado.includes(e))) return 'success';
  if (estadosPrimary.some(e => estado.includes(e))) return 'primary';
  if (estadosWarning.some(e => estado.includes(e))) return 'warning';
  if (estadosDanger.some(e => estado.includes(e))) return 'danger';
  return 'gray';
};

// ==================== REQUISICIONES SECTION ====================

const RequisicionesSection = () => {
  const { data, isLoading } = useRequisiciones();
  const requisiciones = data?.results || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  }

  if (requisiciones.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-16 h-16" />}
        title="No hay requisiciones registradas"
        description="Comience creando requisiciones de compra"
        action={{
          label: 'Nueva Requisición',
          onClick: () => console.log('Nueva Requisición'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Requisiciones de Compra</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Exportar</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nueva Requisición</Button>
        </div>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Solicitante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {requisiciones.map((req: any) => (
                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{req.numero}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(req.fecha_requisicion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{req.solicitante_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(req.prioridad_codigo)} size="sm">
                      {formatEstado(req.prioridad_nombre)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(req.estado_codigo)} size="sm">
                      {formatEstado(req.estado_nombre)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><CheckCircle className="w-4 h-4 text-success-600" /></Button>
                      <Button variant="ghost" size="sm"><XCircle className="w-4 h-4 text-danger-600" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== COTIZACIONES SECTION ====================

const CotizacionesSection = () => {
  const { data, isLoading } = useCotizaciones();
  const cotizaciones = data?.results || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  }

  if (cotizaciones.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-16 h-16" />}
        title="No hay cotizaciones registradas"
        description="Solicite cotizaciones a los proveedores"
        action={{
          label: 'Nueva Cotización',
          onClick: () => console.log('Nueva Cotización'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cotizaciones</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nueva Cotización</Button>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cotizaciones.map((cot: any) => (
                <tr key={cot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{cot.numero}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{cot.proveedor_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(cot.fecha_cotizacion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${cot.total?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(cot.estado_codigo)} size="sm">
                      {formatEstado(cot.estado_nombre)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><CheckCircle className="w-4 h-4 text-success-600" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== ÓRDENES DE COMPRA SECTION ====================

const OrdenesCompraSection = () => {
  const { data, isLoading } = useOrdenesCompra();
  const ordenes = data?.results || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  }

  if (ordenes.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="w-16 h-16" />}
        title="No hay órdenes de compra"
        description="Genere órdenes de compra desde las cotizaciones aprobadas"
        action={{
          label: 'Nueva Orden de Compra',
          onClick: () => console.log('Nueva OC'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Órdenes de Compra</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nueva Orden</Button>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {ordenes.map((oc: any) => (
                <tr key={oc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{oc.numero}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{oc.proveedor_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(oc.fecha_orden), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${oc.total?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(oc.estado_codigo)} size="sm">
                      {formatEstado(oc.estado_nombre)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><PackageCheck className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== CONTRATOS SECTION ====================

const ContratosSection = () => {
  const { data, isLoading } = useContratos();
  const contratos = data?.results || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  }

  if (contratos.length === 0) {
    return (
      <EmptyState
        icon={<FileSignature className="w-16 h-16" />}
        title="No hay contratos registrados"
        description="Registre los contratos con proveedores"
        action={{
          label: 'Nuevo Contrato',
          onClick: () => console.log('Nuevo Contrato'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contratos</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo Contrato</Button>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vigencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {contratos.map((cont: any) => (
                <tr key={cont.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{cont.numero}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{cont.proveedor_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(cont.fecha_inicio), 'dd/MM/yyyy', { locale: es })} -{' '}
                    {format(new Date(cont.fecha_fin), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${cont.valor_total?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(cont.estado_codigo)} size="sm">
                      {formatEstado(cont.estado_nombre)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== RECEPCIONES SECTION ====================

const RecepcionesSection = () => {
  const { data, isLoading } = useRecepcionesCompra();
  const recepciones = data?.results || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Spinner /></div>;
  }

  if (recepciones.length === 0) {
    return (
      <EmptyState
        icon={<PackageCheck className="w-16 h-16" />}
        title="No hay recepciones registradas"
        description="Registre las recepciones de las órdenes de compra"
        action={{
          label: 'Nueva Recepción',
          onClick: () => console.log('Nueva Recepción'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recepciones de Compra</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nueva Recepción</Button>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Orden Compra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Recepción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Recibido Por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conforme</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recepciones.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {rec.orden_compra_numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(rec.fecha_recepcion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{rec.recibido_por_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rec.conforme ? (
                      <Badge variant="success" size="sm">Conforme</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">No Conforme</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ComprasTab() {
  const [activeTab, setActiveTab] = useState('requisiciones');

  const tabs = [
    { id: 'requisiciones', label: 'Requisiciones', icon: <FileText className="w-4 h-4" /> },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'ordenes', label: 'Órdenes de Compra', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'contratos', label: 'Contratos', icon: <FileSignature className="w-4 h-4" /> },
    { id: 'recepciones', label: 'Recepciones', icon: <PackageCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'requisiciones' && <RequisicionesSection />}
        {activeTab === 'cotizaciones' && <CotizacionesSection />}
        {activeTab === 'ordenes' && <OrdenesCompraSection />}
        {activeTab === 'contratos' && <ContratosSection />}
        {activeTab === 'recepciones' && <RecepcionesSection />}
      </div>
    </div>
  );
}
