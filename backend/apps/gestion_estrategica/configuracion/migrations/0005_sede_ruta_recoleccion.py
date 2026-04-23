"""
Migración 0005: SedeEmpresa — agrega RUTA_RECOLECCION a tipo_unidad y hace direccion opcional.

Cambios:
  - tipo_unidad: nueva choice RUTA_RECOLECCION ('Ruta de Recolección').
    Solo actualiza el modelo Python; PostgreSQL no valida choices a nivel DDL.
  - direccion: blank=True, default='' para permitir sedes sin dirección física
    (ej: rutas de recolección que no tienen punto fijo).
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0004_alter_sedeempresa_unidad_capacidad'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sedeempresa',
            name='tipo_unidad',
            field=models.CharField(
                choices=[
                    ('SEDE', 'Sede Administrativa'),
                    ('SUCURSAL', 'Sucursal'),
                    ('PLANTA', 'Planta de Producción'),
                    ('CENTRO_ACOPIO', 'Centro de Acopio'),
                    ('ALMACEN', 'Almacén'),
                    ('RUTA_RECOLECCION', 'Ruta de Recolección'),
                    ('OTRO', 'Otro'),
                ],
                default='SEDE',
                max_length=20,
                verbose_name='Tipo de unidad',
                help_text='Rol operativo de esta sede',
            ),
        ),
        migrations.AlterField(
            model_name='sedeempresa',
            name='direccion',
            field=models.TextField(
                blank=True,
                default='',
                verbose_name='Dirección',
                help_text='Dirección física de la sede (opcional para rutas de recolección)',
            ),
        ),
    ]
