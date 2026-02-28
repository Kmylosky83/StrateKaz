/**
 * Página: Gestión de Seguridad Industrial HSEQ
 *
 * Sistema completo de seguridad industrial con 4 subsecciones:
 * - Permisos de Trabajo
 * - Inspecciones de Seguridad
 * - Entregas EPP
 * - Programas de Seguridad
 */
import { useState } from 'react';
import {
  FileText,
  ClipboardCheck,
  HardHat,
  Shield,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  AlertTriangle,
  TrendingUp,
  Activity,
  Package,
  Calendar,
  User,
  Trash2,
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
  ConfirmDialog,
} from '@/components/common';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import {
  usePermisosTrabajo,
  useInspecciones,
  useEntregasEPP,
  useProgramasSeguridad,
  useDeletePermisoTrabajo,
  useDeleteInspeccion,
  useDeleteEntregaEPP,
  useDeleteProgramaSeguridad,
} from '../hooks/useSeguridadIndustrial';
import type {
  PermisoTrabajo,
  Inspeccion,
  EntregaEPP,
  ProgramaSeguridad,
} from '../types/seguridad-industrial.types';
import PermisoTrabajoFormModal from '../components/PermisoTrabajoFormModal';
import InspeccionFormModal from '../components/InspeccionFormModal';
import EntregaEPPFormModal from '../components/EntregaEPPFormModal';
import ProgramaSeguridadFormModal from '../components/ProgramaSeguridadFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== UTILITY FUNCTIONS ====================

const formatTipo = (tipo: string): string => {
  const tipoMap: Record<string, string> = {
    TRABAJO_ALTURAS: 'Trabajo en Alturas',
    ESPACIOS_CONFINADOS: 'Espacios Confinados',
    TRABAJO_CALIENTE: 'Trabajo en Caliente',
    TRABAJO_ELECTRICO: 'Trabajo Eléctrico',
    EXCAVACION: 'Excavación',
    PREVENCION_RIESGOS: 'Prevención de Riesgos',
    CAPACITACION: 'Capacitación',
    VIGILANCIA_SALUD: 'Vigilancia de Salud',
    INSPECCION: 'Inspección',
    PREPARACION_EMERGENCIAS: 'Preparación para Emergencias',
    INVESTIGACION_INCIDENTES: 'Investigación de Incidentes',
    MEJORA_CONTINUA: 'Mejora Continua',
  };
  return tipoMap[tipo] || formatStatusLabel(tipo);
};

const formatCategoria = (categoria: string): string => {
  const categoriaMap: Record<string, string> = {
    CABEZA: 'Protección de Cabeza',
    OJOS_CARA: 'Protección de Ojos y Cara',
    AUDITIVA: 'Protección Auditiva',
    RESPIRATORIA: 'Protección Respiratoria',
    MANOS: 'Protección de Manos',
    PIES: 'Protección de Pies',
    CUERPO: 'Protección de Cuerpo',
    CAIDAS: 'Protección contra Caídas',
    OTROS: 'Otros',
  };
  return categoriaMap[categoria] || formatStatusLabel(categoria);
};

// ==================== PERMISOS DE TRABAJO SECTION ====================

