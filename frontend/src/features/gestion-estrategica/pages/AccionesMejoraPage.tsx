/**
 * AccionesMejoraPage - No Conformidades y Acciones Correctivas
 *
 * Página del módulo Sistema de Gestión que muestra las no conformidades
 * y acciones correctivas/preventivas/mejora provenientes del backend HSEQ Calidad.
 *
 * MODULE_CODE: acciones_mejora
 */
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  ListChecks,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  User,
  Calendar,
  Target,
  AlertCircle,
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
  Badge,
  Progress,
  ConfirmDialog,
} from '@/components/common';
import { formatStatusLabel } from '@/components/common/StatusBadge';

import {
  useNoConformidades,
  useAccionesCorrectivas,
  useDeleteNoConformidad,
  useDeleteAccionCorrectiva,
} from '@/features/hseq/hooks/useCalidad';

import type {
  NoConformidad,
  AccionCorrectiva,
  EstadoNoConformidad,
  EstadoAccion,
} from '@/features/hseq/types/calidad.types';

import NoConformidadFormModal from '@/features/hseq/components/NoConformidadFormModal';
import AccionCorrectivaFormModal from '@/features/hseq/components/AccionCorrectivaFormModal';

// ==================== CONSTANTS ====================

const MODULE_CODE = 'acciones_mejora';

const TAB_LIST = [
  { id: 'no-conformidades', label: 'No Conformidades', icon: <ShieldAlert className="w-4 h-4" /> },
  { id: 'acciones', label: 'Acciones Correctivas', icon: <ListChecks className="w-4 h-4" /> },
];

// ==================== FORMAT HELPERS ====================

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
    PROCESO_INTERNO: 'Proceso Interno',
    AUDITORIA_CLIENTE: 'Auditoría de Cliente',
    QUEJA_PROVEEDOR: 'Queja de Proveedor',
    PRODUCTO_NO_CONFORME: 'Producto No Conforme',
    REVISION_DIRECCION: 'Revisión por la Dirección',
    MEJORA_CONTINUA: 'Mejora Continua',
    REAL: 'Real',
    POTENCIAL: 'Potencial',
    OBSERVACION: 'Observación',
  };
  return tipoMap[tipo] || formatStatusLabel(tipo);
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '\u2014';
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
  } catch {
    return '\u2014';
  }
};

const getUserName = (detail?: {
  first_name: string;
  last_name: string;
  full_name?: string;
}): string => {
  if (!detail) return '\u2014';
  if (detail.full_name) return detail.full_name;
  const name = `${detail.first_name} ${detail.last_name}`.trim();
  return name || '\u2014';
};

const getEstadoNCVariant = (
  estado: EstadoNoConformidad
): 'info' | 'warning' | 'success' | 'gray' | 'danger' => {
  const map: Record<EstadoNoConformidad, 'info' | 'warning' | 'success' | 'gray' | 'danger'> = {
    ABIERTA: 'info',
    EN_ANALISIS: 'warning',
    EN_TRATAMIENTO: 'warning',
    VERIFICACION: 'info',
    CERRADA: 'success',
    CANCELADA: 'gray',
  };
  return map[estado] || 'gray';
};

const getEstadoAccionVariant = (
  estado: EstadoAccion
): 'info' | 'warning' | 'success' | 'gray' | 'danger' => {
  const map: Record<EstadoAccion, 'info' | 'warning' | 'success' | 'gray' | 'danger'> = {
    PLANIFICADA: 'gray',
    EN_EJECUCION: 'info',
    EJECUTADA: 'success',
    VERIFICADA: 'success',
    CERRADA: 'success',
    CANCELADA: 'gray',
  };
  return map[estado] || 'gray';
};

const getTipoAccionColor = (tipo: string): 'danger' | 'warning' | 'info' | 'primary' => {
  const map: Record<string, 'danger' | 'warning' | 'info' | 'primary'> = {
    CORRECTIVA: 'danger',
    PREVENTIVA: 'warning',
    MEJORA: 'info',
    CONTENCION: 'primary',
  };
  return map[tipo] || 'primary';
};

const isVencida = (fechaLimite: string | null | undefined, estado: EstadoAccion): boolean => {
  if (!fechaLimite) return false;
  if (
    estado === 'CERRADA' ||
    estado === 'CANCELADA' ||
    estado === 'VERIFICADA' ||
    estado === 'EJECUTADA'
  ) {
    return false;
  }
  return new Date(fechaLimite) < new Date();
};

const getAvanceAccion = (estado: EstadoAccion): number => {
  const avanceMap: Record<EstadoAccion, number> = {
    PLANIFICADA: 10,
    EN_EJECUCION: 40,
    EJECUTADA: 70,
    VERIFICADA: 90,
    CERRADA: 100,
    CANCELADA: 0,
  };
  return avanceMap[estado] ?? 0;
};

