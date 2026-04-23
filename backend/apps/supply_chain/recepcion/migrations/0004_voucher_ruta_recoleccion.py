"""
Migración 0004: VoucherRecepcion.uneg_transportista → ruta_recoleccion (H-SC-10).

El FK cambia de target (configuracion.SedeEmpresa → catalogos.RutaRecoleccion),
no es un rename simple. Estrategia:

    1. AddField `ruta_recoleccion` FK(catalogos.RutaRecoleccion, null=True).
    2. RunPython: por cada voucher con uneg_transportista apuntando a una
       sede con tipo_unidad='RUTA_RECOLECCION', resolver la RutaRecoleccion
       equivalente (misma codigo). Otros vouchers (uneg_transportista=None o
       apuntando a sede no-ruta) quedan con ruta_recoleccion=None.
    3. RemoveField uneg_transportista.

Depende de catalogos.0005 (backfill) para que las RutaRecoleccion ya existan.
"""
import django.db.models.deletion
from django.db import migrations, models


def map_uneg_to_ruta(apps, schema_editor):
    VoucherRecepcion = apps.get_model('sc_recepcion', 'VoucherRecepcion')
    RutaRecoleccion = apps.get_model('catalogos', 'RutaRecoleccion')

    # Index rutas por codigo (que viene del codigo de la sede origen).
    rutas_por_codigo = {
        r.codigo: r.id
        for r in RutaRecoleccion.objects.all().only('id', 'codigo')
    }

    migrados = 0
    nulos = 0
    for v in VoucherRecepcion.objects.filter(
        uneg_transportista__isnull=False
    ).select_related('uneg_transportista'):
        sede = v.uneg_transportista
        if sede is None or getattr(sede, 'tipo_unidad', None) != 'RUTA_RECOLECCION':
            # Sede no es ruta: dejamos ruta_recoleccion NULL.
            nulos += 1
            continue
        codigo = (sede.codigo or f'RUTA-{sede.pk}').strip()[:50]
        ruta_id = rutas_por_codigo.get(codigo)
        if ruta_id is None:
            # No se encontró mapeo (debería haberlo creado catalogos.0005).
            nulos += 1
            continue
        VoucherRecepcion.objects.filter(pk=v.pk).update(
            ruta_recoleccion_id=ruta_id
        )
        migrados += 1

    print(
        f'\n  [H-SC-10 voucher backfill] migrados a ruta_recoleccion: {migrados} | '
        f'dejados en NULL: {nulos}'
    )


def reverse_noop(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ('sc_recepcion', '0003_voucher_linea_mp'),
        ('catalogos', '0005_backfill_rutas_desde_sedes'),
    ]

    operations = [
        migrations.AddField(
            model_name='voucherrecepcion',
            name='ruta_recoleccion',
            field=models.ForeignKey(
                blank=True,
                help_text=(
                    'Ruta de recolección usada para traer la materia prima. '
                    'Obligatorio cuando modalidad_entrega=RECOLECCION.'
                ),
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='vouchers_recoleccion',
                to='catalogos.rutarecoleccion',
                verbose_name='Ruta de recolección',
            ),
        ),
        migrations.RunPython(map_uneg_to_ruta, reverse_noop),
        migrations.RemoveField(
            model_name='voucherrecepcion',
            name='uneg_transportista',
        ),
    ]
