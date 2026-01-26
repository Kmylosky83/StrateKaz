"""
Migración para agregar TipoAnalisisDOFA y FK en AnalisisDOFA.

Cambios:
1. Crea modelo TipoAnalisisDOFA (catálogo global de tipos de análisis)
2. Agrega FK tipo_analisis en AnalisisDOFA
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_estrategica_contexto', '0004_update_matriz_comunicacion'),
    ]

    operations = [
        # 1. Crear modelo TipoAnalisisDOFA
        migrations.CreateModel(
            name='TipoAnalisisDOFA',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True, verbose_name='Activo')),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('orden', models.PositiveIntegerField(default=0, verbose_name='Orden')),
                ('codigo', models.CharField(max_length=20, unique=True, verbose_name='Código')),
                ('nombre', models.CharField(max_length=100, verbose_name='Nombre del Tipo')),
                ('descripcion', models.TextField(
                    blank=True,
                    help_text='Cuándo y para qué se usa este tipo de análisis',
                    verbose_name='Descripción'
                )),
                ('icono', models.CharField(
                    blank=True,
                    default='Grid3X3',
                    help_text='Nombre del ícono de Lucide React',
                    max_length=50,
                    verbose_name='Ícono'
                )),
                ('color', models.CharField(
                    blank=True,
                    default='purple',
                    help_text='Color semántico (purple, blue, green, etc.)',
                    max_length=20,
                    verbose_name='Color'
                )),
            ],
            options={
                'verbose_name': 'Tipo de Análisis DOFA',
                'verbose_name_plural': 'Tipos de Análisis DOFA',
                'db_table': 'contexto_tipo_analisis_dofa',
                'ordering': ['orden', 'nombre'],
            },
        ),
        # 2. Agregar FK tipo_analisis en AnalisisDOFA
        migrations.AddField(
            model_name='analisisdofa',
            name='tipo_analisis',
            field=models.ForeignKey(
                blank=True,
                help_text='Clasificación del tipo de análisis DOFA',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='analisis',
                to='gestion_estrategica_contexto.tipoanalisisdofa',
                verbose_name='Tipo de Análisis',
            ),
        ),
    ]
