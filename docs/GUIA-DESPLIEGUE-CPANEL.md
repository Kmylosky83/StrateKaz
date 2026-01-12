# Guía Completa de Despliegue en cPanel

**Sistema de Gestión Integral - StrateKaz**
**Versión:** 2.0
**Fecha:** 2026-01-07
**Ambiente:** cPanel Compartido (Sin SSH)

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Pre-requisitos](#pre-requisitos)
3. [Preparación Local](#preparación-local)
4. [Despliegue Backend Django](#despliegue-backend-django)
5. [Despliegue Frontend React](#despliegue-frontend-react)
6. [Configuración de Base de Datos](#configuración-de-base-de-datos)
7. [Configuración de Dominios y SSL](#configuración-de-dominios-y-ssl)
8. [Tareas Post-Despliegue](#tareas-post-despliegue)
9. [Verificación y Testing](#verificación-y-testing)
10. [Mantenimiento y Actualizaciones](#mantenimiento-y-actualizaciones)
11. [Troubleshooting](#troubleshooting)

---

## Resumen Ejecutivo

Esta guía describe el proceso completo de despliegue del Sistema de Gestión Integral en un servidor cPanel compartido **sin acceso SSH**. Todo el proceso se realiza a través de la interfaz web de cPanel.

### Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                    cPanel Hosting                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐         ┌──────────────────────┐   │
│  │   Frontend React   │         │   Backend Django     │   │
│  │   public_html/     │ ◄────── │   /backend/          │   │
│  │   - index.html     │  HTTP   │   - passenger_wsgi   │   │
│  │   - assets/        │         │   - manage.py        │   │
│  │   - .htaccess      │         │   - apps/            │   │
│  └────────────────────┘         └──────────────────────┘   │
│           │                               │                 │
│           │                               ▼                 │
│           │                     ┌──────────────────┐        │
│           └─────────────────────►  MySQL Database  │        │
│                                 │  - Production DB │        │
│                                 └──────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tiempo Estimado

- **Primera vez:** 2-3 horas
- **Actualizaciones:** 30-45 minutos

---

## Pre-requisitos

### En tu Máquina Local

- [x] Node.js 18+ instalado
- [x] Python 3.9+ instalado
- [x] Git instalado
- [x] Repositorio clonado localmente

### En cPanel

- [x] Acceso a cPanel con credenciales
- [x] Servidor con las siguientes características:
  - Python 3.9+ disponible
  - MySQL/MariaDB disponible
  - Setup Python App (Passenger) instalado
  - File Manager accesible
  - 2GB+ de espacio en disco
  - 512MB+ de RAM asignada a Python App

### Información Necesaria

Antes de comenzar, ten a mano:

```
✓ Dominio o subdominio (ej: grasas.stratekaz.com)
✓ Usuario de cPanel
✓ Contraseña de cPanel
✓ Usuario y contraseña de MySQL (los crearemos si no existen)
✓ Email para notificaciones
```

---

## Preparación Local

### 1. Clonar el Repositorio (si no lo has hecho)

```bash
git clone https://github.com/tu-usuario/grasas-huesos-sgi.git
cd grasas-huesos-sgi
```

### 2. Construir el Frontend

#### En Windows:

```powershell
cd frontend
.\build-cpanel.ps1
```

#### En Linux/Mac:

```bash
cd frontend
chmod +x build-cpanel.sh
./build-cpanel.sh
```

**Resultado esperado:**
- Directorio `dist/` con archivos compilados
- Archivo `frontend-cpanel.zip` (Windows) o `frontend-cpanel.tar.gz` (Linux/Mac)

### 3. Preparar el Backend

#### Configurar Variables de Entorno

```bash
cd ../backend
cp .env.cpanel.example .env
```

**Edita el archivo `.env`** con los valores de producción:

```bash
# CRÍTICO: Cambia estos valores
SECRET_KEY=genera-una-clave-secreta-aqui
DEBUG=False
ALLOWED_HOSTS=tudominio.com,www.tudominio.com

# Base de datos
DB_NAME=usuario_grasashuesos
DB_USER=usuario_dbuser
DB_PASSWORD=tu-password-mysql
DB_HOST=localhost
DB_PORT=3306

# cPanel mode
USE_CPANEL=True

# URLs permitidas
CSRF_TRUSTED_ORIGINS=https://tudominio.com
CORS_ALLOWED_ORIGINS=https://tudominio.com
```

**Generar SECRET_KEY:**

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### Preparar Archivos Estáticos

```bash
# Activar entorno virtual (si lo tienes)
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Recolectar archivos estáticos
python prepare_static.py
```

**Resultado esperado:**
- Directorio `staticfiles/` con archivos de Django

### 4. Crear Paquetes para Subir

Comprime los siguientes directorios:

#### Backend
```bash
# Excluir archivos innecesarios
tar -czf backend-cpanel.tar.gz \
  --exclude='venv' \
  --exclude='*.pyc' \
  --exclude='__pycache__' \
  --exclude='.git' \
  --exclude='logs/*.log' \
  .
```

O manualmente comprimir estos directorios:
- `apps/`
- `config/`
- `staticfiles/`
- `media/`
- `templates/`
- `utils/`
- `passenger_wsgi.py`
- `manage.py`
- `requirements-cpanel.txt`
- `.env`

---

## Despliegue Backend Django

### Paso 1: Crear Base de Datos MySQL

1. **Accede a cPanel**
   - Ve a `MySQL® Databases`

2. **Crear Base de Datos**
   - Nombre: `grasashuesos` (cPanel añadirá prefijo: `usuario_grasashuesos`)
   - Click en `Create Database`

3. **Crear Usuario MySQL**
   - Usuario: `dbuser`
   - Contraseña: Genera una segura y guárdala
   - Click en `Create User`

4. **Asignar Usuario a Base de Datos**
   - Selecciona el usuario creado
   - Selecciona la base de datos
   - Marca `ALL PRIVILEGES`
   - Click en `Make Changes`

5. **Anotar Credenciales**
   ```
   DB_NAME: usuario_grasashuesos
   DB_USER: usuario_dbuser
   DB_PASSWORD: (la que generaste)
   DB_HOST: localhost
   DB_PORT: 3306
   ```

### Paso 2: Subir Archivos del Backend

1. **Accede a File Manager en cPanel**
   - Ve a `File Manager`
   - Navega a tu directorio raíz (usualmente `public_html` o un directorio específico)

2. **Crear Directorio para Backend**
   - Click en `+ Folder`
   - Nombre: `backend`
   - Navega dentro del directorio `backend/`

3. **Subir Archivos**
   - Click en `Upload`
   - Arrastra `backend-cpanel.tar.gz`
   - Espera a que termine la subida

4. **Extraer Archivos**
   - Click derecho en `backend-cpanel.tar.gz`
   - Selecciona `Extract`
   - Confirma la extracción
   - Elimina el archivo `.tar.gz` después de extraer

### Paso 3: Configurar Python App en cPanel

1. **Ve a Setup Python App**
   - En cPanel, busca `Setup Python App`

2. **Crear Nueva Aplicación**
   - Click en `CREATE APPLICATION`

3. **Configurar la Aplicación**

   ```
   Python version: 3.9 o superior
   Application root: /backend
   Application URL: /api (o dejar en blanco para raíz)
   Application startup file: passenger_wsgi.py
   Application Entry point: application
   ```

4. **Configurar Variables de Entorno**

   Click en `Environment variables` y añade:

   ```
   SECRET_KEY=tu-clave-secreta-generada
   DEBUG=False
   ALLOWED_HOSTS=tudominio.com,www.tudominio.com
   DB_NAME=usuario_grasashuesos
   DB_USER=usuario_dbuser
   DB_PASSWORD=tu-password-mysql
   DB_HOST=localhost
   DB_PORT=3306
   USE_CPANEL=True
   CSRF_TRUSTED_ORIGINS=https://tudominio.com
   CORS_ALLOWED_ORIGINS=https://tudominio.com
   DJANGO_SETTINGS_MODULE=config.settings
   ```

5. **Instalar Dependencias**

   - En la sección de la aplicación, verás `Configuration files`
   - Click en `Edit` junto a `requirements.txt`
   - Pega el contenido de `requirements-cpanel.txt`
   - Click en `Save`
   - Click en `Run Pip Install` (esto puede tardar varios minutos)

6. **Activar el Entorno Virtual** (para ejecutar comandos)

   - En `Setup Python App`, busca tu aplicación
   - Copia el comando para activar el entorno virtual
   - Ejemplo: `source /home/usuario/virtualenv/backend/3.9/bin/activate`

### Paso 4: Ejecutar Migraciones

**Opción A: Usando Terminal Web (si está disponible)**

1. Ve a `Terminal` en cPanel
2. Activa el entorno virtual:
   ```bash
   source /home/usuario/virtualenv/backend/3.9/bin/activate
   ```

3. Navega al directorio backend:
   ```bash
   cd ~/backend
   ```

4. Ejecuta migraciones:
   ```bash
   python run_migrations.py --showplan
   python run_migrations.py
   ```

**Opción B: Usando Cron Job (sin terminal)**

1. Ve a `Cron Jobs` en cPanel
2. Crea un nuevo cron job:
   ```
   Command: source /home/usuario/virtualenv/backend/3.9/bin/activate && cd ~/backend && python run_migrations.py > ~/backend/logs/migration_$(date +\%Y\%m\%d).log 2>&1
   ```
3. Configura para ejecutar UNA VEZ (en 5 minutos)
4. Después de ejecutar, revisa el log en `~/backend/logs/`
5. Elimina el cron job después de verificar

**Opción C: Mediante PHP Script (alternativa)**

Crea un archivo `run_migration.php` en `public_html`:

```php
<?php
// Este archivo ejecuta las migraciones
// ELIMÍNALO después de usar por seguridad

$output = shell_exec('source /home/usuario/virtualenv/backend/3.9/bin/activate && cd ~/backend && python run_migrations.py 2>&1');
echo "<pre>$output</pre>";

// Opcional: Auto-eliminar este archivo después de ejecutar
// unlink(__FILE__);
?>
```

Accede a `https://tudominio.com/run_migration.php` desde el navegador.

### Paso 5: Crear Cache Table

Solo la primera vez:

```bash
python manage.py createcachetable
```

O añade a `run_migrations.py`:
```bash
python run_migrations.py --create-cache
```

### Paso 6: Crear Superusuario

```bash
python manage.py createsuperuser
```

Sigue las instrucciones para crear el primer usuario administrador.

### Paso 7: Configurar Archivos Estáticos en Passenger

1. En `Setup Python App`, edita tu aplicación
2. En `Static files`, añade:

   ```
   URL: /static/
   Path: staticfiles

   URL: /media/
   Path: media
   ```

3. Click en `Save`

### Paso 8: Reiniciar la Aplicación

1. En `Setup Python App`
2. Click en `Restart` junto a tu aplicación
3. Espera unos segundos

---

## Despliegue Frontend React

### Paso 1: Configurar Variables de Producción

Antes de subir, verifica que `dist/.env.production` tenga:

```env
VITE_API_URL=https://tudominio.com/api
VITE_API_TIMEOUT=30000
VITE_ENABLE_MOCK=false
```

### Paso 2: Subir Frontend

1. **Ve a File Manager**
   - Navega a `public_html/` (o el directorio de tu dominio)

2. **Subir Archivo Comprimido**
   - Upload `frontend-cpanel.zip` o `frontend-cpanel.tar.gz`

3. **Extraer Archivos**
   - Click derecho > Extract
   - Los archivos se extraerán en `public_html/`

4. **Verificar Estructura**
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-abc123.js
   │   ├── index-def456.css
   │   └── ...
   ├── .htaccess
   └── favicon.ico
   ```

### Paso 3: Configurar .htaccess

1. **Verificar que .htaccess existe**
   - Si no existe, crea uno con el contenido de `frontend/.htaccess.example`

2. **Editar .htaccess**
   - Asegúrate de que la redirección HTTPS esté activa
   - Verifica que `RewriteBase /` sea correcto

3. **Contenido mínimo:**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Forzar HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # React Router
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Configuración de Dominios y SSL

### Paso 1: Configurar Dominio/Subdominio

#### Para Subdominio:

1. Ve a `Subdomains` en cPanel
2. Crea un nuevo subdominio:
   - Subdominio: `grasas`
   - Dominio: `stratekaz.com`
   - Document Root: `public_html/grasas` (o donde esté tu frontend)
3. Click en `Create`

#### Para Dominio Addon:

1. Ve a `Addon Domains`
2. Añade el dominio
3. Configura Document Root

### Paso 2: Instalar Certificado SSL

**Opción A: AutoSSL (Recomendado)**

1. Ve a `SSL/TLS Status` en cPanel
2. Encuentra tu dominio
3. Click en `Run AutoSSL`
4. Espera unos minutos a que se genere

**Opción B: Let's Encrypt (Manual)**

1. Ve a `SSL/TLS`
2. Click en `Manage SSL Sites`
3. Selecciona tu dominio
4. Instala certificado Let's Encrypt

**Verificar SSL:**
- Accede a `https://tudominio.com`
- Verifica que el candado aparezca en el navegador

---

## Tareas Post-Despliegue

### 1. Configurar Backups Automáticos

1. **Ve a Backup**
   - Configura backups automáticos en cPanel
   - O usa `JetBackup` si está disponible

2. **Frecuencia Recomendada:**
   - Base de datos: Diario
   - Archivos: Semanal
   - Completo: Mensual

### 2. Configurar Cron Jobs para Mantenimiento

#### Limpiar Sesiones Expiradas (Diario)

```bash
0 2 * * * source /home/usuario/virtualenv/backend/3.9/bin/activate && cd ~/backend && python manage.py clearsessions
```

#### Limpiar Cache (Semanal)

```bash
0 3 * * 0 source /home/usuario/virtualenv/backend/3.9/bin/activate && cd ~/backend && python manage.py clearcache
```

#### Backup de Base de Datos (Diario)

```bash
0 1 * * * mysqldump -u usuario_dbuser -p'password' usuario_grasashuesos > ~/backups/db_$(date +\%Y\%m\%d).sql
```

### 3. Configurar Email (Opcional)

1. Ve a `Email Accounts`
2. Crea cuenta: `noreply@tudominio.com`
3. Configura en `.env`:
   ```
   EMAIL_HOST=mail.tudominio.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=noreply@tudominio.com
   EMAIL_HOST_PASSWORD=password
   ```

### 4. Configurar Monitoreo

#### Uptime Monitoring

- Usa servicios como:
  - UptimeRobot (gratuito)
  - Pingdom
  - StatusCake

- Monitorear:
  - `https://tudominio.com` (frontend)
  - `https://tudominio.com/api/health/` (backend)

#### Error Tracking

Configurar Sentry (opcional):

```env
SENTRY_DSN=https://tu-dsn@sentry.io/proyecto
SENTRY_ENVIRONMENT=production
```

---

## Verificación y Testing

### Checklist de Verificación

#### Backend

- [ ] La aplicación Python aparece como "Running" en Setup Python App
- [ ] Acceso a `/api/admin/` funciona
- [ ] Login con superusuario funciona
- [ ] API responde: `curl https://tudominio.com/api/health/`
- [ ] No hay errores 500 en Error Log de cPanel
- [ ] Archivos estáticos cargan correctamente

#### Frontend

- [ ] `https://tudominio.com` carga correctamente
- [ ] No hay errores en consola del navegador (F12)
- [ ] Navegación entre rutas funciona
- [ ] Reload en ruta profunda funciona (ej: `/dashboard`)
- [ ] Assets cargan (CSS, JS, imágenes)
- [ ] HTTPS funciona (candado verde)

#### Base de Datos

- [ ] Conexión desde backend funciona
- [ ] Todas las tablas están creadas
- [ ] Datos de seed existen (si aplicable)
- [ ] Backups funcionan

### Testing Funcional

1. **Login**
   - Accede a `https://tudominio.com/login`
   - Inicia sesión con superusuario
   - Verifica redirección al dashboard

2. **CRUD Básico**
   - Crea un registro en cualquier módulo
   - Edita el registro
   - Elimina el registro

3. **API Endpoints**
   ```bash
   # Test de autenticación
   curl -X POST https://tudominio.com/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password"}'

   # Test de endpoint protegido
   curl https://tudominio.com/api/core/users/ \
     -H "Authorization: Bearer TOKEN_AQUI"
   ```

4. **Performance**
   - Usa Google PageSpeed Insights
   - Tiempo de carga < 3 segundos
   - Core Web Vitals en verde

---

## Mantenimiento y Actualizaciones

### Actualizar Backend

1. **En Local:**
   ```bash
   git pull origin main
   cd backend
   python prepare_static.py
   ```

2. **Subir Cambios:**
   - Comprime solo archivos modificados
   - Sube via File Manager
   - Extrae en el directorio correcto

3. **Ejecutar Migraciones:**
   ```bash
   python run_migrations.py
   ```

4. **Reiniciar App:**
   - Setup Python App > Restart

### Actualizar Frontend

1. **En Local:**
   ```bash
   cd frontend
   npm run build  # o .\build-cpanel.ps1
   ```

2. **Subir Dist:**
   - Elimina contenido de `public_html/` (excepto .htaccess)
   - Sube nuevos archivos de `dist/`

3. **Limpiar Cache:**
   - Ctrl+Shift+R en navegador
   - O espera a que expire el cache

### Actualizar Dependencias

```bash
# En local
pip install -U -r requirements-cpanel.txt

# En cPanel
# Setup Python App > Run Pip Install (forzar actualización)
```

---

## Troubleshooting

### Backend No Responde

**Síntoma:** Error 500 o aplicación no carga

**Soluciones:**

1. **Revisar Error Log:**
   - cPanel > Metrics > Errors
   - Buscar últimos errores

2. **Verificar passenger_wsgi.py:**
   ```bash
   # Revisar logs/passenger.log
   cat ~/backend/logs/passenger.log
   ```

3. **Verificar Variables de Entorno:**
   - Setup Python App > Environment variables
   - Asegurar que todas estén configuradas

4. **Reiniciar Aplicación:**
   - Setup Python App > Restart

5. **Verificar Conexión a BD:**
   ```bash
   python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('OK')"
   ```

### Frontend No Carga

**Síntoma:** Página en blanco o Error 404

**Soluciones:**

1. **Verificar .htaccess:**
   - Asegurar que existe en public_html/
   - Verificar sintaxis

2. **Verificar Archivos:**
   - `index.html` debe existir en raíz
   - Directorio `assets/` debe existir

3. **Revisar Console del Navegador:**
   - F12 > Console
   - Buscar errores de carga

4. **Verificar MIME Types:**
   - Añadir en .htaccess:
   ```apache
   AddType application/javascript .js
   AddType text/css .css
   ```

### React Router No Funciona

**Síntoma:** 404 al recargar rutas

**Solución:**

Verificar que `.htaccess` tenga:

```apache
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### API No Se Conecta

**Síntoma:** Frontend no puede llamar al backend

**Soluciones:**

1. **Verificar CORS:**
   - En `.env`:
   ```
   CORS_ALLOWED_ORIGINS=https://tudominio.com
   ```

2. **Verificar URL de API:**
   - En frontend, verificar `VITE_API_URL`

3. **Verificar HTTPS:**
   - Asegurar que backend tenga SSL

### Errores de MySQL

**Síntoma:** "Can't connect to MySQL server"

**Soluciones:**

1. **Verificar Credenciales:**
   - Usuario correcto
   - Password correcto
   - Nombre de BD correcto

2. **Verificar Permisos:**
   - MySQL Databases > Current Users
   - Verificar privilegios

3. **Verificar Host:**
   - Usar `localhost` (no 127.0.0.1)

### Migraciones Fallan

**Síntoma:** Error al ejecutar migraciones

**Soluciones:**

1. **Revisar Log:**
   ```bash
   cat ~/backend/logs/migration_*.log
   ```

2. **Verificar Orden:**
   ```bash
   python manage.py showmigrations
   ```

3. **Fake Migration (último recurso):**
   ```bash
   python run_migrations.py --fake
   ```

### Archivos Estáticos No Cargan

**Síntoma:** CSS/JS no aplican

**Soluciones:**

1. **Re-ejecutar collectstatic:**
   ```bash
   python prepare_static.py
   ```

2. **Verificar Configuración en Passenger:**
   - Setup Python App > Static files
   - URL: `/static/`
   - Path: `staticfiles`

3. **Verificar Permisos:**
   ```bash
   chmod -R 755 staticfiles/
   ```

---

## Recursos Adicionales

### Documentos Relacionados

- `backend/passenger_wsgi.py` - Entry point de Passenger
- `backend/requirements-cpanel.txt` - Dependencias optimizadas
- `backend/.env.cpanel.example` - Variables de entorno
- `frontend/.htaccess.example` - Configuración Apache
- `docs/CPANEL_EXECUTIVE_SUMMARY.md` - Resumen de arquitectura

### Scripts Útiles

- `backend/prepare_static.py` - Recolectar archivos estáticos
- `backend/run_migrations.py` - Ejecutar migraciones
- `frontend/build-cpanel.ps1` - Build para Windows
- `frontend/build-cpanel.sh` - Build para Linux/Mac

### Comandos Rápidos

```bash
# Activar virtualenv
source /home/usuario/virtualenv/backend/3.9/bin/activate

# Ver logs
tail -f ~/backend/logs/app.log

# Limpiar cache
python manage.py clearcache

# Ver migraciones pendientes
python run_migrations.py --check

# Crear superusuario
python manage.py createsuperuser
```

### Soporte

- **Email:** soporte@stratekaz.com
- **Documentación:** https://docs.stratekaz.com
- **GitHub:** https://github.com/tu-usuario/grasas-huesos-sgi

---

## Changelog

| Versión | Fecha      | Cambios                                    |
|---------|------------|--------------------------------------------|
| 2.0     | 2026-01-07 | Guía completa sin SSH, scripts automatizados |
| 1.5     | 2025-12-30 | Añadido soporte para múltiples empresas    |
| 1.0     | 2025-12-15 | Versión inicial                            |

---

**Última actualización:** 2026-01-07
**Mantenido por:** Equipo DevOps - StrateKaz
