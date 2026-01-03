# Arquitectura Unitenant: Bases de Datos Separadas
## SGI - Sistema de Gestión Integral

**Versión:** 1.0
**Fecha:** 2025-12-30

---

## 1. Visión General

### 1.1 Definición del Modelo Unitenant

El modelo **unitenant** significa que cada empresa cliente tiene:

- Su propia **instancia de código** (copia completa del sistema)
- Su propia **base de datos** MySQL
- Su propio **subdominio**
- Su propia **configuración** personalizada
- **Aislamiento total** de datos con otras empresas

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MODELO UNITENANT                             │
│                                                                      │
│    ┌─────────┐      ┌─────────┐      ┌─────────┐                   │
│    │Empresa 1│      │Empresa 2│      │Empresa N│                   │
│    │         │      │         │      │         │                   │
│    │ ┌─────┐ │      │ ┌─────┐ │      │ ┌─────┐ │                   │
│    │ │Code │ │      │ │Code │ │      │ │Code │ │                   │
│    │ └─────┘ │      │ └─────┘ │      │ └─────┘ │                   │
│    │ ┌─────┐ │      │ ┌─────┐ │      │ ┌─────┐ │                   │
│    │ │ DB  │ │      │ │ DB  │ │      │ │ DB  │ │                   │
│    │ └─────┘ │      │ └─────┘ │      │ └─────┘ │                   │
│    └─────────┘      └─────────┘      └─────────┘                   │
│         │                │                │                         │
│         └────────────────┼────────────────┘                         │
│                          │                                          │
│              ┌───────────▼───────────┐                              │
│              │   SERVIDOR CPANEL     │                              │
│              │   (Recursos Shared)   │                              │
│              └───────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Comparación con Otros Modelos

| Característica | Unitenant (Actual) | Multitenant Schema | Multitenant Row-Level |
|----------------|--------------------|--------------------|----------------------|
| **Aislamiento** | Total | Alto | Medio |
| **Personalización** | Máxima | Alta | Limitada |
| **Mantenimiento** | Por instancia | Centralizado | Centralizado |
| **Costo por cliente** | Medio | Bajo | Muy bajo |
| **Complejidad** | Baja | Media | Alta |
| **Escalabilidad** | Limitada | Buena | Excelente |
| **Ideal para** | < 20 clientes | 20-100 clientes | > 100 clientes |

---

## 2. Estructura de Base de Datos

### 2.1 Convención de Nombres

```
Formato MySQL (cPanel):
└── {prefijo_cpanel}_{identificador_empresa}_{sufijo}

Ejemplos:
├── strat_grasas_sgi      → Base de datos principal
├── strat_grasas_usr      → Usuario de base de datos
├── strat_cliente2_sgi    → Otra empresa
└── strat_demo_sgi        → Ambiente de demostración

Nota: "strat" es el prefijo automático de cPanel basado en el usuario.
```

### 2.2 Esquema de Tablas (Idéntico por Empresa)

Cada base de datos contiene **exactamente las mismas tablas**:

```sql
-- Módulos Core (14 tablas)
├── auth_user
├── auth_group
├── auth_permission
├── core_usuario
├── core_rol
├── core_permiso
├── core_auditlog
├── django_session
├── django_content_type
├── django_migrations
├── django_admin_log
├── cache_table
├── celery_tasksetmeta
└── celery_taskmeta

-- Gestión Estratégica (~25 tablas)
├── gestion_estrategica_empresa
├── gestion_estrategica_sede
├── gestion_estrategica_area
├── gestion_estrategica_cargo
├── gestion_estrategica_proceso
├── gestion_estrategica_objetivo
├── gestion_estrategica_indicador
└── ...

-- Motor de Cumplimiento (~15 tablas)
├── motor_cumplimiento_matrizlegal
├── motor_cumplimiento_requisitolegal
├── motor_cumplimiento_evaluacion
└── ...

-- Motor de Riesgos (~20 tablas)
├── motor_riesgos_riesgo
├── motor_riesgos_control
├── motor_riesgos_evaluacion
├── motor_riesgos_ipevr
└── ...

-- HSEQ (~50 tablas)
├── hseq_documento
├── hseq_accidente
├── hseq_inspeccion
├── hseq_capacitacion
└── ...

-- Supply Chain (~30 tablas)
├── supply_chain_proveedor
├── supply_chain_producto
├── supply_chain_orden_compra
└── ...

-- Production Ops (~25 tablas)
├── production_ops_recepcion
├── production_ops_lote
├── production_ops_proceso
└── ...

-- Y demás módulos...

TOTAL: ~300 tablas por base de datos
```

