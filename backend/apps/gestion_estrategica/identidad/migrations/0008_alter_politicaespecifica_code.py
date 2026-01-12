# Generated migration for making code field optional and adding documento_id
# El código oficial es asignado por el Gestor Documental, no por Identidad

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('identidad', '0007_add_workflow_firma_models'),
    ]

    operations = [
        # Hacer el campo code opcional (blank=True, null=True)
        # El código oficial lo asigna el Gestor Documental después de publicar
        migrations.AlterField(
            model_name='politicaespecifica',
            name='code',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=50,
                verbose_name='Código',
                help_text='Código oficial asignado por Gestor Documental (ej: POL-SST-001). NULL hasta publicación.'
            ),
        ),
        # Agregar campo documento_id para referenciar al documento en Gestor Documental
        # Usamos IntegerField en lugar de FK para evitar dependencia circular
        migrations.AddField(
            model_name='politicaespecifica',
            name='documento_id',
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                verbose_name='ID Documento',
                help_text='ID del documento en Gestor Documental (referencia sin FK para evitar dependencia circular)'
            ),
        ),
    ]
