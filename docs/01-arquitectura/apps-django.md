# Apps Django — StrateKaz
**Última actualización:** 2026-04-20

## Definición operativa

En este proyecto, "app Django" = carpeta dentro de `backend/apps/` que tiene `apps.py`
con una clase que hereda de `AppConfig`. Las carpetas sin `apps.py` propio son
contenedores/namespaces que agrupan sub-apps.

Algunas carpetas tienen `apps.py` en la raíz Y también sub-carpetas con su propio
`apps.py` (ej: `analytics/`, `audit_system/`, `mi_equipo/`). En esos casos, la
raíz define el contenedor como app registrable y las subcarpetas son sub-apps.

---

## Tipo A — Apps planas (apps.py directo en la raíz de la carpeta)

| App | Path en settings | Está en TENANT_APPS? | Tipo (SHARED/TENANT) |
|-----|-----------------|---------------------|---------------------|
| `core` | `apps.core` | Sí | TENANT |
| `ia` | `apps.ia` | Sí | TENANT |
| `tenant` | `apps.tenant` | Sí | SHARED |
| `shared_library` | `apps.shared_library` | Sí | SHARED |
| `catalogo_productos` | `apps.catalogo_productos` | Sí | TENANT |
| `mi_equipo` | `apps.mi_equipo` | Sí | TENANT |
| `mi_portal` | `apps.mi_portal` | NO (ver nota) | — |

---

## Tipo B — Contenedores/namespaces (sin apps.py propio, sub-apps tienen apps.py)

| Contenedor | Path | Sub-apps que contiene |
|------------|------|-----------------------|
| `gestion_estrategica/` | `backend/apps/gestion_estrategica/` | configuracion, organizacion, identidad, contexto, encuestas, gestion_documental, planeacion, gestion_proyectos, planificacion_sistema, revision_direccion |
| `supply_chain/` | `backend/apps/supply_chain/` | catalogos, gestion_proveedores, recepcion, liquidaciones, almacenamiento, compras |
| `talent_hub/` | `backend/apps/talent_hub/` | novedades, formacion_reinduccion, desempeno, control_tiempo, nomina, proceso_disciplinario, off_boarding, consultores_externos |
| `motor_cumplimiento/` | `backend/apps/motor_cumplimiento/` | matriz_legal, requisitos_legales, reglamentos_internos, evidencias |
| `motor_riesgos/` | `backend/apps/motor_riesgos/` | riesgos_procesos, ipevr, aspectos_ambientales, riesgos_viales, seguridad_informacion, sagrilaft_ptee |
| `hseq_management/` | `backend/apps/hseq_management/` | accidentalidad, seguridad_industrial, higiene_industrial, medicina_laboral, emergencias, gestion_ambiental, calidad, mejora_continua, gestion_comites |
| `production_ops/` | `backend/apps/production_ops/` | recepcion, procesamiento, producto_terminado, mantenimiento |
| `logistics_fleet/` | `backend/apps/logistics_fleet/` | gestion_flota, gestion_transporte |
| `sales_crm/` | `backend/apps/sales_crm/` | gestion_clientes, pipeline_ventas, pedidos_facturacion, servicio_cliente |
| `accounting/` | `backend/apps/accounting/` | config_contable, movimientos, informes_contables, integracion |
| `administracion/` | `backend/apps/administracion/` | presupuesto, activos_fijos, servicios_generales |
| `tesoreria/` | `backend/apps/tesoreria/` | tesoreria |
| `gamificacion/` | `backend/apps/gamificacion/` | juego_sst |

---

## Tipo C — Sub-apps dentro de contenedores (tienen apps.py en su propia carpeta)

### gestion_estrategica

| Sub-app | Path en settings | Está en TENANT_APPS? |
|---------|-----------------|---------------------|
| `configuracion` | `apps.gestion_estrategica.configuracion` | Sí (LIVE L10) |
| `organizacion` | `apps.gestion_estrategica.organizacion` | Sí (LIVE L10) |
| `identidad` | `apps.gestion_estrategica.identidad` | Sí (LIVE L10) |
| `contexto` | `apps.gestion_estrategica.contexto` | Sí (LIVE L10) |
| `encuestas` | `apps.gestion_estrategica.encuestas` | Sí (LIVE L10) |
| `gestion_documental` | `apps.gestion_estrategica.gestion_documental` | Sí (LIVE L15) |
| `planeacion` | `apps.gestion_estrategica.planeacion` | NO (comentada L20) |
| `gestion_proyectos` | `apps.gestion_estrategica.gestion_proyectos` | NO (comentada L20) |
| `planificacion_sistema` | `apps.gestion_estrategica.planificacion_sistema` | NO (comentada L20) |
| `revision_direccion` | `apps.gestion_estrategica.revision_direccion` | NO (comentada L20) |

