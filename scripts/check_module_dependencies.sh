#!/bin/bash
################################################################################
# Script de Verificación de Dependencias entre Módulos
# ERP StrateKaz - Análisis de Impacto de Movimiento de Módulos
#
# Uso: ./scripts/check_module_dependencies.sh
################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_DIR="backend/apps"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Análisis de Dependencias - Movimiento de Módulos${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

################################################################################
# 1. DEPENDENCIAS DE sistema_documental
################################################################################
echo -e "${YELLOW}[1] Verificando dependencias de sistema_documental...${NC}"
echo ""

echo -e "${GREEN}Imports DE sistema_documental en otros módulos:${NC}"
grep -r "from apps.hseq_management.sistema_documental" "$BACKEND_DIR" \
  --exclude-dir=sistema_documental \
  --exclude-dir=__pycache__ \
  --include="*.py" \
  --color=always || echo "  ✓ Ninguna dependencia externa encontrada"
echo ""

echo -e "${GREEN}Imports EN sistema_documental desde otros módulos:${NC}"
grep -r "from apps\." "$BACKEND_DIR/hseq_management/sistema_documental" \
  --exclude-dir=__pycache__ \
  --include="*.py" \
  --color=always | \
  grep -v "from apps.hseq_management" | \
  grep -v "from apps.core" || echo "  ✓ Solo depende de core"
echo ""

################################################################################
# 2. DEPENDENCIAS DE planificacion_sistema
################################################################################
echo -e "${YELLOW}[2] Verificando dependencias de planificacion_sistema...${NC}"
echo ""

echo -e "${GREEN}Imports DE planificacion_sistema en otros módulos:${NC}"
grep -r "from apps.hseq_management.planificacion_sistema" "$BACKEND_DIR" \
  --exclude-dir=planificacion_sistema \
  --exclude-dir=__pycache__ \
  --include="*.py" \
  --color=always || echo "  ✓ Ninguna dependencia externa encontrada"
echo ""

echo -e "${GREEN}Imports EN planificacion_sistema desde otros módulos:${NC}"
grep -r "from apps\." "$BACKEND_DIR/hseq_management/planificacion_sistema" \
  --exclude-dir=__pycache__ \
  --include="*.py" \
  --color=always | \
  grep -v "from apps.hseq_management" | \
  grep -v "from apps.core" || echo "  ✓ Solo depende de core"
echo ""

################################################################################
# 3. DEPENDENCIAS DE contexto_organizacional
################################################################################
echo -e "${YELLOW}[3] Verificando dependencias de contexto_organizacional...${NC}"
echo ""

echo -e "${GREEN}Imports DE contexto_organizacional en otros módulos:${NC}"
grep -r "from apps.motor_riesgos.contexto_organizacional" "$BACKEND_DIR" \
  --exclude-dir=contexto_organizacional \
  --exclude-dir=__pycache__ \
  --include="*.py" \
  --color=always || echo "  ✓ Ninguna dependencia externa encontrada"
echo ""

echo -e "${GREEN}Imports EN contexto_organizacional desde otros módulos:${NC}"
grep -r "from apps\." "$BACKEND_DIR/motor_riesgos/contexto_organizacional" \
  --exclude-dir=__pycache__ \
  --include="*.py" \
  --color=always | \
  grep -v "from apps.motor_riesgos" | \
  grep -v "from apps.core" || echo "  ✓ Solo depende de core"
echo ""

################################################################################
# 4. DEPENDENCIA CIRCULAR CRÍTICA
################################################################################
echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}[4] VERIFICACIÓN DE DEPENDENCIA CIRCULAR CRÍTICA${NC}"
echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}A → B: identidad → sistema_documental${NC}"
grep -n "from apps.hseq_management.sistema_documental" \
  "$BACKEND_DIR/gestion_estrategica/identidad/services.py" \
  --color=always || echo "  ✓ No encontrada"
echo ""

echo -e "${YELLOW}B → A: sistema_documental → identidad${NC}"
grep -n "from apps.gestion_estrategica.identidad" \
  "$BACKEND_DIR/hseq_management/sistema_documental/views.py" \
  --color=always || echo "  ✓ No encontrada"
echo ""

################################################################################
# 5. FOREIGN KEYS CRUZADAS
################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}[5] Verificando ForeignKeys cruzadas...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}ForeignKeys en sistema_documental:${NC}"
grep -n "ForeignKey" "$BACKEND_DIR/hseq_management/sistema_documental/models.py" \
  --color=always | head -20
