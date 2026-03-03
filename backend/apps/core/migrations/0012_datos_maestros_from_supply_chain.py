"""
Migración SeparateDatabaseAndState: TipoDocumentoIdentidad, Departamento, Ciudad

Mueve los modelos de Datos Maestros desde supply_chain.gestion_proveedores
hacia core (C0). Las tablas DB no cambian (mismo db_table).

Solo operación de estado — las tablas ya existen con los nombres originales.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_add_proveedor_fk_to_user'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='TipoDocumentoIdentidad',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('codigo', models.CharField(db_index=True, max_length=20, unique=True, verbose_name='Código')),
                        ('nombre', models.CharField(max_length=100, verbose_name='Nombre')),
                        ('orden', models.PositiveIntegerField(default=0)),
                        ('is_active', models.BooleanField(db_index=True, default=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                    ],
                    options={
                        'verbose_name': 'Tipo de Documento de Identidad',
                        'verbose_name_plural': 'Tipos de Documento de Identidad',
                        'db_table': 'supply_chain_tipo_documento_identidad',
                        'ordering': ['orden', 'nombre'],
                    },
                ),
                migrations.CreateModel(
                    name='Departamento',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('codigo', models.CharField(db_index=True, help_text='Código del departamento (ej: ANTIOQUIA)', max_length=50, unique=True, verbose_name='Código')),
                        ('nombre', models.CharField(max_length=100, verbose_name='Nombre')),
                        ('codigo_dane', models.CharField(blank=True, max_length=10, null=True, verbose_name='Código DANE')),
                        ('orden', models.PositiveIntegerField(default=0)),
                        ('is_active', models.BooleanField(db_index=True, default=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                    ],
                    options={
                        'verbose_name': 'Departamento',
                        'verbose_name_plural': 'Departamentos',
                        'db_table': 'supply_chain_departamento',
                        'ordering': ['orden', 'nombre'],
                    },
                ),
                migrations.CreateModel(
                    name='Ciudad',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('departamento', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='ciudades', to='core.departamento', verbose_name='Departamento')),
                        ('codigo', models.CharField(db_index=True, max_length=50, unique=True, verbose_name='Código')),
                        ('nombre', models.CharField(max_length=100, verbose_name='Nombre')),
                        ('codigo_dane', models.CharField(blank=True, max_length=10, null=True, verbose_name='Código DANE')),
                        ('es_capital', models.BooleanField(default=False)),
                        ('orden', models.PositiveIntegerField(default=0)),
                        ('is_active', models.BooleanField(db_index=True, default=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                    ],
                    options={
                        'verbose_name': 'Ciudad',
                        'verbose_name_plural': 'Ciudades',
                        'db_table': 'supply_chain_ciudad',
                        'ordering': ['departamento__nombre', 'nombre'],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
