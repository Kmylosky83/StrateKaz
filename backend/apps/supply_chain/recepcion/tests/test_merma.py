"""
Tests H-SC-04 — Cálculo de merma kg/% en recolección.

Patrón obligatorio (CLAUDE.md §Testing): BaseTenantTestCase con schema real.
"""
from datetime import date
from decimal import Decimal

from apps.infraestructura.catalogo_productos.models import (
    CategoriaProducto,
    Producto,
    Proveedor,
    TipoProveedor,
    UnidadMedida,
)
from apps.core.models import TipoDocumentoIdentidad
from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.catalogos.models import (
    Almacen,
    RutaRecoleccion,
    TipoAlmacen,
)
from apps.supply_chain.recepcion.models import VoucherLineaMP, VoucherRecepcion
from apps.supply_chain.recoleccion.models import VoucherRecoleccion


class TestMermaCalculo(BaseTenantTestCase):
    """
    H-SC-04: cálculo de merma_kg y merma_porcentaje.

    Reglas:
        - Si no hay vouchers de recolección asociados → merma_kg = None
        - Modalidad ENTREGA_PLANTA (DIRECTO) sin recolección → merma None
        - RECOLECCION con N vouchers asociados → merma = recolectado - recibido
    """

    def setUp(self):
        super().setUp()
        uid = self._next_id()
        self.tipo_doc_nit, _ = TipoDocumentoIdentidad.objects.get_or_create(
            codigo='NIT', defaults={'nombre': 'NIT', 'orden': 1},
        )
        self.unidad_kg, _ = UnidadMedida.objects.get_or_create(
            abreviatura='kg-mr',
            defaults={'nombre': 'Kilogramo Merma', 'tipo': 'PESO', 'es_base': True},
        )
        self.categoria = CategoriaProducto.objects.create(
            nombre=f'MP Merma {uid}', orden=1,
        )
        self.tipo_prov, _ = TipoProveedor.objects.get_or_create(
            codigo='MR-MP',
            defaults={
                'nombre': 'Proveedor MP Merma',
                'requiere_materia_prima': True,
                'orden': 1,
            },
        )
        self.tipo_almacen, _ = TipoAlmacen.objects.get_or_create(
            codigo='SILO-MR',
            defaults={'nombre': 'Silo Merma', 'orden': 1},
        )
        self.almacen = Almacen.objects.create(
            codigo=f'AM{uid[:6]}',
            nombre='Almacén Merma',
            tipo_almacen=self.tipo_almacen,
            permite_recepcion=True,
        )
        self.proveedor = Proveedor.objects.create(
            tipo_proveedor=self.tipo_prov,
            nombre_comercial=f'Productor Merma {uid}',
            razon_social=f'Productor Merma SAS {uid}',
            tipo_documento=self.tipo_doc_nit,
            numero_documento=f'8{uid[:8]}',
        )
        self.producto = Producto.objects.create(
            codigo=f'PR_{self._next_id()}',
            nombre='Leche cruda',
            categoria=self.categoria,
            unidad_medida=self.unidad_kg,
            tipo='MATERIA_PRIMA',
            requiere_qc_recepcion=False,
        )
        self.ruta = RutaRecoleccion.objects.create(
            nombre=f'Ruta Norte {uid}',
            modo_operacion=RutaRecoleccion.ModoOperacion.PASS_THROUGH,
        )
        self.operador = self.create_user('op_merma')

    def _crear_voucher_recepcion(
        self, modalidad, peso_neto_kg=Decimal('100.000'), ruta=None,
    ):
        voucher = VoucherRecepcion.objects.create(
            proveedor=self.proveedor if modalidad != 'RECOLECCION' else None,
            modalidad_entrega=modalidad,
            ruta_recoleccion=ruta,
            fecha_viaje=date(2026, 4, 27),
            almacen_destino=self.almacen,
            operador_bascula=self.operador,
        )
        VoucherLineaMP.objects.create(
            voucher=voucher,
            producto=self.producto,
            peso_bruto_kg=peso_neto_kg,
            peso_tara_kg=Decimal('0.000'),
        )
        return voucher

    def _crear_voucher_recoleccion(self, cantidad):
        return VoucherRecoleccion.objects.create(
            ruta=self.ruta,
            fecha_recoleccion=date(2026, 4, 27),
            proveedor=self.proveedor,
            producto=self.producto,
            cantidad=cantidad,
            operador=self.operador,
            estado=VoucherRecoleccion.Estado.COMPLETADO,
        )

    # ─── Tests ─────────────────────────────────────────────────────────

    def test_merma_modalidad_recoleccion_calcula_correcto(self):
        """Voucher RECOLECCION con N recolecciones asociadas → merma = sum(rec) - sum(rcb)."""
        voucher = self._crear_voucher_recepcion(
            modalidad=VoucherRecepcion.ModalidadEntrega.RECOLECCION,
            peso_neto_kg=Decimal('98.000'),
            ruta=self.ruta,
        )
        rec1 = self._crear_voucher_recoleccion(Decimal('60.000'))
        rec2 = self._crear_voucher_recoleccion(Decimal('40.000'))
        voucher.vouchers_recoleccion.set([rec1, rec2])

        self.assertEqual(voucher.peso_total_recolectado, Decimal('100.000'))
        self.assertEqual(voucher.peso_total_recibido, Decimal('98.000'))
        self.assertEqual(voucher.merma_kg, Decimal('2.000'))
        self.assertEqual(voucher.merma_porcentaje, Decimal('2.00'))

    def test_merma_modalidad_entrega_planta_devuelve_none(self):
        """Modalidad DIRECTO (sin vouchers de recolección) → merma_kg = None."""
        voucher = self._crear_voucher_recepcion(
            modalidad=VoucherRecepcion.ModalidadEntrega.DIRECTO,
            peso_neto_kg=Decimal('150.000'),
        )
        self.assertIsNone(voucher.peso_total_recolectado)
        self.assertIsNone(voucher.merma_kg)
        self.assertIsNone(voucher.merma_porcentaje)

    def test_merma_sin_vouchers_recoleccion_devuelve_none(self):
        """RECOLECCION sin asociar vouchers → merma None (no hay base de cálculo)."""
        voucher = self._crear_voucher_recepcion(
            modalidad=VoucherRecepcion.ModalidadEntrega.RECOLECCION,
            peso_neto_kg=Decimal('50.000'),
            ruta=self.ruta,
        )
        # No se asocian VoucherRecoleccion al M2M.
        self.assertIsNone(voucher.peso_total_recolectado)
        self.assertIsNone(voucher.merma_kg)
        self.assertIsNone(voucher.merma_porcentaje)
        # peso_total_recibido sigue funcionando (suma de líneas)
        self.assertEqual(voucher.peso_total_recibido, Decimal('50.000'))
