/**
 * Página: Gestión de Alertas (REWRITTEN - Sprint 9)
 * 4 tabs: Alertas Activas, Tipos, Configuración, Escalamiento
 * Connected to real hooks from useAuditSystem
 * Deleted ALL mock data
 */
import { useState } from 'react';
import {
  AlertTriangle,
  Settings,
  TrendingUp,
  Clock,
  Filter,
  Plus,
  CheckCircle,
  ArrowUp,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Tabs,
  Spinner,
  EmptyState,
  KpiCard,
  KpiCardGrid,
  ConfirmDialog,
} from '@/components/common';
import { cn } from '@/utils/cn';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useAlertasGeneradas,
  useAlertasPendientes,
  useAtenderAlerta,
  useEscalarAlerta,
  useTiposAlerta,
  useCreateTipoAlerta,
  useUpdateTipoAlerta,
  useConfiguracionesAlerta,
  useCreateConfiguracionAlerta,
  useUpdateConfiguracionAlerta,
  useEscalamientosAlerta,
  useResumenAlertas,
} from '../hooks/useAuditSystem';
import type { AlertaGenerada, TipoAlerta, ConfiguracionAlerta, SeveridadAlerta } from '../types';

const getSeveridadColor = (severidad: SeveridadAlerta) => {
  const colors = {
    critical: 'border-red-500 bg-red-50',
    danger: 'border-orange-500 bg-orange-50',
    warning: 'border-yellow-500 bg-yellow-50',
    info: 'border-blue-500 bg-blue-50',
  };
  return colors[severidad] || 'border-gray-500 bg-gray-50';
};

// ==================== COMPONENTS ====================

function AlertasActivasTab() {
  const { data: alertas, isLoading } = useAlertasGeneradas();
  const { data: resumen } = useResumenAlertas();
  const atenderMutation = useAtenderAlerta();
  const escalarMutation = useEscalarAlerta();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    alertaId: number | null;
  }>({ isOpen: false, alertaId: null });

  const handleAtender = (id: number) => {
    setConfirmDialog({ isOpen: true, alertaId: id });
  };

  const handleConfirmAtender = () => {
    if (confirmDialog.alertaId) {
      atenderMutation.mutate({ id: confirmDialog.alertaId });
    }
    setConfirmDialog({ isOpen: false, alertaId: null });
  };

  const handleEscalar = (id: number) => {
    // Simplified: escaladoA = 0 means auto-assign to next level
    escalarMutation.mutate({ id, escaladoA: 0, motivo: 'Escalado manualmente' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!alertas || alertas.length === 0) {
    return (
      <EmptyState
        title="No hay alertas activas"
        description="No se encontraron alertas generadas en este momento"
        icon={AlertTriangle}
      />
    );
  }

  const pendientes = alertas.filter((a) => !a.atendida);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      {resumen && (
        <KpiCardGrid>
          <KpiCard
            title="Total Alertas"
            value={resumen.total}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <KpiCard
            title="Pendientes"
            value={resumen.pendientes}
            variant="warning"
            icon={<Clock className="w-4 h-4" />}
          />
          <KpiCard
            title="Críticas"
            value={resumen.por_severidad?.critical || 0}
            variant="danger"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
        </KpiCardGrid>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alertas Activas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {pendientes.length} alertas pendientes
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
          Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {alertas.map((alerta) => (
          <Card
            key={alerta.id}
            variant="bordered"
            padding="md"
            className={cn('border-l-4', getSeveridadColor(alerta.severidad))}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  alerta.severidad === 'critical' && 'bg-red-100 text-red-600',
                  alerta.severidad === 'danger' && 'bg-orange-100 text-orange-600',
                  alerta.severidad === 'warning' && 'bg-yellow-100 text-yellow-600',
                  alerta.severidad === 'info' && 'bg-blue-100 text-blue-600'
                )}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {alerta.titulo}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {alerta.descripcion}
                    </p>
                  </div>
                  <Badge
                    variant={
                      alerta.severidad === 'critical' || alerta.severidad === 'danger'
                        ? 'danger'
                        : alerta.severidad === 'warning'
                          ? 'warning'
                          : 'info'
                    }
                    size="sm"
                  >
                    {formatStatusLabel(alerta.severidad)}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {alerta.tipo_alerta_nombre || `Tipo #${alerta.tipo_alerta}`}
                  </span>
                  {alerta.responsable_nombre && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {alerta.responsable_nombre}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(alerta.fecha_alerta), 'PPp', { locale: es })}
                  </span>
                  {alerta.atendida && (
                    <Badge variant="success" size="sm">
                      Atendida
                    </Badge>
                  )}
                  {alerta.escalada && (
                    <Badge variant="warning" size="sm">
                      Escalada
                    </Badge>
                  )}
                </div>

                {!alerta.atendida && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      onClick={() => handleAtender(alerta.id)}
                      loading={atenderMutation.isPending}
                    >
                      Atender
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<ArrowUp className="w-4 h-4" />}
                      onClick={() => handleEscalar(alerta.id)}
                      loading={escalarMutation.isPending}
                    >
                      Escalar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, alertaId: null })}
        onConfirm={handleConfirmAtender}
        title="Atender Alerta"
        message="¿Estás seguro de que deseas marcar esta alerta como atendida?"
        confirmLabel="Atender"
        variant="info"
      />
    </div>
  );
}

