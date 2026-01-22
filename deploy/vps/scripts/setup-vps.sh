#!/bin/bash
# Script de configuración inicial del VPS para StrateKaz
# Ejecutar como root o con sudo
#
# Uso: sudo bash setup-vps.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Setup VPS para StrateKaz"
echo "==========================================${NC}"

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Este script debe ejecutarse como root (sudo)${NC}"
    exit 1
fi

# Actualizar sistema
echo -e "${YELLOW}[1/10] Actualizando sistema...${NC}"
apt update && apt upgrade -y

# Instalar dependencias básicas
echo -e "${YELLOW}[2/10] Instalando dependencias básicas...${NC}"
apt install -y \
    software-properties-common \
    curl \
    wget \
    git \
    htop \
    unzip \
    ufw

# Python 3.11
echo -e "${YELLOW}[3/10] Instalando Python 3.11...${NC}"
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev

# Node.js 18
echo -e "${YELLOW}[4/10] Instalando Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# MySQL 8
echo -e "${YELLOW}[5/10] Instalando MySQL 8...${NC}"
apt install -y mysql-server mysql-client libmysqlclient-dev
systemctl enable mysql
systemctl start mysql

# Redis
echo -e "${YELLOW}[6/10] Instalando Redis...${NC}"
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Nginx
echo -e "${YELLOW}[7/10] Instalando Nginx...${NC}"
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# Supervisor
echo -e "${YELLOW}[8/10] Instalando Supervisor...${NC}"
apt install -y supervisor
systemctl enable supervisor
systemctl start supervisor

# Certbot (Let's Encrypt)
echo -e "${YELLOW}[9/10] Instalando Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

# Dependencias para WeasyPrint y Pillow
echo -e "${YELLOW}[10/10] Instalando dependencias adicionales...${NC}"
apt install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    libjpeg-dev \
    zlib1g-dev

# Configurar firewall
echo -e "${YELLOW}Configurando firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Crear usuario stratekaz
echo -e "${YELLOW}Creando usuario stratekaz...${NC}"
if id "stratekaz" &>/dev/null; then
    echo "Usuario stratekaz ya existe"
else
    adduser --disabled-password --gecos "" stratekaz
    usermod -aG sudo stratekaz
fi

# Crear estructura de directorios
echo -e "${YELLOW}Creando estructura de directorios...${NC}"
mkdir -p /var/www/stratekaz/{backend,frontend,logs,media,staticfiles,backups}
chown -R stratekaz:stratekaz /var/www/stratekaz
chmod -R 755 /var/www/stratekaz

# Crear virtual environment
echo -e "${YELLOW}Creando virtual environment...${NC}"
sudo -u stratekaz python3.11 -m venv /var/www/stratekaz/venv

# Mostrar versiones instaladas
echo ""
echo -e "${GREEN}=========================================="
echo "Instalación completada!"
echo "==========================================${NC}"
echo ""
echo "Versiones instaladas:"
echo "  Python: $(python3.11 --version)"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  MySQL: $(mysql --version | cut -d' ' -f6)"
echo "  Redis: $(redis-server --version | cut -d' ' -f3)"
echo "  Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Configurar MySQL: sudo mysql_secure_installation"
echo "2. Crear base de datos y usuario MySQL"
echo "3. Clonar repositorio en /var/www/stratekaz/repo"
echo "4. Configurar archivo .env"
echo "5. Instalar dependencias y migrar"
echo "6. Configurar Nginx y SSL"
echo ""
echo -e "${BLUE}Ver guía completa: deploy/vps/DEPLOY-VPS.md${NC}"
