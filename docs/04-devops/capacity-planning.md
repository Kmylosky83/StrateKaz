---
name: Planificación de capacidad y escalamiento
description: Fórmula de carga, tabla de alertas VPS, capacidad tenants/usuarios, roadmap de escalamiento
type: project
---

# Planificación de Capacidad — StrateKaz SGI

**Análisis realizado:** 2026-04-03
**Infraestructura:** VPS Hostinger — 2 CPU, 8 GB RAM, Ubuntu 24.04 LTS

## Fórmula de carga

```
Carga = (Tenants × 40) + (Usuarios totales × 1)
```

El tenant pesa 40x más que un usuario porque arrastra:
- 34 tareas Celery Beat periódicas por tenant
- Schema PostgreSQL (~200-350 tablas según módulos activos)
- Namespace cache Redis aislado
- Tiempo de migración en deploys

## Tabla de alertas — VPS actual (2 CPU / 8 GB)

| Carga      | Color       | Acción requerida |
|------------|-------------|-----------------|
| < 2,500    | **VERDE**   | Nada |
| 2,500-4,500| **AMARILLO**| Config: Redis 1GB + Gunicorn gthread |
| 4,500-7,000| **NARANJA** | Upgrade: 4 CPU / 16 GB (~$180K COP/mes) |
| > 7,000    | **ROJO**    | pgbouncer + VPS 8 CPU o separar DB |

## Escenarios reales

| Mix de clientes | Cálculo | Carga | Nivel |
|----------------|---------|-------|-------|
| 20 PyMEs(10) + 5 medianas(80) + 1 grande(300) | (26×40)+800 | 1,840 | VERDE |
| 60 PyMEs(10) + 10 medianas(50) + 2 grandes(200) | (72×40)+1,500 | 4,380 | AMARILLO |
| 80 PyMEs(15) + 15 medianas(80) + 5 grandes(300) | (100×40)+3,900 | 7,900 | ROJO |

**Modelo principal:** Muchas PyMEs pequeñas (5-15 colaboradores)
- 100 PyMEs × 10 colaboradores = Carga (100×40)+1,000 = 5,000 → NARANJA

## Patrón de uso real (PyME 10 personas)

- Gerente: 1-2 veces/día, dashboard + aprobaciones (~30 req/día)
- Coordinador HSEQ: 2-3 horas creando docs, evidencias (~80 req/día)
- Admin/Contador: 30 min/día (~20 req/día)
- 7 operarios: Mi Portal 1 vez/semana a firmar (~8 req/semana c/u)
- **Usuarios activos simultáneos por PyME:** 1-2 promedio, 4-5 pico

## Proveedores/Clientes cross-tenant

- Son portal externo de solo lectura + carga de archivos
- Impacto en capacidad: despreciable (~5 req/sesión esporádica)
- Multi-tenant via dropdown (TenantSelectView) — 1 User en public con TenantUserAccess a N tenants

## Bottlenecks por prioridad

1. **Redis 256MB** → subir a 1-2GB (config change, $0)
2. **Sin pgbouncer** → instalar para connection pooling (1-2 horas)
3. **2 CPU techo** → upgrade a 4 CPU / 16GB (~$15-25 USD/mes más)
4. **Gunicorn sync** → migrar a gthread (config change)
5. **Middleware 4-5 queries/req** → cache tenant lookup en Redis
6. **Celery Beat × tenants** → 34 tareas × N tenants crece linealmente
7. **migrate_schemas lento** → con 100 tenants puede tomar 30+ min

## Roadmap de escalamiento

| Fase | Trigger | Acción | Costo |
|------|---------|--------|-------|
| 0 | Actual (3 tenants, ~10 users) | Nada | $0 |
| 1 | Carga > 2,500 (~50 tenants) | Redis 1GB + Gunicorn gthread + PG tuning | Config changes |
| 2 | Carga > 4,500 (~80 tenants) | VPS 4 CPU / 16 GB | ~$180K COP/mes |
| 3 | Carga > 7,000 (~100+ tenants) | pgbouncer + Redis dedicado | Infra dedicada |
| 4 | Carga > 10,000 | Separar DB + read replica + CDN | Multi-server |

## Monolito modular — Salud verificada (2026-04-03)

- **179 modelos** en 24 apps Django
- **138 migraciones** aplicadas, 0 pendientes
- **0 errores bloqueantes** en system checks
- **29 tablas talent_hub_* fantasma** (legacy, vacías, no afectan)
- Activar todos los módulos (L30-L60): impacto marginal — lazy loading FE + tablas sin consultar no usan RAM
- **Superadmin bloqueado** de crear documentos (PermissionDenied 403 si no tiene cargo)

**Why:** El usuario necesita saber cuándo escalar infra sin over-engineering prematuro.
**How to apply:** Cuando se discuta pricing, onboarding de clientes, o deploy de módulos nuevos, usar la fórmula de carga para estimar si el VPS actual aguanta.
