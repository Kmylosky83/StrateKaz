/**
 * Sección de Acta de Cierre del Proyecto
 * Vista read-only si existe, botón crear si no
 * DS: SectionToolbar + Card + Badge + Button + ConfirmDialog
 */
import { useState } from 'react';
import { Card, Badge, Button, EmptyState } from '@/components/common';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FileCheck, Pencil, ShieldCheck, Calendar, DollarSign, Clock, Target } from 'lucide-react';
import { useActasCierre } from '../../../hooks/useProyectos';
import { ActaCierreFormModal } from './ActaCierreFormModal';
import type { ActaCierre } from '../../../types/proyectos.types';

interface ActaCierreSectionProps {
  proyectoId: number;
}

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

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

export const ActaCierreSection = ({ proyectoId }: ActaCierreSectionProps) => {
  const { data: actasData, isLoading } = useActasCierre({ proyecto: proyectoId });
  const [showForm, setShowForm] = useState(false);

  const actas = actasData?.results ?? (Array.isArray(actasData) ? actasData : []);
  const acta: ActaCierre | undefined = actas[0];

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

  if (!acta) {
    return (
      <>
        <EmptyState
          icon={<FileCheck className="h-12 w-12" />}
          title="Sin Acta de Cierre"
          description="Genera el acta de cierre para formalizar la finalización del proyecto"
          action={
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
              Generar Acta de Cierre
            </Button>
          }
        />
        <ActaCierreFormModal
          acta={null}
          proyectoId={proyectoId}
          isOpen={showForm}
          onClose={() => setShowForm(false)}
        />
      </>
    );
  }

  const variacion = parseFloat(acta.variacion_presupuesto || '0');

  return (
    <>
      <div className="space-y-4">
        <SectionToolbar
          title="Acta de Cierre"
          subtitle={
            acta.aprobado_por_sponsor
              ? `Aprobada el ${new Date(acta.fecha_aprobacion!).toLocaleDateString('es-CO')}`
              : 'Pendiente de aprobación del sponsor'
          }
          extraActions={[
            {
              label: 'Editar',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => setShowForm(true),
              variant: 'secondary',
            },
          ]}
        />

        <Card>
          <div className="p-6 space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
            <DetailRow
              icon={Calendar}
              label="Fecha de Cierre"
              value={new Date(acta.fecha_cierre).toLocaleDateString('es-CO')}
            />
            <DetailRow icon={Target} label="Objetivos Cumplidos" value={acta.objetivos_cumplidos} />
            <DetailRow
              icon={Target}
              label="Objetivos No Cumplidos"
              value={acta.objetivos_no_cumplidos}
            />
            <DetailRow
              icon={FileCheck}
              label="Entregables Completados"
              value={acta.entregables_completados}
            />
            <DetailRow
              icon={FileCheck}
              label="Entregables Pendientes"
              value={acta.entregables_pendientes}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 pt-2">
              <div className="flex items-start gap-3 py-2">
                <DollarSign className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Presupuesto Final</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(acta.presupuesto_final)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2">
                <DollarSign className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Costo Final</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(acta.costo_final)}
                    {variacion !== 0 && (
                      <span
                        className={`ml-2 text-xs ${variacion > 0 ? 'text-red-500' : 'text-green-500'}`}
                      >
                        ({variacion > 0 ? '+' : ''}
                        {variacion.toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <div className="flex items-start gap-3 py-2">
                <Clock className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Duración Planificada</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {acta.duracion_planificada_dias} días
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2">
                <Clock className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Duración Real</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {acta.duracion_real_dias} días
                    {acta.duracion_real_dias > acta.duracion_planificada_dias && (
                      <span className="ml-2 text-xs text-red-500">
                        (+{acta.duracion_real_dias - acta.duracion_planificada_dias} días)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <DetailRow
              icon={FileCheck}
              label="Evaluación General"
              value={acta.evaluacion_general}
            />
            <DetailRow
              icon={FileCheck}
              label="Recomendaciones Futuras"
              value={acta.recomendaciones_futuras}
            />

            {acta.aprobado_por_sponsor && (
              <div className="pt-3">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    Aprobado por {acta.aprobado_por_nombre || 'Sponsor'} el{' '}
                    {acta.fecha_aprobacion
                      ? new Date(acta.fecha_aprobacion).toLocaleDateString('es-CO')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <ActaCierreFormModal
        acta={acta}
        proyectoId={proyectoId}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      />
    </>
  );
};
