# ═══════════════════════════════════════════════════════════════════════════
# EMPAQUETAR FRONTEND (Solo comprimir dist/)
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$distPath = "dist"
$tarName = "frontend-cpanel.tar.gz"

if (-not (Test-Path $distPath)) {
    Write-Error "❌ Error: No se encuentra la carpeta 'dist'. Ejecuta primero el build."
}

Write-Host "📦 Creando $tarName desde $distPath..." -ForegroundColor Cyan

try {
    # -C cambia al directorio dist antes de comprimir para que no incluya la carpeta 'dist' en la ruta
    tar -czf $tarName -C $distPath .
    
    $size = (Get-Item $tarName).Length / 1MB
    Write-Host "✅ Archivo generado exitosamente: $tarName ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
}
catch {
    Write-Error "❌ Error al ejecutar tar. Verifica que tienes Windows 10+ o Git instalado."
}