### audit_system (contenedor con apps.py propio)

| Sub-app | Path en settings | Está en TENANT_APPS? |
|---------|-----------------|---------------------|
| `logs_sistema` | `apps.audit_system.logs_sistema` | Sí (LIVE L12) |
| `config_alertas` | `apps.audit_system.config_alertas` | Sí (LIVE L12) |
| `centro_notificaciones` | `apps.audit_system.centro_notificaciones` | Sí (LIVE L12) |
| `tareas_recordatorios` | `apps.audit_system.tareas_recordatorios` | Sí (LIVE L12) |

Nota: `audit_system` tiene apps.py en la raíz pero en settings se registran sus sub-apps, no el contenedor raíz.

### workflow_engine

| Sub-app | Path en settings | Está en TENANT_APPS? |
|---------|-----------------|---------------------|
| `disenador_flujos` | `apps.workflow_engine.disenador_flujos` | Sí (LIVE L12) |
| `ejecucion` | `apps.workflow_engine.ejecucion` | Sí (LIVE L12) |
| `monitoreo` | `apps.workflow_engine.monitoreo` | Sí (LIVE L12) |
| `firma_digital` | `apps.workflow_engine.firma_digital` | Sí (LIVE L12) |

### analytics (contenedor con apps.py propio)

| Sub-app | Path en settings | Está en TENANT_APPS? |
|---------|-----------------|---------------------|
| `config_indicadores` | `apps.analytics.config_indicadores` | Sí (excepción temprana — no depende de C2) |
| `exportacion_integracion` | `apps.analytics.exportacion_integracion` | Sí (excepción temprana) |
| `indicadores_area` | `apps.analytics.indicadores_area` | NO (comentada L50) |
| `acciones_indicador` | `apps.analytics.acciones_indicador` | NO (comentada L50) |
| `dashboard_gerencial` | `apps.analytics.dashboard_gerencial` | NO (comentada L50) |
| `generador_informes` | `apps.analytics.generador_informes` | NO (comentada L50) |
| `analisis_tendencias` | `apps.analytics.analisis_tendencias` | NO (comentada L50) |

### mi_equipo (app plana + sub-apps)

| Sub-app | Path en settings | Está en TENANT_APPS? |
|---------|-----------------|---------------------|
| `estructura_cargos` | `apps.mi_equipo.estructura_cargos` | Sí (LIVE L20) |
| `seleccion_contratacion` | `apps.mi_equipo.seleccion_contratacion` | Sí (LIVE L20) |
| `colaboradores` | `apps.mi_equipo.colaboradores` | Sí (LIVE L20) |
| `onboarding_induccion` | `apps.mi_equipo.onboarding_induccion` | Sí (LIVE L20) |

### supply_chain

| Sub-app | Path en settings | Está en TENANT_APPS? |
|---------|-----------------|---------------------|
| `catalogos` | `apps.supply_chain.catalogos` | Sí (LIVE C2) |
| `gestion_proveedores` | `apps.supply_chain.gestion_proveedores` | Sí (LIVE C2) |
| `recepcion` | `apps.supply_chain.recepcion` | Sí (LIVE C2) |
| `liquidaciones` | `apps.supply_chain.liquidaciones` | Sí (LIVE C2) |
| `almacenamiento` | `apps.supply_chain.almacenamiento` | Sí (LIVE C2) |
| `compras` | `apps.supply_chain.compras` | Sí (solo integridad referencial — sin URLs) |

### motor_cumplimiento

| Sub-app | Path en settings | Está en TENANT_APPS? |
|---------|-----------------|---------------------|
| `matriz_legal` | `apps.motor_cumplimiento.matriz_legal` | NO (comentada L25) |
| `requisitos_legales` | `apps.motor_cumplimiento.requisitos_legales` | NO (comentada L25) |
| `reglamentos_internos` | `apps.motor_cumplimiento.reglamentos_internos` | NO (comentada L25) |
| `evidencias` | `apps.motor_cumplimiento.evidencias` | NO (comentada L25) |

### motor_riesgos

