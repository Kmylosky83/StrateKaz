"""
Migración 0010: Corrige fecha_creacion en Documento.

Problema: auto_now_add=True en DateField usa datetime.date.today() que toma
el timezone del OS (UTC en VPS Hostinger), causando que documentos creados
entre las 19:00-23:59 hora colombiana (UTC-5) se registren con un día más.

Fix: default=timezone.localdate respeta TIME_ZONE='America/Bogota' de Django.

Los registros existentes NO se modifican (auto_now_add no tiene default en DB,
por lo que no hay default que cambiar — el campo sigue siendo NOT NULL pero
Django manejará el default en application level).
"""
from django.db import migrations
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_documental', '0009_add_nivel_seguridad_firma_to_tipo_documento'),
    ]

    operations = [
        migrations.AlterField(
            model_name='documento',
            name='fecha_creacion',
            field=django.db.models.DateField(
                default=django.utils.timezone.localdate,
                editable=False,
                verbose_name='Fecha de Creación',
            ),
        ),
    ]
