# ═══════════════════════════════════════════════════════════════════════════
# BUILD DE PRODUCCIÓN PARA cPanel
# Sistema de Gestión Integral - StrateKaz
# ═══════════════════════════════════════════════════════════════════════════
#
# Este script genera el build de producción del frontend React
# optimizado para despliegue en cPanel.
#
# USO:
#   .\build-cpanel.ps1
#
# REQUISITOS:
#   - Node.js 18+ instalado
#   - npm instalado
#   - Dependencias instaladas (npm install)
#
# SALIDA:
#   - Directorio dist/ con archivos optimizados
#   - Archivo frontend-cpanel.zip listo para subir a cPanel
#
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "BUILD DE PRODUCCIÓN PARA cPanel" -ForegroundColor Cyan
Write-Host "Sistema de Gestión Integral - StrateKaz" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Función para mostrar mensajes con color
function Write-Step {
    param($Message)
    Write-Host "▶ $Message" -ForegroundColor Yellow
}

function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Error "Error: No se encuentra package.json. Asegúrate de ejecutar este script desde el directorio frontend/"
    exit 1
}

# Verificar que Node.js está instalado
Write-Step "Verificando Node.js..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js instalado: $nodeVersion"
}
catch {
    Write-Error "Node.js no está instalado. Descárgalo desde https://nodejs.org/"
    exit 1
}

# Verificar que npm está instalado
Write-Step "Verificando npm..."
try {
    $npmVersion = npm --version
    Write-Success "npm instalado: $npmVersion"
}
catch {
    Write-Error "npm no está instalado"
    exit 1
}

# Limpiar build anterior
Write-Step "Limpiando builds anteriores..."
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Success "Directorio dist/ eliminado"
}
if (Test-Path "frontend-cpanel.zip") {
    Remove-Item -Path "frontend-cpanel.zip" -Force
    Write-Success "Archivo frontend-cpanel.zip eliminado"
}

# Verificar dependencias
Write-Step "Verificando dependencias..."
if (-not (Test-Path "node_modules")) {
    Write-Host "  → Instalando dependencias (esto puede tardar varios minutos)..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al instalar dependencias"
        exit 1
    }
    Write-Success "Dependencias instaladas"
}
else {
    Write-Success "Dependencias ya instaladas"
}

# Crear archivo .env para producción si no existe
Write-Step "Configurando variables de entorno de producción..."
$envContent = @"
# Configuración de producción para cPanel
VITE_API_URL=https://tudominio.com/api
VITE_API_TIMEOUT=30000
VITE_ENABLE_MOCK=false
"@

if (-not (Test-Path ".env.production")) {
    $envContent | Out-File -FilePath ".env.production" -Encoding UTF8
    Write-Success "Archivo .env.production creado (RECUERDA EDITAR LA URL)"
}
else {
    Write-Success "Usando .env.production existente"
}

# Ejecutar build
Write-Host ""
Write-Step "Ejecutando build de producción..."
Write-Host "  → Esto puede tardar varios minutos..." -ForegroundColor Gray
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error durante el build"
    exit 1
}

Write-Host ""
Write-Success "Build completado exitosamente"

# Verificar que dist existe
if (-not (Test-Path "dist")) {
    Write-Error "Error: No se generó el directorio dist/"
    exit 1
}

# Calcular tamaño del build
$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "📊 Estadísticas del build:" -ForegroundColor Cyan
Write-Host "  • Tamaño total: $([math]::Round($distSize, 2)) MB" -ForegroundColor Gray

# Listar archivos principales
Write-Host "  • Archivos principales:" -ForegroundColor Gray
Get-ChildItem -Path "dist/assets" -Filter "*.js" | Sort-Object Length -Descending | Select-Object -First 5 | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 2)
    Write-Host "    - $($_.Name): $sizeKB KB" -ForegroundColor Gray
}

# Verificar archivos críticos
Write-Step "Verificando archivos críticos..."
$criticalFiles = @("index.html", "assets")
$allExist = $true

foreach ($file in $criticalFiles) {
    $path = Join-Path -Path "dist" -ChildPath $file
    if (Test-Path $path) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ $file (NO ENCONTRADO)" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Error "Faltan archivos críticos en el build"
    exit 1
}

# Crear .htaccess para React Router
Write-Step "Generando .htaccess para React Router..."
$htaccessContent = @"
# ═══════════════════════════════════════════════════════════════════════════
# .htaccess para React SPA en cPanel
# Sistema de Gestión Integral - StrateKaz
# ═══════════════════════════════════════════════════════════════════════════

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirigir HTTP a HTTPS (IMPORTANTE EN PRODUCCIÓN)
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # No reescribir archivos o directorios que existen
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l

  # Redirigir todo a index.html (React Router)
  RewriteRule . /index.html [L]
</IfModule>

# ═══════════════════════════════════════════════════════════════════════════
# COMPRESIÓN GZIP
# ═══════════════════════════════════════════════════════════════════════════
<IfModule mod_deflate.c>
  # Comprimir HTML, CSS, JavaScript, Text, XML y fuentes
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/vnd.ms-fontobject
  AddOutputFilterByType DEFLATE application/x-font
  AddOutputFilterByType DEFLATE application/x-font-opentype
  AddOutputFilterByType DEFLATE application/x-font-otf
  AddOutputFilterByType DEFLATE application/x-font-truetype
  AddOutputFilterByType DEFLATE application/x-font-ttf
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE font/opentype
  AddOutputFilterByType DEFLATE font/otf
  AddOutputFilterByType DEFLATE font/ttf
  AddOutputFilterByType DEFLATE image/svg+xml
  AddOutputFilterByType DEFLATE image/x-icon
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/xml
</IfModule>

