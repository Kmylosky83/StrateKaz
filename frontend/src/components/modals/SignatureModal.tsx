/**
 * SignatureModal Component
 *
 * Modal para captura de firmas digitales con:
 * - Vista previa en tiempo real
 * - Responsive (adapta orientación en móvil)
 * - Metadatos de captura (timestamp, usuario, IP)
 * - Validación antes de guardar
 * - Export optimizado
 *
 * @example
 * ```tsx
 * import { SignatureModal } from '@/components/modals';
 *
 * <SignatureModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSave={(data) => handleSave(data)}
 *   title="Firma de Aprobación"
 *   userName="Juan Pérez"
 *   documentType="ACTA_REVISION"
 *   documentId="RD-2026-001"
 * />
 * ```
 */

import React, { useRef, useState } from 'react';
import { BaseModal } from './BaseModal';
import { SignaturePad, SignaturePadRef } from '../forms/SignaturePad';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { TotpVerificationStep } from './TotpVerificationStep';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';

export interface SignatureData {
  /** Firma en Base64 */
  signatureBase64: string;

  /** Firma como DataURL (para preview) */
  signatureDataUrl: string;

  /** Timestamp de captura */
  timestamp: string;

  /** Nombre del usuario firmante */
  userName: string;

  /** Email del usuario firmante */
  userEmail?: string;

  /** ID del usuario */
  userId?: number;

  /** Tipo de documento firmado */
  documentType?: string;

  /** ID del documento */
  documentId?: string;

  /** Hash SHA-256 de la firma (para integridad) */
  signatureHash?: string;

  /** Código TOTP usado para reconfirmación (nivel_firma >= 2) */
  totpCode?: string;

  /** Código OTP por email (nivel_firma >= 3) */
  emailOtpCode?: string;