### 2.3 Datos Específicos por Empresa

Cada empresa tiene sus propios datos en `gestion_estrategica_empresa`:

```sql
-- Empresa 1: StrateKaz
INSERT INTO gestion_estrategica_empresa (
    nit, razon_social, nombre_comercial, logo, ...
) VALUES (
    '900123456-1',
    'GRASAS Y HUESOS DEL NORTE S.A.S.',
    'StrateKaz',
    'logos/grasas_logo.png',
    ...
);

-- Empresa 2: Cliente Ejemplo
INSERT INTO gestion_estrategica_empresa (
    nit, razon_social, nombre_comercial, logo, ...
) VALUES (
    '800654321-9',
    'EMPRESA EJEMPLO S.A.',
    'Ejemplo Corp',
    'logos/ejemplo_logo.png',
    ...
);
```

---

## 3. Estructura de Código

### 3.1 Directorios por Empresa

```
~/                                          # Home cPanel
│
├── grasas.stratekaz.com/                  # === EMPRESA 1 ===
│   │
│   ├── backend/                           # Django Application
│   │   ├── config/
│   │   │   ├── settings.py               # Configuración Django
│   │   │   ├── urls.py
│   │   │   └── wsgi.py
│   │   │
│   │   ├── apps/                          # Todos los módulos
│   │   │   ├── core/
│   │   │   ├── gestion_estrategica/
│   │   │   ├── motor_cumplimiento/
│   │   │   ├── motor_riesgos/
│   │   │   ├── hseq_management/
│   │   │   ├── supply_chain/
│   │   │   ├── production_ops/
│   │   │   ├── logistics_fleet/
│   │   │   ├── sales_crm/
│   │   │   ├── talent_hub/
│   │   │   ├── admin_finance/
│   │   │   ├── accounting/
│   │   │   ├── analytics/
│   │   │   └── audit_system/
│   │   │
│   │   ├── .env                          # *** ÚNICO POR EMPRESA ***
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── staticfiles/                  # Archivos estáticos
│   │
│   ├── public_html/                      # Frontend React
│   │   ├── index.html
│   │   ├── .htaccess
│   │   └── assets/
│   │       ├── index-[hash].js
│   │       └── index-[hash].css
│   │
│   ├── passenger_wsgi.py                 # Entry point WSGI
│   ├── tmp/
│   │   └── restart.txt
│   └── logs/
│       └── django.log
│
├── cliente2.stratekaz.com/               # === EMPRESA 2 ===
│   └── (estructura idéntica)
│
├── demo.stratekaz.com/                   # === DEMO ===
│   └── (estructura idéntica)
│
└── shared/                               # === RECURSOS COMPARTIDOS ===
    ├── scripts/
    │   ├── deploy_empresa.sh            # Script de deployment
    │   ├── sync_code.sh                 # Sincronizar código base
    │   ├── backup_all.sh                # Backup todas las DBs
    │   └── check_resources.sh           # Monitoreo
    │
    ├── templates/
    │   ├── .env.template                # Template de variables
    │   └── empresa_template/            # Carpeta base para copiar
    │
    └── backups/
        └── manual/                      # Backups manuales
```

### 3.2 Archivo .env (Único por Empresa)

