# StrateKaz - Sistema Integrado de Gestion Empresarial

Plataforma ERP SaaS multi-tenant para empresas colombianas con cumplimiento normativo integrado (SG-SST, PESV, ISO 9001/14001/45001). Arquitectura modular de 5 capas con 14 modulos de negocio y ~84 sub-apps, aislamiento de datos por schema de PostgreSQL.

| Info | Valor |
|------|-------|
| **Versiones** | Root 3.7.1 · Frontend 5.1.0 · API 4.0.0 |
| **Ultima Actualizacion** | 9 Marzo 2026 |
| **Licencia** | Apache-2.0 |

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|------------|---------|
| **Backend** | Django + DRF | 5.0+ |
| **Multi-Tenant** | django-tenants (PostgreSQL schemas) | 3.6+ |
| **Base de Datos** | PostgreSQL | 15+ |
| **Cache/Broker** | Redis | 7+ |
| **Tareas Async** | Celery + Celery Beat | 5.3+ |
| **Frontend** | React + TypeScript | 18 + 5 |
| **Build Tool** | Vite | 5.0+ |
| **Estilos** | Tailwind CSS | 3.4+ |
| **Estado** | Zustand + TanStack Query v5 | - |
| **Formularios** | React Hook Form + Zod | - |
| **Contenedores** | Docker + Docker Compose | - |

### Estadisticas

| Metrica | Backend | Frontend |
|---------|---------|----------|
| Apps/Features | ~84 apps | 22 features |
| Modelos/Componentes | 240+ modelos | 100+ reutilizables |

---

## Arquitectura: 5 Capas + Portales

```
C0 — PLATAFORMA (infraestructura)
├── core/         (Usuarios, RBAC, Menu, Permisos)
├── tenant/       (Multi-tenant, Schemas, Domains, Plans)
└── audit_system/ (Centro de Control: Logs, Alertas, Notificaciones)

C1 — FUNDACION (se configura 1 vez)
└── gestion_estrategica/ (Configuracion, Organizacion, Identidad)

C2 — MODULOS DE NEGOCIO (14 independientes)
├── Planeacion Estrategica  (Contexto, Objetivos, Proyectos PMI)
├── Sistema de Gestion      (Planificacion, Documentos, Calidad)
├── Motor Cumplimiento      (Matriz Legal, Requisitos)
├── Motor Riesgos           (IPEVR, ISO 31000, Ambiental, Vial, SAGRILAFT)
├── Workflows               (BPMN, Firmas Digitales)
├── HSEQ                    (SST, Ambiental, Comites, Emergencias)
├── Talent Hub              (RRHH completo - 11 sub-apps)
├── Supply Chain            (Proveedores, Compras, Almacen)
├── Production Ops          (Recepcion, Procesamiento, Mantenimiento)
├── Logistics & Fleet       (Flota, Transporte)
├── Sales CRM               (Clientes, Ventas, Facturacion)
├── Admin Finance           (Tesoreria, Presupuesto, Activos)
└── Accounting              (Contabilidad)

C3 — INTELIGENCIA (lee de C2, NO modifica)
├── analytics/              (KPIs, Dashboards, Informes, Tendencias)
└── revision_direccion/     (Revision por la Direccion)

PORTALES (solo UI, sin logica propia)
  Mi Portal | Mi Equipo | Portal Proveedores | Portal Clientes | Admin Global
```

---

## Inicio Rapido (Docker)

### Requisitos
- Docker y Docker Compose
- Git

### Levantar el proyecto

```bash
git clone <repo-url>
cd StrateKaz
cp .env.example .env

# Levantar servicios (PostgreSQL, Redis, Backend, Celery)
docker-compose up -d

# Migraciones multi-tenant
docker-compose exec backend python manage.py migrate_schemas

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# (Opcional) Frontend en Docker
docker-compose --profile frontend up -d
```

### Desarrollo local sin Docker

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements/development.txt
python manage.py migrate_schemas
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

### Accesos

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3010 |
| Backend API | http://localhost:8000/api |
| API Docs (Swagger) | http://localhost:8000/api/docs/ |
| Admin Django | http://localhost:8000/admin |
| Flower (Celery) | http://localhost:5555 |

---

## Servicios Docker

| Servicio | Imagen | Puerto | Descripcion |
|----------|--------|--------|-------------|
| `db` | postgres:15-alpine | 5432 | Base de datos (schemas multi-tenant) |
| `redis` | redis:7-alpine | 6379 | Cache y Celery broker |
| `backend` | Python 3.11 + Django | 8000 | API REST |
| `celery` | Python 3.11 + Celery | - | Worker de tareas async |
| `celerybeat` | Python 3.11 + Celery | - | Scheduler de tareas periodicas |
| `frontend` | Node 20 + Vite | 3010 | App React (profile: frontend) |
| `flower` | Celery Flower | 5555 | Monitor Celery (profile: monitoring) |
| `pgadmin` | pgAdmin 4 | 5050 | Admin BD (profile: tools) |

---

## RBAC (3 Tipos de Roles)

| Tipo | Descripcion | Ejemplo |
|------|-------------|---------|
| **Cargo** | Posicion en organigrama, permisos base automaticos | Operario, Supervisor, Gerente |
| **Rol Funcional** | Permisos RBAC adicionales, asignables | Aprobador, Auditor, Analista |
| **Especialidad Certificada** | Roles legales con certificacion | COPASST, Brigadista, Vigia SST |

---

## Estructura del Proyecto

```
StrateKaz/
├── backend/
│   ├── apps/                    # 103 aplicaciones Django (6 niveles)
│   ├── config/
│   │   └── settings/            # base.py, development.py, production.py
│   ├── requirements/            # base.txt, development.txt, production.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── components/          # Design System reutilizable
│       ├── features/            # 22 modulos por funcionalidad
│       ├── hooks/               # Custom hooks
│       ├── layouts/             # DashboardLayout responsive
│       └── store/               # Zustand stores
├── docker/                      # Configuraciones Docker
├── docs/                        # Documentacion (ver seccion abajo)
├── docker-compose.yml
└── .env.example
```

---

## Documentacion

| Seccion | Ruta | Contenido |
|---------|------|-----------|
| **Arquitectura** | [docs/01-arquitectura/](docs/01-arquitectura/) | Sistema, DB, multi-tenant, RBAC |
| **Desarrollo** | [docs/02-desarrollo/](docs/02-desarrollo/) | Convenciones, testing, API, frontend/backend |
| **Modulos** | [docs/03-modulos/](docs/03-modulos/) | Documentacion por modulo |
| **DevOps** | [docs/04-devops/](docs/04-devops/) | Docker, CI/CD, Celery/Redis, deploy |

---

## Licencia

Apache-2.0 - Ver [LICENSE](LICENSE)

## Contacto

- **Web:** https://stratekaz.com
- **Email:** soporte@stratekaz.com
