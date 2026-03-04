/**
 * Utilidades para detección de tipo de usuario portal.
 *
 * Perfiles portal-only (PortalLayout, sin sidebar):
 * 1. Proveedor Portal: cargo PROVEEDOR_PORTAL → /proveedor-portal
 * 2. Cliente Portal: cargo CLIENTE_PORTAL → /cliente-portal
 *
 * Perfiles con acceso completo (DashboardLayout):
 * 3. Profesional Colocado: proveedor + cargo real (is_externo=true)
 * 4. Empleado Interno: sin proveedor ni cliente
 */
import type { User } from '@/types/auth.types';

/** Código del cargo de sistema auto-creado para acceso portal de proveedores */
export const CARGO_PORTAL_CODE = 'PROVEEDOR_PORTAL';

/** Código del cargo de sistema auto-creado para acceso portal de clientes */
export const CARGO_CLIENTE_PORTAL_CODE = 'CLIENTE_PORTAL';

/**
 * Determina si un usuario es "portal-only" (solo acceso a un portal aislado).
 *
 * Incluye tanto proveedores como clientes portal-only.
 * Profesionales colocados con cargo real NO son portal-only.
 */
export function isPortalOnlyUser(user: User | null | undefined): boolean {
  // Proveedor portal
  if (user?.cargo?.code === CARGO_PORTAL_CODE) return true;
  // Cliente portal
  if (user?.cargo?.code === CARGO_CLIENTE_PORTAL_CODE) return true;
  // Edge cases: entidad vinculada sin cargo (setup incompleto)
  if (user?.proveedor && !user.cargo) return true;
  if (user?.cliente && !user.cargo) return true;
  return false;
}

/**
 * Determina si un usuario es específicamente un usuario del portal de clientes.
 *
 * Detección primaria: cargo.code === 'CLIENTE_PORTAL'
 * Detección secundaria: cliente vinculado sin cargo asignado
 */
export function isClientePortalUser(user: User | null | undefined): boolean {
  if (user?.cargo?.code === CARGO_CLIENTE_PORTAL_CODE) return true;
  if (user?.cliente && !user.cargo) return true;
  return false;
}
