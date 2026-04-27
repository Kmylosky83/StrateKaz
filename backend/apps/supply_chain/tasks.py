"""
Tasks Celery del módulo Supply Chain.

H-SC-06 — Agregación periódica de liquidaciones por proveedor.

Cada lunes a las 06:00 (America/Bogota) la task corre por cada proveedor con
`frecuencia_pago` distinta de INMEDIATA, agrupa las Liquidaciones APROBADAS
del período correspondiente y crea/actualiza una `LiquidacionPeriodica` en
estado BORRADOR para revisión humana antes de pagar.
"""
from datetime import date, timedelta

from celery import shared_task
from django.apps import apps


@shared_task(name='supply_chain.generar_liquidaciones_periodicas_borrador')
def generar_liquidaciones_periodicas_borrador():
    """Genera/actualiza borradores LiquidacionPeriodica del período vigente.

    Política:
    - SEMANAL: últimos 7 días.
    - QUINCENAL: últimos 15 días.
    - MENSUAL: mes calendario anterior.
    - INMEDIATA: se omite (cada Liquidacion individual es la unidad de pago).

    Solo se incluyen Liquidaciones APROBADAS del período que aún no estén
    asociadas a alguna LiquidacionPeriodica (M2M `periodicas` vacío).
    """
    from apps.supply_chain.liquidaciones.models import (
        Liquidacion,
        LiquidacionPeriodica,
    )

    Proveedor = apps.get_model('catalogo_productos', 'Proveedor')

    hoy = date.today()
    proveedores = Proveedor.objects.exclude(frecuencia_pago='INMEDIATA').filter(
        is_active=True,
    )
    creados = 0

    for proveedor in proveedores:
        if proveedor.frecuencia_pago == 'SEMANAL':
            inicio = hoy - timedelta(days=7)
        elif proveedor.frecuencia_pago == 'QUINCENAL':
            inicio = hoy - timedelta(days=15)
        elif proveedor.frecuencia_pago == 'MENSUAL':
            primer_dia_mes = hoy.replace(day=1)
            ultimo_dia_anterior = primer_dia_mes - timedelta(days=1)
            inicio = ultimo_dia_anterior.replace(day=1)
        else:
            continue

        liquidaciones_periodo = Liquidacion.objects.filter(
            voucher__proveedor=proveedor,
            estado='APROBADA',
            fecha_aprobacion__date__gte=inicio,
            fecha_aprobacion__date__lte=hoy,
            periodicas__isnull=True,
        )

        if not liquidaciones_periodo.exists():
            continue

        periodica, _ = LiquidacionPeriodica.objects.get_or_create(
            proveedor=proveedor,
            periodo_inicio=inicio,
            periodo_fin=hoy,
            defaults={'frecuencia': proveedor.frecuencia_pago},
        )
        periodica.liquidaciones.set(liquidaciones_periodo)
        periodica.recalcular_totales()
        creados += 1

    return f'{creados} liquidaciones periódicas creadas/actualizadas'
