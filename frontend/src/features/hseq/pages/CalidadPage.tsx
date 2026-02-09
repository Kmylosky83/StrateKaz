/**
 * Página: Gestión de Calidad HSEQ
 *
 * Sistema completo de gestión de calidad con 4 subsecciones:
 * - No Conformidades
 * - Acciones Correctivas
 * - Salidas No Conformes
 * - Control de Cambios
 */
import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Package,
  RefreshCw,
  Plus,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Tabs,
  Card,
  Button,
  EmptyState,
  Spinner,
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  StatusBadge,
  Progress,
  EvidenceGallery,
  EvidenceUploader,
  Modal,
  ExportButton,
} from '@/components/common';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  useNoConformidades,
  useAccionesCorrectivas,
  useSalidasNoConformes,
  useSolicitudesCambio,
} from '../hooks/useCalidad';

// ==================== UTILITY FUNCTIONS ====================

const formatTipo = (tipo: string): string => {
  const tipoMap: Record<string, string> = {
    AUDITORIA_INTERNA: 'Auditoría Interna',
    AUDITORIA_EXTERNA: 'Auditoría Externa',
    QUEJA_CLIENTE: 'Queja Cliente',
    INSPECCION: 'Inspección',
    PROCESO: 'Proceso',
    PREVENTIVA: 'Preventiva',
    CORRECTIVA: 'Correctiva',
    MEJORA: 'Mejora',
  };
  return tipoMap[tipo] || formatStatusLabel(tipo);
};

// ==================== NO CONFORMIDADES SECTION ====================

