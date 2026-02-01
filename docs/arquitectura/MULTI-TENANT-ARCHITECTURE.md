# Arquitectura Multi-Tenant - StrateKaz ERP

## Resumen Ejecutivo

StrateKaz implementa una arquitectura **Multi-Tenant con BD por Cliente**, donde cada empresa cliente tiene su propia base de datos completamente aislada, pero comparte el mismo código de aplicación.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         1 VPS / 1 Instancia                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Nginx (SSL Wildcard *.stratekaz.com)                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Django + Gunicorn (código único)                               │   │
│  │  TenantMiddleware → DatabaseRouter                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│           ┌──────────────────┼──────────────────┐                       │
│           ▼                  ▼                  ▼                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │
│  │ stratekaz_master│ │ stratekaz_emp_1 │ │ stratekaz_emp_2 │           │
│  │ (BD Master)     │ │ (Cliente A)     │ │ (Cliente B)     │           │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Estrategia de Aislamiento

| Aspecto | Implementación |
|---------|----------------|
| **Datos** | BD separada por cliente (aislamiento total) |
| **Código** | Compartido (1 instancia Django) |
| **Acceso** | Subdominio único (`cliente.stratekaz.com`) |
| **Branding** | Configurable por cliente (PWA, colores, logos) |
| **Backups** | Independientes por cliente |

## Componentes Principales

### 1. BD Master (`stratekaz_master`)

Contiene la información global del sistema multi-tenant:

```python
# apps/tenant/models.py

class Plan:
    """Planes de suscripción"""
    - code, name, description
    - max_users, max_storage_gb
    - price_monthly, price_yearly
    - features (JSON: módulos habilitados)

class Tenant:
    """Registro de cada empresa cliente"""
    - code, name, nit
    - subdomain (único)
    - custom_domain (opcional)
    - db_name, db_host, db_port
    - plan (FK → Plan)
    - is_active, subscription_ends_at
    - logo_url, primary_color (branding mínimo para login)

class TenantUser:
    """Usuarios globales (pueden acceder a múltiples tenants)"""
    - email (único global)
    - password (hash)
    - first_name, last_name
    - is_superadmin

class TenantUserAccess:
    """Relación M:N: qué usuarios acceden a qué tenants"""
    - tenant_user (FK)
    - tenant (FK)
    - role (admin/user/readonly)
```

### 2. BD Cliente (`stratekaz_emp_XXX`)

Contiene todos los datos operativos de una empresa:

- **EmpresaConfig**: Datos fiscales + branding completo + PWA
- **Usuarios**: Usuarios internos de la empresa
- **Módulos operativos**: SST, PESV, ISO, etc.

### 3. TenantMiddleware

Detecta el tenant por subdominio y configura la conexión a su BD:

```python
# apps/tenant/middleware.py

class TenantMiddleware:
    def __call__(self, request):
        # 1. Extraer subdominio del host
        host = request.get_host()  # "cliente-abc.stratekaz.com"
        subdomain = host.split('.')[0]  # "cliente-abc"

        # 2. Buscar tenant en BD master
        tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)

        # 3. Validar suscripción
        if not tenant.is_subscription_valid:
            return HttpResponseForbidden("Suscripción vencida")

        # 4. Establecer tenant en request
        request.tenant = tenant
        set_current_tenant(tenant)  # Thread-local

        return self.get_response(request)
```

### 4. DatabaseRouter

Direcciona queries a la BD correcta:

```python
# apps/tenant/db_router.py

class TenantDatabaseRouter:
    MASTER_APPS = ['tenant', 'admin', 'auth']

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.MASTER_APPS:
            return 'default'  # BD master

        tenant = get_current_tenant()
        if tenant:
            return f"tenant_{tenant.id}"  # BD del tenant

        return 'default'
```

## Flujo de Request

```
1. Usuario accede: https://cliente-abc.stratekaz.com/dashboard

2. Nginx recibe request
   - SSL wildcard para *.stratekaz.com
   - Proxy a Django (localhost:8000)

3. TenantMiddleware
   - Extrae subdominio: "cliente-abc"
   - Busca en BD master: Tenant.get(subdomain="cliente-abc")
   - Valida: is_active=True, suscripción vigente
   - Configura: request.tenant = tenant

4. DatabaseRouter
   - Detecta tenant en thread-local
   - Redirige queries a: stratekaz_cliente_abc

5. Vista/ViewSet procesa request
   - Accede a modelos normalmente
   - Queries van automáticamente a BD del tenant

6. Response
   - Branding desde EmpresaConfig del tenant
   - PWA manifest dinámico
```

## Crear Nuevo Tenant

