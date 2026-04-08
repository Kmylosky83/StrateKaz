---
name: reorganizacion-c1-pe-sgi
description: Arquitectura Cascada V3 — sidebar layers, deploy levels PHVA completo, desacople Mi Equipo
type: project
---

# Arquitectura Cascada V4 (actualizada 2026-04-04)

> **Estado:** Level 20 ACTIVADO. L0 (C0) + L10 (C1) + L12+L15 (CT) + L20 (C2).
> **Próximo:** L25 (Planificación Operativa).
> **Fuente de verdad backend:** `SIDEBAR_LAYERS` en `viewsets_config.py` + `TENANT_APPS` en `base.py`

## Filosofía

La cascada guía al empresario colombiano paso a paso, en el orden natural de constitución y operación. Cada nivel consume del anterior, nunca al revés. Zero circularidad. Ciclo PHVA cerrado con 4 fases reales. Los módulos transversales (CT: workflows, gestión documental) se activan ANTES de los C2 porque son infraestructura que todos consumen.

## 6 Capas Arquitectónicas

```
C0 — PLATAFORMA          (core, tenant, audit_system)
C1 — FUNDACIÓN            (configuracion, organizacion, identidad, contexto)
CT — TRANSVERSAL          (gestion_documental, workflow_engine)
C2 — NEGOCIO (12 módulos) (planeacion, cumplimiento, riesgos, hseq, supply, talent, etc.)
C3 — INTELIGENCIA         (analytics, revision_direccion)
```

**Reglas clave:**
- CT sirve a C2 — cualquier C2 consume documentos, firmas y workflows
- CT NUNCA importa de C2 — gestion_documental no depende de talent_hub ni supply_chain
- C2 NUNCA importa de otro C2 — `apps.get_model()` + IntegerField

## Sidebar: 12 Capas Visuales (SIDEBAR_LAYERS)

| # | Phase | Capa Sidebar | Código | Módulos | Color |
|---|-------|-------------|--------|---------|-------|
| 1 | PLANEAR | Fundación | NIVEL_FUNDACION | `fundacion` | `#3B82F6` |
| 2 | PLANEAR | Infraestructura | NIVEL_INFRAESTRUCTURA | `gestion_documental` | `#6366F1` |
| 3 | PLANEAR | Mi Equipo | NIVEL_EQUIPO | `mi_equipo` | `#0EA5E9` |
| 4 | PLANEAR | Planificación | NIVEL_PLANIFICACION | `planificacion_operativa`, `planeacion_estrategica` | `#6366F1` |
| 5 | HACER | Protección y Cumplimiento | NIVEL_PROTECCION | `proteccion_cumplimiento` | `#F59E0B` |
| 6 | HACER | Gestión Integral | NIVEL_HSEQ | `gestion_integral` | `#10B981` |
| 7 | HACER | Cadena de Valor | NIVEL_CADENA | `supply_chain`, `production_ops`, `logistics_fleet`, `sales_crm` | `#10B981` |
| 8 | HACER | Gestión del Talento | NIVEL_TALENTO | `talent_hub` | `#8B5CF6` |
| 9 | HACER | Soporte | NIVEL_SOPORTE | `administracion`, `tesoreria`, `accounting` | `#F59E0B` |
| 10 | VERIFICAR | Inteligencia | NIVEL_INTELIGENCIA | `analytics`, `revision_direccion`, `acciones_mejora`, `audit_system` | `#8B5CF6` |
| 11 | TRANSVERSAL | Flujos de Trabajo | NIVEL_WORKFLOWS | `workflow_engine` | `#0891B2` |
| 12 | TRANSVERSAL | Configuración | NIVEL_CONFIG | `configuracion_plataforma` | `#64748B` |

## Deploy Cascade V4: Niveles

