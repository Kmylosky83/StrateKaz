# Auditoría Profunda Perímetro LIVE — 2026-04-09

> Auditoría solo-lectura. Ningún archivo fue modificado.
> Ejecutada desde Docker local (development mode).

## Resumen ejecutivo

- **1 tenant huérfano** (`fast_test`) con row en DB pero sin schema físico, causando errores de Celery cada 5 minutos
- **15 tareas zombie** en DatabaseScheduler: comentadas en código pero vivas en la tabla `django_celery_beat_periodictask`, ejecutándose activamente
- **14 task_routes** apuntando a módulos NO-LIVE activas en código (no comentadas)
- **39 entries** en DB scheduler vs **23 activas** en código = **drift confirmado**
- **talent_hub/urls.py** se carga por guard de `mi_equipo` → endpoints Mi Portal expuestos con 2 views que dependen de módulos NO-LIVE
- **0 signals cross-module peligrosos** en apps LIVE — todas las importaciones son internas
- **3 management commands** en apps NO-LIVE (no autodescubiertos, riesgo bajo)

---

## Sección 1 — Integridad multi-tenant

### 1.1 Tenant rows en public

```
fast_test    | domains=['tenant.fast-test.com'] | is_trial=True, is_active=True
tenant_demo  | domains=['demo.localhost', 'localhost'] | is_trial=False, is_active=True
TOTAL TENANTS: 2
```

### 1.2 Schemas físicos

```
 schema_name
-------------
 tenant_demo
(1 row)
```

**Solo 1 schema físico existe: `tenant_demo`.**

### 1.3 Conteo de tablas por schema

```
   schema    | tables
-------------+--------
 tenant_demo |    248
(1 row)
```

### 1.4 Desyncs detectados

| Categoría | Elemento | Detalle |
|-----------|----------|---------|
| **Row huérfana (Tenant sin schema)** | `fast_test` | Row activa (`is_active=True`, `is_trial=True`), dominio `tenant.fast-test.com` asignado, pero **no existe schema `fast_test` en PostgreSQL**. Celery itera este tenant cada 5 minutos y falla con `relation "X" does not exist` para tareas_tarea, workflow_exec_tarea_activa, alertas_configuracion_alerta. |
| Schema huérfano (schema sin Tenant) | — | Ninguno detectado |
| Schema vacío (0 tablas) | — | Ninguno detectado |

**Nota sobre MEMORY.md:** MEMORY.md (línea 10) lista schemas `tenant_stratekaz` y `tenant_grasas_y_huesos_del_` como existentes. Estos **no existen en la DB local Docker** — probablemente son schemas de producción (VPS). No es un desync per se pero es una discrepancia entre MEMORY.md y el entorno local.

