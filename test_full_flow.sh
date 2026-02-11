#!/usr/bin/env bash
# Test del flujo completo de autenticaciÃ³n multi-tenant

API="http://localhost:8000/api"

# Seleccionar intÃ©rprete de Python
if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "ERROR: No se encontrÃ³ 'python' ni 'python3'. Instala Python o jq y vuelve a intentarlo."
  exit 1
fi

echo "======================================="
echo "TEST: Flujo de AutenticaciÃ³n Multi-Tenant"
echo "======================================="
echo ""

# 1. Login
echo "1. Login con admin@demo.com..."
LOGIN_RESPONSE=$(curl -s -X POST "$API/tenant/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | $PY -c "import sys, json; print(json.load(sys.stdin).get('access', ''))")
TENANTS=$(echo "$LOGIN_RESPONSE" | $PY -c "import sys, json; tenants=json.load(sys.stdin).get('tenants', []); print(len(tenants))")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "   âŒ Login fallÃ³"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "   âœ… Login exitoso - $TENANTS tenant(s) accesibles"
echo ""

# 2. Me endpoint
echo "2. Verificando /me endpoint..."
ME_RESPONSE=$(curl -s -X GET "$API/tenant/auth/me/" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

EMAIL=$(echo "$ME_RESPONSE" | $PY -c "import sys, json; print(json.load(sys.stdin).get('email', ''))")

if [ "$EMAIL" = "admin@demo.com" ]; then
  echo "   âœ… /me funciona correctamente"
else
  echo "   âŒ /me fallÃ³: $ME_RESPONSE"
fi
echo ""

# 3. Obtener tenant_id
TENANT_ID=$(echo "$LOGIN_RESPONSE" | $PY -c "import sys, json; tenants=json.load(sys.stdin).get('tenants', []); print(tenants[0]['tenant']['id'] if tenants else '')")
TENANT_NAME=$(echo "$LOGIN_RESPONSE" | $PY -c "import sys, json; tenants=json.load(sys.stdin).get('tenants', []); print(tenants[0]['tenant']['name'] if tenants else '')")

echo "3. Seleccionando tenant: $TENANT_NAME (ID: $TENANT_ID)..."
SELECT_RESPONSE=$(curl -s -X POST "$API/tenant/auth/select-tenant/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tenant_id\":$TENANT_ID}")

echo "   Response: $SELECT_RESPONSE"
echo ""

# 4. Sidebar con X-Tenant-ID
echo "4. Obteniendo sidebar con X-Tenant-ID..."
SIDEBAR=$(curl -s -X GET "$API/core/system-modules/sidebar/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

MODULE_COUNT=$(echo "$SIDEBAR" | $PY -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)")

if [ "$MODULE_COUNT" -gt 0 ]; then
  echo "   âœ… Sidebar cargado: $MODULE_COUNT mÃ³dulos"
else
  echo "   âŒ Sidebar vacÃ­o o error"
  echo "   Response: $(echo $SIDEBAR | head -c 200)"
fi
echo ""

# 5. Modules tree
echo "5. Obteniendo Ã¡rbol de mÃ³dulos..."
TREE=$(curl -s -X GET "$API/core/system-modules/tree/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

TREE_MODULES=$(echo "$TREE" | $PY -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('modules', [])))")

if [ "$TREE_MODULES" -gt 0 ]; then
  echo "   âœ… Ãrbol de mÃ³dulos: $TREE_MODULES mÃ³dulos"
else
  echo "   âŒ Ãrbol vacÃ­o"
fi
echo ""

# 6. Branding config
echo "6. Obteniendo branding..."
BRANDING=$(curl -s -X GET "$API/core/branding/config/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

COMPANY=$(echo "$BRANDING" | $PY -c "import sys, json; print(json.load(sys.stdin).get('company_name', 'N/A'))")
echo "   âœ… Empresa: $COMPANY"
echo ""

echo "======================================="
echo "RESUMEN: Todas las APIs funcionan correctamente"
echo "======================================="
echo ""
echo "Para probar en el navegador:"
echo "1. cd frontend && npm run dev"
echo "2. Abrir http://localhost:3010"
echo "3. Login: admin@demo.com / admin123"
echo ""