// ==================== SAFE DATA EXTRACTION ====================

const extractArray = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'results' in data) {
    const results = (data as { results?: unknown }).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
};

// ==================== MAIN COMPONENT ====================

export const AccionesMejoraPage = () => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.OPORTUNIDADES_MEJORA, 'create');

  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState('no-conformidades');

  // ---- NC state ----
  const [searchNC, setSearchNC] = useState('');
  const [deleteNCId, setDeleteNCId] = useState<number | null>(null);
  const [ncModalOpen, setNcModalOpen] = useState(false);
  const [selectedNC, setSelectedNC] = useState<NoConformidad | null>(null);

  // ---- Acciones state ----
  const [searchAccion, setSearchAccion] = useState('');
  const [deleteAccionId, setDeleteAccionId] = useState<number | null>(null);
  const [accionModalOpen, setAccionModalOpen] = useState(false);
  const [selectedAccion, setSelectedAccion] = useState<AccionCorrectiva | null>(null);

  // ---- Data hooks ----
  const noConformidadesQuery = useNoConformidades();
  const accionesQuery = useAccionesCorrectivas();

  // ---- Mutation hooks ----
  const deleteNCMutation = useDeleteNoConformidad();
  const deleteAccionMutation = useDeleteAccionCorrectiva();

  // ---- Processed data ----
  const noConformidades = useMemo(
    () => extractArray<NoConformidad>(noConformidadesQuery.data),
    [noConformidadesQuery.data]
  );

  const acciones = useMemo(
    () => extractArray<AccionCorrectiva>(accionesQuery.data),
    [accionesQuery.data]
  );

  // ---- Filtered data ----
  const filteredNC = useMemo(() => {
    if (!searchNC.trim()) return noConformidades;
    const term = searchNC.toLowerCase();
    return noConformidades.filter(
      (nc) =>
        nc.codigo?.toLowerCase().includes(term) ||
        nc.titulo?.toLowerCase().includes(term) ||
        nc.descripcion?.toLowerCase().includes(term)
    );
  }, [noConformidades, searchNC]);

  const filteredAcciones = useMemo(() => {
    if (!searchAccion.trim()) return acciones;
    const term = searchAccion.toLowerCase();
    return acciones.filter(
      (ac) =>
        ac.codigo?.toLowerCase().includes(term) ||
        ac.descripcion?.toLowerCase().includes(term) ||
        ac.objetivo?.toLowerCase().includes(term)
    );
  }, [acciones, searchAccion]);

  // ---- NC KPI stats ----
  const ncStats = useMemo(() => {
    const total = noConformidades.length;
    const abiertas = noConformidades.filter(
      (nc) =>
        nc.estado === 'ABIERTA' || nc.estado === 'EN_ANALISIS' || nc.estado === 'EN_TRATAMIENTO'
    ).length;
    const enVerificacion = noConformidades.filter((nc) => nc.estado === 'VERIFICACION').length;
    const cerradas = noConformidades.filter((nc) => nc.estado === 'CERRADA').length;
    return { total, abiertas, enVerificacion, cerradas };
  }, [noConformidades]);

  // ---- Acciones KPI stats ----
  const accionStats = useMemo(() => {
    const total = acciones.length;
    const pendientes = acciones.filter(
      (ac) => ac.estado === 'PLANIFICADA' || ac.estado === 'EN_EJECUCION'
    ).length;
    const ejecutadas = acciones.filter(
      (ac) => ac.estado === 'EJECUTADA' || ac.estado === 'VERIFICADA' || ac.estado === 'CERRADA'
    ).length;
    const vencidas = acciones.filter((ac) => isVencida(ac.fecha_limite, ac.estado)).length;
    return { total, pendientes, ejecutadas, vencidas };
  }, [acciones]);

  // ---- Delete handlers ----
  const handleConfirmDeleteNC = () => {
    if (deleteNCId === null) return;
    deleteNCMutation.mutate(deleteNCId, {
      onSettled: () => setDeleteNCId(null),
    });
  };

  const handleConfirmDeleteAccion = () => {
    if (deleteAccionId === null) return;
    deleteAccionMutation.mutate(deleteAccionId, {
      onSettled: () => setDeleteAccionId(null),
    });
  };

  // ---- Create/Edit handlers ----
  const handleCreateNC = () => {
    setSelectedNC(null);
    setNcModalOpen(true);
  };

  const handleEditNC = (nc: NoConformidad) => {
    setSelectedNC(nc);
    setNcModalOpen(true);
  };

  const handleCloseNCModal = () => {
    setNcModalOpen(false);
    setSelectedNC(null);
  };

  const handleCreateAccion = () => {
    setSelectedAccion(null);
    setAccionModalOpen(true);
  };

  const handleEditAccion = (ac: AccionCorrectiva) => {
    setSelectedAccion(ac);
    setAccionModalOpen(true);
  };

  const handleCloseAccionModal = () => {
    setAccionModalOpen(false);
    setSelectedAccion(null);
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6" data-module={MODULE_CODE}>
      {/* Page Header */}
      <PageHeader
        title="Acciones de Mejora"
        description="No conformidades, acciones correctivas, preventivas y oportunidades de mejora del sistema de gesti\u00f3n"
      />

      {/* Tabs */}
      <Tabs tabs={TAB_LIST} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      {activeTab === 'no-conformidades' && (
        <NoConformidadesTab
          data={filteredNC}
          stats={ncStats}
          isLoading={noConformidadesQuery.isLoading}
          isError={noConformidadesQuery.isError}
          search={searchNC}
          onSearchChange={setSearchNC}
          onCreate={handleCreateNC}
          onEdit={handleEditNC}
          onDelete={(id) => setDeleteNCId(id)}
        />
      )}

      {activeTab === 'acciones' && (
        <AccionesCorrectivasTab
          data={filteredAcciones}
          stats={accionStats}
          isLoading={accionesQuery.isLoading}
          isError={accionesQuery.isError}
          search={searchAccion}
          onSearchChange={setSearchAccion}
          onCreate={handleCreateAccion}
          onEdit={handleEditAccion}
          onDelete={(id) => setDeleteAccionId(id)}
        />
      )}

      {/* Delete NC Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteNCId !== null}
        onClose={() => setDeleteNCId(null)}
        onConfirm={handleConfirmDeleteNC}
        title="Eliminar No Conformidad"
        message={
          '\u00bfEst\u00e1 seguro de que desea eliminar esta no conformidad? Esta acci\u00f3n no se puede deshacer y tambi\u00e9n eliminar\u00e1 las acciones correctivas asociadas.'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteNCMutation.isPending}
      />

      {/* Delete Accion Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteAccionId !== null}
        onClose={() => setDeleteAccionId(null)}
        onConfirm={handleConfirmDeleteAccion}
        title="Eliminar Acci\u00f3n Correctiva"
        message={
          '\u00bfEst\u00e1 seguro de que desea eliminar esta acci\u00f3n correctiva? Esta acci\u00f3n no se puede deshacer.'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteAccionMutation.isPending}
      />

      {/* CRUD Modals */}
      <NoConformidadFormModal item={selectedNC} isOpen={ncModalOpen} onClose={handleCloseNCModal} />
      <AccionCorrectivaFormModal
        item={selectedAccion}
        isOpen={accionModalOpen}
        onClose={handleCloseAccionModal}
      />
    </div>
  );
};

