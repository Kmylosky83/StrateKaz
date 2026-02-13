"""
Data migration: Reordena Centro de Talento a posicion 2 en el sidebar.

Sprint 13.2: TH es el punto de entrada para datos maestros (Cargos -> Colaboradores -> Usuarios),
por lo tanto debe estar justo despues de Direccion Estrategica en el sidebar.

Cambios de orden:
- talent_hub: 50 -> 15 (sube a posicion 2)
- sistema_gestion: 15 -> 20
- motor_cumplimiento: 20 -> 25
- motor_riesgos: 21 -> 26
- workflow_engine: 22 -> 27
- admin_finance: 51 -> 50
- accounting: 52 -> 51

Reversible: restaura ordenes originales.
"""
from django.db import migrations


# Mapeo: code -> nuevo orden
NEW_ORDER = {
    'talent_hub': 15,
    'sistema_gestion': 20,
    'motor_cumplimiento': 25,
    'motor_riesgos': 26,
    'workflow_engine': 27,
    'admin_finance': 50,
    'accounting': 51,
}

# Mapeo inverso: code -> orden original
OLD_ORDER = {
    'talent_hub': 50,
    'sistema_gestion': 15,
    'motor_cumplimiento': 20,
    'motor_riesgos': 21,
    'workflow_engine': 22,
    'admin_finance': 51,
    'accounting': 52,
}


def reorder_modules(apps, schema_editor):
    """Reordenar modulos para que Centro de Talento sea el segundo."""
    SystemModule = apps.get_model('core', 'SystemModule')

    for code, new_orden in NEW_ORDER.items():
        updated = SystemModule.objects.filter(code=code).update(orden=new_orden)
        if updated:
            print(f"  {code}: orden -> {new_orden}")


def restore_order(apps, schema_editor):
    """Restaurar orden original."""
    SystemModule = apps.get_model('core', 'SystemModule')

    for code, old_orden in OLD_ORDER.items():
        SystemModule.objects.filter(code=code).update(orden=old_orden)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_remove_cargos_colaboradores_from_organizacion'),
    ]

    operations = [
        migrations.RunPython(
            reorder_modules,
            restore_order,
        ),
    ]
