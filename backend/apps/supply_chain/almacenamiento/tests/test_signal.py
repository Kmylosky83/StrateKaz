"""
Tests del signal Voucher APROBADO → MovimientoInventario + Inventario.

Valida happy path, idempotencia y short-circuit cuando estado != APROBADO.
"""
from decimal import Decimal

from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.almacenamiento.models import Inventario, MovimientoInventario
from apps.supply_chain.recepcion.models import VoucherRecepcion

from . import factories


class TestSignalVoucherAprobado(BaseTenantTestCase):
    """Signal crea MovimientoInventario + Inventario al aprobar voucher."""

    def setUp(self):
        super().setUp()
        factories.setup_full_supply_chain(self)
        self.operador = self.create_user()
        self.voucher = factories.create_voucher(
            proveedor=self.proveedor,
            producto=self.producto,
            almacen_destino=self.almacen,
            operador=self.operador,
            peso_bruto=Decimal('1050.000'),
            peso_tara=Decimal('50.000'),
            precio_kg=Decimal('3500.00'),
        )

    def test_voucher_pendiente_qc_no_genera_movimiento(self):
        """Recién creado en PENDIENTE_QC → no hay movimiento."""
        self.assertEqual(self.voucher.estado, VoucherRecepcion.EstadoVoucher.PENDIENTE_QC)
        self.assertFalse(
            MovimientoInventario.objects.filter(
                origen_tipo='VoucherRecepcion', origen_id=self.voucher.pk,
            ).exists()
        )

    def test_aprobar_crea_movimiento_entrada(self):
        self.voucher.aprobar()

        movs = MovimientoInventario.objects.filter(
            origen_tipo='VoucherRecepcion', origen_id=self.voucher.pk,
        )
        self.assertEqual(movs.count(), 1)

        mov = movs.first()
        self.assertEqual(mov.tipo_movimiento.codigo, 'ENTRADA')
        self.assertEqual(mov.producto, self.producto)
        self.assertEqual(mov.almacen_destino, self.almacen)
        self.assertEqual(mov.cantidad, Decimal('1000.000'))  # 1050 - 50 tara
        self.assertEqual(mov.costo_unitario, Decimal('3500.00'))
        self.assertEqual(mov.registrado_por, self.operador)

    def test_aprobar_crea_inventario_en_almacen_destino(self):
        self.voucher.aprobar()

        invs = Inventario.objects.filter(
            almacen=self.almacen,
            producto=self.producto,
            estado=self.estado_disponible,
        )
        self.assertEqual(invs.count(), 1)

        inv = invs.first()
        self.assertEqual(inv.cantidad_disponible, Decimal('1000.000'))
        self.assertEqual(inv.costo_unitario, Decimal('3500.00'))
        self.assertEqual(inv.lote, str(self.voucher.pk))

    def test_aprobar_dos_veces_es_idempotente(self):
        self.voucher.aprobar()
        self.voucher.aprobar()

        movs = MovimientoInventario.objects.filter(
            origen_tipo='VoucherRecepcion', origen_id=self.voucher.pk,
        )
        self.assertEqual(movs.count(), 1)

    def test_aprobar_refresh_y_reaprobar_tampoco_duplica(self):
        """Protección contra race: aprobar, refresh desde DB, reaprobar."""
        self.voucher.aprobar()
        self.voucher.refresh_from_db()
        # estado ya es APROBADO en DB → short-circuit en aprobar()
        self.voucher.aprobar()

        movs = MovimientoInventario.objects.filter(
            origen_tipo='VoucherRecepcion', origen_id=self.voucher.pk,
        )
        self.assertEqual(movs.count(), 1)

    def test_save_directo_con_estado_aprobado_dispara_signal(self):
        """
        El signal es belt-and-suspenders: incluso si alguien salta
        el método aprobar() y edita estado directamente (admin, shell),
        el movimiento se crea.
        """
        self.voucher.estado = VoucherRecepcion.EstadoVoucher.APROBADO
        self.voucher.save()

        movs = MovimientoInventario.objects.filter(
            origen_tipo='VoucherRecepcion', origen_id=self.voucher.pk,
        )
        self.assertEqual(movs.count(), 1)

    def test_transicion_invalida_raises(self):
        """No se puede aprobar desde RECHAZADO."""
        self.voucher.estado = VoucherRecepcion.EstadoVoucher.RECHAZADO
        self.voucher.save()

        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            self.voucher.aprobar()