  /** Metadatos adicionales */
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    screenResolution?: string;
    geolocation?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface SignatureModalProps {
  /** Si el modal está abierto */
  isOpen: boolean;

  /** Callback al cerrar */
  onClose: () => void;

  /** Callback al guardar la firma */
  onSave: (signatureData: SignatureData) => void | Promise<void>;

  /** Título del modal */
  title?: string;

  /** Descripción del documento a firmar */
  description?: string;

  /** Nombre del usuario firmante */
  userName: string;

  /** Email del usuario */
  userEmail?: string;

  /** ID del usuario */
  userId?: number;

  /** Tipo de documento */
  documentType?: string;

  /** ID del documento */
  documentId?: string;

  /** Firma existente (para edición) */
  existingSignature?: string;

  /** Si se debe capturar geolocalización */
  captureGeolocation?: boolean;

  /** Si se debe calcular hash */
  calculateHash?: boolean;

  /** Orientación forzada en móvil */
  mobileOrientation?: 'portrait' | 'landscape' | 'auto';

  /** Callback de carga */
  isLoading?: boolean;

  /** Si requiere reconfirmación TOTP al firmar (nivel_firma >= 2) */
  requiresTotp?: boolean;

  /** Nivel de firma del usuario (1, 2 o 3) */
  nivelFirma?: number;
}

/**
 * Calcula SHA-256 hash de un string
 */
async function calculateSHA256(data: string): Promise<string> {
  if (!crypto.subtle) {
    // Fallback para navegadores sin crypto.subtle
    return btoa(data).substring(0, 64);
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Obtiene IP del cliente (aproximación)
 */
async function _getClientIP(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return undefined;
  }
}

/**
 * Obtiene geolocalización
 */
async function getGeolocation(): Promise<{ latitude: number; longitude: number } | undefined> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(undefined);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(undefined);
      }
    );
  });
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Firma Digital',
  description,
  userName,
  userEmail,
  userId,
  documentType,
  documentId,
  existingSignature,
  captureGeolocation = false,
  calculateHash = true,
  mobileOrientation = 'auto',
  isLoading = false,
  requiresTotp = false,
  nivelFirma = 1,
}) => {
  const signatureRef = useRef<SignaturePadRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<'sign' | 'totp'>('sign');
  const [pendingSignatureData, setPendingSignatureData] = useState<SignatureData | null>(null);
  const [usingSavedSignature, setUsingSavedSignature] = useState(false);
  const [savedSignaturePreview, setSavedSignaturePreview] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const hasSavedSignature = user?.tiene_firma_guardada ?? false;

  const handleUseSavedSignature = async () => {
    setError(null);
    setIsSaving(true);

    try {
      // Fetch saved signature from API
      const { api } = await import('@/lib/api-client');
      const response = await api.get<{ firma_guardada: string | null }>(
        '/core/users/firma-guardada/'
      );
      const firmaBase64 = response.data.firma_guardada;

      if (!firmaBase64) {
        setError('No se encontr\u00f3 firma guardada');
        setIsSaving(false);
        return;
      }

      setSavedSignaturePreview(firmaBase64);
      setUsingSavedSignature(true);
      setIsSaving(false);
    } catch {
      setError('Error al cargar la firma guardada');
      setIsSaving(false);
    }
  };

  const handleDrawNew = () => {
    setUsingSavedSignature(false);
    setSavedSignaturePreview(null);
  };

  const buildSignatureData = async (
    signatureDataUrl: string,
    signatureBase64: string
  ): Promise<SignatureData> => {
    const timestamp = new Date().toISOString();

    let signatureHash: string | undefined;
    if (calculateHash) {
      signatureHash = await calculateSHA256(signatureBase64);
    }

    const metadata: SignatureData['metadata'] = {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    };

    if (captureGeolocation) {
      metadata.geolocation = await getGeolocation();
    }

    return {
      signatureBase64,
      signatureDataUrl,
      timestamp,
      userName,
      userEmail,
      userId,
      documentType,
      documentId,
      signatureHash,
      metadata,
    };
  };

  const handleSave = async () => {
    let signatureDataUrl: string;
    let signatureBase64: string;

    if (usingSavedSignature && savedSignaturePreview) {
      signatureDataUrl = savedSignaturePreview;
      signatureBase64 = savedSignaturePreview.replace(/^data:image\/\w+;base64,/, '');
    } else {
      if (!signatureRef.current) return;

      if (signatureRef.current.isEmpty()) {
        setError('Por favor, firme antes de continuar');
        return;
      }

      signatureDataUrl = signatureRef.current.getDataURL();
      signatureBase64 = signatureRef.current.getBase64();
    }

    setError(null);
    setIsSaving(true);

    try {
      const signatureData = await buildSignatureData(signatureDataUrl, signatureBase64);

      // Si requiere TOTP, mostrar paso de verificación
      if (requiresTotp && nivelFirma >= 2) {
        setPendingSignatureData(signatureData);
        setStep('totp');
        setIsSaving(false);
        return;
      }

      // Guardar directamente
      await onSave(signatureData);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Error al guardar la firma');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTotpVerified = async (totpData: { totpCode?: string; emailOtpCode?: string }) => {
    if (!pendingSignatureData) return;

    setIsSaving(true);
    try {
      const signatureDataWithTotp: SignatureData = {
        ...pendingSignatureData,
        totpCode: totpData.totpCode,
        emailOtpCode: totpData.emailOtpCode,
      };

      await onSave(signatureDataWithTotp);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Error al guardar la firma');
      setStep('sign');
    } finally {
      setIsSaving(false);
    }
  };

  const _handleClear = () => {
    signatureRef.current?.clear();
    setError(null);
  };

  const handleModalClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  // Detectar móvil
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const shouldRotate =
    isMobile && mobileOrientation === 'landscape' && window.innerHeight > window.innerWidth;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={step === 'totp' ? 'Verificación de Seguridad' : title}
      size="lg"
      closeOnOverlayClick={!isSaving}
    >
      <div className="space-y-4">
        {/* Paso TOTP */}
        {step === 'totp' && (
          <TotpVerificationStep
            nivelFirma={nivelFirma}
            onVerified={handleTotpVerified}
            onBack={() => setStep('sign')}
            isLoading={isSaving}
          />
        )}

        {/* Paso de firma (solo visible cuando step === 'sign') */}
        {step === 'sign' && (
          <>
            {/* Descripción */}
            {description && (
              <Alert variant="info" title="Documento a firmar">
                {description}
              </Alert>
            )}

            {/* Información del firmante */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Información del Firmante
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Nombre:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {userName}
                  </span>
                </div>
                {userEmail && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {userEmail}
                    </span>
                  </div>
                )}
                {documentType && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {documentType}
                    </span>
                  </div>
                )}
                {documentId && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Documento:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {documentId}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(), "PPP 'a las' p", { locale: es })}
                  </span>
                </div>
              </div>
            </div>

            {/* Advertencia de rotación en móvil */}
            {shouldRotate && (
              <Alert variant="warning" title="Mejor experiencia">
                Para una mejor experiencia, gire su dispositivo horizontalmente
              </Alert>
            )}

            {/* Usar firma guardada */}
            {hasSavedSignature && !usingSavedSignature && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Firma guardada disponible
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      Puede usar su firma guardada en lugar de dibujar una nueva
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleUseSavedSignature}
                    disabled={isSaving}
                    loading={isSaving}
                  >
                    Usar firma guardada
                  </Button>
                </div>
              </div>
            )}

            {/* Preview firma guardada */}
            {usingSavedSignature && savedSignaturePreview && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Firma guardada seleccionada
                  </h4>
                  <Button variant="secondary" size="sm" onClick={handleDrawNew}>
                    Dibujar nueva firma
                  </Button>
                </div>
                <div className="border-2 border-green-300 dark:border-green-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                  <img
                    src={savedSignaturePreview}
                    alt="Firma guardada"
                    className="max-h-40 mx-auto object-contain"
                  />
                </div>
              </div>
            )}

            {/* SignaturePad (oculto si usa firma guardada) */}
            {!usingSavedSignature && (
              <SignaturePad
                ref={signatureRef}
                label="Firma Manuscrita"
                helpText="Firme en el recuadro usando su dedo (m\u00f3vil) o mouse (computadora)"
                required
                height={isMobile ? 180 : 220}
                defaultValue={existingSignature}
                error={error || undefined}
                disabled={isSaving}
                showGrid
                placeholder="Firme aqu\u00ed con su dedo o mouse"
              />
            )}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={handleModalClose}
                disabled={isSaving}
                className="order-2 sm:order-1"
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving || isLoading}
                loading={isSaving || isLoading}
                className="order-1 sm:order-2"
              >
                {isSaving
                  ? 'Guardando...'
                  : usingSavedSignature
                    ? 'Firmar con firma guardada'
                    : existingSignature
                      ? 'Actualizar Firma'
                      : 'Guardar Firma'}
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
              Al firmar, acepta que esta firma electrónica tiene validez legal y será almacenada de
              forma segura junto con sus datos de identificación y timestamp.
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
};
