# Perímetro LIVE — Estado al 2026-04-19 (post-S6)

## Principio rector
El repo no es la verdad. Lo LIVE es la verdad.
Solo el código activo en TENANT_APPS se mantiene. El resto es borrador.

## Composición LIVE
- **CURRENT_DEPLOY_LEVEL:** 20 (core obligatorio — cascada lineal)
- **17 apps de cimientos** (L0, L10, L12, L15)
- **4 sub-apps de mi_equipo** (L20)
- **2 excepciones de analytics** (config_indicadores, exportacion_integracion)
- **6 sub-apps supply_chain** (módulo C2 activo fuera de cascada — ver sección abajo)

## Módulos C2 activos (fuera de cascada lineal)

A partir de 2026-04-19 (S6), los módulos C2 se activan por **feature flag**
(presencia en TENANT_APPS + registro en sidebar vía SystemModule) cuando sus
dependencias están satisfechas, sin requerir activación lineal L25→L30→L35.

| Módulo | Capa | Dependencias satisfechas | Activado | Sub-apps en TENANT_APPS |
|--------|------|---------------------------|----------|-------------------------|
| supply_chain | C2 | C0 (core) + C1 (configuracion, organizacion, identidad, contexto) + CT (gestion_documental, workflow_engine, catalogo_productos) | 2026-04-19 | catalogos, gestion_proveedores, recepcion, liquidaciones, almacenamiento, compras* |

\* `compras` registrada **solo para integridad referencial** del FK
`VoucherRecepcion.orden_compra → compras.OrdenCompra`. URLs NO montadas,
sidebar NO expone, funcionalidad dormida. Reescritura futura.

### Doctrina de activación (post-S6 — validada vs Saleor/Wagtail/Odoo)

El sistema separa **3 conceptos con responsabilidades distintas**, NO 3 gates:

| Concepto | Significado | Fuente técnica |
|----------|-------------|----------------|
| **Codebase LIVE** | "StrateKaz soporta este módulo en producción" | `TENANT_APPS` en base.py + `SystemModule.is_enabled=True` (vía seed) |
| **Licensing comercial** | "Este tenant pagó por este módulo" | `Tenant.enabled_modules` JSONField + `Plan.features` fallback |
| **RBAC acceso** | "Este cargo puede ver esta sección" | `CargoSectionAccess` (granular por sección) |

**Empty `enabled_modules` + empty `Plan.features` = sin filtro.** El tenant
ve TODOS los módulos LIVE. Es la doctrina "módulos universales post-deploy".

### Flujo de liberación de nuevo módulo

```
1. Descomentar app en base.py TENANT_APPS
2. makemigrations + migrate_schemas
3. Editar seed_estructura_final.py: is_enabled: True en el bloque del módulo
4. Deploy VPS → deploy_seeds_all_tenants propaga a todos los tenants
5. Módulo visible universalmente
```

Tras el deploy, el tenant admin puede opcionalmente **restringir** módulos
via Admin Global → Tenant → TabModulos (licensing comercial). Por default,
todo lo LIVE es visible.

Alineación con mercado:
- **Saleor**: features instaladas = universales, permissions controlan acceso
- **Wagtail**: plugins registrados = activos en todos los sites
- **Odoo**: modules "Installed" = disponibles, per-company activation opcional
- **Shopify**: apps publicadas = disponibles para todos los merchants

### Apps LIVE detalladas

| Nivel | App | Modelos | Archivos test | Migraciones |
|-------|-----|---------|---------------|-------------|
| L0 | core | 37 | 10 | 11 (todas aplicadas) |
| L0 | ia | 2 | 2 | 1 (aplicada) |
| L0 | tenant | 7 | 1 | 5 (todas aplicadas) |
| L12 | logs_sistema | 5 | 2 | 2 (todas aplicadas) |
| L12 | config_alertas | 4 | 2 | 1 (aplicada) |
| L12 | centro_notificaciones | 4 | 2 | 1 (aplicada) |
| L12 | tareas_recordatorios | 4 | 2 | 1 (aplicada) |
| L10 | configuracion | 11 | 3 | 3 (todas aplicadas) |
| L10 | organizacion | 14 | 2 | 2 (todas aplicadas) |
| L10 | identidad | 3 | 0 | 1 (aplicada) |
| L10 | contexto | 13 | 0 | 2 (todas aplicadas) |
| L10 | encuestas | 5 | 1 | 2 (todas aplicadas) |
| L12 | disenador_flujos | 9 | 2 | 2 (todas aplicadas) |
| L12 | ejecucion | 5 | 1 | 1 (aplicada) |
| L12 | monitoreo | 5 | 1 | 1 (aplicada) |
| L12 | firma_digital | 8 | 0 | 8 (todas aplicadas) |
| L15 | gestion_documental | 8 | 1 | 21 (todas aplicadas) |
| L20 | mi_equipo (raíz) | 0 | 7 | sin migraciones |
| L20 | estructura_cargos | 4 | 2 | 1 (aplicada) |
| L20 | seleccion_contratacion | 13 | 2 | 1 (aplicada) |
| L20 | colaboradores | 4 | 2 | 1 (aplicada) |
| L20 | onboarding_induccion | 8 | 1 | 2 (todas aplicadas) |