```bash
# ~/grasas.stratekaz.com/backend/.env

# ============================================
# CONFIGURACIÓN EMPRESA: GRASAS Y HUESOS
# ============================================

# --- Identificación ---
EMPRESA_ID=grasas
EMPRESA_CODIGO=GHN
EMPRESA_NOMBRE="StrateKaz."

# --- Django Core ---
SECRET_KEY=django-prod-grasas-a8f3k9m2p5x7y1z4-unique-key-here
DEBUG=False
ENVIRONMENT=production
DJANGO_LOG_LEVEL=WARNING

# --- Hosts ---
ALLOWED_HOSTS=grasas.stratekaz.com,www.grasas.stratekaz.com
CORS_ALLOWED_ORIGINS=https://grasas.stratekaz.com
CSRF_TRUSTED_ORIGINS=https://grasas.stratekaz.com

# --- Base de Datos ---
DB_ENGINE=django.db.backends.mysql
DB_NAME=strat_grasas_sgi
DB_USER=strat_grasas_usr
DB_PASSWORD=GrasasDB2024!SecurePass#
DB_HOST=localhost
DB_PORT=3306

# --- Cache (sin Redis) ---
CACHE_BACKEND=django.core.cache.backends.db.DatabaseCache
CACHE_LOCATION=cache_table

# --- Tareas (sin Celery workers) ---
CELERY_TASK_ALWAYS_EAGER=True
USE_CRON_JOBS=True

# --- Email ---
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=mail.stratekaz.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@grasas.stratekaz.com
EMAIL_HOST_PASSWORD=EmailPass2024!
DEFAULT_FROM_EMAIL=StrateKaz SGI <noreply@grasas.stratekaz.com>

# --- JWT ---
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# --- Archivos ---
MEDIA_URL=/media/
STATIC_URL=/static/

# --- Negocio (específico StrateKaz) ---
PRECIO_COMPRA_ECONORTE=3500
PRECIO_REFERENCIA_COMISION=3000
COMISION_FIJA_POR_KILO=100

# --- Monitoreo (opcional) ---
SENTRY_DSN=
SENTRY_ENVIRONMENT=production-grasas
```

### 3.3 Diferencias en Código por Empresa

El código es **99% idéntico** entre empresas. Las únicas diferencias están en:

| Archivo | Diferencia | Ejemplo |
|---------|------------|---------|
| `.env` | Variables de entorno | DB_NAME, SECRET_KEY |
| `public_html/assets/` | Logo y tema de la empresa | Logo en header |
| `backend/media/` | Archivos subidos | Documentos, fotos |
| `staticfiles/` | Colores corporativos (si se personalizan) | CSS custom |

---

## 4. Flujo de Datos

### 4.1 Request Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     FLUJO DE REQUEST                              │
└──────────────────────────────────────────────────────────────────┘

Usuario Empresa 1                    Usuario Empresa 2
      │                                    │
      │ https://grasas.stratekaz.com      │ https://cliente2.stratekaz.com
      │                                    │
      ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LITESPEED (cPanel)                            │
│                   Routing por subdominio                         │
└─────────────────────────────────────────────────────────────────┘
      │                                    │
      ▼                                    ▼
┌─────────────────┐               ┌─────────────────┐
│ passenger_wsgi  │               │ passenger_wsgi  │
│ (grasas)        │               │ (cliente2)      │
└─────────────────┘               └─────────────────┘
      │                                    │
      │ Lee .env                           │ Lee .env
      │ DB_NAME=strat_grasas_sgi          │ DB_NAME=strat_cliente2_sgi
      │                                    │
      ▼                                    ▼
┌─────────────────┐               ┌─────────────────┐
│ Django App      │               │ Django App      │
│ (instancia 1)   │               │ (instancia 2)   │
└─────────────────┘               └─────────────────┘
      │                                    │
      ▼                                    ▼
┌─────────────────┐               ┌─────────────────┐
│ MySQL           │               │ MySQL           │
│ strat_grasas_sgi│               │ strat_cliente2  │
└─────────────────┘               └─────────────────┘
      │                                    │
      │ AISLAMIENTO TOTAL                  │
      └────────── NO SE CRUZAN ────────────┘
```

### 4.2 Autenticación (Por Empresa)

```
Empresa 1: grasas.stratekaz.com
├── Usuario: admin@grasas.com
├── Token JWT: eyJ...empresa1...
├── DB Query: SELECT * FROM core_usuario WHERE id=1
└── Resultado: Solo datos de strat_grasas_sgi

Empresa 2: cliente2.stratekaz.com
├── Usuario: admin@cliente2.com
├── Token JWT: eyJ...empresa2...
├── DB Query: SELECT * FROM core_usuario WHERE id=1
└── Resultado: Solo datos de strat_cliente2_sgi

IMPORTANTE: El mismo email puede existir en ambas DBs
           porque son bases de datos completamente separadas.
