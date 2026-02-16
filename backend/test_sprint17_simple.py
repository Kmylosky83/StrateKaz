#!/usr/bin/env python3
"""
Testing Simple - Sprint 17
Verifica modelos y lógica básica
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from apps.gestion_estrategica.contexto.models import (
    GrupoParteInteresada,
    TipoParteInteresada,
    ParteInteresada,
)

print('=' * 80)
print('SPRINT 17 - TESTING SIMPLE')
print('=' * 80)
print()

# Test 1: Grupos
print('[1/3] Verificando GrupoParteInteresada...')
total_grupos = GrupoParteInteresada.objects.count()
grupos_sistema = GrupoParteInteresada.objects.filter(es_sistema=True).count()
print(f'  Total grupos: {total_grupos}')
print(f'  Grupos sistema: {grupos_sistema}')

if grupos_sistema >= 10:
    print('  ✓ Seed ejecutado correctamente')
else:
    print(f'  ⚠ ADVERTENCIA: Solo {grupos_sistema} grupos del sistema')
    print('  Ejecuta: python manage.py seed_grupos_partes_interesadas')

# Test 2: Tipos
print('\n[2/3] Verificando TipoParteInteresada...')
try:
    grupo_personal = GrupoParteInteresada.objects.filter(codigo='PERSONAL').first()
    if grupo_personal:
        tipos_en_personal = TipoParteInteresada.objects.filter(grupo=grupo_personal).count()
        print(f'  ✓ Grupo PERSONAL encontrado')
        print(f'  Tipos en PERSONAL: {tipos_en_personal}')
    else:
        print('  ⚠ Grupo PERSONAL no encontrado')
except Exception as e:
    print(f'  ✗ ERROR: {e}')

# Test 3: Partes Interesadas
print('\n[3/3] Verificando ParteInteresada...')
total_partes = ParteInteresada.objects.count()
print(f'  Total partes interesadas: {total_partes}')

if total_partes > 0:
    parte = ParteInteresada.objects.first()
    print(f'\n  Ejemplo:')
    print(f'    - Nombre: {parte.nombre}')
    print(f'    - Tipo: {parte.tipo.nombre if parte.tipo else "N/A"}')
    print(f'    - Grupo: {parte.tipo.grupo.nombre if parte.tipo and parte.tipo.grupo else "N/A"}')
    print(f'    - Impacto PI→Empresa: {parte.nivel_influencia_pi}')
    print(f'    - Impacto Empresa→PI: {parte.nivel_influencia_empresa}')
    print(f'    - Cuadrante: {parte.cuadrante_matriz}')

print('\n' + '=' * 80)
print('✅ TESTING COMPLETADO')
print('=' * 80)
