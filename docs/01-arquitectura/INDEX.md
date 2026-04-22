# Índice — Arquitectura StrateKaz
**Última actualización:** 2026-04-20

Este directorio es la fuente de verdad para toda la documentación arquitectónica del proyecto.
Convención: nombres en `kebab-case.md`. Sin números en archivos — el orden de lectura está aquí.

---

## ¿Por dónde empezar?

| Si querés entender... | Leé primero |
|-----------------------|------------|
| Cómo está organizado el repositorio | [`estructura.md`](estructura.md) |
| Qué módulos están activos hoy | [`perimetro-live.md`](perimetro-live.md) |
| El modelo de capas del sistema | [`capas.md`](capas.md) |
| Qué tecnologías y versiones usamos | [`stack.md`](stack.md) |
| Por qué está construido así (filosofía) | [`arquitectura-cascada.md`](arquitectura-cascada.md) |
| Cómo funciona el multi-tenant | [`multi-tenant.md`](multi-tenant.md) |
| Cómo funciona el control de acceso | [`rbac-sistema.md`](rbac-sistema.md) |
| Quién es dueño de cada dato | [`source-of-truth.md`](source-of-truth.md) |
| Qué catálogos existen y dónde deben vivir | [`catalogos-maestros.md`](catalogos-maestros.md) |
| Qué decisiones arquitectónicas están abiertas | [`hallazgos-pendientes.md`](hallazgos-pendientes.md) |

---

## Orden canónico de lectura

### 1. Contexto y estructura (¿qué es esto?)
| Documento | Propósito |
|-----------|-----------|
| [`estructura.md`](estructura.md) | Árbol del repo, qué hay en cada carpeta |
| [`capas.md`](capas.md) | Modelo de capas C0/C1/CT/C2/C3/Portales con mapa capa→apps |
| [`apps-django.md`](apps-django.md) | Inventario completo de apps Django (Tipo A/B/C, LIVE/DORMIDO) |
| [`stack.md`](stack.md) | Versiones pinneadas de todas las dependencias core |
| [`perimetro-live.md`](perimetro-live.md) | Qué módulos están activos hoy y por qué |

### 2. Decisiones fundacionales (¿por qué así?)
| Documento | Propósito |
|-----------|-----------|
| [`arquitectura-cascada.md`](arquitectura-cascada.md) | Filosofía de cascada, principio "LIVE = verdad" (doc fundacional) |
| [`arquitectura-dinamica.md`](arquitectura-dinamica.md) | Principio de no-hardcoding — todo desde base de datos |
| [`source-of-truth.md`](source-of-truth.md) | Quién es master de cada dato (Colaborador vs User vs InfoPersonal) |
| [`modular-tenancy.md`](modular-tenancy.md) | Cómo diseñar modelos en SaaS multi-tenant sin acoplamiento |

### 3. Mecanismos transversales (¿cómo funciona internamente?)
| Documento | Propósito |
|-----------|-----------|
| [`multi-tenant.md`](multi-tenant.md) | Arquitectura multi-tenant: schemas PostgreSQL, middleware, dominios |
| [`rbac-sistema.md`](rbac-sistema.md) | Sistema de permisos: roles, cargos, secciones, RBAC v4.x |
| [`base-de-datos.md`](base-de-datos.md) | Arquitectura de datos, patrones DB, TenantModel/SharedModel |
| [`seguridad.md`](seguridad.md) | 2FA, firma digital, JWT, CSRF, CSP, CORS, cifrado |
| [`jwt-sesiones.md`](jwt-sesiones.md) | Duraciones JWT (8h/7d), refresh proactivo, blacklist |

### 4. Patrones de extensión (¿cómo extender el sistema?)
| Documento | Propósito |
|-----------|-----------|
| [`config-admin.md`](config-admin.md) | Módulo Config Plataforma + Cascada V2.1 ⚠️ *bugs activos en UI* |
| [`automatizaciones.md`](automatizaciones.md) | EventBus + django-fsm — ⏸ *roadmap congelado, activa en L30+* |

### 5. Estado activo y backlog (¿qué hay hoy y qué viene?)
| Documento | Propósito |
|-----------|-----------|
| [`perimetro-live.md`](perimetro-live.md) | Módulos LIVE vs DORMIDOS — estado real del deploy |
| [`hallazgos-pendientes.md`](hallazgos-pendientes.md) | Decisiones arquitectónicas abiertas (H1–H23) |
| [`rbac-v5-roadmap.md`](rbac-v5-roadmap.md) | Roadmap RBAC v5 — 🔲 *planificado, no ejecutado. Ver rbac-sistema.md para v4 actual* |

---

## Qué NO va en este directorio

| Tipo de doc | Dónde va |
|-------------|----------|
| Guías de módulos de negocio (Talent Hub, Supply Chain...) | `docs/03-modulos/<modulo>/` |
| Runbooks operativos, comandos de deploy | `docs/04-devops/` |
| Convenciones de código, patrones de desarrollo | `docs/02-desarrollo/` |
| Auditorías históricas (reportes de sesión) | `docs/auditorias/YYYY-MM/` |
| Historial de sprints, pitfalls | `docs/history/` |

---

## Regla de mantenimiento
Este `INDEX.md` es el mapa de entrada al directorio.
Debe actualizarse en el mismo PR cada vez que:
- Se agregue o elimine un documento en este directorio
- Cambie el propósito de un documento existente
- Se renombre un documento

Última actualización: 2026-04-20
Responsable: quien abre el PR que agrega/elimina/renombra un doc aquí.
