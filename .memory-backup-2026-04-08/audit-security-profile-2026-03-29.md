---
name: Auditoría Seguridad + Centro de Control 2026-03-29
description: Auditoría profunda de /perfil/seguridad (sesiones, contraseña, 2FA, avatar), Centro de Control (logging), y preferencias
type: project
---

## Centro de Control — audit_system (3 brechas corregidas)

**Brecha 1 — LogAcceso (signals):** Django auth signals (`user_logged_in`, `user_logged_out`, `user_login_failed`) no estaban conectados. Creado `logs_sistema/signals.py` con `_create_log_acceso()`. También se registra desde `auth_views.py` directamente.

**Brecha 2 — LogCambio (mixin):** No existía mixin para interceptar CRUD. Creado `logs_sistema/mixins.py` con `AuditLogMixin` que intercepta `perform_create/update/destroy` y registra old→new diff.

**Brecha 3 — AuditSystemService:** El servicio público `services.py` estaba vacío. Reescrito con API pública para logging programático.

**Dashboard:** `AuditSystemPage.tsx` reescrito — eliminado todo mock data, conectado a hooks reales (`useLogsAcceso`, `useLogsCambio`, `useAlertasPendientes`, etc.)

**Sync FE↔BE:** 10 interfaces TypeScript corregidas para alinear con campos reales de serializers Django.

## /perfil/seguridad — 7 hallazgos corregidos

1. **Sesiones sin current marker** — FE no enviaba refresh token → `is_current` siempre false. Fix: `X-Refresh-Token` header en `axios-config.ts`
2. **Cambio contraseña 400** — FE enviaba `old_password` sin `confirm_password`. Fix: BE acepta `current_password`, FE envía DTO completo
3. **List serializer incompleto** — `UserSessionListSerializer` omitía 6 campos que FE renderiza. Fix: hereda de `UserSessionSerializer`
4. **Response keys desalineadas** — `message→detail`, `count→closed_count`
5. **`time_remaining` tipo** — BE retornaba `int` (segundos), FE esperaba `string`. Fix: formato legible ("3h", "2 días")
6. **TS types** — `SessionsListResponse` tenía `current_session_id` fantasma, `SessionOperationResponse` keys incorrectas
7. **TS error hooks** — `error.response` en `unknown` sin narrowing. Fix: `AxiosError` instanceof

## Verificaciones OK (sin cambios necesarios)

- **Avatar upload** — `photo` via FormData a `/core/users/upload_photo/`, validación formato/tamaño. Correcto
- **2FA completo** — Setup (QR+secret), Enable (TOTP verify), Disable (password), Verify (login), Regenerate backup codes. Todos los tipos FE↔BE alineados
- **Forgot/Setup password** — Flujos separados, no afectados por cambio de `old_password→current_password`

## Preferencias — decorativas (i18n futuro)

- GET/PUT/PATCH funcionan correctamente con auto-create
- Idioma, zona horaria, formato fecha se guardan en DB pero **ningún componente los consume aún**
- `UserPreferencesViewSet` en `viewsets.py` era código muerto (no registrado en URLs) → eliminado
- La implementación activa es `UserPreferencesView` (APIView) en `user_preferences_views.py`

## Sentry — 4 errores corregidos (~1551 eventos eliminados)

1. **KeyError Celery (1541 eventos)** — `analytics.tasks` en beat schedule pero apps L50 deshabilitadas → comentados
2. **TabSection.MultipleObjectsReturned (6)** — `.get(code=)` con code no-unique → `.filter().first()`
3. **React child object (3)** — `<feature.icon />` sin extraer a variable → `const Icon = feature.icon`
4. **ValueError JWT (1)** — función muerta `get_tokens_for_tenant_user()` con TenantUser → eliminada

## Commits

- `8d62e92d` — feat(audit-system): activar logging completo + sync FE↔BE + fix 4 errores Sentry
- `2e62aed7` — fix(seguridad): corregir sesiones, cambio contraseña y sync FE↔BE en /perfil/seguridad
