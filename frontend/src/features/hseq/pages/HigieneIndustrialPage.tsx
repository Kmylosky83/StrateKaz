/**
 * Página: Higiene Industrial (REWRITTEN - Sprint 9)
 * 4 tabs: Tipos/Agentes, Mediciones Ambientales, Controles Exposición, Monitoreo Biológico
 * Connected to real hooks from useHigieneIndustrial
 * Deleted ALL stub/placeholder content
 */
import { useState } from 'react';
import {
  Wind,
  FlaskConical,
  Shield,
  Stethoscope,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
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
  ConfirmDialog,
} from '@/components/common';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  useTiposAgente,
  useDeleteTipoAgente,
  useMedicionesAmbientales,
  useDeleteMedicionAmbiental,
  useControlesExposicion,
  useDeleteControlExposicion,
  useMonitoreoBiologico,
  useDeleteMonitoreoBiologico,
} from '../hooks/useHigieneIndustrial';

import TipoAgenteFormModal from '../components/TipoAgenteFormModal';
import MedicionAmbientalFormModal from '../components/MedicionAmbientalFormModal';
import ControlExposicionFormModal from '../components/ControlExposicionFormModal';
import MonitoreoBiologicoFormModal from '../components/MonitoreoBiologicoFormModal';

import type {
  TipoAgenteList,
  MedicionAmbientalList,
  ControlExposicionList,
  MonitoreoBiologicoList,
} from '../types/higiene-industrial.types';

// ==================== TIPOS/AGENTES DE RIESGO SECTION ====================

interface TiposAgenteProps {
  onOpenModal: (item?: TipoAgenteList) => void;
}

