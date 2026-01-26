"""
Migración para actualizar MatrizComunicacion.

Cambios:
1. Responsable: FK a User → FK a Cargo (más estable organizacionalmente)
2. Normas: campos booleanos hardcodeados → ManyToMany con NormaISO (dinámico)
3. Nuevos medios de comunicación: videoconferencia, whatsapp, capacitacion
4. Nuevos campos: es_obligatoria, observaciones
5. Elimina campos legacy: aplica_sst, aplica_ambiental, aplica_calidad, aplica_pesv
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('configuracion', '0001_initial'),
        ('gestion_estrategica_contexto', '0003_alter_analisisdofa_responsable_to_cargo'),
    ]

    operations = [
        # 1. Eliminar campo responsable actual (FK a User)
        migrations.RemoveField(
            model_name='matrizcomunicacion',
            name='responsable',
        ),
        # 2. Agregar nuevo campo responsable (FK a Cargo)
        migrations.AddField(
            model_name='matrizcomunicacion',
            name='responsable',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='comunicaciones_responsable',
                to='core.cargo',
                verbose_name='Cargo Responsable',
            ),
        ),
        # 3. Agregar campo ManyToMany con NormaISO
        migrations.AddField(
            model_name='matrizcomunicacion',
            name='normas_aplicables',
            field=models.ManyToManyField(
                blank=True,
                help_text='Normas ISO o sistemas de gestión a los que aplica esta comunicación',
                related_name='comunicaciones_matriz',
                to='configuracion.normaiso',
                verbose_name='Normas/Sistemas Aplicables',
            ),
        ),
        # 4. Agregar campo es_obligatoria
        migrations.AddField(
            model_name='matrizcomunicacion',
            name='es_obligatoria',
            field=models.BooleanField(
                default=False,
                help_text='Indica si esta comunicación es de carácter obligatorio',
                verbose_name='Comunicación Obligatoria',
            ),
        ),
        # 5. Agregar campo observaciones
        migrations.AddField(
            model_name='matrizcomunicacion',
            name='observaciones',
            field=models.TextField(blank=True, verbose_name='Observaciones'),
        ),
        # 6. Eliminar campos booleanos legacy
        migrations.RemoveField(
            model_name='matrizcomunicacion',
            name='aplica_sst',
        ),
        migrations.RemoveField(
            model_name='matrizcomunicacion',
            name='aplica_ambiental',
        ),
        migrations.RemoveField(
            model_name='matrizcomunicacion',
            name='aplica_calidad',
        ),
        migrations.RemoveField(
            model_name='matrizcomunicacion',
            name='aplica_pesv',
        ),
        # 7. Actualizar choices de como_comunicar (agregar nuevos medios)
        migrations.AlterField(
            model_name='matrizcomunicacion',
            name='como_comunicar',
            field=models.CharField(
                choices=[
                    ('email', 'Correo Electrónico'),
                    ('reunion', 'Reunión Presencial'),
                    ('videoconferencia', 'Videoconferencia'),
                    ('informe', 'Informe Escrito'),
                    ('cartelera', 'Cartelera/Mural'),
                    ('intranet', 'Intranet/Portal'),
                    ('telefono', 'Teléfono'),
                    ('whatsapp', 'WhatsApp/Mensajería'),
                    ('redes', 'Redes Sociales'),
                    ('capacitacion', 'Capacitación/Charla'),
                    ('otro', 'Otro'),
                ],
                max_length=20,
                verbose_name='Medio de Comunicación',
            ),
        ),
        # 8. Agregar índice para como_comunicar
        migrations.AddIndex(
            model_name='matrizcomunicacion',
            index=models.Index(fields=['empresa', 'como_comunicar'], name='contexto_ma_empresa_b8c5f1_idx'),
        ),
    ]
