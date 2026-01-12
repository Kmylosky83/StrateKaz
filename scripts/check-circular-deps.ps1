# ============================================================================
# Script de Verificación de Dependencias Circulares (PowerShell)
# ============================================================================
# Detecta dependencias circulares entre módulos y violaciones arquitectónicas
# Uso: .\scripts\check-circular-deps.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

# Colores
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "======================================" "Cyan"
Write-ColorOutput "Verificación de Dependencias Circulares" "Cyan"
Write-ColorOutput "======================================" "Cyan"
Write-Host ""

$Errors = 0
$Warnings = 0

# ============================================================================
# 1. BACKEND - Verificar que core NO importe de apps específicas
# ============================================================================

Write-ColorOutput "[1/4] Backend: Verificando violaciones en core..." "Cyan"

$CoreViolations = Get-ChildItem -Path "backend\apps\core" -Recurse -Filter "*.py" |
    Where-Object { $_.FullName -notmatch "__pycache__" -and $_.Extension -eq ".py" } |
    Select-String -Pattern "from apps\.gestion_estrategica" |
    Select-Object -ExpandProperty Line

if ($CoreViolations) {
    Write-ColorOutput "❌ VIOLACIÓN CRÍTICA: core importa desde gestion_estrategica" "Red"
    $CoreViolations | ForEach-Object { Write-Host "   $_" }
    Write-Host ""
    $Errors++
} else {
    Write-ColorOutput "✅ Sin violaciones en core" "Green"
    Write-Host ""
}

# ============================================================================
# 2. BACKEND - Verificar imports de apps específicas en core
# ============================================================================

Write-ColorOutput "[2/4] Backend: Verificando otras apps importadas por core..." "Cyan"

$ForbiddenApps = @(
    "accounting",
    "admin_finance",
    "analytics",
    "audit_system",
    "cumplimiento",
    "gestion_estrategica",
    "hseq",
    "logistics_fleet",
    "production_ops",
    "riesgos",
    "sales_crm",
    "supply_chain",
    "talent_hub",
    "workflow_engine"
)

$CoreErrors = 0

foreach ($app in $ForbiddenApps) {
    $Pattern = "from apps\.$app"
    $AppImports = Get-ChildItem -Path "backend\apps\core" -Recurse -Filter "*.py" |
        Where-Object { $_.FullName -notmatch "__pycache__" } |
        Select-String -Pattern $Pattern |
        Select-Object -First 3

    if ($AppImports) {
        Write-ColorOutput "❌ core importa desde ${app}:" "Red"
        $AppImports | ForEach-Object {
            Write-Host "   $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())"
        }
        Write-Host ""
        $Errors++
        $CoreErrors++
    }
}

if ($CoreErrors -eq 0) {
    Write-ColorOutput "✅ core no importa apps específicas" "Green"
    Write-Host ""
}

# ============================================================================
# 3. FRONTEND - Verificar dependencias entre features
# ============================================================================

Write-ColorOutput "[3/4] Frontend: Verificando dependencias entre features..." "Cyan"

$FeatureDeps = @{
    "gestion-estrategica:configuracion" = "useMatrizPermisos hook depende de configuracion"
    "configuracion:gestion-estrategica" = "RolesTab (LEGACY) depende de gestion-estrategica"
    "gestion-estrategica:users" = "Varios componentes dependen de users"
    "users:configuracion" = "UsersPage depende de configuracion"
}

$FeatureWarnings = 0

foreach ($dep in $FeatureDeps.Keys) {
    $parts = $dep -split ":"
    $fromFeature = $parts[0]
    $toFeature = $parts[1]

    $FeaturePath = "frontend\src\features\$fromFeature"

    if (Test-Path $FeaturePath) {
        $Pattern = "@/features/$toFeature"
        $Imports = Get-ChildItem -Path $FeaturePath -Recurse -Include "*.ts", "*.tsx" |
            Select-String -Pattern $Pattern

        if ($Imports) {
            $ImportCount = ($Imports | Measure-Object).Count
            Write-ColorOutput "⚠️  $fromFeature → ${toFeature}: $ImportCount imports" "Yellow"
            Write-Host "   $($FeatureDeps[$dep])"
            $Warnings++
            $FeatureWarnings++
        }
    }
}

if ($FeatureWarnings -eq 0) {
    Write-ColorOutput "✅ Sin dependencias circulares detectadas" "Green"
}
Write-Host ""

# ============================================================================
# 4. FRONTEND - Verificar imports de páginas completas (anti-patrón)
# ============================================================================

Write-ColorOutput "[4/4] Frontend: Verificando imports de páginas completas..." "Cyan"

$PageImports = Get-ChildItem -Path "frontend\src\features" -Recurse -Include "*.ts", "*.tsx" |
    Where-Object { $_.Name -ne "index.ts" } |
    Select-String -Pattern "from.*pages/.*Page"

if ($PageImports) {
    Write-ColorOutput "⚠️  Imports de páginas completas detectados:" "Yellow"
    $PageImports | ForEach-Object {
        Write-Host "   $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())"
    }
    Write-Host ""
    Write-ColorOutput "   Recomendación: Extraer lógica a hooks o componentes compartidos" "Yellow"
    $Warnings++
} else {
    Write-ColorOutput "✅ Sin imports problemáticos de páginas" "Green"
}
Write-Host ""

# ============================================================================
# RESUMEN
# ============================================================================

Write-ColorOutput "======================================" "Cyan"
Write-ColorOutput "RESUMEN" "Cyan"
Write-ColorOutput "======================================" "Cyan"

if ($Errors -eq 0 -and $Warnings -eq 0) {
    Write-ColorOutput "✅ Todas las verificaciones pasaron exitosamente" "Green"
    Write-ColorOutput "✅ No se detectaron dependencias circulares" "Green"
    exit 0
} elseif ($Errors -eq 0) {
    Write-ColorOutput "⚠️  $Warnings advertencia(s) encontrada(s)" "Yellow"
    Write-ColorOutput "✅ Sin errores críticos" "Green"
    exit 0
} else {
    Write-ColorOutput "❌ $Errors error(es) crítico(s) encontrado(s)" "Red"
    Write-ColorOutput "⚠️  $Warnings advertencia(s) encontrada(s)" "Yellow"
    Write-Host ""
    Write-ColorOutput "Por favor, revisa el archivo docs\ANALISIS-DEPENDENCIAS-CIRCULARES.md" "Red"
    Write-ColorOutput "para más detalles y plan de corrección." "Red"
    exit 1
}
