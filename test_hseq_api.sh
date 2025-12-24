#!/bin/bash
# Script para probar el endpoint API de módulos HSEQ

echo "=========================================="
echo "🧪 TEST: API MÓDULOS HSEQ MANAGEMENT"
echo "=========================================="
echo ""

# Configuración
API_BASE="http://localhost:8000/api"
ENDPOINT="$API_BASE/core/system-modules/sidebar/"

echo "📡 Endpoint: $ENDPOINT"
echo ""

# Test 1: Verificar que el servidor responda
echo "1️⃣  Verificando servidor..."
if curl -s -o /dev/null -w "%{http_code}" "$API_BASE/core/system-modules/" | grep -q "200\|401"; then
    echo "   ✅ Servidor Django respondiendo"
else
    echo "   ❌ Servidor no responde"
    echo "   💡 Inicia el servidor: python manage.py runserver"
    exit 1
fi
echo ""

# Test 2: Obtener datos del sidebar
echo "2️⃣  Obteniendo datos del sidebar..."
RESPONSE=$(curl -s "$ENDPOINT")

if [ $? -eq 0 ]; then
    echo "   ✅ Endpoint accesible"
else
    echo "   ❌ Error al acceder al endpoint"
    exit 1
fi
echo ""

# Test 3: Verificar si HSEQ Management está en la respuesta
echo "3️⃣  Verificando módulo HSEQ Management..."
if echo "$RESPONSE" | grep -q "hseq_management"; then
    echo "   ✅ Módulo HSEQ Management encontrado"
else
    echo "   ❌ Módulo HSEQ Management NO encontrado"
    echo "   💡 Ejecuta: python manage.py seed_hseq_modules"
    exit 1
fi
echo ""

# Test 4: Contar tabs
echo "4️⃣  Contando tabs..."
TAB_COUNT=$(echo "$RESPONSE" | grep -o '"code":"sistema_documental\|planificacion_sistema\|calidad\|medicina_laboral\|seguridad_industrial\|higiene_industrial\|gestion_comites\|accidentalidad\|emergencias\|gestion_ambiental\|mejora_continua"' | wc -l)

if [ "$TAB_COUNT" -ge 11 ]; then
    echo "   ✅ Encontrados $TAB_COUNT/11 tabs esperados"
else
    echo "   ⚠️  Solo $TAB_COUNT/11 tabs encontrados"
fi
echo ""

# Test 5: Mostrar estructura (si jq está disponible)
echo "5️⃣  Estructura del módulo HSEQ:"
if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq '.[] | select(.code == "hseq_management") | {
        code: .code,
        name: .name,
        icon: .icon,
        color: .color,
        tabs_count: (.children | length),
        tabs: [.children[] | .name]
    }'
else
    echo "   ⚠️  jq no instalado - mostrando datos raw:"
    echo "$RESPONSE" | grep -A 200 "hseq_management" | head -50
fi
echo ""

# Resumen
echo "=========================================="
echo "✅ TESTS COMPLETADOS"
echo "=========================================="
echo ""
echo "💡 Próximos pasos:"
echo "   - Verifica en el navegador: http://localhost:8000"
echo "   - Revisa el sidebar para ver HSEQ Management"
echo "   - Navega a las rutas de cada tab"
echo ""
