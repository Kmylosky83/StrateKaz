"""
Script de verificación rápida del fix de timezone
Ejecutar: py verify_timezone_fix.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.programaciones.serializers import ReprogramarSerializer, AsignarRecolectorSerializer
from apps.core.fields import NaiveDateField
from datetime import date

print("=" * 70)
print("VERIFICACIÓN DEL FIX DE TIMEZONE")
print("=" * 70)
print()

# Test 1: Verificar que el serializer usa NaiveDateField
print("✓ Test 1: Verificar tipo de campo")
print("-" * 70)

reprogramar_field = ReprogramarSerializer().fields['fecha_reprogramada']
asignar_field = AsignarRecolectorSerializer().fields['nueva_fecha']

if isinstance(reprogramar_field, NaiveDateField):
    print("✅ ReprogramarSerializer.fecha_reprogramada usa NaiveDateField")
else:
    print("❌ ReprogramarSerializer.fecha_reprogramada NO usa NaiveDateField")
    print(f"   Tipo actual: {type(reprogramar_field)}")

if isinstance(asignar_field, NaiveDateField):
    print("✅ AsignarRecolectorSerializer.nueva_fecha usa NaiveDateField")
else:
    print("❌ AsignarRecolectorSerializer.nueva_fecha NO usa NaiveDateField")
    print(f"   Tipo actual: {type(asignar_field)}")

print()

# Test 2: Verificar comportamiento con fecha simple
print("✓ Test 2: Fecha simple (YYYY-MM-DD)")
print("-" * 70)

data = {
    'fecha_reprogramada': '2024-12-01',
    'motivo_reprogramacion': 'Test de verificación'
}
serializer = ReprogramarSerializer(data=data)

if serializer.is_valid():
    fecha_resultado = serializer.validated_data['fecha_reprogramada']
    if fecha_resultado == date(2024, 12, 1):
        print(f"✅ Input: '2024-12-01' → Output: {fecha_resultado}")
    else:
        print(f"❌ Input: '2024-12-01' → Output: {fecha_resultado} (esperado: 2024-12-01)")
else:
    print(f"❌ Error de validación: {serializer.errors}")

print()

# Test 3: Verificar el caso problemático (UTC timezone)
print("✓ Test 3: Fecha con timezone UTC (caso crítico)")
print("-" * 70)

data_utc = {
    'fecha_reprogramada': '2024-12-01T00:00:00Z',
    'motivo_reprogramacion': 'Test de verificación con UTC'
}
serializer_utc = ReprogramarSerializer(data=data_utc)

if serializer_utc.is_valid():
    fecha_resultado_utc = serializer_utc.validated_data['fecha_reprogramada']
    if fecha_resultado_utc == date(2024, 12, 1):
        print(f"✅ Input: '2024-12-01T00:00:00Z' → Output: {fecha_resultado_utc}")
        print("   (Ignora timezone correctamente, no convierte a 2024-11-30)")
    else:
        print(f"❌ Input: '2024-12-01T00:00:00Z' → Output: {fecha_resultado_utc}")
        print(f"   ⚠️  PROBLEMA: Debería ser 2024-12-01, no {fecha_resultado_utc}")
else:
    print(f"❌ Error de validación: {serializer_utc.errors}")

print()

# Test 4: Fecha con timezone de Bogotá
print("✓ Test 4: Fecha con timezone de Bogotá (UTC-5)")
print("-" * 70)

data_bog = {
    'fecha_reprogramada': '2024-12-01T00:00:00-05:00',
    'motivo_reprogramacion': 'Test de verificación con timezone Bogotá'
}
serializer_bog = ReprogramarSerializer(data=data_bog)

if serializer_bog.is_valid():
    fecha_resultado_bog = serializer_bog.validated_data['fecha_reprogramada']
    if fecha_resultado_bog == date(2024, 12, 1):
        print(f"✅ Input: '2024-12-01T00:00:00-05:00' → Output: {fecha_resultado_bog}")
    else:
        print(f"❌ Input: '2024-12-01T00:00:00-05:00' → Output: {fecha_resultado_bog}")
else:
    print(f"❌ Error de validación: {serializer_bog.errors}")

print()
print("=" * 70)
print("RESULTADO FINAL")
print("=" * 70)

all_tests_passed = (
    isinstance(reprogramar_field, NaiveDateField) and
    isinstance(asignar_field, NaiveDateField) and
    serializer.is_valid() and
    serializer.validated_data['fecha_reprogramada'] == date(2024, 12, 1) and
    serializer_utc.is_valid() and
    serializer_utc.validated_data['fecha_reprogramada'] == date(2024, 12, 1) and
    serializer_bog.is_valid() and
    serializer_bog.validated_data['fecha_reprogramada'] == date(2024, 12, 1)
)

if all_tests_passed:
    print("✅ TODOS LOS TESTS PASARON - FIX IMPLEMENTADO CORRECTAMENTE")
    print()
    print("El problema de zona horaria está resuelto.")
    print("Las fechas ahora se guardan correctamente sin convertir timezone.")
else:
    print("❌ ALGUNOS TESTS FALLARON - REVISAR IMPLEMENTACIÓN")
    print()
    print("Pasos de troubleshooting:")
    print("1. Verificar que apps/core/fields.py existe")
    print("2. Verificar import en apps/programaciones/serializers.py")
    print("3. Verificar que se usa NaiveDateField en los serializers")
    print("4. Reiniciar el servidor Django")

print("=" * 70)
