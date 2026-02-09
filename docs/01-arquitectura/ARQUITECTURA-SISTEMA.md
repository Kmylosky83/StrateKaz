# StrateKaz - Arquitectura del Sistema

> **Versión:** 4.2.0
> **Última actualización:** 2026-02-08
> **Tipo:** Monolito Modular + Multi-tenant (PostgreSQL Schemas)

---

## 1. Visión General

StrateKaz es un **Sistema Integrado de Gestión Empresarial (ERP)** SaaS diseñado con arquitectura de **Monolito Modular** que permite:

- Escalabilidad horizontal mediante contenedores
- Migración gradual a microservicios si se requiere
- Multi-tenancy con aislamiento por schemas PostgreSQL
- Deployment incremental por niveles funcionales
- Arquitectura de 6 niveles jerárquicos con dependencias estrictas

---

## 2. Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.11+ | Lenguaje base |
| Django | 5.0+ | Framework web |
| Django REST Framework | 3.14+ | API REST |
| PostgreSQL | 15+ | Base de datos (schemas multi-tenant) |
| Redis | 7+ | Cache + Celery broker |
| Celery | 5.3+ | Tareas asíncronas |
| django-tenants | 3.6+ | Multi-tenant con schemas |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.2+ | UI Library |
| TypeScript | 5.3+ | Type safety |
| Vite | 5.0+ | Build tool (dev + production) |
| Tailwind CSS | 3.4+ | Estilos |
| Zustand | 4.4+ | State management |
| TanStack Query | 5.14+ | Data fetching |

### DevOps

| Tecnología | Propósito |
|------------|-----------|
| Docker | Contenedores |
| Docker Compose | Orquestación desarrollo |
| GitHub Actions | CI/CD |
| Nginx | Reverse proxy |
| Gunicorn | WSGI server |

---

## 3. Arquitectura de 6 Niveles

El sistema está organizado en **6 niveles jerárquicos** con dependencias estrictas que garantizan separación de responsabilidades, dependencias unidireccionales y escalabilidad modular.

```
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEL 6: INTELIGENCIA                        │
│              analytics, audit_system                            │
│         (Depende de: Niveles 0-5)                              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEL 5: HABILITADORES                       │
│         talent_hub, admin_finance, accounting                   │
│         (Depende de: Niveles 0-4)                              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEL 4: CADENA DE VALOR                     │
│    supply_chain, production_ops, logistics_fleet, sales_crm    │
│         (Depende de: Niveles 0-3)                              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEL 3: TORRE DE CONTROL                    │
│                      hseq_management                            │
│         (Depende de: Niveles 0-2)                              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEL 2: CUMPLIMIENTO                        │
│       motor_cumplimiento, motor_riesgos, workflow_engine       │
│         (Depende de: Niveles 0-1)                              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEL 1: ESTRATÉGICO                         │
│                   gestion_estrategica                           │
│         (Depende de: Nivel 0)                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEL 0: CORE BASE                           │
│                      core, tenant                               │
│         (Sin dependencias internas)                            │
└─────────────────────────────────────────────────────────────────┘
```

### NIVEL 0: Core Base

**Propósito:** Fundamentos del sistema - autenticación, usuarios, RBAC, multi-tenancy.

| Módulo | Descripción | Sub-apps |
|--------|-------------|----------|
| `core` | Autenticación, usuarios, RBAC, configuración, menú | users, roles, permissions, config, menu |
| `tenant` | Sistema multi-tenant con PostgreSQL schemas | tenants, plans, domains |

**Características:**
- Sin dependencias de otros módulos del sistema
- Base para todos los demás niveles
- Implementa autenticación JWT y RBAC
- Gestiona el aislamiento multi-tenant

### NIVEL 1: Estratégico

**Propósito:** Dirección estratégica corporativa - misión, visión, objetivos, estructura organizacional.

| Módulo | Sub-apps |
|--------|----------|
| `gestion_estrategica` | configuracion, organizacion, identidad, planeacion, contexto, encuestas, gestion_proyectos, revision_direccion, gestion_documental, planificacion_sistema |

**Características:**
- Define la estructura organizacional (áreas, cargos, sedes)
- Gestiona identidad corporativa (misión, visión, políticas)
- Control documental y versionamiento
- Planeación estratégica y objetivos

