"""
Data migration: Standardize SystemModule categories to English.

Mapping:
    ESTRATEGICO  -> STRATEGIC
    CUMPLIMIENTO -> COMPLIANCE
    MOTOR        -> COMPLIANCE
    INTEGRAL     -> INTEGRATED
    OPERATIVO    -> OPERATIONAL
    MISIONAL     -> OPERATIONAL
    SOPORTE      -> SUPPORT
    APOYO        -> SUPPORT
    INTELIGENCIA -> INTELLIGENCE
"""
from django.db import migrations, models


def standardize_categories_forward(apps, schema_editor):
    SystemModule = apps.get_model('core', 'SystemModule')

    mapping = {
        'ESTRATEGICO': 'STRATEGIC',
        'CUMPLIMIENTO': 'COMPLIANCE',
        'MOTOR': 'COMPLIANCE',
        'INTEGRAL': 'INTEGRATED',
        'OPERATIVO': 'OPERATIONAL',
        'MISIONAL': 'OPERATIONAL',
        'SOPORTE': 'SUPPORT',
        'APOYO': 'SUPPORT',
        'INTELIGENCIA': 'INTELLIGENCE',
    }

    for old_value, new_value in mapping.items():
        SystemModule.objects.filter(category=old_value).update(category=new_value)


def standardize_categories_reverse(apps, schema_editor):
    SystemModule = apps.get_model('core', 'SystemModule')

    reverse_mapping = {
        'STRATEGIC': 'ESTRATEGICO',
        'COMPLIANCE': 'CUMPLIMIENTO',
        'INTEGRATED': 'INTEGRAL',
        'OPERATIONAL': 'OPERATIVO',
        'SUPPORT': 'SOPORTE',
        'INTELLIGENCE': 'INTELIGENCIA',
    }

    for old_value, new_value in reverse_mapping.items():
        SystemModule.objects.filter(category=old_value).update(category=new_value)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_remove_branding_config'),
    ]

    operations = [
        # First update existing data to new values
        migrations.RunPython(
            standardize_categories_forward,
            standardize_categories_reverse,
        ),
        # Then alter the field to only accept new choices
        migrations.AlterField(
            model_name='systemmodule',
            name='category',
            field=models.CharField(
                choices=[
                    ('STRATEGIC', 'Nivel Estrategico'),
                    ('COMPLIANCE', 'Motores del Sistema'),
                    ('INTEGRATED', 'Gestion Integral'),
                    ('OPERATIONAL', 'Nivel Misional'),
                    ('SUPPORT', 'Nivel de Apoyo'),
                    ('INTELLIGENCE', 'Inteligencia de Negocio'),
                ],
                db_index=True,
                max_length=20,
                verbose_name='Categoria',
            ),
        ),
    ]
