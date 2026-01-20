/**
 * API para Two Factor Authentication (2FA)
 *
 * Endpoints:
 * - GET /api/core/2fa/status/ - Obtener estado 2FA
 * - POST /api/core/2fa/setup/ - Iniciar configuración 2FA
 * - POST /api/core/2fa/enable/ - Habilitar 2FA
 * - POST /api/core/2fa/disable/ - Deshabilitar 2FA
 * - POST /api/core/2fa/verify/ - Verificar código 2FA durante login
 * - POST /api/core/2fa/regenerate-backup-codes/ - Regenerar códigos de backup
 */
import apiClient from '@/api/axios-config';
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
} from '../types/twoFactor.types';

const TWO_FACTOR_BASE_URL = '/core/2fa';

/**
 * Obtiene el estado actual de 2FA del usuario
 */
export const getTwoFactorStatus = async (): Promise<TwoFactorStatus> => {
  const response = await apiClient.get<TwoFactorStatus>(`${TWO_FACTOR_BASE_URL}/status/`);
  return response.data;
};

/**
 * Inicia la configuración de 2FA
 * Genera QR code y secret key
 */
export const setupTwoFactor = async (
  data: TwoFactorSetupRequest
): Promise<TwoFactorSetupResponse> => {
  const response = await apiClient.post<TwoFactorSetupResponse>(
    `${TWO_FACTOR_BASE_URL}/setup/`,
    data
  );
  return response.data;
};

/**
 * Habilita 2FA después de verificar el código
 * Retorna los códigos de backup
 */
export const enableTwoFactor = async (
  data: TwoFactorEnableRequest
): Promise<TwoFactorEnableResponse> => {
  const response = await apiClient.post<TwoFactorEnableResponse>(
    `${TWO_FACTOR_BASE_URL}/enable/`,
    data
  );
  return response.data;
};

/**
 * Deshabilita 2FA
 * Requiere contraseña para confirmar
 */
export const disableTwoFactor = async (
  data: TwoFactorDisableRequest
): Promise<TwoFactorDisableResponse> => {
  const response = await apiClient.post<TwoFactorDisableResponse>(
    `${TWO_FACTOR_BASE_URL}/disable/`,
    data
  );
  return response.data;
};

/**
 * Verifica un código 2FA durante el login
 * Retorna tokens JWT si es exitoso
 */
export const verifyTwoFactor = async (
  data: TwoFactorVerifyRequest
): Promise<TwoFactorVerifyResponse> => {
  const response = await apiClient.post<TwoFactorVerifyResponse>(
    `${TWO_FACTOR_BASE_URL}/verify/`,
    data
  );
  return response.data;
};

/**
 * Regenera los códigos de backup
 * Invalida los códigos anteriores
 */
export const regenerateBackupCodes = async (
  data: TwoFactorRegenerateBackupCodesRequest
): Promise<TwoFactorRegenerateBackupCodesResponse> => {
  const response = await apiClient.post<TwoFactorRegenerateBackupCodesResponse>(
    `${TWO_FACTOR_BASE_URL}/regenerate-backup-codes/`,
    data
  );
  return response.data;
};
