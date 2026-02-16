#!/usr/bin/env python3
"""
Script de testing rápido - Sprint 17
Verifica que los imports funcionen correctamente
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

print('=' * 80)
print('SPRINT 17 - TEST DE IMPORTS')
print('=' * 80)
print()

# Test 1: Imports de modelos
print('[1/5] Testing imports de modelos...')
try:
    from apps.gestion_estrategica.contexto.models import (
        GrupoParteInteresada,
        TipoParteInteresada,
        ParteInteresada,
        MatrizComunicacion
    )
    print('  ✓ Modelos importados correctamente')
except ImportError as e:
    print(f'  ✗ Error importando modelos: {e}')
    sys.exit(1)

# Test 2: Imports de serializers
print('[2/5] Testing imports de serializers...')
try:
    from apps.gestion_estrategica.contexto.serializers import (
        GrupoParteInteresadaSerializer,
        TipoParteInteresadaSerializer,
        ParteInteresadaSerializer,
        MatrizComunicacionSerializer
    )
    print('  ✓ Serializers importados correctamente')
except ImportError as e:
    print(f'  ✗ Error importando serializers: {e}')
    sys.exit(1)

# Test 3: Imports de views
print('[3/5] Testing imports de views...')
try:
    from apps.gestion_estrategica.contexto.views import (
        GrupoParteInteresadaViewSet,
        TipoParteInteresadaViewSet,
        ParteInteresadaViewSet,
        MatrizComunicacionViewSet
    )
    print('  ✓ ViewSets importados correctamente')
except ImportError as e:
    print(f'  ✗ Error importando views: {e}')
    sys.exit(1)

# Test 4: Verificar campos de modelos
print('[4/5] Testing campos de modelos...')
try:
    # GrupoParteInteresada
    assert hasattr(GrupoParteInteresada, 'codigo'), 'GrupoParteInteresada debe tener campo codigo'
    assert hasattr(GrupoParteInteresada, 'nombre'), 'GrupoParteInteresada debe tener campo nombre'
    assert hasattr(GrupoParteInteresada, 'es_sistema'), 'GrupoParteInteresada debe tener campo es_sistema'

    # TipoParteInteresada
    assert hasattr(TipoParteInteresada, 'grupo'), 'TipoParteInteresada debe tener FK grupo'
    assert hasattr(TipoParteInteresada, 'es_sistema'), 'TipoParteInteresada debe tener campo es_sistema'

    # ParteInteresada
    assert hasattr(ParteInteresada, 'nivel_influencia_pi'), 'ParteInteresada debe tener nivel_influencia_pi'
    assert hasattr(ParteInteresada, 'nivel_influencia_empresa'), 'ParteInteresada debe tener nivel_influencia_empresa'
    assert hasattr(ParteInteresada, 'temas_interes_pi'), 'ParteInteresada debe tener temas_interes_pi'
    assert hasattr(ParteInteresada, 'temas_interes_empresa'), 'ParteInteresada debe tener temas_interes_empresa'
    assert hasattr(ParteInteresada, 'responsable_empresa'), 'ParteInteresada debe tener responsable_empresa'
    assert hasattr(ParteInteresada, 'cargo_responsable'), 'ParteInteresada debe tener cargo_responsable'
    assert hasattr(ParteInteresada, 'area_responsable'), 'ParteInteresada debe tener area_responsable'

    print('  ✓ Campos de modelos verificados')
except AssertionError as e:
    print(f'  ✗ Error en campos: {e}')
    sys.exit(1)

# Test 5: Verificar método generar_comunicacion_automatica
print('[5/5] Testing método generar_comunicacion_automatica...')
try:
    assert hasattr(ParteInteresada, 'generar_comunicacion_automatica'), \
        'ParteInteresada debe tener método generar_comunicacion_automatica'
    print('  ✓ Método generar_comunicacion_automatica existe')
except AssertionError as e:
    print(f'  ✗ Error: {e}')
    sys.exit(1)

print()
print('=' * 80)
print('✅ TODOS LOS TESTS PASARON')
print('=' * 80)
print()
print('Próximos pasos:')
print('1. Aplicar migraciones: python manage.py migrate')
print('2. Ejecutar seed: python manage.py seed_grupos_partes_interesadas')
print('3. Probar endpoints en Postman/cURL')
print()
