# Guia de Despliegue Paso a Paso - Multi-Instancia

**Version:** 2.0
**Fecha:** 17 Enero 2026
**Para:** Despliegue de nuevas instancias de StrateKaz en cPanel

---

## ARQUITECTURA MULTI-INSTANCIA

Cada cliente/empresa obtiene:
- Su propio **subdominio**: `empresa.stratekaz.com`
- Su propia **base de datos**: `strateka_empresa`
- Su propio **backend**: `/home/strateka/backends/empresa/`
- Su propio **frontend**: `/home/strateka/empresa.stratekaz.com/`
- Su propio **virtualenv**: `/home/strateka/virtualenv/backends/empresa/3.12/`

```
/home/strateka/
├── backends/
│   ├── grasas/           <- Backend instancia 1
│   ├── econorte/         <- Backend instancia 2
│   └── acme/             <- Backend instancia N
├── grasas.stratekaz.com/ <- Frontend instancia 1
├── econorte.stratekaz.com/
├── acme.stratekaz.com/
└── virtualenv/
    └── backends/
        ├── grasas/3.12/
        ├── econorte/3.12/
        └── acme/3.12/
```

---

## ANTES DE EMPEZAR

### Requisitos

| Requisito | Como verificar | Estado |
|-----------|----------------|--------|
| Acceso a cPanel | Tienes usuario y contrasena | [ ] |
| Nombre de instancia definido | Ej: grasas, econorte | [ ] |
| Este repositorio clonado | Carpeta StrateKaz en tu PC | [ ] |
| Node.js instalado | `node --version` en terminal | [ ] |
| Python instalado | `python --version` en terminal | [ ] |

### Tiempo estimado

- **Primera vez:** 1-2 horas
- **Instancias adicionales:** 30-45 minutos

---

## PASO 1: Preparar el Frontend (15 min)

### 1.1 Abrir terminal en la carpeta del proyecto

```powershell
cd C:\Proyectos\StrateKaz\frontend
```

### 1.2 Instalar dependencias (solo primera vez)

```powershell
npm install
```

### 1.3 Construir para produccion

```powershell
npm run build
```

### 1.4 Verificar resultado

Debe existir la carpeta `frontend/dist/` con:
- `index.html`
- `assets/` (carpeta con .js y .css)

---

## PASO 2: Preparar el Backend (10 min)

### 2.1 Navegar a la carpeta backend

```powershell
cd C:\Proyectos\StrateKaz\backend
```

### 2.2 Activar el entorno virtual

```powershell
.\venv\Scripts\activate
```

### 2.3 Recolectar archivos estaticos

```powershell
python manage.py collectstatic --noinput
```

### 2.4 Comprimir backend para subir

Crear ZIP con estas carpetas/archivos:
- `apps/`
- `config/`
- `staticfiles/`
- `media/`
- `templates/`
- `utils/`
- `passenger_wsgi.py`
- `manage.py`
- `requirements.txt`

**NO incluir:** `venv/`, `__pycache__/`, `.git/`, `*.pyc`

---

## PASO 3: Crear Base de Datos en cPanel (15 min)

### 3.1 Acceder a cPanel

1. Ir a `https://tu-hosting.com/cpanel`
2. Iniciar sesion

### 3.2 Crear la base de datos

1. Buscar **"MySQL Databases"**
2. Nombre: `{instancia}` (ej: `grasas`)
   - cPanel agregara prefijo: `strateka_grasas`
3. Click **"Create Database"**

### 3.3 Crear usuario de base de datos

1. Username: `kmylosky` (o el que prefieras)
2. Password: Generar una segura
3. Click **"Create User"**

### 3.4 Asignar permisos

1. Seleccionar usuario y base de datos
2. Marcar **"ALL PRIVILEGES"**
3. Click **"Make Changes"**

### 3.5 Guardar credenciales

