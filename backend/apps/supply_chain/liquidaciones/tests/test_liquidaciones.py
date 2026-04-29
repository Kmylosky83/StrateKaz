"""
Tests del modelo Liquidacion (header) + LiquidacionLinea + PagoLiquidacion.

Refactor 2026-04-24: 1 Liquidacion = 1 VoucherRecepcion (OneToOne) con N
líneas de detalle (una por cada VoucherLineaMP). Estados:
BORRADOR → APROBADA → PAGADA.

Patrón: BaseTenantTestCase con schema real (CLAUDE.md §Testing).
"""

from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError

from apps.infraestructura.catalogo_productos.models import (
    CategoriaProducto,
    Producto,
    Proveedor,
    TipoProveedor,
    UnidadMedida,
)
from apps.core.models import TipoDocumentoIdentidad
from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.catalogos.models import Almacen, TipoAlmacen
from apps.supply_chain.gestion_proveedores.models import PrecioMateriaPrima
from apps.supply_chain.liquidaciones.models import (
    EstadoLiquidacion,
    Liquidacion,
    LiquidacionLinea,
    PagoLiquidacion,
)
from apps.supply_chain.recepcion.models import VoucherLineaMP, VoucherRecepcion


class _LiquidacionFixturesMixin:
    """Catálogos + voucher con líneas para tests de Liquidación."""

    def _setup_fixtures(self, precio_kg=Decimal("3500.00")):
        uid = self._next_id()
        self.tipo_doc, _ = TipoDocumentoIdentidad.objects.get_or_create(
            codigo="NIT",
            defaults={"nombre": "NIT", "orden": 1},
        )
        self.unidad, _ = UnidadMedida.objects.get_or_create(
            abreviatura="kg-lq",
            defaults={"nombre": "Kg LQ", "tipo": "PESO", "es_base": True},
        )
        self.categoria = CategoriaProducto.objects.create(
            nombre=f"Cat {uid}",
            orden=1,
        )
        self.tipo_prov, _ = TipoProveedor.objects.get_or_create(
            codigo="LQ-MP",
            defaults={
                "nombre": "Prov MP LQ",
                "requiere_materia_prima": True,
                "orden": 1,
            },
        )
        self.tipo_almacen, _ = TipoAlmacen.objects.get_or_create(
            codigo="SILO-LQ",
            defaults={"nombre": "Silo LQ", "orden": 1},
        )
        self.almacen = Almacen.objects.create(
            codigo=f"A{uid[:6]}",
            nombre="Almacén LQ",
            tipo_almacen=self.tipo_almacen,
            permite_recepcion=True,
        )
        self.proveedor = Proveedor.objects.create(
            tipo_proveedor=self.tipo_prov,
            nombre_comercial=f"Prov {uid}",
            razon_social=f"Prov {uid} SAS",
            tipo_documento=self.tipo_doc,
            numero_documento=f"9{uid[:8]}",
        )
        self.producto = Producto.objects.create(
            codigo=f"P_{uid}",
            nombre="Producto LQ",
            categoria=self.categoria,
            unidad_medida=self.unidad,
            tipo="MATERIA_PRIMA",
            requiere_qc_recepcion=False,
        )
        self.operador = self.create_user(f"op_{uid}")
        PrecioMateriaPrima.objects.create(
            proveedor=self.proveedor,
            producto=self.producto,
            precio_kg=precio_kg,
        )

    def _voucher_con_lineas(self, *pesos_brutos):
        """Crea un voucher con N líneas (una por peso)."""
        v = VoucherRecepcion.objects.create(
            proveedor=self.proveedor,
            modalidad_entrega=VoucherRecepcion.ModalidadEntrega.DIRECTO,
            fecha_viaje=date(2026, 4, 27),
            almacen_destino=self.almacen,
            operador_bascula=self.operador,
        )
        for bruto in pesos_brutos:
            VoucherLineaMP.objects.create(
                voucher=v,
                producto=self.producto,
                peso_bruto_kg=Decimal(str(bruto)),
                peso_tara_kg=Decimal("0.000"),
            )
        return v


