/**
 * Types para Mi Portal (ESS - Employee Self-Service)
 * Sistema de Gestión StrateKaz
 *
 * Solo types LIVE. Cuando se activen módulos L60+,
 * sus types se agregan aquí.
 */

// ============ PERFIL ============

export interface ColaboradorESS {
  id: number;
  nombre_completo: string;
  numero_identificacion: string;
  tipo_identificacion: string;
  cargo_nombre: string | null;
  area_nombre: string | null;
  fecha_ingreso: string;
  estado: string;
  /** URL absoluta de la foto del colaborador (sincronizada con User.photo via signal) */
  foto_url: string | null;
  /** Email del sistema (User.email — no editable por ESS) */
  email: string | null;
  /** Email personal editable — Colaborador.email_personal */
  email_personal: string;
  /** Teléfono móvil — Colaborador.telefono_movil */
  celular: string;
  /** Teléfono fijo — InfoPersonal.telefono_fijo */
  telefono: string;
  /** Dirección de residencia — InfoPersonal.direccion */
  direccion: string;
  /** Ciudad de residencia — InfoPersonal.ciudad */
  ciudad: string;
  contacto_emergencia_nombre: string;
  contacto_emergencia_telefono: string;
  contacto_emergencia_parentesco: string;
}

export interface InfoPersonalUpdateData {
  celular?: string;
  email_personal?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_parentesco?: string;
}

// ============ PORTAL TABS (solo LIVE) ============
// Tab "perfil" eliminado 2026-04-23 — ahora vive en /perfil (página centralizada)

export type MiPortalTab = 'firma' | 'lecturas' | 'encuestas' | 'documentos';
