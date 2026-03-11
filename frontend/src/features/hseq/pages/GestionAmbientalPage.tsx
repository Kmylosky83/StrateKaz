/**
 * Gestión Ambiental HSEQ
 *
 * 6 subsecciones: Aspectos Ambientales (dashboard), Gestión de Residuos, Vertimientos,
 * Emisiones Atmosféricas, Consumo de Recursos, Certificados Ambientales.
 */
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  Leaf,
  Trash2,
  Droplet,
  Wind,
  Zap,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  BarChart3,
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
} from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  useResiduos,
  useVertimientos,
  useEmisiones,
  useConsumos,
  useCertificados,
  useDeleteResiduo,
  useDeleteVertimiento,
  useDeleteEmision,
  useDeleteConsumo,
  useDeleteCertificado,
} from '../hooks/useGestionAmbiental';

import RegistroResiduoFormModal from '../components/RegistroResiduoFormModal';
import VertimientoFormModal from '../components/VertimientoFormModal';
import EmisionFormModal from '../components/EmisionFormModal';
import ConsumoRecursoFormModal from '../components/ConsumoRecursoFormModal';
import CertificadoAmbientalFormModal from '../components/CertificadoAmbientalFormModal';

// ==================== ASPECTOS AMBIENTALES SECTION ====================

const AspectosAmbientalesSection = () => {
  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Residuos Generados"
          value="2,450 kg"
          icon={<TrendingDown className="w-5 h-5" />}
          color="green"
          description="-12% vs mes anterior"
        />
        <KpiCard
          label="Tasa de Reciclaje"
          value="68%"
          icon={<BarChart3 className="w-5 h-5" />}
          color="info"
          valueColor="text-success-600 dark:text-success-400"
          description="+5% vs mes anterior"
        />
        <KpiCard
          label="Huella de Carbono"
          value="12.5 tCO₂e"
          icon={<Leaf className="w-5 h-5" />}
          color="warning"
          description="+3% vs año anterior"
        />
        <KpiCard
          label="Consumo de Agua"
          value="1,850 m³"
          icon={<Droplet className="w-5 h-5" />}
          color="primary"
          description="-8% vs mes anterior"
        />
      </KpiCardGrid>

      <EmptyState
        icon={<Leaf className="w-16 h-16" />}
        title="Dashboard de Aspectos Ambientales"
        description="Vista general del desempeño ambiental de la organización"
      />
    </div>
  );
};

// ==================== GESTIÓN DE RESIDUOS SECTION ====================

