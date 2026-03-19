/**
 * Helpers para inicializacion y poblado del formulario de tenant.
 */
import { DEFAULT_ENABLED_MODULES } from '@/constants/modules';
import { DEFAULT_TENANT_COLORS, DEFAULT_PWA_COLORS } from '@/constants/defaults';
import type { Tenant, CreateTenantDTO, UpdateTenantDTO } from '../../types';

export type TenantFormData = UpdateTenantDTO & CreateTenantDTO;

/**
 * Crea el estado inicial del formulario con valores por defecto.
 * @param trialDate - Fecha de fin de trial (opcional, para nuevos tenants)
 */
export const createInitialFormData = (trialDate?: Date): TenantFormData => ({
  // Basico
  code: '',
  name: '',
  subdomain: '',
  plan: null,
  tier: 'starter',
  max_users: 5,
  max_storage_gb: 5,
  is_active: true,
  is_trial: true,
  trial_ends_at: trialDate ? trialDate.toISOString().split('T')[0] : '',
  subscription_ends_at: '',
  notes: '',
  // Fiscal
  nit: '',
  razon_social: '',
  nombre_comercial: '',
  representante_legal: '',
  cedula_representante: '',
  tipo_sociedad: 'SAS',
  actividad_economica: '',
  descripcion_actividad: '',
  regimen_tributario: 'COMUN',
  // Contacto
  direccion_fiscal: '',
  ciudad: '',
  departamento: '',
  pais: 'Colombia',
  codigo_postal: '',
  telefono_principal: '',
  telefono_secundario: '',
  email_corporativo: '',
  sitio_web: '',
  // Registro Mercantil
  matricula_mercantil: '',
  camara_comercio: '',
  fecha_constitucion: null,
  fecha_inscripcion_registro: null,
  // Regional
  zona_horaria: 'America/Bogota',
  formato_fecha: 'DD/MM/YYYY',
  moneda: 'COP',
  simbolo_moneda: '$',
  separador_miles: '.',
  separador_decimales: ',',
  // Branding
  primary_color: DEFAULT_TENANT_COLORS.primary,
  secondary_color: DEFAULT_TENANT_COLORS.secondary,
  accent_color: DEFAULT_TENANT_COLORS.accent,
  sidebar_color: DEFAULT_TENANT_COLORS.sidebar,
  background_color: DEFAULT_TENANT_COLORS.background,
  company_slogan: '',
  // PWA
  pwa_name: '',
  pwa_short_name: '',
  pwa_description: '',
  pwa_theme_color: DEFAULT_PWA_COLORS.theme,
  pwa_background_color: DEFAULT_PWA_COLORS.background,
  // Modulos
  enabled_modules: DEFAULT_ENABLED_MODULES,
});

/**
 * Mapea un Tenant del backend a los campos del formulario.
 */
export const tenantToFormData = (t: Tenant): TenantFormData => ({
  code: t.code || '',
  name: t.name || '',
  subdomain: t.subdomain || '',
  plan: t.plan || null,
  tier: t.tier || 'starter',
  max_users: t.max_users ?? 5,
  max_storage_gb: t.max_storage_gb ?? 5,
  is_active: t.is_active ?? true,
  is_trial: t.is_trial ?? false,
  trial_ends_at: t.trial_ends_at?.split('T')[0] || '',
  subscription_ends_at: t.subscription_ends_at?.split('T')[0] || '',
  notes: t.notes || '',
  nit: t.nit || '',
  razon_social: t.razon_social || '',
  nombre_comercial: t.nombre_comercial || '',
  representante_legal: t.representante_legal || '',
  cedula_representante: t.cedula_representante || '',
  tipo_sociedad: t.tipo_sociedad || 'SAS',
  actividad_economica: t.actividad_economica || '',
  descripcion_actividad: t.descripcion_actividad || '',
  regimen_tributario: t.regimen_tributario || 'COMUN',
  direccion_fiscal: t.direccion_fiscal || '',
  ciudad: t.ciudad || '',
  departamento: t.departamento || '',
  pais: t.pais || 'Colombia',
  codigo_postal: t.codigo_postal || '',
  telefono_principal: t.telefono_principal || '',
  telefono_secundario: t.telefono_secundario || '',
  email_corporativo: t.email_corporativo || '',
  sitio_web: t.sitio_web || '',
  matricula_mercantil: t.matricula_mercantil || '',
  camara_comercio: t.camara_comercio || '',
  fecha_constitucion: t.fecha_constitucion?.split('T')[0] || null,
  fecha_inscripcion_registro: t.fecha_inscripcion_registro?.split('T')[0] || null,
  zona_horaria: t.zona_horaria || 'America/Bogota',
  formato_fecha: t.formato_fecha || 'DD/MM/YYYY',
  moneda: t.moneda || 'COP',
  simbolo_moneda: t.simbolo_moneda || '$',
  separador_miles: t.separador_miles || '.',
  separador_decimales: t.separador_decimales || ',',
  primary_color: t.primary_color || DEFAULT_TENANT_COLORS.primary,
  secondary_color: t.secondary_color || DEFAULT_TENANT_COLORS.secondary,
  accent_color: t.accent_color || DEFAULT_TENANT_COLORS.accent,
  sidebar_color: t.sidebar_color || DEFAULT_TENANT_COLORS.sidebar,
  background_color: t.background_color || DEFAULT_TENANT_COLORS.background,
  company_slogan: t.company_slogan || '',
  pwa_name: t.pwa_name || '',
  pwa_short_name: t.pwa_short_name || '',
  pwa_description: t.pwa_description || '',
  pwa_theme_color: t.pwa_theme_color || DEFAULT_PWA_COLORS.theme,
  pwa_background_color: t.pwa_background_color || DEFAULT_PWA_COLORS.background,
  enabled_modules: t.enabled_modules || DEFAULT_ENABLED_MODULES,
});

/** Mapa de nombre de campo a archivo para subida multipart */
export interface ImageFileMap {
  logo?: File | null;
  logo_white?: File | null;
  logo_dark?: File | null;
  favicon?: File | null;
  login_background?: File | null;
  pwa_icon_192?: File | null;
  pwa_icon_512?: File | null;
  pwa_icon_maskable?: File | null;
}

/**
 * Construye un FormData con los campos de texto + archivos + flags de clear.
 * Excluye campos inmutables (code, subdomain) que el backend rechaza en PATCH.
 */
export const buildFormDataWithFiles = (
  data: TenantFormData,
  files: ImageFileMap,
  clearImages: Record<string, boolean>
): FormData => {
  const fd = new FormData();
  const EXCLUDED_FIELDS = ['code', 'subdomain'];

  Object.entries(data).forEach(([key, value]) => {
    if (EXCLUDED_FIELDS.includes(key)) return;
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, String(value));
      }
    }
  });

  Object.entries(files).forEach(([key, file]) => {
    if (file) fd.append(key, file);
  });

  Object.entries(clearImages).forEach(([key, value]) => {
    if (value) fd.append(`${key}_clear`, 'true');
  });

  return fd;
};
