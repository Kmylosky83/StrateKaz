/**
 * Modal de detalle de Compromiso de Revision por la Direccion
 * Permite ver informacion, actualizar progreso, marcar completado y verificar
 */
import { useState } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Textarea } from '@/components/forms/Textarea';
import { Spinner } from '@/components/common/Spinner';
import {
  Calendar,
  User,
  Target,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Paperclip,
} from 'lucide-react';
import { EvidenceUploader, EvidenceGallery } from '@/components/common';
import {
  useCompromiso,
  useUpdateProgresoCompromiso,
  useMarcarCompromisoCompletado,
  useVerificarCompromiso,
} from '../../hooks/useRevisionDireccion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompromisoDetailModalProps {
  compromisoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ESTADO_BADGE: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
  PENDIENTE: 'gray',
  EN_PROGRESO: 'warning',
  COMPLETADO: 'success',
  VENCIDO: 'danger',
  CANCELADO: 'gray',
};

const PRIORIDAD_BADGE: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
  BAJA: 'gray',
  MEDIA: 'primary',
  ALTA: 'warning',
  CRITICA: 'danger',
};

export const CompromisoDetailModal = ({
  compromisoId,
  isOpen,
  onClose,
}: CompromisoDetailModalProps) => {
  const { data: compromiso, isLoading } = useCompromiso(compromisoId);

  const [progreso, setProgreso] = useState<number>(0);
  const [showCompletarForm, setShowCompletarForm] = useState(false);
  const [showVerificarForm, setShowVerificarForm] = useState(false);
  const [evidencia, setEvidencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [esEficaz, setEsEficaz] = useState(true);

  const progresoMutation = useUpdateProgresoCompromiso();
  const completarMutation = useMarcarCompromisoCompletado();
  const verificarMutation = useVerificarCompromiso();

  // Sync progreso slider when data loads
  const currentProgreso = compromiso?.progreso ?? 0;

  const handleProgresoChange = (value: number) => {
    setProgreso(value);
  };

  const handleGuardarProgreso = () => {
    progresoMutation.mutate({ id: compromisoId, progreso });
  };

  const handleCompletar = () => {
    completarMutation.mutate(
      {
        id: compromisoId,
        data: {
          evidencia_cumplimiento: evidencia || undefined,
          observaciones: observaciones || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowCompletarForm(false);
          setEvidencia('');
          setObservaciones('');
        },
      }
    );
  };

  const handleVerificar = () => {
    verificarMutation.mutate(
      {
        id: compromisoId,
        data: {
          es_eficaz: esEficaz,
          observaciones: observaciones || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowVerificarForm(false);
          setObservaciones('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Detalle del Compromiso" size="lg">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </BaseModal>
    );
  }

  if (!compromiso) {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Detalle del Compromiso" size="lg">
        <p className="text-center text-gray-500 py-8">No se encontro el compromiso.</p>
      </BaseModal>
    );
  }

  const canUpdateProgreso =
    compromiso.estado === 'PENDIENTE' || compromiso.estado === 'EN_PROGRESO';
  const canCompletar = canUpdateProgreso;
  const canVerificar = compromiso.estado === 'COMPLETADO' && !compromiso.verificado_por;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Compromiso ${compromiso.codigo}`}
      subtitle="Revision por la Direccion"
      size="lg"
    >
      <div className="space-y-6">
        {/* Estado y Prioridad */}
        <div className="flex items-center gap-3">
          <Badge variant={ESTADO_BADGE[compromiso.estado] || 'gray'}>
            {compromiso.estado_display || compromiso.estado}
          </Badge>
          <Badge variant={PRIORIDAD_BADGE[compromiso.prioridad] || 'gray'}>
            {compromiso.prioridad_display || compromiso.prioridad}
          </Badge>
        </div>

        {/* Descripcion */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Descripcion
          </h4>
          <p className="text-gray-900 dark:text-gray-100">{compromiso.descripcion}</p>
          {compromiso.objetivo && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <Target className="inline h-3.5 w-3.5 mr-1" />
              {compromiso.objetivo}
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {compromiso.responsable_name || 'Sin asignar'}
              </p>
              {compromiso.responsable_cargo_name && (
                <p className="text-xs text-gray-500">{compromiso.responsable_cargo_name}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Limite</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(compromiso.fecha_limite), 'dd/MM/yyyy', { locale: es })}
              </p>
              <p className="text-xs text-gray-500">
                Creado: {format(new Date(compromiso.fecha_compromiso), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Progreso</h4>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {canUpdateProgreso ? progreso || currentProgreso : currentProgreso}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-300 bg-purple-600"
              style={{ width: `${canUpdateProgreso ? progreso || currentProgreso : currentProgreso}%` }}
            />
          </div>

          {canUpdateProgreso && (
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progreso || currentProgreso}
                onChange={(e) => handleProgresoChange(Number(e.target.value))}
                className="flex-1 accent-purple-600"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleGuardarProgreso}
                disabled={progresoMutation.isPending || (progreso || currentProgreso) === currentProgreso}
              >
                {progresoMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        {/* Verificacion existente */}
        {compromiso.verificado_por && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                Verificado por {compromiso.verificado_por_name}
              </span>
            </div>
            {compromiso.fecha_verificacion && (
              <p className="text-xs text-green-600 dark:text-green-400">
                {format(new Date(compromiso.fecha_verificacion), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </p>
            )}
            <p className="text-sm mt-1 text-green-700 dark:text-green-300">
              {compromiso.es_eficaz ? 'Accion eficaz' : 'Accion no eficaz - requiere seguimiento'}
            </p>
          </div>
        )}

        {/* Observaciones existentes */}
        {compromiso.observaciones && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Observaciones
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {compromiso.observaciones}
            </p>
          </div>
        )}

        {/* Evidencia existente */}
        {compromiso.evidencia_cumplimiento && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Evidencia de Cumplimiento
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {compromiso.evidencia_cumplimiento}
            </p>
          </div>
        )}

        {/* Evidencias Centralizadas */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            Archivos de Evidencia
          </h4>
          <EvidenceGallery
            entityType="revision_direccion.compromiso"
            entityId={compromisoId}
            layout="list"
            showActions={canCompletar || canVerificar}
          />
          {canCompletar && (
            <div className="mt-3">
              <EvidenceUploader
                entityType="revision_direccion.compromiso"
                entityId={compromisoId}
                categoria="REGISTRO"
                normasRelacionadas={['ISO_9001']}
                placeholder="Adjuntar evidencia de cumplimiento"
                maxFiles={3}
              />
            </div>
          )}
        </div>

        {/* Form: Marcar Completado */}
        {showCompletarForm && canCompletar && (
          <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20 space-y-3">
            <h4 className="font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Marcar como Completado
            </h4>
            <Textarea
              label="Evidencia de Cumplimiento"
              value={evidencia}
              onChange={(e) => setEvidencia(e.target.value)}
              placeholder="Describa la evidencia de cumplimiento..."
              rows={2}
            />
            <Textarea
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleCompletar}
                disabled={completarMutation.isPending}
              >
                {completarMutation.isPending ? 'Guardando...' : 'Confirmar Completado'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCompletarForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Form: Verificar */}
        {showVerificarForm && canVerificar && (
          <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-3">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Verificar Compromiso
            </h4>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="eficaz"
                  checked={esEficaz}
                  onChange={() => setEsEficaz(true)}
                  className="text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Accion Eficaz</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="eficaz"
                  checked={!esEficaz}
                  onChange={() => setEsEficaz(false)}
                  className="text-red-600"
                />
                <span className="text-gray-700 dark:text-gray-300">No Eficaz</span>
              </label>
            </div>
            <Textarea
              label="Observaciones de Verificacion"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones de la verificacion de eficacia..."
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleVerificar}
                disabled={verificarMutation.isPending}
              >
                {verificarMutation.isPending ? 'Verificando...' : 'Confirmar Verificacion'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowVerificarForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {canCompletar && !showCompletarForm && (
          <Button
            variant="outline"
            onClick={() => {
              setShowCompletarForm(true);
              setShowVerificarForm(false);
            }}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar Completado
          </Button>
        )}

        {canVerificar && !showVerificarForm && (
          <Button
            variant="outline"
            onClick={() => {
              setShowVerificarForm(true);
              setShowCompletarForm(false);
            }}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Verificar
          </Button>
        )}

        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </BaseModal>
  );
};
