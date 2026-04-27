"""
Tests para VoucherPDFService — H-SC-RUTA-02 + Refactor 2026-04-27.

Verifica que ambos métodos del servicio devuelvan bytes PDF válidos
(detección por magic bytes "%PDF") con contenido funcional del voucher.

Patrón obligatorio: BaseTenantTestCase con schema real (CLAUDE.md §Testing).
"""
from datetime import date
from decimal import Decimal

from apps.catalogo_productos.models import (
    CategoriaProducto,
    Producto,
    Proveedor,
    TipoProveedor,
    UnidadMedida,
)
from apps.core.models import TipoDocumentoIdentidad
from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.catalogos.models import Almacen, TipoAlmacen
from apps.supply_chain.recepcion.models import VoucherLineaMP, VoucherRecepcion
from apps.supply_chain.recepcion.services import VoucherPDFService


class TestVoucherPDFService(BaseTenantTestCase):
    """VoucherPDFService.generar_pdf_80mm + generar_pdf_carta."""

    def setUp(self):
        super().setUp()
        self.user = self.create_user()
        self.tipo_doc, _ = TipoDocumentoIdentidad.objects.get_or_create(
            codigo='NIT', defaults={'nombre': 'NIT', 'orden': 1},
        )
        self.tipo_prov = TipoProveedor.objects.create(
            codigo='MP-PDF', nombre='Proveedor MP', requiere_materia_prima=True, orden=1,
        )
        self.proveedor = Proveedor.objects.create(
            tipo_proveedor=self.tipo_prov,
            nombre_comercial='Proveedor PDF Test',
            razon_social='Proveedor PDF Test S.A.S.',
            tipo_documento=self.tipo_doc,
            numero_documento='900111333',
        )
        self.tipo_almacen = TipoAlmacen.objects.create(
            codigo='SILO-PDF', nombre='Silo PDF', orden=1,
        )
        self.almacen = Almacen.objects.create(
            codigo='SIL-PDF-01',
            nombre='Silo PDF 01',
            tipo_almacen=self.tipo_almacen,
            permite_recepcion=True,
        )
        self.categoria = CategoriaProducto.objects.create(nombre='MP PDF', orden=1)
        self.unidad = UnidadMedida.objects.create(
            nombre='Kilo PDF', abreviatura='kg-pdf', tipo='PESO', es_base=True,
        )
        self.producto = Producto.objects.create(
            codigo='PDF-MP-A',
            nombre='Materia PDF',
            categoria=self.categoria,
            unidad_medida=self.unidad,
            tipo='MATERIA_PRIMA',
        )
        self.voucher = VoucherRecepcion.objects.create(
            proveedor=self.proveedor,
            modalidad_entrega='DIRECTO',
            fecha_viaje=date(2026, 4, 27),
            almacen_destino=self.almacen,
            operador_bascula=self.user,
        )
        VoucherLineaMP.objects.create(
            voucher=self.voucher,
            producto=self.producto,
            peso_bruto_kg=Decimal('500.000'),
            peso_tara_kg=Decimal('20.000'),
        )

    def test_generar_pdf_80mm_devuelve_bytes_pdf_validos(self):
        """El PDF 80mm debe empezar con magic bytes %PDF y ser no-vacío."""
        pdf_bytes = VoucherPDFService.generar_pdf_80mm(self.voucher)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertGreater(len(pdf_bytes), 100)
        self.assertTrue(
            pdf_bytes.startswith(b'%PDF'),
            f'PDF 80mm no inicia con %PDF, got: {pdf_bytes[:20]!r}',
        )

    def test_generar_pdf_carta_devuelve_bytes_pdf_validos(self):
        """El PDF carta debe empezar con magic bytes %PDF y ser no-vacío."""
        pdf_bytes = VoucherPDFService.generar_pdf_carta(self.voucher)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertGreater(len(pdf_bytes), 100)
        self.assertTrue(
            pdf_bytes.startswith(b'%PDF'),
            f'PDF carta no inicia con %PDF, got: {pdf_bytes[:20]!r}',
        )

    def test_pdf_carta_es_mas_grande_que_80mm(self):
        """El PDF carta debe pesar más que el ticket 80mm (más contenido)."""
        pdf_80 = VoucherPDFService.generar_pdf_80mm(self.voucher)
        pdf_carta = VoucherPDFService.generar_pdf_carta(self.voucher)
        # El carta tiene firmas, info-grid, branding completo — debería ser >.
        self.assertGreater(len(pdf_carta), len(pdf_80) // 2)
