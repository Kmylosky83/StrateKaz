---
name: middleware-portal-exclusions
description: ModuleAccessMiddleware excluye portales — rutas que NO requieren módulo habilitado
type: feedback
---

ModuleAccessMiddleware DEBE excluir rutas de portales personales. Los portales son transversales (C0/Portales), NO dependen de módulos C2.

**Why:** talent_hub está deshabilitado en SystemModules, pero Mi Portal vive bajo `/api/talent-hub/mi-portal/`. El middleware bloqueaba 403 todas las llamadas al portal del usuario.

**How to apply:**

1. En `ModuleAccessMiddleware.EXCLUDED_PREFIXES` (o equivalente), agregar:
   - `/api/talent-hub/mi-portal/` — Mi Portal (self-service)
   - `/api/mi-equipo/` — ya excluido (Gestión de Personas)
   - Cualquier futuro portal (proveedores, clientes)

2. **Regla general:** Si un endpoint es accedido por el usuario para SUS propios datos desde un portal, NO debe pasar por ModuleAccessMiddleware.

3. **`/api/tenant/tenants/me/`** → Correctamente requiere `IsAdminTenant`. Solo admins configuran datos de empresa. Los 403 en consola para usuarios normales son esperados; el frontend debe manejarlos gracefully.
