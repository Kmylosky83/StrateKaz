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
 * Un usuario es portal-only cuando:
 * - Tiene proveedor vinculado (user.proveedor !== null)
 * - Y su cargo es el de sistema PROVEEDOR_PORTAL (o no tiene cargo)
 *
 * Profesionales colocados con cargo real (Coord SST, Admin TH, etc.)
 * NO son portal-only — tienen acceso completo al sistema via DashboardLayout.
 */
export function isPortalOnlyUser(user: User | null | undefined): boolean {
  if (!user?.proveedor) return false;
  if (!user.cargo) return true;
  return user.cargo.code === CARGO_PORTAL_CODE;
}
