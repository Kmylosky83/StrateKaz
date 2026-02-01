#!/bin/bash
# Script para crear nueva instancia/empresa en StrateKaz
# /var/www/stratekaz/new-instance.sh
#
# Uso: sudo ./new-instance.sh empresa1 empresa1.tudominio.com
#
# Parámetros:
#   $1 - Nombre de la empresa (sin espacios, minúsculas)
#   $2 - Dominio completo (ej: empresa1.tudominio.com)

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar parámetros
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Uso: $0 <nombre_empresa> <dominio>${NC}"
    echo "Ejemplo: $0 empresa1 empresa1.tudominio.com"
    exit 1
fi

EMPRESA=$1
DOMINIO=$2
DB_NAME="stratekaz_$EMPRESA"
DB_USER="stratekaz_user"
MYSQL_ROOT_PASSWORD=""  # Se solicitará

echo -e "${BLUE}=========================================="
echo "Nueva Instancia: $EMPRESA"
echo "Dominio: $DOMINIO"
echo "==========================================${NC}"

# Solicitar password de MySQL root
read -sp "Password de MySQL root: " MYSQL_ROOT_PASSWORD
echo ""

# 1. Crear base de datos
echo -e "${YELLOW}[1/5] Creando base de datos $DB_NAME...${NC}"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
echo -e "${GREEN}OK: Base de datos creada${NC}"

# 2. Crear archivo .env para esta instancia
echo -e "${YELLOW}[2/5] Creando archivo .env.$EMPRESA...${NC}"
ENV_FILE="/var/www/stratekaz/repo/backend/.env.$EMPRESA"

# Generar SECRET_KEY
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')

cat > "$ENV_FILE" <<EOF
# Configuración para $EMPRESA
# Generado: $(date)

DEBUG=False
SECRET_KEY=$SECRET_KEY

# Base de datos
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=CAMBIAR_PASSWORD
DB_HOST=localhost
DB_PORT=3306

# Hosts
ALLOWED_HOSTS=$DOMINIO,www.$DOMINIO

# CORS y CSRF
CORS_ALLOWED_ORIGINS=https://$DOMINIO
CSRF_TRUSTED_ORIGINS=https://$DOMINIO

# Redis (compartido)
REDIS_URL=redis://localhost:6379/2
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@tudominio.com
EMAIL_HOST_PASSWORD=CAMBIAR_PASSWORD
DEFAULT_FROM_EMAIL=StrateKaz <noreply@tudominio.com>
EOF

chown stratekaz:stratekaz "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo -e "${GREEN}OK: $ENV_FILE creado${NC}"
echo -e "${YELLOW}IMPORTANTE: Editar $ENV_FILE y configurar passwords${NC}"

# 3. Ejecutar migraciones
echo -e "${YELLOW}[3/5] Ejecutando migraciones...${NC}"
cd /var/www/stratekaz/repo/backend
source /var/www/stratekaz/venv/bin/activate

# Usar el archivo .env de la instancia
export $(grep -v '^#' "$ENV_FILE" | xargs)
python manage.py migrate --noinput
echo -e "${GREEN}OK: Migraciones completadas${NC}"

# 4. Configurar Nginx
echo -e "${YELLOW}[4/5] Configurando Nginx...${NC}"
NGINX_CONF="/etc/nginx/sites-available/$DOMINIO"

cat > "$NGINX_CONF" <<EOF
upstream stratekaz_$EMPRESA {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMINIO;

    access_log /var/log/nginx/$DOMINIO.access.log;
    error_log /var/log/nginx/$DOMINIO.error.log;

    client_max_body_size 50M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    root /var/www/stratekaz/frontend;
    index index.html;

    location /api/ {
        proxy_pass http://stratekaz_$EMPRESA;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /admin/ {
        proxy_pass http://stratekaz_$EMPRESA;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /static/ {
        alias /var/www/stratekaz/staticfiles/;
        expires 30d;
    }

    location /media/ {
        alias /var/www/stratekaz/media/;
        expires 7d;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~ /\. {
        deny all;
    }
}
EOF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo -e "${GREEN}OK: Nginx configurado${NC}"

# 5. SSL con Let's Encrypt
echo -e "${YELLOW}[5/5] Configurando SSL...${NC}"
echo -e "${YELLOW}Ejecuta manualmente: sudo certbot --nginx -d $DOMINIO${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "Instancia $EMPRESA creada!"
echo "==========================================${NC}"
echo ""
echo "Resumen:"
echo "  Base de datos: $DB_NAME"
echo "  Archivo .env: $ENV_FILE"
echo "  Nginx: $NGINX_CONF"
echo ""
echo -e "${YELLOW}Pasos pendientes:${NC}"
echo "1. Editar $ENV_FILE y configurar passwords"
echo "2. Configurar DNS: $DOMINIO -> IP del VPS"
echo "3. Ejecutar: sudo certbot --nginx -d $DOMINIO"
echo "4. Crear superusuario: python manage.py createsuperuser"
echo ""