```

---

## 5. Sincronización de Código

### 5.1 Repositorio Base (Golden Master)

```
GitHub: Kmylosky83/Grasas-Huesos-SGI
Branch: main (código base)

Workflow:
1. Desarrollo en local con Docker
2. Push a main después de testing
3. Script sincroniza a todas las empresas en cPanel
```

### 5.2 Script de Sincronización

```bash
#!/bin/bash
# ~/shared/scripts/sync_code.sh

# Empresas activas
EMPRESAS=("grasas" "cliente2" "demo" "staging")
BASE_DIR="/home/strat"
REPO_URL="https://github.com/Kmylosky83/Grasas-Huesos-SGI.git"

echo "=== Sincronización de Código Base ==="
echo "Fecha: $(date)"

for EMPRESA in "${EMPRESAS[@]}"; do
    EMPRESA_DIR="$BASE_DIR/$EMPRESA.stratekaz.com"

    echo ""
    echo "--- Sincronizando: $EMPRESA ---"

    if [ -d "$EMPRESA_DIR" ]; then
        cd "$EMPRESA_DIR"

        # Backup del .env antes de pull
        cp backend/.env backend/.env.backup

        # Pull del código
        git fetch origin main
        git reset --hard origin/main

        # Restaurar .env
        mv backend/.env.backup backend/.env

        # Instalar dependencias si cambiaron
        source "$BASE_DIR/virtualenv/$EMPRESA.stratekaz.com/3.9/bin/activate"
        pip install -r backend/requirements.txt -q

        # Migraciones
        cd backend
        python manage.py migrate --noinput

        # Collectstatic
        python manage.py collectstatic --noinput

        # Reiniciar
        touch ../tmp/restart.txt

        echo "✓ $EMPRESA sincronizado"
    else
        echo "✗ Directorio no existe: $EMPRESA_DIR"
    fi
done

echo ""
echo "=== Sincronización Completa ==="
```

### 5.3 Sincronización del Frontend

```bash
#!/bin/bash
# ~/shared/scripts/sync_frontend.sh

# Compilar frontend localmente y subir
# Este script se ejecuta en la máquina de desarrollo

EMPRESAS=("grasas" "cliente2" "demo")
LOCAL_BUILD="./frontend/dist"
REMOTE_USER="strat"
REMOTE_HOST="stratekaz.com"

# Build del frontend
cd frontend
npm run build

# Subir a cada empresa
for EMPRESA in "${EMPRESAS[@]}"; do
    echo "Subiendo frontend a $EMPRESA..."
    rsync -avz --delete \
        "$LOCAL_BUILD/" \
        "$REMOTE_USER@$REMOTE_HOST:~/$EMPRESA.stratekaz.com/public_html/"
done
```

---

## 6. Backups y Recuperación

### 6.1 Estrategia de Backups

```
┌─────────────────────────────────────────────────────────────────┐
│                   ESTRATEGIA DE BACKUPS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NIVEL 1: Jetbackups (Automático cPanel)                        │
│  ├── Frecuencia: Diario                                         │
│  ├── Retención: 7 días                                          │
│  ├── Incluye: DBs + Archivos                                    │
│  └── Restauración: Via cPanel UI                                │
│                                                                  │
│  NIVEL 2: Scripts Propios (Manual/Cron)                         │
│  ├── Frecuencia: Diario 3am                                     │
│  ├── Retención: 30 días                                         │
│  ├── Ubicación: ~/shared/backups/                               │
│  └── Incluye: Solo DBs (mysqldump)                              │
│                                                                  │
│  NIVEL 3: Offsite (Opcional)                                    │
│  ├── Frecuencia: Semanal                                        │
│  ├── Destino: Google Drive / S3                                 │
│  └── Retención: 90 días                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Script de Backup

