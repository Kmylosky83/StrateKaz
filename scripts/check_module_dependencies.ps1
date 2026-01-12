# ==============================================================================
# Script de Verificación de Dependencias entre Módulos
# ERP StrateKaz - Análisis de Impacto de Movimiento de Módulos
#
# Uso: .\scripts\check_module_dependencies.ps1
# ==============================================================================

$ErrorActionPreference = "SilentlyContinue"

# Colores
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Cyan"

$BACKEND_DIR = "backend\apps"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host "  Análisis de Dependencias - Movimiento de Módulos" -ForegroundColor $BLUE
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host ""

# ==============================================================================
# 1. DEPENDENCIAS DE sistema_documental
# ==============================================================================
Write-Host "[1] Verificando dependencias de sistema_documental..." -ForegroundColor $YELLOW
Write-Host ""

Write-Host "Imports DE sistema_documental en otros módulos:" -ForegroundColor $GREEN
$deps = Select-String -Path "$BACKEND_DIR\*\*.py" -Pattern "from apps\.hseq_management\.sistema_documental" -Exclude "*__pycache__*","*sistema_documental*" -Recurse
if ($deps) {
    $deps | ForEach-Object { Write-Host $_.Line -ForegroundColor $RED }
} else {
    Write-Host "  ✓ Ninguna dependencia externa encontrada" -ForegroundColor $GREEN
}
Write-Host ""

Write-Host "Imports EN sistema_documental desde otros módulos:" -ForegroundColor $GREEN
$imports = Select-String -Path "$BACKEND_DIR\hseq_management\sistema_documental\*.py" -Pattern "from apps\." -Exclude "*__pycache__*" |
    Where-Object { $_.Line -notmatch "from apps\.hseq_management" -and $_.Line -notmatch "from apps\.core" }
if ($imports) {
    $imports | ForEach-Object { Write-Host $_.Line -ForegroundColor $YELLOW }
} else {
    Write-Host "  ✓ Solo depende de core" -ForegroundColor $GREEN
}
Write-Host ""

# ==============================================================================
# 2. DEPENDENCIAS DE planificacion_sistema
# ==============================================================================
Write-Host "[2] Verificando dependencias de planificacion_sistema..." -ForegroundColor $YELLOW
Write-Host ""

Write-Host "Imports DE planificacion_sistema en otros módulos:" -ForegroundColor $GREEN
$deps = Select-String -Path "$BACKEND_DIR\*\*.py" -Pattern "from apps\.hseq_management\.planificacion_sistema" -Exclude "*__pycache__*","*planificacion_sistema*" -Recurse
if ($deps) {
    $deps | ForEach-Object { Write-Host $_.Line -ForegroundColor $RED }
} else {
    Write-Host "  ✓ Ninguna dependencia externa encontrada" -ForegroundColor $GREEN
}
Write-Host ""

Write-Host "Imports EN planificacion_sistema desde otros módulos:" -ForegroundColor $GREEN
$imports = Select-String -Path "$BACKEND_DIR\hseq_management\planificacion_sistema\*.py" -Pattern "from apps\." -Exclude "*__pycache__*" |
    Where-Object { $_.Line -notmatch "from apps\.hseq_management" -and $_.Line -notmatch "from apps\.core" }
if ($imports) {
    $imports | ForEach-Object { Write-Host $_.Line -ForegroundColor $YELLOW }
} else {
    Write-Host "  ✓ Solo depende de core" -ForegroundColor $GREEN
}
Write-Host ""

# ==============================================================================
# 3. DEPENDENCIAS DE contexto_organizacional
# ==============================================================================
Write-Host "[3] Verificando dependencias de contexto_organizacional..." -ForegroundColor $YELLOW
Write-Host ""

