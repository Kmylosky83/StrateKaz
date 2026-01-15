# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Agrega campos de Alcance del Sistema Integrado de Gestión (SIG)
    al modelo CorporateIdentity.

    Estos campos permiten definir opcionalmente el alcance general
    del sistema integrado de gestión. El toggle declara_alcance
    controla la visibilidad de esta sección en el frontend.
    """

    dependencies = [
        ('identidad', '0010_consolidate_politicas'),
    ]

    operations = [
        migrations.AddField(
            model_name='corporateidentity',
            name='declara_alcance',
            field=models.BooleanField(
                default=False,
                verbose_name='¿Declara Alcance?',
                help_text='Si es True, muestra la sección de Alcance del Sistema Integrado de Gestión'
            ),
        ),
        migrations.AddField(
            model_name='corporateidentity',
            name='alcance_general',
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name='Alcance General del SIG',
                help_text='Descripción general del alcance del Sistema Integrado de Gestión'
            ),
        ),
        migrations.AddField(
            model_name='corporateidentity',
            name='alcance_geografico',
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name='Cobertura Geográfica',
                help_text='Descripción de la cobertura geográfica del sistema (ej: Colombia, oficinas en Bogotá, Medellín y Cali)'
            ),
        ),
        migrations.AddField(
            model_name='corporateidentity',
            name='alcance_procesos',
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name='Procesos Cubiertos',
                help_text='Descripción de los procesos cubiertos por el sistema de gestión'
            ),
        ),
        migrations.AddField(
            model_name='corporateidentity',
            name='alcance_exclusiones',
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name='Exclusiones Generales',
                help_text='Exclusiones generales del sistema integrado (las exclusiones por norma se gestionan en AlcanceSistema)'
            ),
        ),
    ]
