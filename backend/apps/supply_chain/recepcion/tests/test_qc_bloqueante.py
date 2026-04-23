"""
Tests H-SC-03 — QC bloqueante en VoucherRecepcion.aprobar()

Patrón obligatorio (CLAUDE.md §Testing): BaseTenantTestCase con schema real.
Los tests legacy pytest.mark.django_db se dejan intactos; estos son nuevos.
"""
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError

from apps.catalogo_productos.extensiones.espec_calidad import ProductoEspecCalidad
from apps.catalogo_productos.extensiones.espec_calidad_parametro import (
    ProductoEspecCalidadParametro,
)
from apps.catalogo_productos.models import CategoriaProducto, Producto, UnidadMedida
from apps.core.models import TipoDocumentoIdentidad
from apps.core.tests.base import BaseTenantTestCase
from apps.catalogo_productos.models import Proveedor, TipoProveedor
from apps.supply_chain.catalogos.models import Almacen, TipoAlmacen
from apps.supply_chain.recepcion.models import RecepcionCalidad, VoucherLineaMP, VoucherRecepcion


class TestQCBloqueante(BaseTenantTestCase):
    """
    H-SC-03: validación bloqueante de QC al aprobar voucher.

    Flujo universal:
        producto.requiere_qc_recepcion = True  → debe haber RecepcionCalidad
        producto.requiere_qc_recepcion = False → aprobar() directo
    """

    def setUp(self):
        super().setUp()
        uid = self._next_id()  # ej: 'a1b2c3_1' — usar una sola vez
        # Catálogos mínimos
        self.tipo_doc_nit, _ = TipoDocumentoIdentidad.objects.get_or_create(
            codigo='NIT', defaults={'nombre': 'NIT', 'orden': 1},
        )
        # abreviatura max_length=10 → usar prefijo corto
        self.unidad_kg, _ = UnidadMedida.objects.get_or_create(
            abreviatura='kg-sc',
            defaults={'nombre': 'Kilogramo SC', 'tipo': 'PESO', 'es_base': True},
        )
        self.categoria = CategoriaProducto.objects.create(
            nombre=f'MP {uid}', orden=1,
        )
        # codigo max_length puede ser corto
        self.tipo_prov, _ = TipoProveedor.objects.get_or_create(
            codigo='SC-MP',
            defaults={'nombre': 'Proveedor MP', 'requiere_materia_prima': True, 'orden': 1},
        )
        self.tipo_almacen, _ = TipoAlmacen.objects.get_or_create(
            codigo='SILO-SC',
            defaults={'nombre': 'Silo SC', 'orden': 1},
        )
        self.almacen = Almacen.objects.create(
            codigo=f'A{uid[:6]}',
            nombre='Almacén Test',
            tipo_almacen=self.tipo_almacen,
            permite_recepcion=True,
        )
        self.proveedor = Proveedor.objects.create(
            tipo_proveedor=self.tipo_prov,
            nombre_comercial=f'Finca Test {uid}',
            razon_social=f'Finca Test SAS {uid}',
            tipo_documento=self.tipo_doc_nit,
            numero_documento=f'9{uid[:8]}',
        )
        self.operador = self.create_user('op_bascula')

    def _crear_producto(self, requiere_qc=False):
        prod = Producto.objects.create(
            codigo=f'PROD_{self._next_id()}',
            nombre='Producto Test',
            categoria=self.categoria,
            unidad_medida=self.unidad_kg,
            tipo='MATERIA_PRIMA',
            requiere_qc_recepcion=requiere_qc,
        )
        if requiere_qc:
            espec = ProductoEspecCalidad.objects.create(
                producto=prod,
                acidez_min=Decimal('0.50'),
                acidez_max=Decimal('2.00'),
                requiere_prueba_acidez=True,
            )
            ProductoEspecCalidadParametro.objects.create(
                espec_calidad=espec,
                nombre_parametro='acidez',
                unidad='%',
                valor_min=Decimal('0.5000'),
                valor_max=Decimal('2.0000'),
                es_critico=True,
                orden=0,
            )
        return prod

    def _crear_voucher(self, producto):
        """Crea un VoucherRecepcion header + una VoucherLineaMP con el producto dado."""
        voucher = VoucherRecepcion.objects.create(
            proveedor=self.proveedor,
            modalidad_entrega=VoucherRecepcion.ModalidadEntrega.DIRECTO,
            fecha_viaje=date(2026, 4, 22),
            almacen_destino=self.almacen,
            operador_bascula=self.operador,
        )
        VoucherLineaMP.objects.create(
            voucher=voucher,
            producto=producto,
            peso_bruto_kg=Decimal('1050.000'),
            peso_tara_kg=Decimal('50.000'),
        )
        return voucher

    # ─── Tests principales H-SC-03 ─────────────────────────────────────

    def test_aprobar_falla_si_producto_requiere_qc_y_no_hay_registro(self):
        """Producto con requiere_qc_recepcion=True sin RecepcionCalidad → ValidationError."""
        producto = self._crear_producto(requiere_qc=True)
        voucher = self._crear_voucher(producto)

        with self.assertRaises(ValidationError) as ctx:
            voucher.aprobar()

        exc_str = str(ctx.exception)
        self.assertTrue(
            'requiere control de calidad' in exc_str or 'control de calidad' in exc_str,
            f"Mensaje inesperado: {exc_str}",
        )
        voucher.refresh_from_db()
        self.assertEqual(voucher.estado, VoucherRecepcion.EstadoVoucher.PENDIENTE_QC)

    def test_aprobar_funciona_directo_si_producto_no_requiere_qc(self):
        """Producto con requiere_qc_recepcion=False → aprobar() transiciona sin QC."""
        producto = self._crear_producto(requiere_qc=False)
        voucher = self._crear_voucher(producto)

        voucher.aprobar()
        voucher.refresh_from_db()

        self.assertEqual(voucher.estado, VoucherRecepcion.EstadoVoucher.APROBADO)
        self.assertFalse(voucher.tiene_qc)
        self.assertFalse(voucher.requiere_qc)

    def test_aprobar_funciona_con_qc_aprobado(self):
        """Producto requiere QC + RecepcionCalidad(APROBADO) → aprobar() OK."""
        producto = self._crear_producto(requiere_qc=True)
        voucher = self._crear_voucher(producto)

        from django.utils import timezone
        RecepcionCalidad.objects.create(
            voucher=voucher,
            parametros_medidos={'acidez': 1.2},
            resultado=RecepcionCalidad.ResultadoQC.APROBADO,
            analista=self.operador,
            fecha_analisis=timezone.now(),
        )

        voucher.aprobar()
        voucher.refresh_from_db()

        self.assertEqual(voucher.estado, VoucherRecepcion.EstadoVoucher.APROBADO)
        self.assertTrue(voucher.tiene_qc)
        self.assertTrue(voucher.requiere_qc)

    def test_aprobar_falla_si_qc_resultado_rechazado(self):
        """QC con resultado=RECHAZADO → no puede aprobarse."""
        producto = self._crear_producto(requiere_qc=True)
        voucher = self._crear_voucher(producto)

        from django.utils import timezone
        RecepcionCalidad.objects.create(
            voucher=voucher,
            parametros_medidos={'acidez': 5.0},
            resultado=RecepcionCalidad.ResultadoQC.RECHAZADO,
            analista=self.operador,
            fecha_analisis=timezone.now(),
            observaciones='Fuera de rango crítico',
        )

        with self.assertRaises(ValidationError) as ctx:
            voucher.aprobar()

        self.assertIn('RECHAZADO', str(ctx.exception))
        voucher.refresh_from_db()
        self.assertEqual(voucher.estado, VoucherRecepcion.EstadoVoucher.PENDIENTE_QC)

    def test_aprobar_falla_si_no_hay_lineas(self):
        """Voucher sin líneas → ValidationError al aprobar."""
        producto = self._crear_producto(requiere_qc=False)
        voucher = VoucherRecepcion.objects.create(
            proveedor=self.proveedor,
            modalidad_entrega=VoucherRecepcion.ModalidadEntrega.DIRECTO,
            fecha_viaje=date(2026, 4, 22),
            almacen_destino=self.almacen,
            operador_bascula=self.operador,
        )
        with self.assertRaises(ValidationError) as ctx:
            voucher.aprobar()
        self.assertIn('al menos una línea', str(ctx.exception))

    def test_parametro_genericos_valida_rango(self):
        """ProductoEspecCalidadParametro.cumple() valida rangos correctamente."""
        producto = self._crear_producto(requiere_qc=True)
        param = producto.espec_calidad.parametros.first()

        self.assertTrue(param.cumple(Decimal('1.0')))
        self.assertTrue(param.cumple(Decimal('0.5')))  # límite inferior
        self.assertTrue(param.cumple(Decimal('2.0')))  # límite superior
        self.assertFalse(param.cumple(Decimal('0.4')))
        self.assertFalse(param.cumple(Decimal('2.1')))
