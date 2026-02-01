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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
async function getClientIP(): Promise<string | undefined> {
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
}) => {
  const signatureRef = useRef<SignaturePadRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!signatureRef.current) return;

    // Validar que no esté vacía
    if (signatureRef.current.isEmpty()) {
      setError('Por favor, firme antes de continuar');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      // Obtener firma
      const signatureDataUrl = signatureRef.current.getDataURL();
      const signatureBase64 = signatureRef.current.getBase64();

      // Timestamp
      const timestamp = new Date().toISOString();

      // Calcular hash si se requiere
      let signatureHash: string | undefined;
      if (calculateHash) {
        signatureHash = await calculateSHA256(signatureBase64);
      }

      // Metadatos
      const metadata: SignatureData['metadata'] = {
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };

      // IP (opcional, puede ser lento)
      // metadata.ipAddress = await getClientIP();

      // Geolocalización
      if (captureGeolocation) {
        metadata.geolocation = await getGeolocation();
      }

      // Construir data completa
      const signatureData: SignatureData = {
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

      // Guardar
      await onSave(signatureData);

      // Cerrar modal
      onClose();
    } catch (error: any) {
      setError(error.message || 'Error al guardar la firma');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
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
      title={title}
      size="lg"
      closeOnOverlayClick={!isSaving}
    >
      <div className="space-y-4">
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

        {/* SignaturePad */}
        <SignaturePad
          ref={signatureRef}
          label="Firma Manuscrita"
          helpText="Firme en el recuadro usando su dedo (móvil) o mouse (computadora)"
          required
          height={isMobile ? 180 : 220}
          defaultValue={existingSignature}
          error={error || undefined}
          disabled={isSaving}
          showGrid
          placeholder="Firme aquí con su dedo o mouse"
        />

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
            {isSaving ? 'Guardando...' : existingSignature ? 'Actualizar Firma' : 'Guardar Firma'}
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
          Al firmar, acepta que esta firma electrónica tiene validez legal y será almacenada
          de forma segura junto con sus datos de identificación y timestamp.
        </div>
      </div>
    </BaseModal>
  );
};
