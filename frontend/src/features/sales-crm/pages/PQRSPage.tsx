/**
 * Página: PQRS - Sales CRM
 * Sistema de tickets PQRS (Peticiones, Quejas, Reclamos, Sugerencias)
 */
import { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Filter,
  Download,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { usePQRS, usePQRSDashboard } from '../hooks';
import type { PQRSList, TipoPQRS, EstadoPQRS, PrioridadPQRS } from '../types';

const TIPO_CONFIG: Record<TipoPQRS, { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string; icon: any }> = {
  PETICION: { variant: 'primary', label: 'Petición', icon: MessageSquare },
  QUEJA: { variant: 'warning', label: 'Queja', icon: AlertCircle },
  RECLAMO: { variant: 'danger', label: 'Reclamo', icon: AlertCircle },
  SUGERENCIA: { variant: 'success', label: 'Sugerencia', icon: TrendingUp },
  FELICITACION: { variant: 'success', label: 'Felicitación', icon: CheckCircle },
};

const ESTADO_CONFIG: Record<EstadoPQRS, { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string }> = {
  ABIERTA: { variant: 'primary', label: 'Abierta' },
  EN_PROCESO: { variant: 'warning', label: 'En Proceso' },
  ESCALADA: { variant: 'danger', label: 'Escalada' },
  RESUELTA: { variant: 'success', label: 'Resuelta' },
  CERRADA: { variant: 'default', label: 'Cerrada' },
  CANCELADA: { variant: 'danger', label: 'Cancelada' },
};

const PRIORIDAD_CONFIG: Record<PrioridadPQRS, { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string }> = {
  BAJA: { variant: 'default', label: 'Baja' },
  MEDIA: { variant: 'primary', label: 'Media' },
  ALTA: { variant: 'warning', label: 'Alta' },
  URGENTE: { variant: 'danger', label: 'Urgente' },
};

interface PQRSCardProps {
  pqrs: PQRSList;
  onView: (id: number) => void;
  onAsignar: (id: number) => void;
  onEscalar: (id: number) => void;
  onResolver: (id: number) => void;
  onCerrar: (id: number) => void;
}

function PQRSCard({ pqrs, onView, onAsignar, onEscalar, onResolver, onCerrar }: PQRSCardProps) {
  const tipoConfig = TIPO_CONFIG[pqrs.tipo];
  const TipoIcon = tipoConfig.icon;
  const puedeAsignar = pqrs.estado === 'ABIERTA' && !pqrs.asignado_a_nombre;
  const puedeEscalar = pqrs.estado === 'EN_PROCESO';
  const puedeResolver = pqrs.estado === 'EN_PROCESO' || pqrs.estado === 'ESCALADA';
  const puedeCerrar = pqrs.estado === 'RESUELTA';

  return (
    <Card variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {pqrs.numero_ticket}
            </h3>
            <Badge variant={tipoConfig.variant} size="sm">
              <TipoIcon className="w-3 h-3 mr-1" />
              {tipoConfig.label}
            </Badge>
            <Badge variant={ESTADO_CONFIG[pqrs.estado].variant} size="sm">
              {ESTADO_CONFIG[pqrs.estado].label}
            </Badge>
            <Badge variant={PRIORIDAD_CONFIG[pqrs.prioridad].variant} size="xs">
              {PRIORIDAD_CONFIG[pqrs.prioridad].label}
            </Badge>
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {pqrs.asunto}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pqrs.cliente_nombre}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Fecha Recepción:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {format(new Date(pqrs.fecha_recepcion), 'PP', { locale: es })}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Días Abierta:</span>
          <p className={`font-medium ${pqrs.dias_abierta > 7 ? 'text-danger-600' : pqrs.dias_abierta > 3 ? 'text-warning-600' : 'text-gray-900 dark:text-white'}`}>
            {pqrs.dias_abierta} días
          </p>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-gray-400">Asignado a:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {pqrs.asignado_a_nombre || 'Sin asignar'}
          </p>
        </div>
        {pqrs.fecha_limite_respuesta && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">Límite de respuesta:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {format(new Date(pqrs.fecha_limite_respuesta), 'PP', { locale: es })}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(pqrs.id)}
        >
          Ver Timeline
        </Button>

        {puedeAsignar && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<User className="w-4 h-4" />}
            onClick={() => onAsignar(pqrs.id)}
          >
            Asignar
          </Button>
        )}

        {puedeEscalar && (
          <Button
            variant="danger"
            size="sm"
            leftIcon={<ArrowUp className="w-4 h-4" />}
            onClick={() => onEscalar(pqrs.id)}
          >
            Escalar
          </Button>
        )}

        {puedeResolver && (
          <Button
            variant="success"
            size="sm"
            leftIcon={<CheckCircle className="w-4 h-4" />}
            onClick={() => onResolver(pqrs.id)}
          >
            Resolver
          </Button>
        )}

        {puedeCerrar && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCerrar(pqrs.id)}
          >
            Cerrar
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function PQRSPage() {
  const [filters, setFilters] = useState<any>({});

  const { data: pqrsData, isLoading: isLoadingPQRS } = usePQRS(filters);
  const { data: dashboard, isLoading: isLoadingDashboard } = usePQRSDashboard();

  if (isLoadingPQRS || isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const pqrsList = pqrsData?.results || [];
  const stats = dashboard || {
    total_pqrs: 0,
    abiertas: 0,
    en_proceso: 0,
    resueltas: 0,
    tiempo_promedio_resolucion_horas: 0,
    tasa_resolucion_sla: 0,
  };

  const handleAsignar = (id: number) => {
    console.log('Asignar PQRS', id);
  };

  const handleEscalar = (id: number) => {
    console.log('Escalar PQRS', id);
  };

  const handleResolver = (id: number) => {
    console.log('Resolver PQRS', id);
  };

  const handleCerrar = (id: number) => {
    console.log('Cerrar PQRS', id);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="PQRS"
        description="Sistema de tickets para Peticiones, Quejas, Reclamos y Sugerencias"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total PQRS</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_pqrs}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Abiertas</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.abiertas}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Proceso</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.en_proceso}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resueltas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.resueltas}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Métricas de rendimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="bordered" padding="md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tiempo Promedio de Resolución</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.tiempo_promedio_resolucion_horas.toFixed(1)}h
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tasa de Resolución en SLA</div>
          <div className="text-3xl font-bold text-success-600 dark:text-success-400">
            {stats.tasa_resolucion_sla.toFixed(1)}%
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Todos los Tickets ({pqrsList.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Ticket
          </Button>
        </div>
      </div>

      {/* PQRS Grid */}
      {pqrsList.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-16 h-16" />}
          title="No hay tickets registrados"
          description="Comience registrando peticiones, quejas, reclamos o sugerencias"
          action={{
            label: 'Nuevo Ticket',
            onClick: () => console.log('Nuevo Ticket'),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pqrsList.map((pqrs) => (
            <PQRSCard
              key={pqrs.id}
              pqrs={pqrs}
              onView={(id) => console.log('Ver', id)}
              onAsignar={handleAsignar}
              onEscalar={handleEscalar}
              onResolver={handleResolver}
              onCerrar={handleCerrar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
