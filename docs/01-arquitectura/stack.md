# Stack Tecnológico StrateKaz
**Última actualización:** 2026-04-20

## 1. Backend — dependencias core

| Paquete | Versión pinneada | Rol |
|---------|-----------------|-----|
| Django | 5.0.9 | Framework web principal |
| djangorestframework | 3.14.0 | API REST |
| celery | 5.3.6 | Cola de tareas asíncronas |
| psycopg2-binary | 2.9.11 | Driver PostgreSQL |
| redis | 5.0.1 | Cache + broker Celery |
| djangorestframework-simplejwt | 5.3.0 | Autenticación JWT |
| django-tenants | 3.10.0 | Multi-tenant con schemas PostgreSQL |
| weasyprint | 60.2 | Generación de PDFs (PINNEADO — 68.x rompe generación) |
| pydyf | 0.10.0 | Dependencia de WeasyPrint (PINNEADO — 0.11+ rompe PDF) |
| sentry-sdk | 2.20.0 | Monitoreo de errores en producción |
| gunicorn | 25.1.0 | Servidor WSGI para producción |
| drf-spectacular | 0.27.0 | Documentación OpenAPI (Swagger/ReDoc) |
| django-celery-beat | 2.6.0 | Scheduler de tareas periódicas |
| django-redis | 5.4.0 | Backend de cache Redis para Django |
| django-auditlog | 2.3.0 | Auditoría automática de modelos |
| flower | 2.0.1 | Monitor web para Celery |
| django-fsm | 3.0.0 | Máquina de estados para workflows |
| pyhanko | 0.25.2 | Firma digital de PDFs con validez legal |
| pyotp | 2.9.0 | 2FA vía TOTP |

## 2. Frontend — dependencias core

| Paquete | Versión | Rol |
|---------|---------|-----|
| react | ^18.2.0 | UI library principal |
| react-dom | ^18.2.0 | Renderizado DOM |
| react-router-dom | ^6.21.0 | Routing SPA |
| @tanstack/react-query | ^5.14.0 | State management del servidor (data fetching) |
| @tanstack/react-table | ^8.21.3 | Tablas de datos complejas |
| zustand | ^4.4.7 | State management del cliente |
| zod | ^3.22.4 | Validación de schemas y tipos |
| react-hook-form | ^7.49.0 | Manejo de formularios |
| tailwindcss | ^3.4.0 | Framework CSS utility-first |
| vite | ^5.4.0 | Build tool y dev server |
| typescript | ^5.3.0 | Tipado estático |
| framer-motion | ^12.23.26 | Animaciones |
| three | ^0.170.0 | 3D rendering |
| @react-three/fiber | ^8.17.10 | React wrapper para Three.js |
| @xyflow/react | ^12.10.0 | Diagramas de flujo (workflow designer) |
| lucide-react | ^0.468.0 | Iconos |
| @tiptap/react | ^3.15.1 | Editor de texto enriquecido |
| @tiptap/starter-kit | ^3.15.1 | Extensiones base de TipTap |
| echarts | ^6.0.0 | Gráficas y dashboards |
| recharts | ^2.15.4 | Gráficas declarativas React |
| axios | ^1.13.5 | HTTP client con interceptores JWT |
| vitest | ^1.0.4 | Test runner (dev) |
| vite-plugin-pwa | ^1.2.0 | PWA (Service Worker, manifest) |

## 3. Infraestructura

### Docker Compose (desarrollo local)

| Servicio | Imagen | Puerto | Rol |
|----------|--------|--------|-----|
| `db` | postgres:15-alpine | 5432 | Base de datos PostgreSQL |
| `redis` | redis:7-alpine | 6379 | Cache + broker Celery |
| `backend` | ./backend/Dockerfile | 8000 | Django + Gunicorn (dev mode: runserver) |
| `celery` | ./backend/Dockerfile | — | Worker Celery (10 colas) |
| `celerybeat` | ./backend/Dockerfile | — | Scheduler Celery (DatabaseScheduler) |
| `flower` | ./backend/Dockerfile | 5555 | Monitor Celery (perfil: monitoring) |
| `frontend` | ./frontend/Dockerfile.dev | 3010 | Vite dev server (perfil: frontend) |
| `mailpit` | axllent/mailpit:latest | 8025/1025 | Captura de emails en desarrollo |
| `pgadmin` | dpage/pgadmin4:8.14 | 5050 | Admin PostgreSQL (perfil: tools) |
| `redis-commander` | rediscommander/redis-commander:0.8.1 | 8081 | Admin Redis (perfil: tools) |

Nota: `flower`, `frontend`, `pgadmin` y `redis-commander` solo se inician con el perfil correspondiente (`--profile monitoring`, `--profile frontend`, `--profile tools`).

### CI/CD — GitHub Actions

| Workflow | Trigger | Propósito |
|----------|---------|-----------|
| `ci.yml` | push / pull_request | Pipeline principal: Django checks + pytest + TSC + ESLint + Vite build |
| `pr-checks.yml` | pull_request | Verificación de Conventional Commits |
| `codeql.yml` | push / schedule | Análisis de seguridad estático (JS + Python) |

### Producción (VPS)

- Servidor: Nginx (reverse proxy) + Gunicorn (WSGI)
- OS: Linux (Hostinger VPS)
- Path deploy: `/opt/stratekaz`
- Servicios systemd: `stratekaz-gunicorn`, `stratekaz-celery`, `stratekaz-celerybeat`
- NO Docker en producción — Python directo con venv en `/opt/stratekaz/backend/venv/`

## 4. Versiones del proyecto

| Componente | Versión | Fuente |
|------------|---------|--------|
| Frontend (package.json) | 5.9.0 | `frontend/package.json` → `"version"` |
| API (drf-spectacular) | 5.4.0 | `SPECTACULAR_SETTINGS["VERSION"]` en `base.py` |
| Backend Python | Django 5.0.9 | `requirements.txt` |
| Node.js mínimo | >=18.0.0 | `frontend/package.json` → `"engines"` |
| npm mínimo | >=9.0.0 | `frontend/package.json` → `"engines"` |

---

## Regla de mantenimiento

Este documento es fuente de verdad para las versiones del stack.
Debe actualizarse en el mismo PR cada vez que cambie:
- Se actualice una dependencia core en `requirements.txt` o `package.json`
- Se agregue un nuevo servicio en `docker-compose.yml`
- Se modifique la infra de CI/CD
- Cambie la versión del proyecto en `package.json` o `SPECTACULAR_SETTINGS`

Última actualización: 2026-04-20
Responsable: quien abre el PR que dispara el cambio.
