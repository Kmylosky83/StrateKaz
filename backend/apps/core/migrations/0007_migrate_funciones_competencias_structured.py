"""
Data migration: Convierte funciones_responsabilidades, competencias_tecnicas y competencias_blandas
de formato legacy (array de strings) a formato estructurado (array de objetos).

Antes:  ["Gestionar operaciones", "Supervisar equipo"]
Despues: [{"nombre": "Gestionar operaciones", "frecuencia": "diaria", "criticidad": "media"}, ...]

Para competencias:
Antes:  ["Excel avanzado", "Liderazgo"]
Despues: [{"nombre": "Excel avanzado", "nivel": "intermedio"}, ...]

Compatible con rollback: la funcion reverse convierte objetos de vuelta a strings.
No modifica esquema de BD (JSONField sigue siendo JSON).
"""
from django.db import migrations


def migrate_to_structured(apps, schema_editor):
    """Convierte string[] -> objeto[] para funciones y competencias."""
    Cargo = apps.get_model('core', 'Cargo')
    updated_count = 0

    for cargo in Cargo.objects.all():
        changed = False

        # --- funciones_responsabilidades ---
        if cargo.funciones_responsabilidades:
            new_funciones = []
            for item in cargo.funciones_responsabilidades:
                if isinstance(item, str):
                    new_funciones.append({
                        'nombre': item,
                        'frecuencia': 'diaria',
                        'criticidad': 'media',
                    })
                    changed = True
                elif isinstance(item, dict):
                    new_funciones.append(item)  # Ya es objeto
                else:
                    new_funciones.append({
                        'nombre': str(item),
                        'frecuencia': 'diaria',
                        'criticidad': 'media',
                    })
                    changed = True
            if changed:
                cargo.funciones_responsabilidades = new_funciones

        # --- competencias_tecnicas ---
        old_changed = changed
        for field_name in ['competencias_tecnicas', 'competencias_blandas']:
            field_data = getattr(cargo, field_name)
            if field_data:
                new_data = []
                for item in field_data:
                    if isinstance(item, str):
                        new_data.append({
                            'nombre': item,
                            'nivel': 'intermedio',
                        })
                        changed = True
                    elif isinstance(item, dict):
                        new_data.append(item)  # Ya es objeto
                    else:
                        new_data.append({
                            'nombre': str(item),
                            'nivel': 'intermedio',
                        })
                        changed = True
                if changed != old_changed:
                    setattr(cargo, field_name, new_data)
                    old_changed = changed

        if changed:
            cargo.save(update_fields=[
                'funciones_responsabilidades',
                'competencias_tecnicas',
                'competencias_blandas',
            ])
            updated_count += 1

    if updated_count:
        print(f'\n  -> Migrados {updated_count} cargos a formato estructurado')


def revert_to_strings(apps, schema_editor):
    """Rollback: convierte objeto[] -> string[] (pierde metadata extra)."""
    Cargo = apps.get_model('core', 'Cargo')
    updated_count = 0

    for cargo in Cargo.objects.all():
        changed = False

        # --- funciones_responsabilidades ---
        if cargo.funciones_responsabilidades:
            new_funciones = []
            for item in cargo.funciones_responsabilidades:
                if isinstance(item, dict):
                    new_funciones.append(item.get('nombre', ''))
                    changed = True
                elif isinstance(item, str):
                    new_funciones.append(item)
            if changed:
                cargo.funciones_responsabilidades = new_funciones

        # --- competencias ---
        for field_name in ['competencias_tecnicas', 'competencias_blandas']:
            field_data = getattr(cargo, field_name)
            if field_data:
                new_data = []
                for item in field_data:
                    if isinstance(item, dict):
                        new_data.append(item.get('nombre', ''))
                        changed = True
                    elif isinstance(item, str):
                        new_data.append(item)
                if changed:
                    setattr(cargo, field_name, new_data)

        if changed:
            cargo.save(update_fields=[
                'funciones_responsabilidades',
                'competencias_tecnicas',
                'competencias_blandas',
            ])
            updated_count += 1

    if updated_count:
        print(f'\n  -> Revertidos {updated_count} cargos a formato string[]')


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_rename_areas_to_procesos'),
    ]

    operations = [
        migrations.RunPython(
            migrate_to_structured,
            reverse_code=revert_to_strings,
        ),
    ]