# ═══════════════════════════════════════════════════════════════════════════
# CACHE DE NAVEGADOR
# ═══════════════════════════════════════════════════════════════════════════
<IfModule mod_expires.c>
  ExpiresActive On

  # Imágenes
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"

  # CSS y JavaScript con hash en nombre (vite genera estos)
  <FilesMatch "\.(css|js)$">
    ExpiresDefault "access plus 1 year"
  </FilesMatch>

  # Fuentes
  ExpiresByType font/ttf "access plus 1 year"
  ExpiresByType font/otf "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType application/font-woff "access plus 1 year"

  # HTML (sin cache para index.html)
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# ═══════════════════════════════════════════════════════════════════════════
# SEGURIDAD
# ═══════════════════════════════════════════════════════════════════════════

# Prevenir acceso a archivos ocultos
<FilesMatch "^\.">
  Order allow,deny
  Deny from all
</FilesMatch>

# Headers de seguridad
<IfModule mod_headers.c>
  # Prevenir clickjacking
  Header always set X-Frame-Options "SAMEORIGIN"

  # Prevenir MIME sniffing
  Header always set X-Content-Type-Options "nosniff"

  # XSS Protection
  Header always set X-XSS-Protection "1; mode=block"

  # Referrer Policy
  Header always set Referrer-Policy "strict-origin-when-cross-origin"

  # NOTA: Content-Security-Policy se maneja desde el backend Django
</IfModule>

# ═══════════════════════════════════════════════════════════════════════════
# MIME TYPES
# ═══════════════════════════════════════════════════════════════════════════
<IfModule mod_mime.c>
  # JavaScript
  AddType application/javascript js mjs

  # JSON
  AddType application/json json

  # Web fonts
  AddType font/woff woff
  AddType font/woff2 woff2
  AddType application/vnd.ms-fontobject eot
  AddType font/ttf ttf
  AddType font/otf otf

  # Imágenes
  AddType image/svg+xml svg svgz
  AddType image/webp webp
</IfModule>

# ═══════════════════════════════════════════════════════════════════════════
"@

$htaccessPath = Join-Path -Path "dist" -ChildPath ".htaccess"
$htaccessContent | Out-File -FilePath $htaccessPath -Encoding UTF8
Write-Success ".htaccess creado en dist/"

# Crear archivo ZIP para facilitar la subida
Write-Step "Creando archivo ZIP para cPanel..."
try {
    Compress-Archive -Path "dist\*" -DestinationPath "frontend-cpanel.zip" -Force
    $zipSize = (Get-Item "frontend-cpanel.zip").Length / 1MB
    Write-Success "Archivo ZIP creado: frontend-cpanel.zip ($([math]::Round($zipSize, 2)) MB)"
}
catch {
    Write-Error "Error al crear ZIP: $_"
    exit 1
}

# Crear archivo TAR.GZ (Recomendado para cPanel)
try {
    $tarName = "frontend-cpanel.tar.gz"
    tar -czf $tarName -C dist .
    if (Test-Path $tarName) {
        $tarSize = (Get-Item $tarName).Length / 1MB
        Write-Success "Archivo TAR creado: $tarName ($([math]::Round($tarSize, 2)) MB)"
    }
}
catch { Write-Host "  ⚠ No se pudo crear el archivo TAR (tar no disponible)" -ForegroundColor Gray }

# Resumen final
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ BUILD COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Archivos generados:" -ForegroundColor Cyan
Write-Host "  • dist/ - Archivos del build" -ForegroundColor Gray
Write-Host "  • frontend-cpanel.zip - Archivo comprimido para subir a cPanel" -ForegroundColor Gray
if (Test-Path "frontend-cpanel.tar.gz") { Write-Host "  • frontend-cpanel.tar.gz - Archivo TAR para subir a cPanel" -ForegroundColor Gray }
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS EN cPanel:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. SUBIR ARCHIVOS:" -ForegroundColor Yellow
Write-Host "   a) Ve a File Manager en cPanel" -ForegroundColor Gray
Write-Host "   b) Navega a public_html/ (o el directorio de tu dominio)" -ForegroundColor Gray
Write-Host "   c) Sube frontend-cpanel.tar.gz (o .zip)" -ForegroundColor Gray
Write-Host "   d) Extrae el ZIP en el mismo directorio" -ForegroundColor Gray
Write-Host "   e) Mueve el contenido de dist/ al directorio raíz" -ForegroundColor Gray
Write-Host ""
Write-Host "2. CONFIGURAR .env.production:" -ForegroundColor Yellow
Write-Host "   ⚠ IMPORTANTE: Edita .env.production y cambia:" -ForegroundColor Red
Write-Host "   VITE_API_URL=https://tudominio.com/api" -ForegroundColor Gray
Write-Host "   por la URL REAL de tu API backend" -ForegroundColor Gray
Write-Host ""
Write-Host "3. VERIFICAR:" -ForegroundColor Yellow
Write-Host "   a) Abre tu dominio en el navegador" -ForegroundColor Gray
Write-Host "   b) Verifica que cargue correctamente" -ForegroundColor Gray
Write-Host "   c) Prueba la navegación entre rutas" -ForegroundColor Gray
Write-Host "   d) Verifica la consola del navegador (F12) para errores" -ForegroundColor Gray
Write-Host ""
Write-Host "4. SSL/HTTPS:" -ForegroundColor Yellow
Write-Host "   a) En cPanel > SSL/TLS Status" -ForegroundColor Gray
Write-Host "   b) Activa AutoSSL para tu dominio" -ForegroundColor Gray
Write-Host "   c) Espera a que se genere el certificado" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
