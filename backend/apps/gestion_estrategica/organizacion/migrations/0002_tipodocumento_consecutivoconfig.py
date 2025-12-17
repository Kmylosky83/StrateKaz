# Generated migration for TipoDocumento and ConsecutivoConfig
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('organizacion', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TipoDocumento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(db_index=True, help_text='Código único del tipo (ej: RECOLECCION, FACTURA)', max_length=30, unique=True, verbose_name='Código')),
                ('name', models.CharField(help_text='Nombre descriptivo (ej: Recolección / Voucher)', max_length=100, verbose_name='Nombre')),
                ('category', models.CharField(choices=[('OPERACIONAL', 'Operacional'), ('NORMATIVO', 'Sistema de Gestión'), ('CALIDAD_SST', 'Calidad y SST'), ('MAESTRO', 'Datos Maestros'), ('ANALISIS', 'Pruebas/Análisis')], db_index=True, default='OPERACIONAL', max_length=20, verbose_name='Categoría')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Descripción')),
                ('is_system', models.BooleanField(default=False, help_text='Los tipos del sistema no pueden eliminarse', verbose_name='Es del sistema')),
                ('is_active', models.BooleanField(db_index=True, default=True, verbose_name='Activo')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Orden')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Tipo de Documento',
                'verbose_name_plural': 'Tipos de Documento',
                'db_table': 'organizacion_tipo_documento',
                'ordering': ['category', 'order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='ConsecutivoConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prefix', models.CharField(help_text='Prefijo del consecutivo (ej: REC, LOT, FAC)', max_length=10, verbose_name='Prefijo')),
                ('suffix', models.CharField(blank=True, max_length=10, null=True, verbose_name='Sufijo')),
                ('current_number', models.IntegerField(default=0, verbose_name='Número Actual')),
                ('padding', models.IntegerField(default=5, help_text='Dígitos con ceros (5 = 00001)', verbose_name='Relleno')),
                ('include_year', models.BooleanField(default=True, verbose_name='Incluir Año')),
                ('include_month', models.BooleanField(default=False, verbose_name='Incluir Mes')),
                ('include_day', models.BooleanField(default=False, verbose_name='Incluir Día')),
                ('separator', models.CharField(choices=[('-', 'Guión (-)'), ('/', 'Diagonal (/)'), ('_', 'Guión bajo (_)'), ('', 'Sin separador')], default='-', max_length=1, verbose_name='Separador')),
                ('include_area', models.BooleanField(default=False, help_text='Si se incluye el código del área en el consecutivo', verbose_name='Incluir Área')),
                ('reset_yearly', models.BooleanField(default=True, verbose_name='Reiniciar Anualmente')),
                ('reset_monthly', models.BooleanField(default=False, verbose_name='Reiniciar Mensualmente')),
                ('last_reset_date', models.DateField(blank=True, null=True, verbose_name='Última Fecha Reinicio')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activo')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('area', models.ForeignKey(blank=True, help_text='Área para incluir en el consecutivo', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='consecutivos', to='organizacion.area', verbose_name='Área/Proceso')),
                ('tipo_documento', models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name='consecutivo_config', to='organizacion.tipodocumento', verbose_name='Tipo de Documento')),
            ],
            options={
                'verbose_name': 'Configuración de Consecutivo',
                'verbose_name_plural': 'Configuraciones de Consecutivos',
                'db_table': 'organizacion_consecutivo_config',
                'ordering': ['tipo_documento__category', 'tipo_documento__name'],
            },
        ),
    ]
