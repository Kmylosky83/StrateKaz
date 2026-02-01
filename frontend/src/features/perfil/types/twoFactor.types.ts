/**
 * Types para Two Factor Authentication (2FA)
 */

// ============================================================================
// ESTADO 2FA
// ============================================================================

export interface TwoFactorStatus {
  is_enabled: boolean;
  verified_at: string | null;
  backup_codes_remaining: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SETUP (Configuración inicial)
// ============================================================================

export interface TwoFactorSetupRequest {
  password: string;
}

export interface TwoFactorSetupResponse {
  qr_code: string; // Data URL (data:image/png;base64,...)
  secret_key: string; // Para entrada manual
  message: string;
}

// ============================================================================
// ENABLE (Habilitar 2FA)
// ============================================================================

export interface TwoFactorEnableRequest {
  token: string; // Código TOTP de 6 dígitos
}

export interface TwoFactorEnableResponse {
  codes: string[]; // Códigos de backup
  message: string;
}

// ============================================================================
// VERIFY (Verificar código durante login)
// ============================================================================

export interface TwoFactorVerifyRequest {
  username: string;
  token: string; // Código TOTP o código de backup
  use_backup_code?: boolean;
}

export interface TwoFactorVerifyResponse {
  message: string;
  verified: boolean;
  access: string; // Access token JWT
  refresh: string; // Refresh token JWT
  backup_codes_remaining?: number | null;
}

// ============================================================================
// DISABLE (Deshabilitar 2FA)
// ============================================================================

export interface TwoFactorDisableRequest {
  password: string;
}

export interface TwoFactorDisableResponse {
  message: string;
}

// ============================================================================
// REGENERATE BACKUP CODES
// ============================================================================

export interface TwoFactorRegenerateBackupCodesRequest {
  password: string;
}

export interface TwoFactorRegenerateBackupCodesResponse {
  codes: string[];
  message: string;
}