```
DB_NAME: strateka_grasas
DB_USER: strateka_kmylosky
DB_PASSWORD: (la que generaste)
DB_HOST: localhost
DB_PORT: 3306
```

---

## PASO 4: Subir el Backend (20 min)

### 4.1 Crear estructura de carpetas

En File Manager, crear:
```
/home/strateka/backends/{instancia}/
```

Ejemplo: `/home/strateka/backends/grasas/`

### 4.2 Subir y extraer

1. Subir el ZIP del backend
2. Extraer
3. Eliminar el ZIP

---

## PASO 5: Configurar Python App (25 min)

### 5.1 Crear nueva aplicacion

En cPanel, buscar **"Setup Python App"** > **"CREATE APPLICATION"**

### 5.2 Configuracion

| Campo | Valor |
|-------|-------|
| Python version | 3.12 |
| Application root | `backends/{instancia}` (ej: `backends/grasas`) |
| Application URL | `{instancia}.stratekaz.com` |
| Application startup file | `passenger_wsgi.py` |
| Application Entry point | `application` |

### 5.3 Variables de entorno

Agregar en la seccion "Environment variables":

```
SECRET_KEY = (generar clave larga aleatoria)
DEBUG = True  (cambiar a False despues de verificar)
ALLOWED_HOSTS = {instancia}.stratekaz.com
DB_NAME = strateka_{instancia}
DB_USER = strateka_kmylosky
DB_PASSWORD = (tu password)
DB_HOST = localhost
DB_PORT = 3306
USE_CPANEL = True
CSRF_TRUSTED_ORIGINS = https://{instancia}.stratekaz.com
CORS_ALLOWED_ORIGINS = https://{instancia}.stratekaz.com
DJANGO_SETTINGS_MODULE = config.settings
```

### 5.4 Instalar dependencias

1. Click **"Run Pip Install"**
2. Esperar 5-10 minutos

### 5.5 Guardar y reiniciar

1. Click **"Save"** o **"Update"**
2. Click **"Restart"**

---

## PASO 6: Ejecutar Migraciones (10 min)

### 6.1 Abrir Terminal en cPanel

Buscar **"Terminal"** en cPanel.

### 6.2 Activar entorno y ejecutar

```bash
# Activar virtualenv
source /home/strateka/virtualenv/backends/{instancia}/3.12/bin/activate

# Ir a carpeta backend
cd /home/strateka/backends/{instancia}

# Ejecutar migraciones
python manage.py migrate

# Crear tabla de cache
python manage.py createcachetable

# Crear superusuario
python manage.py createsuperuser
```

---

## PASO 7: Ejecutar Seeds (CRITICO)

Este paso carga los 14 modulos, 77 tabs y secciones del sistema.

```bash
# (continuar en la misma terminal con virtualenv activo)

# Seed de estructura completa - OBLIGATORIO
python manage.py seed_estructura_final

# Seed de branding (opcional)
python manage.py create_default_branding
```

**Resultado esperado:**
```
================================================================================
  SEED ESTRUCTURA FINAL - ERP STRATEKAZ
  14 Módulos | 81 Tabs | Secciones | 6 Niveles
================================================================================
  [OK] [10] Direccion Estrategica (CREADO)
  [OK] [20] Cumplimiento Normativo (CREADO)
  ...
  TOTAL: 14 módulos | 77 tabs | 19 secciones
================================================================================
```

---

## PASO 8: Subir el Frontend (15 min)

### 8.1 Navegar al directorio del frontend

En File Manager, ir a:
```
/home/strateka/{instancia}.stratekaz.com/
```

### 8.2 Subir frontend

1. Subir contenido de `frontend/dist/`
2. Verificar que `index.html` quede en la raiz

### 8.3 Verificar estructura

```
{instancia}.stratekaz.com/
├── index.html
├── assets/
│   ├── index-xxx.js
│   └── index-xxx.css
└── .htaccess (se genera automaticamente)
```

