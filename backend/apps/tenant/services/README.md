# TenantLifecycleService

## Propósito

Servicio único centralizado para todo el ciclo de vida de tenants en StrateKaz. Garantiza el invariante:

> Tenant row en public.tenant_tenant **SIEMPRE** existe sincronizada con schema físico en PostgreSQL.

## Las 6 mejores prácticas implementadas

### 1. Servicio único centralizado

Toda operación que toca schemas (create, archive, restore, delete, validate) pasa por este servicio. Ningún código fuera de `tenant_lifecycle_service.py` hace raw SQL de `CREATE SCHEMA` o `DROP SCHEMA`, excepto test infra explícitamente marcada con `# noqa: TENANT-LIFECYCLE`.

### 2. Operaciones transaccionales con validación pre/post

Cada método público ejecuta:
- Pre-validación del estado antes de operar
- Operación dentro de `transaction.atomic()`
- Post-validación del invariante después de operar
- Rollback automático + cleanup explícito si la post-validación falla

### 3. Lock pesimista via pg_advisory_xact_lock

Cada operación de mutación toma un lock de PostgreSQL basado en `hashtext(schema_name)` al inicio del bloque `atomic()`. Esto serializa operaciones concurrentes sobre el mismo schema_name y previene race conditions en onboardings simultáneos.

### 4. Detección periódica como última línea de defensa

La tarea `check_tenant_schema_integrity` corre cada 30 minutos vía Celery Beat. Escanea todos los tenants y schemas, detecta desyncs, loguea, alerta a Sentry, pero **NO auto-repara** (la decisión de reparación es humana porque puede involucrar pérdida de datos).

### 5. Auditoría explícita

Cada operación del servicio emite un log estructurado con `action/schema_name/user_id/result`. Integrable con sistemas de audit externos vía el logger `tenant.lifecycle`.

### 6. Idempotencia en operaciones async

La Fase B (CREATE SCHEMA + migrate + seeds + ready) es idempotente frente a redelivery de Celery: si el worker muere después de crear el schema, el retry detecta el schema existente y continúa sin romper. Esto es crítico para tasks con `acks_late=True` + `reject_on_worker_lost=True` que reintentan tras crashes del worker.

## API pública del servicio

### Métodos de mutación

- **`create_tenant(...)`** — Creación monolítica (Fase A + Fase B). Usado por management commands (`bootstrap_production`) y tests. Retorna `(tenant, non_critical_warnings)`.

- **`provision_schema_for_pending_tenant(tenant_id, progress_callback=None)`** — Provisioning async para tenants que ya tienen row en public con `schema_status` in `('pending', 'creating')`. Usado por `create_tenant_schema_task` de Celery. Acepta un callback opcional para publicar progreso (Redis, logs, lo que el caller necesite). Retorna `(tenant, non_critical_warnings)`.

- **`archive_tenant(schema_name, ...)`** — Marca `is_active=False` sin tocar el schema físico. Reversible vía `restore_tenant`.

- **`restore_tenant(schema_name)`** — Reactiva un tenant archivado.

- **`delete_tenant_with_schema(schema_name, confirmation_token, ...)`** — Eliminación irreversible. Requiere `confirmation_token` exacto (formato `CONFIRMATION_TOKEN_TEMPLATE`). Acepta estados inconsistentes como input (sirve para limpiar `row_orphan` y `schema_orphan`).

### Métodos de lectura

- **`validate_invariant(schema_name) -> InvariantStatus`** — Estado del invariante para un schema específico. Solo lectura.

- **`list_inconsistencies() -> InvariantReport`** — Reporte de todos los desyncs detectados en el sistema. Solo lectura.

- **`count_schema_tables(schema_name) -> int`** — Conteo de tablas BASE TABLE en un schema. Usado por `repair_tenant_status` para umbrales de "schema completo vs incompleto".

## Arquitectura en 2 fases para create_tenant

`create_tenant` usa una división interna en 2 fases por una razón técnica descubierta durante el desarrollo:

**Fase A (transaccional):** Lock advisory + pre-validación + crear row Tenant + crear Domain. Dentro de `transaction.atomic()`. Si algo falla, Django revierte limpiamente.

