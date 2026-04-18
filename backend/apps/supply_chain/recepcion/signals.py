"""
Signals de Recepción — Supply Chain S3

S3: Placeholder. El signal Voucher APROBADO → MovimientoInventario
se implementa en S4 cuando almacenamiento/ esté reescrito con FK Producto.

Cuando S4 entre, aquí vivirá:

    @receiver(post_save, sender=VoucherRecepcion)
    def crear_movimiento_inventario(sender, instance, **kwargs):
        if instance.estado == VoucherRecepcion.EstadoVoucher.APROBADO:
            # Crear MovimientoInventario(tipo=ENTRADA, origen=VOUCHER, ...)
"""
