"""
Tests de LiquidacionPeriodica — H-SC-06.

Cubre:
- Crear LiquidacionPeriodica + recalcular_totales suma correcto.
- Transición confirmar BORRADOR -> CONFIRMADA con snapshot de aprobador.
- Task celery genera periódica para proveedor con frecuencia SEMANAL.

Patrón: BaseTenantTestCase (django-tenants schema real).
"""
from datetime import date, timedelta
from decimal import Decimal

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
from apps.supply_chain.catalogos.models import Almacen, TipoAlmacen
from apps.supply_chain.gestion_proveedores.models import PrecioMateriaPrima
from apps.supply_chain.liquidaciones.models import (
    EstadoLiquidacion,
    Liquidacion,
    LiquidacionPeriodica,
)
from apps.supply_chain.recepcion.models import VoucherLineaMP, VoucherRecepcion


class LiquidacionPeriodicaBaseSetup(BaseTenantTestCase):
    """Helpers compartidos para crear catálogos + voucher + liquidación."""

    def _setup_catalogos(self):
        self.tipo_doc = TipoDocumentoIdentidad.objects.get_or_create(
            codigo='NIT',
            defaults={'nombre': 'NIT', 'orden': 1},
        )[0]
        self.tipo_proveedor = TipoProveedor.objects.create(
            codigo=f'MP_{self._next_id()}',
            nombre='Proveedor MP test',
            requiere_materia_prima=True,
            orden=1,
        )
        self.categoria = CategoriaProducto.objects.create(
            nombre=f'Cat_{self._next_id()}', orden=1,
        )
        self.unidad = UnidadMedida.objects.create(
            nombre=f'Kg_{self._next_id()}',
            abreviatura=f'kg{self._next_id()[-3:]}',
            tipo='PESO',
            es_base=True,
        )
        self.producto = Producto.objects.create(
            codigo=f'P_{self._next_id()}',
            nombre='Sebo test',
            categoria=self.categoria,
            unidad_medida=self.unidad,
            tipo='MATERIA_PRIMA',
        )
        self.tipo_almacen = TipoAlmacen.objects.create(
            codigo=f'SL_{self._next_id()}',
            nombre='Silo',
            orden=1,
        )
        self.almacen = Almacen.objects.create(
            codigo=f'A_{self._next_id()}',
            nombre='Almacén',
            tipo_almacen=self.tipo_almacen,
            permite_recepcion=True,
        )

    def _crear_proveedor(self, frecuencia=Proveedor.FrecuenciaPago.SEMANAL):
        nid = self._next_id()
        return Proveedor.objects.create(
            tipo_proveedor=self.tipo_proveedor,
            nombre_comercial=f'Finca {nid}',
            razon_social=f'Finca {nid} S.A.S.',
            tipo_documento=self.tipo_doc,
            numero_documento=f'9001{nid[-5:]}',
            frecuencia_pago=frecuencia,
            is_active=True,
        )

    def _crear_liquidacion_aprobada(self, proveedor, total=Decimal('1000.00')):
        """Crea Voucher + Liquidacion APROBADA con total especificado."""
        PrecioMateriaPrima.objects.get_or_create(
            proveedor=proveedor,
            producto=self.producto,
            defaults={'precio_kg': Decimal('3500.00')},
        )
        voucher = VoucherRecepcion.objects.create(
            proveedor=proveedor,
            modalidad_entrega='DIRECTO',
            fecha_viaje=date.today(),
            almacen_destino=self.almacen,
            operador_bascula=self.user,
        )
        VoucherLineaMP.objects.create(
            voucher=voucher,
            producto=self.producto,
            peso_bruto_kg=Decimal('1050.000'),
            peso_tara_kg=Decimal('50.000'),
        )
        liq = Liquidacion.desde_voucher(voucher)
        # Forzar totales conocidos para aserciones determinísticas.
        liq.subtotal = total
        liq.ajuste_calidad_total = Decimal('0.00')
        liq.total = total
        liq.estado = EstadoLiquidacion.APROBADA
        liq.fecha_aprobacion = timezone.now()
        liq.save(
            update_fields=[
                'subtotal',
                'ajuste_calidad_total',
                'total',
                'estado',
                'fecha_aprobacion',
                'updated_at',
            ]
        )
        return liq


