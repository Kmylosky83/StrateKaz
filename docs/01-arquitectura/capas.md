# Capas del Proyecto — StrateKaz
**Última actualización:** 2026-04-20

Nota: `docs/01-arquitectura/ARQUITECTURA-CASCADA-V2.md` (versión 2.0.0, 2026-03-15)
documenta la filosofía completa de cascada. Este archivo es el mapa operativo de
capas → apps, mantenido sincronizado con `base.py`. No duplicar la filosofía aquí.

---

## Las 6 capas + Portales

| Capa | Nombre | Propósito |
|------|--------|-----------|
| C0 | Plataforma | Infraestructura central: auth, RBAC, tenant, audit, monitoring. Nunca se toca en sprints de módulo. |
| C1 | Fundación | Configuración organizacional — se define 1 vez, afecta a todos los módulos C2 |
| CT | Infraestructura transversal | Gestión documental + Workflow Engine — todos los C2 consumen, CT nunca importa de C2 |
| C2 | Módulos de negocio | Los módulos independientes de negocio (supply_chain LIVE; resto DORMIDO) |
| C3 | Inteligencia | Analytics y reporting — solo lee de C2 y CT, nunca escribe |
| Portales | UI sin lógica propia | Mi Portal, Mi Equipo, Portal Proveedores, Portal Clientes, Admin Global |

---

## Mapa capa → apps

### C0 — Plataforma

| App | Path en settings | Nivel |
|-----|-----------------|-------|
| `core` | `apps.core` | L0 |
| `ia` | `apps.ia` | L0 |
| `tenant` | `apps.tenant` (SHARED) | L0 |
| `shared_library` | `apps.shared_library` (SHARED) | L0 |
| `audit_system.logs_sistema` | `apps.audit_system.logs_sistema` | L12 |
| `audit_system.config_alertas` | `apps.audit_system.config_alertas` | L12 |
| `audit_system.centro_notificaciones` | `apps.audit_system.centro_notificaciones` | L12 |
| `audit_system.tareas_recordatorios` | `apps.audit_system.tareas_recordatorios` | L12 |

### C1 — Fundación

| App | Path en settings | Nivel |
|-----|-----------------|-------|
| `configuracion` | `apps.gestion_estrategica.configuracion` | L10 |
| `organizacion` | `apps.gestion_estrategica.organizacion` | L10 |
| `identidad` | `apps.gestion_estrategica.identidad` | L10 |
| `contexto` | `apps.gestion_estrategica.contexto` | L10 |
| `encuestas` | `apps.gestion_estrategica.encuestas` | L10 |

### CT — Infraestructura transversal

| App | Path en settings | Nivel |
|-----|-----------------|-------|
| `gestion_documental` | `apps.gestion_estrategica.gestion_documental` | L15 |
| `catalogo_productos` | `apps.catalogo_productos` | L15 |
| `workflow_engine.disenador_flujos` | `apps.workflow_engine.disenador_flujos` | L12 |
| `workflow_engine.ejecucion` | `apps.workflow_engine.ejecucion` | L12 |
| `workflow_engine.monitoreo` | `apps.workflow_engine.monitoreo` | L12 |
| `workflow_engine.firma_digital` | `apps.workflow_engine.firma_digital` | L12 |

### C2 — Módulos de negocio

#### LIVE (activos en TENANT_APPS)

