# Guía de Despliegue en cPanel - Grasas y Huesos del Norte

## Requisitos Previos

- Acceso a cPanel con Python Selector
- Subdominio configurado: `grasas.stratekaz.com`
- Acceso SSH (recomendado)
- Base de datos MySQL creada

---

## Paso 1: Crear Base de Datos MySQL

### En cPanel > MySQL Databases:

1. **Crear base de datos:**
   - Nombre: `grasas_staging` (cPanel agregará prefijo: `usuario_grasas_staging`)

2. **Crear usuario:**
   - Usuario: `grasas_user` (cPanel agregará prefijo: `usuario_grasas_user`)
   - Password: Generar uno seguro y guardarlo

3. **Asignar usuario a base de datos:**
   - Seleccionar TODOS los privilegios

4. **Anotar credenciales:**
   ```
   DB_NAME=usuario_grasas_staging
   DB_USER=usuario_grasas_user
   DB_PASSWORD=tu_password_generado
   DB_HOST=localhost
   DB_PORT=3306
   ```

---

## Paso 2: Configurar Python App en cPanel

### En cPanel > Setup Python App:

1. **Crear nueva aplicación:**
   - Python version: `3.9` o superior
   - Application root: `grasas.stratekaz.com` (o el nombre de tu subdominio)
   - Application URL: `grasas.stratekaz.com`
   - Application startup file: `passenger_wsgi.py`
   - Application Entry point: `application`

2. **Click en "CREATE"**

3. **Anotar la ruta del entorno virtual:**
   ```
   Ejemplo: /home/usuario/virtualenv/grasas.stratekaz.com/3.9/bin/python
   ```

---

## Paso 3: Subir Archivos

### Opción A: Vía SSH (Recomendado)

```bash
# Conectar por SSH
ssh usuario@stratekaz.com

# Ir al directorio del subdominio
cd ~/grasas.stratekaz.com

# Clonar repositorio (si es primera vez)
git clone https://github.com/Kmylosky83/Grasas-Huesos-SGI.git .

# O actualizar si ya existe
git pull origin main
```

### Opción B: Vía File Manager o FTP

1. Comprimir la carpeta `dist/` generada por el build
2. Subir el ZIP a cPanel > File Manager
3. Extraer en el directorio correspondiente

### Estructura de archivos en cPanel:

```
~/grasas.stratekaz.com/
├── passenger_wsgi.py          # Punto de entrada WSGI
├── backend/                   # Código Django
│   ├── .env                   # Configuración (crear desde .env.example)
│   ├── config/
│   ├── apps/
│   ├── requirements.txt
│   └── manage.py
└── public_html/               # Frontend (archivos estáticos)
    ├── index.html
    ├── .htaccess
    └── assets/
```

---

## Paso 4: Configurar Variables de Entorno

### En el directorio backend, crear `.env`:

```bash
cd ~/grasas.stratekaz.com/backend

# Copiar ejemplo
cp .env.example .env

# Editar con nano o vim
nano .env
```

### Contenido del `.env`:

```env
# Generar SECRET_KEY única:
# python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=tu-clave-secreta-generada

DEBUG=False
ALLOWED_HOSTS=grasas.stratekaz.com,www.grasas.stratekaz.com

# Base de datos (valores de Paso 1)
DB_NAME=usuario_grasas_staging
DB_USER=usuario_grasas_user
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=3306

# JWT
JWT_ACCESS_TOKEN_LIFETIME=30
JWT_REFRESH_TOKEN_LIFETIME=720

# CORS
CORS_ALLOWED_ORIGINS=https://grasas.stratekaz.com

# Email (opcional)
EMAIL_HOST=mail.stratekaz.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@stratekaz.com
EMAIL_HOST_PASSWORD=password_email

# Negocio
PRECIO_COMPRA_ECONORTE=3500
PRECIO_REFERENCIA_COMISION=3000
COMISION_FIJA_POR_KILO=100

DJANGO_LOG_LEVEL=WARNING
```

---

## Paso 5: Instalar Dependencias Python

### Vía Terminal en cPanel o SSH:

```bash
# Activar entorno virtual (ruta de Paso 2)
source /home/usuario/virtualenv/grasas.stratekaz.com/3.9/bin/activate

# Ir al directorio backend
cd ~/grasas.stratekaz.com/backend

# Instalar dependencias
pip install -r requirements.txt

# Instalar mysqlclient (driver MySQL)
pip install mysqlclient
```

