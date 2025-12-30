# Guía de Despliegue en Producción
## SGI Grasas y Huesos del Norte S.A.S

---

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Preparación del Servidor](#preparación-del-servidor)
3. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
4. [Certificados SSL (Let's Encrypt)](#certificados-ssl-lets-encrypt)
5. [Despliegue con Docker Compose](#despliegue-con-docker-compose)
6. [Configuración de Backups](#configuración-de-backups)
7. [Monitoreo con Sentry](#monitoreo-con-sentry)
8. [Verificación del Despliegue](#verificación-del-despliegue)
9. [Troubleshooting](#troubleshooting)
10. [Mantenimiento](#mantenimiento)

---

## Requisitos Previos

### Hardware Mínimo Recomendado

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disco**: 100 GB SSD
- **Ancho de banda**: 100 Mbps

### Software Requerido

```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Configuración del Sistema

```bash
# Aumentar límites del sistema
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF
vm.max_map_count=262144
fs.file-max=65536
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=8096
EOF

sudo sysctl -p

# Configurar límites de archivos
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF
```

---

## Preparación del Servidor

### 1. Crear Usuario de Despliegue

```bash
# Crear usuario
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy

# Cambiar a usuario deploy
su - deploy
```

### 2. Clonar el Repositorio

```bash
cd /opt
sudo mkdir apps
sudo chown deploy:deploy apps
cd apps

# Clonar repositorio
git clone <repository-url> grasas-huesos
cd grasas-huesos
```

### 3. Crear Estructura de Directorios

```bash
mkdir -p docker/backups
mkdir -p docker/certbot/conf
mkdir -p docker/certbot/www
mkdir -p docker/nginx/ssl
mkdir -p logs/backend
mkdir -p logs/nginx
mkdir -p data/mysql

# Permisos
chmod -R 755 docker
chmod +x docker/backup/*.sh
```

---

## Configuración de Variables de Entorno

### 1. Copiar Template de Producción

```bash
cp .env.production.example .env.production
```

### 2. Generar Claves Seguras

```bash
# Generar SECRET_KEY de Django
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Generar contraseñas seguras
openssl rand -base64 32
```

### 3. Editar Variables de Producción

```bash
nano .env.production
```

**Variables críticas a configurar:**

```env
# Aplicación
DEBUG=False
SECRET_KEY=<generated-secret-key>

# Dominio
DOMAIN=tu-dominio.com
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com,api.tu-dominio.com
CORS_ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
CSRF_TRUSTED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com

# Base de datos
MYSQL_DATABASE=grasas_huesos_prod
MYSQL_ROOT_PASSWORD=<generated-password>
MYSQL_USER=grasas_user_prod
MYSQL_PASSWORD=<generated-password>

# Redis
REDIS_PASSWORD=<generated-password>

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=noreply@tu-dominio.com
EMAIL_HOST_PASSWORD=<app-password>

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production

# Frontend
VITE_API_URL=https://api.tu-dominio.com/api
```

---

## Certificados SSL (Let's Encrypt)

### Opción 1: Certbot Manual (Recomendado para inicio)

```bash
# Instalar Certbot
sudo apt-get update
sudo apt-get install certbot

# Obtener certificado (método standalone - requiere puerto 80 libre)
sudo certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Copiar certificados
sudo cp -r /etc/letsencrypt/live/tu-dominio.com/* docker/nginx/ssl/
sudo chown -R deploy:deploy docker/nginx/ssl/
```

### Opción 2: Certbot Automático (con Docker)

```bash
# Iniciar nginx temporalmente para validación
docker-compose -f docker-compose.prod.yml up -d nginx

# Obtener certificado
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d tu-dominio.com \
  -d www.tu-dominio.com \
  --email admin@tu-dominio.com \
  --agree-tos \
  --no-eff-email
```

### Actualizar nginx.conf con Dominio Real

```bash
# Editar nginx.conf
nano docker/nginx/nginx.prod.conf

# Reemplazar:
# ssl_certificate /etc/letsencrypt/live/domain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/domain.com/privkey.pem;

# Con:
# ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
```

---

## Despliegue con Docker Compose

### 1. Build de Imágenes

```bash
# Build backend
docker-compose -f docker-compose.prod.yml build backend

# Build frontend
docker-compose -f docker-compose.prod.yml build frontend
```

### 2. Iniciar Base de Datos y Redis

```bash
# Iniciar solo db y redis
docker-compose -f docker-compose.prod.yml up -d db redis

# Esperar a que estén saludables (check logs)
docker-compose -f docker-compose.prod.yml logs -f db
```

### 3. Ejecutar Migraciones Iniciales

```bash
# Ejecutar migraciones
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

# Crear superusuario
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser

# Recolectar archivos estáticos
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput
```

### 4. Iniciar Todos los Servicios

```bash
# Iniciar todos los servicios
docker-compose -f docker-compose.prod.yml up -d

# Verificar estado
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Verificar Servicios

```bash
# Backend health check
curl https://api.tu-dominio.com/api/health/

# Frontend
curl https://tu-dominio.com/health

# Verificar Flower (opcional)
curl https://tu-dominio.com/flower/
```

---

## Configuración de Backups

### Verificar Servicio de Backup

```bash
# Ver logs del servicio de backup
docker-compose -f docker-compose.prod.yml logs -f backup

# Ejecutar backup manual
docker-compose -f docker-compose.prod.yml exec backup /usr/local/bin/backup.sh
```

### Configurar Backups Remotos (Opcional)

```bash
# Instalar rclone para backups a S3/GCS
curl https://rclone.org/install.sh | sudo bash

# Configurar rclone
rclone config

# Crear script de sincronización
cat > ~/sync-backups.sh << 'EOF'
#!/bin/bash
rclone sync /opt/apps/grasas-huesos/docker/backups remote:grasas-backups --progress
EOF

chmod +x ~/sync-backups.sh

# Agregar a crontab
crontab -e
# Agregar: 0 4 * * * /home/deploy/sync-backups.sh
```

---

## Monitoreo con Sentry

### 1. Crear Proyecto en Sentry

1. Ir a [sentry.io](https://sentry.io)
2. Crear nuevo proyecto Django
3. Copiar DSN

### 2. Configurar DSN

```bash
# Editar .env.production
nano .env.production

# Agregar:
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production
```

### 3. Reiniciar Servicios

```bash
docker-compose -f docker-compose.prod.yml restart backend celery_worker
```

### 4. Probar Integración

```bash
# Ejecutar comando de prueba
docker-compose -f docker-compose.prod.yml exec backend python manage.py shell

# En el shell:
from sentry_sdk import capture_message
capture_message("Sentry test from production")
```

---

## Verificación del Despliegue

### Checklist de Verificación

```bash
# 1. Servicios corriendo
docker-compose -f docker-compose.prod.yml ps

# 2. Health checks
curl -f https://tu-dominio.com/health
curl -f https://api.tu-dominio.com/api/health/

# 3. SSL válido
curl -vI https://tu-dominio.com 2>&1 | grep "SSL certificate verify"

# 4. Logs sin errores críticos
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep ERROR

# 5. Base de datos accesible
docker-compose -f docker-compose.prod.yml exec backend python manage.py dbshell

# 6. Celery worker funcionando
docker-compose -f docker-compose.prod.yml exec backend celery -A config inspect ping

# 7. Redis funcionando
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# 8. Backups funcionando
ls -lah docker/backups/mysql/
ls -lah docker/backups/media/
```

---

## Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos

```bash
# Verificar que MySQL esté corriendo
docker-compose -f docker-compose.prod.yml ps db

# Ver logs de MySQL
docker-compose -f docker-compose.prod.yml logs db

# Reiniciar MySQL
docker-compose -f docker-compose.prod.yml restart db
```

#### 2. Error 502 Bad Gateway

```bash
# Verificar backend
docker-compose -f docker-compose.prod.yml logs backend

# Reiniciar backend
docker-compose -f docker-compose.prod.yml restart backend

# Verificar nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

#### 3. Celery No Procesa Tareas

```bash
# Ver logs de Celery
docker-compose -f docker-compose.prod.yml logs celery_worker

# Verificar conexión a Redis
docker-compose -f docker-compose.prod.yml exec celery_worker celery -A config inspect ping

# Reiniciar worker
docker-compose -f docker-compose.prod.yml restart celery_worker
```

#### 4. Certificado SSL No Válido

```bash
# Regenerar certificado
sudo certbot renew --force-renewal

# Copiar certificados
sudo cp -r /etc/letsencrypt/live/tu-dominio.com/* docker/nginx/ssl/

# Reiniciar nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Mantenimiento

### Actualizaciones

```bash
# 1. Pull últimos cambios
git pull origin main

# 2. Rebuild imágenes
docker-compose -f docker-compose.prod.yml build

# 3. Ejecutar migraciones
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

# 4. Recolectar estáticos
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput

# 5. Reiniciar servicios (rolling restart)
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build frontend
```

### Limpieza de Recursos

```bash
# Limpiar imágenes antiguas
docker image prune -a

# Limpiar volúmenes no utilizados
docker volume prune

# Limpiar logs de Docker
sudo sh -c "truncate -s 0 /var/lib/docker/containers/*/*-json.log"
```

### Monitoreo de Recursos

```bash
# Ver uso de recursos
docker stats

# Ver uso de disco
df -h
du -sh docker/backups/*

# Ver logs de sistema
journalctl -u docker -f
```

### Restauración desde Backup

```bash
# 1. Detener servicios
docker-compose -f docker-compose.prod.yml stop backend celery_worker

# 2. Restaurar base de datos
docker-compose -f docker-compose.prod.yml exec db bash
mysql -u root -p grasas_huesos_prod < /backups/mysql/latest.sql.gz

# 3. Restaurar archivos media
tar -xzf docker/backups/media/latest.tar.gz -C backend/media/

# 4. Reiniciar servicios
docker-compose -f docker-compose.prod.yml start backend celery_worker
```

---

## Contacto y Soporte

Para soporte técnico, contactar:
- **Email**: soporte@grasasyhuesos.com
- **Documentación**: https://docs.grasasyhuesos.com

---

**Última actualización**: 2025-12-30
**Versión**: 2.0.0
