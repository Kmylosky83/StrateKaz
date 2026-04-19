"""
Tests de modelos de almacenamiento — S4.

Cubre creación, validaciones y unique_together con FK Producto.
"""
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.almacenamiento.models import (
    ConfiguracionStock,
    EstadoInventario,
    Inventario,
    MovimientoInventario,
    TipoMovimientoInventario,
)

from . import factories


class TestCatalogosAlmacenamiento(BaseTenantTestCase):
    """Tests básicos de catálogos dinámicos."""

    def test_tipo_movimiento_entrada_signo_positivo(self):
        tipo = factories.create_tipo_movimiento_entrada()
        self.assertEqual(tipo.signo_afectacion, '+')
        self.assertEqual(str(tipo), 'Entrada de Inventario')

    def test_estado_inventario_disponible(self):
        estado = factories.create_estado_disponible()
        self.assertTrue(estado.permite_uso)
        self.assertEqual(str(estado), 'Disponible')


class TestInventarioModel(BaseTenantTestCase):
    """Tests del modelo Inventario con FK Producto."""

    def setUp(self):
        super().setUp()
        factories.setup_full_supply_chain(self)

    def _inventario_base_kwargs(self, **overrides):
        kwargs = dict(
            almacen=self.almacen,
            producto=self.producto,
            lote='LOTE-001',
            estado=self.estado_disponible,
            unidad_medida=self.unidad_kg,
            cantidad_disponible=Decimal('100.000'),
            costo_unitario=Decimal('1500.00'),
            costo_promedio=Decimal('1500.00'),
        )
        kwargs.update(overrides)
        return kwargs

    def test_creacion_basica(self):
        inv = Inventario.objects.create(**self._inventario_base_kwargs())
        self.assertIsNotNone(inv.pk)
        self.assertEqual(inv.producto, self.producto)
        self.assertEqual(inv.almacen, self.almacen)

    def test_valor_total_se_calcula_en_save(self):
        inv = Inventario.objects.create(**self._inventario_base_kwargs(
            cantidad_disponible=Decimal('10.000'),
            costo_promedio=Decimal('100.00'),
        ))
        self.assertEqual(inv.valor_total, Decimal('1000.00'))

    def test_unique_together_almacen_producto_lote_estado(self):
        Inventario.objects.create(**self._inventario_base_kwargs())
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Inventario.objects.create(**self._inventario_base_kwargs())

    def test_cantidad_total_suma_disponible_reservada_transito(self):
        inv = Inventario.objects.create(**self._inventario_base_kwargs(
            cantidad_disponible=Decimal('10.000'),
            cantidad_reservada=Decimal('5.000'),
            cantidad_en_transito=Decimal('2.000'),
        ))
        self.assertEqual(inv.cantidad_total, Decimal('17.000'))

    def test_cantidad_disponible_negativa_falla(self):
        inv = Inventario(**self._inventario_base_kwargs(
            cantidad_disponible=Decimal('-1.000'),
        ))
        with self.assertRaises(ValidationError):
            inv.full_clean()

    def test_actualizar_costo_promedio_ponderado(self):
        inv = Inventario.objects.create(**self._inventario_base_kwargs(
            cantidad_disponible=Decimal('10.000'),
            costo_promedio=Decimal('100.00'),
        ))
        # 10 kg @ 100 + 10 kg @ 200 → 20 kg @ 150
        inv.actualizar_costo_promedio(Decimal('10.000'), Decimal('200.00'))
        self.assertEqual(inv.costo_promedio, Decimal('150.00'))


class TestMovimientoInventarioModel(BaseTenantTestCase):
    """Tests de MovimientoInventario."""

    def setUp(self):
        super().setUp()
        factories.setup_full_supply_chain(self)
        self.operador = self.create_user()

    def _movimiento_kwargs(self, **overrides):
        kwargs = dict(
            tipo_movimiento=self.tipo_entrada,
            almacen_destino=self.almacen,
            producto=self.producto,
            lote='LOTE-001',
            cantidad=Decimal('100.000'),
            unidad_medida=self.unidad_kg,
            costo_unitario=Decimal('1500.00'),
            registrado_por=self.operador,
        )
        kwargs.update(overrides)
        return kwargs

    def test_codigo_se_genera_automaticamente(self):
        mov = MovimientoInventario.objects.create(**self._movimiento_kwargs())
        self.assertTrue(mov.codigo)
        self.assertIn('MOV', mov.codigo)

    def test_costo_total_se_calcula(self):
        mov = MovimientoInventario.objects.create(**self._movimiento_kwargs(
            cantidad=Decimal('10.000'),
            costo_unitario=Decimal('50.00'),
        ))
        self.assertEqual(mov.costo_total, Decimal('500.00'))


class TestConfiguracionStockModel(BaseTenantTestCase):
    """Tests de ConfiguracionStock — umbrales y unique_together."""

    def setUp(self):
        super().setUp()
        factories.setup_full_supply_chain(self)

    def test_creacion_con_umbrales_validos(self):
        config = ConfiguracionStock.objects.create(
            almacen=self.almacen,
            producto=self.producto,
            stock_minimo=Decimal('10.000'),
            punto_reorden=Decimal('20.000'),
            stock_maximo=Decimal('100.000'),
        )
        self.assertIsNotNone(config.pk)

    def test_umbrales_invalidos_fallan(self):
        config = ConfiguracionStock(
            almacen=self.almacen,
            producto=self.producto,
            stock_minimo=Decimal('50.000'),
            punto_reorden=Decimal('10.000'),
            stock_maximo=Decimal('100.000'),
        )
        with self.assertRaises(ValidationError):
            config.full_clean()

    def test_unique_together_almacen_producto(self):
        ConfiguracionStock.objects.create(
            almacen=self.almacen,
            producto=self.producto,
            stock_minimo=Decimal('10.000'),
            punto_reorden=Decimal('20.000'),
            stock_maximo=Decimal('100.000'),
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ConfiguracionStock.objects.create(
                    almacen=self.almacen,
                    producto=self.producto,
                    stock_minimo=Decimal('5.000'),
                    punto_reorden=Decimal('15.000'),
                    stock_maximo=Decimal('50.000'),
                )