const NoConformidadesSection = () => {
  const { data, isLoading } = useNoConformidades();
  const noConformidades = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!noConformidades || noConformidades.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-16 h-16" />}
        title="No hay no conformidades registradas"
        description="Comience registrando las no conformidades detectadas en el sistema de calidad"
        action={{
          label: 'Nueva No Conformidad',
          onClick: () => console.log('Nueva NC'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: noConformidades.length,
    abiertas: noConformidades.filter((nc) => nc.estado === 'ABIERTA').length,
    enVerificacion: noConformidades.filter((nc) => nc.estado === 'EN_VERIFICACION').length,
    cerradas: noConformidades.filter((nc) => nc.estado === 'CERRADA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total NC"
          value={stats.total}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          description="Últimos 30 días"
        />
        <KpiCard
          label="Abiertas"
          value={stats.abiertas}
          icon={<XCircle className="w-5 h-5" />}
          color="warning"
          description="Requieren acción"
        />
        <KpiCard
          label="En Verificación"
          value={stats.enVerificacion}
          icon={<Clock className="w-5 h-5" />}
          color="primary"
          description="En proceso de verificación"
        />
        <KpiCard
          label="Cerradas"
          value={stats.cerradas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
          description="Este mes"
        />
      </KpiCardGrid>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <SectionToolbar
          title="No Conformidades Registradas"
          onFilter={() => console.log('Filtros')}
          primaryAction={{ label: 'Nueva No Conformidad', onClick: () => console.log('Nueva NC') }}
          className="flex-1"
        />
        <ExportButton
          endpoint="/api/hseq/calidad/no-conformidades/export/"
          filename="no_conformidades"
        />
      </div>

      {/* NC Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {noConformidades.map((nc) => (
                <tr key={nc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {nc.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{nc.titulo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatTipo(nc.origen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={nc.severidad} preset="gravedad" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={nc.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(nc.fecha_deteccion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {nc.area_afectada}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {nc.responsable}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </Button>
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

// ==================== ACCIONES CORRECTIVAS SECTION ====================

const AccionesCorrectivasSection = () => {
  const { data, isLoading } = useAccionesCorrectivas();
  const acciones = data?.results ?? [];
  const [evidenciaAccionId, setEvidenciaAccionId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!acciones || acciones.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle className="w-16 h-16" />}
        title="No hay acciones correctivas registradas"
        description="Comience creando acciones correctivas para atender las no conformidades"
        action={{
          label: 'Nueva Acción',
          onClick: () => console.log('Nueva Acción'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: acciones.length,
    pendientes: acciones.filter((a) => a.estado === 'PENDIENTE').length,
    ejecutadas: acciones.filter((a) => a.estado === 'EJECUTADA').length,
    vencidas: acciones.filter((a) => a.estado === 'VENCIDA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Acciones"
          value={stats.total}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          description="Correctivas y preventivas"
        />
        <KpiCard
          label="Pendientes"
          value={stats.pendientes}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          description="En ejecución"
        />
        <KpiCard
          label="Ejecutadas"
          value={stats.ejecutadas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
          description="Completadas"
        />
        <KpiCard
          label="Vencidas"
          value={stats.vencidas}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          description="Requieren atención"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Acciones Correctivas y Preventivas"
        onFilter={() => console.log('Filtros')}
        onExport={() => console.log('Exportar')}
        primaryAction={{ label: 'Nueva Acción', onClick: () => console.log('Nueva Acción') }}
      />

      {/* Actions Grid */}
      <div className="grid grid-cols-1 gap-6">
        {acciones.map((accion) => (
          <Card key={accion.id} variant="bordered" padding="md">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{accion.codigo}</h4>
                    <StatusBadge status={accion.estado} preset="proceso" />
                    <StatusBadge status={accion.tipo} variant="info" label={formatTipo(accion.tipo)} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{accion.descripcion}</p>
                  {accion.nc_relacionada && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      NC Relacionada: {accion.nc_relacionada}
                    </p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{accion.responsable}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Límite</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(accion.fecha_limite), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avance</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{accion.avance}%</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <Progress value={accion.avance} showLabel={false} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                  Ver Detalle
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={() => setEvidenciaAccionId(accion.id)}
                >
                  Evidencias
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Evidencias */}
      {evidenciaAccionId && (
        <Modal
          isOpen={!!evidenciaAccionId}
          onClose={() => setEvidenciaAccionId(null)}
          title="Evidencias de Acción Correctiva"
          size="lg"
        >
          <div className="space-y-4">
            <EvidenceGallery
              entityType="calidad.accioncorrectiva"
              entityId={evidenciaAccionId}
              layout="list"
              showActions
            />
            <EvidenceUploader
              entityType="calidad.accioncorrectiva"
              entityId={evidenciaAccionId}
              categoria="REGISTRO"
              normasRelacionadas={['ISO_9001']}
              placeholder="Adjuntar evidencia de la acción correctiva"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==================== SALIDAS NO CONFORMES SECTION ====================

const SalidasNoConformesSection = () => {
  const { data, isLoading } = useSalidasNoConformes();
  const salidas = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!salidas || salidas.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-16 h-16" />}
        title="No hay salidas no conformes registradas"
        description="Comience registrando las salidas de producción no conformes"
        action={{
          label: 'Nueva Salida NC',
          onClick: () => console.log('Nueva Salida NC'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: salidas.length,
    bloqueadas: salidas.filter((s) => s.estado === 'BLOQUEADA').length,
    enTratamiento: salidas.filter((s) => s.estado === 'EN_TRATAMIENTO').length,
    resueltas: salidas.filter((s) => s.estado === 'RESUELTA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Salidas"
          value={stats.total}
          icon={<Package className="w-5 h-5" />}
          color="orange"
          description="Productos no conformes"
        />
        <KpiCard
          label="Bloqueadas"
          value={stats.bloqueadas}
          icon={<XCircle className="w-5 h-5" />}
          color="danger"
          description="En cuarentena"
        />
        <KpiCard
          label="En Tratamiento"
          value={stats.enTratamiento}
          icon={<Activity className="w-5 h-5" />}
          color="warning"
          description="En proceso de disposición"
        />
        <KpiCard
          label="Resueltas"
          value={stats.resueltas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
          description="Disposición completada"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Salidas No Conformes"
        onFilter={() => console.log('Filtros')}
        onExport={() => console.log('Exportar')}
        primaryAction={{ label: 'Nueva Salida NC', onClick: () => console.log('Nueva Salida NC') }}
      />

      {/* Salidas Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Disposición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {salidas.map((salida) => (
                <tr key={salida.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {salida.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{salida.producto}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {salida.lote}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {salida.cantidad} {salida.unidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={salida.disposicion} variant="info" label={formatStatusLabel(salida.disposicion)} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={salida.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(salida.fecha_deteccion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Package className="w-4 h-4" />
                      </Button>
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

// ==================== CONTROL DE CAMBIOS SECTION ====================

const ControlCambiosSection = () => {
  const { data, isLoading } = useSolicitudesCambio();
  const cambios = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!cambios || cambios.length === 0) {
    return (
      <EmptyState
        icon={<RefreshCw className="w-16 h-16" />}
        title="No hay solicitudes de cambio registradas"
        description="Comience creando solicitudes de cambio para el sistema de gestión"
        action={{
          label: 'Nueva Solicitud',
          onClick: () => console.log('Nueva Solicitud'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    pendientes: cambios.filter((c) => c.estado === 'PENDIENTE').length,
    enRevision: cambios.filter((c) => c.estado === 'EN_REVISION').length,
    aprobadas: cambios.filter((c) => c.estado === 'APROBADA').length,
    implementadas: cambios.filter((c) => c.estado === 'IMPLEMENTADA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Pendientes"
          value={stats.pendientes}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          description="Esperando revisión"
        />
        <KpiCard
          label="En Revisión"
          value={stats.enRevision}
          icon={<Activity className="w-5 h-5" />}
          color="primary"
          description="En evaluación"
        />
        <KpiCard
          label="Aprobadas"
          value={stats.aprobadas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
          description="Listas para implementar"
        />
        <KpiCard
          label="Implementadas"
          value={stats.implementadas}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
          description="Este mes"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Control de Cambios"
        onFilter={() => console.log('Filtros')}
        onExport={() => console.log('Exportar')}
        primaryAction={{ label: 'Nueva Solicitud', onClick: () => console.log('Nueva Solicitud') }}
      />

      {/* Cambios Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Solicitante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cambios.map((cambio) => (
                <tr key={cambio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {cambio.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{cambio.titulo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatStatusLabel(cambio.tipo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={cambio.prioridad} preset="prioridad" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={cambio.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {cambio.solicitante}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(cambio.fecha_solicitud), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
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

// ==================== MAIN PAGE COMPONENT ====================

export default function CalidadPage() {
  const [activeTab, setActiveTab] = useState('no-conformidades');

  const tabs = [
    {
      id: 'no-conformidades',
      label: 'No Conformidades',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: 'acciones-correctivas',
      label: 'Acciones Correctivas',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: 'salidas-no-conformes',
      label: 'Salidas No Conformes',
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'control-cambios',
      label: 'Control de Cambios',
      icon: <RefreshCw className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Calidad"
        description="Control integral de no conformidades, acciones correctivas, salidas no conformes y gestión de cambios"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'no-conformidades' && <NoConformidadesSection />}
        {activeTab === 'acciones-correctivas' && <AccionesCorrectivasSection />}
        {activeTab === 'salidas-no-conformes' && <SalidasNoConformesSection />}
        {activeTab === 'control-cambios' && <ControlCambiosSection />}
      </div>
    </div>
  );
}
