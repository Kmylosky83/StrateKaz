"""
Signals para Pedidos y Facturación - Sales CRM
Maneja eventos automáticos del sistema

Eventos:
- Actualización automática de estado de factura al registrar pagos
- Validaciones adicionales de negocio

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal

from .models import PagoFactura


@receiver(post_save, sender=PagoFactura)
def actualizar_estado_factura(sender, instance, created, **kwargs):
    """
    Actualiza automáticamente el estado de la factura cuando se registra un pago.

    Estados:
    - PENDIENTE: Saldo pendiente = Total
    - PARCIAL: 0 < Saldo pendiente < Total
    - PAGADA: Saldo pendiente = 0
    """
    if created:
        factura = instance.factura
        saldo_pendiente = factura.saldo_pendiente

        # Determinar nuevo estado
        if saldo_pendiente <= Decimal('0.00'):
            nuevo_estado = 'PAGADA'
        elif saldo_pendiente < factura.total:
            nuevo_estado = 'PARCIAL'
        else:
            nuevo_estado = 'PENDIENTE'

        # Actualizar estado si cambió
        if factura.estado != nuevo_estado:
            factura.estado = nuevo_estado
            factura.save(update_fields=['estado', 'updated_at'])
