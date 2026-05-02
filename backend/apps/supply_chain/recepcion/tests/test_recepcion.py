"""
Tests de modelo VoucherRecepcion + VoucherLineaMP + RecepcionCalidad.

Patrón: BaseTenantTestCase con schema real (CLAUDE.md §Testing).

Cobertura:
- TenantModel (soft-delete, timestamps)
- Cálculo automático peso_neto en VoucherLineaMP
- Validaciones de pesos
- Validación condicional modalidad RECOLECCION ↔ ruta_recoleccion
- Validación condicional modalidad DIRECTO/TRANSPORTE_INTERNO ↔ proveedor
- Property peso_neto_total
- Transición estado → APROBADO con signal de inventario y liquidación
- RecepcionCalidad legacy (OneToOne)
"""

from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone

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
from apps.supply_chain.gestion_proveedores.models import PrecioMateriaPrima
from apps.supply_chain.recepcion.models import (
    RecepcionCalidad,
    VoucherLineaMP,
    VoucherRecepcion,
)


class _RecepcionFixturesMixin:
    """Crea catálogos mínimos reutilizables para tests de recepción."""

    def _setup_fixtures(self):
        uid = self._next_id()

        self.tipo_doc, _ = TipoDocumentoIdentidad.objects.get_or_create(
            codigo="NIT",
            defaults={"nombre": "NIT", "orden": 1},
        )
        self.unidad, _ = UnidadMedida.objects.get_or_create(
            abreviatura="kg-rc",
            defaults={"nombre": "Kg recepcion", "tipo": "PESO", "es_base": True},
        )
        self.categoria = CategoriaProducto.objects.create(
            nombre=f"Cat {uid}",
            orden=1,
        )
        self.tipo_prov, _ = TipoProveedor.objects.get_or_create(
            codigo="RC-MP",
            defaults={
                "nombre": "Proveedor MP RC",
                "requiere_materia_prima": True,
                "orden": 1,
            },
        )
        self.tipo_almacen, _ = TipoAlmacen.objects.get_or_create(
            codigo="SILO-RC",
            defaults={"nombre": "Silo RC", "orden": 1},
        )
        self.almacen = Almacen.objects.create(
            codigo=f"A{uid[:6]}",
            nombre="Almacén Recepción",
            tipo_almacen=self.tipo_almacen,
            permite_recepcion=True,
        )
        self.proveedor = Proveedor.objects.create(
            tipo_proveedor=self.tipo_prov,
            nombre_comercial=f"Finca {uid}",
            razon_social=f"Finca {uid} SAS",
            tipo_documento=self.tipo_doc,
            numero_documento=f"9{uid[:8]}",
        )
        self.producto = Producto.objects.create(
            codigo=f"P_{uid}",
            nombre="Sebo",
            categoria=self.categoria,
            unidad_medida=self.unidad,
            tipo="MATERIA_PRIMA",
            requiere_qc_recepcion=False,
        )
        self.operador = self.create_user(f"op_{uid}")
        # Precio para que la liquidación auto-creada tenga monto
        PrecioMateriaPrima.objects.create(
            proveedor=self.proveedor,
            producto=self.producto,
            precio_kg=Decimal("3500.00"),
        )

    def _voucher_kwargs(self, **overrides):
        base = dict(
            proveedor=self.proveedor,
            modalidad_entrega=VoucherRecepcion.ModalidadEntrega.DIRECTO,
            fecha_viaje=date(2026, 4, 27),
            almacen_destino=self.almacen,
            operador_bascula=self.operador,
        )
        base.update(overrides)
        return base


# ==============================================================================
# VoucherLineaMP — pesos
# ==============================================================================


