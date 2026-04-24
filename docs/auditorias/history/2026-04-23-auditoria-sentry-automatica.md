# Auditoría Sentry Automática — 2026-04-23

**Tipo:** Tarea programada (scheduled task)
**Trigger:** Automático — sin usuario presente
**Scope:** Revisión de todos los issues activos en Sentry (proyecto `camilo-rubiano-bustos`)

---

## Issues encontrados (9 en total, 14 días)

| ID Sentry | Tipo | Nivel | Eventos | Estado |
|-----------|------|-------|---------|--------|
| PYTHON-DJANGO-2 | `KeyError` planeacion.check_kpi | Error | 2,500 | ⚠️ VPS fix (H-PROD-08) |
| PYTHON-DJANGO-34 | `InterfaceError` connection closed | Fatal | 2 | ℹ️ Transiente |
| PYTHON-DJANGO-3J | `FieldError` activo→is_deleted | Error | 1 | ✅ FIJADO |
| PYTHON-DJANGO-3K | `ConsecutivoConfig.DoesNotExist` PRODUCTO_MP | Error | 5 | ⚠️ VPS seed (H-PROD-07) |
| PYTHON-DJANGO-3M | `AppRegistryNotReady` startup | Error | 1 | ℹ️ Transiente django-tenants |
| APPSTRATEKAZ-V | `TypeError` module script import failed | Error | - | ℹ️ Cache chunks post-deploy |
| APPSTRATEKAZ-J | `Error` WebGL context | Error | - | ℹ️ Browser/hardware |
| APPSTRATEKAZ-P | `TypeError` fetch dynamically imported module | Error | - | ℹ️ Cache chunks post-deploy |
| STRATEKAZ-MARKETING-3 | `TypeError` D is not a function | Error | - | ℹ️ Marketing site |

---

## Fix aplicado (código)

### H-PROD-05 — `activo=True` en `TablaRetencionDocumental`

**Archivo:** `backend/apps/gestion_estrategica/gestion_documental/services/documento_service.py`

**Problema:** El filtro `activo=True` en `aplicar_retencion()` usaba un campo
que no existe en el modelo. La migración 0022 lo renombró y eventualmente
`TenantModel` (SoftDelete) lo eliminó completamente, usando `is_deleted` en su lugar.

**Fix:** Eliminación de la cláusula `activo=True` del filter. El
`SoftDeleteManager` por defecto ya excluye registros con `is_deleted=True`,
así que el filtro era obsoleto además de incorrecto.

```diff
- trd_obj = TablaRetencionDocumental.objects.filter(
-     tipo_documento=documento.tipo_documento,
-     proceso_id=documento.proceso_id,
-     activo=True,
- ).first()
+ trd_obj = TablaRetencionDocumental.objects.filter(
+     tipo_documento=documento.tipo_documento,
+     proceso_id=documento.proceso_id,
+ ).first()
```

**Nota:** Este hallazgo ya estaba documentado como H-PROD-05 con estado
"RESUELTO — pendiente de push". El fix estaba en la documentación pero no
había llegado al código. Esta sesión lo aplica definitivamente.

---

## Fixes pendientes (operacionales VPS)

### H-PROD-07 — Seed `ConsecutivoConfig` para `PRODUCTO_MP`

El commit `ab26877a feat(productos): codigo autogenerado por tipo` agregó
`PRODUCTO_MP`, `PRODUCTO_INS`, `PRODUCTO_PT`, `PRODUCTO_SV` a `CONSECUTIVOS_ADICIONALES`,
pero el seed en producción no creó los registros (5 eventos de error en 2 días).

**Acción requerida (VPS):**
```bash
cd /opt/stratekaz/backend && source venv/bin/activate
DJANGO_SETTINGS_MODULE=config.settings.production \
  python manage.py deploy_seeds_all_tenants --only consecutivos
```

### H-PROD-08 — PeriodicTask zombies de `planeacion.*`

`DatabaseScheduler` de Celery Beat tiene 4 `PeriodicTask` records activos para tareas
de `planeacion.*` (app no instalada en prod). Generan 2,500 eventos/mes en Sentry.
Beat schedule en `celery.py` está comentado pero la BD conserva los records.

**Acción requerida (VPS):**
```bash
python manage.py shell -c "
from django_celery_beat.models import PeriodicTask
n, _ = PeriodicTask.objects.filter(task__startswith='planeacion.').delete()
print(f'Eliminados {n} records')
"
```

---

## Issues no accionables

| Issue | Razón |
|-------|-------|
| `InterfaceError` connection closed (PYTHON-DJANGO-34) | Transiente — Celery Beat pierde conexión PG después de idle prolongado. Frecuencia: 2 eventos/mes. No requiere fix urgente. |
| `AppRegistryNotReady` (PYTHON-DJANGO-3M) | Transiente — error de startup de django-tenants al cargar `postgresql_backend`. Ocurre 1 vez por deploy. |
| `TypeError: Importing a module script failed` (APPSTRATEKAZ-V) | Browser cachea chunks JS de versión anterior post-deploy. Se resuelve sola en navegadores que refrescan. |
| `Error creating WebGL context` (APPSTRATEKAZ-J) | Error de hardware/driver del browser del usuario. No es un bug de la app. |
| `Failed to fetch dynamically imported module` (APPSTRATEKAZ-P) | Igual que APPSTRATEKAZ-V — chunks stale. |
| `D is not a function` (STRATEKAZ-MARKETING-3) | Marketing site — fuera del scope de esta auditoría (no-LIVE). |

---

## Documentación actualizada

- `docs/01-arquitectura/hallazgos-pendientes.md`:
  - H-PROD-05: Línea actualizada (65→110), estado definitivo ✅ pusheado
  - H-PROD-06: Estado actualizado ✅ pusheado
  - H-PROD-07: Nuevo hallazgo ABIERTO — seed VPS requerido
  - H-PROD-08: Nuevo hallazgo ABIERTO — PeriodicTask zombie cleanup VPS
