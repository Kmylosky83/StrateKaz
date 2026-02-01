#!/bin/bash

# ============================================================================
# Script de Verificación de Dependencias Circulares
# ============================================================================
# Detecta dependencias circulares entre módulos y violaciones arquitectónicas
# Uso: ./scripts/check-circular-deps.sh
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Verificación de Dependencias Circulares${NC}"
echo -e "${BLUE}======================================${NC}\n"

ERRORS=0
WARNINGS=0

# ============================================================================
# 1. BACKEND - Verificar que core NO importe de apps específicas
# ============================================================================

echo -e "${BLUE}[1/4] Backend: Verificando violaciones en core...${NC}"

CORE_VIOLATIONS=$(grep -r "from apps\.gestion_estrategica" backend/apps/core/ --include="*.py" 2>/dev/null | grep -v "__pycache__" | grep -v ".pyc" || true)

if [ -n "$CORE_VIOLATIONS" ]; then
    echo -e "${RED}❌ VIOLACIÓN CRÍTICA: core importa desde gestion_estrategica${NC}"
    echo "$CORE_VIOLATIONS"
    echo ""
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Sin violaciones en core${NC}\n"
fi

# ============================================================================
# 2. BACKEND - Verificar imports de apps específicas en core
# ============================================================================

echo -e "${BLUE}[2/4] Backend: Verificando otras apps importadas por core...${NC}"

# Lista de apps que NO deberían ser importadas por core
FORBIDDEN_APPS=(
    "accounting"
    "admin_finance"
    "analytics"
    "audit_system"
    "cumplimiento"
    "gestion_estrategica"
    "hseq"
    "logistics_fleet"
    "production_ops"
    "riesgos"
    "sales_crm"
    "supply_chain"
    "talent_hub"
    "workflow_engine"
)

for app in "${FORBIDDEN_APPS[@]}"; do
    APP_IMPORTS=$(grep -r "from apps\\.${app}" backend/apps/core/ --include="*.py" 2>/dev/null | grep -v "__pycache__" | grep -v ".pyc" || true)

    if [ -n "$APP_IMPORTS" ]; then
        echo -e "${RED}❌ core importa desde ${app}:${NC}"
        echo "$APP_IMPORTS" | head -3
        echo ""
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ core no importa apps específicas${NC}\n"
fi

# ============================================================================
# 3. FRONTEND - Verificar dependencias entre features
# ============================================================================

echo -e "${BLUE}[3/4] Frontend: Verificando dependencias entre features...${NC}"

# Casos específicos a verificar
declare -A FEATURE_DEPS=(
    ["gestion-estrategica:configuracion"]="useMatrizPermisos hook depende de configuracion"
    ["configuracion:gestion-estrategica"]="RolesTab (LEGACY) depende de gestion-estrategica"
    ["gestion-estrategica:users"]="Varios componentes dependen de users"
    ["users:configuracion"]="UsersPage depende de configuracion"
)

for dep in "${!FEATURE_DEPS[@]}"; do
    IFS=':' read -r from_feature to_feature <<< "$dep"

    IMPORTS=$(grep -r "@/features/${to_feature}" "frontend/src/features/${from_feature}/" --include="*.ts" --include="*.tsx" 2>/dev/null || true)

    if [ -n "$IMPORTS" ]; then
        IMPORT_COUNT=$(echo "$IMPORTS" | wc -l)
        echo -e "${YELLOW}⚠️  ${from_feature} → ${to_feature}: ${IMPORT_COUNT} imports${NC}"
        echo "   ${FEATURE_DEPS[$dep]}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Sin dependencias circulares detectadas${NC}"
fi
echo ""

# ============================================================================
# 4. FRONTEND - Verificar imports de páginas completas (anti-patrón)
# ============================================================================

echo -e "${BLUE}[4/4] Frontend: Verificando imports de páginas completas...${NC}"

PAGE_IMPORTS=$(grep -r "from.*pages/.*Page" frontend/src/features --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "index.ts" || true)

if [ -n "$PAGE_IMPORTS" ]; then
    echo -e "${YELLOW}⚠️  Imports de páginas completas detectados:${NC}"
    echo "$PAGE_IMPORTS"
    echo ""
    echo -e "${YELLOW}   Recomendación: Extraer lógica a hooks o componentes compartidos${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Sin imports problemáticos de páginas${NC}"
fi
echo ""

# ============================================================================
# RESUMEN
# ============================================================================

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}RESUMEN${NC}"
echo -e "${BLUE}======================================${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Todas las verificaciones pasaron exitosamente${NC}"
    echo -e "${GREEN}✅ No se detectaron dependencias circulares${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} advertencia(s) encontrada(s)${NC}"
    echo -e "${GREEN}✅ Sin errores críticos${NC}"
    exit 0
else
    echo -e "${RED}❌ ${ERRORS} error(es) crítico(s) encontrado(s)${NC}"
    echo -e "${YELLOW}⚠️  ${WARNINGS} advertencia(s) encontrada(s)${NC}"
    echo ""
    echo -e "${RED}Por favor, revisa el archivo docs/ANALISIS-DEPENDENCIAS-CIRCULARES.md${NC}"
    echo -e "${RED}para más detalles y plan de corrección.${NC}"
    exit 1
fi
