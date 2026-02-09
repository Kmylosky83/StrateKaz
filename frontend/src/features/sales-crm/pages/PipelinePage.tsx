/**
 * Página: Pipeline de Ventas - Sales CRM
 * Vista Kanban de oportunidades por etapa
 */
import { useState } from 'react';
import {
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  Filter,
  Download,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { Badge } from '@/components/common/Badge';
import { usePipelineKanban, usePipelineDashboard } from '../hooks';
import type { OportunidadList, EtapaVenta } from '../types';

const _ETAPAS_CONFIG: Record<EtapaVenta, { nombre: string; color: string }> = {
  PROSPECTO: {
    nombre: 'Prospecto',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
  CONTACTADO: {
    nombre: 'Contactado',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  CALIFICADO: {
    nombre: 'Calificado',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  },
  PROPUESTA: {
    nombre: 'Propuesta',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  NEGOCIACION: {
    nombre: 'Negociación',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  GANADA: {
    nombre: 'Ganada',
    color: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
  },
  PERDIDA: {
    nombre: 'Perdida',
    color: 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200',
  },
};

const PRIORIDAD_CONFIG = {
  BAJA: { variant: 'default' as const, label: 'Baja' },
  MEDIA: { variant: 'primary' as const, label: 'Media' },
  ALTA: { variant: 'warning' as const, label: 'Alta' },
  CRITICA: { variant: 'danger' as const, label: 'Crítica' },
};

interface OportunidadCardProps {
  oportunidad: OportunidadList;
  onClick: (id: number) => void;
}

function OportunidadCard({ oportunidad, onClick }: OportunidadCardProps) {
  return (
    <Card
      variant="bordered"
      padding="sm"
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(oportunidad.id)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
            {oportunidad.titulo}
          </h4>
          <Badge variant={PRIORIDAD_CONFIG[oportunidad.prioridad].variant} size="xs">
            {PRIORIDAD_CONFIG[oportunidad.prioridad].label}
          </Badge>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400">{oportunidad.cliente_nombre}</div>

        <div className="flex items-center justify-between text-xs">
          <div className="font-semibold text-primary-600 dark:text-primary-400">
            ${oportunidad.valor_estimado.toLocaleString()}
          </div>
          <div className="text-gray-500 dark:text-gray-400">{oportunidad.probabilidad_cierre}%</div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{oportunidad.dias_en_etapa}d</span>
          </div>
          <div>{oportunidad.vendedor_nombre}</div>
        </div>
      </div>
    </Card>
  );
}

interface KanbanColumnProps {
  etapa: EtapaVenta;
  nombre: string;
  oportunidades: OportunidadList[];
  valorTotal: number;
  onOportunidadClick: (id: number) => void;
}

function KanbanColumn({
  etapa: _etapa,
  nombre,
  oportunidades,
  valorTotal,
  onOportunidadClick,
}: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{nombre}</h3>
          <Badge variant="default" size="sm">
            {oportunidades.length}
          </Badge>
        </div>
        <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
          ${valorTotal.toLocaleString()}
        </div>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {oportunidades.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            Sin oportunidades
          </div>
        ) : (
          oportunidades.map((oportunidad) => (
            <OportunidadCard
              key={oportunidad.id}
              oportunidad={oportunidad}
              onClick={onOportunidadClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [selectedVendedor, _setSelectedVendedor] = useState<number | undefined>();

  const { data: kanbanData, isLoading: isLoadingKanban } = usePipelineKanban(selectedVendedor);
  const { data: dashboard, isLoading: isLoadingDashboard } = usePipelineDashboard(selectedVendedor);

  if (isLoadingKanban || isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const etapas = kanbanData?.etapas || [];
  const stats = dashboard || {
    total_oportunidades: 0,
    valor_pipeline_total: 0,
    valor_ponderado: 0,
    tasa_conversion: 0,
    tiempo_promedio_cierre_dias: 0,
  };

  const handleOportunidadClick = (_id: number) => {
    // TODO: Implementar vista de oportunidad
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pipeline de Ventas"
        description="Vista Kanban de oportunidades por etapa de venta"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Oportunidades</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_oportunidades}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                ${stats.valor_pipeline_total.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Ponderado</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                ${stats.valor_ponderado.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasa Conversión</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.tasa_conversion.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.tiempo_promedio_cierre_dias}d
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pipeline de Oportunidades
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Oportunidad
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {etapas.length === 0 ? (
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="No hay oportunidades registradas"
          description="Comience agregando oportunidades a su pipeline de ventas"
          action={{
            label: 'Nueva Oportunidad',
            onClick: () => {},
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-min">
            {etapas
              .filter((e) => e.etapa !== 'GANADA' && e.etapa !== 'PERDIDA')
              .map((etapa) => (
                <KanbanColumn
                  key={etapa.etapa}
                  etapa={etapa.etapa as EtapaVenta}
                  nombre={etapa.nombre}
                  oportunidades={etapa.oportunidades}
                  valorTotal={etapa.valor_total}
                  onOportunidadClick={handleOportunidadClick}
                />
              ))}
          </div>
        </div>
      )}

      {/* Oportunidades Cerradas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {etapas
          .filter((e) => e.etapa === 'GANADA' || e.etapa === 'PERDIDA')
          .map((etapa) => (
            <Card key={etapa.etapa} variant="bordered" padding="md">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">{etapa.nombre}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant={etapa.etapa === 'GANADA' ? 'success' : 'danger'}>
                    {etapa.oportunidades.length}
                  </Badge>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ${etapa.valor_total.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {etapa.oportunidades.slice(0, 5).map((oportunidad) => (
                  <div
                    key={oportunidad.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleOportunidadClick(oportunidad.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {oportunidad.titulo}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {oportunidad.cliente_nombre}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
