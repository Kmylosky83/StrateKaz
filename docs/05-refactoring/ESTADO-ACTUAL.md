# Estado Actual del Proyecto

> **Version:** 4.2.0 | **Fecha:** 2026-02-08

## Resumen

StrateKaz v4.2.0 opera con **17 modulos y ~81 sub-apps** organizadas en 7 niveles (NIVEL 0-6). Arquitectura: **Monolito Modular + Multi-tenant** (PostgreSQL schemas con django-tenants). Plan de mejora de 10 sprints en ejecucion - 4 completados. Ver [PLAN-MEJORAS-CONSOLIDADO.md](PLAN-MEJORAS-CONSOLIDADO.md) para el plan maestro.

## Estado por Nivel

| Nivel | Modulo | Backend | Frontend | Estado |
|-------|--------|---------|----------|--------|
| **0** | Core (RBAC, Users, Menu) | 100% | 100% | Produccion |
| **0** | Tenant (Multi-tenant) | 100% | 95% | Produccion |
| **1** | Gestion Estrategica | 95% | 85% | Sprint 4 completado |
| **2** | Motor Cumplimiento | 80% | 60% | En desarrollo |
| **2** | Motor Riesgos | 85% | 65% | En desarrollo |
| **2** | Workflow Engine | 90% | 75% | Sprint 1+3 completados |
| **3** | HSEQ Management | 80% | 70% | Sprint 2 completado |
| **4** | Supply Chain | 60% | 40% | Estructura base |
| **4** | Production Ops | 50% | 30% | Estructura base |
| **4** | Logistics/Fleet | 50% | 30% | Estructura base |
| **4** | Sales/CRM | 50% | 30% | Estructura base |
| **5** | Talent Hub | 60% | 35% | Estructura base |
| **5** | Admin/Finance | 50% | 30% | Estructura base |
| **5** | Accounting | 40% | 20% | Estructura base |
| **6** | Analytics/BI | 90% | 45% | Sprint 2 completado |
| **6** | Audit System | 80% | 70% | En refinamiento |

## Migraciones Completadas

- [x] MySQL → PostgreSQL + django-tenants
- [x] Multi-instancia → Multi-schema
- [x] RBAC v4.0 unificado
- [x] Settings monolitico → Modular (base/dev/prod/test)
- [x] Docker Compose completo (PostgreSQL, Redis, Celery, Flower)
- [x] Modulo de Perfil 100% (Avatar, 2FA, Preferencias, Sesiones)
- [x] Centro de Notificaciones funcional
- [x] Branding dinamico per-tenant
- [x] Categorias de modulos estandarizadas a ingles (STRATEGIC, COMPLIANCE, INTEGRATED, OPERATIONAL, SUPPORT, INTELLIGENCE)
- [x] Convencion de nomenclatura actualizada a all-English code (ver [CONVENCIONES-NOMENCLATURA.md](../02-desarrollo/CONVENCIONES-NOMENCLATURA.md))
- [x] Documentacion reorganizada (~95 → 43 archivos, 5 directorios numerados)
- [x] **Sprint 1**: Motor de ejecucion de workflows BPMN (6 node handlers, auto-advance, SLA monitoring)
- [x] **Sprint 2**: BI/Analytics backend + CrossModuleStatsService + HSEQ pages con datos reales
- [x] **Sprint 3**: Frontend Workflow (React Flow Designer, DynamicFormRenderer, 3 pages reescritas)
- [x] **Sprint 4**: Revision por la Direccion (ProgramacionFormModal, ActasTab, CompromisoDetailModal, Celery tasks)

## Brechas Activas

### Prioridad Alta
- [ ] Completar Admin Global (gestion de tenants desde UI)
- [x] ~~Flujos de aprobacion del Workflow Engine~~ (Sprint 1 - completado)
- [ ] Integracion completa Planeacion → Proyectos (FK faltante)
- [ ] Testing coverage (actualmente bajo)
- [ ] **BLOCKER**: `settings.py` monolitico tiene MySQL - produccion via Passenger usa este archivo

### Prioridad Media
- [ ] Sprint 5: Evidencia centralizada
- [ ] Sprint 6: Audit Trail completo
- [ ] Dashboard gerencial con KPIs reales (parcialmente completado Sprint 2)
- [ ] CI/CD con GitHub Actions
- [ ] Estandarizar campos `activo`/`creado_por` → `is_active`/`created_by` (21 archivos, 13 modelos)

### Prioridad Baja
- [ ] Modulos Nivel 4-5 (Supply Chain, Production, Talent Hub)
- [ ] Contabilidad (Nivel 5)
- [ ] Exportacion avanzada de informes
- [ ] App mobile (PWA funcional, nativa pendiente)
- [ ] Migrar campos legacy espanol → ingles (~1,200+ campos). Ver roadmap en [CONVENCIONES-NOMENCLATURA.md seccion 8](../02-desarrollo/CONVENCIONES-NOMENCLATURA.md)

## Tecnologias Actuales

| Componente | Tecnologia | Anterior |
|------------|-----------|----------|
| Base de datos | PostgreSQL 15 + django-tenants | MySQL 8.0 |
| Multi-tenant | Schemas PostgreSQL | 1 BD por empresa |
| Deployment | Docker Compose | VPS + Supervisor |
| Settings | Modular (base/dev/prod) | Monolitico |
| Process Manager | Docker | Supervisor |

## Proceso de Gestion de Brechas

Detalle de brechas tecnicas con IDs en [PLAN-CIERRE-BRECHAS.md](PLAN-CIERRE-BRECHAS.md). Para el plan maestro de 80+ gaps y 10 sprints, ver [PLAN-MEJORAS-CONSOLIDADO.md](PLAN-MEJORAS-CONSOLIDADO.md).

### Agregar una brecha
1. Asignar ID correlativo (B-XXX) en PLAN-CIERRE-BRECHAS.md
2. Clasificar prioridad (P0/P1/P2)
3. Si es P0, agregar tambien en "Brechas Activas > Prioridad Alta" de este documento

### Cerrar una brecha
1. Mover de "Activas" a "Historial de Cierre" en PLAN-CIERRE-BRECHAS.md con fecha
2. Si estaba en este documento, mover a "Migraciones Completadas"
3. Eliminar docs temporales relacionados de `05-refactoring/` si ya no aplican

### Limpieza de docs
- Documentos 100% completados en `05-refactoring/` se eliminan en la siguiente release
- Docs de `01-arquitectura/` y `02-desarrollo/` NUNCA se eliminan sin reemplazar
- Auditorias se marcan como "Snapshot historico" pero se conservan como referencia
