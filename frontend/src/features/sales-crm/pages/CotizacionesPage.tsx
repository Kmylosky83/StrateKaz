/**
 * Página: Cotizaciones - Sales CRM
 * Gestión completa de cotizaciones de venta
 */
import { useState } from 'react';
import {
  FileText,
  Plus,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Copy,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useCotizaciones } from '../hooks';
import type { CotizacionList, EstadoCotizacion } from '../types';

const ESTADO_CONFIG: Record<
  EstadoCotizacion,
  { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string }
> = {
  BORRADOR: { variant: 'default', label: 'Borrador' },
  ENVIADA: { variant: 'primary', label: 'Enviada' },
  APROBADA: { variant: 'success', label: 'Aprobada' },
  RECHAZADA: { variant: 'danger', label: 'Rechazada' },
  VENCIDA: { variant: 'warning', label: 'Vencida' },
  CONVERTIDA: { variant: 'success', label: 'Convertida' },
};

interface CotizacionCardProps {
  cotizacion: CotizacionList;
  onView: (id: number) => void;
  onAprobar: (id: number) => void;
  onRechazar: (id: number) => void;
  onClonar: (id: number) => void;
  onConvertir: (id: number) => void;
}

function CotizacionCard({
  cotizacion,
  onView,
  onAprobar,
  onRechazar,
  onClonar,
  onConvertir,
}: CotizacionCardProps) {
  const isVencida = cotizacion.dias_vigencia < 0;
  const isPorVencer = cotizacion.dias_vigencia >= 0 && cotizacion.dias_vigencia <= 3;
  const puedeAprobar = cotizacion.estado === 'ENVIADA';
  const puedeConvertir = cotizacion.estado === 'APROBADA';

  return (
    <Card variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {cotizacion.numero_cotizacion}
            </h3>
            <Badge variant={ESTADO_CONFIG[cotizacion.estado].variant} size="sm">
              {ESTADO_CONFIG[cotizacion.estado].label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{cotizacion.cliente_nombre}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            ${cotizacion.total.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Emisión:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {format(new Date(cotizacion.fecha_emision), 'PP', { locale: es })}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Vencimiento:</span>
          <div className="flex items-center gap-1">
            <p
              className={`font-medium ${isVencida ? 'text-danger-600' : isPorVencer ? 'text-warning-600' : 'text-gray-900 dark:text-white'}`}
            >
              {format(new Date(cotizacion.fecha_vencimiento), 'PP', { locale: es })}
            </p>
            {isVencida && <AlertCircle className="w-4 h-4 text-danger-600" />}
            {isPorVencer && <Clock className="w-4 h-4 text-warning-600" />}
          </div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Vendedor:</span>
          <p className="font-medium text-gray-900 dark:text-white">{cotizacion.vendedor_nombre}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Vigencia:</span>
          <p
            className={`font-medium ${isVencida ? 'text-danger-600' : isPorVencer ? 'text-warning-600' : 'text-gray-900 dark:text-white'}`}
          >
            {isVencida ? 'Vencida' : `${cotizacion.dias_vigencia} días`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ChevronRight className="w-4 h-4" />}
          onClick={() => onView(cotizacion.id)}
        >
          Ver
        </Button>

        {puedeAprobar && (
          <>
            <Button
              variant="success"
              size="sm"
              leftIcon={<CheckCircle className="w-4 h-4" />}
              onClick={() => onAprobar(cotizacion.id)}
            >
              Aprobar
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle className="w-4 h-4" />}
              onClick={() => onRechazar(cotizacion.id)}
            >
              Rechazar
            </Button>
          </>
        )}

        {puedeConvertir && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<ChevronRight className="w-4 h-4" />}
            onClick={() => onConvertir(cotizacion.id)}
          >
            Convertir a Pedido
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Copy className="w-4 h-4" />}
          onClick={() => onClonar(cotizacion.id)}
        >
          Clonar
        </Button>
      </div>
    </Card>
  );
}

export default function CotizacionesPage() {
  const [filters, _setFilters] = useState<any>({});

  const { data: cotizacionesData, isLoading } = useCotizaciones(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const cotizaciones = cotizacionesData?.results || [];

  // Calcular estadísticas
  const stats = {
    total: cotizaciones.length,
    enviadas: cotizaciones.filter((c) => c.estado === 'ENVIADA').length,
    aprobadas: cotizaciones.filter((c) => c.estado === 'APROBADA').length,
    vencidas: cotizaciones.filter((c) => c.estado === 'VENCIDA' || c.dias_vigencia < 0).length,
    valorTotal: cotizaciones.reduce((sum, c) => sum + c.total, 0),
    valorAprobado: cotizaciones
      .filter((c) => c.estado === 'APROBADA')
      .reduce((sum, c) => sum + c.total, 0),
  };

  const handleAprobar = (_id: number) => {
    // TODO: Implementar aprobación
  };

  const handleRechazar = (_id: number) => {
    // TODO: Implementar rechazo
  };

  const handleClonar = (_id: number) => {
    // TODO: Implementar clonación
  };

  const handleConvertir = (_id: number) => {
    // TODO: Implementar conversión a pedido
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cotizaciones"
        description="Gestión de cotizaciones, aprobaciones y conversión a pedidos"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cotizaciones</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Enviadas</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.enviadas}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Aprobadas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.aprobadas}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
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
              <AlertCircle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="bordered" padding="md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Total Cotizado</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${stats.valorTotal.toLocaleString()}
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Aprobado</div>
          <div className="text-3xl font-bold text-success-600 dark:text-success-400">
            ${stats.valorAprobado.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Todas las Cotizaciones ({cotizaciones.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Cotización
          </Button>
        </div>
      </div>

      {/* Cotizaciones Grid */}
      {cotizaciones.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title="No hay cotizaciones registradas"
          description="Comience creando cotizaciones para sus clientes"
          action={{
            label: 'Nueva Cotización',
            onClick: () => {},
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cotizaciones.map((cotizacion) => (
            <CotizacionCard
              key={cotizacion.id}
              cotizacion={cotizacion}
              onView={() => {}}
              onAprobar={handleAprobar}
              onRechazar={handleRechazar}
              onClonar={handleClonar}
              onConvertir={handleConvertir}
            />
          ))}
        </div>
      )}
    </div>
  );
}
