---
name: audit-lifecycle-2026-03-26
description: Auditoría E2E ciclo de vida colaborador — hallazgos y fixes desplegados 2026-03-26
type: project
---

Auditoría profunda del ciclo completo: crear colaborador → email → setup password → login → onboarding → portal → firma → permisos.

**Why:** Validar que el flujo end-to-end funciona en producción para usuarios no-superadmin.

**How to apply:** Referencia para futuras auditorías de lifecycle y para evitar regresiones.

## Hallazgos y Fixes (5 commits desplegados)

| # | Hallazgo | Severidad | Fix |
|---|----------|-----------|-----|
| 1 | Branding fetch (`getActive`) borraba tokens en localStorage | CRITICA | Usar endpoint público `/public/branding-by-id/` |
| 2 | ModuleAccessMiddleware bloqueaba portales (`/api/talent-hub/mi-portal/`) | ALTA | Excluir prefijos de portal del middleware |
| 3 | Self-service actions (firma, foto, perfil) bloqueadas por RBAC | ALTA | `get_permissions()` → `IsAuthenticated` para self-service |
| 4 | `tenants/me` → 403 para no-admin | MEDIA | Comportamiento correcto — solo admin configura empresa |
| 5 | OrganizacionPage "Sin acceso" — sección `organizacion` inexistente en RBAC | MEDIA | Cambiar a `withModuleGuard('fundacion')` |
| 6 | MiPerfilCard columnas comprimidas | BAJA | Layout: secciones a ancho completo debajo del header |
| 7 | Notificaciones 403 para no-admin | MEDIA | Pendiente — verificar permisos ViewSet |
| 8 | `segundo_nombre` autocompletado por browser | BAJA | `autoComplete` hints en inputs + corrección manual BD |

## Migraciones aplicadas (VPS + Docker)
- `core/0010` — Rename RBAC indexes
- `firma_digital/0006` — Alter timestamp fields
- `logs_sistema/0002` — AuditImpersonation table (CASCADE dependency)

## Cleanup ejecutado
- Script `cleanup_demo_users.py`: eliminó 4 Users, 4 Colaboradores, 4 TenantUsers de tenant_stratekaz
- Solo quedó superadmin (admin@stratekaz.com)

## Usuarios actuales en producción (tenant_stratekaz)
- User #1: admin@stratekaz.com (superuser, sin cargo)
- User #7: camilorubianobustos@gmail.com (Gerente General, is_jefatura)
- Colaborador: Kmylosky Diferent (Asistente Administrativo, hijo de Gerente General)