# ==============================================================================
# LiquidacionLinea — cálculos automáticos
# ==============================================================================


class TestLiquidacionLineaCalculos(_LiquidacionFixturesMixin, BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        self._setup_fixtures()

    def _crear_liquidacion_simple(self):
        v = self._voucher_con_lineas(Decimal("1000.000"))
        liq = Liquidacion.objects.create(
            voucher=v,
            numero=1,
            codigo="LIQ-0001",
        )
        return liq, v.lineas.first()

    def test_monto_base_se_calcula_en_save(self):
        liq, voucher_linea = self._crear_liquidacion_simple()
        linea = LiquidacionLinea.objects.create(
            liquidacion=liq,
            voucher_linea=voucher_linea,
            cantidad=Decimal("1000.000"),
            precio_unitario=Decimal("3500.00"),
        )
        self.assertEqual(linea.monto_base, Decimal("3500000.00"))
        self.assertEqual(linea.monto_final, Decimal("3500000.00"))

    def test_ajuste_calidad_negativo_descuenta(self):
        liq, voucher_linea = self._crear_liquidacion_simple()
        linea = LiquidacionLinea.objects.create(
            liquidacion=liq,
            voucher_linea=voucher_linea,
            cantidad=Decimal("1000.000"),
            precio_unitario=Decimal("3500.00"),
            ajuste_calidad_pct=Decimal("-10.00"),
        )
        # 10% de descuento sobre 3.500.000 = -350.000
        self.assertEqual(linea.ajuste_calidad_monto, Decimal("-350000.00"))
        self.assertEqual(linea.monto_final, Decimal("3150000.00"))

    def test_ajuste_calidad_positivo_premia(self):
        liq, voucher_linea = self._crear_liquidacion_simple()
        linea = LiquidacionLinea.objects.create(
            liquidacion=liq,
            voucher_linea=voucher_linea,
            cantidad=Decimal("1000.000"),
            precio_unitario=Decimal("3500.00"),
            ajuste_calidad_pct=Decimal("5.00"),
        )
        # 5% premium sobre 3.500.000 = 175.000
        self.assertEqual(linea.ajuste_calidad_monto, Decimal("175000.00"))
        self.assertEqual(linea.monto_final, Decimal("3675000.00"))


# ==============================================================================
# Liquidacion — factory desde_voucher + recalcular_totales
# ==============================================================================


class TestLiquidacionFactory(_LiquidacionFixturesMixin, BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        self._setup_fixtures()

    def test_desde_voucher_crea_header_y_lineas(self):
        v = self._voucher_con_lineas(Decimal("500.000"), Decimal("300.000"))
        liq = Liquidacion.desde_voucher(v)

        self.assertEqual(liq.lineas_liquidacion.count(), 2)
        self.assertEqual(liq.estado, EstadoLiquidacion.BORRADOR)
        # Total = (500 + 300) * 3500 = 2.800.000
        self.assertEqual(liq.total, Decimal("2800000.00"))
        self.assertTrue(liq.codigo.startswith("LIQ-"))

    def test_desde_voucher_es_idempotente(self):
        v = self._voucher_con_lineas(Decimal("100.000"))
        liq1 = Liquidacion.desde_voucher(v)
        liq2 = Liquidacion.desde_voucher(v)
        self.assertEqual(liq1.pk, liq2.pk)
        self.assertEqual(Liquidacion.objects.filter(voucher=v).count(), 1)

    def test_recalcular_totales_suma_lineas(self):
        v = self._voucher_con_lineas(Decimal("100.000"))
        liq = Liquidacion.desde_voucher(v)
        # Aplicar ajuste a la línea y recalcular
        linea = liq.lineas_liquidacion.first()
        linea.ajuste_calidad_pct = Decimal("-10.00")
        linea.save()
        liq.recalcular_totales()
        liq.refresh_from_db()
        # 100 * 3500 = 350000; ajuste -10% = -35000; total = 315000
        self.assertEqual(liq.subtotal, Decimal("350000.00"))
        self.assertEqual(liq.ajuste_calidad_total, Decimal("-35000.00"))
        self.assertEqual(liq.total, Decimal("315000.00"))


# ==============================================================================
# Transiciones de estado: BORRADOR → APROBADA → PAGADA
# ==============================================================================


class TestLiquidacionTransiciones(_LiquidacionFixturesMixin, BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        self._setup_fixtures()

    def test_aprobar_desde_borrador(self):
        v = self._voucher_con_lineas(Decimal("100.000"))
        liq = Liquidacion.desde_voucher(v)
        liq.aprobar(self.operador)
        liq.refresh_from_db()
        self.assertEqual(liq.estado, EstadoLiquidacion.APROBADA)
        self.assertEqual(liq.aprobado_por, self.operador)
        self.assertIsNotNone(liq.fecha_aprobacion)

    def test_aprobar_desde_estado_invalido_falla(self):
        v = self._voucher_con_lineas(Decimal("100.000"))
        liq = Liquidacion.desde_voucher(v)
        liq.aprobar(self.operador)
        with self.assertRaises(ValidationError):
            liq.aprobar(self.operador)

    def test_pago_marca_liquidacion_como_pagada(self):
        v = self._voucher_con_lineas(Decimal("100.000"))
        liq = Liquidacion.desde_voucher(v)
        liq.aprobar(self.operador)
        liq.refresh_from_db()

        PagoLiquidacion.objects.create(
            liquidacion=liq,
            fecha_pago=date(2026, 4, 27),
            metodo=PagoLiquidacion.MetodoPago.TRANSFERENCIA,
            monto_pagado=liq.total,
            registrado_por=self.operador,
        )
        liq.refresh_from_db()
        self.assertEqual(liq.estado, EstadoLiquidacion.PAGADA)

    def test_pago_con_monto_distinto_rechazado(self):
        v = self._voucher_con_lineas(Decimal("100.000"))
        liq = Liquidacion.desde_voucher(v)
        liq.aprobar(self.operador)
        liq.refresh_from_db()

        pago = PagoLiquidacion(
            liquidacion=liq,
            fecha_pago=date(2026, 4, 27),
            metodo=PagoLiquidacion.MetodoPago.EFECTIVO,
            monto_pagado=liq.total + Decimal("1.00"),
            registrado_por=self.operador,
        )
        with self.assertRaises(ValidationError) as ctx:
            pago.save()
        self.assertIn("monto_pagado", ctx.exception.error_dict)

    def test_pago_sobre_borrador_rechazado(self):
        v = self._voucher_con_lineas(Decimal("100.000"))
        liq = Liquidacion.desde_voucher(v)
        # Sin aprobar
        pago = PagoLiquidacion(
            liquidacion=liq,
            fecha_pago=date(2026, 4, 27),
            metodo=PagoLiquidacion.MetodoPago.EFECTIVO,
            monto_pagado=liq.total,
            registrado_por=self.operador,
        )
        with self.assertRaises(ValidationError):
            pago.save()


# ==============================================================================
# TenantModel — soft-delete
# ==============================================================================


class TestLiquidacionTenantModel(_LiquidacionFixturesMixin, BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        self._setup_fixtures()

    def test_soft_delete(self):
        v = self._voucher_con_lineas(Decimal("100.000"))
        liq = Liquidacion.desde_voucher(v)
        pk = liq.pk
        liq.delete()
        self.assertEqual(Liquidacion.objects.filter(pk=pk).count(), 0)
        self.assertEqual(Liquidacion.all_objects.filter(pk=pk).count(), 1)
