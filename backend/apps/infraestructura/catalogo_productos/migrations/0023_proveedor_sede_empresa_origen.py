"""
Migración 0023: re-agrega Proveedor.sede_empresa_origen como ForeignKey
nullable (H-SC-05 — Ruta A).

A diferencia de la antigua migración 0018 (OneToOneField, eliminada en
0020 durante H-SC-10), esta versión usa ForeignKey con on_delete=PROTECT
para reflejar la nueva semántica: una sede con
`tipo_sede.rol_operacional == 'PROVEEDOR_INTERNO'` es el origen de un
único Proveedor interno, sincronizado por el signal
`apps.gestion_estrategica.configuracion.signals.sync_sede_to_proveedor_interno`.

La unicidad efectiva se garantiza por `get_or_create` en el signal; no se
agrega UniqueConstraint en DB para no bloquear migraciones de schemas con
históricos inconsistentes.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('infra_catalogo_productos', '0022_proveedor_frecuencia_pago'),
        ('configuracion', '0009_tiposede_rol_proveedor_interno'),
    ]

    operations = [
        migrations.AddField(
            model_name='proveedor',
            name='sede_empresa_origen',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='proveedores_internos',
                to='configuracion.sedeempresa',
                verbose_name='Sede empresa origen',
                help_text=(
                    'Si está seteado, este proveedor representa una unidad '
                    'interna (sede con tipo_sede.rol_operacional=PROVEEDOR_INTERNO). '
                    'Datos básicos sincronizados desde la sede.'
                ),
            ),
        ),
    ]
