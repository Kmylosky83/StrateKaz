# FASE 6 — Infraestructura y DevOps

**Auditoría:** Health Check Integral StrateKaz SGI
**Fase:** 6 de 7
**Agentes:** DevOps Specialist + Infrastructure Specialist
**Fecha:** 22 de marzo de 2026
**Duración:** ~20 minutos (2 agentes en paralelo)
**Nota:** Auditoría basada en código fuente (configs, scripts, docs). Sin acceso directo al VPS.

---

## Resumen Ejecutivo

La infraestructura de StrateKaz es **operacionalmente funcional** con un deploy script robusto (450+ líneas), backups diarios automatizados, y configuración de Celery excepcional (34 tareas, 11 colas). Sin embargo, presenta **gaps críticos en disaster recovery**: backups nunca testeados, sin almacenamiento offsite, SSL con renovación manual (expira en 51 días), y monitoring sin alertas automatizadas.

**Puntuación global Fase 6: 6.5/10**

---

## Métricas Clave

| Métrica | Valor |
|---------|-------|
| VPS | Hostinger — Ubuntu 24.04 LTS, 2 CPU, 8 GB RAM |
| Tenants activos | 3 schemas (public + stratekaz_demo + grasas) |
| Deploy script | 450+ líneas, opciones granulares (--backend, --frontend, --dry-run) |
| Downtime por deploy | ~15-30 segundos (restart Gunicorn) |
| Backup frecuencia | Diario 2:00 AM (cron) |
| Backup retención | 30 días |
| Backup offsite | NO |
| Backup restore testeado | NUNCA |
| SSL expira | 2026-05-14 (51 días) |
| SSL auto-renewal | NO (manual) |
| Celery tareas programadas | 34 |
| Celery colas | 11 especializadas |
| Monitoring alertas | 0 configuradas |
| Staging environment | NO existe |

---

## Hallazgos por Severidad

### CRITICO (P0)

#### H1 — SSL expira 2026-05-14 sin auto-renewal

**Impacto:** En 51 días, todos los usuarios verán advertencias de certificado. HTTPS dejará de funcionar.

**Estado actual:** Certificado wildcard `*.stratekaz.com` de Hostinger. Renovación manual requerida.

**Acción:** Configurar calendario para renovar antes del 14 de abril. Evaluar migración a Let's Encrypt con certbot para auto-renewal.

---

#### H2 — Backups nunca restaurados (restore no testeado)

**Impacto:** Si ocurre un disaster, no hay garantía de que los backups funcionen. RPO actual: 24 horas.

**Evidencia:**
- `scripts/backup_tenants.sh` crea backups en format custom (pg_dump)
- `docs/04-devops/DEPLOY_CHECKLIST.md` documenta restore con format SQL (mismatch)
- Ningún test de restore documentado o ejecutado

---

#### H3 — Sin backups offsite

**Impacto:** Si el VPS sufre falla de hardware, TODOS los datos se pierden (backups están en el mismo disco).

**Estado:** Backups en `/var/backups/stratekaz/` — misma máquina que la base de datos.

---

#### H4 — Disaster Recovery: RTO 4-24 horas (sin procedimiento verificado)

**Impacto:** No hay playbook probado para reconstruir el VPS desde cero.

| Escenario | RTO Actual | RTO Deseado |
|-----------|-----------|-------------|
| App crash | 2 min (systemd auto-restart) | 2 min |
| DB corruption | 1-2 horas | 15 min |
| VPS total loss | 4-24 horas | 1 hora |
| Ransomware | 2-4 horas (si backup ok) | 1 hora |

---

### ALTO (P1)

#### H5 — Monitoring sin alertas automatizadas

Health checks existen (`/api/health/`, `/api/health/deep/`) pero nadie los monitorea automáticamente. No hay alertas para:
- Disco lleno
- CPU/RAM alto
- Servicios caídos
- Errores Sentry
- Tareas Celery fallidas
- Backups fallidos

#### H6 — Sin staging environment

Deploys van directo a producción. No hay forma de validar cambios antes del deploy. El deploy script tiene `--dry-run` pero no simula el entorno real.

#### H7 — Docker Compose: backend y celery sin health checks

PostgreSQL y Redis tienen health checks. Backend, Celery y Celerybeat NO.

#### H8 — Flower sin autenticación

Celery Flower (monitoring) accesible sin password en desarrollo. En producción, verificar si está expuesto.

#### H9 — Media files sin backup

`/opt/stratekaz/backend/media/` (documentos, firmas, fotos) no se respalda. Pérdida irrecuperable si falla el disco.

---

### MEDIO (P2)

#### H10 — Nginx: CSP y HSTS headers faltantes en config Docker

La config Nginx en Docker no incluye CSP ni HSTS (Django los envía via middleware, pero headers duplicados en Nginx son best practice).

#### H11 — Rate limiting Nginx inconsistente con DRF

Nginx: `burst=60` permite 1,860 req/min vs DRF 120/min para usuarios autenticados.

#### H12 — Redis maxmemory 256MB (bajo para producción)

Suficiente para desarrollo y 3 tenants, pero debería ser 512MB-1GB en VPS con 8GB RAM.

#### H13 — Celery sin max_tasks_per_child en Docker Compose

Docker Compose no configura `--max-tasks-per-child`. El config de Celery sí lo tiene (1000), pero el flag de command line lo sobreescribe.

#### H14 — Servicios systemd no versionados en git

`stratekaz-gunicorn.service`, `stratekaz-celery.service`, `stratekaz-celerybeat.service` referenciados en deploy.sh pero no guardados en el repositorio.

