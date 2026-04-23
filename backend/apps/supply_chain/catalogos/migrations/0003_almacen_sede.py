"""
Agrega FK Almacen.sede -> configuracion.SedeEmpresa (H-SC-07).

Contexto
--------
Los almacenes físicos deben pertenecer a una sede para permitir filtrado
por sede del operador al recibir voucher (request.user.sede_asignada).

Operación
---------
- AddField nullable para permitir backfill y compat con tenants sin sede.
- RunPython backfill: si el tenant tiene una SedeEmpresa.es_sede_principal=True,
  se asigna como sede por defecto a todos los Almacenes que aún no tengan sede.
  Si no existe sede principal, los Almacenes quedan con sede=NULL (se asignan
  manualmente cuando el tenant cree su primera sede).

Reversibilidad
--------------
- Forward: backfill idempotente (solo toca almacenes con sede=None).
- Reverse: noop en datos; Django removerá el campo al deshacer AddField.
"""
from django.db import migrations, models


def backfill_sede_almacen(apps, schema_editor):
    Almacen = apps.get_model('catalogos', 'Almacen')
    SedeEmpresa = apps.get_model('configuracion', 'SedeEmpresa')

    sede_principal = SedeEmpresa.objects.filter(
        es_sede_principal=True
    ).first()
    if sede_principal is None:
        return

    Almacen.objects.filter(sede__isnull=True).update(sede=sede_principal)


def reverse_backfill(apps, schema_editor):
    # Irreversible a nivel de datos: no intentamos reconstruir el estado
    # previo (que era sede=NULL para todos). El reverse del AddField elimina
    # la columna de todas formas.
    return


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0002_drop_unidad_medida_huerfana'),
        ('configuracion', '0005_sede_ruta_recoleccion'),
    ]

    operations = [
        migrations.AddField(
            model_name='almacen',
            name='sede',
            field=models.ForeignKey(
                blank=True,
                help_text='Sede física donde vive este almacén',
                null=True,
                on_delete=models.deletion.PROTECT,
                related_name='almacenes',
                to='configuracion.sedeempresa',
                verbose_name='Sede',
            ),
        ),
        migrations.RunPython(backfill_sede_almacen, reverse_backfill),
    ]
