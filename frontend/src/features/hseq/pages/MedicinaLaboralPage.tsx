/**
 * Página: Medicina Laboral
 *
 * Sistema completo de medicina del trabajo con 5 subsecciones:
 * - Exámenes Médicos
 * - Restricciones Médicas
 * - Vigilancia Epidemiológica
 * - Diagnósticos Ocupacionales
 * - Estadísticas y Reportes
 */
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  Stethoscope,
  AlertOctagon,
  Activity,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Search,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { KpiCard, KpiCardGrid } from '@/components/common';
import { SectionToolbar } from '@/components/common';
import { StatusBadge, formatStatusLabel } from '@/components/common/StatusBadge';
import { Select } from '@/components/forms';
import { cn } from '@/utils/cn';
import {
  useExamenesMedicos,
  useRestricciones,
  useCasosVigilancia,
  useProgramasVigilancia,
  useDiagnosticos,
  useEstadisticaMedica,
  useDeleteExamenMedico,
  useDeleteRestriccion,
  useDeleteCasoVigilancia,
  useDeleteProgramaVigilancia,
} from '../hooks/useMedicinaLaboral';
import type {
  ExamenMedico,
  RestriccionMedica,
  CasoVigilancia,
  ProgramaVigilancia,
  DiagnosticoOcupacional,
} from '../hooks/useMedicinaLaboral';
import ExamenMedicoFormModal from '../components/ExamenMedicoFormModal';
import RestriccionMedicaFormModal from '../components/RestriccionMedicaFormModal';
import ProgramaVigilanciaFormModal from '../components/ProgramaVigilanciaFormModal';
import CasoVigilanciaFormModal from '../components/CasoVigilanciaFormModal';
import DiagnosticoOcupacionalFormModal from '../components/DiagnosticoOcupacionalFormModal';
import { ConfirmDialog } from '@/components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== PROGRESS COMPONENT ====================

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const Progress = ({
  value,
  max = 100,
  className,
  showLabel = false,
  variant = 'default',
}: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantColors = {
    default: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
  };

  const getVariant = (): 'default' | 'success' | 'warning' | 'danger' => {
    if (variant !== 'default') return variant;
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const currentVariant = getVariant();

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', variantColors[currentVariant])}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

const getConceptoBadgeVariant = (concepto: string): 'success' | 'warning' | 'danger' => {
  const conceptoMap: Record<string, 'success' | 'warning' | 'danger'> = {
    APTO: 'success',
    APTO_CON_RESTRICCIONES: 'warning',
    NO_APTO: 'danger',
    PENDIENTE: 'warning',
  };
  return conceptoMap[concepto] || 'warning';
};

const formatConcepto = (concepto: string): string => {
  const conceptoMap: Record<string, string> = {
    APTO: 'Apto',
    APTO_CON_RESTRICCIONES: 'Apto con Restricciones',
    NO_APTO: 'No Apto',
    PENDIENTE: 'Pendiente',
  };
  return conceptoMap[concepto] || concepto;
};

const getTipoRestriccionBadge = (tipo: string): 'warning' | 'danger' | 'primary' => {
  const tipoMap: Record<string, 'warning' | 'danger' | 'primary'> = {
    TEMPORAL: 'warning',
    PERMANENTE: 'danger',
    CONDICIONAL: 'primary',
  };
  return tipoMap[tipo] || 'warning';
};

const formatTipoRestriccion = (tipo: string): string => {
  const tipoMap: Record<string, string> = {
    TEMPORAL: 'Temporal',
    PERMANENTE: 'Permanente',
    CONDICIONAL: 'Condicional',
  };
  return tipoMap[tipo] || tipo;
};

const getSeveridadBadge = (severidad: string): 'success' | 'warning' | 'danger' | 'gray' => {
  const severidadMap: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
    LEVE: 'success',
    MODERADA: 'warning',
    SEVERA: 'danger',
    CRITICA: 'danger',
  };
  return severidadMap[severidad] || 'gray';
};

const formatSeveridad = (severidad: string): string => {
  const severidadMap: Record<string, string> = {
    LEVE: 'Leve',
    MODERADA: 'Moderada',
    SEVERA: 'Severa',
    CRITICA: 'Crítica',
  };
  return severidadMap[severidad] || severidad;
};

// ==================== EXAMENES MEDICOS SECTION ====================

const ExamenesMedicosSection = () => {
  const { data: examenes, isLoading } = useExamenesMedicos();
  const deleteMutation = useDeleteExamenMedico();
  const [selectedItem, setSelectedItem] = useState<ExamenMedico | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: ExamenMedico) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };
  const handleDelete = () => {
    if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!examenes || examenes.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Stethoscope className="w-16 h-16" />}
          title="No hay exámenes médicos registrados"
          description="Comience programando exámenes médicos para sus colaboradores"
          action={{
            label: 'Programar Examen',
            onClick: handleNew,
          }}
        />
        <ExamenMedicoFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />
      </>
    );
  }

  const stats = {
    programados: examenes.filter((e) => e.estado === 'PROGRAMADO').length,
    completados: examenes.filter((e) => e.estado === 'COMPLETADO').length,
    vencidos: examenes.filter((e) => e.estado === 'VENCIDO').length,
    proximos30: examenes.filter((e) => {
      if (e.estado !== 'PROGRAMADO' || !e.fecha_programada) return false;
      const diff = new Date(e.fecha_programada).getTime() - new Date().getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days <= 30 && days >= 0;
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Programados"
          value={stats.programados}
          icon={<Calendar className="w-5 h-5" />}
          color="primary"
          description="Pendientes de realizar"
        />
        <KpiCard
          label="Completados"
          value={stats.completados}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
          description="Este mes"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="Vencidos"
          value={stats.vencidos}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          description="Requieren atención"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Próximos 30 días"
          value={stats.proximos30}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          description="Por vencer"
          valueColor="text-warning-600 dark:text-warning-400"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Exámenes Médicos"
        onFilter={() => {}}
        onExport={() => {}}
        primaryAction={canCreate ? { label: 'Programar Examen', onClick: handleNew } : undefined}
      />

      {/* Examenes Table */}
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
                  Tipo Examen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Concepto
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
              {examenes.map((examen) => (
                <tr key={examen.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {examen.numero_examen}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p className="font-medium">Colaborador #{examen.colaborador_id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {examen.tipo_examen_nombre || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {examen.tipo_examen_nombre || `Tipo #${examen.tipo_examen}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {examen.fecha_realizado
                      ? format(new Date(examen.fecha_realizado), 'dd/MM/yyyy', { locale: es })
                      : examen.fecha_programada
                        ? format(new Date(examen.fecha_programada), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {examen.concepto_aptitud ? (
                      <Badge variant={getConceptoBadgeVariant(examen.concepto_aptitud)} size="sm">
                        {examen.concepto_aptitud_display || formatConcepto(examen.concepto_aptitud)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={examen.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(examen)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(examen.id)}>
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

      <ExamenMedicoFormModal item={selectedItem} isOpen={modalOpen} onClose={handleCloseModal} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Examen Médico"
        description="¿Está seguro de que desea eliminar este examen médico? Esta acción no se puede deshacer."
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== RESTRICCIONES MEDICAS SECTION ====================

const RestriccionesMedicasSection = () => {
  const { data: restricciones, isLoading } = useRestricciones();
  const deleteMutation = useDeleteRestriccion();
  const [selectedItem, setSelectedItem] = useState<RestriccionMedica | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: RestriccionMedica) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };
  const handleDelete = () => {
    if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!restricciones || restricciones.length === 0) {
    return (
      <>
        <EmptyState
          icon={<AlertOctagon className="w-16 h-16" />}
          title="No hay restricciones médicas registradas"
          description="Registre las restricciones médicas de los colaboradores"
          action={{
            label: 'Nueva Restricción',
            onClick: handleNew,
          }}
        />
        <RestriccionMedicaFormModal
          item={selectedItem}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    total: restricciones.filter((r) => r.estado === 'ACTIVA').length,
    temporales: restricciones.filter(
      (r) => r.tipo_restriccion === 'TEMPORAL' && r.estado === 'ACTIVA'
    ).length,
    permanentes: restricciones.filter(
      (r) => r.tipo_restriccion === 'PERMANENTE' && r.estado === 'ACTIVA'
    ).length,
    porVencer: restricciones.filter((r) => {
      if (r.tipo_restriccion === 'PERMANENTE' || !r.fecha_fin || r.estado !== 'ACTIVA')
        return false;
      const diff = new Date(r.fecha_fin).getTime() - new Date().getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days <= 30 && days >= 0;
    }).length,
  };

  // Agrupar restricciones por categoría
  const restriccionesPorCategoria = restricciones
    .filter((r) => r.estado === 'ACTIVA')
    .reduce(
      (acc, r) => {
        const cat = r.categoria_display || r.categoria || 'Otros';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat]++;
        return acc;
      },
      {} as Record<string, number>
    );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Activas Total"
          value={stats.total}
          icon={<AlertOctagon className="w-5 h-5" />}
          color="danger"
          description="Restricciones vigentes"
        />
        <KpiCard
          label="Temporales"
          value={stats.temporales}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          description="Con fecha de fin"
          valueColor="text-warning-600 dark:text-warning-400"
        />
        <KpiCard
          label="Permanentes"
          value={stats.permanentes}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          description="Sin fecha de finalización"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Por Vencer (30 días)"
          value={stats.porVencer}
          icon={<Calendar className="w-5 h-5" />}
          color="primary"
          description="Requieren revisión"
          valueColor="text-primary-600 dark:text-primary-400"
        />
      </KpiCardGrid>

      {/* Dashboard de restricciones por categoría */}
      {Object.keys(restriccionesPorCategoria).length > 0 && (
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Restricciones por Categoría
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(restriccionesPorCategoria).map(([categoria, count]) => (
              <div
                key={categoria}
                className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">{categoria}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <SectionToolbar
        title="Restricciones Médicas"
        onFilter={() => {}}
        primaryAction={canCreate ? { label: 'Nueva Restricción', onClick: handleNew } : undefined}
      />

      {/* Restricciones Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vigencia
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
              {restricciones.map((restriccion) => (
                <tr key={restriccion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {restriccion.codigo_restriccion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p className="font-medium">Colaborador #{restriccion.colaborador_id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {restriccion.descripcion}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={getTipoRestriccionBadge(restriccion.tipo_restriccion)}
                      size="sm"
                    >
                      {restriccion.tipo_restriccion_display ||
                        formatTipoRestriccion(restriccion.tipo_restriccion)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {restriccion.categoria_display || restriccion.categoria || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {restriccion.tipo_restriccion === 'PERMANENTE' ? (
                      <span className="text-danger-600">Indefinida</span>
                    ) : restriccion.fecha_fin ? (
                      <div>
                        <p>
                          {format(new Date(restriccion.fecha_fin), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={restriccion.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(restriccion)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(restriccion.id)}>
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

      <RestriccionMedicaFormModal
        item={selectedItem}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Restricción Médica"
        description="¿Está seguro de que desea eliminar esta restricción médica? Esta acción no se puede deshacer."
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== VIGILANCIA EPIDEMIOLOGICA SECTION ====================

const VigilanciaEpidemiologicaSection = () => {
  const { data: programas, isLoading: loadingProgramas } = useProgramasVigilancia();
  const { data: casos, isLoading: loadingCasos } = useCasosVigilancia();
  const deleteProgramaMutation = useDeleteProgramaVigilancia();
  const deleteCasoMutation = useDeleteCasoVigilancia();

  const [selectedPrograma, setSelectedPrograma] = useState<ProgramaVigilancia | null>(null);
  const [programaModalOpen, setProgramaModalOpen] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState<CasoVigilancia | null>(null);
  const [casoModalOpen, setCasoModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ type: 'programa' | 'caso'; id: number } | null>(null);

  const handleNewPrograma = () => {
    setSelectedPrograma(null);
    setProgramaModalOpen(true);
  };
  const handleNewCaso = () => {
    setSelectedCaso(null);
    setCasoModalOpen(true);
  };
  const handleEditCaso = (item: CasoVigilancia) => {
    setSelectedCaso(item);
    setCasoModalOpen(true);
  };
  const handleCloseProgramaModal = () => {
    setSelectedPrograma(null);
    setProgramaModalOpen(false);
  };
  const handleCloseCasoModal = () => {
    setSelectedCaso(null);
    setCasoModalOpen(false);
  };
  const handleDelete = () => {
    if (!deleteId) return;
    if (deleteId.type === 'programa') {
      deleteProgramaMutation.mutate(deleteId.id, { onSuccess: () => setDeleteId(null) });
    } else {
      deleteCasoMutation.mutate(deleteId.id, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (loadingProgramas || loadingCasos) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if ((!programas || programas.length === 0) && (!casos || casos.length === 0)) {
    return (
      <>
        <EmptyState
          icon={<Activity className="w-16 h-16" />}
          title="No hay programas de vigilancia registrados"
          description="Configure programas de vigilancia epidemiológica ocupacional"
          action={{
            label: 'Nuevo Programa',
            onClick: handleNewPrograma,
          }}
        />
        <ProgramaVigilanciaFormModal
          item={selectedPrograma}
          isOpen={programaModalOpen}
          onClose={handleCloseProgramaModal}
        />
        <CasoVigilanciaFormModal
          item={selectedCaso}
          isOpen={casoModalOpen}
          onClose={handleCloseCasoModal}
        />
      </>
    );
  }

  const stats = {
    programasActivos: programas?.filter((p) => p.estado === 'ACTIVO').length || 0,
    casosActivos:
      casos?.filter((c) => c.estado === 'EN_SEGUIMIENTO' || c.estado === 'ACTIVO').length || 0,
    casosCriticos: casos?.filter((c) => c.severidad === 'CRITICA').length || 0,
    casosControlados: casos?.filter((c) => c.estado === 'CONTROLADO').length || 0,
  };

  // Agrupar casos por programa
  const casosPorPrograma = programas?.map((programa) => ({
    ...programa,
    casos_count: casos?.filter((c) => c.programa === programa.id).length || 0,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Programas Activos"
          value={stats.programasActivos}
          icon={<ClipboardList className="w-5 h-5" />}
          color="primary"
          description="En ejecución"
        />
        <KpiCard
          label="Casos Activos"
          value={stats.casosActivos}
          icon={<Users className="w-5 h-5" />}
          color="primary"
          description="En seguimiento"
          valueColor="text-primary-600 dark:text-primary-400"
        />
        <KpiCard
          label="Casos Críticos"
          value={stats.casosCriticos}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          description="Requieren atención"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Controlados"
          value={stats.casosControlados}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
          description="Bajo control"
          valueColor="text-success-600 dark:text-success-400"
        />
      </KpiCardGrid>

      {/* Programas con casos */}
      {casosPorPrograma && casosPorPrograma.length > 0 && (
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Casos por Programa de Vigilancia
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {casosPorPrograma.map((programa) => (
              <div
                key={programa.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                    {programa.nombre}
                  </h5>
                  <Badge variant={programa.casos_count > 0 ? 'warning' : 'success'} size="sm">
                    {programa.casos_count}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{programa.descripcion}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <SectionToolbar
        title="Casos de Vigilancia"
        onFilter={() => {}}
        extraActions={[
          {
            label: 'Nuevo Programa',
            onClick: handleNewPrograma,
            icon: <ClipboardList className="w-4 h-4" />,
          },
        ]}
        primaryAction={canCreate ? { label: 'Nuevo Caso', onClick: handleNewCaso } : undefined}
      />

      {/* Casos Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Programa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Último Seguimiento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {casos?.map((caso) => (
                <tr key={caso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {caso.numero_caso}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {caso.programa_nombre || `Programa #${caso.programa}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p className="font-medium">Colaborador #{caso.colaborador_id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {caso.diagnosticos_cie10?.[0]?.codigo || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getSeveridadBadge(caso.severidad)} size="sm">
                      {caso.severidad_display || formatSeveridad(caso.severidad)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={caso.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {caso.fecha_ultimo_seguimiento
                      ? format(new Date(caso.fecha_ultimo_seguimiento), 'dd/MM/yyyy', {
                          locale: es,
                        })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCaso(caso)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId({ type: 'caso', id: caso.id })}
                      >
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

      <ProgramaVigilanciaFormModal
        item={selectedPrograma}
        isOpen={programaModalOpen}
        onClose={handleCloseProgramaModal}
      />
      <CasoVigilanciaFormModal
        item={selectedCaso}
        isOpen={casoModalOpen}
        onClose={handleCloseCasoModal}
      />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={deleteId?.type === 'programa' ? 'Eliminar Programa' : 'Eliminar Caso'}
        description="¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer."
        loading={deleteProgramaMutation.isPending || deleteCasoMutation.isPending}
      />
    </div>
  );
};

// ==================== DIAGNOSTICOS OCUPACIONALES SECTION ====================

const DiagnosticosOcupacionalesSection = () => {
  const { data: diagnosticos, isLoading } = useDiagnosticos();
  const [searchCIE10, setSearchCIE10] = useState('');
  const [selectedItem, setSelectedItem] = useState<DiagnosticoOcupacional | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: DiagnosticoOcupacional) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!diagnosticos || diagnosticos.length === 0) {
    return (
      <>
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title="No hay diagnósticos registrados"
          description="Registre los diagnósticos ocupacionales y comunes de sus colaboradores"
          action={{
            label: 'Nuevo Diagnóstico',
            onClick: handleNew,
          }}
        />
        <DiagnosticoOcupacionalFormModal
          item={selectedItem}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    total: diagnosticos.length,
    ocupacionales: diagnosticos.filter((d) => d.origen === 'OCUPACIONAL').length,
    comunes: diagnosticos.filter((d) => d.origen === 'COMUN').length,
    requierenVigilancia: diagnosticos.filter((d) => d.requiere_vigilancia).length,
  };

  const filteredDiagnosticos = searchCIE10
    ? diagnosticos.filter(
        (d) =>
          d.codigo_cie10.toLowerCase().includes(searchCIE10.toLowerCase()) ||
          d.nombre.toLowerCase().includes(searchCIE10.toLowerCase())
      )
    : diagnosticos;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Diagnósticos"
          value={stats.total}
          icon={<FileText className="w-5 h-5" />}
          color="primary"
          description="Registrados en el sistema"
        />
        <KpiCard
          label="Ocupacionales"
          value={stats.ocupacionales}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          description="Relacionados con el trabajo"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Comunes"
          value={stats.comunes}
          icon={<Activity className="w-5 h-5" />}
          color="primary"
          description="No ocupacionales"
          valueColor="text-primary-600 dark:text-primary-400"
        />
        <KpiCard
          label="Requieren Vigilancia"
          value={stats.requierenVigilancia}
          icon={<Eye className="w-5 h-5" />}
          color="warning"
          description="Incluir en PVE"
          valueColor="text-warning-600 dark:text-warning-400"
        />
      </KpiCardGrid>

      {/* Buscador CIE-10 */}
      <Card variant="bordered" padding="md">
        <SectionToolbar
          title="Diagnósticos CIE-10"
          searchable
          searchValue={searchCIE10}
          searchPlaceholder="Buscar por código CIE-10 o nombre..."
          onSearchChange={setSearchCIE10}
          primaryAction={canCreate ? { label: 'Nuevo Diagnóstico', onClick: handleNew } : undefined}
        />
      </Card>

      {/* Diagnosticos Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código CIE-10
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Requiere PVE
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Requiere Reporte
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDiagnosticos.map((diagnostico) => (
                <tr key={diagnostico.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {diagnostico.codigo_cie10}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-md">
                      <p className="font-medium">{diagnostico.nombre}</p>
                      {diagnostico.descripcion && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {diagnostico.descripcion}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={diagnostico.origen === 'OCUPACIONAL' ? 'danger' : 'primary'}
                      size="sm"
                    >
                      {diagnostico.origen_display || formatStatusLabel(diagnostico.origen)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {diagnostico.requiere_vigilancia ? (
                      <CheckCircle2 className="w-5 h-5 text-success-600 mx-auto" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {diagnostico.requiere_reporte_arl ? (
                      <AlertTriangle className="w-5 h-5 text-warning-600 mx-auto" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(diagnostico)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredDiagnosticos.length === 0 && searchCIE10 && (
        <EmptyState
          icon={<Search className="w-16 h-16" />}
          title="No se encontraron resultados"
          description={`No hay diagnósticos que coincidan con "${searchCIE10}"`}
        />
      )}

      <DiagnosticoOcupacionalFormModal
        item={selectedItem}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

// ==================== ESTADISTICAS Y REPORTES SECTION ====================

const EstadisticasReportesSection = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const { data: estadisticas, isLoading } = useEstadisticaMedica(selectedYear, selectedMonth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-16 h-16" />}
        title="No hay estadísticas disponibles"
        description="Seleccione un período para ver las estadísticas de medicina laboral"
      />
    );
  }

  // Usar los campos directos del tipo EstadisticaMedica
  const porcentajeAptitud = estadisticas.porcentaje_aptitud || 0;
  const coberturaExamenes = estadisticas.porcentaje_cobertura_examenes || 0;
  const restricciones_activas = estadisticas.restricciones_activas || 0;
  const casos_vigilancia = estadisticas.casos_vigilancia_activos || 0;
  const top_diagnosticos = estadisticas.top_diagnosticos || [];

  // Resumen de exámenes
  const examenes_resumen = {
    total_examenes: estadisticas.examenes_realizados || 0,
    aptos: estadisticas.aptos || 0,
  };

  // Conceptos de aptitud
  const conceptos_aptitud = {
    APTO: estadisticas.aptos || 0,
    APTO_CON_RESTRICCIONES: estadisticas.aptos_con_restricciones || 0,
    NO_APTO: (estadisticas.no_aptos_temporal || 0) + (estadisticas.no_aptos_permanente || 0),
  };

  // Cobertura
  const cobertura_examenes = {
    realizados: estadisticas.examenes_realizados || 0,
    total_colaboradores: estadisticas.total_colaboradores || 0,
  };

  return (
    <div className="space-y-6">
      {/* Selector de Período */}
      <Card variant="bordered" padding="md">
        <SectionToolbar
          title="Estadísticas de Medicina Laboral"
          extraActions={[
            { label: 'Generar Estadística', onClick: () => {}, variant: 'outline' },
            { label: 'Exportar Reporte', onClick: () => {}, variant: 'primary' },
          ]}
        />
        <div className="flex items-center gap-4 mt-4">
          <div className="w-32">
            <Select
              label="Año"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <Select
              label="Mes"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {format(new Date(2024, month - 1), 'MMMM', { locale: es })}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <KpiCardGrid>
        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">% Aptitud</p>
            <p
              className={cn(
                'text-3xl font-bold mt-2',
                Number(porcentajeAptitud) >= 90
                  ? 'text-success-600 dark:text-success-400'
                  : Number(porcentajeAptitud) >= 70
                    ? 'text-warning-600 dark:text-warning-400'
                    : 'text-danger-600 dark:text-danger-400'
              )}
            >
              {porcentajeAptitud}%
            </p>
            <Progress value={Number(porcentajeAptitud)} className="mt-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {examenes_resumen.aptos} de {examenes_resumen.total_examenes} aptos
            </p>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Cobertura Exámenes</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {coberturaExamenes}%
            </p>
            <Progress value={coberturaExamenes} className="mt-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {cobertura_examenes?.realizados || 0} de{' '}
              {cobertura_examenes?.total_colaboradores || 0} colaboradores
            </p>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Restricciones Activas</p>
            <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-2">
              {restricciones_activas}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <AlertOctagon className="w-5 h-5 text-warning-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Vigentes actualmente</p>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Casos PVE</p>
            <p className="text-3xl font-bold text-danger-600 dark:text-danger-400 mt-2">
              {casos_vigilancia}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Activity className="w-5 h-5 text-danger-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En seguimiento</p>
          </div>
        </Card>
      </KpiCardGrid>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de exámenes (placeholder) */}
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Tendencia de Exámenes Médicos
          </h4>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gráfico de tendencia mensual
              </p>
            </div>
          </div>
        </Card>

        {/* Distribución por concepto */}
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Distribución por Concepto de Aptitud
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Apto</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {conceptos_aptitud.APTO || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {examenes_resumen.total_examenes > 0
                    ? (
                        ((conceptos_aptitud.APTO || 0) / examenes_resumen.total_examenes) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Apto con Restricciones
                </span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {conceptos_aptitud.APTO_CON_RESTRICCIONES || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {examenes_resumen.total_examenes > 0
                    ? (
                        ((conceptos_aptitud.APTO_CON_RESTRICCIONES || 0) /
                          examenes_resumen.total_examenes) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 text-danger-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">No Apto</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {conceptos_aptitud.NO_APTO || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {examenes_resumen.total_examenes > 0
                    ? (
                        ((conceptos_aptitud.NO_APTO || 0) / examenes_resumen.total_examenes) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Diagnósticos */}
      {top_diagnosticos && top_diagnosticos.length > 0 && (
        <Card variant="bordered" padding="md">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Top Diagnósticos del Período (Últimos 10)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código CIE-10
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Diagnóstico
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Casos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Frecuencia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {top_diagnosticos.slice(0, 10).map((diag, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {diag.codigo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {diag.nombre}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white">
                      {diag.cantidad}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(diag.cantidad / (top_diagnosticos[0]?.cantidad || 1)) * 100}
                          className="flex-1"
                        />
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

// ==================== MAIN PAGE COMPONENT ====================

export default function MedicinaLaboralPage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.HSEQ_MANAGEMENT, Sections.EXAMENES_MEDICOS, 'create');

  const [activeTab, setActiveTab] = useState('examenes');

  const tabs = [
    {
      id: 'examenes',
      label: 'Exámenes Médicos',
      icon: <Stethoscope className="w-4 h-4" />,
    },
    {
      id: 'restricciones',
      label: 'Restricciones Médicas',
      icon: <AlertOctagon className="w-4 h-4" />,
    },
    {
      id: 'vigilancia',
      label: 'Vigilancia Epidemiológica',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'diagnosticos',
      label: 'Diagnósticos Ocupacionales',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas y Reportes',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Medicina Laboral"
        description="Gestión integral de medicina del trabajo: exámenes médicos, restricciones, vigilancia epidemiológica y diagnósticos ocupacionales"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'examenes' && <ExamenesMedicosSection />}
        {activeTab === 'restricciones' && <RestriccionesMedicasSection />}
        {activeTab === 'vigilancia' && <VigilanciaEpidemiologicaSection />}
        {activeTab === 'diagnosticos' && <DiagnosticosOcupacionalesSection />}
        {activeTab === 'estadisticas' && <EstadisticasReportesSection />}
      </div>
    </div>
  );
}
