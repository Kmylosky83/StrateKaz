/**
 * Utilidades para deteccion de tipo de usuario proveedor.
 *
 * Tres perfiles de usuario vinculado a proveedor:
 * 1. Portal Puro: proveedor + cargo PROVEEDOR_PORTAL (o sin cargo) → PortalLayout
 * 2. Profesional Colocado: proveedor + cargo real (is_externo=true) → DashboardLayout
 * 3. Empleado Interno: sin proveedor → DashboardLayout
 */
import type { User } from '@/types/auth.types';

/** Codigo del cargo de sistema auto-creado para acceso portal de proveedores */
export const CARGO_PORTAL_CODE = 'PROVEEDOR_PORTAL';

/**
 * Determina si un usuario es "portal-only" (solo acceso al portal de proveedor).
 *
 * Detección primaria: cargo.code === 'PROVEEDOR_PORTAL'
 * Detección secundaria: proveedor vinculado sin cargo asignado
 *
 * Profesionales colocados con cargo real (Coord SST, Admin TH, etc.)
 * NO son portal-only — tienen acceso completo al sistema via DashboardLayout.
 */
export function isPortalOnlyUser(user: User | null | undefined): boolean {
  // Primaria: cargo PROVEEDOR_PORTAL es la señal autoritativa
  if (user?.cargo?.code === CARGO_PORTAL_CODE) return true;
  // Secundaria: proveedor sin cargo (edge case de setup incompleto)
  if (user?.proveedor && !user.cargo) return true;
  return false;
}