---

## Paso 6: Migraciones y Datos Iniciales

```bash
# Con el entorno virtual activado

# Ejecutar migraciones
python manage.py migrate

# Recolectar archivos estáticos
python manage.py collectstatic --noinput

# Crear superusuario
python manage.py createsuperuser
```

---

## Paso 7: Configurar Frontend

### Subir archivos del frontend a `public_html`:

```bash
# Los archivos del build de Vite van en:
~/grasas.stratekaz.com/public_html/

# Verificar que .htaccess existe para React Router
```

### Contenido de `.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # No reescribir archivos existentes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # Redirigir a index.html para React Router
    RewriteRule ^ index.html [L]
</IfModule>
```

---

## Paso 8: Configurar Proxy para API

### En cPanel > Apache Handlers o .htaccess del subdominio:

Crear archivo `.htaccess` en la raíz del subdominio:

```apache
# Proxy para API requests
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Requests a /api van al backend Django
    RewriteCond %{REQUEST_URI} ^/api
    RewriteRule ^(.*)$ http://127.0.0.1:PUERTO_PASSENGER/$1 [P,L]
</IfModule>
```

**Nota:** El puerto lo asigna Passenger automáticamente. En algunos hostings, el backend se configura como subpath.

---

## Paso 9: Reiniciar Aplicación

### En cPanel > Setup Python App:

1. Ir a la aplicación Python configurada
2. Click en **"RESTART"**

### Verificar logs si hay errores:

```bash
# Ver logs de error
tail -f ~/logs/grasas.stratekaz.com-error.log

# Ver logs de acceso
tail -f ~/logs/grasas.stratekaz.com-access.log
```

---

## Paso 10: Verificar Despliegue

1. **Abrir navegador:** `https://grasas.stratekaz.com`
2. **Verificar frontend:** Debe cargar la interfaz React
3. **Verificar API:** `https://grasas.stratekaz.com/api/health/` debe responder
4. **Probar login:** Usar credenciales del superusuario creado

---

## Actualizaciones Futuras

### Workflow para actualizar:

```bash
# 1. En tu máquina local
git add .
git commit -m "descripción del cambio"
git push origin main

# 2. En el servidor (SSH)
cd ~/grasas.stratekaz.com
git pull origin main

# 3. Si hay cambios en backend
source /home/usuario/virtualenv/grasas.stratekaz.com/3.9/bin/activate
cd backend
pip install -r requirements.txt  # Solo si hay nuevas dependencias
python manage.py migrate         # Solo si hay migraciones
python manage.py collectstatic --noinput

# 4. Reiniciar aplicación en cPanel

# 5. Si hay cambios en frontend
# Subir nuevos archivos a public_html
```

---

## Troubleshooting

### Error 500 - Internal Server Error

```bash
# Verificar logs
tail -100 ~/logs/grasas.stratekaz.com-error.log

# Causas comunes:
# - SECRET_KEY no configurada
# - Base de datos no accesible
# - Dependencias faltantes
```

### Static files no cargan

```bash
# Ejecutar collectstatic
python manage.py collectstatic --noinput

# Verificar permisos
chmod -R 755 staticfiles/
```

### CORS errors

- Verificar `CORS_ALLOWED_ORIGINS` incluye el dominio con https
- Verificar `ALLOWED_HOSTS` está correcto

### Base de datos connection refused

- Verificar credenciales en `.env`
- Verificar que el usuario tiene permisos
- Probar conexión manual: `mysql -u usuario -p`

---

## Comandos Útiles

```bash
# Entrar al entorno virtual
source /home/usuario/virtualenv/grasas.stratekaz.com/3.9/bin/activate

# Ver estado de migraciones
python manage.py showmigrations

# Shell de Django
python manage.py shell

# Crear nuevo superusuario
python manage.py createsuperuser

# Reset de base de datos (CUIDADO: borra datos)
python manage.py flush
```

---

## Contacto

Para soporte técnico o problemas con el despliegue, revisar:
- Logs de error en cPanel
- Issues en GitHub: https://github.com/Kmylosky83/Grasas-Huesos-SGI/issues
