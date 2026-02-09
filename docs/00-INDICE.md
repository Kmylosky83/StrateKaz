# StrateKaz - Indice de Documentacion

> **Version:** 4.2.0 | **Fecha:** 2026-02-08

## Onboarding para Nuevos Desarrolladores

1. Leer [README.md](../README.md) - Vision general y quick start
2. Leer [01-arquitectura/ARQUITECTURA-SISTEMA.md](01-arquitectura/ARQUITECTURA-SISTEMA.md) - Arquitectura completa
3. Leer [01-arquitectura/MULTI-TENANT.md](01-arquitectura/MULTI-TENANT.md) - Sistema multi-tenant, auth dual, creacion asincrona
4. Leer [01-arquitectura/ADMIN-GLOBAL.md](01-arquitectura/ADMIN-GLOBAL.md) - Panel de superusuarios (frontend)
5. Leer [01-arquitectura/RBAC-SYSTEM.md](01-arquitectura/RBAC-SYSTEM.md) - Sistema de permisos 4 capas
6. Leer [02-desarrollo/POLITICAS-DESARROLLO.md](02-desarrollo/POLITICAS-DESARROLLO.md) - Convenciones del equipo
7. Leer [02-desarrollo/CONVENCIONES-NOMENCLATURA.md](02-desarrollo/CONVENCIONES-NOMENCLATURA.md) - Nomenclatura de codigo (todo en ingles)
8. Leer [04-devops/DOCKER-SETUP.md](04-devops/DOCKER-SETUP.md) - Levantar el entorno
9. Leer [05-refactoring/ESTADO-ACTUAL.md](05-refactoring/ESTADO-ACTUAL.md) - Estado del proyecto y brechas pendientes

---

## 01-arquitectura/ - Arquitectura del Sistema

| Documento | Descripcion |
|-----------|-------------|
| [ARQUITECTURA-SISTEMA.md](01-arquitectura/ARQUITECTURA-SISTEMA.md) | Arquitectura completa, 6 niveles, tech stack |
| [MULTI-TENANT.md](01-arquitectura/MULTI-TENANT.md) | Sistema multi-tenant: schemas, auth dual, creacion asincrona, APIs, seguridad |
| [ADMIN-GLOBAL.md](01-arquitectura/ADMIN-GLOBAL.md) | Panel de superusuarios: empresas, planes, usuarios globales |
| [RBAC-SYSTEM.md](01-arquitectura/RBAC-SYSTEM.md) | Control de acceso 4 capas: Cargo, RolAdicional, Group, UserRole |
| [CATALOGO-MODULOS.md](01-arquitectura/CATALOGO-MODULOS.md) | 16 modulos y ~81 sub-apps detalladas |
| [DATABASE-ARCHITECTURE.md](01-arquitectura/DATABASE-ARCHITECTURE.md) | ~612 tablas por tenant, esquema completo |
| [DIAGRAMA-ER.md](01-arquitectura/DIAGRAMA-ER.md) | Diagramas entidad-relacion (Mermaid) |
| [ARQUITECTURA-DINAMICA.md](01-arquitectura/ARQUITECTURA-DINAMICA.md) | Sistema 100% dinamico desde BD |
| [DIAGRAMA_FLUJO_MODULOS.md](01-arquitectura/DIAGRAMA_FLUJO_MODULOS.md) | Flujo de activacion de modulos |
| [ORDEN-LOGICO-CONFIGURACION.md](01-arquitectura/ORDEN-LOGICO-CONFIGURACION.md) | Orden logico: 8 niveles de configuracion, dependencias, checklist onboarding |

---

## 02-desarrollo/ - Guias de Desarrollo

### Convenciones y Politicas

| Documento | Descripcion |
|-----------|-------------|
| [POLITICAS-DESARROLLO.md](02-desarrollo/POLITICAS-DESARROLLO.md) | Reglas y convenciones del equipo |
| [CONVENCIONES-NOMENCLATURA.md](02-desarrollo/CONVENCIONES-NOMENCLATURA.md) | Todo en ingles: campos, enums, URLs, TypeScript. Roadmap legacy |
| [GUIA-VERSIONAMIENTO.md](02-desarrollo/GUIA-VERSIONAMIENTO.md) | Como gestionar versiones del software |
| [CODIGO-REUTILIZABLE.md](02-desarrollo/CODIGO-REUTILIZABLE.md) | Abstract models, mixins, hooks |

### Desarrollo General

| Documento | Descripcion |
|-----------|-------------|
| [AUTENTICACION.md](02-desarrollo/AUTENTICACION.md) | JWT, login, 2FA |
| [LOGGING.md](02-desarrollo/LOGGING.md) | Sistema de logging |
| [TESTING.md](02-desarrollo/TESTING.md) | pytest, Vitest, testing manual |
| [API-ENDPOINTS.md](02-desarrollo/API-ENDPOINTS.md) | Referencia de endpoints por modulo |
| [SNIPPETS-RAPIDOS.md](02-desarrollo/SNIPPETS-RAPIDOS.md) | Codigo rapido reutilizable |
| [PLANTILLAS-CODIGO.md](02-desarrollo/PLANTILLAS-CODIGO.md) | Templates de codigo |

### Frontend (02-desarrollo/frontend/)