### NIVEL 2: Cumplimiento

**Propósito:** Motores de cumplimiento normativo, riesgos y flujos de trabajo.

| Módulo | Sub-apps |
|--------|----------|
| `motor_cumplimiento` | matriz_legal, requisitos_legales, partes_interesadas, reglamentos_internos |
| `motor_riesgos` | riesgos_procesos, ipevr, aspectos_ambientales, riesgos_viales, seguridad_informacion, sagrilaft_ptee |
| `workflow_engine` | disenador_flujos, ejecucion, monitoreo, firma_digital |

**Características:**
- Matriz legal con evaluación de cumplimiento
- 6 tipos de riesgos (procesos, SST, ambiental, vial, seguridad info, SAGRILAFT)
- Motor BPMN para flujos de trabajo
- Firma digital integrada

### NIVEL 3: Torre de Control

**Propósito:** HSEQ - Seguridad, Salud, Ambiente y Calidad.

| Módulo | Sub-apps |
|--------|----------|
| `hseq_management` | accidentalidad, seguridad_industrial, higiene_industrial, medicina_laboral, emergencias, gestion_ambiental, calidad, mejora_continua, gestion_comites |

**Características:**
- Gestión de accidentes e investigaciones
- Inspecciones de seguridad y EPP
- Vigilancia epidemiológica y exámenes médicos
- Plan de emergencias y simulacros
- No conformidades y acciones correctivas
- Comités (COPASST, CCL, Convivencia)

### NIVEL 4: Cadena de Valor

**Propósito:** Operaciones del negocio - compras, producción, logística, ventas.

| Módulo | Sub-apps |
|--------|----------|
| `supply_chain` | catalogos, gestion_proveedores, compras, almacenamiento, programacion_abastecimiento |
| `production_ops` | recepcion, procesamiento, producto_terminado, mantenimiento |
| `logistics_fleet` | gestion_flota, gestion_transporte |
| `sales_crm` | gestion_clientes, pipeline_ventas, pedidos_facturacion, servicio_cliente |

**Características:**
- Ciclo completo de compras (requisición → recepción)
- Producción con trazabilidad de lotes
- Flota vehicular con cumplimiento PESV
- CRM con pipeline Kanban y PQRS

### NIVEL 5: Habilitadores

**Propósito:** Recursos que soportan la operación - talento humano, finanzas, contabilidad.

| Módulo | Sub-apps |
|--------|----------|
| `talent_hub` | estructura_cargos, seleccion_contratacion, colaboradores, onboarding_induccion, formacion_reinduccion, desempeno, control_tiempo, novedades, nomina, proceso_disciplinario, off_boarding |
| `admin_finance` | presupuesto, tesoreria, activos_fijos, servicios_generales |
| `accounting` | config_contable, movimientos, informes_contables, integracion |

**Características:**
- Ciclo completo de talento humano (selección → retiro)
- LMS para capacitación con certificados
- Evaluación de desempeño 360°
- Nómina y novedades
- Presupuesto y tesorería
- Contabilidad (módulo activable)

### NIVEL 6: Inteligencia

**Propósito:** Análisis, indicadores, auditoría y notificaciones.

| Módulo | Sub-apps |
|--------|----------|
| `analytics` | config_indicadores, indicadores_area, acciones_indicador, dashboard_gerencial, generador_informes, analisis_tendencias, exportacion_integracion |
| `audit_system` | logs_sistema, config_alertas, centro_notificaciones, tareas_recordatorios |

**Características:**
- KPIs configurables con fichas técnicas
- Dashboards BSC (4 perspectivas)
- Análisis de tendencias y detección de anomalías
- Generador de informes dinámicos
- Auditoría completa de accesos y cambios
- Sistema de alertas y notificaciones
- Gestión de tareas y recordatorios

---

## 4. Reglas de Dependencias

### Regla Principal

```
NIVEL N solo puede importar de NIVEL < N
```

### Matriz de Dependencias Permitidas

