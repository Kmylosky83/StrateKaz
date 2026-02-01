#!/bin/bash
# ============================================================================
# Script de Verificación de Arquitectura
# ============================================================================
# Verifica principios arquitectónicos del proyecto
# Ejecutar: ./scripts/verify-architecture.sh
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}Verificación de Arquitectura - StrateKaz${NC}"
echo -e "${CYAN}============================================${NC}\n"

ERRORS=0
WARNINGS=0
INFO=0

# ============================================================================
# 1. Verificar estructura de directorios
# ============================================================================

echo -e "${BLUE}[1/6] Verificando estructura de directorios...${NC}"

REQUIRED_DIRS=(
    "backend/apps/core"
    "backend/apps/gestion_estrategica"
    "frontend/src/features"
    "frontend/src/types"
    "docs"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$PROJECT_ROOT/$dir" ]; then
        echo -e "${RED}❌ Directorio faltante: $dir${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Estructura de directorios correcta${NC}\n"
else
    echo ""
fi

# ============================================================================
# 2. Verificar imports prohibidos en core
# ============================================================================

echo -e "${BLUE}[2/6] Verificando imports prohibidos en core...${NC}"

FORBIDDEN_PATTERNS=(
    "from apps\\.accounting"
    "from apps\\.admin_finance"
    "from apps\\.analytics"
    "from apps\\.audit_system"
    "from apps\\.cumplimiento"
    "from apps\\.gestion_estrategica"
    "from apps\\.hseq"
    "from apps\\.logistics_fleet"
    "from apps\\.production_ops"
    "from apps\\.riesgos"
    "from apps\\.sales_crm"
    "from apps\\.supply_chain"
    "from apps\\.talent_hub"
    "from apps\\.workflow_engine"
)

CORE_VIOLATIONS=0

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    MATCHES=$(grep -r "$pattern" "$PROJECT_ROOT/backend/apps/core/" --include="*.py" 2>/dev/null | \
              grep -v "__pycache__" | grep -v ".pyc" | grep -v "# DEPRECATED" || true)

    if [ -n "$MATCHES" ]; then
        echo -e "${RED}❌ Encontrado patrón prohibido: $pattern${NC}"
        echo "$MATCHES" | head -3
        echo ""
        CORE_VIOLATIONS=$((CORE_VIOLATIONS + 1))
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $CORE_VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}✅ Core no tiene imports prohibidos${NC}\n"
fi

# ============================================================================
# 3. Verificar uso de base_models
# ============================================================================

echo -e "${BLUE}[3/6] Verificando uso correcto de base_models...${NC}"

# Encontrar modelos que NO heredan de base_models
NON_STANDARD_MODELS=$(find "$PROJECT_ROOT/backend/apps" -name "models.py" -type f | \
    xargs grep -l "class.*models.Model" | \
    xargs grep -L "from apps.core.base_models" 2>/dev/null || true)

if [ -n "$NON_STANDARD_MODELS" ]; then
    echo -e "${YELLOW}⚠️  Modelos que no usan base_models estándar:${NC}"
    echo "$NON_STANDARD_MODELS" | while read file; do
        echo "   $(realpath --relative-to="$PROJECT_ROOT" "$file")"
    done
    echo ""
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Todos los modelos usan base_models${NC}\n"
fi

# ============================================================================
# 4. Verificar imports de páginas en frontend
# ============================================================================

echo -e "${BLUE}[4/6] Verificando imports de páginas en frontend...${NC}"

PAGE_IMPORTS=$(find "$PROJECT_ROOT/frontend/src/features" -type f \( -name "*.ts" -o -name "*.tsx" \) \
    ! -name "index.ts" -exec grep -l "from.*pages/.*Page" {} \; 2>/dev/null || true)

if [ -n "$PAGE_IMPORTS" ]; then
    echo -e "${YELLOW}⚠️  Componentes importando páginas completas:${NC}"
    echo "$PAGE_IMPORTS" | while read file; do
        echo "   $(realpath --relative-to="$PROJECT_ROOT" "$file")"
    done
    echo ""
    echo -e "${YELLOW}   Recomendación: Usar hooks o extraer componentes reutilizables${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Sin imports problemáticos de páginas${NC}\n"
fi

# ============================================================================
# 5. Verificar tipos TypeScript
# ============================================================================

echo -e "${BLUE}[5/6] Verificando definiciones de tipos...${NC}"

