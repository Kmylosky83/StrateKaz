"""
Migración para agregar TipoAnalisisPESTEL y cambiar responsable en AnalisisPESTEL.

Cambios:
1. Crea modelo TipoAnalisisPESTEL (catálogo global de tipos de análisis)
2. Agrega FK tipo_analisis en AnalisisPESTEL
3. Cambia responsable de FK a User a FK a Cargo
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('gestion_estrategica_contexto', '0005_add_tipo_analisis_dofa'),
    ]

    operations = [
        # 1. Crear modelo TipoAnalisisPESTEL
        migrations.CreateModel(
            name='TipoAnalisisPESTEL',
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
                    default='Globe2',
                    help_text='Nombre del ícono de Lucide React',
                    max_length=50,
                    verbose_name='Ícono'
                )),
                ('color', models.CharField(
                    blank=True,
                    default='cyan',
                    help_text='Color semántico (cyan, blue, green, etc.)',
                    max_length=20,
                    verbose_name='Color'
                )),
            ],
            options={
                'verbose_name': 'Tipo de Análisis PESTEL',
                'verbose_name_plural': 'Tipos de Análisis PESTEL',
                'db_table': 'contexto_tipo_analisis_pestel',
                'ordering': ['orden', 'nombre'],
            },
        ),
        # 2. Agregar FK tipo_analisis en AnalisisPESTEL
        migrations.AddField(
            model_name='analisispestel',
            name='tipo_analisis',
            field=models.ForeignKey(
                blank=True,
                help_text='Clasificación del tipo de análisis PESTEL',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='analisis',
                to='gestion_estrategica_contexto.tipoanalisispestel',
                verbose_name='Tipo de Análisis',
            ),
        ),
        # 3. Eliminar campo responsable actual (FK a User)
        migrations.RemoveField(
            model_name='analisispestel',
            name='responsable',
        ),
        # 4. Agregar nuevo campo responsable (FK a Cargo)
        migrations.AddField(
            model_name='analisispestel',
            name='responsable',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='pestel_responsable',
                to='core.cargo',
                verbose_name='Cargo Responsable',
            ),
        ),
    ]
