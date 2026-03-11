/**
 * Página: Gestión de Calidad HSEQ
 *
 * Sistema completo de gestión de calidad con 4 subsecciones:
 * - No Conformidades (CRUD completo)
 * - Acciones Correctivas (CRUD completo)
 * - Salidas No Conformes (CRUD completo)
 * - Control de Cambios / Solicitudes (CRUD completo)
 */
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
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
  ConfirmDialog,
} from '@/components/common';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  useNoConformidades,
  useDeleteNoConformidad,
  useAccionesCorrectivas,
  useDeleteAccionCorrectiva,
  useSalidasNoConformes,
  useDeleteSalidaNoConforme,
  useSolicitudesCambio,
  useDeleteSolicitudCambio,
} from '../hooks/useCalidad';
import type {
  NoConformidadList,
  AccionCorrectivaList,
  SalidaNoConformeList,
  SolicitudCambioList,
} from '../types/calidad.types';

import NoConformidadFormModal from '../components/NoConformidadFormModal';
import AccionCorrectivaFormModal from '../components/AccionCorrectivaFormModal';
import SalidaNoConformeFormModal from '../components/SalidaNoConformeFormModal';
import SolicitudCambioFormModal from '../components/SolicitudCambioFormModal';

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
    CONTENCION: 'Contención',
  };
  return tipoMap[tipo] || formatStatusLabel(tipo);
};

// ==================== NO CONFORMIDADES SECTION ====================

