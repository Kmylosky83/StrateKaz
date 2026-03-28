/**
 * Hook para gestión de Two Factor Authentication (2FA) — Compartido
 * Movido desde features/perfil/hooks/ — pertenece a Core (Capa 0)
 *
 * Provee funcionalidad para:
 * - Obtener estado de 2FA
 * - Configurar y habilitar 2FA
 * - Deshabilitar 2FA
 * - Regenerar códigos de backup
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  TwoFactorStatus,
  TwoFactorSetupRequest,
  TwoFactorSetupResponse,
  TwoFactorEnableRequest,
  TwoFactorDisableRequest,
  TwoFactorRegenerateBackupCodesRequest,
} from '@/types/twoFactor.types';
import {
  getTwoFactorStatus,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  regenerateBackupCodes,
} from '@/api/twoFactor.api';
import { useAuthStore } from '@/store/authStore';
import { isPortalOnlyUser } from '@/utils/portalUtils';

const QUERY_KEY = ['twoFactor', 'status'];

export const use2FA = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Query: Obtener estado de 2FA
  // Deshabilitado para usuarios portal-only (proveedores/clientes) que no usan 2FA
  const {
    data: status,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery<TwoFactorStatus>({
    queryKey: QUERY_KEY,
    queryFn: getTwoFactorStatus,
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !isPortalOnlyUser(user),
    retry: 1,
  });

  // Mutation: Setup (Iniciar configuración)
  const setupMutation = useMutation({
    mutationFn: (data: TwoFactorSetupRequest) => setupTwoFactor(data),
    onSuccess: (data) => {
      setSetupData(data);
      toast.success('QR generado. Escanéalo con tu app de autenticación.');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: Record<string, string[] | string> } };
      const errorMsg =
        (err.response?.data?.password as string[])?.[0] ||
        (err.response?.data?.error as string) ||
        'Error al generar QR. Verifica tu contraseña.';
      toast.error(errorMsg);
    },
  });

  // Mutation: Enable (Habilitar 2FA)
  const enableMutation = useMutation({
    mutationFn: (data: TwoFactorEnableRequest) => enableTwoFactor(data),
    onSuccess: (data) => {
      setBackupCodes(data.codes);
      toast.success('2FA habilitado exitosamente');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: Record<string, string[] | string> } };
      const errorMsg =
        (err.response?.data?.error as string) ||
        (err.response?.data?.token as string[])?.[0] ||
        'Error al habilitar 2FA. Verifica el código.';
      toast.error(errorMsg);
    },
  });

  // Mutation: Disable (Deshabilitar 2FA)
  const disableMutation = useMutation({
    mutationFn: (data: TwoFactorDisableRequest) => disableTwoFactor(data),
    onSuccess: () => {
      toast.success('2FA deshabilitado exitosamente');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setSetupData(null);
      setBackupCodes([]);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: Record<string, string[] | string> } };
      const errorMsg =
        (err.response?.data?.password as string[])?.[0] ||
        (err.response?.data?.error as string) ||
        'Error al deshabilitar 2FA. Verifica tu contraseña.';
      toast.error(errorMsg);
    },
  });

  // Mutation: Regenerar códigos de backup
  const regenerateBackupCodesMutation = useMutation({
    mutationFn: (data: TwoFactorRegenerateBackupCodesRequest) => regenerateBackupCodes(data),
    onSuccess: (data) => {
      setBackupCodes(data.codes);
      toast.success('Códigos de backup regenerados exitosamente');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: Record<string, string[] | string> } };
      const errorMsg =
        (err.response?.data?.password as string[])?.[0] ||
        (err.response?.data?.error as string) ||
        'Error al regenerar códigos. Verifica tu contraseña.';
      toast.error(errorMsg);
    },
  });

  const startSetup = async (password: string) => {
    await setupMutation.mutateAsync({ password });
  };

  const enable = async (token: string) => {
    await enableMutation.mutateAsync({ token });
  };

  const disable = async (password: string) => {
    await disableMutation.mutateAsync({ password });
  };

  const regenerate = async (password: string) => {
    await regenerateBackupCodesMutation.mutateAsync({ password });
  };

  const clearSetupData = () => {
    setSetupData(null);
    setBackupCodes([]);
  };

  return {
    // Estado
    status,
    isLoadingStatus,
    statusError,
    setupData,
    backupCodes,

    // Acciones
    startSetup,
    enable,
    disable,
    regenerate,
    clearSetupData,
    refetchStatus,

    // Loading states
    isSettingUp: setupMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
    isRegenerating: regenerateBackupCodesMutation.isPending,
  };
};