**Fase B (secuencial con cleanup explícito):** CREATE SCHEMA + `migrate_schemas` + seeds críticos + seed no-crítico + post-validación + `schema_status='ready'`. NO dentro de un `atomic()` unificado porque `migrate_schemas` abre sus propias conexiones y transacciones, y causa `InterfaceError: connection already closed` si se envuelve en un `atomic()` largo. La atomicidad se garantiza por cleanup explícito: si algo falla en Fase B, el `except` dropea el schema parcialmente creado (solo si no era pre-existente, para preservar recovery state en caso de redelivery).

## Modos de falla posibles en Fase B y su cleanup

| Fallo | Estado al momento | Cleanup | Invariante post-cleanup |
|-------|-------------------|---------|-------------------------|
| CREATE SCHEMA falla | Row creada, schema no | Mark failed | row_orphan (detectable) |
| migrate_schemas falla | Row + schema parcial | DROP SCHEMA | row con status=failed |
| Seed crítico falla | Row + schema + tablas | DROP SCHEMA | row con status=failed |
| Seed no-crítico falla | Normal | Continuar con warnings | Consistente |
| Post-validación falla | Todo presente pero no cuadra | DROP SCHEMA | row con status=failed |
| Proceso muere (OOM/SIGKILL) | Cualquiera | Ninguno inline | Detectado por check_tenant_schema_integrity |
| Worker Celery crash con acks_late | Schema pre-existente en retry | Skippeado por idempotencia (H22) | Consistente tras retry |

## Ejemplos de uso

### Crear un tenant desde un management command

```python
from apps.tenant.services import TenantLifecycleService

tenant, warnings = TenantLifecycleService.create_tenant(
    schema_name='tenant_acme',
    name='ACME Corporation',
    domain_url='acme.stratekaz.com',
    plan_code='empresarial',
    is_trial=False,
)
for w in warnings:
    print(f"Warning no-crítico: {w}")
```

### Provisioning async desde una Celery task

```python
def _make_callback(task_id, tenant_id, schema_name):
    def callback(progress, phase, message):
        publish_to_redis(task_id, {
            'progress': progress, 'phase': phase, 'message': message,
        })
    return callback

tenant, warnings = TenantLifecycleService.provision_schema_for_pending_tenant(
    tenant_id=tenant_id,
    progress_callback=_make_callback(task_id, tenant_id, schema_name),
)
```

### Eliminar un tenant

```python
TenantLifecycleService.delete_tenant_with_schema(
    schema_name='tenant_acme',
    confirmation_token='DELETE-tenant_acme-CONFIRMED',
    deleted_by_user_id=request.user.id,
)
```

### Validar consistencia

```python
status = TenantLifecycleService.validate_invariant('tenant_acme')
if not status.is_consistent:
    print(f"Inconsistencia: {status.inconsistency_type}")
```

## Excepciones

Jerarquía desde `TenantLifecycleError`:

- `TenantAlreadyExistsError` — Row o schema ya existen
- `TenantNotFoundError` — Ni row ni schema
- `SchemaCreationFailedError` — CREATE SCHEMA falló
- `SchemaDropFailedError` — DROP SCHEMA falló
- `TenantInvariantViolationError` — Post-validación detectó desync
- `TenantLifecycleConcurrencyError` — Lock bloqueado
- `InvalidConfirmationTokenError` — Token incorrecto en delete

## Por qué test infra está excluida

`conftest.py` y `apps/core/tests/base.py` crean schemas directamente sin pasar por el servicio. Marcados con `# noqa: TENANT-LIFECYCLE`.

Razones:
1. Tests usan `FastTenantTestCase` para velocidad y no pueden tolerar el overhead del servicio (migraciones + seeds).
2. Algunos tests validan casos donde el estado es intencionalmente inconsistente.
3. Tests corren en schemas efímeros donde las garantías de producción no aplican.

## Cómo investigar una alerta de check_tenant_schema_integrity

Cuando Sentry reporta "Tenant invariant violation":

1. Identificar `schema_name` y `inconsistency_type` del tag.
2. Correr manualmente:
   ```python
   from apps.tenant.services import TenantLifecycleService
   TenantLifecycleService.validate_invariant('<schema_name>')
   ```
3. Según el tipo:
   - **row_orphan:** `python manage.py purge_tenant --schema <name> --confirm`
   - **schema_orphan:** `python manage.py cleanup_orphan_schemas --schema <name> --confirm`
   - **empty_schema:** `python manage.py repair_tenant_status --confirm`

Nunca reparar manualmente con raw SQL. Siempre usar los management commands que delegan al servicio.
