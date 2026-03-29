"""
Migración: eliminar campos de acceso público de encuestas

Las encuestas de contexto (PCI-POAM y libre) son exclusivamente internas.
El acceso público (token, es_publica) corresponde a portales externos futuros
(proveedores, clientes) que tendrán sus propios modelos.

Campos eliminados de EncuestaDofa:
- token_publico (UUIDField)
- es_publica (BooleanField)
- Índice sobre token_publico

Campos eliminados de RespuestaEncuesta:
- token_anonimo (CharField)
- ip_address (GenericIPAddressField)
- user_agent (TextField)
- Índice sobre token_anonimo
- Constraint unique_respuesta_anonimo_tema

RespuestaEncuesta.respondente: SET_NULL → CASCADE (siempre autenticado)
UniqueConstraint: condición isnull=False ya no aplica (respondente siempre presente)
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('encuestas', '0001_initial'),
    ]

    operations = [
        # --- EncuestaDofa ---
        migrations.RemoveIndex(
            model_name='encuestadofa',
            name='encuestas_d_token_p_2c1d4d_idx',
        ),
        migrations.RemoveField(
            model_name='encuestadofa',
            name='token_publico',
        ),
        migrations.RemoveField(
            model_name='encuestadofa',
            name='es_publica',
        ),

        # --- RespuestaEncuesta ---
        migrations.RemoveIndex(
            model_name='respuestaencuesta',
            name='encuestas_r_token_a_8a96cf_idx',
        ),
        migrations.RemoveConstraint(
            model_name='respuestaencuesta',
            name='unique_respuesta_anonimo_tema',
        ),
        migrations.RemoveConstraint(
            model_name='respuestaencuesta',
            name='unique_respuesta_usuario_tema',
        ),
        migrations.RemoveField(
            model_name='respuestaencuesta',
            name='token_anonimo',
        ),
        migrations.RemoveField(
            model_name='respuestaencuesta',
            name='ip_address',
        ),
        migrations.RemoveField(
            model_name='respuestaencuesta',
            name='user_agent',
        ),
        # respondente: SET_NULL + null=True → CASCADE + null=False
        # Primero eliminar nulls si los hubiera (datos de prueba), luego alterar
        migrations.RunSQL(
            sql="UPDATE encuestas_respuesta SET respondente_id = (SELECT id FROM core_user LIMIT 1) WHERE respondente_id IS NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name='respuestaencuesta',
            name='respondente',
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                related_name='respuestas_encuesta_dofa',
                to='core.user',
                verbose_name='Respondente',
            ),
        ),
        # Re-crear constraint sin condición isnull
        migrations.AddConstraint(
            model_name='respuestaencuesta',
            constraint=models.UniqueConstraint(
                fields=['tema', 'respondente'],
                name='unique_respuesta_usuario_tema',
            ),
        ),
    ]
