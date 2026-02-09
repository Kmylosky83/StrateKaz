/**
 * Página: Encuestas de Satisfacción - Sales CRM
 * Gestión de encuestas NPS y satisfacción del cliente
 */
import { useState } from 'react';
import {
  MessageCircle,
  Plus,
  Filter,
  Download,
  Send,
  ThumbsUp,
  ThumbsDown,
  Minus,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { NPSGauge } from '../components/NPSGauge';
import { useEncuestas, useNPSDashboard } from '../hooks';
import type { EncuestaList, TipoEncuesta, EstadoEncuesta } from '../types';

const TIPO_CONFIG: Record<
  TipoEncuesta,
  { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string }
> = {
  NPS: { variant: 'primary', label: 'NPS' },
  SATISFACCION: { variant: 'success', label: 'Satisfacción' },
  CALIDAD_PRODUCTO: { variant: 'warning', label: 'Calidad Producto' },
  SERVICIO_CLIENTE: { variant: 'primary', label: 'Servicio Cliente' },
};

const ESTADO_CONFIG: Record<
  EstadoEncuesta,
  { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string }
> = {
  BORRADOR: { variant: 'default', label: 'Borrador' },
  ACTIVA: { variant: 'primary', label: 'Activa' },
  FINALIZADA: { variant: 'success', label: 'Finalizada' },
};

interface EncuestaCardProps {
  encuesta: EncuestaList;
  onView: (id: number) => void;
  onEnviar: (id: number) => void;
}

function EncuestaCard({ encuesta, onView, onEnviar }: EncuestaCardProps) {
  const puedeEnviar = encuesta.estado === 'ACTIVA' && !encuesta.respondida;

  const getNPSType = (score?: number) => {
    if (score === undefined || score === null) return null;
    if (score >= 9) return { icon: ThumbsUp, color: 'text-success-600', label: 'Promotor' };
    if (score >= 7) return { icon: Minus, color: 'text-warning-600', label: 'Neutral' };
    return { icon: ThumbsDown, color: 'text-danger-600', label: 'Detractor' };
  };

  const npsType = getNPSType(encuesta.puntuacion_nps);

  return (
    <Card variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{encuesta.titulo}</h3>
            <Badge variant={TIPO_CONFIG[encuesta.tipo].variant} size="sm">
              {TIPO_CONFIG[encuesta.tipo].label}
            </Badge>
            <Badge variant={ESTADO_CONFIG[encuesta.estado].variant} size="sm">
              {ESTADO_CONFIG[encuesta.estado].label}
            </Badge>
          </div>
          {encuesta.cliente_nombre && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{encuesta.cliente_nombre}</p>
          )}
        </div>
        {encuesta.puntuacion_nps !== undefined && encuesta.puntuacion_nps !== null && (
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {encuesta.puntuacion_nps}
            </div>
            {npsType && (
              <div className={`flex items-center gap-1 text-xs ${npsType.color} mt-1`}>
                <npsType.icon className="w-3 h-3" />
                <span>{npsType.label}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {encuesta.fecha_envio && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Enviada:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {format(new Date(encuesta.fecha_envio), 'PP', { locale: es })}
            </p>
          </div>
        )}
        {encuesta.fecha_respuesta && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Respondida:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {format(new Date(encuesta.fecha_respuesta), 'PP', { locale: es })}
            </p>
          </div>
        )}
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-gray-400">Estado Respuesta:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {encuesta.respondida ? (
              <span className="text-success-600 dark:text-success-400">Respondida</span>
            ) : (
              <span className="text-warning-600 dark:text-warning-400">Pendiente</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" size="sm" onClick={() => onView(encuesta.id)}>
          Ver Detalle
        </Button>

        {puedeEnviar && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-4 h-4" />}
            onClick={() => onEnviar(encuesta.id)}
          >
            Enviar
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function EncuestasPage() {
  const [filters, _setFilters] = useState<any>({});

  const { data: encuestasData, isLoading: isLoadingEncuestas } = useEncuestas(filters);
  const { data: npsDashboard, isLoading: isLoadingNPS } = useNPSDashboard();

  if (isLoadingEncuestas || isLoadingNPS) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const encuestas = encuestasData?.results || [];
  const npsStats = npsDashboard || {
    nps_score: 0,
    total_respuestas: 0,
    promotores: 0,
    neutrales: 0,
    detractores: 0,
    porcentaje_promotores: 0,
    porcentaje_neutrales: 0,
    porcentaje_detractores: 0,
    promedio_puntuacion: 0,
    tasa_respuesta: 0,
  };

  // Calcular estadísticas generales
  const stats = {
    total: encuestas.length,
    activas: encuestas.filter((e) => e.estado === 'ACTIVA').length,
    respondidas: encuestas.filter((e) => e.respondida).length,
    pendientes: encuestas.filter((e) => !e.respondida && e.estado === 'ACTIVA').length,
  };

  const handleEnviar = (_id: number) => {
    // TODO: Implementar envío de encuesta
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Encuestas de Satisfacción"
        description="Sistema de encuestas NPS y medición de satisfacción del cliente"
      />

      {/* Dashboard NPS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="bordered" padding="lg" className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Net Promoter Score
          </h3>
          <NPSGauge score={npsStats.nps_score} size="lg" />
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Basado en {npsStats.total_respuestas} respuestas
          </div>
        </Card>

        <Card variant="bordered" padding="lg" className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribución de Respuestas
          </h3>
          <div className="space-y-4">
            {/* Promotores */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-success-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Promotores (9-10)
                  </span>
                </div>
                <div className="text-sm font-semibold text-success-600">
                  {npsStats.promotores} ({npsStats.porcentaje_promotores.toFixed(1)}%)
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-success-600 h-3 rounded-full transition-all"
                  style={{ width: `${npsStats.porcentaje_promotores}%` }}
                />
              </div>
            </div>

            {/* Neutrales */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Minus className="w-5 h-5 text-warning-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Neutrales (7-8)
                  </span>
                </div>
                <div className="text-sm font-semibold text-warning-600">
                  {npsStats.neutrales} ({npsStats.porcentaje_neutrales.toFixed(1)}%)
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-warning-600 h-3 rounded-full transition-all"
                  style={{ width: `${npsStats.porcentaje_neutrales}%` }}
                />
              </div>
            </div>

            {/* Detractores */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-5 h-5 text-danger-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Detractores (0-6)
                  </span>
                </div>
                <div className="text-sm font-semibold text-danger-600">
                  {npsStats.detractores} ({npsStats.porcentaje_detractores.toFixed(1)}%)
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-danger-600 h-3 rounded-full transition-all"
                  style={{ width: `${npsStats.porcentaje_detractores}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Encuestas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Respondidas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.respondidas}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.pendientes}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasa Respuesta</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {npsStats.tasa_respuesta.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Todas las Encuestas ({encuestas.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Encuesta
          </Button>
        </div>
      </div>

      {/* Encuestas Grid */}
      {encuestas.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="w-16 h-16" />}
          title="No hay encuestas registradas"
          description="Comience creando encuestas para medir la satisfacción de sus clientes"
          action={{
            label: 'Nueva Encuesta',
            onClick: () => {},
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {encuestas.map((encuesta) => (
            <EncuestaCard
              key={encuesta.id}
              encuesta={encuesta}
              onView={() => {}}
              onEnviar={handleEnviar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
