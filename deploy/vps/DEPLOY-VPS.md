# Guía de Despliegue StrateKaz en VPS (Hostinger)

## Información del Proyecto

- **Versión:** 3.7.1
- **Stack:** Django 5.0.9 + React 18 + MySQL 8 + Redis + Celery
- **Arquitectura:** Multi-tenant (una BD por empresa)

---

## 1. Requisitos del VPS

### Mínimos (2-3 empresas)
- **OS:** Ubuntu 22.04 LTS
- **RAM:** 4 GB
- **CPU:** 2 vCPU
- **SSD:** 50 GB
- **Costo:** ~$35,000 COP/mes (Hostinger)

### Recomendados (5+ empresas)
- **RAM:** 8 GB
- **CPU:** 2-4 vCPU
- **SSD:** 100 GB
- **Costo:** ~$51,000 COP/mes (Hostinger)

---

## 2. Configuración Inicial del VPS

### 2.1 Acceso SSH
```bash
ssh root@TU_IP_VPS
```

### 2.2 Actualizar sistema
```bash
apt update && apt upgrade -y
```

### 2.3 Crear usuario no-root
```bash
adduser stratekaz
usermod -aG sudo stratekaz
su - stratekaz
```

### 2.4 Configurar SSH key (opcional pero recomendado)
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Agregar tu clave pública a ~/.ssh/authorized_keys
```

### 2.5 Firewall básico
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 3. Instalación de Dependencias

### 3.1 Python 3.11
```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev
```

### 3.2 Node.js 18 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3.3 MySQL 8
```bash
sudo apt install -y mysql-server mysql-client libmysqlclient-dev
sudo mysql_secure_installation
```

### 3.4 Redis
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 3.5 Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 3.6 Supervisor
```bash
sudo apt install -y supervisor
sudo systemctl enable supervisor
```

### 3.7 Dependencias adicionales
```bash
# Para WeasyPrint (generación de PDFs)
sudo apt install -y libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info

# Para Pillow
sudo apt install -y libjpeg-dev zlib1g-dev

# Git
sudo apt install -y git

# Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx
```

---

## 4. Estructura de Directorios

```bash
sudo mkdir -p /var/www/stratekaz
sudo chown -R stratekaz:stratekaz /var/www/stratekaz
cd /var/www/stratekaz

# Estructura
mkdir -p {backend,frontend,logs,media,staticfiles,backups}
```

Estructura final:
```
/var/www/stratekaz/
├── backend/           # Código Django
├── frontend/          # Build de React
├── logs/              # Logs de aplicación
├── media/             # Archivos subidos
├── staticfiles/       # Archivos estáticos Django
├── backups/           # Backups de BD
└── venv/              # Virtual environment
```

---

## 5. Clonar Repositorio

```bash
cd /var/www/stratekaz
git clone https://github.com/TU_USUARIO/StrateKaz.git repo
# O usar deploy key para repos privados
```

---

## 6. Configurar Backend

### 6.1 Virtual Environment
```bash
cd /var/www/stratekaz
python3.11 -m venv venv
source venv/bin/activate
```

### 6.2 Instalar dependencias
```bash
cd /var/www/stratekaz/repo/backend
pip install --upgrade pip
pip install -r requirements.txt
```

### 6.3 Crear archivo .env
```bash
cp /var/www/stratekaz/repo/.env.production.example /var/www/stratekaz/repo/backend/.env
nano /var/www/stratekaz/repo/backend/.env
```

**Variables críticas a configurar:**
```env
DEBUG=False
SECRET_KEY=genera-una-clave-segura-de-50-caracteres

# Base de datos
DB_NAME=stratekaz_empresa1
DB_USER=stratekaz_user
DB_PASSWORD=password-muy-seguro
DB_HOST=localhost
DB_PORT=3306

# Hosts permitidos
ALLOWED_HOSTS=empresa1.tudominio.com,www.empresa1.tudominio.com

# CORS y CSRF
CORS_ALLOWED_ORIGINS=https://empresa1.tudominio.com
CSRF_TRUSTED_ORIGINS=https://empresa1.tudominio.com