```bash
#!/bin/bash
# ~/shared/scripts/backup_databases.sh

BACKUP_DIR="/home/strat/shared/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Bases de datos a respaldar
DATABASES=(
    "strat_grasas_sgi"
    "strat_cliente2_sgi"
    "strat_demo_sgi"
    "strat_staging_sgi"
)

# Credenciales (mejor usar ~/.my.cnf)
MYSQL_USER="strat_backup"

echo "=== Backup de Bases de Datos ==="
echo "Fecha: $DATE"

mkdir -p "$BACKUP_DIR/$DATE"

for DB in "${DATABASES[@]}"; do
    echo "Respaldando: $DB"
    mysqldump -u "$MYSQL_USER" "$DB" | gzip > "$BACKUP_DIR/$DATE/$DB.sql.gz"

    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$BACKUP_DIR/$DATE/$DB.sql.gz" | cut -f1)
        echo "✓ $DB respaldado ($SIZE)"
    else
        echo "✗ Error respaldando $DB"
    fi
done

# Limpiar backups antiguos
echo ""
echo "Limpiando backups > $RETENTION_DAYS días..."
find "$BACKUP_DIR" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null

echo ""
echo "=== Backup Completo ==="
ls -lh "$BACKUP_DIR/$DATE/"
```

### 6.3 Restauración

```bash
#!/bin/bash
# ~/shared/scripts/restore_database.sh

# Uso: ./restore_database.sh strat_grasas_sgi 20251230_030000

DB_NAME=$1
BACKUP_DATE=$2
BACKUP_FILE="/home/strat/shared/backups/$BACKUP_DATE/$DB_NAME.sql.gz"

if [ -z "$DB_NAME" ] || [ -z "$BACKUP_DATE" ]; then
    echo "Uso: $0 <nombre_db> <fecha_backup>"
    echo "Ejemplo: $0 strat_grasas_sgi 20251230_030000"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup no encontrado: $BACKUP_FILE"
    exit 1
fi

echo "=== Restaurando Base de Datos ==="
echo "DB: $DB_NAME"
echo "Backup: $BACKUP_DATE"
echo ""
read -p "¿Está seguro? Esto SOBRESCRIBIRÁ todos los datos actuales. (s/N): " CONFIRM

if [ "$CONFIRM" != "s" ]; then
    echo "Cancelado."
    exit 0
fi

echo "Restaurando..."
gunzip -c "$BACKUP_FILE" | mysql -u strat_backup "$DB_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Restauración completada"
else
    echo "✗ Error en restauración"
    exit 1
fi
```

---

## 7. Monitoreo y Alertas

### 7.1 Health Checks

```bash
#!/bin/bash
# ~/shared/scripts/health_check.sh

EMPRESAS=("grasas" "cliente2" "demo")
ALERT_EMAIL="devops@stratekaz.com"

echo "=== Health Check ==="
echo "Fecha: $(date)"

ERRORS=""

for EMPRESA in "${EMPRESAS[@]}"; do
    URL="https://$EMPRESA.stratekaz.com/api/health/"

    # Check HTTP status
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 10)

    if [ "$STATUS" == "200" ]; then
        echo "✓ $EMPRESA: OK"
    else
        echo "✗ $EMPRESA: ERROR ($STATUS)"
        ERRORS="$ERRORS\n$EMPRESA: HTTP $STATUS"
    fi
done

# Enviar alerta si hay errores
if [ -n "$ERRORS" ]; then
    echo -e "ALERTA: Problemas detectados\n$ERRORS" | mail -s "SGI Health Check FAILED" "$ALERT_EMAIL"
fi
```

### 7.2 Cron Jobs de Monitoreo

```bash
# cPanel > Cron Jobs

# Health check cada 15 minutos
*/15 * * * * ~/shared/scripts/health_check.sh >> ~/logs/health_check.log 2>&1

# Backup diario a las 3am
0 3 * * * ~/shared/scripts/backup_databases.sh >> ~/logs/backup.log 2>&1

# Limpieza de logs semanal
0 4 * * 0 ~/shared/scripts/cleanup_logs.sh >> ~/logs/maintenance.log 2>&1

# Reporte de recursos diario
0 8 * * * ~/shared/scripts/check_resources.sh | mail -s "SGI Daily Report" devops@stratekaz.com
```

---

## 8. Migración Futura a Multitenant

### 8.1 Preparación del Código

Para facilitar una migración futura a multitenant, el código actual ya tiene:

```python
# Modelo base con soporte para tenant_id (preparado pero no usado)

class TenantAwareModel(models.Model):
    """Base model preparado para multi-tenancy futuro"""

    # Este campo existe pero apunta a la única empresa
    empresa = models.ForeignKey(
        'gestion_estrategica.Empresa',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    class Meta:
        abstract = True

# Manager que filtra por empresa (para uso futuro)
class TenantManager(models.Manager):
    def get_queryset(self):
        # En unitenant, no filtra
        # En multitenant, filtraría por tenant actual
        return super().get_queryset()
```