// ==================== NO CONFORMIDADES TAB ====================

interface NoConformidadesTabProps {
  data: NoConformidad[];
  stats: { total: number; abiertas: number; enVerificacion: number; cerradas: number };
  isLoading: boolean;
  isError: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (nc: NoConformidad) => void;
  onDelete: (id: number) => void;
}

const NoConformidadesTab = ({
  data,
  stats,
  isLoading,
  isError,
  search,
  onSearchChange,
  onCreate,
  onEdit,
  onDelete,
}: NoConformidadesTabProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card padding="lg">
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12" />}
          title="Error al cargar datos"
          description="No se pudieron cargar las no conformidades. Intente nuevamente."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total NC"
          value={stats.total}
          icon={<FileWarning className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          label="Abiertas"
          value={stats.abiertas}
          icon={<AlertCircle className="w-5 h-5" />}
          color="warning"
          description="En an\u00e1lisis o tratamiento"
        />
        <KpiCard
          label="En Verificaci\u00f3n"
          value={stats.enVerificacion}
          icon={<Search className="w-5 h-5" />}
          color="info"
        />
        <KpiCard
          label="Cerradas"
          value={stats.cerradas}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
        />
      </KpiCardGrid>

      {/* Toolbar */}
      <SectionToolbar
        title="No Conformidades"
        count={data.length}
        searchable
        searchValue={search}
        searchPlaceholder="Buscar por c\u00f3digo o t\u00edtulo..."
        onSearchChange={onSearchChange}
        primaryAction={
          canCreate
            ? {
                label: 'Nueva NC',
                onClick: onCreate,
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {/* Table */}
      {data.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<ShieldAlert className="w-12 h-12" />}
            title="Sin no conformidades"
            description="No se han registrado no conformidades. Cree la primera para comenzar el seguimiento."
            action={{
              label: 'Nueva No Conformidad',
              onClick: onCreate,
              icon: <Plus className="w-4 h-4" />,
            }}
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    C\u00f3digo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    T\u00edtulo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Severidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((nc) => (
                  <tr
                    key={nc.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-primary-600 dark:text-primary-400">
                        {nc.codigo || '\u2014'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {nc.titulo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {formatTipo(nc.tipo)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatTipo(nc.origen)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={nc.severidad} preset="gravedad" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge
                        status={nc.estado}
                        preset="proceso"
                        variant={getEstadoNCVariant(nc.estado)}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(nc.fecha_deteccion)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {getUserName(nc.responsable_analisis_detail || nc.detectado_por_detail)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(nc)}
                          aria-label={`Editar ${nc.codigo}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(nc.id)}
                          aria-label={`Eliminar ${nc.codigo}`}
                          className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== ACCIONES CORRECTIVAS TAB ====================

interface AccionesCorrectivasTabProps {
  data: AccionCorrectiva[];
  stats: { total: number; pendientes: number; ejecutadas: number; vencidas: number };
  isLoading: boolean;
  isError: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (ac: AccionCorrectiva) => void;
  onDelete: (id: number) => void;
}

const AccionesCorrectivasTab = ({
  data,
  stats,
  isLoading,
  isError,
  search,
  onSearchChange,
  onCreate,
  onEdit,
  onDelete,
}: AccionesCorrectivasTabProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card padding="lg">
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12" />}
          title="Error al cargar datos"
          description="No se pudieron cargar las acciones correctivas. Intente nuevamente."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Acciones"
          value={stats.total}
          icon={<ListChecks className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          label="Pendientes"
          value={stats.pendientes}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          description="Planificadas o en ejecuci\u00f3n"
        />
        <KpiCard
          label="Ejecutadas"
          value={stats.ejecutadas}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
          description="Ejecutadas, verificadas o cerradas"
        />
        <KpiCard
          label="Vencidas"
          value={stats.vencidas}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          valueColor={stats.vencidas > 0 ? 'text-danger-600 dark:text-danger-400' : undefined}
        />
      </KpiCardGrid>

      {/* Toolbar */}
      <SectionToolbar
        title="Acciones Correctivas"
        count={data.length}
        searchable
        searchValue={search}
        searchPlaceholder="Buscar por c\u00f3digo o descripci\u00f3n..."
        onSearchChange={onSearchChange}
        primaryAction={
          canCreate
            ? {
                label: 'Nueva Acci\u00f3n',
                onClick: onCreate,
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {/* Card-based layout */}
      {data.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<ListChecks className="w-12 h-12" />}
            title="Sin acciones correctivas"
            description="No se han registrado acciones correctivas. Cree la primera para dar seguimiento a las no conformidades."
            action={{
              label: 'Nueva Acci\u00f3n Correctiva',
              onClick: onCreate,
              icon: <Plus className="w-4 h-4" />,
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((ac) => {
            const vencida = isVencida(ac.fecha_limite, ac.estado);
            const avance = getAvanceAccion(ac.estado);

            return (
              <Card key={ac.id} padding="none" className="flex flex-col">
                {/* Card Header */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-medium text-primary-600 dark:text-primary-400">
                          {ac.codigo || '\u2014'}
                        </span>
                        <Badge variant={getTipoAccionColor(ac.tipo)} size="sm">
                          {formatTipo(ac.tipo)}
                        </Badge>
                      </div>
                      <StatusBadge
                        status={ac.estado}
                        preset="proceso"
                        variant={getEstadoAccionVariant(ac.estado)}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(ac)}
                        aria-label={`Editar ${ac.codigo}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(ac.id)}
                        aria-label={`Eliminar ${ac.codigo}`}
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-3 flex-1 space-y-3">
                  {/* Descripci\u00f3n */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {ac.descripcion || 'Sin descripci\u00f3n'}
                  </p>

                  {/* Detalles */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {getUserName(ac.responsable_detail)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span
                        className={
                          vencida
                            ? 'text-danger-600 dark:text-danger-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }
                      >
                        {formatDate(ac.fecha_limite)}
                        {vencida && ' (Vencida)'}
                      </span>
                    </div>
                    {ac.objetivo && (
                      <div className="flex items-start gap-2 text-sm">
                        <Target className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400 line-clamp-1">
                          {ac.objetivo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer - Progress */}
                <div className="px-4 pb-4 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Avance</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {avance}%
                    </span>
                  </div>
                  <Progress
                    value={avance}
                    size="sm"
                    color={
                      vencida
                        ? 'danger'
                        : avance >= 100
                          ? 'success'
                          : avance >= 50
                            ? 'info'
                            : 'warning'
                    }
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==================== EXPORTS ====================

export default AccionesMejoraPage;