# Redis
REDIS_URL=redis://localhost:6379/2
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Email (configurar con tu proveedor)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password
```

### 6.4 Crear base de datos MySQL
```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE stratekaz_empresa1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stratekaz_user'@'localhost' IDENTIFIED BY 'password-muy-seguro';
GRANT ALL PRIVILEGES ON stratekaz_empresa1.* TO 'stratekaz_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 6.5 Migraciones y archivos estáticos
```bash
cd /var/www/stratekaz/repo/backend
source /var/www/stratekaz/venv/bin/activate

python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

---

## 7. Configurar Frontend

### 7.1 Build de producción
```bash
cd /var/www/stratekaz/repo/frontend
npm install
npm run build
```

### 7.2 Copiar build a directorio de Nginx
```bash
cp -r /var/www/stratekaz/repo/frontend/dist/* /var/www/stratekaz/frontend/
```

---

## 8. Configurar Gunicorn

### 8.1 Crear archivo de configuración
```bash
nano /var/www/stratekaz/gunicorn.conf.py
```

Contenido en: `deploy/vps/gunicorn.conf.py`

---

## 9. Configurar Supervisor

### 9.1 Gunicorn
```bash
sudo nano /etc/supervisor/conf.d/stratekaz-gunicorn.conf
```

Contenido en: `deploy/vps/supervisor/gunicorn.conf`

### 9.2 Celery Worker
```bash
sudo nano /etc/supervisor/conf.d/stratekaz-celery.conf
```

Contenido en: `deploy/vps/supervisor/celery.conf`

### 9.3 Celery Beat
```bash
sudo nano /etc/supervisor/conf.d/stratekaz-celerybeat.conf
```

Contenido en: `deploy/vps/supervisor/celerybeat.conf`

### 9.4 Recargar Supervisor
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

---

## 10. Configurar Nginx

### 10.1 Crear sitio
```bash
sudo nano /etc/nginx/sites-available/empresa1.tudominio.com
```

Contenido en: `deploy/vps/nginx/empresa.conf`

### 10.2 Habilitar sitio
```bash
sudo ln -s /etc/nginx/sites-available/empresa1.tudominio.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. Configurar SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d empresa1.tudominio.com
```

Renovación automática ya configurada por certbot.

---

## 12. Configurar DNS (en cPanel)

En tu cPanel → Zone Editor → Agregar registro A:

| Nombre | Tipo | Valor |
|--------|------|-------|
| empresa1 | A | IP_DEL_VPS |

---

## 13. Multi-Instancia (Múltiples Empresas)

Para cada nueva empresa:

### 13.1 Crear base de datos
```sql
CREATE DATABASE stratekaz_empresa2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON stratekaz_empresa2.* TO 'stratekaz_user'@'localhost';
FLUSH PRIVILEGES;
```

### 13.2 Crear archivo .env específico
```bash
cp /var/www/stratekaz/repo/backend/.env /var/www/stratekaz/repo/backend/.env.empresa2
# Editar con DB_NAME=stratekaz_empresa2, ALLOWED_HOSTS, etc.
```

### 13.3 Agregar configuración Supervisor
Duplicar archivos de supervisor con sufijo empresa2.

### 13.4 Agregar virtual host Nginx
Duplicar configuración Nginx para empresa2.tudominio.com.

### 13.5 Configurar DNS
Agregar registro A para empresa2.tudominio.com.

### 13.6 SSL
```bash
sudo certbot --nginx -d empresa2.tudominio.com
```

---

## 14. Comandos Útiles

### Ver estado de servicios
```bash
sudo supervisorctl status
sudo systemctl status nginx
sudo systemctl status mysql
sudo systemctl status redis
```

### Ver logs
```bash
# Logs de aplicación
tail -f /var/www/stratekaz/logs/gunicorn-error.log
tail -f /var/www/stratekaz/logs/celery.log

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Reiniciar servicios
```bash
sudo supervisorctl restart stratekaz-gunicorn
sudo supervisorctl restart stratekaz-celery
sudo supervisorctl restart stratekaz-celerybeat
sudo systemctl reload nginx
```

### Actualizar código
```bash
cd /var/www/stratekaz/repo
git pull origin main
source /var/www/stratekaz/venv/bin/activate
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
cd ../frontend
npm install
npm run build
cp -r dist/* /var/www/stratekaz/frontend/
sudo supervisorctl restart all
```

---

## 15. Backups

### Script de backup diario
```bash
nano /var/www/stratekaz/backup.sh
```

Contenido en: `deploy/vps/scripts/backup.sh`

### Cron job
```bash
crontab -e
# Agregar:
0 3 * * * /var/www/stratekaz/backup.sh
```

---

## 16. Monitoreo

### Verificar uso de recursos
```bash
htop                    # Uso de CPU/RAM
df -h                   # Uso de disco
free -m                 # Memoria disponible
```

### Flower (monitoreo Celery)
```bash
# Acceder a http://empresa1.tudominio.com:5555
# Requiere configuración adicional de firewall y autenticación
```

---

## 17. Troubleshooting

### Error 502 Bad Gateway
```bash
# Verificar que Gunicorn esté corriendo
sudo supervisorctl status stratekaz-gunicorn
# Ver logs
tail -50 /var/www/stratekaz/logs/gunicorn-error.log
```

### Error de permisos
```bash
sudo chown -R stratekaz:stratekaz /var/www/stratekaz
chmod -R 755 /var/www/stratekaz
```

### Redis no conecta
```bash
sudo systemctl status redis
redis-cli ping  # Debe responder PONG
```

### MySQL error de conexión
```bash
sudo systemctl status mysql
mysql -u stratekaz_user -p -e "SELECT 1"
```

---

## Checklist de Despliegue

- [ ] VPS creado y accesible por SSH
- [ ] Usuario no-root configurado
- [ ] Firewall configurado (UFW)
- [ ] Python 3.11 instalado
- [ ] Node.js 18 instalado
- [ ] MySQL 8 instalado y configurado
- [ ] Redis instalado y corriendo
- [ ] Nginx instalado
- [ ] Supervisor instalado
- [ ] Repositorio clonado
- [ ] Virtual environment creado
- [ ] Dependencias Python instaladas
- [ ] Archivo .env configurado
- [ ] Base de datos creada
- [ ] Migraciones ejecutadas
- [ ] Archivos estáticos recopilados
- [ ] Superusuario creado
- [ ] Frontend build completado
- [ ] Gunicorn configurado
- [ ] Supervisor configurado y corriendo
- [ ] Nginx configurado
- [ ] DNS configurado en cPanel
- [ ] SSL instalado (Let's Encrypt)
- [ ] Aplicación funcionando
- [ ] Backups configurados

---

## Contacto y Soporte

Para problemas de despliegue, revisar logs en `/var/www/stratekaz/logs/`