| App | Path en settings | Módulo | Activado |
|-----|-----------------|--------|---------|
| `mi_equipo` | `apps.mi_equipo` | Mi Equipo (portal) | L20 (2026-03) |
| `mi_equipo.estructura_cargos` | `apps.mi_equipo.estructura_cargos` | Mi Equipo | L20 |
| `mi_equipo.seleccion_contratacion` | `apps.mi_equipo.seleccion_contratacion` | Mi Equipo | L20 |
| `mi_equipo.colaboradores` | `apps.mi_equipo.colaboradores` | Mi Equipo | L20 |
| `mi_equipo.onboarding_induccion` | `apps.mi_equipo.onboarding_induccion` | Mi Equipo | L20 |
| `supply_chain.catalogos` | `apps.supply_chain.catalogos` | Supply Chain | 2026-04-20 |
| `supply_chain.gestion_proveedores` | `apps.supply_chain.gestion_proveedores` | Supply Chain | 2026-04-20 |
| `supply_chain.recepcion` | `apps.supply_chain.recepcion` | Supply Chain | 2026-04-20 |
| `supply_chain.liquidaciones` | `apps.supply_chain.liquidaciones` | Supply Chain | 2026-04-20 |
| `supply_chain.almacenamiento` | `apps.supply_chain.almacenamiento` | Supply Chain | 2026-04-20 |
| `supply_chain.compras` | `apps.supply_chain.compras` | Supply Chain | 2026-04-20 (solo FK) |

#### DORMIDOS (comentados en base.py)

| Módulo | Nivel de activación |
|--------|---------------------|
| gestion_estrategica.planeacion | L20 |
| gestion_estrategica.gestion_proyectos | L20 |
| gestion_estrategica.planificacion_sistema | L20 |
| gestion_estrategica.revision_direccion | L20 |
| motor_cumplimiento (4 sub-apps) | L25 |
| motor_riesgos (6 sub-apps) | L25 |
| hseq_management (9 sub-apps) | L30 |
| production_ops (4 sub-apps) | L35 |
| logistics_fleet (2 sub-apps) | L35 |
| sales_crm (4 sub-apps) | L35 |
| talent_hub (8 sub-apps) | L60 |
| administracion (3 sub-apps) | L45 |
| tesoreria.tesoreria | L45 |
| accounting (4 sub-apps) | L45 |
| gamificacion.juego_sst | INDEFINIDO (pendiente refactor) |

### C3 — Inteligencia

| App | Path en settings | Estado |
|-----|-----------------|--------|
| `analytics.config_indicadores` | `apps.analytics.config_indicadores` | LIVE (excepción temprana) |
| `analytics.exportacion_integracion` | `apps.analytics.exportacion_integracion` | LIVE (excepción temprana) |
| `analytics.indicadores_area` | `apps.analytics.indicadores_area` | DORMIDO (L50) |
| `analytics.acciones_indicador` | `apps.analytics.acciones_indicador` | DORMIDO (L50) |
| `analytics.dashboard_gerencial` | `apps.analytics.dashboard_gerencial` | DORMIDO (L50) |
| `analytics.generador_informes` | `apps.analytics.generador_informes` | DORMIDO (L50) |
| `analytics.analisis_tendencias` | `apps.analytics.analisis_tendencias` | DORMIDO (L50) |

Nota: `config_indicadores` y `exportacion_integracion` están activas como excepción
porque solo dependen de `core.Cargo` (C0), no de otros C2.

### Portales

| Portal | Estado | Observación |
|--------|--------|-------------|
| Mi Portal | LIVE (URLs activas) | `apps.mi_portal` — ver nota sobre TENANT_APPS |
| Mi Equipo | LIVE | Expuesto via `apps.mi_equipo` |
| Portal Proveedores | DORMIDO | Frontend stub en `features/proveedor-portal/` |
| Portal Clientes | DORMIDO | Frontend stub en `features/cliente-portal/` |
| Admin Global | LIVE | `features/admin-global/` — solo superadmin |

---

## Reglas de independencia

- **CT sirve a C2** — cualquier C2 puede consumir endpoints de CT (documentos, firmas, workflows)
- **CT NUNCA importa de C2** — `gestion_documental` y `workflow_engine` no importan de `talent_hub`, `supply_chain`, etc.
- **C2 NUNCA importa de otro C2** — Backend: `apps.get_model()` + `IntegerField`. Frontend: hooks `useSelect*`
- **C3 lee de C2 y CT** — vía API endpoints, nunca escribe en tablas de C2 ni CT
- **audit_system ≠ Auditoria Interna** — `audit_system` (C0) = logs/alertas del sistema. Auditoría Interna (C2, DORMIDA) = auditorías ISO

