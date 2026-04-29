"""
Tests del QC configurable por tenant (H-SC-11).

ParametroCalidad + RangoCalidad + MedicionCalidad: el sistema mide en
cada VoucherLineaMP y auto-clasifica el valor en uno de los rangos
del parámetro.
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
from apps.supply_chain.catalogos.models import Almacen, TipoAlmacen
from apps.supply_chain.recepcion.models import (
    MedicionCalidad,
    ParametroCalidad,
    RangoCalidad,
    VoucherLineaMP,
    VoucherRecepcion,
)


class TestQCConfigurable(BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        uid = self._next_id()
        self.tipo_doc, _ = TipoDocumentoIdentidad.objects.get_or_create(
            codigo="NIT",
            defaults={"nombre": "NIT", "orden": 1},
        )
        self.unidad, _ = UnidadMedida.objects.get_or_create(
            abreviatura="kg-qc",
            defaults={"nombre": "Kg QC", "tipo": "PESO", "es_base": True},
        )
        self.categoria = CategoriaProducto.objects.create(
            nombre=f"Cat {uid}",
            orden=1,
        )
        self.tipo_prov, _ = TipoProveedor.objects.get_or_create(
            codigo="QC-MP",
            defaults={
                "nombre": "Prov MP QC",
                "requiere_materia_prima": True,
                "orden": 1,
            },
        )
        self.tipo_almacen, _ = TipoAlmacen.objects.get_or_create(
            codigo="SILO-QC",
            defaults={"nombre": "Silo QC", "orden": 1},
        )
        self.almacen = Almacen.objects.create(
            codigo=f"A{uid[:6]}",
            nombre="Almacén QC",
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
            nombre="Producto QC",
            categoria=self.categoria,
            unidad_medida=self.unidad,
            tipo="MATERIA_PRIMA",
            requiere_qc_recepcion=True,
        )
        self.operador = self.create_user(f"op_{uid}")

        # Parámetro Acidez con 3 rangos: A [0-1], B (1-2], C (2-∞)
        self.parametro = ParametroCalidad.objects.create(
            code="ACIDEZ",
            name="Acidez",
            unit="%",
            decimals=2,
        )
        self.rango_a = RangoCalidad.objects.create(
            parameter=self.parametro,
            code="TIPO_A",
            name="Tipo A",
            min_value=Decimal("0.0000"),
            max_value=Decimal("1.0000"),
            order=1,
        )
        self.rango_b = RangoCalidad.objects.create(
            parameter=self.parametro,
            code="TIPO_B",
            name="Tipo B",
            min_value=Decimal("1.0001"),
            max_value=Decimal("2.0000"),
            order=2,
        )
        self.rango_c = RangoCalidad.objects.create(
            parameter=self.parametro,
            code="TIPO_C",
            name="Tipo C",
            min_value=Decimal("2.0001"),
            max_value=None,  # sin límite superior
            order=3,
        )

        self.voucher = VoucherRecepcion.objects.create(
            proveedor=self.proveedor,
            modalidad_entrega=VoucherRecepcion.ModalidadEntrega.DIRECTO,
            fecha_viaje=date(2026, 4, 27),
            almacen_destino=self.almacen,
            operador_bascula=self.operador,
        )
        self.linea = VoucherLineaMP.objects.create(
            voucher=self.voucher,
            producto=self.producto,
            peso_bruto_kg=Decimal("100.000"),
            peso_tara_kg=Decimal("0.000"),
        )

    def test_medicion_clasifica_en_rango_a(self):
        m = MedicionCalidad.objects.create(
            voucher_line=self.linea,
            parameter=self.parametro,
            measured_value=Decimal("0.5000"),
            measured_by=self.operador,
        )
        self.assertEqual(m.classified_range, self.rango_a)

    def test_medicion_clasifica_en_rango_b(self):
        m = MedicionCalidad.objects.create(
            voucher_line=self.linea,
            parameter=self.parametro,
            measured_value=Decimal("1.5000"),
            measured_by=self.operador,
        )
        self.assertEqual(m.classified_range, self.rango_b)

    def test_medicion_clasifica_en_rango_sin_limite_superior(self):
        m = MedicionCalidad.objects.create(
            voucher_line=self.linea,
            parameter=self.parametro,
            measured_value=Decimal("99.9999"),
            measured_by=self.operador,
        )
        self.assertEqual(m.classified_range, self.rango_c)

    def test_medicion_fuera_de_rango_no_clasifica(self):
        # Valor por debajo del mínimo: ningún rango aplica → None
        m = MedicionCalidad.objects.create(
            voucher_line=self.linea,
            parameter=self.parametro,
            measured_value=Decimal("-1.0000"),
            measured_by=self.operador,
        )
        self.assertIsNone(m.classified_range)

    def test_voucher_tiene_qc_cuando_se_registra_medicion(self):
        # Sin medición todavía → tiene_qc=False (línea requiere QC)
        self.assertFalse(self.voucher.tiene_qc)

        MedicionCalidad.objects.create(
            voucher_line=self.linea,
            parameter=self.parametro,
            measured_value=Decimal("1.5000"),
            measured_by=self.operador,
        )
        self.assertTrue(self.voucher.tiene_qc)

    def test_voucher_aprobar_funciona_con_medicion_calidad(self):
        from django.core.exceptions import ValidationError

        # Sin medición no aprueba
        with self.assertRaises(ValidationError):
            self.voucher.aprobar()

        MedicionCalidad.objects.create(
            voucher_line=self.linea,
            parameter=self.parametro,
            measured_value=Decimal("1.5000"),
            measured_by=self.operador,
        )
        # Catálogos para signal de inventario
        from apps.supply_chain.almacenamiento.models import (
            EstadoInventario,
            TipoMovimientoInventario,
        )

        TipoMovimientoInventario.objects.get_or_create(
            codigo="ENTRADA",
            defaults={"nombre": "Entrada", "afecta_stock": "POSITIVO"},
        )
        EstadoInventario.objects.get_or_create(
            codigo="DISPONIBLE",
            defaults={"nombre": "Disponible"},
        )

        self.voucher.aprobar()
        self.voucher.refresh_from_db()
        self.assertEqual(
            self.voucher.estado,
            VoucherRecepcion.EstadoVoucher.APROBADO,
        )
