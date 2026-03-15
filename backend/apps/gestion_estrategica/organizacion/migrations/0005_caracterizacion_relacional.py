"""
REORG-B5: 9 modelos hijos relacionales para Caracterización SIPOC.

Reemplaza JSONFields con tablas propias para permitir:
- Lookups de PI y Cargo
- Queries cross-module
- Reportes y filtros

JSONFields se mantienen como backup (eliminar en sprint posterior).
"""
from django.db import migrations, models
import django.db.models.deletion


def migrate_json_to_relational(apps, schema_editor):
    """Migra datos de JSONField a modelos hijos."""
    CaracterizacionProceso = apps.get_model('organizacion', 'CaracterizacionProceso')
    CaracterizacionProveedor = apps.get_model('organizacion', 'CaracterizacionProveedor')
    CaracterizacionEntrada = apps.get_model('organizacion', 'CaracterizacionEntrada')
    CaracterizacionActividad = apps.get_model('organizacion', 'CaracterizacionActividad')
    CaracterizacionSalida = apps.get_model('organizacion', 'CaracterizacionSalida')
    CaracterizacionCliente = apps.get_model('organizacion', 'CaracterizacionCliente')
    CaracterizacionRecurso = apps.get_model('organizacion', 'CaracterizacionRecurso')
    CaracterizacionIndicador = apps.get_model('organizacion', 'CaracterizacionIndicador')
    CaracterizacionRiesgo = apps.get_model('organizacion', 'CaracterizacionRiesgo')
    CaracterizacionDocumento = apps.get_model('organizacion', 'CaracterizacionDocumento')

    for caract in CaracterizacionProceso.objects.all():
        # Proveedores
        for i, item in enumerate(caract.proveedores or []):
            if isinstance(item, dict) and item.get('nombre'):
                CaracterizacionProveedor.objects.create(
                    caracterizacion=caract,
                    nombre=item.get('nombre', '')[:255],
                    tipo=item.get('tipo', 'externo')[:10],
                    orden=i,
                )

        # Entradas
        for i, item in enumerate(caract.entradas or []):
            if isinstance(item, dict) and item.get('descripcion'):
                CaracterizacionEntrada.objects.create(
                    caracterizacion=caract,
                    descripcion=item.get('descripcion', '')[:500],
                    origen=item.get('origen', '')[:255],
                    orden=i,
                )

        # Actividades
        for i, item in enumerate(caract.actividades_clave or []):
            if isinstance(item, dict) and item.get('descripcion'):
                CaracterizacionActividad.objects.create(
                    caracterizacion=caract,
                    descripcion=item.get('descripcion', '')[:500],
                    responsable=item.get('responsable', '')[:255],
                    orden=i,
                )

        # Salidas
        for i, item in enumerate(caract.salidas or []):
            if isinstance(item, dict) and item.get('descripcion'):
                CaracterizacionSalida.objects.create(
                    caracterizacion=caract,
                    descripcion=item.get('descripcion', '')[:500],
                    destino=item.get('destino', '')[:255],
                    orden=i,
                )

        # Clientes
        for i, item in enumerate(caract.clientes or []):
            if isinstance(item, dict) and item.get('nombre'):
                CaracterizacionCliente.objects.create(
                    caracterizacion=caract,
                    nombre=item.get('nombre', '')[:255],
                    tipo=item.get('tipo', 'externo')[:10],
                    orden=i,
                )

        # Recursos
        for i, item in enumerate(caract.recursos or []):
            if isinstance(item, dict) and item.get('descripcion'):
                CaracterizacionRecurso.objects.create(
                    caracterizacion=caract,
                    tipo=item.get('tipo', 'humano')[:20],
                    descripcion=item.get('descripcion', '')[:500],
                    orden=i,
                )

        # Indicadores
        for i, item in enumerate(caract.indicadores_vinculados or []):
            if isinstance(item, dict) and item.get('nombre'):
                CaracterizacionIndicador.objects.create(
                    caracterizacion=caract,
                    nombre=item.get('nombre', '')[:255],
                    formula=item.get('formula', '')[:500],
                    meta=item.get('meta', '')[:255],
                    orden=i,
                )

        # Riesgos
        for i, item in enumerate(caract.riesgos_asociados or []):
            if isinstance(item, dict) and item.get('descripcion'):
                CaracterizacionRiesgo.objects.create(
                    caracterizacion=caract,
                    descripcion=item.get('descripcion', '')[:500],
                    nivel=item.get('nivel', 'medio')[:10],
                    tratamiento=item.get('tratamiento', '')[:500],
                    orden=i,
                )

        # Documentos
        for i, item in enumerate(caract.documentos_referencia or []):
            if isinstance(item, dict) and (item.get('codigo') or item.get('nombre')):
                CaracterizacionDocumento.objects.create(
                    caracterizacion=caract,
                    codigo=item.get('codigo', '')[:50],
                    nombre=item.get('nombre', '')[:255],
                    orden=i,
                )