**Totales:** 173 modelos, 46 archivos de test, 69 migraciones (todas aplicadas).

## Estado estructural
- ✅ 0 migraciones pendientes
- ✅ manage.py check limpio (0 issues, 0 silenced)
- ✅ makemigrations --dry-run sin cambios
- ✅ Frontend y backend alineados en CURRENT_DEPLOY_LEVEL

## Estado de tests (clasificación PROVISORIA — sin tests funcionando)

### Resultados por app

| App | Framework | Pass | Skip | Error | Tiempo |
|-----|-----------|------|------|-------|--------|
| core (migrado) | manage.py test | 6 | 0 | 0 | 278.9s |
| core (legacy) | pytest | 0 | 143 | 17 | 92.3s |
| ia | pytest | 0 | 0 | 35 | 398.8s |
| tenant | pytest | 0 | 0 | 30 | 185.9s |
| audit_system (4 sub) | pytest | 0 | 0 | 195 | 212.8s |
| configuracion | pytest | 37 | 0 | 44 | 265.7s |
| organizacion | pytest | 0 | 0 | 29 | 350.3s |
| identidad | — | — | — | — | sin tests |
| contexto | — | — | — | — | sin tests |
| encuestas | pytest | 0 | 0 | 42 | 27.6s |
| workflow_engine (4 sub) | pytest | 0 | 0 | 58 | 193.1s |
| gestion_documental | pytest | 0 | 0 | 32 | 280.5s |
| mi_equipo completo | pytest | 0 | 0 | 191 | 491.0s |

### 🟢 Sólido (con evidencia automatizada)
Ninguna app. Cero confianza automatizada hoy.

### 🟡 Aparentemente funcionando (sin tests que lo prueben)
- core (6 tests migrados pasan en 278s, resto de tests legacy rotos)
- ia, tenant, audit_system (4 sub), configuracion, organizacion,
  encuestas, workflow_engine (4 sub), gestion_documental
- mi_equipo: estructura_cargos, seleccion_contratacion, colaboradores,
  onboarding_induccion

### 🔴 Riesgo identificado
- **firma_digital**: 0 archivos de test, 8 modelos, EN USO EN PRODUCCIÓN.
  Es uno de los USPs del producto (firma digital con validez legal,
  Ley 527/1999). PRIORIDAD MÁS ALTA después de arreglar infra de test.
- **identidad**: 0 archivos de test, 3 modelos.
- **contexto**: 0 archivos de test, 13 modelos.

## Causa raíz común
~525 de los ~530 tests del perímetro LIVE fallan con el mismo tipo de error:
infraestructura de test multi-tenant rota (DB de test no se crea, tests no
heredan de BaseTenantTestCase, o ambos). NO son fallas de lógica de negocio.

Evidencia: los 37 tests de configuracion que SÍ pasan son justamente los
que no tocan modelos tenant.

## Plan de cierre (3 sesiones)
1. **Sesión 1:** Diagnosticar y arreglar infra de test multi-tenant.
   Un solo objetivo, un solo problema.
2. **Sesión 2:** Correr la suite completa con infra arreglada.
   Reclasificar 🟢🟡🔴 con datos reales. Identificar 🔴 escondidos.
3. **Sesión 3:** Cerrar 🔴 confirmados + escribir tests para
   firma_digital, identidad, contexto.

## Definición de "perímetro LIVE sólido"
Cuando podamos correr la suite completa de las 21 apps LIVE en menos
de 5 minutos, con >80% pasando, y los 3 agujeros sin tests cerrados.
Recién ahí tiene sentido pensar en activar L25.
