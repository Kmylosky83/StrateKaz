"""
Tests para VoucherRecoleccion — H-SC-RUTA-02.

Tests de líneas requieren Producto (con unidad_medida + categoría) y se
agregarán cuando esté el flujo completo (Commit 6 frontend + smoke test).
"""
from datetime import date

from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.catalogos.models import RutaRecoleccion
from apps.supply_chain.recoleccion.models import VoucherRecoleccion


class TestVoucherRecoleccionAutoCodigo(BaseTenantTestCase):
    def test_codigo_se_auto_genera(self):
        user = self.create_user('operador')
        ruta = RutaRecoleccion.objects.create(nombre='Norte')
        v1 = VoucherRecoleccion.objects.create(
            ruta=ruta, fecha_recoleccion=date.today(), operador=user,
        )
        v2 = VoucherRecoleccion.objects.create(
            ruta=ruta, fecha_recoleccion=date.today(), operador=user,
        )
        self.assertEqual(v1.codigo, 'VRC-001')
        self.assertEqual(v2.codigo, 'VRC-002')

    def test_codigo_explicito_se_respeta(self):
        user = self.create_user('op_explicito')
        ruta = RutaRecoleccion.objects.create(nombre='Sur')
        v = VoucherRecoleccion.objects.create(
            codigo='VRC-CUSTOM',
            ruta=ruta, fecha_recoleccion=date.today(), operador=user,
        )
        self.assertEqual(v.codigo, 'VRC-CUSTOM')

    def test_estado_default_borrador(self):
        user = self.create_user('op_default')
        ruta = RutaRecoleccion.objects.create(nombre='Default')
        v = VoucherRecoleccion.objects.create(
            ruta=ruta, fecha_recoleccion=date.today(), operador=user,
        )
        self.assertEqual(v.estado, VoucherRecoleccion.Estado.BORRADOR)

    def test_total_lineas_y_kilos_sin_lineas(self):
        user = self.create_user('op_totales')
        ruta = RutaRecoleccion.objects.create(nombre='Totales')
        v = VoucherRecoleccion.objects.create(
            ruta=ruta, fecha_recoleccion=date.today(), operador=user,
        )
        self.assertEqual(v.total_lineas, 0)
        self.assertEqual(v.total_kilos, 0)

    def test_choices_estado(self):
        choices = dict(VoucherRecoleccion.Estado.choices)
        self.assertIn('BORRADOR', choices)
        self.assertIn('COMPLETADO', choices)
        self.assertIn('CONSOLIDADO', choices)
        self.assertEqual(len(choices), 3)
