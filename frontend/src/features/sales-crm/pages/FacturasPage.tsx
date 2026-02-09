/**
 * Página: Facturas - Sales CRM
 * Gestión de facturas y control de pagos
 */
import { useState } from 'react';
import {
  FileText,
  Plus,
  Filter,
  Download,
  DollarSign,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useFacturas } from '../hooks';
import type { FacturaList, EstadoFactura } from '../types';

const ESTADO_CONFIG: Record<
  EstadoFactura,
  { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string }
> = {
  BORRADOR: { variant: 'default', label: 'Borrador' },
  EMITIDA: { variant: 'primary', label: 'Emitida' },
  PAGADA_PARCIAL: { variant: 'warning', label: 'Pago Parcial' },
  PAGADA: { variant: 'success', label: 'Pagada' },
  VENCIDA: { variant: 'danger', label: 'Vencida' },
  ANULADA: { variant: 'danger', label: 'Anulada' },
};

interface FacturaCardProps {
  factura: FacturaList;
  onView: (id: number) => void;
  onRegistrarPago: (id: number) => void;
  onAnular: (id: number) => void;
}

function FacturaCard({ factura, onView, onRegistrarPago, onAnular }: FacturaCardProps) {
  const isVencida = factura.dias_vencimiento < 0 && factura.saldo_pendiente > 0;
  const isPorVencer =
    factura.dias_vencimiento >= 0 && factura.dias_vencimiento <= 7 && factura.saldo_pendiente > 0;
  const puedeRegistrarPago = factura.saldo_pendiente > 0 && factura.estado !== 'ANULADA';
  const porcentajePagado = ((factura.total - factura.saldo_pendiente) / factura.total) * 100;

  return (
    <Card variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {factura.numero_factura}
            </h3>
            <Badge variant={ESTADO_CONFIG[factura.estado].variant} size="sm">
              {ESTADO_CONFIG[factura.estado].label}
            </Badge>
            {isVencida && (
              <Badge variant="danger" size="sm">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Vencida
              </Badge>
            )}
            {isPorVencer && (
              <Badge variant="warning" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                Por vencer
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{factura.cliente_nombre}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            ${factura.total.toLocaleString()}
          </div>
          {factura.saldo_pendiente > 0 && (
            <div className="text-sm font-medium text-danger-600 dark:text-danger-400 mt-1">
              Saldo: ${factura.saldo_pendiente.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Barra de progreso de pago */}
      {factura.estado !== 'ANULADA' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Pagado</span>
            <span>{porcentajePagado.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                porcentajePagado === 100 ? 'bg-success-600' : 'bg-primary-600'
              }`}
              style={{ width: `${porcentajePagado}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Emisión:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {format(new Date(factura.fecha_emision), 'PP', { locale: es })}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Vencimiento:</span>
          <p
            className={`font-medium ${isVencida ? 'text-danger-600' : isPorVencer ? 'text-warning-600' : 'text-gray-900 dark:text-white'}`}
          >
            {format(new Date(factura.fecha_vencimiento), 'PP', { locale: es })}
          </p>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-gray-400">Días de vencimiento:</span>
          <p
            className={`font-medium ${isVencida ? 'text-danger-600' : isPorVencer ? 'text-warning-600' : 'text-gray-900 dark:text-white'}`}
          >
            {isVencida
              ? `Vencida hace ${Math.abs(factura.dias_vencimiento)} días`
              : isPorVencer
                ? `Vence en ${factura.dias_vencimiento} días`
                : factura.estado === 'PAGADA'
                  ? 'Pagada completamente'
                  : `${factura.dias_vencimiento} días`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" size="sm" onClick={() => onView(factura.id)}>
          Ver Detalle
        </Button>

        {puedeRegistrarPago && (
          <Button
            variant="success"
            size="sm"
            leftIcon={<DollarSign className="w-4 h-4" />}
            onClick={() => onRegistrarPago(factura.id)}
          >
            Registrar Pago
          </Button>
        )}

        {factura.estado !== 'ANULADA' && factura.estado !== 'PAGADA' && (
          <Button
            variant="danger"
            size="sm"
            leftIcon={<XCircle className="w-4 h-4" />}
            onClick={() => onAnular(factura.id)}
          >
            Anular
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function FacturasPage() {
  const [filters, _setFilters] = useState<any>({});

  const { data: facturasData, isLoading } = useFacturas(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const facturas = facturasData?.results || [];

  // Calcular estadísticas
  const stats = {
    total: facturas.length,
    emitidas: facturas.filter((f) => f.estado === 'EMITIDA').length,
    vencidas: facturas.filter((f) => f.dias_vencimiento < 0 && f.saldo_pendiente > 0).length,
    pagadas: facturas.filter((f) => f.estado === 'PAGADA').length,
    valorTotal: facturas.reduce((sum, f) => sum + f.total, 0),
    saldoPendiente: facturas.reduce((sum, f) => sum + f.saldo_pendiente, 0),
    valorPagado: facturas.reduce((sum, f) => sum + (f.total - f.saldo_pendiente), 0),
  };

  const handleRegistrarPago = (_id: number) => {
    // TODO: Implementar registro de pago
  };

  const handleAnular = (_id: number) => {
    // TODO: Implementar anulación
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Facturas" description="Gestión de facturas, control de pagos y cartera" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Facturas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Emitidas</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.emitidas}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">
                {stats.vencidas}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pagadas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.pagadas}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" padding="md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Total Facturado</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${stats.valorTotal.toLocaleString()}
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo Pendiente</div>
          <div className="text-3xl font-bold text-danger-600 dark:text-danger-400">
            ${stats.saldoPendiente.toLocaleString()}
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Pagado</div>
          <div className="text-3xl font-bold text-success-600 dark:text-success-400">
            ${stats.valorPagado.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Todas las Facturas ({facturas.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Factura
          </Button>
        </div>
      </div>

      {/* Facturas Grid */}
      {facturas.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title="No hay facturas registradas"
          description="Las facturas se generan automáticamente desde los pedidos"
          action={{
            label: 'Nueva Factura',
            onClick: () => {},
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {facturas.map((factura) => (
            <FacturaCard
              key={factura.id}
              factura={factura}
              onView={() => {}}
              onRegistrarPago={handleRegistrarPago}
              onAnular={handleAnular}
            />
          ))}
        </div>
      )}
    </div>
  );
}
