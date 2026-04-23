"""
Migración 0006: TipoSede.rol_operacional (H-SC-10).

Agrega el campo `rol_operacional` al modelo TipoSede. Backfill por
heurística sobre `code`/`name` de los TipoSede existentes:
    - PLANTA/Plant → PLANTA
    - CENTRO_ACOPIO → CENTRO_ACOPIO
    - ALMACEN/BODEGA → BODEGA
    - SEDE_PRINCIPAL/SEDE/SUCURSAL/PUNTO_VENTA → OFICINA
    - default → OTRO

Este campo prepara la fusión con SedeEmpresa.tipo_unidad (que será
eliminado en la migración 0007). Al consolidar, el rol operativo vive
en el catálogo TipoSede (compartido entre sedes del mismo tipo).
"""
from django.db import migrations, models


_ROL_POR_CODE = {
    'PLANTA': 'PLANTA',
    'CENTRO_ACOPIO': 'CENTRO_ACOPIO',
    'ALMACEN': 'BODEGA',
    'BODEGA': 'BODEGA',
    'SEDE_PRINCIPAL': 'OFICINA',
    'SEDE': 'OFICINA',
    'SUCURSAL': 'OFICINA',
    'PUNTO_VENTA': 'OFICINA',
    'OTRO': 'OTRO',
}


def backfill_rol_operacional(apps, schema_editor):
    TipoSede = apps.get_model('configuracion', 'TipoSede')
    for tipo in TipoSede.objects.all():
        rol = _ROL_POR_CODE.get(tipo.code, 'OTRO')
        if tipo.rol_operacional != rol:
            tipo.rol_operacional = rol
            tipo.save(update_fields=['rol_operacional'])


def reverse_noop(apps, schema_editor):
    """Noop reverso: el AddField se deshace solo."""
    return


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0005_sede_ruta_recoleccion'),
    ]

    operations = [
        migrations.AddField(
            model_name='tiposede',
            name='rol_operacional',
            field=models.CharField(
                choices=[
                    ('OFICINA', 'Oficina Administrativa'),
                    ('PLANTA', 'Planta'),
                    ('CENTRO_ACOPIO', 'Centro de Acopio'),
                    ('BODEGA', 'Bodega'),
                    ('OTRO', 'Otro'),
                ],
                default='OTRO',
                help_text=(
                    'Rol operativo del tipo de sede. Reemplaza el campo '
                    'SedeEmpresa.tipo_unidad (H-SC-10).'
                ),
                max_length=20,
                verbose_name='Rol operacional',
            ),
        ),
        migrations.RunPython(backfill_rol_operacional, reverse_noop),
    ]