| Nivel | Puede importar de |
|-------|-------------------|
| 0 | Solo Django/third-party |
| 1 | 0 |
| 2 | 0, 1 |
| 3 | 0, 1, 2 |
| 4 | 0, 1, 2, 3 |
| 5 | 0, 1, 2, 3, 4 |
| 6 | 0, 1, 2, 3, 4, 5 |

### Prohibiciones Absolutas

```
❌ Importaciones circulares entre módulos del mismo nivel
❌ Importaciones de nivel superior (N importa de N+1)
❌ Importaciones directas entre sub-apps de diferentes módulos
   (usar interfaces/signals en su lugar)
```

### Comunicación Entre Módulos

| Método | Cuándo usar | Ejemplo |
|--------|-------------|---------|
| **Import directo** | Nivel inferior → mismo módulo | `from apps.core.models import User` |
| **ForeignKey string** | Referencias a modelos | `ForeignKey('core.User')` |
| **Signals** | Eventos desacoplados | `user_created.send()` |
| **Services** | Lógica de negocio compartida | `CoreService.get_user()` |
| **Celery Tasks** | Operaciones asíncronas | `notify_user.delay(user_id)` |

### Procesamiento Asincrono (Celery)

El sistema utiliza **Celery + Redis** para tareas asincronas y programadas:

| Modulo | Tareas | Queue |
|--------|--------|-------|
| `tenant` | Creacion de schemas, datos iniciales | default |
| `talent_hub` | check_contratos_por_vencer, check_periodos_prueba | compliance |
| `workflow_engine` | monitorear_sla_tareas (cada 5 min) | workflows |
| `analytics` | auto_calculate_kpis, snapshot_dashboard (cada hora) | analytics |
| `revision_direccion` | verificar_compromisos_vencidos (7AM), enviar_recordatorio_revision (8AM) | compliance, notifications |

Ver [CELERY-REDIS.md](../04-devops/CELERY-REDIS.md) para configuracion completa.

---

## 5. Arquitectura Multi-Tenant

### Estrategia: PostgreSQL Schemas con django-tenants

StrateKaz implementa multi-tenancy mediante **schemas de PostgreSQL**, proporcionando aislamiento completo de datos entre clientes.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                      "stratekaz"                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  Schema: public (compartido)                  │
│  │   Tenant    │  - Tenant, TenantUser, Plan                   │
│  │   Plan      │  - TenantDomain, TenantUserAccess             │
│  │   Domain    │                                                │
│  └─────────────┘                                                │
│                                                                 │
│  ┌─────────────┐  Schema: tenant_empresa_abc                   │
│  │   User      │  - Todos los modelos operativos               │
│  │   Proyecto  │  - Aislamiento completo                       │
│  │   Riesgo    │                                                │
│  │   ...       │                                                │
│  └─────────────┘                                                │
│                                                                 │
│  ┌─────────────┐  Schema: tenant_empresa_xyz                   │
│  │   User      │  - Datos completamente separados              │
│  │   Proyecto  │  - Usuario específico opcional                │
│  │   Riesgo    │                                                │
│  │   ...       │                                                │
│  └─────────────┘                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Identificación del Tenant

**Prioridad de detección:**
1. Header `X-Tenant-ID` (API/testing)
2. Dominio personalizado (`erp.cliente.com`)
3. Subdominio (`cliente.stratekaz.com`)

### Modelos Compartidos vs Tenant

| Tipo | Schema | Modelos |
|------|--------|---------|
| **Compartido** | `public` | Tenant, Plan, TenantUser, TenantDomain |
| **Por Tenant** | `tenant_*` | User, todos los modelos de negocio |

### Ventajas del Esquema Multi-Tenant

- **Aislamiento completo:** Datos separados físicamente por schema
- **Seguridad:** Imposible acceder a datos de otros tenants
- **Backups selectivos:** Backup por cliente individual
- **Migraciones independientes:** Cada tenant puede tener versiones diferentes
- **Performance:** Índices y queries optimizados por tenant

---

## 6. Arquitectura de API REST

### Estructura de URLs

```
/api/v1/{modulo}/{recurso}/
/api/v1/{modulo}/{recurso}/{id}/
/api/v1/{modulo}/{recurso}/{id}/{accion}/
```

### Ejemplo de Endpoints

