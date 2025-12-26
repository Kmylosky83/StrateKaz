# Guía de Despliegue

## Entornos

| Entorno | URL | Hosting |
|---------|-----|---------|
| **Desarrollo** | localhost:3010 | Docker local |
| **Staging** | grasas.stratekaz.com | cPanel |
| **Producción** | TBD | AWS/DigitalOcean |

---

## Desarrollo (Docker)

```bash
# Iniciar
docker-compose up -d

# URLs
# Frontend: http://localhost:3010
# Backend:  http://localhost:8000
# Admin:    http://localhost:8000/admin

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Detener
docker-compose down
```

---

## Staging (cPanel)

### Requisitos

- cPanel con Python App (CloudLinux/LiteSpeed)
- MySQL 8.0
- Subdominio configurado

### Pasos de Despliegue

#### 1. Preparar Archivos

```bash
# Comprimir backend
cd backend
zip -r ../backend.zip . -x "__pycache__/*" -x "*.pyc" -x "media/*"

# Comprimir frontend build
cd frontend
npm run build
zip -r ../frontend-dist.zip dist/
```

#### 2. Subir a cPanel

1. Acceder a cPanel → File Manager
2. Navegar al directorio del subdominio
3. Subir `backend.zip` y `frontend-dist.zip`
4. Extraer ambos archivos

#### 3. Configurar Python App

1. cPanel → Setup Python App
2. Python version: 3.11
3. Application root: `/home/user/grasas.stratekaz.com/backend`
4. Application URL: `grasas.stratekaz.com`
5. Application startup file: `passenger_wsgi.py`
6. Click "Create"

#### 4. Instalar Dependencias

```bash
# En terminal cPanel o SSH
source /home/user/virtualenv/grasas/3.11/bin/activate
cd /home/user/grasas.stratekaz.com/backend
pip install -r requirements.txt
```

#### 5. Configurar Variables de Entorno

Crear archivo `.env`:

```bash
# .env
DEBUG=False
SECRET_KEY=tu-secret-key-segura
ALLOWED_HOSTS=grasas.stratekaz.com

# Database
DB_NAME=grasas_db
DB_USER=grasas_user
DB_PASSWORD=secure_password
DB_HOST=localhost
DB_PORT=3306

# CORS
CORS_ALLOWED_ORIGINS=https://grasas.stratekaz.com
```

#### 6. Migraciones y Static Files

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

#### 7. Passenger WSGI

```python
# passenger_wsgi.py
import os
import sys

# Agregar paths
sys.path.insert(0, '/home/user/grasas.stratekaz.com/backend')
sys.path.insert(0, '/home/user/virtualenv/grasas/3.11/lib/python3.11/site-packages')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### Archivos de Deploy

| Archivo | Descripción |
|---------|-------------|
| `deploy/cpanel/passenger_wsgi.py` | Punto de entrada WSGI |
| `deploy/cpanel/.env.staging` | Template de variables |
| `deploy/cpanel/DEPLOY-CPANEL.md` | Guía detallada |

---

## Producción (Docker + Nginx)

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DEBUG=False
      - DATABASE_URL=mysql://user:pass@db:3306/grasas
    volumes:
      - static_volume:/app/static
      - media_volume:/app/media
    depends_on:
      - db
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    volumes:
      - frontend_build:/app/dist

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - static_volume:/static
      - media_volume:/media
      - frontend_build:/frontend
    depends_on:
      - backend
      - frontend

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=grasas
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  static_volume:
  media_volume:
  frontend_build:
  mysql_data:
  redis_data:
```

### Nginx Config

```nginx
# nginx/nginx.conf
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Frontend
    location / {
        root /frontend;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /static/ {
        alias /static/;
    }

    # Media files
    location /media/ {
        alias /media/;
    }
}
```

---

## Checklist de Despliegue

### Pre-Deploy

- [ ] Tests pasando (`pytest`, `npm test`)
- [ ] Build exitoso (`npm run build`)
- [ ] Variables de entorno configuradas
- [ ] Backup de BD actual

### Deploy

- [ ] Subir archivos
- [ ] Instalar dependencias
- [ ] Ejecutar migraciones
- [ ] Collectstatic
- [ ] Reiniciar servicios

### Post-Deploy

- [ ] Verificar sitio accesible
- [ ] Verificar login funcional
- [ ] Verificar API respondiendo
- [ ] Verificar logs sin errores
- [ ] Notificar equipo

---

## Rollback

### Staging (cPanel)

```bash
# Restaurar backup anterior
unzip backup_anterior.zip -d /home/user/grasas.stratekaz.com/backend

# Restaurar BD
mysql -u user -p grasas_db < backup.sql

# Restart
# cPanel → Python App → Restart
```

### Producción (Docker)

```bash
# Volver a imagen anterior
docker-compose -f docker-compose.prod.yml down
docker tag grasas/backend:latest grasas/backend:rollback
docker tag grasas/backend:previous grasas/backend:latest
docker-compose -f docker-compose.prod.yml up -d
```

---

## Documentación Relacionada

- [CI-CD.md](CI-CD.md) - Pipelines automatizados
- [BACKUPS.md](BACKUPS.md) - Sistema de backups
