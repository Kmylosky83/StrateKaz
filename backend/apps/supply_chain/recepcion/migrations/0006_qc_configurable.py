"""
Migración 0006: QC configurable por tenant (H-SC-11 Fase 1).

Crea 3 modelos nuevos:
  - ParametroCalidad: parámetro medible configurable (Acidez, Humedad, pH…)
  - RangoCalidad: rangos que clasifican el valor medido (Tipo A/B/C…)
  - MedicionCalidad: medición por línea de voucher (reemplaza conceptual-
    mente a RecepcionCalidad OneToOne).

RecepcionCalidad legacy NO se toca. Queda deprecated y se limpiará en
H-SC-12 cuando el dominio esté migrado.

NO incluye seed de data demo — ver management command `seed_acidez_demo`
para cargar el catálogo inicial de Acidez (opt-in por tenant).

Reversible vía migrations.CreateModel estándar.
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sc_recepcion', '0005_cleanup_producto_index'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── ParametroCalidad ──────────────────────────────────────────
        migrations.CreateModel(
            name='ParametroCalidad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, verbose_name='Eliminado')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de eliminación')),
                ('code', models.CharField(db_index=True, max_length=50, verbose_name='Código')),
                ('name', models.CharField(max_length=100, verbose_name='Nombre')),
                ('description', models.TextField(blank=True, default='', verbose_name='Descripción')),
                ('unit', models.CharField(help_text='Ej: %, °C, pH, ppm, g/L', max_length=20, verbose_name='Unidad')),
                ('decimals', models.PositiveSmallIntegerField(default=2, verbose_name='Decimales')),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Creado por')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Actualizado por')),
                ('deleted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Eliminado por')),
            ],
            options={
                'verbose_name': 'Parámetro de Calidad',
                'verbose_name_plural': 'Parámetros de Calidad',
                'db_table': 'supply_chain_parametro_calidad',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.AddConstraint(
            model_name='parametrocalidad',
            constraint=models.UniqueConstraint(
                condition=models.Q(('is_deleted', False)),
                fields=('code',),
                name='uq_parametro_calidad_code_active',
            ),
        ),

        # ── RangoCalidad ──────────────────────────────────────────────
        migrations.CreateModel(
            name='RangoCalidad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, verbose_name='Eliminado')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de eliminación')),
                ('code', models.CharField(db_index=True, help_text='Ej: TIPO_A, TIPO_B, TIPO_C', max_length=30, verbose_name='Código')),
                ('name', models.CharField(help_text='Ej: Tipo A, Tipo B, Tipo B-II', max_length=100, verbose_name='Nombre')),
                ('min_value', models.DecimalField(decimal_places=4, max_digits=10, verbose_name='Valor mínimo')),
                ('max_value', models.DecimalField(blank=True, decimal_places=4, help_text='Null = sin límite superior', max_digits=10, null=True, verbose_name='Valor máximo')),
                ('color_hex', models.CharField(default='#6B7280', max_length=7, verbose_name='Color')),
                ('order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('parameter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ranges', to='sc_recepcion.parametrocalidad', verbose_name='Parámetro')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Creado por')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Actualizado por')),
                ('deleted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Eliminado por')),
            ],
            options={
                'verbose_name': 'Rango de Calidad',
                'verbose_name_plural': 'Rangos de Calidad',
                'db_table': 'supply_chain_rango_calidad',
                'ordering': ['parameter', 'order'],
            },
        ),

        # ── MedicionCalidad ───────────────────────────────────────────
        migrations.CreateModel(
            name='MedicionCalidad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, verbose_name='Eliminado')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de eliminación')),
                ('measured_value', models.DecimalField(decimal_places=4, max_digits=12, verbose_name='Valor medido')),
                ('measured_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha medición')),
                ('observations', models.TextField(blank=True, default='', verbose_name='Observaciones')),
                ('voucher_line', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='measurements', to='sc_recepcion.voucherlineamp', verbose_name='Línea del voucher')),
                ('parameter', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='measurements', to='sc_recepcion.parametrocalidad', verbose_name='Parámetro')),
                ('classified_range', models.ForeignKey(blank=True, help_text='Auto-calculado al guardar', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='measurements', to='sc_recepcion.rangocalidad', verbose_name='Rango clasificado')),
                ('measured_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='measurements', to=settings.AUTH_USER_MODEL, verbose_name='Medido por')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Creado por')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Actualizado por')),
                ('deleted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Eliminado por')),
            ],
            options={
                'verbose_name': 'Medición de Calidad',
                'verbose_name_plural': 'Mediciones de Calidad',
                'db_table': 'supply_chain_medicion_calidad',
                'ordering': ['-measured_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='medicioncalidad',
            constraint=models.UniqueConstraint(
                condition=models.Q(('is_deleted', False)),
                fields=('voucher_line', 'parameter'),
                name='uq_medicion_linea_parametro_active',
            ),
        ),
    ]
