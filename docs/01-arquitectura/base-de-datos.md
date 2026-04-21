# Arquitectura de Base de Datos - StrateKaz

> **Versión:** 4.0.0
> **Última actualización:** 2026-02-03
> **Motor:** PostgreSQL 15+ con django-tenants

---

## 1. Estrategia Multi-Tenant

### PostgreSQL Schemas

StrateKaz utiliza **django-tenants** para implementar multi-tenancy con aislamiento por schemas de PostgreSQL.

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

### Ventajas de Schemas

| Característica | Beneficio |
|----------------|-----------|
| **Aislamiento** | Datos completamente separados por tenant |
| **Seguridad** | Sin riesgo de filtración de datos entre tenants |
| **Backup** | Backup individual por tenant posible |
| **Rendimiento** | Índices y estadísticas por schema |
| **Escalabilidad** | Fácil migración a BD separadas si es necesario |

---

## 2. Modelos Compartidos vs Tenant

### Modelos Compartidos (Schema `public`)

```python
# En apps.tenant
SHARED_APPS = [
    'django_tenants',
    'apps.tenant',  # Tenant, Plan, Domain, TenantUser
]
```

| Modelo | Descripción |
|--------|-------------|
| `Tenant` | Información del tenant (empresa) |
| `Plan` | Plan de suscripción |
| `Domain` | Dominios asociados al tenant |
| `TenantUser` | Usuarios globales con acceso a tenants |

### Modelos por Tenant (Schema `tenant_*`)

```python
TENANT_APPS = [
    'apps.core',                    # User, Role, Permission
    'apps.gestion_estrategica.*',   # Nivel 1
    'apps.motor_cumplimiento.*',    # Nivel 2
    'apps.motor_riesgos.*',         # Nivel 2
    'apps.workflow_engine.*',       # Nivel 2
    'apps.hseq_management.*',       # Nivel 3
    'apps.supply_chain.*',          # Nivel 4
    'apps.production_ops.*',        # Nivel 4
    'apps.logistics_fleet.*',       # Nivel 4
    'apps.sales_crm.*',             # Nivel 4
    'apps.talent_hub.*',            # Nivel 5
    'apps.admin_finance.*',         # Nivel 5
    'apps.accounting.*',            # Nivel 5
    'apps.analytics.*',             # Nivel 6
    'apps.audit_system.*',          # Nivel 6
]
```

---

## 3. Modelos Base

Ubicados en `backend/utils/models.py`:

### TimeStampedModel

```python
class TimeStampedModel(models.Model):
    """Campos de auditoría temporal."""
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']
```

### SoftDeleteModel

```python
class SoftDeleteModel(models.Model):
    """Soft delete en lugar de DELETE físico."""
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey('core.User', null=True, on_delete=models.SET_NULL)

    objects = SoftDeleteManager()  # Excluye eliminados por defecto
    all_objects = models.Manager()  # Incluye eliminados

    class Meta:
        abstract = True

    def soft_delete(self, user=None): ...
    def restore(self): ...
```

### AuditModel

```python
class AuditModel(models.Model):
    """Campos de auditoría de usuario."""
    created_by = models.ForeignKey('core.User', null=True, on_delete=models.SET_NULL)
    updated_by = models.ForeignKey('core.User', null=True, on_delete=models.SET_NULL)

    class Meta:
        abstract = True
```

### TenantModel (Herencia combinada)

```python
class TenantModel(TimeStampedModel, SoftDeleteModel, AuditModel):
    """
    Modelo base para TODOS los modelos de tenant.
    Hereda: timestamps, soft-delete, auditoría.
    """
    class Meta:
        abstract = True
```

### SharedModel

```python
class SharedModel(TimeStampedModel):
    """
    Modelo base para modelos compartidos (schema public).
    Solo timestamps, sin soft-delete ni auditoría.
    """
    class Meta:
        abstract = True
```

### Mixins Adicionales

| Mixin | Propósito | Campos |
|-------|-----------|--------|
| `OrderedModel` | Ordenamiento manual | `order` |
| `SlugModel` | URL-friendly | `slug` |
| `ActivableModel` | Activar/desactivar | `is_active` |
| `CodeModel` | Código único | `code` |
| `DescriptionModel` | Nombre y descripción | `name`, `description` |

---

## 4. Configuración Django

### settings/base.py

