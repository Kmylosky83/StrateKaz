# Generated manually for CargoSectionAccess model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_add_fk_area_sede'),
    ]

    operations = [
        migrations.CreateModel(
            name='CargoSectionAccess',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('granted_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de asignación')),
                ('cargo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='section_accesses', to='core.cargo', verbose_name='Cargo')),
                ('granted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='granted_section_accesses', to=settings.AUTH_USER_MODEL, verbose_name='Asignado por')),
                ('section', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cargo_accesses', to='core.tabsection', verbose_name='Sección')),
            ],
            options={
                'verbose_name': 'Acceso de Cargo a Sección',
                'verbose_name_plural': 'Accesos de Cargo a Secciones',
                'db_table': 'core_cargo_section_access',
                'ordering': ['cargo', 'section'],
                'unique_together': {('cargo', 'section')},
            },
        ),
        migrations.AddIndex(
            model_name='cargosectionaccess',
            index=models.Index(fields=['cargo'], name='core_cargo__cargo_i_idx'),
        ),
        migrations.AddIndex(
            model_name='cargosectionaccess',
            index=models.Index(fields=['section'], name='core_cargo__section_idx'),
        ),
    ]
