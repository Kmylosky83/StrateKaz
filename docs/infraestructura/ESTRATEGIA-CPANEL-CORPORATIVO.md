# Estrategia de Infraestructura: cPanel Corporativo
## SGI - Sistema de Gestión Integral

**Versión:** 1.0
**Fecha:** 2025-12-30
**Estado:** Aprobado para Implementación

---

## Resumen Ejecutivo

Este documento define la estrategia de infraestructura para desplegar el SGI (Sistema de Gestión Integral) en un **cPanel corporativo** con capacidad para **hasta 10 empresas** bajo el modelo **unitenant con bases de datos separadas**.

### Decisión Estratégica

| Aspecto | Decisión |
|---------|----------|
| **Hosting** | cPanel Corporativo (stratekaz.com) |
| **Modelo** | Unitenant - 1 instancia código por empresa |
| **Base de Datos** | Separadas - 1 MySQL por empresa |
| **Costo Anual** | USD $90 (plan corporativo) |
| **Capacidad** | Hasta 10 empresas |

---

## 1. Infraestructura Disponible

### 1.1 Especificaciones del Servidor cPanel

| Recurso | Especificación | Uso Estimado por Empresa |
|---------|----------------|--------------------------|
| **RAM** | 6 GB | ~400-600 MB |
| **CPU** | 2 Cores | Compartido |
| **Disco SSD** | Ilimitado | ~500 MB - 1 GB |
| **Bases de Datos** | Ilimitadas | 1 por empresa |
| **Subdominios** | Ilimitados | 1 por empresa |
| **Cuentas Email** | Ilimitadas | 2-5 por empresa |
| **Ancho de Banda** | Ilimitado | N/A |
| **SSL** | Gratuito (Let's Encrypt) | 1 por subdominio |

### 1.2 Servicios Incluidos

- Python Selector (3.9+)
- MySQL 8.0
- phpMyAdmin
- SSH Access
- Git (vía SSH)
- Cron Jobs
- Jetbackups (automáticos)
- LiteSpeed Web Server
- Protección DDoS

### 1.3 Servicios NO Disponibles (Requieren Alternativas)

| Servicio | Alternativa en cPanel |
|----------|----------------------|
| Redis | Django DB Cache / File Cache |
| Celery Workers | Cron Jobs + django-crontab |
| Docker | Passenger WSGI directo |
| Procesos Daemon | Supervisión manual |

---

## 2. Arquitectura Unitenant

### 2.1 Modelo de Despliegue

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CPANEL CORPORATIVO (6GB RAM)                      │
│                       stratekaz.com                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  EMPRESA 1   │  │  EMPRESA 2   │  │  EMPRESA 3   │   ...        │
│  │              │  │              │  │              │              │
│  │ Subdominio:  │  │ Subdominio:  │  │ Subdominio:  │              │
│  │ grasas.      │  │ cliente2.    │  │ cliente3.    │              │
│  │ stratekaz.com│  │ stratekaz.com│  │ stratekaz.com│              │
│  │              │  │              │  │              │              │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │              │
│  │ │ Django   │ │  │ │ Django   │ │  │ │ Django   │ │              │
│  │ │ Backend  │ │  │ │ Backend  │ │  │ │ Backend  │ │              │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │              │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │              │
│  │ │  React   │ │  │ │  React   │ │  │ │  React   │ │              │
│  │ │ Frontend │ │  │ │ Frontend │ │  │ │ Frontend │ │              │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │              │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │              │
│  │ │  MySQL   │ │  │ │  MySQL   │ │  │ │  MySQL   │ │              │
│  │ │ empresa1 │ │  │ │ empresa2 │ │  │ │ empresa3 │ │              │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    RECURSOS COMPARTIDOS                       │   │
│  │  • Certificados SSL (AutoSSL)                                │   │
│  │  • Servidor de correo (mail.stratekaz.com)                   │   │
│  │  • Jetbackups diarios                                        │   │
│  │  • Cron Jobs centralizados                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Ventajas del Modelo Unitenant

| Ventaja | Descripción |
|---------|-------------|
| **Aislamiento Total** | Cada empresa tiene su propia DB, sin riesgo de filtración de datos |
| **Personalización** | Configuración específica por cliente (logo, colores, módulos) |
| **Independencia** | Actualizaciones pueden hacerse empresa por empresa |
| **Backups Independientes** | Restauración sin afectar otras empresas |
| **Performance Predecible** | Sin "vecinos ruidosos" en la misma DB |
| **Cumplimiento** | Más fácil cumplir requisitos de auditoría |

### 2.3 Desventajas y Mitigaciones

| Desventaja | Mitigación |
|------------|------------|
| Código duplicado | Scripts de sincronización de código base |
| Más mantenimiento | Automatización con scripts de deployment |
| Actualizaciones manuales | Pipeline de CI/CD por empresa |
| Mayor uso de disco | Disco ilimitado en el plan |

---

## 3. Nomenclatura y Convenciones

### 3.1 Subdominios

```
Formato: {empresa}.stratekaz.com

Ejemplos:
├── grasas.stratekaz.com        (StrateKaz)
├── cliente2.stratekaz.com      (Empresa Cliente 2)
├── demo.stratekaz.com          (Ambiente de demostración)
└── staging.stratekaz.com       (Ambiente de pruebas)
```

### 3.2 Bases de Datos

```
Formato: strat_{empresa}_sgi

Ejemplos:
├── strat_grasas_sgi            (DB principal empresa 1)
├── strat_cliente2_sgi          (DB empresa 2)
├── strat_demo_sgi              (DB demostración)
└── strat_staging_sgi           (DB staging)

Usuarios:
├── strat_grasas_usr            (Usuario DB empresa 1)
├── strat_cliente2_usr          (Usuario DB empresa 2)
└── ...
```

> **Nota:** cPanel agrega el prefijo del usuario (`strat_`) automáticamente.
> Los nombres están limitados a 16 caracteres totales.

### 3.3 Estructura de Directorios

```
~/                                    # Home del usuario cPanel
├── grasas.stratekaz.com/            # Empresa 1
│   ├── backend/                     # Django
│   │   ├── .env                     # Config específica empresa 1
│   │   ├── config/
│   │   ├── apps/
│   │   └── manage.py
│   ├── public_html/                 # Frontend React
│   │   ├── index.html
│   │   ├── assets/
│   │   └── .htaccess
│   ├── passenger_wsgi.py            # Entry point WSGI
│   ├── tmp/                         # restart.txt
│   └── logs/                        # Logs Django
│
├── cliente2.stratekaz.com/          # Empresa 2
│   └── (misma estructura)
│
├── shared/                          # Recursos compartidos
│   ├── scripts/                     # Scripts de mantenimiento
│   ├── templates/                   # Templates base para nuevas empresas
│   └── backups/                     # Backups manuales adicionales
│
└── logs/                            # Logs del servidor web (cPanel)
    ├── grasas.stratekaz.com-error.log
    └── grasas.stratekaz.com-access.log
```

### 3.4 Variables de Entorno por Empresa

```bash
# Archivo: ~/grasas.stratekaz.com/backend/.env

# === IDENTIFICACIÓN ===
EMPRESA_ID=grasas
EMPRESA_NOMBRE="StrateKaz"
ENVIRONMENT=production

# === DJANGO ===
SECRET_KEY=<clave-única-por-empresa>
DEBUG=False
ALLOWED_HOSTS=grasas.stratekaz.com

# === BASE DE DATOS ===
DB_NAME=strat_grasas_sgi
DB_USER=strat_grasas_usr
DB_PASSWORD=<password-único>
DB_HOST=localhost
DB_PORT=3306

# === CORS/CSRF ===
CORS_ALLOWED_ORIGINS=https://grasas.stratekaz.com
CSRF_TRUSTED_ORIGINS=https://grasas.stratekaz.com

# === EMAIL ===
EMAIL_HOST=mail.stratekaz.com
EMAIL_HOST_USER=noreply@grasas.stratekaz.com
DEFAULT_FROM_EMAIL=StrateKaz SGI <noreply@grasas.stratekaz.com>

# === CACHE (alternativa a Redis) ===
CACHE_BACKEND=django.core.cache.backends.db.DatabaseCache
CACHE_TABLE=cache_table

# === TAREAS PROGRAMADAS (alternativa a Celery) ===
USE_CRON_JOBS=True
CELERY_TASK_ALWAYS_EAGER=True
```

---

## 4. Matriz de Empresas

### 4.1 Empresas Planificadas (Fase Inicial)

| # | Empresa | Subdominio | DB | Estado | Módulos |
|---|---------|------------|----|---------| --------|
| 1 | StrateKaz | grasas.stratekaz.com | strat_grasas_sgi | **GO-LIVE** | Todos |
| 2 | (Reservado Cliente 2) | cliente2.stratekaz.com | strat_cliente2_sgi | Pendiente | Por definir |
| 3 | (Reservado Cliente 3) | cliente3.stratekaz.com | strat_cliente3_sgi | Pendiente | Por definir |
| 4 | Demo Comercial | demo.stratekaz.com | strat_demo_sgi | Activo | Todos (datos demo) |
| 5 | Staging/QA | staging.stratekaz.com | strat_staging_sgi | Activo | Todos |
| 6-10 | (Reservados) | clienteN.stratekaz.com | strat_clienteN_sgi | Disponible | - |

### 4.2 Checklist por Empresa Nueva

```markdown
## Checklist: Onboarding Nueva Empresa

### Pre-requisitos
- [ ] Contrato firmado
- [ ] Datos de empresa recopilados (nombre, NIT, logo)
- [ ] Módulos a activar definidos
- [ ] Usuario administrador definido

### Configuración cPanel
- [ ] Subdominio creado
- [ ] SSL activado (AutoSSL)
- [ ] Base de datos MySQL creada
- [ ] Usuario MySQL creado con permisos
- [ ] Python App configurada
- [ ] Cuenta de email creada

### Deployment
- [ ] Código clonado/copiado
- [ ] .env configurado
- [ ] Dependencias instaladas
- [ ] Migraciones ejecutadas
- [ ] Superusuario creado
- [ ] collectstatic ejecutado
- [ ] Frontend desplegado
- [ ] Cron jobs configurados

### Verificación
- [ ] Login funciona
- [ ] CRUD básico funciona
- [ ] Email funciona
- [ ] SSL válido
- [ ] Sin errores en logs
```

---

## 5. Gestión de Recursos

### 5.1 Distribución de RAM (6 GB Total)

```
┌────────────────────────────────────────────────────────────┐
│                    DISTRIBUCIÓN DE RAM                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Sistema Operativo + cPanel:     ~1.0 GB                   │
│  ├─────────────────────────────────────────────────────┤   │
│                                                             │
│  MySQL Server (compartido):      ~1.5 GB                   │
│  ├─────────────────────────────────────────────────────┤   │
│                                                             │
│  LiteSpeed Web Server:           ~0.5 GB                   │
│  ├─────────────────────────────────────────────────────┤   │
│                                                             │
│  Aplicaciones Python (10 max):   ~3.0 GB                   │
│  │  ├── Empresa 1: ~300 MB                                 │
│  │  ├── Empresa 2: ~300 MB                                 │
│  │  ├── ...                                                │
│  │  └── Empresa 10: ~300 MB                                │
│  ├─────────────────────────────────────────────────────┤   │
│                                                             │
│  Reserva/Buffer:                 ~0.0 GB                   │
│                                                             │
└────────────────────────────────────────────────────────────┘

Nota: Con 10 empresas activas, el servidor operará al ~100% de RAM.
      Recomendación: Máximo 8 empresas activas simultáneamente.
```

### 5.2 Monitoreo de Recursos

```bash
# Script de monitoreo: ~/shared/scripts/check_resources.sh

#!/bin/bash

echo "=== Uso de Recursos cPanel ==="
echo ""

# RAM
echo "--- Memoria RAM ---"
free -h

# Disco
echo ""
echo "--- Espacio en Disco ---"
df -h ~

# Procesos Python
echo ""
echo "--- Procesos Python Activos ---"
ps aux | grep python | grep -v grep | wc -l
echo "procesos Python corriendo"

# Bases de datos
echo ""
echo "--- Tamaño de Bases de Datos ---"
mysql -u root -p -e "
SELECT
    table_schema AS 'Base de Datos',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Tamaño (MB)'
FROM information_schema.tables
WHERE table_schema LIKE 'strat_%'
GROUP BY table_schema;
"
```

---

## 6. Alternativas a Servicios No Disponibles

### 6.1 Cache (Reemplazo de Redis)

```python
# settings.py - Configuración de cache para cPanel

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache_table',
        'TIMEOUT': 300,  # 5 minutos
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    }
}

# Crear tabla de cache después de migraciones:
# python manage.py createcachetable
```

### 6.2 Tareas Programadas (Reemplazo de Celery)

```python
# Opción 1: django-crontab
# requirements.txt: django-crontab==0.7.1

# settings.py
INSTALLED_APPS = [
    ...
    'django_crontab',
]

CRONJOBS = [
    # Limpiar sesiones expiradas - diario a las 2am
    ('0 2 * * *', 'django.core.management.call_command', ['clearsessions']),

    # Backup de base de datos - diario a las 3am
    ('0 3 * * *', 'apps.core.tasks.backup_database'),

    # Enviar reportes pendientes - cada hora
    ('0 * * * *', 'apps.analytics.tasks.send_pending_reports'),

    # Limpiar archivos temporales - semanal
    ('0 4 * * 0', 'apps.core.tasks.cleanup_temp_files'),
]

# Activar cron jobs:
# python manage.py crontab add
```

```bash
# Opción 2: Cron Jobs de cPanel directamente
# cPanel > Cron Jobs

# Cada hora - procesar tareas pendientes
0 * * * * cd ~/grasas.stratekaz.com/backend && /home/strat/virtualenv/grasas.stratekaz.com/3.9/bin/python manage.py process_tasks

# Diario 2am - limpiar sesiones
0 2 * * * cd ~/grasas.stratekaz.com/backend && /home/strat/virtualenv/grasas.stratekaz.com/3.9/bin/python manage.py clearsessions

# Diario 3am - backup
0 3 * * * ~/shared/scripts/backup_all_databases.sh
```

### 6.3 Tareas Síncronas (CELERY_TASK_ALWAYS_EAGER)

```python
# settings.py - Ejecutar tareas "async" de forma síncrona

# Esto hace que las tareas Celery se ejecuten inmediatamente
# en el mismo proceso, sin necesidad de workers
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Nota: Esto significa que operaciones largas bloquearán el request
# Solución: Dividir operaciones pesadas en chunks más pequeños
```

---

## 7. Plan de Migración a Multitenant (Futuro)

### 7.1 Roadmap de Evolución

```
FASE ACTUAL (2025)
└── Unitenant: 10 empresas separadas
    ├── 10 instancias de código
    ├── 10 bases de datos
    └── Gestión manual

FASE 2 (2026 - Opcional)
└── Multitenant Ligero
    ├── 1 instancia de código
    ├── 10 bases de datos (DB routing)
    └── Gestión semi-automática

FASE 3 (2027+ - Si escala > 50 empresas)
└── SaaS Completo
    ├── 1 instancia de código
    ├── Schema-per-tenant o Row-level
    ├── Self-service onboarding
    └── VPS/Cloud dedicado
```

### 7.2 Criterios para Migrar

| Trigger | Acción |
|---------|--------|
| > 10 empresas | Evaluar VPS + Docker |
| > 20 empresas | Migrar a multitenant |
| > 50 empresas | Arquitectura SaaS completa |
| Problemas de RAM | Optimizar o escalar hosting |

---

## 8. Costos y ROI

### 8.1 Costo Actual

| Concepto | Costo Anual |
|----------|-------------|
| cPanel Corporativo | USD $90 |
| Dominio (si aplica) | ~USD $15 |
| **Total** | **USD $105/año** |

### 8.2 Costo por Empresa

```
Con 10 empresas activas:
USD $105 / 10 = USD $10.50/año por empresa

Comparación con alternativas:
├── VPS básico: USD $144/año ($12/mes)
├── Heroku: USD $300+/año
├── AWS: USD $200+/año
└── cPanel corporativo: USD $10.50/año por empresa ✓
```

### 8.3 Breakeven y Escalabilidad

```
Capacidad actual: 10 empresas = USD $10.50/empresa/año
Si se requieren más empresas:
├── Opción A: Segundo cPanel corporativo (+USD $90/año)
├── Opción B: Migrar a VPS con Docker (~USD $240/año para 20 empresas)
└── Opción C: Migrar a multitenant (inversión única ~USD $3,000)
```

---

## 9. Soporte y Mantenimiento

### 9.1 Responsabilidades

| Tarea | Responsable | Frecuencia |
|-------|-------------|------------|
| Backups automáticos | Jetbackups (cPanel) | Diario |
| Actualizaciones de seguridad | DevOps | Semanal |
| Monitoreo de recursos | Script automático | Cada hora |
| Actualizaciones de código | DevOps | Por release |
| Soporte a usuarios | Soporte Nivel 1 | Continuo |
| Incidentes críticos | DevOps + Backend | On-call |

### 9.2 SLA por Empresa

| Nivel | Tiempo Respuesta | Tiempo Resolución |
|-------|------------------|-------------------|
| Crítico (sistema caído) | 1 hora | 4 horas |
| Alto (funcionalidad bloqueada) | 4 horas | 24 horas |
| Medio (bug no bloqueante) | 24 horas | 72 horas |
| Bajo (mejora/consulta) | 48 horas | 1 semana |

---

## 10. Aprobación y Firmas

### Documento Aprobado Por:

| Rol | Nombre | Fecha | Firma |
|-----|--------|-------|-------|
| Director de Proyecto | | 2025-12-30 | |
| Arquitecto de Software | | 2025-12-30 | |
| DevOps Lead | | 2025-12-30 | |

### Historial de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2025-12-30 | DevOps Team | Documento inicial |

---

## Referencias

- [DEPLOY-CPANEL.md](../deploy/cpanel/DEPLOY-CPANEL.md) - Guía de despliegue
- [ARQUITECTURA-UNITENANT.md](./ARQUITECTURA-UNITENANT.md) - Detalles técnicos
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Guía Docker (referencia)
- [ANALISIS-SAAS-ARQUITECTURA.md](./arquitectura/ANALISIS-SAAS-ARQUITECTURA.md) - Plan futuro SaaS