---

## Dónde está declarado en código

### SIDEBAR_LAYERS
Archivo: `backend/apps/core/viewsets_config.py`

```python
SIDEBAR_LAYERS = [
    {'code': 'NIVEL_FUNDACION',       'module_codes': ['fundacion'],                      'color': '#3B82F6'},
    {'code': 'NIVEL_INFRAESTRUCTURA', 'module_codes': ['gestion_documental', 'catalogo_productos'], 'color': '#6366F1'},
    {'code': 'NIVEL_EQUIPO',          'module_codes': ['mi_equipo'],                       'color': '#0EA5E9'},
    {'code': 'NIVEL_CADENA',          'module_codes': ['supply_chain'],                    'color': '#10B981'},
    {'code': 'NIVEL_INTELIGENCIA',    'module_codes': ['audit_system'],                    'color': '#8B5CF6'},
    {'code': 'NIVEL_WORKFLOWS',       'module_codes': ['workflow_engine'],                 'color': '#0891B2'},
    {'code': 'NIVEL_CONFIG',          'module_codes': ['configuracion_plataforma'],        'color': '#64748B'},
]
```

Solo contiene las capas con módulos LIVE. El sidebar renderiza según este orden.

### Nota sobre CURRENT_DEPLOY_LEVEL
No hay constante `CURRENT_DEPLOY_LEVEL` en `base.py`. El nivel activo se infiere
de los módulos descomentados en `TENANT_APPS`. La documentación en
`PERIMETRO-LIVE.md` declara el nivel como L20 (máximo activo en cascada lineal),
con supply_chain activo via feature-flag fuera de cascada.

---

## Regla de mantenimiento

Este documento es fuente de verdad para la arquitectura de capas.
Debe actualizarse en el mismo PR cada vez que cambie:
- Se active un módulo C2 nuevo (via feature-flag o cascada)
- Se mueva una app de capa (caso excepcional)
- Cambien las reglas de independencia
- Se modifique `SIDEBAR_LAYERS` en `viewsets_config.py`

Última actualización: 2026-04-22
Responsable: quien abre el PR que dispara el cambio.

---

## Nota — Decisiones 2026-04-22

### Sidebar V3 vs. capas arquitectónicas
Las capas arquitectónicas (C0/C1/CT/C2/C3/Portales) son **invisibles al
usuario final**. El sidebar V3 (ver `arquitectura-cascada.md` §Apéndice)
reorganiza módulos con narrativa de negocio, no con etiquetas técnicas.
Las capas se respetan en código (imports, reglas de independencia), no en UI.

### Datos maestros transversales → CT
Reafirmado en sesión 2026-04-22:
- **Proveedor** vive en CT (`apps.catalogo_productos.proveedores`) — migrado 2026-04-21
- **Cliente** DEBE vivir en CT cuando se active `sales_crm` (ver H-UI-07) —
  no repetir el anti-patrón de crearlo dentro de C2
- **Colaborador** sigue en `mi_equipo.colaboradores` (C2) por decisión operativa
  actual — tensión documentada, posible migración a CT en el futuro si se
  confirma que múltiples C2 lo consumen activamente

### Decisiones pendientes (ver `hallazgos-pendientes.md`)
- H-UI-01: Reorganización Sidebar V3 (orden + sub-separadores)
- H-UI-02: Redistribución UI de `audit_system` (diferido)
- H-UI-03: Rename "Catálogo de Productos" → "Catálogos Maestros"
- H-UI-04: Tab 4 Fundación "Políticas y Reglamentos"
- H-UI-05: Eliminar `ConsecutivoConfig` (Sistema B dormido)
- H-UI-06: Mi Muro (tercera landing)
- H-UI-07: Clientes a CT (preventivo)
- H-C1-01 a H-C1-05: Limpieza C1