# Verificar que types/ tiene archivos index
if [ ! -f "$PROJECT_ROOT/frontend/src/types/index.ts" ]; then
    echo -e "${RED}❌ Falta frontend/src/types/index.ts${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Sistema de tipos centralizado presente${NC}"
fi

# Verificar uso de 'any' en archivos de tipos
ANY_USAGE=$(find "$PROJECT_ROOT/frontend/src/types" -name "*.ts" -exec grep -n ": any" {} + 2>/dev/null || true)

if [ -n "$ANY_USAGE" ]; then
    ANY_COUNT=$(echo "$ANY_USAGE" | wc -l)
    echo -e "${YELLOW}⚠️  Encontrados $ANY_COUNT usos de 'any' en tipos${NC}"
    echo "   Considerar reemplazar con tipos específicos"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Sin uso de 'any' en definiciones de tipos${NC}"
fi

echo ""

# ============================================================================
# 6. Verificar tests
# ============================================================================

echo -e "${BLUE}[6/6] Verificando cobertura de tests...${NC}"

# Backend: Verificar que cada app tiene tests
APPS_WITHOUT_TESTS=$(find "$PROJECT_ROOT/backend/apps" -maxdepth 1 -type d ! -name "__pycache__" | \
    while read app; do
        if [ -d "$app" ] && [ ! -d "$app/tests" ] && [ "$(basename "$app")" != "apps" ]; then
            basename "$app"
        fi
    done)

if [ -n "$APPS_WITHOUT_TESTS" ]; then
    echo -e "${YELLOW}⚠️  Apps sin directorio de tests:${NC}"
    echo "$APPS_WITHOUT_TESTS" | while read app; do
        echo "   - $app"
    done
    INFO=$((INFO + 1))
else
    echo -e "${GREEN}✅ Todas las apps tienen tests${NC}"
fi

# Frontend: Verificar archivos de test
FEATURE_TESTS=$(find "$PROJECT_ROOT/frontend/src/features" -name "*.test.ts*" -o -name "*.spec.ts*" 2>/dev/null | wc -l)
echo -e "${CYAN}ℹ️  Features con tests: $FEATURE_TESTS archivos de test${NC}"

echo ""

# ============================================================================
# 7. Generar reporte de métricas
# ============================================================================

echo -e "${BLUE}Métricas del Proyecto:${NC}"
echo -e "${CYAN}────────────────────────────────${NC}"

# Contar líneas de código
if command -v cloc &> /dev/null; then
    echo -e "${CYAN}Líneas de código:${NC}"
    cloc "$PROJECT_ROOT/backend/apps" "$PROJECT_ROOT/frontend/src" --quiet 2>/dev/null | tail -5
else
    PYTHON_LINES=$(find "$PROJECT_ROOT/backend" -name "*.py" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
    TS_LINES=$(find "$PROJECT_ROOT/frontend/src" \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
    echo -e "${CYAN}Python: $PYTHON_LINES líneas${NC}"
    echo -e "${CYAN}TypeScript: $TS_LINES líneas${NC}"
fi

echo ""

# Contar módulos
BACKEND_APPS=$(find "$PROJECT_ROOT/backend/apps" -maxdepth 1 -type d ! -name "__pycache__" | wc -l)
FRONTEND_FEATURES=$(find "$PROJECT_ROOT/frontend/src/features" -maxdepth 1 -type d | wc -l)

echo -e "${CYAN}Apps Backend: $BACKEND_APPS${NC}"
echo -e "${CYAN}Features Frontend: $FRONTEND_FEATURES${NC}"

echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}RESUMEN${NC}"
echo -e "${CYAN}============================================${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Verificación completada exitosamente${NC}"
    echo -e "${GREEN}✅ Arquitectura cumple con principios establecidos${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Sin errores críticos${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS advertencia(s)${NC}"
    if [ $INFO -gt 0 ]; then
        echo -e "${CYAN}ℹ️  $INFO nota(s) informativa(s)${NC}"
    fi
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(es) crítico(s)${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS advertencia(s)${NC}"
    if [ $INFO -gt 0 ]; then
        echo -e "${CYAN}ℹ️  $INFO nota(s) informativa(s)${NC}"
    fi
    echo ""
    echo -e "${RED}Revisar los siguientes documentos para corrección:${NC}"
    echo -e "${CYAN}  - docs/ANALISIS-DEPENDENCIAS-CIRCULARES.md${NC}"
    echo -e "${CYAN}  - docs/CHECKLIST-REFACTOR-DEPENDENCIAS.md${NC}"
    exit 1
fi
