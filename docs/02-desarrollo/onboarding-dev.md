# Onboarding — Primer día como contributor en StrateKaz
**Última actualización:** 2026-04-20

Esta guía te lleva desde cero hasta tu primer cambio en producción.

---

## 1. ¿Qué es StrateKaz?

**NO es un ERP. NO es un SGI.** Es una Plataforma de Gestión Empresarial 360° multi-tenant para empresas colombianas. Integra gestión estratégica, cumplimiento normativo (ISO 9001/14001/45001/27001), talento humano, HSEQ, supply chain y analítica en un solo sistema.

Lee esto antes de escribir una línea de código:
- [`docs/01-arquitectura/arquitectura-cascada.md`](../01-arquitectura/arquitectura-cascada.md) — el "por qué" fundacional
- [`docs/01-arquitectura/capas.md`](../01-arquitectura/capas.md) — el modelo C0/C1/CT/C2/C3
- [`docs/01-arquitectura/perimetro-live.md`](../01-arquitectura/perimetro-live.md) — qué está activo HOY

---

## 2. El principio más importante: LIVE es la verdad

> "Solo el código LIVE (niveles activos en base.py TENANT_APPS) se considera parte del proyecto."

**Consecuencia práctica:**
- Solo tocás código de los módulos en `base.py` TENANT_APPS activos (sin comentar)
- El código comentado/dormido es borrador descartable — no lo arregles, no lo refactorices
- Si arreglar algo LIVE rompe algo dormido → no importa, se anota y se sigue

---

## 3. Setup del entorno local

### Prerrequisitos
- Docker Desktop instalado
- Git configurado
- Node.js 20+ y npm

### Primeros pasos

```bash
# 1. Clonar el repo
git clone https://github.com/Kmylosky83/StrateKaz.git
cd StrateKaz

# 2. Copiar variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Levantar servicios con Docker
docker compose up -d

# 4. Correr migraciones
docker compose exec backend python manage.py migrate_schemas

# 5. Crear tenant demo
docker compose exec backend python manage.py deploy_seeds_all_tenants

# 6. Frontend (en otra terminal)
cd frontend && npm install && npm run dev
```

### URLs locales
| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3010 |
| Backend API | http://localhost:8000/api/ |
| Swagger | http://localhost:8000/api/docs/ |
| Flower (Celery) | http://localhost:5555 |

---

## 4. Estructura del proyecto

Ver [`docs/01-arquitectura/estructura.md`](../01-arquitectura/estructura.md) para el árbol completo.

Carpetas clave:
```
backend/apps/          # Apps Django — solo tocar las LIVE
frontend/src/features/ # Feature modules React
docs/01-arquitectura/  # Leer antes de cualquier cambio arquitectónico
```

---

## 5. Stack tecnológico

Ver [`docs/01-arquitectura/stack.md`](../01-arquitectura/stack.md) para versiones exactas.

Resumen: Django 5 + DRF 3.14 | React 18 + TypeScript | PostgreSQL 15 (multi-tenant) | Redis | Celery

---

## 6. Antes de escribir código — checklist

- [ ] ¿El módulo que vas a tocar está LIVE (activo en base.py)?
- [ ] ¿Leíste [`coding-standards.md`](coding-standards.md)?
- [ ] ¿Leíste [`convenciones-nomenclatura.md`](convenciones-nomenclatura.md)?
- [ ] ¿El cambio es browseable en tenant demo local?
- [ ] Si tocás serializers/FormModal/hooks CRUD → ¿usás las factories?

---

## 7. Flujo de trabajo

```
1. Código local (Docker)
2. Tests pasan (pytest + manage.py test)
3. Browseo manual en tenant demo local
4. git commit (Conventional Commits: feat/fix/docs/refactor)
5. git push → CI GitHub Actions (debe pasar)
6. Deploy VPS (ver docs/04-devops/deploy.md)
```

---

## 8. Dónde encontrar las cosas

| Necesito saber... | Leer |
|-------------------|------|
| Qué está activo | [`01-arquitectura/perimetro-live.md`](../01-arquitectura/perimetro-live.md) |
| Cómo funciona el RBAC | [`01-arquitectura/rbac-sistema.md`](../01-arquitectura/rbac-sistema.md) |
| Cómo funciona multi-tenant | [`01-arquitectura/multi-tenant.md`](../01-arquitectura/multi-tenant.md) |
| Endpoints de API | [`02-desarrollo/api-endpoints.md`](api-endpoints.md) |
| Design System | [`02-desarrollo/frontend/design-system.md`](frontend/design-system.md) |
| Cómo hacer deploy | [`04-devops/deploy.md`](../04-devops/deploy.md) |
| Decisiones arquitectónicas abiertas | [`01-arquitectura/hallazgos-pendientes.md`](../01-arquitectura/hallazgos-pendientes.md) |
| Qué salió mal antes (no repetir) | [`history/pitfalls.md`](../history/pitfalls.md) |

---

## Regla de mantenimiento
Actualizar cuando cambie el setup local, las URLs, el flujo de trabajo o los prerrequisitos.
Última actualización: 2026-04-20