const TiposAgenteSection = ({ onOpenModal }: TiposAgenteProps) => {
  const { data, isLoading } = useTiposAgente();
  const deleteMutation = useDeleteTipoAgente();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const tipos = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (tipos.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical className="w-16 h-16" />}
        title="No hay tipos de agentes registrados"
        description="Comience creando tipos de agentes de riesgo para categorizar los agentes físicos, químicos, biológicos, ergonómicos y psicosociales"
        action={{
          label: 'Nuevo Tipo de Agente',
          onClick: () => onOpenModal(),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: tipos.length,
    fisicos: tipos.filter((t) => t.categoria === 'FISICO').length,
    quimicos: tipos.filter((t) => t.categoria === 'QUIMICO').length,
    biologicos: tipos.filter((t) => t.categoria === 'BIOLOGICO').length,
  };

  const getCategoriaColor = (
    categoria: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    if (categoria === 'FISICO') return 'primary';
    if (categoria === 'QUIMICO') return 'warning';
    if (categoria === 'BIOLOGICO') return 'danger';
    if (categoria === 'ERGONOMICO') return 'success';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Tipos"
          value={stats.total}
          icon={<FlaskConical className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Físicos"
          value={stats.fisicos}
          icon={<Wind className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Químicos"
          value={stats.quimicos}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Biológicos"
          value={stats.biologicos}
          icon={<Shield className="w-5 h-5" />}
          color="danger"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Tipos de Agentes de Riesgo"
        primaryAction={{ label: 'Nuevo Tipo', onClick: () => onOpenModal() }}
      />

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Normativa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tipos.map((tipo) => (
                <tr key={tipo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {tipo.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{tipo.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getCategoriaColor(tipo.categoria)}>
                      {tipo.categoria_display ?? formatStatusLabel(tipo.categoria)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {tipo.normativa_aplicable || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tipo.is_active ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="default">Inactivo</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenModal(tipo)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(tipo.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Tipo de Agente"
        message="¿Está seguro de eliminar este tipo de agente? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== MEDICIONES AMBIENTALES SECTION ====================

interface MedicionesAmbientalesProps {
  onOpenModal: (item?: MedicionAmbientalList) => void;
}

const MedicionesAmbientalesSection = ({ onOpenModal }: MedicionesAmbientalesProps) => {
  const { data, isLoading } = useMedicionesAmbientales();
  const deleteMutation = useDeleteMedicionAmbiental();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const mediciones = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (mediciones.length === 0) {
    return (
      <EmptyState
        icon={<Wind className="w-16 h-16" />}
        title="No hay mediciones ambientales registradas"
        description="Comience registrando mediciones de agentes de riesgo en puntos de medición específicos"
        action={{
          label: 'Nueva Medición',
          onClick: () => onOpenModal(),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: mediciones.length,
    cumple: mediciones.filter((m) => m.cumplimiento === 'CUMPLE').length,
    noCumple: mediciones.filter((m) => m.cumplimiento === 'NO_CUMPLE').length,
    pendiente: mediciones.filter((m) => m.cumplimiento === 'PENDIENTE').length,
  };

  const getCumplimientoColor = (cumplimiento: string): 'success' | 'danger' | 'warning' => {
    if (cumplimiento === 'CUMPLE') return 'success';
    if (cumplimiento === 'NO_CUMPLE') return 'danger';
    return 'warning';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Mediciones"
          value={stats.total}
          icon={<Wind className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Cumple"
          value={stats.cumple}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="No Cumple"
          value={stats.noCumple}
          icon={<XCircle className="w-5 h-5" />}
          color="danger"
        />
        <KpiCard
          label="Pendientes"
          value={stats.pendiente}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Mediciones Ambientales"
        primaryAction={{ label: 'Nueva Medición', onClick: () => onOpenModal() }}
      />

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  N° Medición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Agente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Punto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cumplimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mediciones.map((medicion) => (
                <tr key={medicion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {medicion.numero_medicion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {medicion.agente_riesgo_nombre ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {medicion.punto_medicion_nombre ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(medicion.fecha_medicion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {medicion.valor_medido} {medicion.unidad_medida}
                    {medicion.porcentaje_limite && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({medicion.porcentaje_limite}%)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={medicion.cumplimiento}
                      variant={getCumplimientoColor(medicion.cumplimiento)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={medicion.estado} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenModal(medicion)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(medicion.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Medición Ambiental"
        message="¿Está seguro de eliminar esta medición? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== CONTROLES DE EXPOSICIÓN SECTION ====================

interface ControlesExposicionProps {
  onOpenModal: (item?: ControlExposicionList) => void;
}

const ControlesExposicionSection = ({ onOpenModal }: ControlesExposicionProps) => {
  const { data, isLoading } = useControlesExposicion();
  const deleteMutation = useDeleteControlExposicion();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const controles = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (controles.length === 0) {
    return (
      <EmptyState
        icon={<Shield className="w-16 h-16" />}
        title="No hay controles de exposición registrados"
        description="Comience registrando controles de exposición siguiendo la jerarquía de controles"
        action={{
          label: 'Nuevo Control',
          onClick: () => onOpenModal(),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: controles.length,
    implementados: controles.filter((c) => c.estado === 'IMPLEMENTADO').length,
    enImplementacion: controles.filter((c) => c.estado === 'EN_IMPLEMENTACION').length,
    planificados: controles.filter((c) => c.estado === 'PLANIFICADO').length,
  };

  const getJerarquiaColor = (jerarquia: string): 'success' | 'primary' | 'warning' | 'default' => {
    if (jerarquia === 'ELIMINACION' || jerarquia === 'SUSTITUCION') return 'success';
    if (jerarquia === 'CONTROLES_INGENIERIA') return 'primary';
    if (jerarquia === 'CONTROLES_ADMINISTRATIVOS') return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Controles"
          value={stats.total}
          icon={<Shield className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Implementados"
          value={stats.implementados}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="En Implementación"
          value={stats.enImplementacion}
          icon={<TrendingUp className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Planificados"
          value={stats.planificados}
          icon={<Clock className="w-5 h-5" />}
          color="default"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Controles de Exposición"
        primaryAction={{ label: 'Nuevo Control', onClick: () => onOpenModal() }}
      />

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Jerarquía
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Agente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Efectividad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {controles.map((control) => (
                <tr key={control.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {control.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {control.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getJerarquiaColor(control.jerarquia_control)}>
                      {control.jerarquia_control_display ??
                        formatStatusLabel(control.jerarquia_control)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default">
                      {control.tipo_control_display ?? formatStatusLabel(control.tipo_control)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {control.agente_riesgo_nombre ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={control.estado} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {control.efectividad_medida ? `${control.efectividad_medida}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenModal(control)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(control.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Control de Exposición"
        message="¿Está seguro de eliminar este control? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== MONITOREO BIOLÓGICO SECTION ====================

interface MonitoreoBiologicoProps {
  onOpenModal: (item?: MonitoreoBiologicoList) => void;
}

const MonitoreoBiologicoSection = ({ onOpenModal }: MonitoreoBiologicoProps) => {
  const { data, isLoading } = useMonitoreoBiologico();
  const deleteMutation = useDeleteMonitoreoBiologico();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const examenes = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (examenes.length === 0) {
    return (
      <EmptyState
        icon={<Stethoscope className="w-16 h-16" />}
        title="No hay exámenes de monitoreo biológico registrados"
        description="Comience registrando exámenes médicos ocupacionales para el monitoreo biológico de trabajadores expuestos"
        action={{
          label: 'Nuevo Examen',
          onClick: () => onOpenModal(),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: examenes.length,
    aptos: examenes.filter((e) => e.resultado === 'APTO').length,
    noAptos: examenes.filter((e) => e.resultado === 'NO_APTO').length,
    seguimiento: examenes.filter((e) => e.requiere_seguimiento).length,
  };

  const getResultadoColor = (resultado: string): 'success' | 'warning' | 'danger' | 'default' => {
    if (resultado === 'APTO') return 'success';
    if (resultado === 'APTO_CON_RECOMENDACIONES') return 'warning';
    if (resultado === 'NO_APTO') return 'danger';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Exámenes"
          value={stats.total}
          icon={<Stethoscope className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Aptos"
          value={stats.aptos}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="No Aptos"
          value={stats.noAptos}
          icon={<XCircle className="w-5 h-5" />}
          color="danger"
        />
        <KpiCard
          label="Seguimiento"
          value={stats.seguimiento}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="warning"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Monitoreo Biológico"
        primaryAction={{ label: 'Nuevo Examen', onClick: () => onOpenModal() }}
      />

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  N° Examen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Trabajador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Resultado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Seguimiento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {examenes.map((examen) => (
                <tr key={examen.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {examen.numero_examen}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {examen.trabajador_nombre}
                    <div className="text-xs text-gray-500">{examen.trabajador_identificacion}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {examen.trabajador_cargo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default">
                      {examen.tipo_examen_display ?? formatStatusLabel(examen.tipo_examen)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(examen.fecha_examen), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={examen.resultado}
                      variant={getResultadoColor(examen.resultado)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {examen.requiere_seguimiento ? (
                      <Badge variant="warning">Requerido</Badge>
                    ) : (
                      <Badge variant="default">No</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenModal(examen)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(examen.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Examen de Monitoreo Biológico"
        message="¿Está seguro de eliminar este examen? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== MAIN PAGE ====================

export default function HigieneIndustrialPage() {
  const [activeTab, setActiveTab] = useState('tipos-agente');
  const [tipoAgenteModalOpen, setTipoAgenteModalOpen] = useState(false);
  const [medicionModalOpen, setMedicionModalOpen] = useState(false);
  const [controlModalOpen, setControlModalOpen] = useState(false);
  const [monitoreoModalOpen, setMonitoreoModalOpen] = useState(false);
  const [selectedTipoAgente, setSelectedTipoAgente] = useState<TipoAgenteList | undefined>();
  const [selectedMedicion, setSelectedMedicion] = useState<MedicionAmbientalList | undefined>();
  const [selectedControl, setSelectedControl] = useState<ControlExposicionList | undefined>();
  const [selectedMonitoreo, setSelectedMonitoreo] = useState<MonitoreoBiologicoList | undefined>();

  const tabs = [
    { id: 'tipos-agente', label: 'Tipos/Agentes', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'mediciones', label: 'Mediciones', icon: <Wind className="w-4 h-4" /> },
    { id: 'controles', label: 'Controles', icon: <Shield className="w-4 h-4" /> },
    { id: 'monitoreo', label: 'Monitoreo', icon: <Stethoscope className="w-4 h-4" /> },
  ];

  const handleOpenTipoAgenteModal = (item?: TipoAgenteList) => {
    setSelectedTipoAgente(item);
    setTipoAgenteModalOpen(true);
  };

  const handleCloseTipoAgenteModal = () => {
    setSelectedTipoAgente(undefined);
    setTipoAgenteModalOpen(false);
  };

  const handleOpenMedicionModal = (item?: MedicionAmbientalList) => {
    setSelectedMedicion(item);
    setMedicionModalOpen(true);
  };

  const handleCloseMedicionModal = () => {
    setSelectedMedicion(undefined);
    setMedicionModalOpen(false);
  };

  const handleOpenControlModal = (item?: ControlExposicionList) => {
    setSelectedControl(item);
    setControlModalOpen(true);
  };

  const handleCloseControlModal = () => {
    setSelectedControl(undefined);
    setControlModalOpen(false);
  };

  const handleOpenMonitoreoModal = (item?: MonitoreoBiologicoList) => {
    setSelectedMonitoreo(item);
    setMonitoreoModalOpen(true);
  };

  const handleCloseMonitoreoModal = () => {
    setSelectedMonitoreo(undefined);
    setMonitoreoModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Higiene Industrial"
        description="Gestión de agentes de riesgo, mediciones ambientales, controles de exposición y monitoreo biológico"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'tipos-agente' && (
          <TiposAgenteSection onOpenModal={handleOpenTipoAgenteModal} />
        )}
        {activeTab === 'mediciones' && (
          <MedicionesAmbientalesSection onOpenModal={handleOpenMedicionModal} />
        )}
        {activeTab === 'controles' && (
          <ControlesExposicionSection onOpenModal={handleOpenControlModal} />
        )}
        {activeTab === 'monitoreo' && (
          <MonitoreoBiologicoSection onOpenModal={handleOpenMonitoreoModal} />
        )}
      </div>

      {/* All 4 modals */}
      <TipoAgenteFormModal
        item={selectedTipoAgente ?? null}
        isOpen={tipoAgenteModalOpen}
        onClose={handleCloseTipoAgenteModal}
      />
      <MedicionAmbientalFormModal
        item={selectedMedicion ?? null}
        isOpen={medicionModalOpen}
        onClose={handleCloseMedicionModal}
      />
      <ControlExposicionFormModal
        item={selectedControl ?? null}
        isOpen={controlModalOpen}
        onClose={handleCloseControlModal}
      />
      <MonitoreoBiologicoFormModal
        item={selectedMonitoreo ?? null}
        isOpen={monitoreoModalOpen}
        onClose={handleCloseMonitoreoModal}
      />
    </div>
  );
}