const PermisosTrabajoSection = () => {
  const { data, isLoading } = usePermisosTrabajo();
  const deleteMutation = useDeletePermisoTrabajo();
  const permisos = data?.results ?? [];

  const [selectedItem, setSelectedItem] = useState<PermisoTrabajo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: PermisoTrabajo) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
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

  if (!permisos || permisos.length === 0) {
    return (
      <>
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title="No hay permisos de trabajo registrados"
          description="Comience emitiendo permisos de trabajo para actividades de alto riesgo"
          action={{
            label: 'Nuevo Permiso',
            onClick: handleNew,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
        <PermisoTrabajoFormModal
          item={selectedItem}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    total: permisos.length,
    aprobados: permisos.filter((p) => p.estado === 'APROBADO').length,
    enEjecucion: permisos.filter((p) => p.estado === 'EN_EJECUCION').length,
    pendientes: permisos.filter((p) => p.estado === 'PENDIENTE_APROBACION').length,
  };

  return (
    <div className="space-y-6">
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Permisos"
          value={stats.total}
          icon={<FileText className="w-6 h-6" />}
          color="blue"
          description="Últimos 30 días"
        />
        <KpiCard
          label="Aprobados"
          value={stats.aprobados}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
          description="Listos para ejecutar"
        />
        <KpiCard
          label="En Ejecución"
          value={stats.enEjecucion}
          icon={<Activity className="w-6 h-6" />}
          color="primary"
          description="Trabajos activos"
        />
        <KpiCard
          label="Pendientes"
          value={stats.pendientes}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
          description="Requieren aprobación"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Permisos de Trabajo"
        onFilter={() => {}}
        onExport={() => {}}
        primaryAction={{ label: 'Nuevo Permiso', onClick: handleNew }}
      />

      {/* Permisos Grid */}
      <div className="grid grid-cols-1 gap-6">
        {permisos.map((permiso) => (
          <Card key={permiso.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {permiso.numero_permiso}
                    </h4>
                    <StatusBadge status={permiso.estado} preset="proceso" />
                    <StatusBadge
                      status={permiso.tipo_permiso.nombre}
                      variant="info"
                      label={permiso.tipo_permiso.nombre}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {permiso.descripcion_trabajo}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {permiso.ubicacion}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Solicitante</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {permiso.solicitante.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Supervisor</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {permiso.supervisor.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Inicio</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(permiso.fecha_inicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Fin</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(permiso.fecha_fin), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">SST:</span>
                  {permiso.autorizado_sst ? (
                    <CheckCircle className="w-4 h-4 text-success-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Operaciones:</span>
                  {permiso.autorizado_operaciones ? (
                    <CheckCircle className="w-4 h-4 text-success-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => handleEdit(permiso)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4 text-danger-600" />}
                  onClick={() => setDeleteId(permiso.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PermisoTrabajoFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Permiso"
        description="¿Está seguro de eliminar este permiso de trabajo? Esta acción no se puede deshacer."
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== INSPECCIONES SECTION ====================

const InspeccionesSection = () => {
  const { data, isLoading } = useInspecciones();
  const deleteMutation = useDeleteInspeccion();
  const inspecciones = data?.results ?? [];

  const [selectedItem, setSelectedItem] = useState<Inspeccion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: Inspeccion) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
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

  if (!inspecciones || inspecciones.length === 0) {
    return (
      <>
        <EmptyState
          icon={<ClipboardCheck className="w-16 h-16" />}
          title="No hay inspecciones registradas"
          description="Comience programando inspecciones de seguridad en las diferentes áreas"
          action={{
            label: 'Nueva Inspección',
            onClick: handleNew,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
        <InspeccionFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />
      </>
    );
  }

  const stats = {
    total: inspecciones.length,
    programadas: inspecciones.filter((i) => i.estado === 'PROGRAMADA').length,
    completadas: inspecciones.filter((i) => i.estado === 'COMPLETADA').length,
    conHallazgos: inspecciones.filter((i) => i.numero_hallazgos_criticos > 0).length,
  };

  return (
    <div className="space-y-6">
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Inspecciones"
          value={stats.total}
          icon={<ClipboardCheck className="w-6 h-6" />}
          color="purple"
          description="Este mes"
        />
        <KpiCard
          label="Programadas"
          value={stats.programadas}
          icon={<Calendar className="w-6 h-6" />}
          color="warning"
          description="Por realizar"
        />
        <KpiCard
          label="Completadas"
          value={stats.completadas}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
          description="Este mes"
        />
        <KpiCard
          label="Hallazgos Críticos"
          value={stats.conHallazgos}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
          description="Requieren acción"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Inspecciones de Seguridad"
        onFilter={() => {}}
        onExport={() => {}}
        primaryAction={{ label: 'Nueva Inspección', onClick: handleNew }}
      />

      {/* Inspecciones Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Inspector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cumplimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resultado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hallazgos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {inspecciones.map((inspeccion) => (
                <tr key={inspeccion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {inspeccion.numero_inspeccion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{inspeccion.tipo_inspeccion.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(inspeccion.fecha_programada), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>{inspeccion.ubicacion}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{inspeccion.area}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {inspeccion.inspector.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={inspeccion.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {inspeccion.porcentaje_cumplimiento !== null ? (
                      <div className="flex items-center gap-2">
                        <Progress value={inspeccion.porcentaje_cumplimiento} className="w-20" />
                        <span className="text-xs">{inspeccion.porcentaje_cumplimiento}%</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {inspeccion.resultado_global ? (
                      <StatusBadge status={inspeccion.resultado_global} preset="proceso" />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {inspeccion.numero_hallazgos > 0 ? (
                      <div className="flex items-center gap-1">
                        <span>{inspeccion.numero_hallazgos}</span>
                        {inspeccion.numero_hallazgos_criticos > 0 && (
                          <AlertTriangle className="w-4 h-4 text-danger-600" />
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(inspeccion)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(inspeccion.id)}>
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

      <InspeccionFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Inspección"
        description="¿Está seguro de eliminar esta inspección? Esta acción no se puede deshacer."
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== ENTREGAS EPP SECTION ====================

const EntregasEPPSection = () => {
  const { data, isLoading } = useEntregasEPP();
  const deleteMutation = useDeleteEntregaEPP();
  const entregas = data?.results ?? [];

  const [selectedItem, setSelectedItem] = useState<EntregaEPP | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: EntregaEPP) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
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

  if (!entregas || entregas.length === 0) {
    return (
      <>
        <EmptyState
          icon={<HardHat className="w-16 h-16" />}
          title="No hay entregas de EPP registradas"
          description="Comience registrando las entregas de equipos de protección personal"
          action={{
            label: 'Nueva Entrega',
            onClick: handleNew,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
        <EntregaEPPFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />
      </>
    );
  }

  const stats = {
    total: entregas.length,
    enUso: entregas.filter((e) => e.estado === 'EN_USO').length,
    porVencer: entregas.filter((e) => {
      if (!e.fecha_reposicion_programada) return false;
      const diasRestantes = Math.floor(
        (new Date(e.fecha_reposicion_programada).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return diasRestantes <= 30 && diasRestantes > 0;
    }).length,
    conCapacitacion: entregas.filter((e) => e.capacitacion_realizada).length,
  };

  return (
    <div className="space-y-6">
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Entregas"
          value={stats.total}
          icon={<HardHat className="w-6 h-6" />}
          color="orange"
          description="Este mes"
        />
        <KpiCard
          label="En Uso"
          value={stats.enUso}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
          description="EPP activos"
        />
        <KpiCard
          label="Por Vencer"
          value={stats.porVencer}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
          description="Próximos 30 días"
        />
        <KpiCard
          label="Con Capacitación"
          value={stats.conCapacitacion}
          icon={<User className="w-6 h-6" />}
          color="primary"
          description="Capacitación realizada"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Entregas de EPP"
        onFilter={() => {}}
        onExport={() => {}}
        primaryAction={{ label: 'Nueva Entrega', onClick: handleNew }}
      />

      {/* Entregas Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  EPP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Marca/Modelo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Talla
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reposición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {entregas.map((entrega) => (
                <tr key={entrega.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {entrega.numero_entrega}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{entrega.colaborador.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entrega.colaborador.username}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{entrega.tipo_epp.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Cant: {entrega.cantidad}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <StatusBadge
                      status={entrega.tipo_epp.categoria}
                      variant="info"
                      label={formatCategoria(entrega.tipo_epp.categoria)}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>{entrega.marca}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{entrega.modelo}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {entrega.talla}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(entrega.fecha_entrega), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {entrega.fecha_reposicion_programada
                      ? format(new Date(entrega.fecha_reposicion_programada), 'dd/MM/yyyy', {
                          locale: es,
                        })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={entrega.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(entrega)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(entrega.id)}>
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

      <EntregaEPPFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Entrega EPP"
        description="¿Está seguro de eliminar esta entrega de EPP? Esta acción no se puede deshacer."
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== PROGRAMAS DE SEGURIDAD SECTION ====================

const ProgramasSeguridadSection = () => {
  const { data, isLoading } = useProgramasSeguridad();
  const deleteMutation = useDeleteProgramaSeguridad();
  const programas = data?.results ?? [];

  const [selectedItem, setSelectedItem] = useState<ProgramaSeguridad | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: ProgramaSeguridad) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
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

  if (!programas || programas.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Shield className="w-16 h-16" />}
          title="No hay programas de seguridad registrados"
          description="Comience creando programas de seguridad para gestionar las actividades de SST"
          action={{
            label: 'Nuevo Programa',
            onClick: handleNew,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
        <ProgramaSeguridadFormModal
          item={selectedItem}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    total: programas.length,
    enEjecucion: programas.filter((p) => p.estado === 'EN_EJECUCION').length,
    planificados: programas.filter((p) => p.estado === 'PLANIFICADO').length,
    promedioAvance: Math.round(
      programas.reduce((acc, p) => acc + p.porcentaje_avance, 0) / programas.length
    ),
  };

  const presupuestoTotal = programas.reduce((acc, p) => acc + (p.presupuesto_asignado || 0), 0);
  const presupuestoEjecutado = programas.reduce((acc, p) => acc + p.presupuesto_ejecutado, 0);

  return (
    <div className="space-y-6">
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Programas"
          value={stats.total}
          icon={<Shield className="w-6 h-6" />}
          color="purple"
          description="Activos en el sistema"
        />
        <KpiCard
          label="En Ejecución"
          value={stats.enEjecucion}
          icon={<Activity className="w-6 h-6" />}
          color="primary"
          description="En desarrollo actualmente"
        />
        <KpiCard
          label="Avance Promedio"
          value={`${stats.promedioAvance}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="success"
          description="Progreso general"
        />
        <KpiCard
          label="Ejecución Presupuestal"
          value={
            presupuestoTotal > 0
              ? `${Math.round((presupuestoEjecutado / presupuestoTotal) * 100)}%`
              : '0%'
          }
          icon={<Activity className="w-6 h-6" />}
          color="warning"
          description={
            presupuestoTotal > 0
              ? `$${(presupuestoEjecutado / 1000000).toFixed(1)}M de $${(presupuestoTotal / 1000000).toFixed(1)}M`
              : 'Sin presupuesto'
          }
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Programas de Seguridad"
        onFilter={() => {}}
        onExport={() => {}}
        primaryAction={{ label: 'Nuevo Programa', onClick: handleNew }}
      />

      {/* Programas Grid */}
      <div className="grid grid-cols-1 gap-6">
        {programas.map((programa) => (
          <Card key={programa.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {programa.codigo}
                    </h4>
                    <StatusBadge status={programa.estado} preset="proceso" />
                    <StatusBadge
                      status={programa.tipo_programa}
                      variant="info"
                      label={formatTipo(programa.tipo_programa)}
                    />
                  </div>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {programa.nombre}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {programa.descripcion}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {programa.responsable.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Inicio</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(programa.fecha_inicio), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Fin</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(programa.fecha_fin), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Presupuesto</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {programa.presupuesto_asignado
                      ? `$${(programa.presupuesto_asignado / 1000000).toFixed(1)}M`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Avance del Programa
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {programa.porcentaje_avance}%
                  </span>
                </div>
                <Progress value={programa.porcentaje_avance} showLabel={false} />
              </div>

              {presupuestoTotal > 0 && programa.presupuesto_asignado ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ejecución Presupuestal
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      ${(programa.presupuesto_ejecutado / 1000000).toFixed(1)}M / $
                      {(programa.presupuesto_asignado / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <Progress
                    value={programa.presupuesto_ejecutado}
                    max={programa.presupuesto_asignado}
                    showLabel={false}
                  />
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => handleEdit(programa)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4 text-danger-600" />}
                  onClick={() => setDeleteId(programa.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ProgramaSeguridadFormModal
        item={selectedItem}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Programa"
        description="¿Está seguro de eliminar este programa de seguridad? Esta acción no se puede deshacer."
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================

export default function SeguridadIndustrialPage() {
  const [activeTab, setActiveTab] = useState('permisos-trabajo');

  const tabs = [
    {
      id: 'permisos-trabajo',
      label: 'Permisos de Trabajo',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'inspecciones',
      label: 'Inspecciones',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: 'entregas-epp',
      label: 'Entregas EPP',
      icon: <HardHat className="w-4 h-4" />,
    },
    {
      id: 'programas-seguridad',
      label: 'Programas de Seguridad',
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Seguridad Industrial"
        description="Control integral de permisos de trabajo, inspecciones de seguridad, entregas de EPP y programas de seguridad"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'permisos-trabajo' && <PermisosTrabajoSection />}
        {activeTab === 'inspecciones' && <InspeccionesSection />}
        {activeTab === 'entregas-epp' && <EntregasEPPSection />}
        {activeTab === 'programas-seguridad' && <ProgramasSeguridadSection />}
      </div>
    </div>
  );
}
