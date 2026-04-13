# Seeds de gestion_documental con referencias legacy a empresa_id

**Fecha:** 2026-04-12
**Severidad:** BAJA
**Descubierto durante:** Paso 1 del Punto 2 CORREGIDO (reversión GD a TenantModel)

## Contexto

Durante la reversión de gestion_documental de BCM a TenantModel (Punto 2
del refactor arquitectónico), se identificaron 5 management commands con
referencias a empresa_id que no fueron incluidas en el scope de la sesión
por ser operaciones manuales no críticas para runtime.

## Archivos afectados

- `backend/apps/.../management/commands/seed_trd.py` (3 ocurrencias)
- `backend/apps/.../management/commands/seed_tipos_documento_sgi.py` (4 ocurrencias)
- `backend/apps/.../management/commands/seed_plantillas_sgi.py` (8 ocurrencias)
- `backend/apps/.../management/commands/seed_politica_habeas_data.py` (3 ocurrencias)
- `backend/apps/.../management/commands/migrar_codigos_gd.py` (1 ocurrencia)

(Ruta completa: `backend/apps/gestion_estrategica/gestion_documental/management/commands/`)

## Impacto

Estos seeds fallarán en runtime si se ejecutan post-migración porque el
campo empresa fue eliminado del modelo. No corren automáticamente — solo
cuando un dev los ejecuta manualmente.

## Fix futuro

Eliminar referencias a empresa_id en cada seed. Cambio mecánico, bajo
riesgo, estimado <30min. Debe hacerse antes del próximo uso de cualquiera
de estos seeds (típicamente durante setup de tenants demo o testing).

## Relacionado

Sesión 2026-04-12 Punto 2 corregido — reversión gestion_documental
BCM → TenantModel.