### 8.2 Pasos para Migrar

Cuando sea necesario migrar a multitenant (> 10 empresas):

1. **Fase 1: Consolidación de DBs**
   - Exportar todas las DBs a una sola
   - Agregar `tenant_id` a todas las tablas
   - Migrar datos con identificador de empresa

2. **Fase 2: Middleware de Tenant**
   - Implementar `TenantMiddleware`
   - Detectar tenant por subdominio
   - Inyectar `tenant_id` en todas las queries

3. **Fase 3: Una Sola Instancia**
   - Eliminar instancias duplicadas
   - Un solo `passenger_wsgi.py`
   - Routing dinámico por subdominio

---

## 9. Consideraciones de Seguridad

### 9.1 Aislamiento de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                    NIVELES DE AISLAMIENTO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ Nivel 1: Base de datos separada                              │
│    └── Cada empresa tiene su propia DB MySQL                    │
│    └── Imposible hacer JOIN entre empresas                      │
│                                                                  │
│  ✓ Nivel 2: Usuario MySQL separado                              │
│    └── strat_grasas_usr solo accede a strat_grasas_sgi         │
│    └── Permisos GRANT específicos por DB                        │
│                                                                  │
│  ✓ Nivel 3: Virtualenv separado                                 │
│    └── Cada empresa tiene su propio entorno Python              │
│    └── Dependencias aisladas                                    │
│                                                                  │
│  ✓ Nivel 4: Proceso separado                                    │
│    └── Passenger crea proceso independiente por app             │
│    └── Crash de una no afecta otras                             │
│                                                                  │
│  ✓ Nivel 5: Archivos separados                                  │
│    └── Media files en directorios distintos                     │
│    └── Logs independientes                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Permisos MySQL

```sql
-- Crear usuario específico por empresa
CREATE USER 'strat_grasas_usr'@'localhost' IDENTIFIED BY 'password';

-- Otorgar permisos SOLO a su base de datos
GRANT ALL PRIVILEGES ON strat_grasas_sgi.* TO 'strat_grasas_usr'@'localhost';

-- Denegar acceso a otras DBs (implícito, pero verificar)
REVOKE ALL PRIVILEGES ON strat_cliente2_sgi.* FROM 'strat_grasas_usr'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;
```

---

## 10. Troubleshooting

### 10.1 Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| "Access denied for user" | Usuario incorrecto en .env | Verificar DB_USER y DB_PASSWORD |
| Datos de otra empresa | .env copiado sin cambiar | Revisar DB_NAME en .env |
| 500 Internal Server Error | Error en código o config | Ver logs en ~/logs/ |
| Static files no cargan | collectstatic no ejecutado | `python manage.py collectstatic` |
| Cambios no aparecen | Cache del navegador | Ctrl+F5 o limpiar cache |

### 10.2 Verificar Aislamiento

```bash
# Verificar qué DB está usando cada empresa

# Desde la app de StrateKaz
cd ~/grasas.stratekaz.com/backend
source ../../virtualenv/grasas.stratekaz.com/3.9/bin/activate
python manage.py shell

>>> from django.conf import settings
>>> print(settings.DATABASES['default']['NAME'])
strat_grasas_sgi  # ← Debe mostrar la DB correcta

# Desde la app de Cliente2
cd ~/cliente2.stratekaz.com/backend
source ../../virtualenv/cliente2.stratekaz.com/3.9/bin/activate
python manage.py shell

>>> from django.conf import settings
>>> print(settings.DATABASES['default']['NAME'])
strat_cliente2_sgi  # ← Debe mostrar DB diferente
```

---

## Referencias

- [ESTRATEGIA-CPANEL-CORPORATIVO.md](./ESTRATEGIA-CPANEL-CORPORATIVO.md)
- [DEPLOY-CPANEL.md](../../deploy/cpanel/DEPLOY-CPANEL.md)
- [Django Multi-DB Documentation](https://docs.djangoproject.com/en/5.0/topics/db/multi-db/)