const NoConformidadesSection = () => {
  const { data, isLoading } = useNoConformidades();
  const deleteMutation = useDeleteNoConformidad();
  const noConformidades = data?.results ?? [];

  const [selectedItem, setSelectedItem] = useState<NoConformidadList | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEdit = (nc: NoConformidadList) => {
    setSelectedItem(nc);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!noConformidades || noConformidades.length === 0) {
    return (
      <>
        <EmptyState
          icon={<AlertTriangle className="w-16 h-16" />}
          title="No hay no conformidades registradas"
          description="Comience registrando las no conformidades detectadas en el sistema de calidad"
          action={{
            label: 'Nueva No Conformidad',
            onClick: handleCreate,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
        <NoConformidadFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />
      </>
    );
  }

  const stats = {
    total: noConformidades.length,
    abiertas: noConformidades.filter((nc) => nc.estado === 'ABIERTA').length,
    enVerificacion: noConformidades.filter((nc) => nc.estado === 'VERIFICACION').length,
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
          description="Registradas"
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
          description="Resueltas"
        />
      </KpiCardGrid>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <SectionToolbar
          title="No Conformidades Registradas"
          primaryAction={
            canCreate ? { label: 'Nueva No Conformidad', onClick: handleCreate } : undefined
          }
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(nc)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(nc.id)}>
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

      {/* Modal CRUD */}
      <NoConformidadFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar No Conformidad"
        message="¿Está seguro de que desea eliminar esta no conformidad? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== ACCIONES CORRECTIVAS SECTION ====================

const AccionesCorrectivasSection = () => {
  const { data, isLoading } = useAccionesCorrectivas();
  const deleteMutation = useDeleteAccionCorrectiva();
  const acciones = data?.results ?? [];

  const [selectedItem, setSelectedItem] = useState<AccionCorrectivaList | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [evidenciaAccionId, setEvidenciaAccionId] = useState<number | null>(null);

  const handleCreate = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEdit = (accion: AccionCorrectivaList) => {
    setSelectedItem(accion);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!acciones || acciones.length === 0) {
    return (
      <>
        <EmptyState
          icon={<CheckCircle className="w-16 h-16" />}
          title="No hay acciones correctivas registradas"
          description="Comience creando acciones correctivas para atender las no conformidades"
          action={{
            label: 'Nueva Acción',
            onClick: handleCreate,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
        <AccionCorrectivaFormModal
          item={selectedItem}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    total: acciones.length,
    pendientes: acciones.filter((a) => a.estado === 'PLANIFICADA' || a.estado === 'EN_EJECUCION')
      .length,
    ejecutadas: acciones.filter((a) => a.estado === 'EJECUTADA' || a.estado === 'VERIFICADA')
      .length,
    vencidas: acciones.filter((a) => a.esta_vencida).length,
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
        primaryAction={canCreate ? { label: 'Nueva Acción', onClick: handleCreate } : undefined}
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
                    <StatusBadge
                      status={accion.tipo}
                      variant="info"
                      label={formatTipo(accion.tipo)}
                    />
                    {accion.esta_vencida && (
                      <StatusBadge status="VENCIDA" variant="error" label="Vencida" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{accion.descripcion}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {accion.responsable_detail
                      ? `${accion.responsable_detail.first_name} ${accion.responsable_detail.last_name}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Límite</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(accion.fecha_limite), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => handleEdit(accion)}
                >
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
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4 text-danger-600" />}
                  onClick={() => setDeleteId(accion.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal CRUD */}
      <AccionCorrectivaFormModal
        item={selectedItem}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Acción Correctiva"
        message="¿Está seguro de que desea eliminar esta acción? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

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
  const deleteMutation = useDeleteSalidaNoConforme();
  const salidas = data?.results ?? [];

  const [selectedItem, setSelectedItem] = useState<SalidaNoConformeList | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEdit = (salida: SalidaNoConformeList) => {
    setSelectedItem(salida);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!salidas || salidas.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Package className="w-16 h-16" />}
          title="No hay salidas no conformes registradas"
          description="Comience registrando las salidas de producción no conformes"
          action={{
            label: 'Nueva Salida NC',
            onClick: handleCreate,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
        <SalidaNoConformeFormModal
          item={selectedItem}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    total: salidas.length,
    bloqueadas: salidas.filter((s) => s.bloqueada).length,
    enTratamiento: salidas.filter((s) => s.estado === 'EN_TRATAMIENTO').length,
    resueltas: salidas.filter((s) => s.estado === 'RESUELTA' || s.estado === 'CERRADA').length,
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
        primaryAction={canCreate ? { label: 'Nueva Salida NC', onClick: handleCreate } : undefined}
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
                    <p className="font-medium">{salida.descripcion_producto}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {salida.cantidad_afectada} {salida.unidad_medida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {salida.disposicion ? (
                      <StatusBadge
                        status={salida.disposicion}
                        variant="info"
                        label={formatStatusLabel(salida.disposicion)}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Sin definir</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={salida.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(salida.fecha_deteccion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(salida)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(salida.id)}>
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

      {/* Modal CRUD */}
      <SalidaNoConformeFormModal
        item={selectedItem}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Salida No Conforme"
        message="¿Está seguro de que desea eliminar esta salida no conforme? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== CONTROL DE CAMBIOS SECTION ====================

const ControlCambiosSection = () => {
  const { data, isLoading } = useSolicitudesCambio();
  const deleteMutation = useDeleteSolicitudCambio();
  const cambios = data?.results ?? [];

  const [selectedItem, setSelectedItem] = useState<SolicitudCambioList | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEdit = (cambio: SolicitudCambioList) => {
    setSelectedItem(cambio);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!cambios || cambios.length === 0) {
    return (
      <>
        <EmptyState
          icon={<RefreshCw className="w-16 h-16" />}
          title="No hay solicitudes de cambio registradas"
          description="Comience creando solicitudes de cambio para el sistema de gestión"
          action={{
            label: 'Nueva Solicitud',
            onClick: handleCreate,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
        <SolicitudCambioFormModal
          item={selectedItem}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    pendientes: cambios.filter((c) => c.estado === 'SOLICITADA').length,
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
          description="Completadas"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Control de Cambios"
        primaryAction={canCreate ? { label: 'Nueva Solicitud', onClick: handleCreate } : undefined}
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
                    {cambio.solicitante_detail
                      ? `${cambio.solicitante_detail.first_name} ${cambio.solicitante_detail.last_name}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(cambio.fecha_solicitud), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cambio)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(cambio.id)}>
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

      {/* Modal CRUD */}
      <SolicitudCambioFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Solicitud de Cambio"
        message="¿Está seguro de que desea eliminar esta solicitud? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================

export default function CalidadPage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.HSEQ_MANAGEMENT, Sections.GESTION_CALIDAD, 'create');

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