class TestVoucherLineaMP(_RecepcionFixturesMixin, BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        self._setup_fixtures()

    def test_peso_neto_se_calcula_en_save(self):
        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        linea = VoucherLineaMP.objects.create(
            voucher=v,
            producto=self.producto,
            peso_bruto_kg=Decimal("1050.000"),
            peso_tara_kg=Decimal("50.000"),
        )
        self.assertEqual(linea.peso_neto_kg, Decimal("1000.000"))

    def test_peso_bruto_cero_rechazado(self):
        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        linea = VoucherLineaMP(
            voucher=v,
            producto=self.producto,
            peso_bruto_kg=Decimal("0.000"),
            peso_tara_kg=Decimal("0.000"),
        )
        with self.assertRaises(ValidationError) as ctx:
            linea.full_clean()
        self.assertIn("peso_bruto_kg", ctx.exception.error_dict)

    def test_tara_mayor_que_bruto_rechazada(self):
        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        linea = VoucherLineaMP(
            voucher=v,
            producto=self.producto,
            peso_bruto_kg=Decimal("100.000"),
            peso_tara_kg=Decimal("200.000"),
        )
        with self.assertRaises(ValidationError) as ctx:
            linea.full_clean()
        self.assertIn("peso_tara_kg", ctx.exception.error_dict)


# ==============================================================================
# VoucherRecepcion — modalidad y validaciones condicionales
# ==============================================================================


class TestModalidadEntrega(_RecepcionFixturesMixin, BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        self._setup_fixtures()

    def test_directo_requiere_proveedor(self):
        kwargs = self._voucher_kwargs(proveedor=None)
        v = VoucherRecepcion(**kwargs)
        with self.assertRaises(ValidationError) as ctx:
            v.full_clean()
        self.assertIn("proveedor", ctx.exception.error_dict)

    def test_recoleccion_requiere_ruta(self):
        kwargs = self._voucher_kwargs(
            modalidad_entrega=VoucherRecepcion.ModalidadEntrega.RECOLECCION,
            proveedor=None,
            ruta_recoleccion=None,
        )
        v = VoucherRecepcion(**kwargs)
        with self.assertRaises(ValidationError) as ctx:
            v.full_clean()
        self.assertIn("ruta_recoleccion", ctx.exception.error_dict)

    def test_recoleccion_con_ruta_y_sin_proveedor_ok(self):
        ruta = RutaRecoleccion.objects.create(
            codigo=f"R{self._next_id()[:6]}",
            nombre="Ruta Test",
            modo_operacion=RutaRecoleccion.ModoOperacion.PASS_THROUGH,
        )
        kwargs = self._voucher_kwargs(
            modalidad_entrega=VoucherRecepcion.ModalidadEntrega.RECOLECCION,
            proveedor=None,
            ruta_recoleccion=ruta,
        )
        v = VoucherRecepcion(**kwargs)
        v.full_clean()  # no debe lanzar


# ==============================================================================
# VoucherRecepcion — TenantModel + propiedades + transición APROBADO
# ==============================================================================


class TestVoucherRecepcion(_RecepcionFixturesMixin, BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        self._setup_fixtures()
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

    def test_default_estado_es_pendiente_qc(self):
        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        self.assertEqual(v.estado, VoucherRecepcion.EstadoVoucher.PENDIENTE_QC)

    def test_soft_delete(self):
        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        pk = v.pk
        v.delete()
        self.assertEqual(VoucherRecepcion.objects.filter(pk=pk).count(), 0)
        self.assertEqual(VoucherRecepcion.all_objects.filter(pk=pk).count(), 1)

    def test_peso_neto_total_suma_lineas(self):
        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        VoucherLineaMP.objects.create(
            voucher=v,
            producto=self.producto,
            peso_bruto_kg=Decimal("500.000"),
            peso_tara_kg=Decimal("50.000"),
        )
        VoucherLineaMP.objects.create(
            voucher=v,
            producto=self.producto,
            peso_bruto_kg=Decimal("300.000"),
            peso_tara_kg=Decimal("20.000"),
        )
        self.assertEqual(v.peso_neto_total, Decimal("730.000"))

    def test_aprobar_sin_lineas_rechazado(self):
        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        with self.assertRaises(ValidationError) as ctx:
            v.aprobar()
        self.assertIn("al menos una línea", str(ctx.exception))

    def test_aprobar_es_idempotente(self):
        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        VoucherLineaMP.objects.create(
            voucher=v,
            producto=self.producto,
            peso_bruto_kg=Decimal("100.000"),
            peso_tara_kg=Decimal("0.000"),
        )
        v.aprobar()
        v.aprobar()  # segunda llamada no debe lanzar
        v.refresh_from_db()
        self.assertEqual(v.estado, VoucherRecepcion.EstadoVoucher.APROBADO)

    def test_aprobar_dispara_inventario_y_liquidacion(self):
        from apps.supply_chain.almacenamiento.models import (
            Inventario,
            MovimientoInventario,
        )
        from apps.supply_chain.liquidaciones.models import Liquidacion

        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        VoucherLineaMP.objects.create(
            voucher=v,
            producto=self.producto,
            peso_bruto_kg=Decimal("1050.000"),
            peso_tara_kg=Decimal("50.000"),
        )
        v.aprobar()
        v.refresh_from_db()
        self.assertEqual(v.estado, VoucherRecepcion.EstadoVoucher.APROBADO)
        self.assertTrue(
            MovimientoInventario.objects.filter(origen_tipo="VoucherLineaMP").exists()
        )
        self.assertTrue(
            Inventario.objects.filter(
                almacen=self.almacen, producto=self.producto
            ).exists()
        )
        self.assertTrue(Liquidacion.objects.filter(voucher=v).exists())


# ==============================================================================
# RecepcionCalidad legacy (OneToOne) — backward compat
# ==============================================================================


class TestRecepcionCalidadLegacy(_RecepcionFixturesMixin, BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        self._setup_fixtures()

    def _voucher_con_linea(self):
        v = VoucherRecepcion.objects.create(**self._voucher_kwargs())
        VoucherLineaMP.objects.create(
            voucher=v,
            producto=self.producto,
            peso_bruto_kg=Decimal("100.000"),
            peso_tara_kg=Decimal("0.000"),
        )
        return v

    def test_crear_recepcion_calidad(self):
        v = self._voucher_con_linea()
        qc = RecepcionCalidad.objects.create(
            voucher=v,
            parametros_medidos={"humedad": 10.5},
            resultado=RecepcionCalidad.ResultadoQC.APROBADO,
            analista=self.operador,
            fecha_analisis=timezone.now(),
        )
        self.assertEqual(qc.voucher_id, v.pk)

    def test_one_to_one_no_duplicado(self):
        v = self._voucher_con_linea()
        RecepcionCalidad.objects.create(
            voucher=v,
            parametros_medidos={},
            resultado=RecepcionCalidad.ResultadoQC.APROBADO,
            analista=self.operador,
            fecha_analisis=timezone.now(),
        )
        with self.assertRaises(IntegrityError):
            RecepcionCalidad.objects.create(
                voucher=v,
                parametros_medidos={},
                resultado=RecepcionCalidad.ResultadoQC.APROBADO,
                analista=self.operador,
                fecha_analisis=timezone.now(),
            )
