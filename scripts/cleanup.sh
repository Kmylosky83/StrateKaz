#!/bin/bash
# Script de limpieza de archivos temporales y cache
# Uso: ./scripts/cleanup.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "================================================"
echo "Limpieza de Archivos Temporales - StrateKaz"
echo "================================================"

# Contador
TOTAL_REMOVED=0

# 1. Limpiar __pycache__ de Python
echo ""
echo "[1/7] Limpiando archivos __pycache__ de Python..."
PYC_COUNT=$(find backend -type d -name "__pycache__" 2>/dev/null | wc -l)
if [ "$PYC_COUNT" -gt 0 ]; then
    find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    echo "   ✓ Eliminados $PYC_COUNT directorios __pycache__"
    TOTAL_REMOVED=$((TOTAL_REMOVED + PYC_COUNT))
else
    echo "   ✓ No hay archivos __pycache__"
fi

# 2. Limpiar archivos .pyc y .pyo
echo ""
echo "[2/7] Limpiando archivos .pyc y .pyo..."
PYC_FILES=$(find backend -type f \( -name "*.pyc" -o -name "*.pyo" \) 2>/dev/null | wc -l)
if [ "$PYC_FILES" -gt 0 ]; then
    find backend -type f \( -name "*.pyc" -o -name "*.pyo" \) -delete 2>/dev/null || true
    echo "   ✓ Eliminados $PYC_FILES archivos .pyc/.pyo"
    TOTAL_REMOVED=$((TOTAL_REMOVED + PYC_FILES))
else
    echo "   ✓ No hay archivos .pyc/.pyo"
fi

# 3. Limpiar node_modules/.cache
echo ""
echo "[3/7] Limpiando cache de node_modules..."
if [ -d "frontend/node_modules/.cache" ]; then
    rm -rf frontend/node_modules/.cache
    echo "   ✓ Eliminado node_modules/.cache"
    TOTAL_REMOVED=$((TOTAL_REMOVED + 1))
else
    echo "   ✓ No hay cache de node_modules"
fi

# 4. Limpiar cache de Vite
echo ""
echo "[4/7] Limpiando cache de Vite..."
if [ -d "frontend/.vite" ]; then
    rm -rf frontend/.vite
    echo "   ✓ Eliminado .vite cache"
    TOTAL_REMOVED=$((TOTAL_REMOVED + 1))
else
    echo "   ✓ No hay cache de Vite"
fi

# 5. Limpiar dist de frontend
echo ""
echo "[5/7] Limpiando carpeta dist..."
if [ -d "frontend/dist" ]; then
    rm -rf frontend/dist
    echo "   ✓ Eliminado dist/"
    TOTAL_REMOVED=$((TOTAL_REMOVED + 1))
else
    echo "   ✓ No hay carpeta dist"
fi

# 6. Limpiar archivos de editor temporales
echo ""
echo "[6/7] Limpiando archivos temporales de editores..."
TEMP_FILES=$(find . -type f \( -name "*~" -o -name "*.swp" -o -name "*.swo" -o -name ".DS_Store" -o -name "Thumbs.db" \) 2>/dev/null | wc -l)
if [ "$TEMP_FILES" -gt 0 ]; then
    find . -type f \( -name "*~" -o -name "*.swp" -o -name "*.swo" -o -name ".DS_Store" -o -name "Thumbs.db" \) -delete 2>/dev/null || true
    echo "   ✓ Eliminados $TEMP_FILES archivos temporales"
    TOTAL_REMOVED=$((TOTAL_REMOVED + TEMP_FILES))
else
    echo "   ✓ No hay archivos temporales de editores"
fi

# 7. Limpiar logs antiguos
echo ""
echo "[7/7] Limpiando logs antiguos..."
LOG_COUNT=$(find . -type f -name "*.log" -mtime +7 2>/dev/null | wc -l)
if [ "$LOG_COUNT" -gt 0 ]; then
    echo "   ⚠ Encontrados $LOG_COUNT archivos .log mayores a 7 días"
    echo "   → Ejecutar manualmente: find . -name '*.log' -mtime +7 -delete"
else
    echo "   ✓ No hay logs antiguos"
fi

echo ""
echo "================================================"
echo "Limpieza completada"
echo "Total de elementos eliminados: $TOTAL_REMOVED"
echo "================================================"

# Listar archivos legacy (informativo)
echo ""
echo "================================================"
echo "Archivos Legacy Detectados (NO ELIMINADOS)"
echo "================================================"
echo ""
echo "Documentación legacy:"
find docs/archive -type f -name "*.md" 2>/dev/null | head -10 | sed 's/^/   - /'
echo ""
echo "Deployment legacy:"
find deploy/legacy -type f 2>/dev/null | head -10 | sed 's/^/   - /'
echo ""
echo "Componentes legacy frontend:"
find frontend/src -type f -name "*LEGACY*" 2>/dev/null | sed 's/^/   - /'
echo ""
echo "NOTA: Los archivos legacy se mantienen en docs/archive/ y deploy/legacy/"
echo "      para referencia histórica. Revisar antes de eliminar."
echo ""
