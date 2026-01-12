# Generated manually - Add empresa field to CorporateIdentity

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0001_initial'),
        ('identidad', '0003_add_review_date_to_politica_integral'),
    ]

    operations = [
        migrations.AddField(
            model_name='corporateidentity',
            name='empresa',
            field=models.OneToOneField(
                default=1,  # Primera empresa existente
                help_text='Empresa a la que pertenece esta identidad corporativa',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='identidad_corporativa',
                to='configuracion.empresaconfig',
                verbose_name='Empresa',
            ),
            preserve_default=False,
        ),
    ]
