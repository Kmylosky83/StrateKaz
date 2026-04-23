"""
Migración S3.2: VoucherRecepcion header + líneas (VoucherLineaMP).

1. Crea la tabla supply_chain_voucher_linea_mp.
2. Data migration: por cada VoucherRecepcion con producto_id definido,
   crea una VoucherLineaMP equivalente.
3. Elimina los campos de producto/pesaje/precio del header del voucher.
"""
from decimal import Decimal

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models




def migrar_lineas(apps, schema_editor):
    """Convierte cada voucher de producto único a una línea."""
    VoucherRecepcion = apps.get_model('sc_recepcion', 'VoucherRecepcion')
    VoucherLineaMP = apps.get_model('sc_recepcion', 'VoucherLineaMP')
    for v in VoucherRecepcion.objects.filter(producto_id__isnull=False):
        peso_neto = (v.peso_bruto_kg or Decimal('0')) - (v.peso_tara_kg or Decimal('0'))
        VoucherLineaMP.objects.create(
            voucher_id=v.id,
            producto_id=v.producto_id,
            peso_bruto_kg=v.peso_bruto_kg or Decimal('0'),
            peso_tara_kg=v.peso_tara_kg or Decimal('0'),
            peso_neto_kg=max(peso_neto, Decimal('0')),
            created_by_id=v.created_by_id,
            updated_by_id=v.updated_by_id,
            is_deleted=False,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('sc_recepcion', '0002_alter_voucherrecepcion_proveedor'),
        ('catalogo_productos', '0018_proveedor_sede_empresa_origen'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Crear la nueva tabla de líneas
        migrations.CreateModel(
            name='VoucherLineaMP',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, verbose_name='Eliminado')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de eliminación')),
                ('deleted_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Eliminado por',
                )),
                ('created_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Creado por',
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Actualizado por',
                )),
                ('voucher', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='lineas',
                    to='sc_recepcion.voucherrecepcion',
                    verbose_name='Voucher de recepción',
                )),
                ('producto', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='lineas_voucher',
                    to='catalogo_productos.producto',
                    verbose_name='Producto',
                )),
                ('peso_bruto_kg', models.DecimalField(decimal_places=3, max_digits=12, verbose_name='Peso bruto (kg)')),
                ('peso_tara_kg', models.DecimalField(decimal_places=3, default=Decimal('0.000'), max_digits=12, verbose_name='Peso tara (kg)')),
                ('peso_neto_kg', models.DecimalField(decimal_places=3, editable=False, max_digits=12, verbose_name='Peso neto (kg)')),
            ],
            options={
                'verbose_name': 'Línea de MP en Voucher',
                'verbose_name_plural': 'Líneas de MP en Voucher',
                'db_table': 'supply_chain_voucher_linea_mp',
                'ordering': ['id'],
            },
        ),

        # 2. Data migration: voucher producto-único → línea
        migrations.RunPython(migrar_lineas, migrations.RunPython.noop),

        # 3. Eliminar campos del header que pasaron a líneas
        migrations.RemoveField(model_name='voucherrecepcion', name='producto'),
        migrations.RemoveField(model_name='voucherrecepcion', name='peso_bruto_kg'),
        migrations.RemoveField(model_name='voucherrecepcion', name='peso_tara_kg'),
        migrations.RemoveField(model_name='voucherrecepcion', name='peso_neto_kg'),
        migrations.RemoveField(model_name='voucherrecepcion', name='precio_kg_snapshot'),

        # 4. Limpiar índices del header que ya no tienen sentido
        migrations.AlterModelOptions(
            name='voucherrecepcion',
            options={
                'db_table': 'supply_chain_voucher_recepcion',
                'ordering': ['-created_at'],
                'verbose_name': 'Voucher de Recepción',
                'verbose_name_plural': 'Vouchers de Recepción',
            },
        ),
    ]
