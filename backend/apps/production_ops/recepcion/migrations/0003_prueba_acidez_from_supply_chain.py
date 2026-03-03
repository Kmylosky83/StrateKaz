"""
Migración SeparateDatabaseAndState: PruebaAcidez

Mueve PruebaAcidez desde supply_chain.gestion_proveedores
hacia production_ops.recepcion. La tabla DB no cambia (mismo db_table).

Solo operación de estado — la tabla ya existe con el nombre original.
"""
import apps.production_ops.recepcion.models
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recepcion', '0002_remove_detallerecepcion_production__tipo_ma_3b1b60_idx_and_more'),
        ('gestion_proveedores', '0002_move_datos_maestros_and_prueba_acidez'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='PruebaAcidez',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('proveedor_id', models.PositiveBigIntegerField(db_index=True, verbose_name='Proveedor')),
                        ('proveedor_nombre', models.CharField(blank=True, max_length=200, verbose_name='Nombre del proveedor')),
                        ('fecha_prueba', models.DateTimeField(verbose_name='Fecha de prueba')),
                        ('valor_acidez', models.DecimalField(decimal_places=2, max_digits=5, verbose_name='Valor de acidez (%)')),
                        ('calidad_resultante', models.CharField(
                            choices=[
                                ('A', 'Calidad A (Acidez < 3%)'),
                                ('B', 'Calidad B (Acidez 3-5%)'),
                                ('B1', 'Calidad B1 (Acidez 5-8%)'),
                                ('B2', 'Calidad B2 (Acidez 8-12%)'),
                                ('B4', 'Calidad B4 (Acidez 12-15%)'),
                                ('C', 'Calidad C (Acidez > 15%)'),
                            ],
                            max_length=2,
                            verbose_name='Calidad resultante',
                        )),
                        ('tipo_materia_resultante_id', models.PositiveBigIntegerField(blank=True, db_index=True, null=True, verbose_name='Tipo materia resultante')),
                        ('tipo_materia_resultante_nombre', models.CharField(blank=True, max_length=150, verbose_name='Nombre tipo materia resultante')),
                        ('foto_prueba', models.ImageField(upload_to=apps.production_ops.recepcion.models.prueba_acidez_upload_path, verbose_name='Foto de la prueba')),
                        ('cantidad_kg', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Cantidad (kg)')),
                        ('precio_kg_aplicado', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Precio por kg aplicado')),
                        ('valor_total', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name='Valor total')),
                        ('observaciones', models.TextField(blank=True, null=True)),
                        ('lote_numero', models.CharField(blank=True, max_length=50, null=True)),
                        ('codigo_voucher', models.CharField(max_length=20, unique=True, verbose_name='Código de voucher')),
                        ('realizado_por', models.ForeignKey(
                            on_delete=django.db.models.deletion.PROTECT,
                            related_name='po_pruebas_acidez_realizadas',
                            to=settings.AUTH_USER_MODEL,
                            verbose_name='Realizado por',
                        )),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('deleted_at', models.DateTimeField(blank=True, null=True)),
                    ],
                    options={
                        'verbose_name': 'Prueba de Acidez',
                        'verbose_name_plural': 'Pruebas de Acidez',
                        'db_table': 'supply_chain_prueba_acidez',
                        'ordering': ['-fecha_prueba', '-created_at'],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
