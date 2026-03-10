# Centro de Control (audit_system) — Modulo C0

**Capa:** C0 (Plataforma) | **Grupo visual:** NIVEL_C3 | **Color:** `#8B5CF6`

> **IMPORTANTE:** audit_system (C0) = logs/alertas del sistema.
> NO confundir con Auditoria Interna (C2) = auditorias ISO.
> En UI se muestra como "Centro de Control" (NO "Auditoria").

## Sub-apps (4)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| logs_sistema | `audit_system_logs_sistema` | Registro de actividad, auditoria de cambios |
| config_alertas | `audit_system_config_alertas` | Reglas de alerta, umbrales, destinatarios |
| centro_notificaciones | `audit_system_centro_notificaciones` | Notificaciones in-app, email, campana |
| tareas_recordatorios | `audit_system_tareas_recordatorios` | Tareas asignadas, recordatorios, vencimientos |

## Modelos: 16

## Backend
- **Path:** `backend/apps/audit_system/`
- **API prefix:** `/api/audit-system/`

## Frontend
- **Feature:** `frontend/src/features/audit-system/`
- **Ruta:** `/centro-control`

## Dependencias cross-module
- Lee de: TODOS los modulos (via signals y middleware AuditlogMiddleware)
- Es infraestructura C0 — no depende de modulos C2

## Estado
Backend funcional. Frontend con centro de notificaciones basico.

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
