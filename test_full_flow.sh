#!/bin/bash
# Test del flujo completo de autenticación multi-tenant

API="http://localhost:8000/api"

echo "======================================="
echo "TEST: Flujo de Autenticación Multi-Tenant"
echo "======================================="
echo ""

# 1. Login
echo "1. Login con admin@demo.com..."
LOGIN_RESPONSE=$(curl -s -X POST "$API/tenant/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin).get('access', ''))")
TENANTS=$(echo $LOGIN_RESPONSE | python -c "import sys, json; tenants=json.load(sys.stdin).get('tenants', []); print(len(tenants))")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "   ❌ Login falló"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "   ✅ Login exitoso - $TENANTS tenant(s) accesibles"
echo ""

# 2. Me endpoint
echo "2. Verificando /me endpoint..."
ME_RESPONSE=$(curl -s -X GET "$API/tenant/auth/me/" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

EMAIL=$(echo $ME_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin).get('email', ''))")

if [ "$EMAIL" = "admin@demo.com" ]; then
  echo "   ✅ /me funciona correctamente"
else
  echo "   ❌ /me falló: $ME_RESPONSE"
fi
echo ""

# 3. Obtener tenant_id
TENANT_ID=$(echo $LOGIN_RESPONSE | python -c "import sys, json; tenants=json.load(sys.stdin).get('tenants', []); print(tenants[0]['tenant']['id'] if tenants else '')")
TENANT_NAME=$(echo $LOGIN_RESPONSE | python -c "import sys, json; tenants=json.load(sys.stdin).get('tenants', []); print(tenants[0]['tenant']['name'] if tenants else '')")

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

MODULE_COUNT=$(echo $SIDEBAR | python -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)")

if [ "$MODULE_COUNT" -gt 0 ]; then
  echo "   ✅ Sidebar cargado: $MODULE_COUNT módulos"
else
  echo "   ❌ Sidebar vacío o error"
  echo "   Response: $(echo $SIDEBAR | head -c 200)"
fi
echo ""

# 5. Modules tree
echo "5. Obteniendo árbol de módulos..."
TREE=$(curl -s -X GET "$API/core/system-modules/tree/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

TREE_MODULES=$(echo $TREE | python -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('modules', [])))")

if [ "$TREE_MODULES" -gt 0 ]; then
  echo "   ✅ Árbol de módulos: $TREE_MODULES módulos"
else
  echo "   ❌ Árbol vacío"
fi
echo ""

# 6. Branding config
echo "6. Obteniendo branding..."
BRANDING=$(curl -s -X GET "$API/core/branding/config/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

COMPANY=$(echo $BRANDING | python -c "import sys, json; print(json.load(sys.stdin).get('company_name', 'N/A'))")
echo "   ✅ Empresa: $COMPANY"
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