```
GET    /api/v1/gestion-estrategica/proyectos/
POST   /api/v1/gestion-estrategica/proyectos/
GET    /api/v1/gestion-estrategica/proyectos/123/
PUT    /api/v1/gestion-estrategica/proyectos/123/
PATCH  /api/v1/gestion-estrategica/proyectos/123/
DELETE /api/v1/gestion-estrategica/proyectos/123/
POST   /api/v1/gestion-estrategica/proyectos/123/aprobar/
```

### Response Format Estándar

**Success:**
```json
{
    "success": true,
    "data": { ... },
    "message": "Operación exitosa",
    "errors": null,
    "meta": {
        "page": 1,
        "per_page": 20,
        "total": 100,
        "total_pages": 5
    }
}
```

**Error:**
```json
{
    "success": false,
    "data": null,
    "message": "Error de validación",
    "errors": {
        "nombre": ["Este campo es requerido"],
        "fecha_inicio": ["La fecha debe ser futura"]
    },
    "meta": null
}
```

### Convenciones

- **URLs:** kebab-case (`/gestion-estrategica/`)
- **Campos JSON:** snake_case (`fecha_inicio`)
- **Paginación:** Default 20 items por página
- **Filtros:** Query parameters (`?estado=activo&area=5`)
- **Ordenamiento:** `?ordering=-created_at` (desc), `?ordering=nombre` (asc)

---

## 7. Seguridad

### Autenticación

- **JWT** con access token (60 min) + refresh token (24 hrs)
- **2FA opcional** con TOTP para usuarios sensibles
- **Rate limiting** en endpoints de autenticación y acciones críticas
- **Password policies:** Mínimo 8 caracteres, complejidad configurable

### Autorización

- **RBAC (Role-Based Access Control)**
- Permisos por módulo, acción y alcance (propio, área, global)
- Validación a nivel de ViewSet y Service
- Permisos heredables por jerarquía organizacional

### Multi-tenant Security

- **Aislamiento total** por schema PostgreSQL
- **Validación de tenant** en cada request mediante middleware
- **Usuarios multi-tenant:** Un usuario puede acceder a múltiples tenants
- **Logs de acceso:** Auditoría de acceso entre tenants

### Headers de Seguridad

- **CORS:** Configurado para dominios autorizados
- **CSP (Content Security Policy):** Prevención de XSS
- **HSTS:** Forzar HTTPS
- **X-Frame-Options:** Prevención de clickjacking
- **X-Content-Type-Options:** nosniff

### Protección de Datos

- **Encriptación en tránsito:** TLS 1.3
- **Encriptación en reposo:** PostgreSQL con pgcrypto
- **Sensitive data masking:** Campos sensibles enmascarados en logs
- **Data retention policies:** Configurables por tenant

---

## 8. Estructura de Directorios

```
StrateKaz/
├── docs/
│   ├── 01-arquitectura/
│   │   ├── ARQUITECTURA-SISTEMA.md     # Este documento
│   │   ├── CATALOGO-MODULOS.md         # Detalle módulos
│   │   └── DATABASE-ARCHITECTURE.md    # Arquitectura BD
│   ├── 02-desarrollo/
│   │   ├── DOCKER.md
│   │   └── GUIA-DESARROLLO.md
│   └── 00-EMPEZAR-AQUI.md
│
├── backend/
│   ├── apps/                           # Aplicaciones Django
│   │   ├── core/                      # NIVEL 0
│   │   ├── tenant/                    # NIVEL 0
│   │   ├── gestion_estrategica/       # NIVEL 1
│   │   ├── motor_cumplimiento/        # NIVEL 2
│   │   ├── motor_riesgos/             # NIVEL 2
│   │   ├── workflow_engine/           # NIVEL 2
│   │   ├── hseq_management/           # NIVEL 3
│   │   ├── supply_chain/              # NIVEL 4
│   │   ├── production_ops/            # NIVEL 4
│   │   ├── logistics_fleet/           # NIVEL 4
│   │   ├── sales_crm/                 # NIVEL 4
│   │   ├── talent_hub/                # NIVEL 5
│   │   ├── admin_finance/             # NIVEL 5
│   │   ├── accounting/                # NIVEL 5
│   │   ├── analytics/                 # NIVEL 6
│   │   └── audit_system/              # NIVEL 6
│   │
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   ├── production.py
│   │   │   └── testing.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   │
│   ├── utils/
│   │   ├── models.py                  # Modelos base
│   │   ├── validators.py
│   │   ├── permissions.py
│   │   └── exceptions.py
│   │
│   ├── scripts/
│   │   ├── validate_dependencies.py
│   │   └── create_tenant.py
│   │
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   │
│   ├── manage.py
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/                       # Cliente HTTP
│   │   ├── components/                # Componentes UI
│   │   ├── features/                  # Módulos funcionales
│   │   ├── hooks/                     # Custom hooks
│   │   ├── layouts/                   # Layouts
│   │   ├── pages/                     # Páginas
│   │   ├── routes/                    # Routing
│   │   ├── store/                     # Zustand stores
│   │   ├── types/                     # TypeScript types
│   │   └── utils/                     # Utilidades
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile.dev
│
├── docker/
│   ├── nginx/
│   │   └── nginx.conf
│   └── postgres/
│       └── init.sql
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 9. Modelos Base

Todos los modelos heredan de clases base ubicadas en `backend/utils/models.py`.

### TimeStampedModel

```python
class TimeStampedModel(models.Model):
    """Campos de auditoría temporal."""
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

