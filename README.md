# StrateKaz — Plataforma de Gestión Empresarial 360°

**No es un ERP. No es un SGI.** Es una plataforma modular de gestión empresarial y consultoría 4.0 para empresas colombianas que integra estrategia, cumplimiento normativo (ISO 9001/14001/45001/27001), riesgos, HSEQ, talento humano y analítica en una sola plataforma multi-tenant.

| Info | Valor |
|------|-------|
| **Versión frontend** | 5.9.0 |
| **Versión API** | 5.4.0 |
| **Idioma del sistema** | Español colombiano (es-co) |
| **Dominio** | stratekaz.com · app.stratekaz.com |
| **Licencia** | Apache-2.0 |

---

## Principio fundacional: LIVE es la verdad

Solo el código activo (módulos declarados en `TENANT_APPS` de `base.py`) se considera parte del proyecto y debe estar 100% sólido. El código no-LIVE es borrador descartable: no se mantiene ni genera deuda hasta que llegue su sprint de activación.

**Módulos LIVE hoy (L0-L20):** `core`, `tenant`, `audit_system`, `gestion_estrategica` (C1 + CT), `workflow_engine`, `supply_chain`, `mi_equipo`, `mi_portal`.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | Django + DRF | 5.0.9 / 3.14.0 |
| **Multi-Tenant** | django-tenants (schemas PostgreSQL) | 3.10.0 |
| **Base de Datos** | PostgreSQL | 15 |
| **Cache / Broker** | Redis | 7.x |
| **Tareas async** | Celery + Beat | 5.3.6 |
| **Frontend** | React + TypeScript | 18.2 / 5.3 |
| **Build** | Vite | 5.x |
| **Estilos** | Tailwind CSS | 3.4 |
| **Estado** | Zustand + TanStack Query v5 | 4.4.7 / 5.x |
| **Formularios** | React Hook Form + Zod | 7.49 / 3.22 |
| **Auth** | JWT (SimpleJWT) | 5.3.0 |

Versiones completas de todas las dependencias: [`docs/01-arquitectura/stack.md`](docs/01-arquitectura/stack.md)

---

## Arquitectura: 6 capas + Portales

```
C0 — PLATAFORMA (infraestructura, siempre sólida)
  ├── core/         (Usuarios, RBAC, Menú, Permisos)
  ├── tenant/       (Multi-tenant, Schemas, Dominios, Planes)
  └── audit_system/ (Centro de Control: Logs, Alertas, Notificaciones)

C1 — FUNDACIÓN (se configura 1 vez, afecta a todos)
  └── gestion_estrategica/ (Configuración, Organización, Identidad, Contexto)

CT — INFRAESTRUCTURA TRANSVERSAL (todos los C2 consumen, nunca importan entre sí)
  ├── gestion_documental/ (8 fases, 7 modelos)
  └── workflow_engine/    (Flujos, Ejecución, Firmas digitales)

C2 — MÓDULOS DE NEGOCIO (12 independientes, consumen CT)
  Planeación Estratégica  │ Cumplimiento Legal   │ Gestión de Riesgos
  Gestión HSEQ            │ Auditoría Interna    │ Supply Chain
  Production Ops          │ Logistics & Fleet    │ Sales CRM
  Talent Hub (12 sub)     │ Admin Finance        │ Accounting

C3 — INTELIGENCIA (lee de C2 y CT, NO modifica)
  ├── analytics/           (KPIs, Dashboards, Informes, Tendencias)
  └── revision_direccion/  (Revisión por la Dirección)

PORTALES (solo UI, sin lógica propia)
  Mi Portal │ Mi Equipo │ Portal Proveedores │ Portal Clientes │ Admin Global
```

Detalle completo: [`docs/01-arquitectura/capas.md`](docs/01-arquitectura/capas.md)

---

## Inicio rápido (Docker)

### Requisitos
- Docker y Docker Compose
- Git

### Levantar el proyecto

