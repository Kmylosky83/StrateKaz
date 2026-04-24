"""
Signals de Recepción — Supply Chain

Cuando un VoucherRecepcion pasa a estado APROBADO se genera
automáticamente un MovimientoInventario de tipo ENTRADA y se actualiza
(o crea) el Inventario del almacén destino, una vez por cada VoucherLineaMP.

Los signals son idempotentes: el filtro por (origen_tipo='VoucherLineaMP',
origen_id=linea.pk) garantiza que aprobar dos veces no duplique.
"""
import logging
from decimal import Decimal

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.supply_chain.recepcion.models import VoucherRecepcion

logger = logging.getLogger(__name__)


@receiver(post_save, sender=VoucherRecepcion)
def crear_movimiento_inventario_al_aprobar(sender, instance, **kwargs):
    """
    Post-save handler: si el voucher está APROBADO crea un
    MovimientoInventario e Inventario por cada VoucherLineaMP.

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

    for linea in instance.lineas.select_related('producto__unidad_medida').all():
        # Idempotencia por línea
        if MovimientoInventario.objects.filter(
            origen_tipo='VoucherLineaMP',
            origen_id=linea.pk,
        ).exists():
            continue

        try:
            with transaction.atomic():
                unidad = getattr(linea.producto, 'unidad_medida', None)
                MovimientoInventario.objects.create(
                    almacen_destino=instance.almacen_destino,
                    tipo_movimiento=tipo_entrada,
                    fecha_movimiento=instance.created_at,
                    producto=linea.producto,
                    lote=str(instance.pk),
                    cantidad=linea.peso_neto_kg,
                    unidad_medida=unidad,
                    costo_unitario=Decimal('0.00'),
                    documento_referencia=f'VOUCHER-{instance.pk}-L{linea.pk}',
                    origen_tipo='VoucherLineaMP',
                    origen_id=linea.pk,
                    registrado_por=instance.operador_bascula,
                    observaciones=(
                        f'Movimiento generado automáticamente al aprobar '
                        f'voucher #{instance.pk}, línea #{linea.pk}.'
                    ),
                )

                inventario, created = Inventario.objects.get_or_create(
                    almacen=instance.almacen_destino,
                    producto=linea.producto,
                    lote=str(instance.pk),
                    estado=estado_disponible,
                    defaults={
                        'cantidad_disponible': linea.peso_neto_kg,
                        'unidad_medida': unidad,
                        'costo_unitario': Decimal('0.00'),
                        'costo_promedio': Decimal('0.00'),
                    },
                )

                if not created:
                    inventario.cantidad_disponible += linea.peso_neto_kg
                    inventario.save()

        except Exception:
            logger.error(
                'Error creando MovimientoInventario para VoucherLineaMP %s',
                linea.pk,
                exc_info=True,
            )


@receiver(post_save, sender=VoucherRecepcion)
def crear_liquidacion_al_aprobar(sender, instance, **kwargs):
    """
    Post-save handler: si el voucher está APROBADO crea UNA Liquidacion
    (header) con N líneas de detalle (una por cada VoucherLineaMP).

    Idempotente: Liquidacion.desde_voucher() retorna la existente si ya
    fue creada. Si el QC dio CONDICIONAL se añade nota en observaciones;
    el ajuste porcentual por línea lo fija el usuario manualmente desde
    LiquidacionesTab.
    """
    if instance.estado != VoucherRecepcion.EstadoVoucher.APROBADO:
        return

    # Import tardío para evitar circular imports al cargar apps.ready()
    from apps.supply_chain.liquidaciones.models import Liquidacion

    # Detectar QC CONDICIONAL para agregar nota en observaciones
    observaciones = ''
    try:
        tiene_qc_condicional = (
            instance.tiene_qc
            and hasattr(instance, 'calidad')
            and instance.calidad.resultado == 'CONDICIONAL'
        )
    except Exception:
        tiene_qc_condicional = False

    if tiene_qc_condicional:
        observaciones = (
            'QC CONDICIONAL: revisar ajuste de precio antes de aprobar.'
        )

    try:
        with transaction.atomic():
            liq = Liquidacion.desde_voucher(
                voucher=instance,
                observaciones=observaciones,
            )
            logger.info(
                'Liquidacion %s creada/obtenida para VoucherRecepcion %s',
                liq.pk,
                instance.pk,
            )
    except Exception:
        logger.error(
            'No se pudo crear Liquidacion para VoucherRecepcion %s.',
            instance.pk,
            exc_info=True,
        )
