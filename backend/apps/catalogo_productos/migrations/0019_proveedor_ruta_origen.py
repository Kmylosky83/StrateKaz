"""
Migración 0019: Proveedor.ruta_origen (H-SC-10).

Agrega el campo `ruta_origen` OneToOneField a RutaRecoleccion. Prepara
el reemplazo de `sede_empresa_origen` que será eliminado en la
migración 0020 tras el backfill en `catalogos.0005_backfill_rutas`.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo_productos', '0018_proveedor_sede_empresa_origen'),
        ('catalogos', '0004_rutarecoleccion'),
    ]

    operations = [
        # Primero renombramos el related_name del FK viejo para liberar
        # 'proveedor_espejo' — evita clash al agregar el nuevo FK.
        migrations.AlterField(
            model_name='proveedor',
            name='sede_empresa_origen',
            field=models.OneToOneField(
                blank=True,
                help_text='DEPRECATED (H-SC-10): usar ruta_origen.',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='proveedor_espejo_legacy',
                to='configuracion.sedeempresa',
                verbose_name='Sede de origen (legacy)',
            ),
        ),
        migrations.AddField(
            model_name='proveedor',
            name='ruta_origen',
            field=models.OneToOneField(
                blank=True,
                help_text=(
                    'Ruta interna que origina este proveedor espejo (H-SC-10). '
                    'Gestionado automáticamente por signal.'
                ),
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='proveedor_espejo',
                to='catalogos.rutarecoleccion',
                verbose_name='Ruta de origen',
            ),
        ),
    ]