**Nota sobre `fast_test`:** MEMORY.md (decisión #4, línea 144) dice "Schema zombi `fast_test` dropeado de la DB". El **schema** fue efectivamente dropeado, pero la **row de Tenant** en `public.tenants_tenant` NO fue eliminada. Esto causa que Celery siga iterando sobre ese tenant y fallando.

### 1.5 Puntos del código que tocan schemas directamente

| Archivo | Línea | Operación |
|---------|-------|-----------|
| `conftest.py` | 56 | `tenant.create_schema(check_if_exists=True)` — test infra |
| `apps/tenant/views.py` | 350 | `DROP SCHEMA IF EXISTS {} CASCADE` — eliminación de tenant |
| `apps/tenant/tasks.py` | 178 | `CREATE SCHEMA IF NOT EXISTS {}` — creación async |
| `apps/tenant/tasks.py` | 478 | `DROP SCHEMA IF EXISTS {} CASCADE` — cleanup de tenant fallido |
| `apps/tenant/models.py` | 707-710 | `auto_create_schema = False`, `auto_drop_schema = False` |
| `apps/tenant/management/commands/delete_tenant.py` | 80,177 | `DROP SCHEMA "{}" CASCADE` |
| `apps/tenant/management/commands/cleanup_orphan_schemas.py` | 135,165 | `DROP SCHEMA IF EXISTS {} CASCADE` |
| `apps/tenant/management/commands/repair_tenant_status.py` | 110-125 | `schema_exists` check |
| `apps/tenant/management/commands/bootstrap_production.py` | 182 | `CREATE SCHEMA IF NOT EXISTS` |
| `apps/core/tests/base.py` | 51-66 | `create_schema()` — BaseTenantTestCase |

**Observación:** Todas las operaciones de schema están centralizadas en `apps/tenant/` y `conftest.py`. No hay manipulación de schemas dispersa en otros módulos.

---

## Sección 2 — Celery Beat ↔ LIVE

### 2.1 Dump completo del código (celery.py)

23 entries activas (no comentadas) en `app.conf.beat_schedule`:

| # | entry_name | task | queue |
|---|-----------|------|-------|
| 1 | cleanup-temp-files-daily | apps.core.tasks.cleanup_temp_files | maintenance |
| 2 | send-weekly-reports | apps.core.tasks.send_weekly_reports | reports |
| 3 | database-backup | apps.core.tasks.backup_database | maintenance |
| 4 | system-health-check | apps.core.tasks.system_health_check | monitoring |
| 5 | tenant-check-expirations-daily | apps.tenant.tasks.check_tenant_expirations | tenant_ops |
| 6 | tenant-cleanup-stale-creating | apps.tenant.tasks.cleanup_stale_creating_tenants | tenant_ops |
| 7 | workflow-check-overdue-tasks | apps.workflow_engine.ejecucion.tasks.verificar_tareas_vencidas | workflow |
| 8 | workflow-update-metrics-daily | apps.workflow_engine.ejecucion.tasks.actualizar_metricas_flujo | reports |
| 9 | documental-crear-borradores-revision | documental.crear_borradores_revision_automatica | compliance |
| 10 | documental-check-revision-programada | apps.gestion_estrategica.gestion_documental.tasks.verificar_documentos_revision_programada | compliance |
| 11 | documental-notify-revision-por-vencer | documental.notificar_documentos_por_vencer | notifications |
| 12 | documental-procesar-ocr-pendientes | documental.procesar_ocr_pendientes | files |
| 13 | documental-calcular-scores-batch | documental.calcular_scores_batch | compliance |
| 14 | documental-recordar-aceptaciones-por-vencer | documental.recordar_aceptaciones_por_vencer | notifications |
| 15 | documental-procesar-retencion | documental.procesar_retencion_documentos | compliance |
| 16 | core-check-pending-activations | apps.core.tasks.check_pending_activations | notifications |
| 17 | core-check-incomplete-profiles | apps.core.tasks.check_incomplete_profiles | notifications |
| 18 | audit-ejecutar-verificacion-alertas | apps.audit_system.config_alertas.tasks.ejecutar_verificacion_alertas | compliance |
| 19 | audit-escalar-alertas-no-atendidas | apps.audit_system.config_alertas.tasks.escalar_alertas_no_atendidas | compliance |
| 20 | audit-limpiar-alertas-antiguas | apps.audit_system.config_alertas.tasks.limpiar_alertas_antiguas | maintenance |
| 21 | audit-verificar-tareas-vencidas | apps.audit_system.tareas_recordatorios.tasks.verificar_tareas_vencidas | compliance |
| 22 | audit-ejecutar-recordatorios | apps.audit_system.tareas_recordatorios.tasks.ejecutar_recordatorios | notifications |
| 23 | audit-resumen-tareas-diario | apps.audit_system.tareas_recordatorios.tasks.enviar_resumen_tareas_diario | notifications |

### 2.2 TENANT_APPS canónico (development mode)

29 entries totales:

| # | App | Tipo |
|---|-----|------|
| 1 | django.contrib.admin | Framework |
| 2 | django.contrib.auth | Framework |
| 3 | django.contrib.contenttypes | Framework |
| 4 | rest_framework_simplejwt.token_blacklist | Third-party |
| 5 | auditlog | Third-party |
| 6 | csp | Third-party |
| 7 | apps.core | LIVE L0 |
| 8 | apps.ia | LIVE L0 |
| 9 | apps.gestion_estrategica.configuracion | LIVE L10 |
| 10 | apps.gestion_estrategica.organizacion | LIVE L10 |
| 11 | apps.gestion_estrategica.identidad | LIVE L10 |
| 12 | apps.gestion_estrategica.contexto | LIVE L10 |
| 13 | apps.gestion_estrategica.encuestas | LIVE L10 |
| 14 | apps.workflow_engine.disenador_flujos | LIVE L12 |
| 15 | apps.workflow_engine.ejecucion | LIVE L12 |
| 16 | apps.workflow_engine.monitoreo | LIVE L12 |
| 17 | apps.workflow_engine.firma_digital | LIVE L12 |
| 18 | apps.audit_system.logs_sistema | LIVE L12 |
| 19 | apps.audit_system.config_alertas | LIVE L12 |
| 20 | apps.audit_system.centro_notificaciones | LIVE L12 |
| 21 | apps.audit_system.tareas_recordatorios | LIVE L12 |
| 22 | apps.gestion_estrategica.gestion_documental | LIVE L15 |
| 23 | apps.mi_equipo | LIVE L20 |
| 24 | apps.mi_equipo.estructura_cargos | LIVE L20 |
| 25 | apps.mi_equipo.seleccion_contratacion | LIVE L20 |
| 26 | apps.mi_equipo.colaboradores | LIVE L20 |
| 27 | apps.mi_equipo.onboarding_induccion | LIVE L20 |
| 28 | apps.analytics.config_indicadores | Excepción L12 |
| 29 | apps.analytics.exportacion_integracion | Excepción L12 |

23 apps propias de StrateKaz + 6 framework/third-party = 29 total.

### 2.3 Tabla de cruce completa (código vs LIVE)

| # | entry_name | task_dotted_path | app_inferida | ¿LIVE? |
|---|-----------|-----------------|--------------|--------|
| 1 | cleanup-temp-files-daily | apps.core.tasks.cleanup_temp_files | apps.core | **SÍ** |
| 2 | send-weekly-reports | apps.core.tasks.send_weekly_reports | apps.core | **SÍ** |
| 3 | database-backup | apps.core.tasks.backup_database | apps.core | **SÍ** |
| 4 | system-health-check | apps.core.tasks.system_health_check | apps.core | **SÍ** |
| 5 | tenant-check-expirations-daily | apps.tenant.tasks.check_tenant_expirations | apps.tenant | **SÍ** (SHARED) |
| 6 | tenant-cleanup-stale-creating | apps.tenant.tasks.cleanup_stale_creating_tenants | apps.tenant | **SÍ** (SHARED) |
| 7 | workflow-check-overdue-tasks | apps.workflow_engine.ejecucion.tasks.verificar_tareas_vencidas | apps.workflow_engine.ejecucion | **SÍ** |
| 8 | workflow-update-metrics-daily | apps.workflow_engine.ejecucion.tasks.actualizar_metricas_flujo | apps.workflow_engine.ejecucion | **SÍ** |
| 9 | documental-crear-borradores-revision | documental.crear_borradores_revision_automatica | gestion_documental | **SÍ** (path corto) |
| 10 | documental-check-revision-programada | apps.gestion_estrategica.gestion_documental.tasks.verificar_documentos_revision_programada | apps.gestion_estrategica.gestion_documental | **SÍ** |
| 11 | documental-notify-revision-por-vencer | documental.notificar_documentos_por_vencer | gestion_documental | **SÍ** (path corto) |
| 12 | documental-procesar-ocr-pendientes | documental.procesar_ocr_pendientes | gestion_documental | **SÍ** (path corto) |
| 13 | documental-calcular-scores-batch | documental.calcular_scores_batch | gestion_documental | **SÍ** (path corto) |
| 14 | documental-recordar-aceptaciones-por-vencer | documental.recordar_aceptaciones_por_vencer | gestion_documental | **SÍ** (path corto) |
| 15 | documental-procesar-retencion | documental.procesar_retencion_documentos | gestion_documental | **SÍ** (path corto) |
| 16 | core-check-pending-activations | apps.core.tasks.check_pending_activations | apps.core | **SÍ** |
| 17 | core-check-incomplete-profiles | apps.core.tasks.check_incomplete_profiles | apps.core | **SÍ** |
| 18 | audit-ejecutar-verificacion-alertas | apps.audit_system.config_alertas.tasks.ejecutar_verificacion_alertas | apps.audit_system.config_alertas | **SÍ** |
| 19 | audit-escalar-alertas-no-atendidas | apps.audit_system.config_alertas.tasks.escalar_alertas_no_atendidas | apps.audit_system.config_alertas | **SÍ** |
| 20 | audit-limpiar-alertas-antiguas | apps.audit_system.config_alertas.tasks.limpiar_alertas_antiguas | apps.audit_system.config_alertas | **SÍ** |
| 21 | audit-verificar-tareas-vencidas | apps.audit_system.tareas_recordatorios.tasks.verificar_tareas_vencidas | apps.audit_system.tareas_recordatorios | **SÍ** |
| 22 | audit-ejecutar-recordatorios | apps.audit_system.tareas_recordatorios.tasks.ejecutar_recordatorios | apps.audit_system.tareas_recordatorios | **SÍ** |
| 23 | audit-resumen-tareas-diario | apps.audit_system.tareas_recordatorios.tasks.enviar_resumen_tareas_diario | apps.audit_system.tareas_recordatorios | **SÍ** |

**Resultado: Las 23 entries activas en código son LIVE. Cero zombies en el código.**

### 2.4 Zombies en DatabaseScheduler

La tabla `django_celery_beat_periodictask` tiene **39 entries** (todas `enabled=True`). Restando las 23 del código + 1 built-in (`celery.backend_cleanup`), quedan **15 zombies**:

| # | DB entry_name | task | Módulo | Estado |
|---|--------------|------|--------|--------|
| 1 | check-license-expirations-daily | apps.motor_cumplimiento.tasks.check_license_expirations | motor_cumplimiento | **NO LIVE** |
| 2 | scrape-legal-updates-biweekly | apps.motor_cumplimiento.tasks.scrape_legal_updates | motor_cumplimiento | **NO LIVE** |
| 3 | send-expiration-notifications-daily | apps.motor_cumplimiento.tasks.send_expiration_notifications | motor_cumplimiento | **NO LIVE** |
| 4 | evidencias-check-expired | apps.motor_cumplimiento.evidencias.tasks.verificar_evidencias_vencidas | motor_cumplimiento | **NO LIVE** |
| 5 | th-check-contratos-por-vencer | apps.talent_hub.tasks.check_contratos_por_vencer | talent_hub | **NO LIVE** |
| 6 | th-check-periodos-prueba | apps.talent_hub.tasks.check_periodos_prueba | talent_hub | **NO LIVE** |
| 7 | ct-detectar-ausencias-diarias | control_tiempo.detectar_ausencias_diarias | talent_hub.control_tiempo | **NO LIVE** |
| 8 | ct-generar-consolidados-mensuales | control_tiempo.generar_consolidados_mensuales | talent_hub.control_tiempo | **NO LIVE** |
| 9 | ct-recordar-marcaje-pendiente | control_tiempo.recordar_marcaje_pendiente | talent_hub.control_tiempo | **NO LIVE** |
| 10 | planeacion-check-objectives-overdue | planeacion.check_objectives_overdue | gestion_estrategica.planeacion | **NO LIVE** |
| 11 | planeacion-check-changes-overdue | planeacion.check_changes_overdue | gestion_estrategica.planeacion | **NO LIVE** |
| 12 | planeacion-check-kpi-measurements-due | planeacion.check_kpi_measurements_due | gestion_estrategica.planeacion | **NO LIVE** |
| 13 | planeacion-check-plan-expiration | planeacion.check_plan_expiration | gestion_estrategica.planeacion | **NO LIVE** |
| 14 | revision-check-overdue-compromisos | apps.gestion_estrategica.revision_direccion.tasks.verificar_compromisos_vencidos | revision_direccion | **NO LIVE** |
| 15 | revision-send-reminder | apps.gestion_estrategica.revision_direccion.tasks.enviar_recordatorio_revision | revision_direccion | **NO LIVE** |

**Causa raíz:** `beat_scheduler='django_celery_beat.schedulers:DatabaseScheduler'` lee de la tabla DB. Comentar entries en `celery.py` NO las elimina de la tabla. Las entries se crearon cuando esos módulos estaban activos y nunca se purgaron.

### 2.5 Fuentes del schedule

```
backend/config/celery.py:61  beat_scheduler='django_celery_beat.schedulers:DatabaseScheduler'
backend/config/celery.py:65  app.conf.beat_schedule = {
```

Única fuente: `config/celery.py`. No hay otros archivos que aporten entries.

---

## Sección 3 — Celery Task Routes ↔ LIVE

### 3.1 Dump completo (de celery.py)

46 entries de routing en `app.conf.task_routes` (incluyendo patterns con wildcard `*`).

### 3.2 Tabla de cruce completa

| # | pattern | queue | app_inferida | ¿LIVE? |
|---|---------|-------|--------------|--------|
| 1 | apps.core.tasks.send_email_async | emails | apps.core | **SÍ** |
| 2 | apps.core.tasks.cleanup_* | maintenance | apps.core | **SÍ** |
| 3 | apps.core.tasks.backup_* | maintenance | apps.core | **SÍ** |
| 4 | apps.core.tasks.*_health_check | monitoring | apps.core | **SÍ** |
| 5 | apps.core.tasks.check_pending_activations | notifications | apps.core | **SÍ** |
| 6 | apps.core.tasks.check_incomplete_profiles | notifications | apps.core | **SÍ** |
| 7 | apps.tenant.tasks.create_tenant_schema | tenant_ops | apps.tenant | **SÍ** |
| 8 | apps.tenant.tasks.retry_tenant_schema | tenant_ops | apps.tenant | **SÍ** |
| 9 | apps.tenant.tasks.cleanup_failed_tenant | tenant_ops | apps.tenant | **SÍ** |
| 10 | apps.tenant.tasks.cleanup_stale_creating_tenants | tenant_ops | apps.tenant | **SÍ** |
| 11 | apps.tenant.tasks.check_tenant_expirations | tenant_ops | apps.tenant | **SÍ** |
| 12 | apps.workflow_engine.ejecucion.tasks.verificar_tareas_vencidas | workflow | apps.workflow_engine.ejecucion | **SÍ** |
| 13 | apps.workflow_engine.ejecucion.tasks.enviar_notificacion_workflow | emails | apps.workflow_engine.ejecucion | **SÍ** |
| 14 | apps.workflow_engine.ejecucion.tasks.ejecutar_evento_temporizador | workflow | apps.workflow_engine.ejecucion | **SÍ** |
| 15 | apps.workflow_engine.ejecucion.tasks.actualizar_metricas_flujo | reports | apps.workflow_engine.ejecucion | **SÍ** |
| 16 | apps.gestion_estrategica.gestion_documental.tasks.verificar_documentos_revision_programada | compliance | gestion_documental | **SÍ** |
| 17 | documental.notificar_documentos_por_vencer | notifications | gestion_documental | **SÍ** |
| 18 | documental.procesar_ocr_documento | files | gestion_documental | **SÍ** |
| 19 | documental.procesar_ocr_pendientes | files | gestion_documental | **SÍ** |
| 20 | documental.calcular_scores_batch | compliance | gestion_documental | **SÍ** |
| 21 | documental.generar_documento_desde_workflow | files | gestion_documental | **SÍ** |
| 22 | documental.exportar_drive_lote | files | gestion_documental | **SÍ** |
| 23 | documental.recordar_aceptaciones_por_vencer | notifications | gestion_documental | **SÍ** |
| 24 | documental.procesar_retencion_documentos | compliance | gestion_documental | **SÍ** |
| 25 | documental.crear_borradores_revision_automatica | compliance | gestion_documental | **SÍ** |
| 26 | apps.audit_system.config_alertas.tasks.ejecutar_verificacion_alertas | compliance | audit_system | **SÍ** |
| 27 | apps.audit_system.config_alertas.tasks.escalar_alertas_no_atendidas | compliance | audit_system | **SÍ** |
| 28 | apps.audit_system.config_alertas.tasks.limpiar_alertas_antiguas | maintenance | audit_system | **SÍ** |
| 29 | apps.audit_system.tareas_recordatorios.tasks.verificar_tareas_vencidas | compliance | audit_system | **SÍ** |
| 30 | apps.audit_system.tareas_recordatorios.tasks.ejecutar_recordatorios | notifications | audit_system | **SÍ** |
| 31 | apps.audit_system.tareas_recordatorios.tasks.enviar_resumen_tareas_diario | notifications | audit_system | **SÍ** |
| 32 | utils.tasks.dispatch_event_async | notifications | utils (infra) | **SÍ** |
| 33 | apps.motor_cumplimiento.tasks.scrape_legal_updates | scraping | motor_cumplimiento | **NO** |
| 34 | apps.motor_cumplimiento.tasks.check_license_expirations | compliance | motor_cumplimiento | **NO** |
| 35 | apps.motor_cumplimiento.tasks.send_expiration_notifications | notifications | motor_cumplimiento | **NO** |
| 36 | apps.motor_cumplimiento.tasks.generate_compliance_report | reports | motor_cumplimiento | **NO** |
| 37 | apps.motor_cumplimiento.tasks.update_requisito_status | compliance | motor_cumplimiento | **NO** |
| 38 | apps.talent_hub.tasks.check_contratos_por_vencer | notifications | talent_hub | **NO** |
| 39 | apps.talent_hub.tasks.check_periodos_prueba | notifications | talent_hub | **NO** |
| 40 | planeacion.check_objectives_overdue | compliance | planeacion | **NO** |
| 41 | planeacion.check_changes_overdue | compliance | planeacion | **NO** |
| 42 | planeacion.check_kpi_measurements_due | compliance | planeacion | **NO** |
| 43 | planeacion.check_plan_expiration | compliance | planeacion | **NO** |
| 44 | apps.gestion_estrategica.revision_direccion.tasks.verificar_compromisos_vencidos | compliance | revision_direccion | **NO** |
| 45 | apps.gestion_estrategica.revision_direccion.tasks.enviar_recordatorio_revision | notifications | revision_direccion | **NO** |
| 46 | apps.motor_cumplimiento.evidencias.tasks.verificar_evidencias_vencidas | compliance | motor_cumplimiento | **NO** |

### 3.3 Zombies de task_routes

**14 entries NO-LIVE activas en código** (no comentadas, a diferencia de beat_schedule donde sí se comentaron):

- 5 de `motor_cumplimiento` (scrape, license, expiration_notifications, compliance_report, update_requisito)
- 2 de `talent_hub` (contratos, periodos_prueba)
- 4 de `planeacion` (objectives, changes, kpi, plan_expiration)
- 2 de `revision_direccion` (compromisos, recordatorio)
- 1 de `motor_cumplimiento.evidencias` (verificar_evidencias)

**Impacto:** Las task_routes son declaraciones de routing pasivas. No causan errores por sí solas — solo le dicen a Celery a qué cola enviar una tarea SI la recibe. El problema real está en las 15 entries de DatabaseScheduler (Sección 2.4) que activamente despachan esas tareas.

---

## Sección 4 — Signals / ready() ↔ LIVE

### 4.1 ready() customs en apps LIVE

| App | ¿Custom ready()? | Qué importa |
|-----|-------------------|-------------|
| django.contrib.admin | Sí | `self.module.autodiscover()` — estándar Django |
| django.contrib.auth | Sí | `create_permissions`, `update_last_login`, checks — estándar Django |
| django.contrib.contenttypes | Sí | `inject_rename_contenttypes_operations`, checks — estándar Django |
| auditlog | Sí | `auditlog.register_from_settings()` — estándar third-party |
| apps.core | Sí | `apps.core.signals.rbac_signals`, `rbac_cache_signals`, `user_lifecycle_signals` — **todo interno a core, LIVE** |
| apps.gestion_estrategica.encuestas | Sí | `apps.gestion_estrategica.encuestas.signals` — **interno, LIVE** |
| apps.workflow_engine.ejecucion | Sí | `apps.workflow_engine.ejecucion.signals` — **interno, LIVE** |
| apps.workflow_engine.firma_digital | Sí | `apps.workflow_engine.firma_digital.signals` — **interno, LIVE** |
| apps.audit_system.logs_sistema | Sí | `apps.audit_system.logs_sistema.signals` — **interno, LIVE** |
| apps.gestion_estrategica.gestion_documental | Sí | `signal_handlers._register_workflow_signal()` + `signal_handlers` — **interno, LIVE** (usa `apps.get_model` con guard `is_installed`) |
| apps.mi_equipo.seleccion_contratacion | Sí | `apps.mi_equipo.seleccion_contratacion.signals` con `try/except ImportError` — **interno, LIVE** |
| apps.mi_equipo.colaboradores | Sí | `apps.mi_equipo.colaboradores.signals` — **interno, LIVE** |
| apps.mi_equipo.onboarding_induccion | Sí | `apps.mi_equipo.onboarding_induccion.signals` con `try/except ImportError` — **interno, LIVE** |

**Error en escaneo:** `apps.gestion_estrategica.contexto` tiene label `gestion_estrategica_contexto` (no `contexto`), por lo que el script de inspección no lo encontró por label. El app SÍ está instalado y funciona. No tiene custom `ready()`.

**Resultado: CERO imports cross-module a apps NO-LIVE desde ready().**

### 4.2 Imports sospechosos

Ninguno encontrado. Todos los `ready()` importan exclusivamente signals de su propio módulo.

`gestion_documental.signal_handlers` merece nota: usa `django.apps.apps.get_model()` con guard `is_installed()` para acceder a sus propios modelos. Patrón seguro.

### 4.3 Signals.py — inventario completo

**LIVE (7 archivos):**

| Archivo | App | Conectado vía ready() |
|---------|-----|----------------------|
| apps/audit_system/logs_sistema/signals.py | logs_sistema | Sí |
| apps/workflow_engine/ejecucion/signals.py | ejecucion | Sí |
| apps/workflow_engine/firma_digital/signals.py | firma_digital | Sí |
| apps/gestion_estrategica/encuestas/signals.py | encuestas | Sí |
| apps/mi_equipo/colaboradores/signals.py | colaboradores | Sí |
| apps/mi_equipo/seleccion_contratacion/signals.py | seleccion_contratacion | Sí |
| apps/mi_equipo/onboarding_induccion/signals.py | onboarding_induccion | Sí |

**NO-LIVE (9 archivos — no conectados porque sus apps no están instaladas):**

| Archivo | App |
|---------|-----|
| apps/hseq_management/calidad/signals.py | hseq_management.calidad |
| apps/hseq_management/mejora_continua/signals.py | hseq_management.mejora_continua |
| apps/sales_crm/pedidos_facturacion/signals.py | sales_crm.pedidos_facturacion |
| apps/talent_hub/proceso_disciplinario/signals.py | talent_hub.proceso_disciplinario |
| apps/talent_hub/control_tiempo/signals.py | talent_hub.control_tiempo |
| apps/talent_hub/desempeno/signals.py | talent_hub.desempeno |
| apps/talent_hub/formacion_reinduccion/signals.py | talent_hub.formacion_reinduccion |
| apps/talent_hub/novedades/signals.py | talent_hub.novedades |
| apps/gestion_estrategica/planeacion/signals.py | gestion_estrategica.planeacion |

**Riesgo:** Ninguno inmediato. Los 9 signals NO-LIVE no se conectan porque sus apps no están en INSTALLED_APPS. No causan imports al arranque.

---

## Sección 5 — URLs / Admin ↔ LIVE

### 5.1 Includes raíz (`config/urls.py`)

| Línea | Guard | Path | Include | ¿LIVE? |
|-------|-------|------|---------|--------|
| 151 | Ninguno (siempre) | api/core/ | apps.core.urls | **SÍ** |
| 153 | Ninguno (siempre) | api/tenant/ | apps.tenant.urls | **SÍ** |
| 155 | Ninguno (siempre) | api/ia/ | apps.ia.urls | **SÍ** |
| 157 | Ninguno (siempre) | api/shared-library/ | apps.shared_library.urls | **SÍ** |
| 165 | `is_app_installed('apps.gestion_estrategica.identidad')` | api/gestion-estrategica/ | apps.gestion_estrategica.urls | **SÍ** (identidad LIVE) |
| 169 | `is_app_installed('apps.gestion_estrategica.configuracion')` | api/configuracion/ | apps.gestion_estrategica.configuracion.urls | **SÍ** |
| 172 | `is_app_installed('apps.gestion_estrategica.organizacion')` | api/organizacion/ | apps.gestion_estrategica.organizacion.urls | **SÍ** |
| 175 | `is_app_installed('apps.gestion_estrategica.identidad')` | api/identidad/ | apps.gestion_estrategica.identidad.urls | **SÍ** |
| 178 | `is_app_installed('apps.gestion_estrategica.planeacion')` | api/planeacion/ | — | **NO** (no instalada, guard bloquea) |
| 181 | `is_app_installed('apps.gestion_estrategica.encuestas')` | api/encuestas-dofa/ | apps.gestion_estrategica.encuestas.urls | **SÍ** |
| 184 | `is_app_installed('apps.gestion_estrategica.gestion_proyectos')` | api/proyectos/ | — | **NO** (guard bloquea) |
| 187 | `is_app_installed('apps.gestion_estrategica.revision_direccion')` | api/revision-direccion/ | — | **NO** (guard bloquea) |
| 193 | `is_app_installed('apps.motor_cumplimiento.matriz_legal')` | api/cumplimiento/ | — | **NO** (guard bloquea) |
| 196 | `is_app_installed('apps.motor_riesgos.riesgos_procesos')` | api/riesgos/ | — | **NO** (guard bloquea) |
| 199 | `is_app_installed('apps.workflow_engine.disenador_flujos')` | api/workflows/ | apps.workflow_engine.urls | **SÍ** |
| 206 | `is_app_installed('apps.hseq_management.calidad')` | api/hseq/ | — | **NO** (guard bloquea) |
| 212 | `is_app_installed('apps.supply_chain.gestion_proveedores')` | api/supply-chain/ | — | **NO** (guard bloquea) |
| 215 | `is_app_installed('apps.production_ops.recepcion')` | api/production-ops/ | — | **NO** (guard bloquea) |
| 218 | `is_app_installed('apps.logistics_fleet.gestion_flota')` | api/logistics-fleet/ | — | **NO** (guard bloquea) |
| 221 | `is_app_installed('apps.sales_crm.gestion_clientes')` | api/sales-crm/ | — | **NO** (guard bloquea) |
| 227 | `is_app_installed('apps.mi_equipo')` | api/mi-equipo/ | apps.mi_equipo.urls | **SÍ** |
| **240** | **`is_app_installed('apps.mi_equipo') or is_app_installed('apps.talent_hub.novedades')`** | **api/talent-hub/** | **apps.talent_hub.urls** | **HALLAZGO — ver abajo** |
| 244 | `is_app_installed('apps.administracion.presupuesto')` | api/administracion/ | — | **NO** (guard bloquea) |
| 247 | `is_app_installed('apps.tesoreria.tesoreria')` | api/tesoreria/ | — | **NO** (guard bloquea) |
| 250 | `is_app_installed('apps.accounting.config_contable')` | api/accounting/ | — | **NO** (guard bloquea) |
| 256 | `is_app_installed('apps.analytics.config_indicadores')` | api/analytics/ | apps.analytics.urls | **SÍ** (excepción LIVE) |
| 259 | `is_app_installed('apps.audit_system.logs_sistema')` | api/audit/ | apps.audit_system.urls | **SÍ** |

**HALLAZGO línea 240:** `talent_hub.urls` se carga porque `apps.mi_equipo` está instalado. Dentro de `talent_hub/urls.py`, los guards internos bloquean las sub-apps L60 no instaladas, PERO cargan:
- `api/talent-hub/mi-portal/` → `apps.talent_hub.api.ess_urls` (porque `colaboradores` IS installed)
- `api/talent-hub/people-analytics/` → `PeopleAnalyticsView` importado directamente a nivel de módulo

`ess_urls.py` importa **incondicionalmente** `MisVacacionesView` y `SolicitarPermisoView` (líneas 13-17), que dependen de `talent_hub.novedades` (NO-LIVE). Estas views se registran como URL patterns y retornarían HTTP 500 al ser invocadas.

Esto confirma y amplía el hallazgo H1 documentado en HALLAZGOS-PENDIENTES-2026-04.md.

### 5.2 admin.py inventario

**81 archivos admin.py** en total en el repo.

| Categoría | Cantidad | Riesgo |
|-----------|----------|--------|
| Apps LIVE instaladas | 24 | Ninguno — autodescubiertos normalmente |
| Apps NO-LIVE no instaladas | 57 | Ninguno — no autodescubiertos (apps no en INSTALLED_APPS) |

Django admin solo autodescubre `admin.py` de apps en INSTALLED_APPS. Los 57 archivos en apps NO-LIVE son inertes.

---

## Sección 6 — Management Commands ↔ LIVE

### 6.1 Commands por app

**Apps LIVE con management commands:**

| App | Commands | Cantidad |
|-----|----------|----------|
| apps.core | wait_for_db, init_rbac, sync_permissions, deploy_seeds_all_tenants, health_check, setup_demo_data, seed_estructura_final, seed_cargos_base, seed_permisos_rbac, seed_rbac_templates, seed_nivel2_modules, seed_org_templates, seed_hseq_modules, seed_riesgos_ocupacionales, update_hseq_icon, verify_hseq_modules, cleanup_legacy_modules, crear_cargos_modulos, fix_cargo_codes, fix_cargo_is_system, apply_permission_template, migrate_rbac_v4, update_section_descriptions, init_roles_sugeridos, bootstrap_onboarding, migrate_media_paths | 26 |
| apps.tenant | create_initial_setup, cleanup_orphan_schemas, clear_tenant_users, clean_tenant_modules, delete_tenant, reset_tenant, repair_tenant_status, fix_tenant_domains, sync_tenant_seeds, bootstrap_production | 10 |
| apps.gestion_estrategica.organizacion | seed_organizacion, seed_consecutivos_sistema, seed_procesos_base | 3 |
| apps.gestion_estrategica.configuracion | seed_empresa, seed_configuracion_sistema, cargar_unidades_sistema, migrar_capacidades_kg | 4 |
| apps.gestion_estrategica.identidad | seed_identidad, seed_config_identidad, seed_workflows, update_valores_icons | 4 |
| apps.gestion_estrategica.contexto | seed_tipos_analisis_dofa, seed_tipos_analisis_pestel, seed_tipos_parte_interesada, seed_grupos_partes_interesadas | 4 |
| apps.gestion_estrategica.encuestas | seed_preguntas_pci_poam | 1 |
| apps.audit_system.centro_notificaciones | seed_notification_types | 1 |
| apps.gestion_estrategica.gestion_documental | seed_plantillas_sgi, seed_politica_habeas_data, seed_tipos_documento_sgi, seed_trd, migrar_procesos_gd, migrar_codigos_gd, generar_certificado_x509 | 7 |
| apps.mi_equipo.seleccion_contratacion | seed_tipos_contrato, seed_plantillas_prueba, seed_plantillas_psicometricas, generate_vacantes_from_cargos | 4 |
| apps.shared_library | seed_biblioteca_plantillas | 1 |
| **Total LIVE** | | **65** |

**Apps NO-LIVE con management commands (3):**

| App | Command | Archivo |
|-----|---------|---------|
| apps.supply_chain.gestion_proveedores | seed_supply_chain_catalogs | backend/apps/supply_chain/gestion_proveedores/management/commands/seed_supply_chain_catalogs.py |
| apps.talent_hub | seed_th_enhancements | backend/apps/talent_hub/management/commands/seed_th_enhancements.py |
| apps.gamificacion.juego_sst | seed_juego_sst | backend/apps/gamificacion/juego_sst/management/commands/seed_juego_sst.py |

**Riesgo:** Bajo. Django solo autodescubre commands de INSTALLED_APPS. Estas 3 apps no están instaladas, por lo que sus commands no se importan al arranque. No rompen `manage.py`.

**Observación sobre core:** 6 commands en core tienen nombres que sugieren dependencia de módulos NO-LIVE (`seed_hseq_modules`, `seed_riesgos_ocupacionales`, `update_hseq_icon`, `verify_hseq_modules`, `seed_nivel2_modules`, `crear_cargos_modulos`). Estos SÍ se autodescubren (core LIVE). Si sus imports a nivel de módulo fallan, romperían `manage.py`. Evidencia de que NO fallan: `manage.py` funciona correctamente en todos los tests. Probablemente usan `apps.get_model()` lazy o `try/except ImportError`.

---

## Hallazgos nuevos propuestos

### H10 — Tenant row `fast_test` huérfana en DB local

**Severidad: MEDIA**

Row activa (`is_active=True`) en `public.tenants_tenant` para schema `fast_test` que no existe físicamente. Celery itera este tenant cada 5 minutos y genera 3 tipos de error en logs:
- `relation "tareas_tarea" does not exist`
- `relation "workflow_exec_tarea_activa" does not exist`
- `relation "alertas_configuracion_alerta" does not exist`

**Causa:** La sesión anterior (H4) dropeó el schema pero no eliminó la row del Tenant. `auto_drop_schema = False` en el modelo Tenant por seguridad.

**Impacto:** Ruido en logs, confusión en health checks, posible contribución al status "unhealthy" de celery/celerybeat.

**Fix propuesto:** `DELETE FROM tenants_tenant WHERE schema_name = 'fast_test';` + `DELETE FROM tenants_domain WHERE tenant_id = <id>;`

### H11 — DatabaseScheduler drift: 15 tareas zombie vivas en DB

**Severidad: ALTA**

El `DatabaseScheduler` de Celery Beat almacena las tareas programadas en `django_celery_beat_periodictask`. Comentar entries en `celery.py` NO las elimina de la tabla DB. Resultado: 15 tareas de módulos NO-LIVE se siguen despachando activamente cada hora/día.

Estas tareas probablemente fallan silenciosamente (el worker no tiene el módulo importado) pero generan overhead de scheduling, dispatching, y error handling.

**Causa raíz:** Falta de procedimiento de purga al desactivar módulos. Cuando se comenta una tarea en `celery.py`, el paso de "purgar de la tabla DB" no está documentado ni automatizado.

**Fix propuesto:** Eliminar las 15 rows de `django_celery_beat_periodictask` o marcarlas como `enabled=False`. Documentar en el procedimiento de desactivación de módulos que se debe correr purga de DB Beat schedule.

### H12 — 14 task_routes para módulos NO-LIVE activas en código

**Severidad: BAJA**

14 declaraciones de routing en `celery.py` apuntan a módulos NO-LIVE. Son declaraciones pasivas (no causan errores) pero polluyen la configuración y confunden auditorías.

**Fix propuesto:** Comentarlas con el mismo bloque de documentación que se usó para beat_schedule (sesión 2026-04-07).

### H13 — gestion_documental usa paths cortos en task names

**Severidad: BAJA**

7 de las 9 tareas de gestion_documental usan nombres cortos (`documental.*`) en vez del dotted path completo (`apps.gestion_estrategica.gestion_documental.tasks.*`). Inconsistencia con el resto del sistema que usa paths completos.

Esto funciona porque Celery autodiscover + el `name` del task decorator lo resuelven. Pero dificulta auditorías, grep, y troubleshooting.

**Fix propuesto:** Estandarizar los `name` de los tasks en gestion_documental al dotted path completo. Actualizar beat_schedule y task_routes en el mismo PR.

### H14 — ess_urls.py importa views que dependen de módulos NO-LIVE

**Severidad: MEDIA** (amplía H1)

`apps/talent_hub/api/ess_urls.py:13-17` importa incondicionalmente `MisVacacionesView` y `SolicitarPermisoView`. Estas views se registran como URL patterns (líneas 23-24) y retornarían HTTP 500 si un usuario navega a `/api/talent-hub/mi-portal/mis-vacaciones/` o `/solicitar-permiso/`.

Esto YA está documentado en H1, pero la auditoría confirma que la importación es a nivel de módulo (no lazy), lo que significa que si el import falla en una versión futura, rompe el arranque de urls.py.

### H15 — MEMORY.md menciona schemas que no existen en entorno local

**Severidad: BAJA (informativa)**

MEMORY.md línea 10 lista `tenant_stratekaz` y `tenant_grasas_y_huesos_del_` como schemas existentes. Estos no existen en la DB local Docker (solo `tenant_demo`). Probablemente son schemas de producción. No es un error funcional pero es una discrepancia documental que puede confundir en sesiones futuras.

---

## Apéndice A — INSTALLED_APPS completo (development mode)

44 apps totales:
- 15 framework/third-party (django, rest_framework, corsheaders, etc.)
- 29 en TENANT_APPS (6 framework + 23 propias de StrateKaz)
- 2 adicionales de development (django_extensions, debug_toolbar)

## Apéndice B — Datos crudos de queries

### Tenant rows

```
fast_test    | domains=['tenant.fast-test.com'] | is_trial=True, is_active=True
tenant_demo  | domains=['demo.localhost', 'localhost'] | is_trial=False, is_active=True
TOTAL: 2
```

### Physical schemas

```
tenant_demo (248 tables)
```

### DatabaseScheduler entries (39)

```
audit-ejecutar-recordatorios | apps.audit_system.tareas_recordatorios.tasks.ejecutar_recordatorios | enabled=True
audit-ejecutar-verificacion-alertas | apps.audit_system.config_alertas.tasks.ejecutar_verificacion_alertas | enabled=True
audit-escalar-alertas-no-atendidas | apps.audit_system.config_alertas.tasks.escalar_alertas_no_atendidas | enabled=True
audit-limpiar-alertas-antiguas | apps.audit_system.config_alertas.tasks.limpiar_alertas_antiguas | enabled=True
audit-resumen-tareas-diario | apps.audit_system.tareas_recordatorios.tasks.enviar_resumen_tareas_diario | enabled=True
audit-verificar-tareas-vencidas | apps.audit_system.tareas_recordatorios.tasks.verificar_tareas_vencidas | enabled=True
celery.backend_cleanup | celery.backend_cleanup | enabled=True
check-license-expirations-daily | apps.motor_cumplimiento.tasks.check_license_expirations | enabled=True
cleanup-temp-files-daily | apps.core.tasks.cleanup_temp_files | enabled=True
core-check-incomplete-profiles | apps.core.tasks.check_incomplete_profiles | enabled=True
core-check-pending-activations | apps.core.tasks.check_pending_activations | enabled=True
ct-detectar-ausencias-diarias | control_tiempo.detectar_ausencias_diarias | enabled=True
ct-generar-consolidados-mensuales | control_tiempo.generar_consolidados_mensuales | enabled=True
ct-recordar-marcaje-pendiente | control_tiempo.recordar_marcaje_pendiente | enabled=True
database-backup | apps.core.tasks.backup_database | enabled=True
documental-calcular-scores-batch | documental.calcular_scores_batch | enabled=True
documental-check-revision-programada | apps.gestion_estrategica.gestion_documental.tasks.verificar_documentos_revision_programada | enabled=True
documental-crear-borradores-revision | documental.crear_borradores_revision_automatica | enabled=True
documental-notify-revision-por-vencer | documental.notificar_documentos_por_vencer | enabled=True
documental-procesar-ocr-pendientes | documental.procesar_ocr_pendientes | enabled=True
documental-procesar-retencion | documental.procesar_retencion_documentos | enabled=True
documental-recordar-aceptaciones-por-vencer | documental.recordar_aceptaciones_por_vencer | enabled=True
evidencias-check-expired | apps.motor_cumplimiento.evidencias.tasks.verificar_evidencias_vencidas | enabled=True
planeacion-check-changes-overdue | planeacion.check_changes_overdue | enabled=True
planeacion-check-kpi-measurements-due | planeacion.check_kpi_measurements_due | enabled=True
planeacion-check-objectives-overdue | planeacion.check_objectives_overdue | enabled=True
planeacion-check-plan-expiration | planeacion.check_plan_expiration | enabled=True
revision-check-overdue-compromisos | apps.gestion_estrategica.revision_direccion.tasks.verificar_compromisos_vencidos | enabled=True
revision-send-reminder | apps.gestion_estrategica.revision_direccion.tasks.enviar_recordatorio_revision | enabled=True
scrape-legal-updates-biweekly | apps.motor_cumplimiento.tasks.scrape_legal_updates | enabled=True
send-expiration-notifications-daily | apps.motor_cumplimiento.tasks.send_expiration_notifications | enabled=True
send-weekly-reports | apps.core.tasks.send_weekly_reports | enabled=True
system-health-check | apps.core.tasks.system_health_check | enabled=True
tenant-check-expirations-daily | apps.tenant.tasks.check_tenant_expirations | enabled=True
tenant-cleanup-stale-creating | apps.tenant.tasks.cleanup_stale_creating_tenants | enabled=True
th-check-contratos-por-vencer | apps.talent_hub.tasks.check_contratos_por_vencer | enabled=True
th-check-periodos-prueba | apps.talent_hub.tasks.check_periodos_prueba | enabled=True
workflow-check-overdue-tasks | apps.workflow_engine.ejecucion.tasks.verificar_tareas_vencidas | enabled=True
workflow-update-metrics-daily | apps.workflow_engine.ejecucion.tasks.actualizar_metricas_flujo | enabled=True
```
