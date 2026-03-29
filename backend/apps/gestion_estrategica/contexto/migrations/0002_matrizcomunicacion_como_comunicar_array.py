"""
Migración: como_comunicar CharField → ArrayField

Convierte el campo de medio único a lista de medios en MatrizComunicacion.
Los datos existentes se preservan: cada valor 'email' → ['email'].

Índice anterior (empresa, como_comunicar) eliminado.
El filtrado se realiza ahora vía __contains en ORM (no requiere índice B-Tree).
"""
from django.db import migrations, models
import django.contrib.postgres.fields


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_estrategica_contexto', '0001_initial'),
    ]

    operations = [
        # 1. Eliminar el índice B-Tree antiguo sobre como_comunicar
        #    (incompatible con ArrayField; se crearía un GIN si fuera necesario)
        migrations.RemoveIndex(
            model_name='matrizcomunicacion',
            name='contexto_ma_empresa_0d87fa_idx',
        ),

        # 2. Convertir la columna varchar(20) → varchar(20)[] conservando datos
        #    Cada valor existente queda envuelto en un array: 'email' → ['email']
        migrations.RunSQL(
            sql="""
                ALTER TABLE contexto_matriz_comunicacion
                    ALTER COLUMN como_comunicar
                    TYPE varchar(20)[]
                    USING ARRAY[como_comunicar::varchar(20)];
                ALTER TABLE contexto_matriz_comunicacion
                    ALTER COLUMN como_comunicar SET DEFAULT '{}';
            """,
            reverse_sql="""
                ALTER TABLE contexto_matriz_comunicacion
                    ALTER COLUMN como_comunicar SET DEFAULT 'email';
                ALTER TABLE contexto_matriz_comunicacion
                    ALTER COLUMN como_comunicar
                    TYPE varchar(20)
                    USING (como_comunicar[1])::varchar(20);
            """,
        ),

        # 3. Sincronizar el estado de Django con la nueva definición del campo
        migrations.AlterField(
            model_name='matrizcomunicacion',
            name='como_comunicar',
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(
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
                ),
                blank=True,
                default=list,
                help_text='Uno o más medios para esta comunicación (ej: email, reunión, teléfono)',
                size=None,
                verbose_name='Medios de Comunicación',
            ),
        ),
    ]
