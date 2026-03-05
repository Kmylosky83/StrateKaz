/**
 * Tipos compartidos para los tabs del TenantFormModal.
 */
import type { CreateTenantDTO, UpdateTenantDTO, Plan, Tenant } from '../../types';

/** Props base que reciben todos los tabs */
export interface TenantTabProps {
  formData: UpdateTenantDTO & CreateTenantDTO;
  handleChange: (field: string, value: unknown) => void;
  errors: Record<string, string>;
  isEditing: boolean;
}

/** Props adicionales para TabBasico */
export interface TabBasicoProps extends TenantTabProps {
  plans: Plan[] | undefined;
  generateCode: () => void;
  generateSubdomain: () => void;
}

/** Props adicionales para TabBranding */
export interface TabBrandingProps extends TenantTabProps {
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  logoWhiteFile: File | null;
  setLogoWhiteFile: (file: File | null) => void;
  logoDarkFile: File | null;
  setLogoDarkFile: (file: File | null) => void;
  faviconFile: File | null;
  setFaviconFile: (file: File | null) => void;
  loginBackgroundFile: File | null;
  setLoginBackgroundFile: (file: File | null) => void;
  effectiveTenant: Tenant | null | undefined;
  clearImages: Record<string, boolean>;
  setClearImages: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

/** Props adicionales para TabPwa */
export interface TabPwaProps extends TenantTabProps {
  pwaIcon192File: File | null;
  setPwaIcon192File: (file: File | null) => void;
  pwaIcon512File: File | null;
  setPwaIcon512File: (file: File | null) => void;
  pwaIconMaskableFile: File | null;
  setPwaIconMaskableFile: (file: File | null) => void;
  effectiveTenant: Tenant | null | undefined;
  clearImages: Record<string, boolean>;
  setClearImages: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

/** Props adicionales para TabModulos */
export interface TabModulosProps extends TenantTabProps {
  handleModuleToggle: (moduleCode: string) => void;
}
