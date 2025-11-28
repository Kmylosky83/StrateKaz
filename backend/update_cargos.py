"""
Script para actualizar los cargos del sistema
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.models import Cargo, User

# Primero desasociar el cargo del admin temporalmente
admin_user = User.objects.get(username='admin')
admin_user.cargo = None
admin_user.save()
print('✅ Usuario admin desasociado temporalmente')

# Eliminar todos los cargos
print('Eliminando cargos antiguos...')
Cargo.objects.all().delete()
print('✅ Cargos antiguos eliminados')

# Crear los 10 cargos nuevos con niveles jerárquicos
cargos_data = [
    {'code': 'superadmin', 'name': 'Director del Sistema', 'level': 3, 'description': 'Máxima autoridad del sistema'},
    {'code': 'gerente', 'name': 'Gerente', 'level': 3, 'description': 'Gerente General'},
    {'code': 'admin', 'name': 'Administrador', 'level': 3, 'description': 'Administrador del sistema'},
    {'code': 'lider_comercial', 'name': 'Líder Comercial y Logística', 'level': 2, 'description': 'Líder del área comercial y logística'},
    {'code': 'lider_com_econorte', 'name': 'Líder Comercial Econorte', 'level': 2, 'description': 'Líder comercial de Econorte'},
    {'code': 'lider_log_econorte', 'name': 'Líder de Logística Econorte', 'level': 2, 'description': 'Líder de logística de Econorte'},
    {'code': 'supervisor_planta', 'name': 'Supervisor de Planta', 'level': 1, 'description': 'Supervisor de planta de producción'},
    {'code': 'jefe_planta', 'name': 'Jefe de Planta', 'level': 1, 'description': 'Jefe de planta de producción'},
    {'code': 'comercial_econorte', 'name': 'Comercial Econorte', 'level': 0, 'description': 'Comercial de Econorte'},
    {'code': 'recolector_econorte', 'name': 'Recolector Econorte', 'level': 0, 'description': 'Recolector de Econorte'},
]

created_cargos = {}
for cargo_data in cargos_data:
    cargo = Cargo.objects.create(**cargo_data)
    created_cargos[cargo.code] = cargo
    print(f'✅ Creado: {cargo.name} ({cargo.code}) - Nivel {cargo.level}')

# Actualizar usuario admin con el cargo superadmin
admin_user.cargo = created_cargos['superadmin']
admin_user.save()
print(f'\n✅ Usuario admin actualizado con cargo: {admin_user.cargo.name}')

print(f'\nTotal de cargos creados: {Cargo.objects.count()}')