class Migration(migrations.Migration):

    dependencies = [
        ('organizacion', '0004_rename_organizacio_estado_idx_organizacio_estado_6c5e7f_idx_and_more'),
    ]

    operations = [
        # 1. Proveedor
        migrations.CreateModel(
            name='CaracterizacionProveedor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nombre', models.CharField(max_length=255)),
                ('tipo', models.CharField(choices=[('interno', 'Interno'), ('externo', 'Externo')], default='externo', max_length=10)),
                ('parte_interesada_id', models.PositiveBigIntegerField(blank=True, db_index=True, null=True, verbose_name='Parte Interesada')),
                ('parte_interesada_nombre', models.CharField(blank=True, max_length=255)),
                ('caracterizacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='caracterizacionproveedors', to='organizacion.caracterizacionproceso')),
            ],
            options={
                'verbose_name': 'Proveedor SIPOC',
                'db_table': 'organizacion_caract_proveedor',
                'ordering': ['orden', 'id'],
                'abstract': False,
            },
        ),
        # 2. Entrada
        migrations.CreateModel(
            name='CaracterizacionEntrada',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('descripcion', models.CharField(max_length=500)),
                ('origen', models.CharField(blank=True, max_length=255)),
                ('caracterizacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='caracterizacionentradas', to='organizacion.caracterizacionproceso')),
            ],
            options={
                'verbose_name': 'Entrada SIPOC',
                'db_table': 'organizacion_caract_entrada',
                'ordering': ['orden', 'id'],
                'abstract': False,
            },
        ),
        # 3. Actividad
        migrations.CreateModel(
            name='CaracterizacionActividad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('descripcion', models.CharField(max_length=500)),
                ('responsable', models.CharField(blank=True, max_length=255)),
                ('responsable_cargo_id', models.PositiveBigIntegerField(blank=True, db_index=True, null=True, verbose_name='Cargo Responsable')),
                ('responsable_cargo_nombre', models.CharField(blank=True, max_length=255)),
                ('caracterizacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='caracterizacionactividads', to='organizacion.caracterizacionproceso')),
            ],
            options={
                'verbose_name': 'Actividad SIPOC',
                'db_table': 'organizacion_caract_actividad',
                'ordering': ['orden', 'id'],
                'abstract': False,
            },
        ),
        # 4. Salida
        migrations.CreateModel(
            name='CaracterizacionSalida',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('descripcion', models.CharField(max_length=500)),
                ('destino', models.CharField(blank=True, max_length=255)),
                ('caracterizacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='caracterizacionsalidas', to='organizacion.caracterizacionproceso')),
            ],
            options={
                'verbose_name': 'Salida SIPOC',
                'db_table': 'organizacion_caract_salida',
                'ordering': ['orden', 'id'],
                'abstract': False,
            },
        ),
        # 5. Cliente
        migrations.CreateModel(
            name='CaracterizacionCliente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nombre', models.CharField(max_length=255)),
                ('tipo', models.CharField(choices=[('interno', 'Interno'), ('externo', 'Externo')], default='externo', max_length=10)),
                ('parte_interesada_id', models.PositiveBigIntegerField(blank=True, db_index=True, null=True, verbose_name='Parte Interesada')),
                ('parte_interesada_nombre', models.CharField(blank=True, max_length=255)),
                ('caracterizacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='caracterizacionclientes', to='organizacion.caracterizacionproceso')),
            ],
            options={
                'verbose_name': 'Cliente SIPOC',
                'db_table': 'organizacion_caract_cliente',
                'ordering': ['orden', 'id'],
                'abstract': False,
            },
        ),
        # 6. Recurso
        migrations.CreateModel(
            name='CaracterizacionRecurso',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tipo', models.CharField(choices=[('humano', 'Humano'), ('tecnologico', 'Tecnológico'), ('fisico', 'Físico'), ('financiero', 'Financiero')], default='humano', max_length=20)),
                ('descripcion', models.CharField(max_length=500)),
                ('caracterizacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='caracterizacionrecursos', to='organizacion.caracterizacionproceso')),
            ],
            options={
                'verbose_name': 'Recurso',
                'db_table': 'organizacion_caract_recurso',
                'ordering': ['orden', 'id'],
                'abstract': False,
            },
        ),
        # 7. Indicador
        migrations.CreateModel(
            name='CaracterizacionIndicador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nombre', models.CharField(max_length=255)),
                ('formula', models.CharField(blank=True, max_length=500)),
                ('meta', models.CharField(blank=True, max_length=255)),
                ('indicador_id', models.PositiveBigIntegerField(blank=True, db_index=True, null=True, verbose_name='Indicador (Analytics)')),
                ('caracterizacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='caracterizacionindicadors', to='organizacion.caracterizacionproceso')),
            ],
            options={
                'verbose_name': 'Indicador Vinculado',
                'db_table': 'organizacion_caract_indicador',
                'ordering': ['orden', 'id'],
                'abstract': False,
            },
        ),
        # 8. Riesgo
        migrations.CreateModel(
            name='CaracterizacionRiesgo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('descripcion', models.CharField(max_length=500)),
                ('nivel', models.CharField(choices=[('alto', 'Alto'), ('medio', 'Medio'), ('bajo', 'Bajo')], default='medio', max_length=10)),
                ('tratamiento', models.CharField(blank=True, max_length=500)),
                ('riesgo_id', models.PositiveBigIntegerField(blank=True, db_index=True, null=True, verbose_name='Riesgo (Motor Riesgos)')),
                ('caracterizacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='caracterizacionriesgos', to='organizacion.caracterizacionproceso')),
            ],
            options={
                'verbose_name': 'Riesgo Asociado',
                'db_table': 'organizacion_caract_riesgo',
                'ordering': ['orden', 'id'],
                'abstract': False,
            },
        ),
        # 9. Documento
        migrations.CreateModel(
            name='CaracterizacionDocumento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('codigo', models.CharField(max_length=50)),
                ('nombre', models.CharField(max_length=255)),
                ('documento_id', models.PositiveBigIntegerField(blank=True, db_index=True, null=True, verbose_name='Documento (Gestión Documental)')),
                ('caracterizacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='caracterizaciondocumentos', to='organizacion.caracterizacionproceso')),
            ],
            options={
                'verbose_name': 'Documento de Referencia',
                'db_table': 'organizacion_caract_documento',
                'ordering': ['orden', 'id'],
                'abstract': False,
            },
        ),
        # Data migration: JSON → filas
        migrations.RunPython(
            migrate_json_to_relational,
            migrations.RunPython.noop,  # No reverse (JSON fields se mantienen)
        ),
    ]
