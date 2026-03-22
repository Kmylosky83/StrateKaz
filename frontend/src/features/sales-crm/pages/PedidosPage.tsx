/**
 * Página: Pedidos - Sales CRM
 * Gestión completa de pedidos de venta
 */
import { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  FileText,
  Truck,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { usePedidos } from '../hooks';
import type { PedidoList, EstadoPedido } from '../types';

const ESTADO_CONFIG: Record<
  EstadoPedido,
  { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string; icon: LucideIcon }
> = {
  BORRADOR: { variant: 'default', label: 'Borrador', icon: FileText },
  CONFIRMADO: { variant: 'primary', label: 'Confirmado', icon: CheckCircle },
  EN_PREPARACION: { variant: 'warning', label: 'En Preparación', icon: Package },
  LISTO: { variant: 'primary', label: 'Listo', icon: CheckCircle },
  ENVIADO: { variant: 'success', label: 'Enviado', icon: Truck },
  ENTREGADO: { variant: 'success', label: 'Entregado', icon: CheckCircle },
  CANCELADO: { variant: 'danger', label: 'Cancelado', icon: XCircle },
};

interface PedidoCardProps {
  pedido: PedidoList;
  onView: (id: number) => void;
  onAprobar: (id: number) => void;
  onCancelar: (id: number) => void;
  onGenerarFactura: (id: number) => void;
}

function PedidoCard({ pedido, onView, onAprobar, onCancelar, onGenerarFactura }: PedidoCardProps) {
  const config = ESTADO_CONFIG[pedido.estado];
  const Icon = config.icon;
  const puedeAprobar = pedido.estado === 'BORRADOR';
  const puedeGenerarFactura = pedido.estado === 'ENTREGADO' && !pedido.factura_numero;

  return (
    <Card variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{pedido.numero_pedido}</h3>
            <Badge variant={config.variant} size="sm">
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{pedido.cliente_nombre}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            ${pedido.total.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Fecha Pedido:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {format(new Date(pedido.fecha_pedido), 'PP', { locale: es })}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Entrega Estimada:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {pedido.fecha_entrega_estimada
              ? format(new Date(pedido.fecha_entrega_estimada), 'PP', { locale: es })
              : 'No definida'}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Vendedor:</span>
          <p className="font-medium text-gray-900 dark:text-white">{pedido.vendedor_nombre}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Factura:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {pedido.factura_numero || 'Sin generar'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" size="sm" onClick={() => onView(pedido.id)}>
          Ver Detalle
        </Button>

        {puedeAprobar && (
          <Button
            variant="success"
            size="sm"
            leftIcon={<CheckCircle className="w-4 h-4" />}
            onClick={() => onAprobar(pedido.id)}
          >
            Aprobar
          </Button>
        )}

        {pedido.estado !== 'CANCELADO' && pedido.estado !== 'ENTREGADO' && (
          <Button
            variant="danger"
            size="sm"
            leftIcon={<XCircle className="w-4 h-4" />}
            onClick={() => onCancelar(pedido.id)}
          >
            Cancelar
          </Button>
        )}

        {puedeGenerarFactura && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => onGenerarFactura(pedido.id)}
          >
            Generar Factura
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function PedidosPage() {
  const [filters, _setFilters] = useState<unknown>({});

  const { data: pedidosData, isLoading } = usePedidos(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const pedidos = pedidosData?.results || [];

  // Calcular estadísticas
  const stats = {
    total: pedidos.length,
    confirmados: pedidos.filter((p) => p.estado === 'CONFIRMADO').length,
    enPreparacion: pedidos.filter((p) => p.estado === 'EN_PREPARACION').length,
    enviados: pedidos.filter((p) => p.estado === 'ENVIADO').length,
    entregados: pedidos.filter((p) => p.estado === 'ENTREGADO').length,
    valorTotal: pedidos.reduce((sum, p) => sum + p.total, 0),
    valorEntregado: pedidos
      .filter((p) => p.estado === 'ENTREGADO')
      .reduce((sum, p) => sum + p.total, 0),
  };

  const handleAprobar = (_id: number) => {
    // TODO: Implementar aprobación
  };

  const handleCancelar = (_id: number) => {
    // TODO: Implementar cancelación
  };

  const handleGenerarFactura = (_id: number) => {
    // TODO: Implementar generación de factura
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pedidos"
        description="Gestión de pedidos, aprobaciones y generación de facturas"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pedidos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Preparación</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.enPreparacion}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enviados</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.enviados}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Entregados</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.entregados}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="bordered" padding="md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Total Pedidos</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${stats.valorTotal.toLocaleString()}
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Entregado</div>
          <div className="text-3xl font-bold text-success-600 dark:text-success-400">
            ${stats.valorEntregado.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Todos los Pedidos ({pedidos.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* Pedidos Grid */}
      {pedidos.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-16 h-16" />}
          title="No hay pedidos registrados"
          description="Comience creando pedidos para sus clientes"
          action={{
            label: 'Nuevo Pedido',
            onClick: () => {},
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pedidos.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onView={() => {}}
              onAprobar={handleAprobar}
              onCancelar={handleCancelar}
              onGenerarFactura={handleGenerarFactura}
            />
          ))}
        </div>
      )}
    </div>
  );
}
