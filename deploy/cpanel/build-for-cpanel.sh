#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Script de Build para Despliegue en cPanel
# Sistema de Gestión - Grasas y Huesos del Norte
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Salir si hay errores

echo "═══════════════════════════════════════════════════════════════════════════════"
echo " Build para cPanel - Grasas y Huesos del Norte"
echo "═══════════════════════════════════════════════════════════════════════════════"

# Directorio raíz del proyecto
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy/cpanel"
DIST_DIR="$DEPLOY_DIR/dist"

echo ""
echo "📁 Directorio del proyecto: $PROJECT_ROOT"
echo ""

# Limpiar directorio de distribución anterior
echo "🧹 Limpiando directorio de distribución anterior..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/backend"
mkdir -p "$DIST_DIR/frontend"

# ═══════════════════════════════════════════════════════════════════════════════
# BUILD DEL FRONTEND
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo " 🎨 Construyendo Frontend (React + Vite)"
echo "═══════════════════════════════════════════════════════════════════════════════"

cd "$PROJECT_ROOT/frontend"

# Copiar archivo de entorno para staging
echo "📋 Copiando configuración de staging..."
cp "$DEPLOY_DIR/.env.frontend.staging" .env.production

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Ejecutar build
echo "🔨 Ejecutando npm run build..."
npm run build

# Copiar archivos construidos
echo "📂 Copiando archivos del frontend..."
cp -r dist/* "$DIST_DIR/frontend/"

echo "✅ Frontend construido exitosamente"

# ═══════════════════════════════════════════════════════════════════════════════
# PREPARAR BACKEND
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo " 🐍 Preparando Backend (Django)"
echo "═══════════════════════════════════════════════════════════════════════════════"

cd "$PROJECT_ROOT/backend"

# Copiar archivos del backend (excluyendo innecesarios)
echo "📂 Copiando archivos del backend..."
rsync -av --progress \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.env' \
    --exclude 'venv' \
    --exclude 'env' \
    --exclude '*.sqlite3' \
    --exclude 'staticfiles' \
    --exclude 'media/*' \
    --exclude '.git' \
    . "$DIST_DIR/backend/"

# Copiar passenger_wsgi.py al directorio raíz de dist
cp "$DEPLOY_DIR/passenger_wsgi.py" "$DIST_DIR/"

# Copiar archivo de entorno de ejemplo
cp "$DEPLOY_DIR/.env.staging" "$DIST_DIR/backend/.env.example"

echo "✅ Backend preparado exitosamente"

# ═══════════════════════════════════════════════════════════════════════════════
# CREAR ARCHIVO DE REQUIREMENTS
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📋 Verificando requirements.txt..."
if [ -f "$PROJECT_ROOT/backend/requirements.txt" ]; then
    cp "$PROJECT_ROOT/backend/requirements.txt" "$DIST_DIR/backend/"
else
    echo "⚠️  No se encontró requirements.txt, generando desde pip freeze..."
    # Este comando debe ejecutarse en un entorno con las dependencias instaladas
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CREAR ARCHIVO .htaccess PARA FRONTEND
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📝 Creando .htaccess para SPA routing..."
cat > "$DIST_DIR/frontend/.htaccess" << 'EOF'
# Configuración para React SPA en cPanel con LiteSpeed
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # No reescribir archivos estáticos existentes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # Redirigir todas las rutas a index.html (para React Router)
    RewriteRule ^ index.html [L]
</IfModule>

# Configuración de caché para archivos estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Compresión gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>
EOF

echo "✅ .htaccess creado"

# ═══════════════════════════════════════════════════════════════════════════════
# RESUMEN
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo " ✅ BUILD COMPLETADO"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📁 Archivos listos en: $DIST_DIR"
echo ""
echo "Estructura:"
echo "  dist/"
echo "  ├── passenger_wsgi.py    → Copiar a raíz de Python App"
echo "  ├── backend/             → Copiar a directorio de Python App"
echo "  │   ├── .env.example     → Renombrar a .env y configurar"
echo "  │   └── ...              → Código Django"
echo "  └── frontend/            → Copiar a public_html del subdominio"
echo "      ├── .htaccess        → Para routing de React"
echo "      └── ...              → Archivos estáticos"
echo ""
echo "📖 Sigue la guía DEPLOY-CPANEL.md para instrucciones detalladas"
echo ""
