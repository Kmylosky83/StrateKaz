# Hallazgo: gestion_documental sin cobertura automática de auditoría

**Fecha:** 2026-04-12
**Severidad:** MEDIA
**Descubierto durante:** Paso 0 del Punto 2 CORREGIDO (verificación de auditlog)
**Módulo:** gestion_documental (L15)

## Descripción

Los 8 ViewSets de gestion_documental heredan directamente de
`viewsets.ModelViewSet`, sin usar `TenantModelViewSetMixin` ni
`AuditLogMixin`. Esto significa que las operaciones CRUD estándar
(create, update, destroy) NO generan registros en `LogCambio`
automáticamente.

Solo 2 operaciones específicas tienen llamadas explícitas a
`AuditSystemService.log_cambio()` (views.py:449 y views.py:709).

## ViewSets afectados

- TipoDocumentoViewSet(ExportMixin, viewsets.ModelViewSet)
- PlantillaDocumentoViewSet(viewsets.ModelViewSet)
- CampoFormularioViewSet(viewsets.ModelViewSet)
- DocumentoViewSet(ExportMixin, viewsets.ModelViewSet)
- VersionDocumentoViewSet(viewsets.ModelViewSet)
- ControlDocumentalViewSet(viewsets.ModelViewSet)
- AceptacionDocumentalViewSet(viewsets.ModelViewSet)
- TablaRetencionDocumentalViewSet(viewsets.ModelViewSet)

## Mecanismo correcto

El estándar del proyecto es que los ViewSets de TENANT_APPS hereden de
`TenantModelViewSetMixin` (core/mixins.py), que integra `AuditLogMixin`
internamente con lazy import y fail-safe.

## Hallazgo complementario: django-auditlog

El paquete `auditlog` está instalado (TENANT_APPS) y su middleware activo,
pero `AUDITLOG_INCLUDE_ALL_MODELS = False` y CERO modelos están registrados
con `auditlog.register()`. La tabla `auditlog_logentry` existe pero no
captura cambios de ningún modelo del sistema.

## Acción recomendada

Cuando gestion_documental se consolide como sub-app (criterio "Básico bien
hecho"), migrar sus ViewSets a `TenantModelViewSetMixin` para obtener
auditoría CRUD automática. NO es scope del Punto 2.

## Relación con Punto 2

Este hallazgo es ORTOGONAL a la decisión TenantModel vs BaseCompanyModel.
La cobertura de auditoría depende del ViewSet, no de la clase base del
modelo. SET_NULL en created_by/updated_by se mantiene como estándar.
