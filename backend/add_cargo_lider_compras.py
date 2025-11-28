"""
Script para agregar el cargo Líder de Compras
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.models import Cargo

# Verificar si ya existe
if Cargo.objects.filter(code='lider_compras').exists():
    print('⚠️ El cargo lider_compras ya existe')
else:
    # Crear el nuevo cargo
    cargo = Cargo.objects.create(
        code='lider_compras',
        name='Líder de Compras',
        level=2,  # Nivel Coordinación
        description='Líder del área de compras - Gestiona proveedores de materia prima y productos/servicios',
        is_active=True
    )
    print(f'✅ Cargo creado: {cargo.name} ({cargo.code}) - Nivel {cargo.level}')

# Mostrar todos los cargos actuales
print('\n📋 Cargos actuales en el sistema:')
for cargo in Cargo.objects.all().order_by('-level', 'name'):
    print(f'  - {cargo.name} ({cargo.code}) - Nivel {cargo.level}')