const GestionResiduosSection = ({
  canCreate,
  canDelete,
}: {
  canCreate: boolean;
  canDelete: boolean;
}) => {
  const { data: residuos, isLoading } = useResiduos();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteMutation = useDeleteResiduo();

  const handleNew = () => setModalOpen(true);
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

  if (!residuos || residuos.results.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Trash2 className="w-16 h-16" />}
          title="No hay registros de residuos"
          description="Comience registrando la generación y disposición de residuos"
          action={canCreate ? { label: 'Nuevo Registro', onClick: handleNew } : undefined}
        />
        <RegistroResiduoFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Registros"
          value={residuos.count}
          icon={<Trash2 className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Peligrosos"
          value="45 kg"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Reciclables"
          value="1,680 kg"
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="Orgánicos"
          value="725 kg"
          icon={<Leaf className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Registros de Residuos"
        primaryAction={canCreate ? { label: 'Nuevo Registro', onClick: handleNew } : undefined}
      />

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo Residuo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Movimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {residuos.results.map((residuo) => (
                <tr key={residuo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(residuo.fecha), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {residuo.tipo_residuo_detalle?.nombre || `Residuo #${residuo.tipo_residuo}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {residuo.cantidad} {residuo.unidad_medida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={residuo.tipo_movimiento} variant="info" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {residuo.area_generadora}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(residuo.id)}>
                          <Trash2 className="w-4 h-4 text-danger-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <RegistroResiduoFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Registro"
        description="¿Está seguro de eliminar este registro de residuo?"
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== VERTIMIENTOS SECTION ====================

const VertimientosSection = ({
  canCreate,
  canDelete,
}: {
  canCreate: boolean;
  canDelete: boolean;
}) => {
  const { data: vertimientos, isLoading } = useVertimientos();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteMutation = useDeleteVertimiento();

  const handleNew = () => setModalOpen(true);
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

  if (!vertimientos || vertimientos.results.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Droplet className="w-16 h-16" />}
          title="No hay registros de vertimientos"
          description="Comience registrando los vertimientos de aguas residuales"
          action={canCreate ? { label: 'Nuevo Vertimiento', onClick: handleNew } : undefined}
        />
        <VertimientoFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const conformes = vertimientos.results.filter((v) => v.cumple_normativa === true).length;
  const noConformes = vertimientos.results.filter((v) => v.cumple_normativa === false).length;
  const pctCumplimiento =
    vertimientos.count > 0 ? Math.round((conformes / vertimientos.count) * 100) : 0;

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Vertimientos"
          value={vertimientos.count}
          icon={<Droplet className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Conformes"
          value={conformes}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="No Conformes"
          value={noConformes}
          icon={<XCircle className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
        <KpiCard
          label="Cumplimiento"
          value={`${pctCumplimiento}%`}
          icon={<BarChart3 className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Registros de Vertimientos"
        primaryAction={canCreate ? { label: 'Nuevo Vertimiento', onClick: handleNew } : undefined}
      />

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Punto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cuerpo Receptor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cumple
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {vertimientos.results.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(v.fecha_vertimiento), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatStatusLabel(v.tipo_vertimiento)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {v.punto_vertimiento}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatStatusLabel(v.cuerpo_receptor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {v.cumple_normativa === true && (
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    )}
                    {v.cumple_normativa === false && (
                      <XCircle className="w-5 h-5 text-danger-600" />
                    )}
                    {v.cumple_normativa === null && <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(v.id)}>
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <VertimientoFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Vertimiento"
        description="¿Está seguro de eliminar este registro de vertimiento?"
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== EMISIONES SECTION ====================

const EmisionesSection = ({ canCreate, canDelete }: { canCreate: boolean; canDelete: boolean }) => {
  const { data: emisiones, isLoading } = useEmisiones();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteMutation = useDeleteEmision();

  const handleNew = () => setModalOpen(true);
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

  if (!emisiones || emisiones.results.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Wind className="w-16 h-16" />}
          title="No hay registros de emisiones"
          description="Comience registrando las emisiones atmosféricas de sus fuentes"
          action={canCreate ? { label: 'Nueva Medición', onClick: handleNew } : undefined}
        />
        <EmisionFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Mediciones"
          value={emisiones.count}
          icon={<Wind className="w-5 h-5" />}
          color="primary"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Emisiones Atmosféricas"
        primaryAction={canCreate ? { label: 'Nueva Medición', onClick: handleNew } : undefined}
      />

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fuente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cumple
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {emisiones.results.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(e.fecha_medicion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {e.fuente_emision_detalle
                      ? `${e.fuente_emision_detalle.codigo} - ${e.fuente_emision_detalle.nombre}`
                      : `Fuente #${e.fuente_emision}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {e.cumple_normativa === true && (
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    )}
                    {e.cumple_normativa === false && (
                      <XCircle className="w-5 h-5 text-danger-600" />
                    )}
                    {e.cumple_normativa === null && <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(e.id)}>
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <EmisionFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Medición"
        description="¿Está seguro de eliminar esta medición de emisiones?"
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== CONSUMO DE RECURSOS SECTION ====================

const ConsumoRecursosSection = ({
  canCreate,
  canDelete,
}: {
  canCreate: boolean;
  canDelete: boolean;
}) => {
  const { data: consumos, isLoading } = useConsumos();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteMutation = useDeleteConsumo();

  const handleNew = () => setModalOpen(true);
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

  if (!consumos || consumos.results.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Zap className="w-16 h-16" />}
          title="No hay registros de consumo"
          description="Comience registrando el consumo de recursos (agua, energía, etc.)"
          action={canCreate ? { label: 'Nuevo Consumo', onClick: handleNew } : undefined}
        />
        <ConsumoRecursoFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Registros"
          value={consumos.count}
          icon={<Zap className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Agua"
          value="1,850 m³"
          icon={<Droplet className="w-5 h-5" />}
          color="primary"
          valueColor="text-primary-600 dark:text-primary-400"
        />
        <KpiCard
          label="Energía"
          value="15,200 kWh"
          icon={<Zap className="w-5 h-5" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
        />
        <KpiCard
          label="CO₂ Generado"
          value="3.2 tCO₂"
          icon={<Leaf className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Consumo de Recursos"
        primaryAction={canCreate ? { label: 'Nuevo Registro', onClick: handleNew } : undefined}
      />

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recurso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  CO₂ (kg)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {consumos.results.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {c.periodo_display || `${c.periodo_month}/${c.periodo_year}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {c.tipo_recurso_detalle?.nombre || `Recurso #${c.tipo_recurso}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {c.cantidad_consumida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {c.costo_total ? `$${Number(c.costo_total).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {c.emision_co2_kg || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConsumoRecursoFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Registro"
        description="¿Está seguro de eliminar este registro de consumo?"
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== CERTIFICADOS SECTION ====================

const CertificadosSection = ({
  canCreate,
  canDelete,
}: {
  canCreate: boolean;
  canDelete: boolean;
}) => {
  const { data: certificados, isLoading } = useCertificados();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteMutation = useDeleteCertificado();

  const handleNew = () => setModalOpen(true);
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

  if (!certificados || certificados.results.length === 0) {
    return (
      <>
        <EmptyState
          icon={<FileCheck className="w-16 h-16" />}
          title="No hay certificados ambientales"
          description="Registre los certificados de disposición y cumplimiento ambiental"
          action={canCreate ? { label: 'Nuevo Certificado', onClick: handleNew } : undefined}
        />
        <CertificadoAmbientalFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const vigentes = certificados.results.filter((c) => c.vigente).length;
  const vencidos = certificados.results.filter((c) => !c.vigente).length;

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Certificados"
          value={certificados.count}
          icon={<FileCheck className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Vigentes"
          value={vigentes}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          valueColor="text-success-600 dark:text-success-400"
        />
        <KpiCard
          label="Vencidos"
          value={vencidos}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Certificados Ambientales"
        primaryAction={canCreate ? { label: 'Nuevo Certificado', onClick: handleNew } : undefined}
      />

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
                  Emisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Emisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vencimiento
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
              {certificados.results.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {cert.numero_certificado}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {cert.tipo_certificado_display || formatStatusLabel(cert.tipo_certificado)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {cert.emisor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(cert.fecha_emision), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {cert.fecha_vencimiento
                      ? format(new Date(cert.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cert.vigente ? (
                      <span className="inline-flex items-center gap-1 text-success-600 text-sm">
                        <CheckCircle className="w-4 h-4" /> Vigente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-danger-600 text-sm">
                        <XCircle className="w-4 h-4" /> Vencido
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(cert.id)}>
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <CertificadoAmbientalFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Certificado"
        description="¿Está seguro de eliminar este certificado ambiental?"
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================

export default function GestionAmbientalPage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.HSEQ_MANAGEMENT, Sections.PROGRAMAS_AMBIENTALES, 'create');
  const canDelete = canDo(Modules.HSEQ_MANAGEMENT, Sections.PROGRAMAS_AMBIENTALES, 'delete');
  const [activeTab, setActiveTab] = useState('aspectos');

  const tabs = [
    { id: 'aspectos', label: 'Aspectos Ambientales', icon: <Leaf className="w-4 h-4" /> },
    { id: 'residuos', label: 'Gestión de Residuos', icon: <Trash2 className="w-4 h-4" /> },
    { id: 'vertimientos', label: 'Vertimientos', icon: <Droplet className="w-4 h-4" /> },
    { id: 'emisiones', label: 'Emisiones Atmosféricas', icon: <Wind className="w-4 h-4" /> },
    { id: 'consumos', label: 'Consumo de Recursos', icon: <Zap className="w-4 h-4" /> },
    {
      id: 'certificados',
      label: 'Certificados Ambientales',
      icon: <FileCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión Ambiental"
        description="Sistema integral de gestión ambiental: residuos, vertimientos, emisiones, consumo de recursos y certificados"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'aspectos' && <AspectosAmbientalesSection />}
        {activeTab === 'residuos' && (
          <GestionResiduosSection canCreate={canCreate} canDelete={canDelete} />
        )}
        {activeTab === 'vertimientos' && (
          <VertimientosSection canCreate={canCreate} canDelete={canDelete} />
        )}
        {activeTab === 'emisiones' && (
          <EmisionesSection canCreate={canCreate} canDelete={canDelete} />
        )}
        {activeTab === 'consumos' && (
          <ConsumoRecursosSection canCreate={canCreate} canDelete={canDelete} />
        )}
        {activeTab === 'certificados' && (
          <CertificadosSection canCreate={canCreate} canDelete={canDelete} />
        )}
      </div>
    </div>
  );
}
