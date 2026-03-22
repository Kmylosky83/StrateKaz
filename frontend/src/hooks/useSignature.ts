/**
 * useSignature Hook
 *
 * Hook personalizado para manejo de firmas digitales con:
 * - Integración con backend
 * - Cache con TanStack Query
 * - Validación de integridad (SHA-256)
 * - Gestión de estado
 *
 * @example
 * ```tsx
 * const { saveSignature, validateSignature, isLoading } = useSignature();
 *
 * const handleSign = async (signatureData: SignatureData) => {
 *   await saveSignature({
 *     documentType: 'ACTA_REVISION',
 *     documentId: actaId,
 *     signatureData,
 *   });
 * };
 * ```
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { SignatureData } from '@/components/modals/SignatureModal';

export interface SignatureRecord {
  id: number;
  documentType: string;
  documentId: string;
  signatureBase64: string;
  signatureHash: string;
  userName: string;
  userEmail?: string;
  userId?: number;
  timestamp: string;
  metadata?: unknown;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveSignatureParams {
  documentType: string;
  documentId: string;
  signatureData: SignatureData;
}

export interface ValidateSignatureParams {
  signatureId: number;
  currentHash: string;
}

/**
 * Hook para manejo de firmas digitales
 */
export function useSignature() {
  const queryClient = useQueryClient();

  /**
   * Guardar firma
   */
  const saveSignatureMutation = useMutation({
    mutationFn: async (params: SaveSignatureParams) => {
      const response = await api.post<SignatureRecord>('/api/core/signatures/', {
        document_type: params.documentType,
        document_id: params.documentId,
        signature_base64: params.signatureData.signatureBase64,
        signature_hash: params.signatureData.signatureHash,
        user_name: params.signatureData.userName,
        user_email: params.signatureData.userEmail,
        user_id: params.signatureData.userId,
        timestamp: params.signatureData.timestamp,
        metadata: params.signatureData.metadata,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['signatures', variables.documentType, variables.documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['signatures', variables.documentType],
      });
    },
  });

  /**
   * Obtener firmas de un documento
   */
  const useDocumentSignatures = (documentType?: string, documentId?: string) => {
    return useQuery<SignatureRecord[]>({
      queryKey: ['signatures', documentType, documentId],
      queryFn: async () => {
        const response = await api.get<SignatureRecord[]>('/api/core/signatures/', {
          params: {
            document_type: documentType,
            document_id: documentId,
          },
        });
        return response.data;
      },
      enabled: !!documentType && !!documentId,
    });
  };

  /**
   * Obtener firma por ID
   */
  const useSignature = (signatureId?: number) => {
    return useQuery<SignatureRecord>({
      queryKey: ['signature', signatureId],
      queryFn: async () => {
        const response = await api.get<SignatureRecord>(`/api/core/signatures/${signatureId}/`);
        return response.data;
      },
      enabled: !!signatureId,
    });
  };

  /**
   * Validar integridad de firma
   */
  const validateSignatureMutation = useMutation({
    mutationFn: async (params: ValidateSignatureParams) => {
      const response = await api.post<{ isValid: boolean; message: string }>(
        `/api/core/signatures/${params.signatureId}/validate/`,
        {
          current_hash: params.currentHash,
        }
      );
      return response.data;
    },
  });

  /**
   * Eliminar firma
   */
  const deleteSignatureMutation = useMutation({
    mutationFn: async (signatureId: number) => {
      await api.delete(`/api/core/signatures/${signatureId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures'] });
    },
  });

  return {
    // Mutations
    saveSignature: saveSignatureMutation.mutateAsync,
    validateSignature: validateSignatureMutation.mutateAsync,
    deleteSignature: deleteSignatureMutation.mutateAsync,

    // Queries (hooks)
    useDocumentSignatures,
    useSignature,

    // Estados
    isLoading:
      saveSignatureMutation.isPending ||
      validateSignatureMutation.isPending ||
      deleteSignatureMutation.isPending,
    isSaving: saveSignatureMutation.isPending,
    isValidating: validateSignatureMutation.isPending,
    isDeleting: deleteSignatureMutation.isPending,

    // Errores
    saveError: saveSignatureMutation.error,
    validateError: validateSignatureMutation.error,
    deleteError: deleteSignatureMutation.error,
  };
}

/**
 * Hook simplificado para un solo documento
 */
export function useDocumentSignature(documentType: string, documentId: string) {
  const { saveSignature, useDocumentSignatures, isLoading, saveError } = useSignature();
  const { data: signatures, isLoading: isLoadingSignatures } = useDocumentSignatures(
    documentType,
    documentId
  );

  const hasSignature = signatures && signatures.length > 0;
  const latestSignature = signatures?.[0];

  const handleSaveSignature = async (signatureData: SignatureData) => {
    return await saveSignature({
      documentType,
      documentId,
      signatureData,
    });
  };

  return {
    signatures,
    latestSignature,
    hasSignature,
    saveSignature: handleSaveSignature,
    isLoading: isLoading || isLoadingSignatures,
    error: saveError,
  };
}
