# StrateKaz - Backend

Sistema Integrado de Gestión para Recolección de ACU (Aceite de Cocina Usado)

## Stack Tecnológico

- **Django 5.0.9** - Framework web
- **Django REST Framework 3.14.0** - API REST
- **MySQL 8.0+** - Base de datos
- **JWT** - Autenticación
- **Python 3.11+**

## Estructura del Proyecto

```
backend/
├── apps/                      # Aplicaciones modulares
│   ├── core/                 # Autenticación, usuarios, cargos
│   ├── unidades/             # Unidades de negocio
│   ├── proveedores/          # Gestión de proveedores
│   ├── recolecciones/        # Recolecciones de ACU
│   ├── lotes/                # Lotes de planta
│   ├── liquidaciones/        # Liquidaciones y comisiones
│   ├── certificados/         # Certificados de recolección
│   └── reportes/             # Reportes y analytics
│
├── config/                   # Configuración Django
│   ├── settings.py          # Settings principal
│   ├── urls.py              # URLs raíz
│   ├── wsgi.py              # WSGI
│   └── asgi.py              # ASGI
│
├── media/                    # Archivos subidos
├── static/                   # Archivos estáticos
├── templates/                # Templates HTML/PDF
├── utils/                    # Utilidades globales
├── logs/                     # Archivos de log
├── manage.py                 # CLI de Django
└── requirements.txt          # Dependencias Python
```

## Instalación y Configuración

### 1. Crear entorno virtual

```bash
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
- `SECRET_KEY`: Clave secreta de Django
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Credenciales MySQL
- Otras configuraciones según necesidad

### 4. Crear base de datos MySQL

```bash
psql -U postgres
```

```sql
CREATE DATABASE stratekaz OWNER stratekaz_user;
\q
```

### 5. Ejecutar migraciones

```bash
# Esperar a que MySQL esté disponible (opcional, útil en Docker)
python manage.py wait_for_db

# Crear y aplicar migraciones
python manage.py makemigrations
python manage.py migrate
```

### 6. Crear datos iniciales (FASE 1)

```bash
# Crear cargos del sistema
python manage.py seed_cargos

# Crear superusuario
python manage.py createsuperuser
```

### 7. Ejecutar servidor de desarrollo

```bash
python manage.py runserver
```

El servidor estará disponible en: http://localhost:8000

## API Endpoints

### Autenticación (Multi-Tenant)
- `POST /api/tenant/auth/login/` - Login (obtener tokens JWT)
- `POST /api/tenant/auth/refresh/` - Refresh token
- `POST /api/tenant/auth/logout/` - Logout (blacklist token)

### Core
- `/api/core/users/` - Gestión de usuarios
- `/api/core/cargos/` - Listado de cargos

### Módulos (por implementar en fases)
- `/api/proveedores/` - Gestión de proveedores
- `/api/recolecciones/` - Gestión de recolecciones
- `/api/lotes/` - Gestión de lotes de planta
- `/api/liquidaciones/` - Gestión de liquidaciones
- `/api/certificados/` - Generación de certificados
- `/api/reportes/` - Reportes y analytics

## Admin Panel

Django Admin disponible en: http://localhost:8000/admin/

## Testing

```bash
# Ejecutar tests
pytest

# Con coverage
pytest --cov=apps
```

## Management Commands

### wait_for_db
Espera a que la base de datos MySQL esté disponible (útil para Docker):

```bash
python manage.py wait_for_db
```

### seed_cargos (FASE 1)
Crea los cargos iniciales del sistema:

```bash
python manage.py seed_cargos
```

## Próximos Pasos

Según el roadmap de desarrollo (03_ROADMAP_DESARROLLO.md):

1. **FASE 1**: Implementar módulo Core (Auth y Cargos) ✅ ESTRUCTURA BASE LISTA
2. **FASE 2**: Implementar módulo Proveedores
3. **FASE 3**: Implementar módulo Recolecciones
4. **FASE 4**: Implementar módulo Lotes de Planta
5. **FASE 5**: Implementar módulo Liquidaciones
6. **FASE 6**: Implementar Certificados y Reportes
7. **FASE 7**: Deploy y Producción

## Documentación Adicional

- `01_ARQUITECTURA_ROLES.md` - Arquitectura y roles del sistema
- `02_STACK_Y_ESTRUCTURA.md` - Stack tecnológico completo
- `03_ROADMAP_DESARROLLO.md` - Roadmap paso a paso
- `04_DESIGN_SYSTEM_Y_LAYOUT.md` - Sistema de diseño

## Configuración de Producción

Para producción, asegúrate de:

1. Cambiar `SECRET_KEY` por una clave segura
2. Configurar `DEBUG=False`
3. Configurar `ALLOWED_HOSTS` correctamente
4. Usar un servidor WSGI (gunicorn)
5. Configurar archivos estáticos con Whitenoise
6. Configurar HTTPS y certificados SSL
7. Configurar backups de base de datos

## Soporte

Para más información, consultar la documentación en la raíz del proyecto.
