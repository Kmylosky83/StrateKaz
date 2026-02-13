/**
 * EvaluacionDetailModal - Detalle de evaluacion de desempeno
 */
import { BaseModal } from '@/components/modals/BaseModal';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useIniciarAutoevaluacion, useFirmarEvaluacion } from '../../hooks/useDesempeno';
import type { EvaluacionDesempeno } from '../../types';

const ESTADO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  pendiente: 'gray',
  en_autoevaluacion: 'info',
  en_evaluacion_jefe: 'info',
  en_evaluacion_pares: 'info',
  en_revision: 'warning',
  calibracion: 'warning',
  retroalimentacion: 'info',
  completada: 'success',
  cancelada: 'danger',
};

interface Props {
  evaluacion: EvaluacionDesempeno | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EvaluacionDetailModal = ({ evaluacion, isOpen, onClose }: Props) => {
  const iniciarAutoMutation = useIniciarAutoevaluacion();
  const firmarMutation = useFirmarEvaluacion();

  if (!evaluacion) return null;

  const calificaciones = [
    { label: 'Autoevaluacion', value: evaluacion.calificacion_autoevaluacion },
    { label: 'Jefe', value: evaluacion.calificacion_jefe },
    { label: 'Pares', value: evaluacion.calificacion_pares },
    { label: 'Subordinados', value: evaluacion.calificacion_subordinados },
    { label: 'Final', value: evaluacion.calificacion_final, bold: true },
    { label: 'Calibrada', value: evaluacion.calificacion_calibrada },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Evaluacion"
      size="2xl"
      footer={
        <div className="flex justify-between w-full">
          <div className="flex gap-2">
            {evaluacion.estado === 'pendiente' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  iniciarAutoMutation.mutate(String(evaluacion.id));
                  onClose();
                }}
                disabled={iniciarAutoMutation.isPending}
              >
                Iniciar Autoevaluacion
              </Button>
            )}
            {evaluacion.estado === 'retroalimentacion' && !evaluacion.firma_colaborador && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  firmarMutation.mutate({ id: String(evaluacion.id) });
                  onClose();
                }}
                disabled={firmarMutation.isPending}
              >
                Firmar Evaluacion
              </Button>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {evaluacion.colaborador_nombre}
            </h4>
            <p className="text-sm text-gray-500">
              Ciclo: {evaluacion.ciclo_nombre || evaluacion.ciclo_codigo}
            </p>
            {evaluacion.jefe_nombre && (
              <p className="text-sm text-gray-500">Jefe evaluador: {evaluacion.jefe_nombre}</p>
            )}
          </div>
          <Badge variant={ESTADO_BADGE[evaluacion.estado] || 'gray'} size="sm">
            {evaluacion.estado_display || evaluacion.estado}
          </Badge>
        </div>

        {/* Calificaciones */}
        <div className="grid grid-cols-3 gap-3">
          {calificaciones.map((cal) => (
            <div key={cal.label} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-xs text-gray-500 mb-1">{cal.label}</p>
              <p
                className={`text-xl ${cal.bold ? 'font-bold text-primary-600 dark:text-primary-400' : 'font-semibold text-gray-900 dark:text-gray-100'}`}
              >
                {cal.value != null ? cal.value.toFixed(1) : '-'}
              </p>
            </div>
          ))}
        </div>

        {/* Calibracion */}
        {evaluacion.calificacion_calibrada != null && evaluacion.motivo_calibracion && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Calibracion aplicada
              </p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {evaluacion.motivo_calibracion}
            </p>
            {evaluacion.calibrado_por_nombre && (
              <p className="text-xs text-yellow-600 mt-1">Por: {evaluacion.calibrado_por_nombre}</p>
            )}
          </div>
        )}

        {/* Retroalimentacion */}
        {(evaluacion.fortalezas || evaluacion.areas_mejora || evaluacion.compromisos) && (
          <div className="space-y-3">
            {evaluacion.fortalezas && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fortalezas
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {evaluacion.fortalezas}
                </p>
              </div>
            )}
            {evaluacion.areas_mejora && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Areas de Mejora
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {evaluacion.areas_mejora}
                </p>
              </div>
            )}
            {evaluacion.compromisos && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Compromisos
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {evaluacion.compromisos}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Firma */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {evaluacion.firma_colaborador ? (
            <>
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Firmada el{' '}
                {evaluacion.fecha_firma_colaborador
                  ? new Date(evaluacion.fecha_firma_colaborador).toLocaleDateString('es-CO')
                  : ''}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Pendiente de firma del colaborador</span>
          )}
        </div>

        {/* Comentarios del colaborador */}
        {evaluacion.comentarios_colaborador && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comentarios del Colaborador
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {evaluacion.comentarios_colaborador}
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