| Sub-app | Path en settings | Está en TENANT_APPS? |
|---------|-----------------|---------------------|
| `riesgos_procesos` | `apps.motor_riesgos.riesgos_procesos` | NO (comentada L25) |
| `ipevr` | `apps.motor_riesgos.ipevr` | NO (comentada L25) |
| `aspectos_ambientales` | `apps.motor_riesgos.aspectos_ambientales` | NO (comentada L25) |
| `riesgos_viales` | `apps.motor_riesgos.riesgos_viales` | NO (comentada L25) |
| `seguridad_informacion` | `apps.motor_riesgos.seguridad_informacion` | NO (comentada L25) |
| `sagrilaft_ptee` | `apps.motor_riesgos.sagrilaft_ptee` | NO (comentada L25) |

### hseq_management

| Sub-app | Está en TENANT_APPS? |
|---------|---------------------|
| `accidentalidad` | NO (comentada L30) |
| `seguridad_industrial` | NO (comentada L30) |
| `higiene_industrial` | NO (comentada L30) |
| `medicina_laboral` | NO (comentada L30) |
| `emergencias` | NO (comentada L30) |
| `gestion_ambiental` | NO (comentada L30) |
| `calidad` | NO (comentada L30) |
| `mejora_continua` | NO (comentada L30) |
| `gestion_comites` | NO (comentada L30) |

### talent_hub

| Sub-app | Está en TENANT_APPS? |
|---------|---------------------|
| `novedades` | NO (comentada L60) |
| `formacion_reinduccion` | NO (comentada L60) |
| `desempeno` | NO (comentada L60) |
| `control_tiempo` | NO (comentada L60) |
| `nomina` | NO (comentada L60) |
| `proceso_disciplinario` | NO (comentada L60) |
| `off_boarding` | NO (comentada L60) |
| `consultores_externos` | NO (comentada L60) |

### production_ops, logistics_fleet, sales_crm

| Contenedor | Sub-apps | Están en TENANT_APPS? |
|------------|----------|-----------------------|
| `production_ops` | recepcion, procesamiento, producto_terminado, mantenimiento | NO (comentadas L35) |
| `logistics_fleet` | gestion_flota, gestion_transporte | NO (comentadas L35) |
| `sales_crm` | gestion_clientes, pipeline_ventas, pedidos_facturacion, servicio_cliente | NO (comentadas L35) |

### administracion, tesoreria, accounting

| Contenedor | Sub-apps | Están en TENANT_APPS? |
|------------|----------|-----------------------|
| `administracion` | presupuesto, activos_fijos, servicios_generales | NO (comentadas L45) |
| `tesoreria` | tesoreria | NO (comentada L45) |
| `accounting` | config_contable, movimientos, informes_contables, integracion | NO (comentada L45) |

### gamificacion

| Sub-app | Está en TENANT_APPS? |
|---------|---------------------|
| `juego_sst` | NO (comentada — pendiente refactor completo) |

---

## Nota sobre apps con presencia especial

### mi_portal
- Tiene `apps.py` en `backend/apps/mi_portal/` (Tipo A)
- **NO está en TENANT_APPS** en `base.py`
- Tiene URLs activas montadas en el router
- Contradicción: el frontend tiene feature module `mi-portal/` y el sidebar la expone
- Estado: INCIERTO — ver hallazgo en `docs/architecture/PERIMETRO-LIVE.md`

### apps.supply_chain.compras
- Está en TENANT_APPS pero sin URLs montadas ni sidebar expuesto
- Propósito: solo integridad referencial del FK `VoucherRecepcion.orden_compra`
- No se considera "funcionalmente LIVE"

---

## Resumen

| Categoría | Cantidad |
|-----------|----------|
| Apps planas Tipo A en SHARED_APPS | 2 (tenant, shared_library) |
| Apps planas Tipo A en TENANT_APPS activas | 5 (core, ia, catalogo_productos, mi_equipo, mi_portal*) |
| Contenedores Tipo B | 13 |
| Sub-apps Tipo C LIVE (en TENANT_APPS) | ~28 |
| Sub-apps Tipo C DORMIDAS (comentadas) | ~55 |

---

## Regla de mantenimiento

Este documento es fuente de verdad para el inventario de apps Django.
Debe actualizarse en el mismo PR cada vez que cambie:
- Se cree una nueva app Django (nueva carpeta con apps.py)
- Se active o desactive una app en `settings/base.py`
- Se elimine una app

Última actualización: 2026-04-20
Responsable: quien abre el PR que dispara el cambio.
