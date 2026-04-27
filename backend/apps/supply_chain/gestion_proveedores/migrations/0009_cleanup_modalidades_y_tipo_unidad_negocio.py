"""
Migración 0009: cleanup catálogos `ModalidadLogistica` y `TipoProveedor`
(H-SC-CAT-MODALIDAD + H-SC-CAT-TIPO-PROV — Agente A4, 2026-04-27).

Cambios:

1. ModalidadLogistica
   - Reasigna proveedores y precios apuntando a TRANSPORTE_PROPIO o
     TRANSPORTE_TERCERO -> COMPRA_PUNTO (la empresa recoge).
   - Reasigna proveedores y precios apuntando a ENVIO_NACIONAL ->
     ENTREGA_PLANTA (un tercero entrega en planta).
   - Marca las 3 modalidades sobrantes como is_active=False y, si no quedan
     refs, las elimina físicamente.

2. TipoProveedor
   - Reasigna proveedores con tipo=UNIDAD_NEGOCIO -> MATERIA_PRIMA
     (las "unidades de negocio" hoy operan como recolectoras/centros de
     acopio internos: clasifican como MP).
   - Marca UNIDAD_NEGOCIO is_active=False y, si no quedan refs, lo elimina.

Reversible: el reverse_sql restaura las filas inactivas (no podemos
recuperar el mapeo histórico de proveedores/precios; el reverso documenta
que es parcial).
"""
from django.db import migrations


# ============================================================================
# MODALIDAD LOGISTICA
# ============================================================================

# Mapeo: código deprecado -> código destino
MODALIDAD_REMAP = {
    'TRANSPORTE_PROPIO': 'COMPRA_PUNTO',
    'TRANSPORTE_TERCERO': 'COMPRA_PUNTO',
    'ENVIO_NACIONAL': 'ENTREGA_PLANTA',
}


def cleanup_modalidades(apps, schema_editor):
    ModalidadLogistica = apps.get_model('gestion_proveedores', 'ModalidadLogistica')
    Proveedor = apps.get_model('catalogo_productos', 'Proveedor')
    PrecioMateriaPrima = apps.get_model('gestion_proveedores', 'PrecioMateriaPrima')

    # Index por código
    modalidades_por_codigo = {
        m.codigo: m for m in ModalidadLogistica.objects.all()
    }

    proveedores_remap = 0
    precios_remap = 0
    desactivadas = 0
    eliminadas = 0

    for codigo_origen, codigo_destino in MODALIDAD_REMAP.items():
        origen = modalidades_por_codigo.get(codigo_origen)
        destino = modalidades_por_codigo.get(codigo_destino)
        if origen is None:
            # Catálogo no tenía este código (tenant nuevo) — skip silencioso.
            continue
        if destino is None:
            # Inconsistencia: no podemos remapear sin destino. Dejamos la
            # modalidad activa para no perder data; un re-seed la repara.
            print(
                f'  [WARN] Destino "{codigo_destino}" no existe; no se '
                f'remapea {codigo_origen}.'
            )
            continue

        n_prov = Proveedor.objects.filter(modalidad_logistica=origen).update(
            modalidad_logistica=destino
        )
        n_prec = PrecioMateriaPrima.objects.filter(modalidad_logistica=origen).update(
            modalidad_logistica=destino
        )
        proveedores_remap += n_prov
        precios_remap += n_prec

        # Si después del remap no quedan refs, eliminamos físicamente.
        usado = (
            Proveedor.objects.filter(modalidad_logistica=origen).exists()
            or PrecioMateriaPrima.objects.filter(modalidad_logistica=origen).exists()
        )
        if usado:
            origen.is_active = False
            origen.save(update_fields=['is_active'])
            desactivadas += 1
        else:
            origen.delete()
            eliminadas += 1

    print(
        f'  [ModalidadLogistica cleanup] Proveedores remapeados: {proveedores_remap} | '
        f'Precios remapeados: {precios_remap} | Desactivadas: {desactivadas} | '
        f'Eliminadas: {eliminadas}'
    )


def restore_modalidades(apps, schema_editor):
    """Reverso parcial: re-crea las filas inactivas con descripciones del seed.
    No restaura el mapeo de proveedores/precios (no se conserva)."""
    ModalidadLogistica = apps.get_model('gestion_proveedores', 'ModalidadLogistica')
    restaurar = [
        {'codigo': 'TRANSPORTE_PROPIO', 'nombre': 'Transporte Propio',
         'descripcion': 'Transporte con vehículos propios de la empresa', 'orden': 3},
        {'codigo': 'TRANSPORTE_TERCERO', 'nombre': 'Transporte Tercero',
         'descripcion': 'Transporte mediante transportista contratado', 'orden': 4},
        {'codigo': 'ENVIO_NACIONAL', 'nombre': 'Envío Nacional',
         'descripcion': 'Despacho por empresa de mensajería o carga', 'orden': 5},
    ]
    for item in restaurar:
        ModalidadLogistica.objects.update_or_create(
            codigo=item['codigo'],
            defaults={**item, 'is_active': True},
        )


# ============================================================================
# TIPO PROVEEDOR
# ============================================================================


def cleanup_tipo_unidad_negocio(apps, schema_editor):
    TipoProveedor = apps.get_model('catalogo_productos', 'TipoProveedor')
    Proveedor = apps.get_model('catalogo_productos', 'Proveedor')

    origen = TipoProveedor.objects.filter(codigo='UNIDAD_NEGOCIO').first()
    if origen is None:
        # Catálogo nunca tuvo este código — skip silencioso.
        return

    destino = TipoProveedor.objects.filter(codigo='MATERIA_PRIMA').first()
    if destino is None:
        print(
            '  [WARN] Destino "MATERIA_PRIMA" no existe; no se remapea '
            'UNIDAD_NEGOCIO.'
        )
        return

    n = Proveedor.objects.filter(tipo_proveedor=origen).update(
        tipo_proveedor=destino
    )
    if Proveedor.objects.filter(tipo_proveedor=origen).exists():
        origen.is_active = False
        origen.save(update_fields=['is_active'])
        accion = 'desactivado'
    else:
        origen.delete()
        accion = 'eliminado'

    print(
        f'  [TipoProveedor cleanup] UNIDAD_NEGOCIO {accion}. '
        f'Proveedores remapeados a MATERIA_PRIMA: {n}'
    )


def restore_tipo_unidad_negocio(apps, schema_editor):
    """Reverso parcial: re-crea la fila si fue eliminada. No restaura el
    mapeo de proveedores."""
    TipoProveedor = apps.get_model('catalogo_productos', 'TipoProveedor')
    TipoProveedor.objects.update_or_create(
        codigo='UNIDAD_NEGOCIO',
        defaults={
            'nombre': 'Unidad de Negocio',
            'descripcion': 'Proveedor que es una unidad de negocio propia o filial',
            'requiere_materia_prima': True,
            'requiere_modalidad_logistica': True,
            'tipos_productos_permitidos': ['MATERIA_PRIMA', 'PRODUCTO_TERMINADO'],
            'orden': 3,
            'is_active': True,
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_proveedores', '0008_preciomateriaprima_modalidad_logistica'),
        ('catalogo_productos', '0021_alter_proveedor_ruta_origen'),
    ]

    operations = [
        migrations.RunPython(cleanup_modalidades, restore_modalidades),
        migrations.RunPython(cleanup_tipo_unidad_negocio, restore_tipo_unidad_negocio),
    ]
