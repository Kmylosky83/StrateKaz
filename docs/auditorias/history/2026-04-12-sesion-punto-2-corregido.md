# Sesión 2026-04-12 (tarde) — Punto 2 corregido: reversión arquitectónica gestion_documental

## Contexto

Sesión de corrección arquitectónica ejecutada el mismo día que la sesión de la mañana (filosófica + auditoría 7 críticos) y mediodía (commit `addc9ce4` que migró gestion_documental a BaseCompanyModel). Al comenzar esta sesión como "Punto 2 continuación" para migrar workflow_engine + ia + core + auxiliares a BCM, el análisis arquitectónico reveló que la dirección era incorrecta y se procedió a revertir.

## Hipótesis original (incorrecta)

Antes de esta sesión, el plan del Punto 2 era:
1. Migrar 27 modelos de workflow_engine de TenantModel a BaseCompanyModel (con RunSQL por datos reales)
2. Migrar 2 modelos de ia a BaseCompanyModel
3. Migrar UserOnboarding (core) a BaseCompanyModel
4. Migrar OrganigramaNodePosition y AuditImpersonation desde `models.Model` crudo a BaseCompanyModel

La premisa era que BaseCompanyModel era el estándar único del proyecto (215 modelos BCM vs 30 TenantModel) y que la dirección del 22 de marzo (migración 0005 de firma_digital de BCM a TM) había sido un error aislado.

## Reversión arquitectónica

Análisis de Claude Web + Claude Code con evidencia del repo reveló que la dirección correcta en arquitectura schema-per-tenant (django-tenants) para TENANT_APPS es TenantModel, no BaseCompanyModel.

### Argumentos decisivos

1. **Redundancia con aislamiento físico**: el schema de PostgreSQL ya aísla por tenant. Un campo `empresa` FK dentro del schema es doble fuente de verdad.

2. **TenantModel es técnicamente superior en 5 de 7 dimensiones**:
   - SoftDeleteManager auto-filtra soft-deleted (BCM no)
   - delete() override impide borrado físico accidental (BCM no — riesgo legal bajo Ley 527)
   - deleted_by tracking para ISO 9001 §7.5.3 (BCM no)
   - Sin campo empresa redundante
   - Sin 3 compound indexes inútiles sobre empresa

3. **El propio código del proyecto documentaba la práctica correcta** en `backend/utils/models.py:192`:
   > "django-tenants se encarga del aislamiento por schema, no es necesario agregar un campo tenant_id"

4. **Los 215 modelos BCM estaban casi todos en L25+ (DISABLED, borrador)**. Los 30 modelos TM eran código escrito **después** de entender schema isolation correctamente, incluyendo los 5 de la migración 0005 de firma_digital del 22 de marzo.

5. **Colisión con Habeas Data (Ley 1581/2012)**: PROTECT en created_by/updated_by (parte del plan original) habría impedido eliminar usuarios bajo solicitud de derecho de eliminación, creando un conflicto legal directo con otra ley colombiana.

### Validación retroactiva empírica

**Baseline de tests de gestion_documental (con BCM)**: 32 errores.
**Post-reversión (con TenantModel)**: 32 tests passing, 0 errores.

Los tests del propio módulo estaban señalando desde el 12 de abril que la migración a BCM era incorrecta. Fueron escritos contra semántica TenantModel y quedaron rotos silenciosamente al migrar a BCM. La reversión los recuperó al 100%.

## Decisiones arquitectónicas tomadas

### Decisión 1 — TenantModel es el estándar para TENANT_APPS
BaseCompanyModel queda deprecada para TENANT_APPS. Solo aplicable hipotéticamente a módulos en SHARED_APPS (que hoy no existen).

### Decisión 2 — SET_NULL se mantiene en AuditModel
No se aplica `PROTECT` en created_by/updated_by. La trazabilidad ISO 9001 debe cubrirse por capa de auditoría separada (actualmente el sistema custom `audit_system/logs_sistema/LogCambio`), no por candado de FK que rompería Habeas Data y operación de rotación de empleados.

Hallazgo preexistente documentado: los 8 ViewSets de gestion_documental heredan de `viewsets.ModelViewSet` en vez de `TenantModelViewSetMixin`, por lo que el sistema de auditoría custom NO captura sus cambios CRUD automáticamente. Es deuda de consolidación del módulo, no del Punto 2.

### Decisión 3 — AuditImpersonation es append-only por diseño
NO se migra a TenantModel. SoftDeleteManager permitiría a un admin malicioso ocultar evidencia de su propio abuso de impersonation via soft_delete. El modelo mantiene `models.Model` como base con overrides de `save()` y `delete()` que raisean `PermissionError`. Los campos de auditoría ya existían con nombres del dominio (`timestamp`, `superadmin`, `target_user`).

## Cambios ejecutados

### Commit `de7525ea` — gestion_documental revert BCM → TM
- 8 modelos revertidos: TipoDocumento, PlantillaDocumento, Documento, VersionDocumento, CampoFormulario, ControlDocumental, AceptacionDocumental, TablaRetencionDocumental
- 5 `unique_together` limpiados de `empresa_id`
- Migración `0023_revert_to_tenant_model.py` con 5 fases (AlterUniqueTogether → AddField → RunPython → RemoveField → AlterField)
- 79 registros migrados en `tenant_demo` (`is_active=False → is_deleted=True`)
- 12 archivos actualizados: models, serializers, views, admin, documento_service, tasks, signal_handlers, exporters/pdf_generator, tests/conftest, tests/test_models, commands/migrar_codigos_gd
- `on_delete` de `created_by`/`updated_by`: PROTECT → SET_NULL (heredado de AuditModel sin modificar)

