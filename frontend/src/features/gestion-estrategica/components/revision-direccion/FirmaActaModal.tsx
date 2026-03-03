/**
 * FirmaActaModal — Modal de firma digital para Actas de Revisión por la Dirección
 *
 * Muestra 3 slots de firma (Elaboró / Revisó / Aprobó) con estado en tiempo real.
 * El usuario que corresponda a un slot sin firmar puede capturar su firma
 * usando el componente SignaturePad del Design System.
 *
 * Flujo:
 * 1. Si no hay proceso de firma iniciado → botón "Iniciar proceso de firma"
 * 2. Una vez iniciado → muestra los 3 slots con estado
 * 3. El usuario firma el slot que le corresponde
 */
import { useState, useCallback } from 'react';
import { PenTool, CheckCircle, Clock, AlertCircle, User, Loader2 } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Badge, Spinner } from '@/components/common';
import { SignaturePad } from '@/components/forms';
import { Textarea } from '@/components/forms';
import { useEstadoFirmas, useIniciarFirma, useFirmarActa } from '../../hooks/useRevisionDireccion';
import type { ActaRevision, RolFirma, FirmaSlot } from '../../types/revision-direccion.types';

interface FirmaActaModalProps {
  isOpen: boolean;
  onClose: () => void;
  acta: ActaRevision;
}

const ROL_LABELS: Record<RolFirma, string> = {
  ELABORO: 'Elaboró',
  REVISO: 'Revisó',
  APROBO: 'Aprobó',
};

const ROL_COLORS: Record<RolFirma, string> = {
  ELABORO: 'text-blue-600 dark:text-blue-400',
  REVISO: 'text-amber-600 dark:text-amber-400',
  APROBO: 'text-green-600 dark:text-green-400',
};

