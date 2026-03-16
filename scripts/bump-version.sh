#!/bin/bash
# =============================================================================
# bump-version.sh — Actualiza la versión del software en TODOS los archivos
# =============================================================================
# Uso:
#   ./scripts/bump-version.sh 5.2.0
#   ./scripts/bump-version.sh 5.2.0 --dry-run
#
# Archivos actualizados:
#   1. package.json (root)              → version
#   2. frontend/package.json            → version
#   3. frontend/src/constants/brand.ts  → APP_VERSION fallback
#   4. backend/config/settings/base.py  → SPECTACULAR_SETTINGS.VERSION
#   5. marketing_site/package.json      → version
#   6. marketing_site/vite.config.ts    → Sentry release tag
# =============================================================================

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detectar directorio raíz del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Validar argumento
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Falta la versión.${NC}"
    echo ""
    echo "Uso: $0 <version> [--dry-run]"
    echo "  Ejemplo: $0 5.2.0"
    echo "  Ejemplo: $0 5.2.0 --dry-run"
    echo ""
    echo "Versiones actuales:"
    echo -n "  Root:       " && grep -o '"version": "[^"]*"' "$ROOT_DIR/package.json" | head -1
    echo -n "  Frontend:   " && grep -o '"version": "[^"]*"' "$ROOT_DIR/frontend/package.json" | head -1
    echo -n "  Marketing:  " && grep -o '"version": "[^"]*"' "$ROOT_DIR/marketing_site/package.json" | head -1
    echo -n "  API:        " && grep -o "'VERSION': '[^']*'" "$ROOT_DIR/backend/config/settings/base.py" | head -1
    echo -n "  Brand.ts:   " && grep -o "'[0-9]*\.[0-9]*\.[0-9]*'" "$ROOT_DIR/frontend/src/constants/brand.ts" | head -1 || true
    exit 1
fi

NEW_VERSION="$1"
DRY_RUN=false

if [ "${2:-}" = "--dry-run" ]; then
    DRY_RUN=true
fi

# Validar formato semver
if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo -e "${RED}Error: Versión '$NEW_VERSION' no es semver válido (X.Y.Z)${NC}"
    exit 1
fi

echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  StrateKaz — Bump Version → ${GREEN}$NEW_VERSION${NC}"
if $DRY_RUN; then
    echo -e "  ${YELLOW}(DRY RUN — sin cambios reales)${NC}"
fi
echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
echo ""

UPDATED=0
ERRORS=0

# Función para actualizar un archivo
update_file() {
    local file="$1"
    local description="$2"
    local sed_pattern="$3"
    local relative_path="${file#$ROOT_DIR/}"

    if [ ! -f "$file" ]; then
        echo -e "  ${YELLOW}⚠ SKIP${NC}  $relative_path (no existe)"
        return
    fi

    if $DRY_RUN; then
        echo -e "  ${YELLOW}○ DRY${NC}   $relative_path — $description"
    else
        if sed -i "$sed_pattern" "$file"; then
            echo -e "  ${GREEN}✓ OK${NC}    $relative_path — $description"
            UPDATED=$((UPDATED + 1))
        else
            echo -e "  ${RED}✗ ERROR${NC} $relative_path — $description"
            ERRORS=$((ERRORS + 1))
        fi
    fi
}

# 1. Root package.json
update_file \
    "$ROOT_DIR/package.json" \
    "root monorepo version" \
    "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$NEW_VERSION\"/"

# 2. Frontend package.json
update_file \
    "$ROOT_DIR/frontend/package.json" \
    "frontend app version (→ PWA via Vite define)" \
    "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$NEW_VERSION\"/"

# 3. Frontend brand.ts fallback
update_file \
    "$ROOT_DIR/frontend/src/constants/brand.ts" \
    "APP_VERSION fallback" \
    "s/'[0-9]*\.[0-9]*\.[0-9]*'/'$NEW_VERSION'/"

# 4. Backend API version (drf-spectacular)
update_file \
    "$ROOT_DIR/backend/config/settings/base.py" \
    "API OpenAPI version" \
    "s/'VERSION': '[0-9]*\.[0-9]*\.[0-9]*'/'VERSION': '$NEW_VERSION'/"

# 5. Marketing site package.json
update_file \
    "$ROOT_DIR/marketing_site/package.json" \
    "marketing site version" \
    "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$NEW_VERSION\"/"

# 6. Marketing site Sentry release
update_file \
    "$ROOT_DIR/marketing_site/vite.config.ts" \
    "Sentry release tag" \
    "s/stratekaz-marketing@[0-9]*\.[0-9]*\.[0-9]*/stratekaz-marketing@$NEW_VERSION/"

echo ""

if $DRY_RUN; then
    echo -e "${YELLOW}Dry run completado. Ningún archivo fue modificado.${NC}"
else
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}Completado con $ERRORS errores. $UPDATED archivos actualizados.${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ $UPDATED archivos actualizados a v$NEW_VERSION${NC}"
        echo ""
        echo -e "${BLUE}Siguiente paso:${NC}"
        echo "  git add -A && git commit -m \"chore: bump version to $NEW_VERSION\""
    fi
fi
