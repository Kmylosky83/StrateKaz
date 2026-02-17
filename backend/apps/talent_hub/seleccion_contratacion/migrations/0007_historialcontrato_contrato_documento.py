"""
Sprint 20: Agregar FK contrato_documento para integración TH ↔ GD.
Permite vincular un HistorialContrato con su Documento generado en el Gestor Documental.
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('seleccion_contratacion', '0006_add_cargo_fk_and_posiciones_cubiertas'),
        ('gestion_documental', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='historialcontrato',
            name='contrato_documento',
            field=models.ForeignKey(
                blank=True,
                help_text='Documento de contrato generado en el Gestor Documental',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='contratos_laborales',
                to='gestion_documental.documento',
                verbose_name='Documento del Contrato',
            ),
        ),
    ]
