/**
 * API para Two Factor Authentication (2FA)
 * Movido desde features/perfil/api/ — pertenece a Core (Capa 0)
 *
 * Endpoints:
 * - GET /api/core/2fa/status/ - Obtener estado 2FA
 * - POST /api/core/2fa/setup/ - Iniciar configuración 2FA
 * - POST /api/core/2fa/enable/ - Habilitar 2FA
 * - POST /api/core/2fa/disable/ - Deshabilitar 2FA
 * - POST /api/core/2fa/verify/ - Verificar código 2FA durante login
 * - POST /api/core/2fa/regenerate-backup-codes/ - Regenerar códigos de backup
 */
import apiClient from './axios-config';
import type {
  TwoFactorStatus,
  TwoFactorSetupRequest,
  TwoFactorSetupResponse,
  TwoFactorEnableRequest,
  TwoFactorEnableResponse,
  TwoFactorVerifyRequest,
  TwoFactorVerifyResponse,
  TwoFactorDisableRequest,
  TwoFactorDisableResponse,
  TwoFactorRegenerateBackupCodesRequest,
  TwoFactorRegenerateBackupCodesResponse,
} from '@/types/twoFactor.types';

const TWO_FACTOR_BASE_URL = '/core/2fa';

export const getTwoFactorStatus = async (): Promise<TwoFactorStatus> => {
  const response = await apiClient.get<TwoFactorStatus>(`${TWO_FACTOR_BASE_URL}/status/`);
  return response.data;
};

export const setupTwoFactor = async (
  data: TwoFactorSetupRequest
): Promise<TwoFactorSetupResponse> => {
  const response = await apiClient.post<TwoFactorSetupResponse>(
    `${TWO_FACTOR_BASE_URL}/setup/`,
    data
  );
  return response.data;
};

export const enableTwoFactor = async (
  data: TwoFactorEnableRequest
): Promise<TwoFactorEnableResponse> => {
  const response = await apiClient.post<TwoFactorEnableResponse>(
    `${TWO_FACTOR_BASE_URL}/enable/`,
    data
  );
  return response.data;
};

export const disableTwoFactor = async (
  data: TwoFactorDisableRequest
): Promise<TwoFactorDisableResponse> => {
  const response = await apiClient.post<TwoFactorDisableResponse>(
    `${TWO_FACTOR_BASE_URL}/disable/`,
    data
  );
  return response.data;
};

export const verifyTwoFactor = async (
  data: TwoFactorVerifyRequest
): Promise<TwoFactorVerifyResponse> => {
  const response = await apiClient.post<TwoFactorVerifyResponse>(
    `${TWO_FACTOR_BASE_URL}/verify/`,
    data
  );
  return response.data;
};

export const regenerateBackupCodes = async (
  data: TwoFactorRegenerateBackupCodesRequest
): Promise<TwoFactorRegenerateBackupCodesResponse> => {
  const response = await apiClient.post<TwoFactorRegenerateBackupCodesResponse>(
    `${TWO_FACTOR_BASE_URL}/regenerate-backup-codes/`,
    data
  );
  return response.data;
};
