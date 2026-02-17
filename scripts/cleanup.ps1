# Script de limpieza de archivos temporales y cache
# Uso: .\scripts\cleanup.ps1

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Limpieza de Archivos Temporales - StrateKaz" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$TotalRemoved = 0

# 1. Limpiar __pycache__ de Python
Write-Host ""
Write-Host "[1/7] Limpiando archivos __pycache__ de Python..." -ForegroundColor Yellow
$PycacheDirs = Get-ChildItem -Path "backend" -Directory -Recurse -Filter "__pycache__" -ErrorAction SilentlyContinue
if ($PycacheDirs) {
    $PycacheDirs | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Eliminados $($PycacheDirs.Count) directorios __pycache__" -ForegroundColor Green
    $TotalRemoved += $PycacheDirs.Count
} else {
    Write-Host "   ✓ No hay archivos __pycache__" -ForegroundColor Green
}

# 2. Limpiar archivos .pyc y .pyo
Write-Host ""
Write-Host "[2/7] Limpiando archivos .pyc y .pyo..." -ForegroundColor Yellow
$PycFiles = Get-ChildItem -Path "backend" -Recurse -Include "*.pyc","*.pyo" -File -ErrorAction SilentlyContinue
if ($PycFiles) {
    $PycFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Eliminados $($PycFiles.Count) archivos .pyc/.pyo" -ForegroundColor Green
    $TotalRemoved += $PycFiles.Count
} else {
    Write-Host "   ✓ No hay archivos .pyc/.pyo" -ForegroundColor Green
}

# 3. Limpiar node_modules/.cache
Write-Host ""
Write-Host "[3/7] Limpiando cache de node_modules..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules\.cache") {
    Remove-Item -Path "frontend\node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Eliminado node_modules\.cache" -ForegroundColor Green
    $TotalRemoved++
} else {
    Write-Host "   ✓ No hay cache de node_modules" -ForegroundColor Green
}

# 4. Limpiar cache de Vite
Write-Host ""
Write-Host "[4/7] Limpiando cache de Vite..." -ForegroundColor Yellow
if (Test-Path "frontend\.vite") {
    Remove-Item -Path "frontend\.vite" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Eliminado .vite cache" -ForegroundColor Green
    $TotalRemoved++
} else {
    Write-Host "   ✓ No hay cache de Vite" -ForegroundColor Green
}

# 5. Limpiar dist de frontend
Write-Host ""
Write-Host "[5/7] Limpiando carpeta dist..." -ForegroundColor Yellow
if (Test-Path "frontend\dist") {
    Remove-Item -Path "frontend\dist" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Eliminado dist\" -ForegroundColor Green
    $TotalRemoved++
} else {
    Write-Host "   ✓ No hay carpeta dist" -ForegroundColor Green
}

# 6. Limpiar archivos de editor temporales
Write-Host ""
Write-Host "[6/7] Limpiando archivos temporales de editores..." -ForegroundColor Yellow
$TempFiles = Get-ChildItem -Path "." -Recurse -Include "*~","*.swp","*.swo",".DS_Store","Thumbs.db" -File -ErrorAction SilentlyContinue
if ($TempFiles) {
    $TempFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Eliminados $($TempFiles.Count) archivos temporales" -ForegroundColor Green
    $TotalRemoved += $TempFiles.Count
} else {
    Write-Host "   ✓ No hay archivos temporales de editores" -ForegroundColor Green
}

# 7. Limpiar logs antiguos
Write-Host ""
Write-Host "[7/7] Limpiando logs antiguos..." -ForegroundColor Yellow
$OldLogs = Get-ChildItem -Path "." -Recurse -Filter "*.log" -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
if ($OldLogs) {
    Write-Host "   ⚠ Encontrados $($OldLogs.Count) archivos .log mayores a 7 días" -ForegroundColor Yellow
    Write-Host "   → Revisar manualmente antes de eliminar" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ No hay logs antiguos" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Limpieza completada" -ForegroundColor Cyan
Write-Host "Total de elementos eliminados: $TotalRemoved" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Listar archivos legacy (informativo)
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Archivos Legacy Detectados (NO ELIMINADOS)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Documentación legacy:" -ForegroundColor Yellow
Get-ChildItem -Path "docs\archive" -Recurse -Filter "*.md" -File -ErrorAction SilentlyContinue | Select-Object -First 10 | ForEach-Object { Write-Host "   - $($_.FullName.Replace($ProjectRoot + '\', ''))" }

Write-Host ""
Write-Host "Deployment legacy:" -ForegroundColor Yellow
Get-ChildItem -Path "deploy\legacy" -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 10 | ForEach-Object { Write-Host "   - $($_.FullName.Replace($ProjectRoot + '\', ''))" }

Write-Host ""
Write-Host "Componentes legacy frontend:" -ForegroundColor Yellow
Get-ChildItem -Path "frontend\src" -Recurse -Filter "*LEGACY*" -File -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "   - $($_.FullName.Replace($ProjectRoot + '\', ''))" }

Write-Host ""
Write-Host "NOTA: Los archivos legacy se mantienen en docs\archive\ y deploy\legacy\" -ForegroundColor Cyan
Write-Host "      para referencia histórica. Revisar antes de eliminar." -ForegroundColor Cyan
Write-Host ""
