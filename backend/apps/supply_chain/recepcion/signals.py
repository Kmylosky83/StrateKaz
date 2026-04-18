"""
Signals de Recepción — Supply Chain

Cuando un VoucherRecepcion pasa a estado APROBADO se genera
automáticamente un MovimientoInventario de tipo ENTRADA y se actualiza
(o crea) el Inventario del almacén destino.

El signal es idempotente: el filtro por (origen_tipo='VoucherRecepcion',
origen_id=voucher.pk) garantiza que aprobar dos veces no duplique.
"""
import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.supply_chain.recepcion.models import VoucherRecepcion

logger = logging.getLogger(__name__)


@receiver(post_save, sender=VoucherRecepcion)
def crear_movimiento_inventario_al_aprobar(sender, instance, **kwargs):
    """
    Post-save handler: si el voucher está APROBADO y no existe un
    MovimientoInventario asociado, lo crea y actualiza el Inventario.

    Todo va en transaction.atomic() como savepoint defensivo — la save()
    del voucher ya está en transacción, esto aísla errores del signal.
    """
    if instance.estado != VoucherRecepcion.EstadoVoucher.APROBADO:
        return

    # Import tardío para evitar circular imports al cargar apps.ready()
    from apps.supply_chain.almacenamiento.models import (
        EstadoInventario,
        Inventario,
        MovimientoInventario,
        TipoMovimientoInventario,
    )

    # Idempotencia
    if MovimientoInventario.objects.filter(
        origen_tipo='VoucherRecepcion',
        origen_id=instance.pk,
    ).exists():
        return

    # Catálogos base requeridos (deben existir en seeds del tenant)
    try:
        tipo_entrada = TipoMovimientoInventario.objects.get(codigo='ENTRADA')
        estado_disponible = EstadoInventario.objects.get(codigo='DISPONIBLE')
    except (TipoMovimientoInventario.DoesNotExist, EstadoInventario.DoesNotExist):
        logger.error(
            "No se pudo crear MovimientoInventario para VoucherRecepcion %s: "
            "faltan catálogos TipoMovimiento(ENTRADA) o EstadoInventario(DISPONIBLE).",
            instance.pk,
        )
        return

    with transaction.atomic():
        MovimientoInventario.objects.create(
            almacen_destino=instance.almacen_destino,
            tipo_movimiento=tipo_entrada,
            fecha_movimiento=instance.created_at,
            producto=instance.producto,
            lote=str(instance.pk),
            cantidad=instance.peso_neto_kg,
            unidad_medida=instance.producto.unidad_medida,
            costo_unitario=instance.precio_kg_snapshot,
            documento_referencia=f'VOUCHER-{instance.pk}',
            origen_tipo='VoucherRecepcion',
            origen_id=instance.pk,
            registrado_por=instance.operador_bascula,
            observaciones=(
                f'Movimiento generado automáticamente al aprobar '
                f'voucher #{instance.pk}.'
            ),
        )

        inventario, created = Inventario.objects.get_or_create(
            almacen=instance.almacen_destino,
            producto=instance.producto,
            lote=str(instance.pk),
            estado=estado_disponible,
            defaults={
                'cantidad_disponible': instance.peso_neto_kg,
                'unidad_medida': instance.producto.unidad_medida,
                'costo_unitario': instance.precio_kg_snapshot,
                'costo_promedio': instance.precio_kg_snapshot,
            },
        )

        if not created:
            inventario.actualizar_costo_promedio(
                instance.peso_neto_kg,
                instance.precio_kg_snapshot,
            )
            inventario.cantidad_disponible += instance.peso_neto_kg
            inventario.save()
