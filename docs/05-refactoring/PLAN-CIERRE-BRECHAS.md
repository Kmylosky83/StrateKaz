# Tracker de Brechas

> **Version:** 3.1 | **Fecha:** 2026-02-08

Este documento trackea brechas tecnicas puntuales (B-XXX). Para el **plan maestro** de 80+ gaps organizados en 10 sprints, ver [PLAN-MEJORAS-CONSOLIDADO.md](PLAN-MEJORAS-CONSOLIDADO.md). Para estado general del proyecto ver [ESTADO-ACTUAL.md](ESTADO-ACTUAL.md).

---

## Brechas Activas

### P0 - Bloquean Produccion

| ID | Brecha | Apps Afectadas | Estado |
|----|--------|----------------|--------|
| B-001 | Frontend incompleto Tabs 5-8 | Gestion Documental, Planificacion Sistema, Gestion Proyectos | Parcial (Revision Direccion completada Sprint 4) |
| B-002 | Sin validacion de transiciones de estado | Planificacion Sistema, Gestion Proyectos | Parcial (Revision Direccion usa ConfirmDialog + hooks) |
| B-003 | Control de acceso granular a archivos incompleto | Gestion Documental | Pendiente |

### P1 - Reducen Calidad

| ID | Brecha | Apps Afectadas | Estado |
|----|--------|----------------|--------|
| B-004 | Sistema de notificaciones incompleto | Planeacion Estrategica, Revision Direccion | 50% (backend listo, falta integracion) |
| B-005 | JSONField de plantillas sin validacion de esquema | Gestion Documental | Pendiente |
| B-006 | Division por cero en meta cuantitativa | Planificacion Sistema | Pendiente |
| B-007 | Temas ISO hardcodeados (deberian ser configurables) | Revision Direccion | Pendiente |

### P2 - Mejoras Futuras

| ID | Brecha | Apps Afectadas | Estado |
|----|--------|----------------|--------|
| B-008 | Performance con 100+ areas en canvas | Organizacion | Pendiente |
| B-009 | Dashboard monitoreo integraciones | Configuracion | Pendiente |
| B-010 | Validacion de ciclos en predecesoras M2M | Gestion Proyectos | Pendiente |
| B-011 | Campos legacy espanol (`activo`/`creado_por` → `is_active`/`created_by`) | 21 archivos, 13 modelos | Pendiente. Ver [CONVENCIONES seccion 8](../02-desarrollo/CONVENCIONES-NOMENCLATURA.md) |

### P0 - Nuevos Blockers (detectados 2026-02-08)

| ID | Brecha | Apps Afectadas | Estado |
|----|--------|----------------|--------|
| B-012 | `settings.py` monolitico usa MySQL (linea 261) - produccion via Passenger lo carga | config/settings.py, passenger_wsgi.py, wsgi.py, celery.py, asgi.py | **BLOCKER** - settings/ modulares ya usan PostgreSQL correctamente |
| B-013 | `.env.production.example` apunta a `config.settings` (monolitico MySQL) | .env.production.example | Pendiente - actualizar a `config.settings.production` |

---

## Historial de Cierre

| Fecha | Item | Detalle |
|-------|------|---------|
| 2026-02-02 | Seguridad Multi-Tenant | TenantMiddleware, TenantAwareManager, ActiveManager, tests aislamiento, deleted_by |
| 2026-02-06 | Categorias modulos → ingles | STRATEGIC, COMPLIANCE, INTEGRATED, OPERATIONAL, SUPPORT, INTELLIGENCE |
| 2026-02-06 | Convencion nomenclatura v2.0 | All-English code standard documentado |
| 2026-02-06 | Documentacion reorganizada | ~95 → 43 archivos, 5 directorios numerados |
| 2026-02-08 | Sprint 1: Workflow Engine Execution | 6 node handlers, auto-advance, SLA monitoring |
| 2026-02-08 | Sprint 2: BI/Analytics + HSEQ | CrossModuleStatsService, 5 HSEQ pages con datos reales |
| 2026-02-08 | Sprint 3: Frontend Workflow | React Flow Designer, DynamicFormRenderer |
| 2026-02-08 | Sprint 4: Revision por Direccion | ProgramacionFormModal, ActasTab, CompromisoDetailModal, Celery tasks |

---

## Checklist Pre-Deploy

**Codigo:**
- [ ] Sin console.log en produccion
- [ ] TypeScript sin errores (`npm run build`)
- [ ] ESLint sin warnings

**Seguridad:**
- [ ] Aislamiento multi-tenant verificado
- [ ] Permisos RBAC validados
- [ ] Sin datos sensibles en logs

**Performance:**
- [ ] Bundle < 400KB
- [ ] Lighthouse > 90

---

## Como Usar Este Tracker

**Agregar brecha:** Asignar ID correlativo (B-XXX), clasificar P0/P1/P2, agregar a tabla correspondiente.

**Trabajar brecha:** Cambiar estado en la tabla (Pendiente → En progreso → %).

**Cerrar brecha:** Mover fila de "Activas" a "Historial de Cierre" con fecha. Si estaba en [ESTADO-ACTUAL.md](ESTADO-ACTUAL.md), mover a "Migraciones Completadas".