### SoftDeleteModel

```python
class SoftDeleteModel(models.Model):
    """Soft delete en lugar de DELETE físico."""
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey('core.User', ...)

    def soft_delete(self, user=None):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save()
```

### TenantModel (para modelos de tenant)

```python
class TenantModel(TimeStampedModel, SoftDeleteModel, AuditModel):
    """
    Modelo base para TODOS los modelos que pertenecen a un tenant.
    Hereda: timestamps, soft-delete, auditoría.
    """
    class Meta:
        abstract = True
```

### SharedModel (para modelos compartidos)

```python
class SharedModel(TimeStampedModel):
    """
    Modelo base para modelos compartidos (schema public).
    Solo timestamps, sin soft-delete.
    """
    class Meta:
        abstract = True
```

---

## 10. Deployment

### Ambientes

| Ambiente | Propósito | URL |
|----------|-----------|-----|
| Development | Desarrollo local | localhost:8000 |
| Staging | Testing QA | staging.stratekaz.com |
| Production | Producción | *.stratekaz.com |

### CI/CD Pipeline

```
Push to main
    │
    ├── Run tests (pytest)
    ├── Run linters (flake8, black, mypy)
    ├── Build Docker images
    ├── Push to registry
    │
    ├── [staging] Auto-deploy
    │
    └── [production] Manual approval → Deploy
```

### Infraestructura

- **Contenedores:** Docker + Docker Compose
- **Orquestación:** Kubernetes (producción) / Docker Compose (desarrollo)
- **Base de datos:** PostgreSQL 15+ con schemas
- **Cache:** Redis 7+
- **Worker:** Celery + Redis broker
- **Proxy:** Nginx como reverse proxy
- **SSL/TLS:** Let's Encrypt automático

---

## 11. Beneficios de la Arquitectura

| Beneficio | Descripción |
|-----------|-------------|
| **Mantenibilidad** | Cambios aislados por nivel, fácil localizar código |
| **Testabilidad** | Tests independientes por módulo, mockeo simplificado |
| **Escalabilidad** | Fácil agregar nuevos módulos sin afectar existentes |
| **Deployment** | Posibilidad de deployment incremental por niveles |
| **Onboarding** | Curva de aprendizaje estructurada para nuevos desarrolladores |
| **Multi-tenant** | Aislamiento completo de datos por cliente |
| **Seguridad** | RBAC granular + aislamiento por schemas |

---

## 12. Referencias

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [django-tenants](https://django-tenants.readthedocs.io/)
- [React 18 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Twelve-Factor App](https://12factor.net/)

---

## 13. Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 4.2.0 | 2026-02-08 | Sprints 1-4 completados: workflow engine, BI/analytics, frontend workflow, revision direccion |
| 4.0.0 | 2026-02-06 | Documento consolidado: arquitectura general + 6 niveles |
| 3.8.1 | 2025-01-31 | Migración a PostgreSQL schemas (django-tenants) |