echo ""

echo -e "${GREEN}ForeignKeys en planificacion_sistema:${NC}"
grep -n "ForeignKey" "$BACKEND_DIR/hseq_management/planificacion_sistema/models.py" \
  --color=always | head -20
echo ""

echo -e "${GREEN}ForeignKeys en contexto_organizacional:${NC}"
grep -n "ForeignKey" "$BACKEND_DIR/motor_riesgos/contexto_organizacional/models.py" \
  --color=always | head -20
echo ""

################################################################################
# 6. URLS Y CONFIGURACIÓN
################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}[6] Verificando configuración de URLs...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}URLs en hseq_management:${NC}"
cat "$BACKEND_DIR/../config/urls.py" | grep -A 2 "hseq_management" --color=always || echo "  No encontrado"
echo ""

echo -e "${GREEN}URLs en motor_riesgos:${NC}"
cat "$BACKEND_DIR/../config/urls.py" | grep -A 2 "motor_riesgos" --color=always || echo "  No encontrado"
echo ""

################################################################################
# 7. INSTALLED_APPS
################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}[7] Verificando INSTALLED_APPS...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}Apps relacionadas en settings.py:${NC}"
grep -E "(sistema_documental|planificacion_sistema|contexto_organizacional)" \
  backend/config/settings.py \
  --color=always || echo "  No encontrado"
echo ""

################################################################################
# 8. RESUMEN
################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  RESUMEN DE ANÁLISIS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Contadores
DEPS_SISTEMA_DOC=$(grep -r "from apps.hseq_management.sistema_documental" "$BACKEND_DIR" \
  --exclude-dir=sistema_documental --exclude-dir=__pycache__ --include="*.py" 2>/dev/null | wc -l || echo 0)

DEPS_PLANIFICACION=$(grep -r "from apps.hseq_management.planificacion_sistema" "$BACKEND_DIR" \
  --exclude-dir=planificacion_sistema --exclude-dir=__pycache__ --include="*.py" 2>/dev/null | wc -l || echo 0)

DEPS_CONTEXTO=$(grep -r "from apps.motor_riesgos.contexto_organizacional" "$BACKEND_DIR" \
  --exclude-dir=contexto_organizacional --exclude-dir=__pycache__ --include="*.py" 2>/dev/null | wc -l || echo 0)

echo -e "sistema_documental:        ${DEPS_SISTEMA_DOC} dependencias externas"
echo -e "planificacion_sistema:     ${DEPS_PLANIFICACION} dependencias externas"
echo -e "contexto_organizacional:   ${DEPS_CONTEXTO} dependencias externas"
echo ""

# Dependencia circular
CIRCULAR_A=$(grep -c "from apps.hseq_management.sistema_documental" \
  "$BACKEND_DIR/gestion_estrategica/identidad/services.py" 2>/dev/null || echo 0)
CIRCULAR_B=$(grep -c "from apps.gestion_estrategica.identidad" \
  "$BACKEND_DIR/hseq_management/sistema_documental/views.py" 2>/dev/null || echo 0)

if [ "$CIRCULAR_A" -gt 0 ] && [ "$CIRCULAR_B" -gt 0 ]; then
  echo -e "${RED}⚠️  DEPENDENCIA CIRCULAR DETECTADA:${NC}"
  echo -e "${RED}   identidad ↔ sistema_documental${NC}"
  echo -e "${RED}   Esto debe resolverse antes de mover módulos.${NC}"
else
  echo -e "${GREEN}✓ No se detectaron dependencias circulares críticas${NC}"
fi
echo ""

# Recomendaciones
echo -e "${YELLOW}RECOMENDACIONES:${NC}"
if [ "$DEPS_SISTEMA_DOC" -gt 0 ]; then
  echo -e "  • Crear módulo transversal 'gestion_documental' para resolver deps de sistema_documental"
fi
if [ "$DEPS_CONTEXTO" -eq 0 ]; then
  echo -e "  • ✓ contexto_organizacional puede moverse sin problemas a gestion_estrategica"
fi
if [ "$DEPS_PLANIFICACION" -eq 0 ]; then
  echo -e "  • ✓ planificacion_sistema puede moverse/fusionarse sin problemas"
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Análisis Completado${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Ver detalles completos en: docs/ANALISIS-IMPACTO-MOVIMIENTO-MODULOS.md"
echo ""
