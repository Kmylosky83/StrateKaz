/**
 * Vista read-only del Project Charter con acciones de edición y aprobación
 * DS: Card + Badge + Button + SectionToolbar
 */
import { useState } from 'react';
import { Card, Badge, Button, EmptyState } from '@/components/common';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  FileText,
  CheckCircle2,
  Edit,
  ShieldCheck,
  Target,
  AlertTriangle,
  Calendar,
  DollarSign,
  Clock,
  Milestone,
} from 'lucide-react';
import { useCharters, useAprobarCharter } from '../../../hooks/useProyectos';
import { CharterFormModal } from './CharterFormModal';
import type { ProjectCharter } from '../../../types/proyectos.types';

interface CharterViewProps {
  proyectoId: number;
}

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{value}</p>
      </div>
    </div>
  );
};

export const CharterView = ({ proyectoId }: CharterViewProps) => {
  const { data: chartersData, isLoading } = useCharters({ proyecto: proyectoId });
  const aprobarMutation = useAprobarCharter();
  const [showForm, setShowForm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const charters = chartersData?.results ?? (Array.isArray(chartersData) ? chartersData : []);
  const charter: ProjectCharter | undefined = charters[0];

  const handleAprobar = async () => {
    if (!charter) return;
    await aprobarMutation.mutateAsync({ id: charter.id, data: {} });
    setShowApproveConfirm(false);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse-subtle">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </Card>
    );
  }

  if (!charter) {
    return (
      <>
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Sin Project Charter"
          description="Crea el Acta de Constitución para formalizar el inicio del proyecto"
          action={
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
              Crear Charter
            </Button>
          }
        />
        <CharterFormModal
          charter={null}
          proyectoId={proyectoId}
          isOpen={showForm}
          onClose={() => setShowForm(false)}
        />
      </>
    );
  }

  const isAprobado = !!charter.fecha_aprobacion;

  return (
    <>
      <div className="space-y-4">
        <SectionToolbar
          title="Project Charter"
          subtitle={
            isAprobado
              ? `Aprobado el ${new Date(charter.fecha_aprobacion!).toLocaleDateString('es-CO')}`
              : 'Pendiente de aprobación'
          }
          primaryAction={
            !isAprobado
              ? {
                  label: 'Aprobar Charter',
                  icon: <ShieldCheck className="h-4 w-4" />,
                  onClick: () => setShowApproveConfirm(true),
                  variant: 'primary',
                }
              : undefined
          }
          extraActions={[
            {
              label: 'Editar',
              icon: <Edit className="h-4 w-4" />,
              onClick: () => setShowForm(true),
              variant: 'secondary',
            },
          ]}
        />

        <Card>
          <div className="p-6 space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
            <DetailRow icon={Target} label="Propósito" value={charter.proposito} />
            <DetailRow
              icon={CheckCircle2}
              label="Objetivos Medibles"
              value={charter.objetivos_medibles}
            />
            <DetailRow
              icon={FileText}
              label="Requisitos de Alto Nivel"
              value={charter.requisitos_alto_nivel}
            />
            <DetailRow
              icon={FileText}
              label="Descripción de Alto Nivel"
              value={charter.descripcion_alto_nivel}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <DetailRow icon={FileText} label="Supuestos" value={charter.supuestos} />
              <DetailRow icon={AlertTriangle} label="Restricciones" value={charter.restricciones} />
            </div>

            <DetailRow icon={Milestone} label="Hitos Clave" value={charter.hitos_clave} />
            <DetailRow
              icon={AlertTriangle}
              label="Riesgos de Alto Nivel"
              value={charter.riesgos_alto_nivel}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <DetailRow
                icon={DollarSign}
                label="Resumen de Presupuesto"
                value={charter.resumen_presupuesto}
              />
              <DetailRow
                icon={Clock}
                label="Resumen de Cronograma"
                value={charter.resumen_cronograma}
              />
            </div>

            <DetailRow
              icon={CheckCircle2}
              label="Criterios de Éxito"
              value={charter.criterios_exito}
            />

            {isAprobado && (
              <div className="pt-3">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    Aprobado por {charter.aprobado_por_nombre || 'N/A'} el{' '}
                    {new Date(charter.fecha_aprobacion!).toLocaleDateString('es-CO')}
                  </span>
                </div>
                {charter.observaciones_aprobacion && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">
                    {charter.observaciones_aprobacion}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Versión {charter.version} - Última actualización{' '}
                {new Date(charter.updated_at).toLocaleDateString('es-CO')}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <CharterFormModal
        charter={charter}
        proyectoId={proyectoId}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      />

      <ConfirmDialog
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleAprobar}
        title="Aprobar Charter"
        message="Al aprobar el charter se registrará la fecha y su usuario como aprobador. Esta acción formaliza el inicio del proyecto."
        confirmText="Aprobar"
        variant="info"
        isLoading={aprobarMutation.isPending}
      />
    </>
  );
};
