"""
Remove deprecated legacy field iso_standard_legacy from AlcanceSistema.
The norma_iso ForeignKey is the replacement.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('identidad', '0002_delete_politica_especifica'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='alcancesistema',
            name='iso_standard_legacy',
        ),
    ]
