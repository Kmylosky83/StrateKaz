/**
 * Página: Configuración de Alertas
 *
 * Gestión de alertas con tabs:
 * 1. Alertas Activas - Alertas generadas pendientes
 * 2. Tipos - CRUD de tipos de alerta
 * 3. Configuración - Reglas de alertas
 * 4. Escalamiento - Configuración de escalamiento
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
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockAlertasActivas = [
  {
    id: 1,
    titulo: 'SOAT Vehículo Próximo a Vencer',
    descripcion: 'El SOAT del vehículo XYZ-789 vence en 2 días',
    severidad: 'critical',
    tipo_alerta_nombre: 'Vencimiento Documento',
    responsable_nombre: 'Pedro Martínez',
    fecha_alerta: '2024-12-30',
    fecha_vencimiento: '2025-01-01',
    atendida: false,
    escalada: false,
  },
  {
    id: 2,
    titulo: 'Exceso de Horas Extras',
    descripcion: 'El colaborador Juan Pérez ha excedido el límite de horas extras (48h/mes)',
    severidad: 'warning',
    tipo_alerta_nombre: 'Umbral Excedido',
    responsable_nombre: 'Ana Rodríguez',
    fecha_alerta: '2024-12-29',
    atendida: false,
    escalada: false,
  },
];

const mockTiposAlerta = [
  {
    id: 1,
    codigo: 'VENC_DOC',
    nombre: 'Vencimiento de Documento',
    categoria: 'vencimiento',
    severidad_base: 'warning',
    dias_anticipacion: 15,
    is_active: true,
  },
  {
    id: 2,
    codigo: 'UMBRAL_EXCED',
    nombre: 'Umbral Excedido',
    categoria: 'umbral',
    severidad_base: 'warning',
    is_active: true,
  },
];

const mockConfiguraciones = [
  {
    id: 1,
    tipo_alerta_nombre: 'Vencimiento de Documento',
    modulo: 'logistics_fleet',
    modelo: 'Vehiculo',
    campo_fecha: 'soat_vencimiento',
    responsable_nombre: 'Pedro Martínez',
    escalar_automaticamente: true,
    dias_escalamiento: 3,
    is_active: true,
  },
  {
    id: 2,
    tipo_alerta_nombre: 'Umbral Excedido',
    modulo: 'talent_hub',
    modelo: 'RegistroTiempo',
    campo_umbral: 'horas_extras_mes',
    valor_umbral: 48,
    responsable_nombre: 'Ana Rodríguez',
    escalar_automaticamente: false,
    is_active: true,
  },
];

const getSeveridadColor = (severidad: string) => {
  const colors = {
    critical: 'border-red-500 bg-red-50',
    danger: 'border-orange-500 bg-orange-50',
    warning: 'border-yellow-500 bg-yellow-50',
    info: 'border-blue-500 bg-blue-50',
  };
  return colors[severidad as keyof typeof colors] || 'border-gray-500 bg-gray-50';
};

// ==================== COMPONENTS ====================

function AlertasActivasTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Alertas Activas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {mockAlertasActivas.filter(a => !a.atendida).length} alertas pendientes
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
          Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {mockAlertasActivas.map((alerta) => (
          <Card
            key={alerta.id}
            variant="bordered"
            padding="md"
            className={cn('border-l-4', getSeveridadColor(alerta.severidad))}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                alerta.severidad === 'critical' && 'bg-red-100 text-red-600',
                alerta.severidad === 'danger' && 'bg-orange-100 text-orange-600',
                alerta.severidad === 'warning' && 'bg-yellow-100 text-yellow-600',
                alerta.severidad === 'info' && 'bg-blue-100 text-blue-600',
              )}>
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
                      alerta.severidad === 'critical' ? 'danger' :
                      alerta.severidad === 'warning' ? 'warning' : 'info'
                    }
                    size="sm"
                  >
                    {alerta.severidad}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {alerta.tipo_alerta_nombre}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {alerta.responsable_nombre}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {alerta.fecha_alerta}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" size="sm" leftIcon={<CheckCircle className="w-4 h-4" />}>
                    Atender
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<ArrowUp className="w-4 h-4" />}>
                    Escalar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TiposTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tipos de Alerta
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Catálogo de tipos de alerta disponibles
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Tipo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockTiposAlerta.map((tipo) => (
          <Card key={tipo.id} variant="bordered" padding="md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    {tipo.nombre}
                  </h4>
                  <Badge variant="gray" size="sm">{tipo.codigo}</Badge>
                  <Badge variant={tipo.is_active ? 'success' : 'gray'} size="sm">
                    {tipo.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <Badge variant="gray" size="sm">{tipo.categoria}</Badge>
                  <Badge variant="warning" size="sm">{tipo.severidad_base}</Badge>
                  {tipo.dias_anticipacion && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {tipo.dias_anticipacion} días anticipación
                    </span>
                  )}
                </div>
              </div>

              <Button variant="ghost" size="sm">Editar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ConfiguracionTab() {
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
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Configuración
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockConfiguraciones.map((config) => (
          <Card key={config.id} variant="bordered" padding="md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    {config.tipo_alerta_nombre}
                  </h4>
                  <Badge variant={config.is_active ? 'success' : 'gray'} size="sm">
                    {config.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Módulo:</span>
                    <span className="ml-2 font-medium">{config.modulo} / {config.modelo}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Responsable:</span>
                    <span className="ml-2 font-medium">{config.responsable_nombre}</span>
                  </div>
                  {config.campo_fecha && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Campo Fecha:</span>
                      <span className="ml-2 font-medium">{config.campo_fecha}</span>
                    </div>
                  )}
                  {config.campo_umbral && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Umbral:</span>
                      <span className="ml-2 font-medium">{config.campo_umbral} = {config.valor_umbral}</span>
                    </div>
                  )}
                </div>

                {config.escalar_automaticamente && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                    <ArrowUp className="w-4 h-4" />
                    <span>Escalamiento automático después de {config.dias_escalamiento} días</span>
                  </div>
                )}
              </div>

              <Button variant="ghost" size="sm">Editar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EscalamientoTab() {
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
            El escalamiento de alertas se configura por tipo de alerta en la pestaña de Configuración.
            Las alertas se escalan automáticamente según los días configurados si no son atendidas.
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Alertas"
        description="Configuración y seguimiento de alertas del sistema"
        actions={
          <div className="flex gap-2">
            <Badge variant="danger" size="lg">
              {mockAlertasActivas.filter(a => !a.atendida).length} pendientes
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