---

### BAJO (P3)

#### H15 — Dependabot: 863 alertas en GitHub

Acumulación significativa de alertas de seguridad sin triaje.

#### H16 — No hay pre-deploy staging test

El checklist de deploy es manual. No hay automated smoke test post-deploy.

---

## Verificaciones Exitosas

### Deploy Script: ROBUSTO

| Aspecto | Estado |
|---------|--------|
| Backup pre-deploy | SI (pg_dump automático) |
| Opciones granulares | --backend, --frontend, --no-backup, --dry-run |
| Detección de cambios | Solo pip install si requirements cambió |
| Health check post-deploy | SI (curl + systemctl status) |
| Rollback documentado | SI (git reset + restore) |
| Downtime | ~15-30 segundos (graceful restart) |

### Celery: EXCELENTE

| Aspecto | Estado |
|---------|--------|
| Task routing | 60+ reglas por app/queue |
| Colas especializadas | 11 (emails, reports, compliance, workflows, etc.) |
| Tareas programadas | 34 con Beat DatabaseScheduler |
| Serialización | JSON (seguro) |
| Timezone | America/Bogota (correcto) |
| Task limits | 30 min hard, 25 min soft |
| Worker prefetch | 4 (balance correcto) |
| Acks late | True (re-entrega si worker falla) |
| Result expires | 1 hora |

### PostgreSQL: BIEN CONFIGURADO

| Aspecto | Estado |
|---------|--------|
| Health check (Docker) | pg_isready con interval/timeout |
| Encoding | UTF8 + es_US.UTF-8 |
| Init script | docker-entrypoint-initdb.d |
| Port binding | 127.0.0.1 solo (dev) |
| Named volume | stratekaz_postgres_data |

### Redis: BIEN CONFIGURADO

| Aspecto | Estado |
|---------|--------|
| Persistencia | AOF habilitado |
| Eviction | allkeys-lru |
| Password | requirepass via env var |
| Health check | redis-cli ping |
| DBs separadas | 0 (broker), 1 (results), 2 (cache), 3 (sessions) |

### Django Security Settings (Producción): EXCELENTE

Todos los 11 controles de seguridad Django correctamente configurados (HSTS 1yr, SSL redirect, HttpOnly cookies, CSRF secure, X-Frame-Options DENY).

### Nginx Performance: BUENA

Gzip level 6, static cache 30d con immutable, media cache 7d, client_max_body_size 50M, rate limiting en login y API.

---

## Puntuación por Área

| Área | Puntuación | Justificación |
|------|-----------|---------------|
| Deploy automation | 8/10 | Script robusto, opciones granulares, health checks |
| Celery/Redis | 9/10 | 34 tareas, 11 colas, routing excelente |
| PostgreSQL | 8/10 | Health checks, encoding correcto, schemas ok |
| Nginx performance | 8/10 | Gzip, caching, rate limiting |
| Django prod settings | 10/10 | 11/11 security settings correctos |
| Docker Compose | 7/10 | Funcional, faltan health checks en backend/celery |
| Backups | 5/10 | Diarios pero sin offsite, sin test restore |
| SSL/TLS | 4/10 | Configurado pero expira pronto, sin auto-renewal |
| Monitoring | 3/10 | Health endpoints existen, 0 alertas configuradas |
| Disaster Recovery | 2/10 | Sin procedimiento probado, sin offsite, sin staging |
| **GLOBAL FASE 6** | **6.5/10** | Operacional, gaps críticos en DR y monitoring |

---

## Recomendaciones Priorizadas

| Prioridad | Acción | Esfuerzo | Impacto |
|-----------|--------|----------|---------|
| P0-1 | Renovar SSL antes de 2026-05-14 + evaluar Let's Encrypt | 1 hora | BLOQUEANTE |
| P0-2 | Testear restore de backup (pg_restore --dry-run) | 30 min | Validar DR |
| P0-3 | Configurar backup offsite (S3 o rsync remoto) | 2 horas | Data safety |
| P1-1 | Implementar monitoring con alertas (Uptime Kuma o Better Uptime) | 2 horas | Detección proactiva |
| P1-2 | Agregar health checks a backend/celery en Docker | 15 min | Dev reliability |
| P1-3 | Backup de media files (`/opt/stratekaz/backend/media/`) | 1 hora | Data completeness |
| P1-4 | Documentar servicios systemd en repo (templates) | 30 min | Reproducibilidad |
| P2-1 | Subir Redis maxmemory a 512MB-1GB en VPS | 5 min | Performance |
| P2-2 | Sincronizar rate limits Nginx↔DRF | 15 min | Consistencia |
| P2-3 | Crear staging environment (segundo VPS o Docker local) | 4 horas | Deploy safety |
| P3-1 | Triaje 863 alertas Dependabot | 2 horas | Security hygiene |
| P3-2 | Implementar UFW + fail2ban en VPS | 30 min | Server hardening |

---

## Comparativa con Fases Anteriores

| Aspecto | F1 (7.0) | F2 (7.5) | F3 (7.0) | F4 (6.0) | F5 (5.5) | F6 (6.5) |
|---------|----------|----------|----------|----------|----------|----------|
| Lo mejor | Cascada | 0 muerto | Types 10/10 | Infra 10/10 | Naming 10/10 | Celery 9/10 |
| Lo peor | Docs | Migraciones | RBAC FE | RBAC BE | Coverage 8% | **DR 2/10** |

---

*Reporte generado por 2 agentes especializados DevOps/Infrastructure ejecutados en paralelo.*
*Metodología: CVEA + ISO 27001 + SRE best practices*