Write-Host "Imports DE contexto_organizacional en otros módulos:" -ForegroundColor $GREEN
$deps = Select-String -Path "$BACKEND_DIR\*\*.py" -Pattern "from apps\.motor_riesgos\.contexto_organizacional" -Exclude "*__pycache__*","*contexto_organizacional*" -Recurse
if ($deps) {
    $deps | ForEach-Object { Write-Host $_.Line -ForegroundColor $RED }
} else {
    Write-Host "  ✓ Ninguna dependencia externa encontrada" -ForegroundColor $GREEN
}
Write-Host ""

Write-Host "Imports EN contexto_organizacional desde otros módulos:" -ForegroundColor $GREEN
$imports = Select-String -Path "$BACKEND_DIR\motor_riesgos\contexto_organizacional\*.py" -Pattern "from apps\." -Exclude "*__pycache__*" |
    Where-Object { $_.Line -notmatch "from apps\.motor_riesgos" -and $_.Line -notmatch "from apps\.core" }
if ($imports) {
    $imports | ForEach-Object { Write-Host $_.Line -ForegroundColor $YELLOW }
} else {
    Write-Host "  ✓ Solo depende de core" -ForegroundColor $GREEN
}
Write-Host ""

# ==============================================================================
# 4. DEPENDENCIA CIRCULAR CRÍTICA
# ==============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $RED
Write-Host "[4] VERIFICACIÓN DE DEPENDENCIA CIRCULAR CRÍTICA" -ForegroundColor $RED
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $RED
Write-Host ""

Write-Host "A → B: identidad → sistema_documental" -ForegroundColor $YELLOW
$circularA = Select-String -Path "$BACKEND_DIR\gestion_estrategica\identidad\services.py" -Pattern "from apps\.hseq_management\.sistema_documental"
if ($circularA) {
    $circularA | ForEach-Object { Write-Host "  Línea $($_.LineNumber): $($_.Line)" -ForegroundColor $RED }
} else {
    Write-Host "  ✓ No encontrada" -ForegroundColor $GREEN
}
Write-Host ""

Write-Host "B → A: sistema_documental → identidad" -ForegroundColor $YELLOW
$circularB = Select-String -Path "$BACKEND_DIR\hseq_management\sistema_documental\views.py" -Pattern "from apps\.gestion_estrategica\.identidad"
if ($circularB) {
    $circularB | ForEach-Object { Write-Host "  Línea $($_.LineNumber): $($_.Line)" -ForegroundColor $RED }
} else {
    Write-Host "  ✓ No encontrada" -ForegroundColor $GREEN
}
Write-Host ""

# ==============================================================================
# 5. FOREIGN KEYS CRUZADAS
# ==============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host "[5] Verificando ForeignKeys cruzadas..." -ForegroundColor $BLUE
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host ""

Write-Host "ForeignKeys en sistema_documental:" -ForegroundColor $GREEN
$fks = Select-String -Path "$BACKEND_DIR\hseq_management\sistema_documental\models.py" -Pattern "ForeignKey" | Select-Object -First 20
if ($fks) {
    $fks | ForEach-Object { Write-Host "  Línea $($_.LineNumber): $($_.Line.Trim())" }
}
Write-Host ""

Write-Host "ForeignKeys en planificacion_sistema:" -ForegroundColor $GREEN
$fks = Select-String -Path "$BACKEND_DIR\hseq_management\planificacion_sistema\models.py" -Pattern "ForeignKey" | Select-Object -First 20
if ($fks) {
    $fks | ForEach-Object { Write-Host "  Línea $($_.LineNumber): $($_.Line.Trim())" }
}
Write-Host ""

Write-Host "ForeignKeys en contexto_organizacional:" -ForegroundColor $GREEN
$fks = Select-String -Path "$BACKEND_DIR\motor_riesgos\contexto_organizacional\models.py" -Pattern "ForeignKey" | Select-Object -First 20
if ($fks) {
    $fks | ForEach-Object { Write-Host "  Línea $($_.LineNumber): $($_.Line.Trim())" }
}
Write-Host ""

# ==============================================================================
# 6. URLS Y CONFIGURACIÓN
# ==============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host "[6] Verificando configuración de URLs..." -ForegroundColor $BLUE
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host ""

