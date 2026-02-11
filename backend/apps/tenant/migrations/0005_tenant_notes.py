"""
Add notes field to Tenant model.
Notas internas solo visibles para superadmins.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenant', '0004_migrate_branding_from_legacy'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='notes',
            field=models.TextField(
                blank=True,
                default='',
                help_text='Notas internas sobre esta empresa (solo superadmins)',
                verbose_name='Notas internas',
            ),
        ),
    ]