function TiposTab() {
  const { data: tipos, isLoading } = useTiposAlerta();
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.AUDIT_SYSTEM, Sections.REGLAS_ALERTA, 'create');
  const canEdit = canDo(Modules.AUDIT_SYSTEM, Sections.REGLAS_ALERTA, 'edit');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tipos || tipos.length === 0) {
    return (
      <EmptyState
        title="No hay tipos de alerta"
        description="Comienza creando un nuevo tipo de alerta"
        icon={FileText}
        action={canCreate ? { label: 'Nuevo Tipo', onClick: () => {} } : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tipos de Alerta</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Catálogo de tipos de alerta disponibles
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Tipo
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tipos.map((tipo) => (
          <Card key={tipo.id} variant="bordered" padding="md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    {tipo.nombre}
                  </h4>
                  <Badge variant="gray" size="sm">
                    {tipo.codigo}
                  </Badge>
                  <Badge variant={tipo.is_active ? 'success' : 'gray'} size="sm">
                    {tipo.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                {tipo.descripcion && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {tipo.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <Badge variant="gray" size="sm">
                    {formatStatusLabel(tipo.categoria)}
                  </Badge>
                  <Badge variant="warning" size="sm">
                    {formatStatusLabel(tipo.severidad_base)}
                  </Badge>
                  {tipo.dias_anticipacion && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {tipo.dias_anticipacion} días anticipación
                    </span>
                  )}
                </div>
              </div>

              {canEdit && (
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ConfiguracionTab() {
  const { data: configuraciones, isLoading } = useConfiguracionesAlerta();
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.AUDIT_SYSTEM, Sections.REGLAS_ALERTA, 'create');
  const canEdit = canDo(Modules.AUDIT_SYSTEM, Sections.REGLAS_ALERTA, 'edit');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!configuraciones || configuraciones.length === 0) {
    return (
      <EmptyState
        title="No hay configuraciones"
        description="Crea una nueva configuración de alerta"
        icon={Settings}
        action={canCreate ? { label: 'Nueva Configuración', onClick: () => {} } : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuraciones de Alerta
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Reglas de generación automática de alertas
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Configuración
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {configuraciones.map((config) => (
          <Card key={config.id} variant="bordered" padding="md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    {config.tipo_alerta_nombre || `Tipo #${config.tipo_alerta}`}
                  </h4>
                  <Badge variant={config.is_active ? 'success' : 'gray'} size="sm">
                    {config.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Módulo:</span>
                    <span className="ml-2 font-medium">
                      {config.modulo} / {config.modelo}
                    </span>
                  </div>
                  {config.responsable_nombre && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Responsable:</span>
                      <span className="ml-2 font-medium">{config.responsable_nombre}</span>
                    </div>
                  )}
                  {config.campo_fecha && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Campo Fecha:</span>
                      <span className="ml-2 font-medium">{config.campo_fecha}</span>
                    </div>
                  )}
                  {config.campo_umbral && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Umbral:</span>
                      <span className="ml-2 font-medium">
                        {config.campo_umbral} = {config.valor_umbral}
                      </span>
                    </div>
                  )}
                </div>

                {config.escalar_automaticamente && config.dias_escalamiento && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                    <ArrowUp className="w-4 h-4" />
                    <span>Escalamiento automático después de {config.dias_escalamiento} días</span>
                  </div>
                )}
              </div>

              {canEdit && (
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EscalamientoTab() {
  const { data: escalamientos, isLoading } = useEscalamientosAlerta();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Escalamiento de Alertas
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configuración de niveles de escalamiento
        </p>
      </div>

      <Card variant="bordered" padding="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            El escalamiento de alertas se configura por tipo de alerta en la pestaña de
            Configuración. Las alertas se escalan automáticamente según los días configurados si no
            son atendidas.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Niveles de Escalamiento
            </h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                Responsable directo
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                Supervisor inmediato
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                Administrador del sistema
              </li>
            </ul>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Spinner size="md" />
            </div>
          )}

          {escalamientos && escalamientos.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Escalamientos Recientes
              </h5>
              <div className="space-y-2">
                {escalamientos.slice(0, 5).map((esc) => (
                  <div
                    key={esc.id}
                    className="text-xs text-gray-600 dark:text-gray-400 border-l-2 border-blue-500 pl-3 py-1"
                  >
                    <div>
                      <strong>Nivel {esc.nivel_escalamiento}</strong> → {esc.escalado_a_nombre}
                    </div>
                    <div className="text-gray-500">{esc.motivo_escalamiento}</div>
                    <div className="text-gray-400">
                      {format(new Date(esc.fecha_escalamiento), 'PPp', { locale: es })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ==================== TABS CONFIG ====================

const tabs = [
  { id: 'activas', label: 'Alertas Activas', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'tipos', label: 'Tipos', icon: <FileText className="w-4 h-4" /> },
  { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
  { id: 'escalamiento', label: 'Escalamiento', icon: <TrendingUp className="w-4 h-4" /> },
];

// ==================== MAIN COMPONENT ====================

export default function AlertasPage() {
  const [activeTab, setActiveTab] = useState('activas');
  const { data: pendientes } = useAlertasPendientes();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Alertas"
        description="Configuración y seguimiento de alertas del sistema"
        actions={
          <div className="flex gap-2">
            <Badge variant="danger" size="lg">
              {pendientes?.length || 0} pendientes
            </Badge>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'activas' && <AlertasActivasTab />}
        {activeTab === 'tipos' && <TiposTab />}
        {activeTab === 'configuracion' && <ConfiguracionTab />}
        {activeTab === 'escalamiento' && <EscalamientoTab />}
      </div>
    </div>
  );
}