class TestLiquidacionPeriodicaTotales(LiquidacionPeriodicaBaseSetup):
    """Suma de M2M -> recalcular_totales."""

    def setUp(self):
        super().setUp()
        self._setup_catalogos()
        self.user = self.create_user()
        self.proveedor = self._crear_proveedor()

    def test_recalcular_totales_suma_correctamente(self):
        liq1 = self._crear_liquidacion_aprobada(
            self.proveedor, total=Decimal('1000.00'),
        )
        liq2 = self._crear_liquidacion_aprobada(
            self.proveedor, total=Decimal('2500.50'),
        )
        periodica = LiquidacionPeriodica.objects.create(
            proveedor=self.proveedor,
            periodo_inicio=date.today() - timedelta(days=7),
            periodo_fin=date.today(),
            frecuencia=Proveedor.FrecuenciaPago.SEMANAL,
        )
        periodica.liquidaciones.set([liq1, liq2])
        periodica.recalcular_totales()
        periodica.refresh_from_db()
        self.assertEqual(periodica.subtotal, Decimal('3500.50'))
        self.assertEqual(periodica.total, Decimal('3500.50'))
        self.assertEqual(periodica.ajuste_calidad_total, Decimal('0.00'))


class TestLiquidacionPeriodicaTransicion(LiquidacionPeriodicaBaseSetup):
    """Transición de estados via método del modelo (sin pasar por viewset)."""

    def setUp(self):
        super().setUp()
        self._setup_catalogos()
        self.user = self.create_user()
        self.proveedor = self._crear_proveedor()

    def test_confirmar_setea_estado_aprobador_y_fecha(self):
        periodica = LiquidacionPeriodica.objects.create(
            proveedor=self.proveedor,
            periodo_inicio=date.today() - timedelta(days=7),
            periodo_fin=date.today(),
            frecuencia=Proveedor.FrecuenciaPago.SEMANAL,
        )
        # Lógica del viewset replicada inline (testing puro de dominio).
        self.assertEqual(periodica.estado, LiquidacionPeriodica.Estado.BORRADOR)

        periodica.estado = LiquidacionPeriodica.Estado.CONFIRMADA
        periodica.aprobado_por = self.user
        periodica.fecha_aprobacion = timezone.now()
        periodica.save()

        periodica.refresh_from_db()
        self.assertEqual(periodica.estado, LiquidacionPeriodica.Estado.CONFIRMADA)
        self.assertEqual(periodica.aprobado_por, self.user)
        self.assertIsNotNone(periodica.fecha_aprobacion)


class TestTaskCeleryGeneraPeriodica(LiquidacionPeriodicaBaseSetup):
    """Task `generar_liquidaciones_periodicas_borrador` para proveedor SEMANAL."""

    def setUp(self):
        super().setUp()
        self._setup_catalogos()
        self.user = self.create_user()

    def test_task_genera_periodica_para_proveedor_semanal(self):
        from apps.supply_chain.tasks import (
            generar_liquidaciones_periodicas_borrador,
        )

        proveedor = self._crear_proveedor(
            frecuencia=Proveedor.FrecuenciaPago.SEMANAL,
        )
        # Liquidación APROBADA dentro del período (hoy).
        self._crear_liquidacion_aprobada(proveedor, total=Decimal('1500.00'))

        # Ejecutar task en modo eager (testing.py la corre sincrónicamente).
        result = generar_liquidaciones_periodicas_borrador()

        self.assertIn('1', result)  # 1 liquidación periódica creada/actualizada
        periodicas = LiquidacionPeriodica.objects.filter(proveedor=proveedor)
        self.assertEqual(periodicas.count(), 1)
        periodica = periodicas.first()
        self.assertEqual(periodica.frecuencia, Proveedor.FrecuenciaPago.SEMANAL)
        self.assertEqual(periodica.estado, LiquidacionPeriodica.Estado.BORRADOR)
        self.assertEqual(periodica.liquidaciones.count(), 1)
        self.assertEqual(periodica.total, Decimal('1500.00'))

    def test_task_omite_proveedor_inmediato(self):
        from apps.supply_chain.tasks import (
            generar_liquidaciones_periodicas_borrador,
        )

        proveedor = self._crear_proveedor(
            frecuencia=Proveedor.FrecuenciaPago.INMEDIATA,
        )
        self._crear_liquidacion_aprobada(proveedor, total=Decimal('500.00'))

        generar_liquidaciones_periodicas_borrador()
        self.assertEqual(
            LiquidacionPeriodica.objects.filter(proveedor=proveedor).count(),
            0,
        )
