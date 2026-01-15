# ═══════════════════════════════════════════════════════════════════════════
# BUILD BACKEND PARA PRODUCCIÓN (cPanel)
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$releaseName = "backend-cpanel.tar.gz"

Write-Host "🚀 Iniciando preparación del backend..." -ForegroundColor Cyan

# 1. Generar requirements de producción (filtrando desarrollo)
Write-Host "📝 Generando requirements-prod.txt..." -ForegroundColor Yellow
if (Test-Path "requirements.txt") {
    Get-Content "requirements.txt" | Where-Object { 
        $_ -notmatch "django-debug-toolbar" -and 
        $_ -notmatch "pytest" -and 
        $_ -notmatch "factory-boy" -and 
        $_ -notmatch "black" -and 
        $_ -notmatch "ruff" 
    } | Set-Content "requirements-prod.txt"
}

# 2. Limpiar archivos temporales (recursivo)
Write-Host "🧹 Limpiando archivos temporales..." -ForegroundColor Yellow
Get-ChildItem -Path . -Include "__pycache__", "*.pyc", "*.pyo", ".pytest_cache", ".coverage", "htmlcov" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 3. Crear archivo TAR excluyendo basura
Write-Host "📦 Comprimiendo archivos en $releaseName..." -ForegroundColor Yellow

try {
    # Usamos tar nativo de Windows (disponible en Win10/11)
    # --exclude-vcs ignora .git, .gitignore, etc.
    tar -czf $releaseName --exclude-vcs --exclude "venv" --exclude ".venv" --exclude ".vscode" --exclude ".idea" --exclude "__pycache__" --exclude "*.pyc" --exclude "db.sqlite3" --exclude "logs/*.log" --exclude $releaseName .
    
    if (Test-Path $releaseName) {
        $size = (Get-Item $releaseName).Length / 1MB
        Write-Host "✅ Archivo generado: $releaseName ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
        Write-Host "👉 Listo para subir a cPanel." -ForegroundColor Cyan
    }
    else {
        Write-Error "Falló la creación del archivo."
    }
}
catch {
    Write-Error "Error ejecutando tar. Asegúrate de tener Windows 10+ o Git Bash instalado."
}