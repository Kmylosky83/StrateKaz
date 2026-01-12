#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# BUILD DE PRODUCCIÓN PARA cPanel (Linux/Mac)
# Sistema de Gestión Integral - StrateKaz
# ═══════════════════════════════════════════════════════════════════════════
#
# Este script genera el build de producción del frontend React
# optimizado para despliegue en cPanel.
#
# USO:
#   chmod +x build-cpanel.sh
#   ./build-cpanel.sh
#
# REQUISITOS:
#   - Node.js 18+ instalado
#   - npm instalado
#   - Dependencias instaladas (npm install)
#
# SALIDA:
#   - Directorio dist/ con archivos optimizados
#   - Archivo frontend-cpanel.tar.gz listo para subir a cPanel
#
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Salir si hay errores

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}BUILD DE PRODUCCIÓN PARA cPanel${NC}"
echo -e "${CYAN}Sistema de Gestión Integral - StrateKaz${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Error: No se encuentra package.json${NC}"
    echo "  Asegúrate de ejecutar este script desde el directorio frontend/"
    exit 1
fi

# Verificar Node.js
echo -e "${YELLOW}▶ Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js no está instalado${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js instalado: $NODE_VERSION${NC}"

# Verificar npm
echo -e "${YELLOW}▶ Verificando npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm no está instalado${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm instalado: $NPM_VERSION${NC}"

# Limpiar build anterior
echo -e "${YELLOW}▶ Limpiando builds anteriores...${NC}"
rm -rf dist/
rm -f frontend-cpanel.tar.gz
echo -e "${GREEN}✓ Limpieza completada${NC}"

# Verificar dependencias
echo -e "${YELLOW}▶ Verificando dependencias...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${GRAY}  → Instalando dependencias...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓ Dependencias ya instaladas${NC}"
fi

# Crear .env.production si no existe
echo -e "${YELLOW}▶ Configurando variables de entorno...${NC}"
if [ ! -f ".env.production" ]; then
    cat > .env.production << 'EOF'
# Configuración de producción para cPanel
VITE_API_URL=https://tudominio.com/api
VITE_API_TIMEOUT=30000
VITE_ENABLE_MOCK=false
EOF
    echo -e "${GREEN}✓ Archivo .env.production creado (RECUERDA EDITAR LA URL)${NC}"
else
    echo -e "${GREEN}✓ Usando .env.production existente${NC}"
fi

# Ejecutar build
echo ""
echo -e "${YELLOW}▶ Ejecutando build de producción...${NC}"
echo -e "${GRAY}  → Esto puede tardar varios minutos...${NC}"
echo ""

npm run build

echo ""
echo -e "${GREEN}✓ Build completado exitosamente${NC}"

# Verificar que dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Error: No se generó el directorio dist/${NC}"
    exit 1
fi

# Calcular tamaño
DIST_SIZE=$(du -sh dist | cut -f1)
echo ""
echo -e "${CYAN}📊 Estadísticas del build:${NC}"
echo -e "${GRAY}  • Tamaño total: $DIST_SIZE${NC}"

# Listar archivos JS principales
echo -e "${GRAY}  • Archivos principales:${NC}"
find dist/assets -name "*.js" -type f -exec ls -lh {} \; | sort -k5 -hr | head -5 | while read line; do
    filename=$(echo $line | awk '{print $9}' | xargs basename)
    size=$(echo $line | awk '{print $5}')
    echo -e "${GRAY}    - $filename: $size${NC}"
done

# Verificar archivos críticos
echo -e "${YELLOW}▶ Verificando archivos críticos...${NC}"
CRITICAL_FILES=("index.html" "assets")
ALL_EXIST=true

for file in "${CRITICAL_FILES[@]}"; do
    if [ -e "dist/$file" ]; then
        echo -e "${GREEN}  ✓ $file${NC}"
    else
        echo -e "${RED}  ✗ $file (NO ENCONTRADO)${NC}"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = false ]; then
    echo -e "${RED}✗ Faltan archivos críticos en el build${NC}"
    exit 1
fi

# Crear .htaccess
echo -e "${YELLOW}▶ Generando .htaccess para React Router...${NC}"
cat > dist/.htaccess << 'EOF'
# ═══════════════════════════════════════════════════════════════════════════
# .htaccess para React SPA en cPanel
# Sistema de Gestión Integral - StrateKaz
# ═══════════════════════════════════════════════════════════════════════════

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirigir HTTP a HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # No reescribir archivos o directorios que existen
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l

  # Redirigir todo a index.html (React Router)
  RewriteRule . /index.html [L]
</IfModule>

# COMPRESIÓN GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# CACHE DE NAVEGADOR
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# SEGURIDAD
<FilesMatch "^\.">
  Order allow,deny
  Deny from all
</FilesMatch>

<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
</IfModule>
EOF

echo -e "${GREEN}✓ .htaccess creado en dist/${NC}"

# Crear archivo tar.gz
echo -e "${YELLOW}▶ Creando archivo tar.gz para cPanel...${NC}"
tar -czf frontend-cpanel.tar.gz -C dist .
TAR_SIZE=$(du -sh frontend-cpanel.tar.gz | cut -f1)
echo -e "${GREEN}✓ Archivo creado: frontend-cpanel.tar.gz ($TAR_SIZE)${NC}"

# Resumen final
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ BUILD COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📦 Archivos generados:${NC}"
echo -e "${GRAY}  • dist/ - Archivos del build${NC}"
echo -e "${GRAY}  • frontend-cpanel.tar.gz - Archivo comprimido para cPanel${NC}"
echo ""
echo -e "${CYAN}📋 PRÓXIMOS PASOS EN cPanel:${NC}"
echo ""
echo -e "${YELLOW}1. SUBIR ARCHIVOS:${NC}"
echo -e "${GRAY}   a) Ve a File Manager en cPanel${NC}"
echo -e "${GRAY}   b) Navega a public_html/ (o el directorio de tu dominio)${NC}"
echo -e "${GRAY}   c) Sube frontend-cpanel.tar.gz${NC}"
echo -e "${GRAY}   d) Extrae el archivo: Extract > frontend-cpanel.tar.gz${NC}"
echo ""
echo -e "${YELLOW}2. CONFIGURAR .env.production:${NC}"
echo -e "${RED}   ⚠ IMPORTANTE: Edita .env.production y cambia:${NC}"
echo -e "${GRAY}   VITE_API_URL=https://tudominio.com/api${NC}"
echo ""
echo -e "${YELLOW}3. VERIFICAR:${NC}"
echo -e "${GRAY}   a) Abre tu dominio en el navegador${NC}"
echo -e "${GRAY}   b) Verifica que cargue correctamente${NC}"
echo -e "${GRAY}   c) Prueba la navegación entre rutas${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""