```bash
# Comando interactivo
python manage.py create_tenant

# Con parámetros
python manage.py create_tenant \
    --code=constructora-abc \
    --name="Constructora ABC S.A.S" \
    --nit=900123456-1 \
    --admin-email=admin@constructora.com \
    --plan=pro
```

El comando ejecuta:
1. Crea registro en `tenant_tenant`
2. Crea base de datos `stratekaz_constructora_abc`
3. Ejecuta migraciones en la nueva BD
4. Crea usuario administrador
5. Crea `EmpresaConfig` inicial

## Backups

Los backups son independientes por cliente:

```bash
# /scripts/backup_tenants.sh (cron diario 2:00 AM)

# 1. Backup BD master
mysqldump stratekaz_master | gzip > master_YYYY-MM-DD.sql.gz

# 2. Backup cada tenant activo
for tenant in $(mysql -e "SELECT db_name FROM tenant_tenant WHERE is_active=1"); do
    mysqldump $tenant | gzip > ${tenant}_YYYY-MM-DD.sql.gz
done

# 3. Limpiar backups antiguos (según retención configurada)
```

## Branding y PWA

Cada tenant tiene branding personalizado:

### Campos en EmpresaConfig (BD Cliente)

```python
# Branding visual
logo, logo_white, favicon, login_background
color_primario, color_secundario, color_acento
color_sidebar, color_fondo

# PWA
pwa_name, pwa_short_name, pwa_description
pwa_theme_color, pwa_background_color
pwa_icon_192, pwa_icon_512, pwa_icon_maskable

# Personalización
mostrar_powered_by, texto_footer
```

### Endpoints Públicos

```
GET /api/core/branding/active/
- Sin autenticación
- Retorna branding del tenant actual (o default si no hay tenant)

GET /api/core/branding/manifest/
- Sin autenticación
- Retorna manifest.json dinámico para PWA
- Personalizado por tenant
```

## Configuración de Infraestructura

### DNS

```
*.stratekaz.com  →  A  →  IP_DEL_VPS
```

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name *.stratekaz.com;

    # SSL Wildcard (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/stratekaz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stratekaz.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Wildcard (Let's Encrypt)

```bash
# Requiere validación DNS (no HTTP)
certbot certonly --manual --preferred-challenges dns \
    -d stratekaz.com -d *.stratekaz.com
```

## Escalabilidad

### Fase 1: VPS Único (Actual)
- 1 VPS con N bases de datos
- Capacidad: ~50-100 tenants pequeños

### Fase 2: BD Separada
- VPS Aplicación + VPS MySQL dedicado
- Capacidad: ~200-500 tenants

### Fase 3: Múltiples VPS
- Load balancer
- Múltiples VPS de aplicación
- MySQL cluster o RDS
- Capacidad: 1000+ tenants

## Seguridad

| Mecanismo | Descripción |
|-----------|-------------|
| Aislamiento BD | Cada cliente tiene BD separada |
| TenantMiddleware | Valida tenant antes de procesar request |
| DatabaseRouter | Impide queries cross-tenant |
| JWT | Tokens específicos por tenant |
| RBAC | Permisos granulares por usuario |
| Auditoría | Logs de acceso y cambios |

## Monitoreo

### Métricas por Tenant

- Usuarios activos
- Storage utilizado
- Requests/segundo
- Errores

### Alertas

- Suscripción por vencer
- Storage cerca del límite
- Errores frecuentes
- Intentos de acceso no autorizado

## Archivos Clave

```
backend/
├── apps/
│   └── tenant/
│       ├── models.py          # Plan, Tenant, TenantUser
│       ├── middleware.py      # TenantMiddleware
│       ├── db_router.py       # TenantDatabaseRouter
│       ├── admin.py           # Admin para gestionar tenants
│       └── management/
│           └── commands/
│               └── create_tenant.py
│
├── config/
│   └── settings.py
│       # DATABASE_ROUTERS = ['apps.tenant.db_router.TenantDatabaseRouter']
│       # MIDDLEWARE = [..., 'apps.tenant.middleware.TenantMiddleware', ...]
│
scripts/
└── backup_tenants.sh          # Script de backups automáticos
```

## Comandos Útiles

```bash
# Crear nuevo tenant
python manage.py create_tenant

# Migrar BD específica de tenant
python manage.py migrate --database=tenant_1

# Shell con tenant específico
python manage.py shell
>>> from apps.tenant.middleware import set_current_tenant
>>> from apps.tenant.models import Tenant
>>> tenant = Tenant.objects.get(code='cliente-abc')
>>> set_current_tenant(tenant)
>>> # Ahora las queries van a la BD del tenant
```