| Level | Capa | Nombre | Apps | Estado |
|-------|------|--------|------|--------|
| 0 | C0 | Core | `core`, `ia` | LIVE |
| 10 | C1 | Fundación | configuracion, organizacion, identidad, contexto, encuestas | LIVE |
| 12 | CT | Transversal | 4× workflow_engine + 4× audit_system + 2× analytics (config+export) | LIVE |
| 15 | CT | Gestión Documental | gestion_documental (1 app, 7 modelos, 8 fases) | LIVE |
| 20 | C2 | Mi Equipo | `mi_equipo` + estructura_cargos, seleccion_contratacion, colaboradores, onboarding_induccion | LIVE |
| 25 | Planificación Operativa | planificacion_sistema | Pendiente |
| 30 | Planeación Estratégica | planeacion, gestion_proyectos, revision_direccion | Pendiente |
| 35 | Protección y Cumplimiento | 4× motor_cumplimiento + 6× motor_riesgos | Pendiente |
| 40 | Gestión Integral HSEQ | 9× hseq_management | Pendiente |
| 50-53 | Cadena de Valor | supply_chain(50), production_ops(51), logistics_fleet(52), sales_crm(53) | Pendiente |
| 60 | Talento — Gestión Continua | formacion, desempeno, control_tiempo, nomina, disciplinario, off_boarding | Pendiente |
| 70-72 | Soporte | administracion(70), tesoreria(71), accounting(72) | Pendiente |
| 80 | Inteligencia | analytics restante (indicadores, dashboard, informes, tendencias) | Pendiente |
| 85 | Revisión por la Dirección | revision_direccion (UI separada) | Pendiente |
| 90 | Acciones de Mejora | NC, correctivas, oportunidades (fase ACTUAR) | Pendiente |

## Desacople Mi Equipo (V3 nuevo)

- **`apps/mi_equipo/`** = app Django propia (L20), independiente de talent_hub
- Views, serializers, URLs propias en `/api/mi-equipo/`
- Consume modelos de talent_hub vía `apps.get_model()` (regla C2→C2)
- **L20 activa**: mi_equipo + estructura_cargos + seleccion_contratacion + colaboradores + onboarding_induccion + novedades
- **L60 activa**: formacion + desempeno + control_tiempo + nomina + disciplinario + off_boarding
- Mismos modelos, misma BD — solo vistas y lógica separadas

## Cambios V4 vs V3

- **Capa CT creada**: gestion_documental + workflow_engine reclasificados de C2 a CT (Infraestructura Transversal)
- **Razón**: GD y workflows son consumidos por TODOS los C2, no son módulos de negocio independientes
- **Sin cambios de código**: viewsets_config.py y modules.ts ya los trataban como transversales (NIVEL_INFRAESTRUCTURA + NIVEL_WORKFLOWS)
- **Solo documentación**: CLAUDE.md, MEMORY.md, reorganizacion-c1-pe-sgi.md actualizados

## Cambios V3 vs V2.1

- **Mi Equipo**: L35 → L20. App propia `apps/mi_equipo/`. URL `/api/mi-equipo/` (era `/api/talent-hub/mi-equipo/`).
- **Deploy levels**: Todos reajustados (ver tabla). Cadena de Valor ahora L50-53. Talento L60. Soporte L70-72.
- **PHVA completo**: P(L10-L30) → H(L35-L72) → V(L80-L85) → A(L90)
- **Bugs corregidos**: estado 'pendiente'→'solicitada'/'solicitado', is_externo, dias_solicitados→dias_habiles, N+1, DecimalField→Float, seguridad área=None

## Deuda Técnica

- **DOFA/TOWS**: Modelos en app `contexto` → mover a `planeacion` al activar Level 30
- **firma_digital**: Usa `BaseCompanyModel` en vez de `TenantModel`. Funciona pero inconsistente.
- **Seed category**: `configuracion_plataforma` usa `INFRASTRUCTURE` pero `CATEGORY_CHOICES` no lo incluye formalmente.
- **Stubs MSS**: AsistenciaEquipoView y EvaluacionesEquipoView retornan datos placeholder. Integrar con control_tiempo (L60) y desempeno (L60).