```python
# PostgreSQL con django-tenants
DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': config('DB_NAME', default='stratekaz'),
        'USER': config('DB_USER', default='stratekaz'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Router para django-tenants
DATABASE_ROUTERS = ['django_tenants.routers.TenantSyncRouter']

# Modelos de tenant
TENANT_MODEL = 'tenant.Tenant'
TENANT_DOMAIN_MODEL = 'tenant.Domain'
```

---

## 5. Identificación del Tenant

**Prioridad de detección:**

1. **Header `X-Tenant-ID`** (API/testing)
2. **Dominio personalizado** (`erp.cliente.com`)
3. **Subdominio** (`cliente.stratekaz.com`)

### Middleware

```python
# django_tenants.middleware.main.TenantMainMiddleware
# DEBE ir primero en MIDDLEWARE
```

---

## 6. Migraciones Multi-Tenant

### Comandos

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar a todos los schemas
python manage.py migrate_schemas

# Aplicar solo a public
python manage.py migrate_schemas --shared

# Aplicar a tenant específico
python manage.py migrate_schemas --tenant=empresa_abc
```

---

## 7. Estadísticas de Modelos

| Nivel | Módulo | Tablas Aprox. |
|-------|--------|---------------|
| 0 | core | ~15 |
| 0 | tenant | ~5 |
| 1 | gestion_estrategica | ~40 |
| 2 | motor_cumplimiento | ~20 |
| 2 | motor_riesgos | ~35 |
| 2 | workflow_engine | ~15 |
| 3 | hseq_management | ~45 |
| 4 | supply_chain | ~35 |
| 4 | production_ops | ~33 |
| 4 | logistics_fleet | ~25 |
| 4 | sales_crm | ~37 |
| 5 | talent_hub | ~65 |
| 5 | admin_finance | ~20 |
| 5 | accounting | ~15 |
| 6 | analytics | ~23 |
| 6 | audit_system | ~16 |
| **Total** | | **~440+** |

---

## 8. Índices Recomendados

### Índices Automáticos

```python
# Campos con db_index=True en modelos base
created_at = models.DateTimeField(db_index=True)
is_deleted = models.BooleanField(db_index=True)
is_active = models.BooleanField(db_index=True)
order = models.PositiveIntegerField(db_index=True)
slug = models.SlugField(db_index=True)
code = models.CharField(db_index=True)
```

### Índices Compuestos Sugeridos

```python
class Meta:
    indexes = [
        models.Index(fields=['is_deleted', 'created_at']),
        models.Index(fields=['is_active', 'is_deleted']),
        models.Index(fields=['created_by', 'created_at']),
    ]
```

---

## 9. Backup y Restauración

### Backup Completo

```bash
# Backup de toda la BD
pg_dump -U stratekaz -h localhost stratekaz > backup_full.sql

# Backup comprimido
pg_dump -U stratekaz stratekaz | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Backup por Schema (Tenant)

```bash
# Backup de un tenant específico
pg_dump -U stratekaz -n tenant_empresa_abc stratekaz > backup_empresa_abc.sql
```

### Restauración

```bash
# Restaurar backup completo
psql -U stratekaz -d stratekaz < backup_full.sql

# Restaurar schema específico
psql -U stratekaz -d stratekaz < backup_empresa_abc.sql
```

---

## 10. Monitoreo

### Queries Útiles

```sql
-- Listar todos los schemas (tenants)
SELECT schema_name FROM information_schema.schemata
WHERE schema_name LIKE 'tenant_%';

-- Tamaño por schema
SELECT schema_name,
       pg_size_pretty(sum(pg_total_relation_size(schemaname||'.'||tablename))::bigint) as size
FROM information_schema.schemata s
JOIN pg_tables t ON t.schemaname = s.schema_name
WHERE schema_name LIKE 'tenant_%'
GROUP BY schema_name
ORDER BY sum(pg_total_relation_size(schemaname||'.'||tablename)) DESC;

-- Conexiones activas por tenant
SELECT datname, usename, application_name, client_addr, state
FROM pg_stat_activity
WHERE datname = 'stratekaz';
```

---

## Referencias

- [django-tenants Documentation](https://django-tenants.readthedocs.io/)
- [PostgreSQL Schemas](https://www.postgresql.org/docs/current/ddl-schemas.html)
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Arquitectura general