Write-Host "URLs en hseq_management:" -ForegroundColor $GREEN
$urls = Select-String -Path "backend\config\urls.py" -Pattern "hseq_management" -Context 0,2
if ($urls) {
    $urls | ForEach-Object { Write-Host "  $($_.Line)" }
}
Write-Host ""

Write-Host "URLs en motor_riesgos:" -ForegroundColor $GREEN
$urls = Select-String -Path "backend\config\urls.py" -Pattern "motor_riesgos" -Context 0,2
if ($urls) {
    $urls | ForEach-Object { Write-Host "  $($_.Line)" }
}
Write-Host ""

# ==============================================================================
# 7. INSTALLED_APPS
# ==============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host "[7] Verificando INSTALLED_APPS..." -ForegroundColor $BLUE
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host ""

Write-Host "Apps relacionadas en settings.py:" -ForegroundColor $GREEN
$apps = Select-String -Path "backend\config\settings.py" -Pattern "(sistema_documental|planificacion_sistema|contexto_organizacional)"
if ($apps) {
    $apps | ForEach-Object { Write-Host "  Línea $($_.LineNumber): $($_.Line.Trim())" }
}
Write-Host ""

# ==============================================================================
# 8. RESUMEN
# ==============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host "  RESUMEN DE ANÁLISIS" -ForegroundColor $BLUE
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host ""

# Contadores
$depsSistemaDoc = (Select-String -Path "$BACKEND_DIR\*\*.py" -Pattern "from apps\.hseq_management\.sistema_documental" -Exclude "*__pycache__*","*sistema_documental*" -Recurse | Measure-Object).Count
$depsPlanificacion = (Select-String -Path "$BACKEND_DIR\*\*.py" -Pattern "from apps\.hseq_management\.planificacion_sistema" -Exclude "*__pycache__*","*planificacion_sistema*" -Recurse | Measure-Object).Count
$depsContexto = (Select-String -Path "$BACKEND_DIR\*\*.py" -Pattern "from apps\.motor_riesgos\.contexto_organizacional" -Exclude "*__pycache__*","*contexto_organizacional*" -Recurse | Measure-Object).Count

Write-Host "sistema_documental:        $depsSistemaDoc dependencias externas"
Write-Host "planificacion_sistema:     $depsPlanificacion dependencias externas"
Write-Host "contexto_organizacional:   $depsContexto dependencias externas"
Write-Host ""

# Dependencia circular
$circularACount = if ($circularA) { 1 } else { 0 }
$circularBCount = if ($circularB) { 1 } else { 0 }

if ($circularACount -gt 0 -and $circularBCount -gt 0) {
    Write-Host "⚠️  DEPENDENCIA CIRCULAR DETECTADA:" -ForegroundColor $RED
    Write-Host "   identidad ↔ sistema_documental" -ForegroundColor $RED
    Write-Host "   Esto debe resolverse antes de mover módulos." -ForegroundColor $RED
} else {
    Write-Host "✓ No se detectaron dependencias circulares críticas" -ForegroundColor $GREEN
}
Write-Host ""

# Recomendaciones
Write-Host "RECOMENDACIONES:" -ForegroundColor $YELLOW
if ($depsSistemaDoc -gt 0) {
    Write-Host "  • Crear módulo transversal 'gestion_documental' para resolver deps de sistema_documental"
}
if ($depsContexto -eq 0) {
    Write-Host "  • ✓ contexto_organizacional puede moverse sin problemas a gestion_estrategica" -ForegroundColor $GREEN
}
if ($depsPlanificacion -eq 0) {
    Write-Host "  • ✓ planificacion_sistema puede moverse/fusionarse sin problemas" -ForegroundColor $GREEN
}
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host "  Análisis Completado" -ForegroundColor $BLUE
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $BLUE
Write-Host ""
Write-Host "Ver detalles completos en: docs\ANALISIS-IMPACTO-MOVIMIENTO-MODULOS.md"
Write-Host ""