---

## PASO 9: Configurar SSL (5 min)

### 9.1 Activar AutoSSL

1. En cPanel, buscar **"SSL/TLS Status"**
2. Encontrar el subdominio
3. Click **"Run AutoSSL"**
4. Esperar unos minutos

### 9.2 Verificar HTTPS

Visitar `https://{instancia}.stratekaz.com` - debe aparecer candado verde.

---

## PASO 10: Verificacion Final

### Checklist

| Item | Como verificar | OK |
|------|----------------|-----|
| Frontend carga | Visitar `https://{instancia}.stratekaz.com` | [ ] |
| Login funciona | Entrar con superusuario | [ ] |
| Sidebar carga | Ver los 14 modulos | [ ] |
| Admin funciona | Visitar `/admin/` | [ ] |
| API responde | Visitar `/api/health/` | [ ] |
| HTTPS activo | Candado verde en navegador | [ ] |

### Verificar en Terminal

```bash
# Test de API
curl https://{instancia}.stratekaz.com/api/health/
# Debe responder: {"status": "healthy", "service": "stratekaz-backend"}

# Test de modulos
curl https://{instancia}.stratekaz.com/api/core/system-modules/sidebar/
# Debe responder con lista de modulos
```

---

## PROBLEMAS COMUNES

### "Error 500" o pagina en blanco

1. Revisar Error Log en cPanel (Metrics > Errors)
2. Verificar variables de entorno
3. Reiniciar Python App

### Sidebar no carga modulos

**Causa:** No se ejecuto el seed.

**Solucion:**
```bash
source /home/strateka/virtualenv/backends/{instancia}/3.12/bin/activate
cd /home/strateka/backends/{instancia}
python manage.py seed_estructura_final
```

### "CORS error" en consola

Verificar `CORS_ALLOWED_ORIGINS` en variables de entorno.

### Base de datos no conecta

1. Verificar credenciales exactas
2. Usar `localhost` como host
3. Verificar permisos del usuario

### "404 Not Found" al recargar pagina

El `.htaccess` no esta configurado. Passenger deberia manejarlo automaticamente con `USE_CPANEL=True`.

---

## POST-DESPLIEGUE

### Cambiar DEBUG a False

Una vez verificado todo:

1. En Setup Python App
2. Editar variable: `DEBUG = False`
3. Reiniciar aplicacion

### Configurar empresa desde frontend

1. Login como superusuario
2. Ir a Direccion Estrategica > Configuracion
3. Configurar datos de la empresa
4. Subir logo en Identidad

---

## COMANDOS UTILES

### Reiniciar aplicacion
```bash
touch /home/strateka/backends/{instancia}/tmp/restart.txt
```

### Ver logs
```bash
tail -f /home/strateka/backends/{instancia}/logs/passenger.log
```

### Actualizar codigo
```bash
cd /home/strateka/backends/{instancia}
git pull origin main
source /home/strateka/virtualenv/backends/{instancia}/3.12/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
touch tmp/restart.txt
```

---

## RESUMEN DE RUTAS POR INSTANCIA

| Componente | Ruta |
|------------|------|
| Backend | `/home/strateka/backends/{instancia}/` |
| Frontend | `/home/strateka/{instancia}.stratekaz.com/` |
| Virtualenv | `/home/strateka/virtualenv/backends/{instancia}/3.12/` |
| Logs | `/home/strateka/backends/{instancia}/logs/` |
| Media | `/home/strateka/backends/{instancia}/media/` |
| Static | `/home/strateka/backends/{instancia}/staticfiles/` |

---

**Documento actualizado:** 17 Enero 2026
**Basado en:** Despliegue real de grasas.stratekaz.com
**Proximo paso:** Ver [GUIA-MULTI-INSTANCIA.md](devops/GUIA-MULTI-INSTANCIA.md) para scripts de automatizacion
