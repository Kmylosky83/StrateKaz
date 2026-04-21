# Sesión 2026-04-10 — TenantLifecycleService

## Resumen

16 commits. Introducción de `TenantLifecycleService` como puerta única al
lifecycle de tenants (crear, activar, eliminar schema).

## Hallazgos cerrados

- **H10** — `fast_test` huérfano. Purgado vía
  `TenantLifecycleService.delete_tenant_with_schema()` en Bloque 4.
  Pre: `row_orphan`. Post: `is_consistent=True`. Zero errores post-restart.
- **H16** — `bootstrap_production.py` línea 182 usaba f-string para schema
  name en DDL. Refactor a `psycopg2.sql.Identifier` (Bloque 5).
- **H17** — Celery/celerybeat unhealthy. Causa raíz: Dockerfile
  `HEALTHCHECK curl` sobre servicios sin HTTP. Fix en docker-compose.yml:
  celery usa `inspect ping --destination`, beat usa `disable: true`.
- **H22** — (cerrado en sesión, detalle en commits del sub-bloque).

## Hallazgos abiertos (documentados, no resueltos)

- **H13, H14** — Ver HALLAZGOS-PENDIENTES-2026-04.md.
- **H18** — `bootstrap_production.py` Fase 4b: cleanup de migraciones
  fantasma en public. Parche histórico legacy. No pertenece al
  TenantLifecycleService. Evaluar en sesión futura si sigue siendo
  necesario. Severidad: BAJA. Riesgo de eliminación: MEDIA (sin evidencia
  del origen del bug original).
- **H19** — `delete_tenant` command tiene lógica de dry-run redundante.
  El flag `--dry-run` y la ausencia de `--confirm` hacen lo mismo.
  Simplificar a un solo mecanismo. Severidad: BAJA. Riesgo: CERO.
- **H21** — Endpoint `hard-delete` de `TenantViewSet` no tiene tests de
  integración. Agregar cobertura en sesión de refactor de testing de API.
  Severidad: BAJA. Riesgo: el endpoint usa el servicio testeado; la
  única lógica adicional es validación de permisos y `confirm_name`.

## Decisión de diseño

`TenantLifecycleService` es el único punto de entrada para:
- Crear tenant + schema
- Eliminar tenant con schema (soft o hard)
- Validar consistencia schema ↔ registro

Todo acceso directo a `cursor.execute('CREATE SCHEMA ...')` queda prohibido
fuera del servicio.

## Referencias

- Hallazgos centralizados: `docs/architecture/HALLAZGOS-PENDIENTES-2026-04.md`
