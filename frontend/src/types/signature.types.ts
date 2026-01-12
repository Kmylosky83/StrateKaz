/**
 * Tipos para el sistema de firma digital
 * Sistema de Gestión StrateKaz v3.0
 *
 * Este archivo rompe las dependencias circulares entre
 * useWorkflowFirmas y SignatureModal.
 */

/** Datos de una firma digital capturada */
export interface SignatureData {
  /** Data URL de la imagen de la firma (base64) */
  signatureDataUrl: string;
  /** Hash SHA-256 de la firma para verificación */
  signatureHash: string;
  /** Metadatos de la firma */
  metadata: SignatureMetadata;
}

/** Metadatos asociados a una firma */
export interface SignatureMetadata {
  /** Dirección IP del firmante */
  ipAddress?: string;
  /** User Agent del navegador */
  userAgent?: string;
  /** Timestamp ISO de la firma */
  timestamp: string;
  /** Geolocalización (si disponible) */
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

/** Props del modal de firma */
export interface SignatureModalProps {
  /** Si el modal está abierto */
  isOpen: boolean;
  /** Callback para cerrar */
  onClose: () => void;
  /** Callback cuando se firma exitosamente */
  onSign: (data: SignatureData) => Promise<void>;
  /** Título del modal */
  title?: string;
  /** Descripción/instrucciones */
  description?: string;
  /** Nombre del documento a firmar */
  documentName?: string;
  /** Si está procesando la firma */
  isLoading?: boolean;
}

/** Props del pad de firma */
export interface SignaturePadProps {
  /** Callback cuando cambia la firma */
  onChange: (dataUrl: string | null) => void;
  /** Ancho del canvas */
  width?: number;
  /** Alto del canvas */
  height?: number;
  /** Color del trazo */
  penColor?: string;
  /** Grosor del trazo */
  penWidth?: number;
  /** Color de fondo */
  backgroundColor?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/** Estado del pad de firma */
export interface SignaturePadState {
  /** Si hay una firma dibujada */
  hasSignature: boolean;
  /** Si se está dibujando */
  isDrawing: boolean;
  /** Data URL actual */
  dataUrl: string | null;
}

/** Resultado de verificación de firma */
export interface SignatureVerification {
  /** Si la firma es válida */
  isValid: boolean;
  /** Hash almacenado */
  storedHash: string;
  /** Hash calculado */
  calculatedHash: string;
  /** Fecha de verificación */
  verifiedAt: string;
  /** Mensaje de error si no es válida */
  errorMessage?: string;
}