### Commit `7c7ea6da` — organizacion OrganigramaNodePosition → TM
- 1 modelo migrado de `models.Model` crudo a TenantModel
- Migración `0003_migrate_node_position_to_tenant_model.py` aditiva (AddField/AlterField, `created_at` con `default=timezone.now` para filas preexistentes)
- 3 queries en views.py verificadas sin dependencia de soft-deleted

### Commit `b8792ca9` — audit-system AuditImpersonation append-only
- Solo Python, sin migración
- Docstring agregado documentando diseño append-only y rationale de seguridad
- Override `save()`: raisea PermissionError si `pk is not None`
- Override `delete()`: raisea PermissionError incondicional
- Cero campos nuevos (el modelo ya tenía `timestamp`, `superadmin`, `target_user`)

## Tests post-migración

| Suite | Baseline | Post-migración | Delta |
|---|---|---|---|
| gestion_documental | 32 errors | 32 passed, 0 errors | +32 recuperados |
| organizacion | 28 errors | 28 errors | sin cambio (Patrón B preexistente) |
| audit_system | 195 errors | 195 errors | sin cambio (Patrón B preexistente) |
| workflow_engine | 31p / 26e | 31p / 26e | sin cambio (Patrón B preexistente) |

**Cero regresiones. 32 tests recuperados.**

## Hallazgos documentados en esta sesión

1. `docs/history/findings/2026-04-12-gd-audit-coverage-gap.md` — ViewSets de gestion_documental sin `TenantModelViewSetMixin`, sin captura automática en sistema de auditoría custom
2. `docs/history/findings/2026-04-12-gestion-documental-seeds-empresa-id.md` — 5 management commands con referencias legacy a `empresa_id`, runtime manual solamente
3. Dependabot reporta 41 vulnerabilidades preexistentes en dependencias (pendiente de clasificación y triage, fuera del scope del Punto 2)

## Impacto en el plan macro

**Punto 2 (bases sólidas, auditoría 7 críticos): CERRADO en versión corregida.**

Los targets que quedaban en el plan original se reinterpretan:
- workflow_engine (27 modelos): ya estaban correctos en TenantModel → sin cambios necesarios
- ia (2 modelos): ya estaban correctos en TenantModel → sin cambios necesarios
- core UserOnboarding: ya estaba correcto en TenantModel → sin cambios necesarios
- OrganigramaNodePosition: migrado hoy
- AuditImpersonation: enforcement append-only hoy

Orden actualizado de próximas sesiones:
1. Punto 3 — Auth cleanup (eliminar endpoint legacy `/api/auth/login/` + 16 tests skipped)
2. Punto 4 — CI/CD expandir test gate (único bloqueante real de los 7 críticos)
3. Punto 6 — runbook migraciones multi-tenant
4. Punto 7 — Celery fairness
5. Patrón B — bloqueador de infra de tests (con hipótesis revisada: GD corre limpio sin core_tab_section, alcance puede ser menor al estimado)
6. Revisión módulo por módulo LIVE en funcionalidad real (fase 3 del plan macro)
7. H1 — decisión Portales

Pendientes fuera de cola técnica:
- SSL Hostinger
- Dependabot 41 vulnerabilidades preexistentes (triage pendiente)

## Lecciones aprendidas

1. **La mayoría numérica no implica corrección arquitectónica.** La decisión del mediodía de hoy ("BCM es el estándar, tiene 215 modelos vs 30 TM") falló al considerar que los 215 modelos BCM eran código DISABLED/borrador, no producción validada.

2. **Los tests del propio módulo son oráculo empírico.** Si una decisión arquitectónica rompe tests que antes pasaban, la decisión probablemente está mal — aunque la justificación teórica suene bien.

3. **Refactoring sano es detectar el error rápido.** El commit equivocado (`addc9ce4`) fue revertido el mismo día por `de7525ea`. Lo peor habría sido multiplicar la dirección equivocada en workflow_engine (27 modelos más) antes de revisarla.

4. **Claude Web puede equivocarse y Claude Code debe parar y cuestionar.** En esta sesión Code detectó tres errores en los briefs de Claude Web:
   - PROTECT en AuditModel (colisión con Habeas Data)
   - AuditImpersonation migrando a TenantModel (SoftDeleteManager es riesgo de seguridad)
   - AuditImpersonation agregando created_at/created_by duplicados (ya existían como timestamp/superadmin)
   
   El método de tres roles funcionó exactamente como debía: el ejecutor técnico con acceso al repo salvó al estratega web de tres errores costosos.

5. **Los ViewSets de gestion_documental no están en TenantModelViewSetMixin**, por lo que el sistema de auditoría custom no captura cambios automáticamente. Este gap debe cerrarse cuando se consolide gestion_documental como módulo maduro.

## Referencias

- Commit que se revirtió: `addc9ce4` (mediodía 2026-04-12)
- Commits de esta sesión: `de7525ea`, `7c7ea6da`, `b8792ca9`
- Migración de referencia usada como template: `apps/workflow_engine/firma_digital/migrations/0005_migrate_to_tenant_model.py` (22 marzo 2026)
- Sesión filosófica previa: `docs/history/2026-04-12-sesion-filosofica-bases-solidas.md`
- Auditoría 7 críticos: `docs/history/2026-04-12-auditoria-7-criticos.md`