```bash
git clone <repo-url>
cd StrateKaz
cp .env.example .env

# Levantar servicios (PostgreSQL, Redis, Backend, Celery)
docker compose up -d

# Migraciones multi-tenant
docker compose exec backend python manage.py migrate_schemas

# Crear superusuario
docker compose exec backend python manage.py createsuperuser

# Seeds iniciales en el tenant demo
docker compose exec backend python manage.py deploy_seeds_all_tenants

# Frontend (perfil separado)
docker compose --profile frontend up -d
```

### Accesos locales

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3010 |
| Backend API | http://localhost:8000/api |
| Swagger | http://localhost:8000/api/docs/ |
| Django Admin | http://localhost:8000/admin |
| Flower (Celery) | http://localhost:5555 |

Guía completa de entorno y comandos: [`docs/04-devops/deploy.md`](docs/04-devops/deploy.md)

---

## Estructura del repositorio

```
StrateKaz/
├── backend/
│   ├── apps/                    # ~84 aplicaciones Django organizadas por capa
│   ├── config/settings/         # base.py · development.py · production.py · testing.py
│   ├── utils/                   # Base models (TenantModel, SharedModel), logging, cache
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/                 # Axios config + interceptors JWT
│       ├── components/          # Design System: 100+ componentes reutilizables
│       ├── features/            # 22 feature modules
│       ├── hooks/               # 19 custom hooks
│       ├── lib/                 # API factory, CRUD hooks factory, query-keys
│       └── store/               # Zustand (auth, theme)
├── docs/                        # Documentación técnica (ver sección abajo)
├── scripts/                     # Deploy, backup, verificación
├── docker-compose.yml
└── .env.example
```

Árbol completo del repositorio: [`docs/01-arquitectura/estructura.md`](docs/01-arquitectura/estructura.md)

---

## Documentación

| Sección | Ruta | Contenido |
|---------|------|-----------|
| **Arquitectura** | [`docs/01-arquitectura/`](docs/01-arquitectura/) | Capas, stack, multi-tenant, RBAC, decisiones fundacionales — ver [`INDEX.md`](docs/01-arquitectura/INDEX.md) |
| **Desarrollo** | [`docs/02-desarrollo/`](docs/02-desarrollo/) | Convenciones, testing, API endpoints, Design System, onboarding dev |
| **Módulos** | [`docs/03-modulos/`](docs/03-modulos/) | Guías operativas por módulo LIVE + stubs de módulos dormidos |
| **DevOps** | [`docs/04-devops/`](docs/04-devops/) | Docker, CI/CD, Celery/Redis, deploy VPS, capacity planning |
| **Negocio** | [`docs/05-negocio/`](docs/05-negocio/) | Modelo B2B2B, pricing, identidad de marca, marketing |
| **Changelog** | [`docs/06-changelog/`](docs/06-changelog/) | Historial de versiones (Keep a Changelog) |
| **Auditorías** | [`docs/auditorias/`](docs/auditorias/) | Logs de sesión, auditorías históricas, hallazgos |

---

## RBAC — Control de acceso

El sistema implementa RBAC de 4 capas con lógica OR: si cualquier capa concede acceso, se permite.

| Capa | Mecanismo | Descripción |
|------|-----------|-------------|
| 1 | Cargo | Posición en organigrama → permisos base por nivel (ESTRATÉGICO / TÁCTICO / OPERATIVO) |
| 2 | Rol adicional | Permisos extras apilables sobre el cargo base |
| 3 | Django Group | Grupos con roles asignados |
| 4 | UserRole directo | Rol asignado directamente al usuario |

Referencia completa: [`docs/01-arquitectura/rbac-sistema.md`](docs/01-arquitectura/rbac-sistema.md)

---

## Licencia

Apache-2.0 — Ver [LICENSE](LICENSE)

## Contacto

- **Web:** https://stratekaz.com
- **Email:** soporte@stratekaz.com