| Documento | Descripcion |
|-----------|-------------|
| [DESIGN-SYSTEM.md](02-desarrollo/frontend/DESIGN-SYSTEM.md) | Sistema de diseno y componentes |
| [PATRONES-FRONTEND.md](02-desarrollo/frontend/PATRONES-FRONTEND.md) | Patrones React estandarizados |
| [LAYOUT-COMPONENTS.md](02-desarrollo/frontend/LAYOUT-COMPONENTS.md) | Componentes de layout |
| [NAVEGACION-DINAMICA.md](02-desarrollo/frontend/NAVEGACION-DINAMICA.md) | Menu dinamico desde BD |
| [POLITICAS-REACT-QUERY.md](02-desarrollo/frontend/POLITICAS-REACT-QUERY.md) | TanStack Query v5 patterns |
| [GUIA-CREACION-HOOKS.md](02-desarrollo/frontend/GUIA-CREACION-HOOKS.md) | Como crear custom hooks |
| [SISTEMA-ICONOS-DINAMICOS.md](02-desarrollo/frontend/SISTEMA-ICONOS-DINAMICOS.md) | DynamicIcon y Lucide |
| [LUCIDE_ICONS_REFERENCE.md](02-desarrollo/frontend/LUCIDE_ICONS_REFERENCE.md) | Referencia de iconos |

### Backend (02-desarrollo/backend/)

| Documento | Descripcion |
|-----------|-------------|
| [WORKFLOWS-FIRMAS.md](02-desarrollo/backend/WORKFLOWS-FIRMAS.md) | Motor de workflows y firmas digitales |
| [INTEGRACIONES-EXTERNAS.md](02-desarrollo/backend/INTEGRACIONES-EXTERNAS.md) | APIs externas e integraciones |
| [BRANDING-DINAMICO.md](02-desarrollo/backend/BRANDING-DINAMICO.md) | Branding e identidad per-tenant |

---

## 03-modulos/ - Documentacion por Modulo

| Documento | Descripcion |
|-----------|-------------|
| [GUIA_RAPIDA_AGREGAR_MODULO.md](03-modulos/GUIA_RAPIDA_AGREGAR_MODULO.md) | Como agregar un modulo nuevo |
| [GUIA_PRACTICA_MODULOS.md](03-modulos/GUIA_PRACTICA_MODULOS.md) | Paso a paso detallado |

### Riesgos (03-modulos/riesgos/)

| Documento | Descripcion |
|-----------|-------------|
| [RIESGO-SELECTOR-IMPLEMENTATION.md](03-modulos/riesgos/RIESGO-SELECTOR-IMPLEMENTATION.md) | Implementacion del selector de riesgos |
| [RIESGO-SELECTOR-UX-DESIGN.md](03-modulos/riesgos/RIESGO-SELECTOR-UX-DESIGN.md) | Diseno UX del selector |
| [RIESGO-SELECTOR-VISUAL-GUIDE.md](03-modulos/riesgos/RIESGO-SELECTOR-VISUAL-GUIDE.md) | Guia visual |

### Planeacion Estrategica (03-modulos/planeacion-estrategica/)

| Documento | Descripcion |
|-----------|-------------|
| [ARQUITECTURA_PLANEACION.md](03-modulos/planeacion-estrategica/ARQUITECTURA_PLANEACION.md) | Arquitectura del modulo de planeacion |

### Talent Hub (03-modulos/talent-hub/)

| Documento | Descripcion |
|-----------|-------------|
| [TALENT-HUB-COMPLETO.md](03-modulos/talent-hub/TALENT-HUB-COMPLETO.md) | Ciclo de vida del empleado: 11 sub-apps, 82 modelos, ESS/MSS/Analytics APIs, Ley 2466/2025, flujo de navegacion (Mi Portal = HOME) |

---

## 04-devops/ - DevOps y Deployment

| Documento | Descripcion |
|-----------|-------------|
| [DOCKER-SETUP.md](04-devops/DOCKER-SETUP.md) | Docker Compose, servicios, configuracion |
| [GITHUB-ACTIONS.md](04-devops/GITHUB-ACTIONS.md) | CI/CD con GitHub Actions |
| [CELERY-REDIS.md](04-devops/CELERY-REDIS.md) | Tareas asincronas, Redis, monitoreo |

---

## 05-refactoring/ - Estado y Planes Activos

| Documento | Descripcion |
|-----------|-------------|
| [ESTADO-ACTUAL.md](05-refactoring/ESTADO-ACTUAL.md) | Estado del proyecto, brechas pendientes, proceso de lifecycle |
| [PLAN-CIERRE-BRECHAS.md](05-refactoring/PLAN-CIERRE-BRECHAS.md) | Tracker de brechas: activas, historial, checklist pre-deploy |
| [AUDITORIA-N1.md](05-refactoring/AUDITORIA-N1.md) | Snapshot historico - auditoria funcional Nivel 1 (2026-02-06) |
| [TESTING-CORRECCIONES-INTEGRALES.md](05-refactoring/TESTING-CORRECCIONES-INTEGRALES.md) | Guia de testing: seguridad, autonomia tenant, compliance laboral, limpieza legacy |
| [AUDITORIA-MODULAR-v4.2.md](05-refactoring/AUDITORIA-MODULAR-v4.2.md) | Auditoria completa: backend A(96), frontend A+(98), modulos B+(85), matriz desactivacion |
| [SPRINT-BI-ANALYTICS.md](05-refactoring/SPRINT-BI-ANALYTICS.md) | Gap analysis BI/Analytics: pipeline datos, stats endpoints, Celery tasks KPIs |
| [PLAN-MEJORAS-CONSOLIDADO.md](05-refactoring/PLAN-MEJORAS-CONSOLIDADO.md) | **PLAN MAESTRO**: 80+ gaps, 10 sprints prioritized. Sprints 1-4 completados (2026-02-08). Reemplaza tracking disperso |