export function FirmaActaModal({ isOpen, onClose, acta }: FirmaActaModalProps) {
  const [firmaActiva, setFirmaActiva] = useState<RolFirma | null>(null);
  const [firmaBase64, setFirmaBase64] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');

  const { data: estadoFirmas, isLoading } = useEstadoFirmas(acta.id);
  const iniciarFirmaMutation = useIniciarFirma();
  const firmarMutation = useFirmarActa();

  const handleIniciarFirma = useCallback(() => {
    iniciarFirmaMutation.mutate(acta.id);
  }, [acta.id, iniciarFirmaMutation]);

  const handleSignature = useCallback((signature: string) => {
    setFirmaBase64(signature);
  }, []);

  const handleFirmar = useCallback(() => {
    if (!firmaActiva || !firmaBase64) return;
    firmarMutation.mutate(
      {
        actaId: acta.id,
        data: {
          rol_firma: firmaActiva,
          firma_imagen: firmaBase64,
          observaciones: observaciones || undefined,
        },
      },
      {
        onSuccess: () => {
          setFirmaActiva(null);
          setFirmaBase64('');
          setObservaciones('');
        },
      }
    );
  }, [acta.id, firmaActiva, firmaBase64, observaciones, firmarMutation]);

  const handleCancelFirma = useCallback(() => {
    setFirmaActiva(null);
    setFirmaBase64('');
    setObservaciones('');
  }, []);

  const getEstadoBadge = (firmado: boolean) => {
    if (firmado) {
      return (
        <Badge variant="success" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          Firmado
        </Badge>
      );
    }
    return (
      <Badge variant="warning" size="sm">
        <Clock className="w-3 h-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  const renderFirmaSlot = (firma: FirmaSlot) => {
    const isActive = firmaActiva === firma.rol;
    const canSign = !firma.firmado && !firmaActiva;

    return (
      <div
        key={firma.rol}
        className={`rounded-lg border-2 p-4 transition-all ${
          isActive
            ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
            : firma.firmado
              ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        {/* Slot Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className={`w-4 h-4 ${ROL_COLORS[firma.rol]}`} />
            <span className={`font-semibold text-sm ${ROL_COLORS[firma.rol]}`}>
              {ROL_LABELS[firma.rol]}
            </span>
          </div>
          {getEstadoBadge(firma.firmado)}
        </div>

        {/* User Info */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          {firma.usuario_nombre || 'Sin asignar'}
        </p>

        {/* Firma Image (if signed) */}
        {firma.firmado && firma.firma_imagen_url && (
          <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600">
            <img
              src={firma.firma_imagen_url}
              alt={`Firma de ${firma.usuario_nombre}`}
              className="max-h-16 mx-auto"
            />
            {firma.fecha_firma && (
              <p className="text-xs text-gray-400 text-center mt-1">
                Firmado:{' '}
                {new Date(firma.fecha_firma).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}

        {/* Sign Button */}
        {canSign && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => setFirmaActiva(firma.rol)}
          >
            <PenTool className="w-3.5 h-3.5 mr-1.5" />
            Firmar como {ROL_LABELS[firma.rol]}
          </Button>
        )}

        {/* Active Signature Capture */}
        {isActive && (
          <div className="mt-4 space-y-3">
            <SignaturePad
              label={`Firma — ${ROL_LABELS[firma.rol]}`}
              onSignature={handleSignature}
              required
              height={160}
              placeholder="Firme aqui con el mouse o toque la pantalla"
            />

            <Textarea
              label="Observaciones (opcional)"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Observaciones adicionales..."
            />

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleFirmar}
                disabled={!firmaBase64 || firmarMutation.isPending}
                className="flex-1"
              >
                {firmarMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Confirmar Firma
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelFirma}
                disabled={firmarMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Footer del modal
  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {estadoFirmas?.estado === 'completado'
          ? 'Todas las firmas han sido completadas'
          : estadoFirmas?.estado === 'en_proceso'
            ? 'Proceso de firma en curso'
            : 'Pendiente de iniciar proceso de firma'}
      </div>
      <Button variant="ghost" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Firma Digital del Acta"
      subtitle={`Acta ${acta.numero_acta}`}
      size="lg"
      footer={footer}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Cargando estado de firmas...
          </p>
        </div>
      ) : !estadoFirmas || !estadoFirmas.firma_documento_id ? (
        /* No signature process started yet */
        <div className="text-center py-8 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <PenTool className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Iniciar Proceso de Firma
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              Se crearán los espacios de firma para Elaboró, Revisó y Aprobó basados en los
              responsables asignados en el acta.
            </p>
          </div>

          {/* Info about signers */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-w-sm mx-auto text-left space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-300">
                Elaboró: {acta.created_by_name || 'Creador del acta'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-amber-500" />
              <span className="text-gray-600 dark:text-gray-300">
                Revisó: {acta.aprobada_por_name || 'Responsable de revisión'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-300">
                Aprobó: {acta.aprobada_por_name || 'Responsable de aprobación'}
              </span>
            </div>
          </div>

          <Button
            onClick={handleIniciarFirma}
            disabled={iniciarFirmaMutation.isPending}
            leftIcon={
              iniciarFirmaMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PenTool className="w-4 h-4" />
              )
            }
          >
            {iniciarFirmaMutation.isPending ? 'Iniciando...' : 'Iniciar Proceso de Firma'}
          </Button>

          {iniciarFirmaMutation.isError && (
            <div className="flex items-center gap-2 justify-center text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              Error al iniciar el proceso. Verifique que el acta tenga responsables asignados.
            </div>
          )}
        </div>
      ) : (
        /* Signature slots */
        <div className="space-y-4">
          {/* Estado general */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado del proceso de firma
            </span>
            <Badge
              variant={
                estadoFirmas.estado === 'completado'
                  ? 'success'
                  : estadoFirmas.estado === 'en_proceso'
                    ? 'warning'
                    : 'gray'
              }
            >
              {estadoFirmas.estado === 'completado'
                ? 'Completado'
                : estadoFirmas.estado === 'en_proceso'
                  ? 'En Proceso'
                  : 'Pendiente'}
            </Badge>
          </div>

          {/* Firma slots */}
          <div className="space-y-3">{estadoFirmas.firmas.map(renderFirmaSlot)}</div>
        </div>
      )}
    </BaseModal>
  );
}
