"""
Migración 0014: Backfill del parámetro `acidez` desde datos legacy.

Parte de H-SC-03 (QC obligatorio por producto en Recepción MP).

Por cada `ProductoEspecCalidad` con `requiere_prueba_acidez=True`:
    1. Crea un `ProductoEspecCalidadParametro(nombre='acidez')` con los
       rangos actuales de `acidez_min/max` (es_critico=True).
    2. Activa el flag `Producto.requiere_qc_recepcion=True` en el producto
       asociado, para que la validación en recepción funcione de una vez.

IDEMPOTENTE: usa `get_or_create` con (espec_calidad, nombre_parametro)
como natural key. Si ya existe el parámetro acidez, no se duplica.

Reversible: elimina solo los parámetros con nombre='acidez' creados por
este backfill. NO toca el flag `requiere_qc_recepcion` en reverse
(decisión: política de "no undo de flags" — el admin los desactiva
manualmente si fuera necesario).

Política `feedback_migration_strategy.md`: RunPython reversible para
datos legacy, no usar AlterField destructivo.
"""
from django.db import migrations


def backfill_parametro_acidez(apps, schema_editor):
    EspecCalidad = apps.get_model('infra_catalogo_productos', 'ProductoEspecCalidad')
    Parametro = apps.get_model('infra_catalogo_productos', 'ProductoEspecCalidadParametro')

    for ec in EspecCalidad.objects.filter(
        requiere_prueba_acidez=True, is_deleted=False
    ):
        # 1. Crear parámetro acidez (si no existe)
        Parametro.objects.get_or_create(
            espec_calidad=ec,
            nombre_parametro='acidez',
            defaults={
                'unidad': '%',
                'valor_min': ec.acidez_min,
                'valor_max': ec.acidez_max,
                'es_critico': True,
                'orden': 0,
                'descripcion': (
                    'Parámetro migrado automáticamente desde '
                    'ProductoEspecCalidad.acidez_min/max legacy.'
                ),
            }
        )

        # 2. Activar flag en el producto si no está activo
        producto = ec.producto
        if not producto.requiere_qc_recepcion:
            producto.requiere_qc_recepcion = True
            producto.save(update_fields=['requiere_qc_recepcion'])


def reverse_backfill_parametro_acidez(apps, schema_editor):
    Parametro = apps.get_model('infra_catalogo_productos', 'ProductoEspecCalidadParametro')
    # Eliminar solo parámetros con nombre='acidez' (los creados por este backfill).
    # NO revertir el flag requiere_qc_recepcion — política de no-undo de flags.
    Parametro.objects.filter(nombre_parametro='acidez').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('infra_catalogo_productos', '0013_productoespeccalidadparametro'),
    ]

    operations = [
        migrations.RunPython(
            backfill_parametro_acidez,
            reverse_code=reverse_backfill_parametro_acidez,
        ),
    ]
