"""
Tests para PrecioRutaSemiAutonoma — H-SC-RUTA-02.
"""
from decimal import Decimal

from django.core.exceptions import ValidationError

from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.catalogos.models import (
    RutaRecoleccion, PrecioRutaSemiAutonoma,
)


class TestPrecioRutaSemiAutonomaValidaciones(BaseTenantTestCase):
    def setUp(self):
        super().setUp()
        self.ruta_semi = RutaRecoleccion.objects.create(
            nombre='Econorte',
            modo_operacion=RutaRecoleccion.ModoOperacion.SEMI_AUTONOMA,
        )
        self.ruta_pass = RutaRecoleccion.objects.create(
            nombre='Norte',
            modo_operacion=RutaRecoleccion.ModoOperacion.PASS_THROUGH,
        )

    def test_no_aplica_a_ruta_pass_through(self):
        """PrecioRutaSemiAutonoma solo debe aceptar rutas SEMI_AUTONOMA."""
        # Crear instancia sin save() para llamar full_clean()
        precio = PrecioRutaSemiAutonoma(
            ruta=self.ruta_pass,
            precio_ruta_paga_proveedor=Decimal('100'),
            precio_empresa_paga_ruta=Decimal('150'),
        )
        # No tenemos proveedor/producto reales, pero el clean() de modo_operacion
        # se chequea antes — verificamos que dispara el error correcto
        with self.assertRaises(ValidationError) as ctx:
            precio.clean()
        self.assertIn('ruta', ctx.exception.message_dict)

    def test_precio_ruta_no_negativo(self):
        precio = PrecioRutaSemiAutonoma(
            ruta=self.ruta_semi,
            precio_ruta_paga_proveedor=Decimal('-1'),
            precio_empresa_paga_ruta=Decimal('100'),
        )
        with self.assertRaises(ValidationError) as ctx:
            precio.clean()
        self.assertIn('precio_ruta_paga_proveedor', ctx.exception.message_dict)

    def test_precio_empresa_debe_ser_mayor_o_igual(self):
        """precio_empresa_paga_ruta debe ser >= precio_ruta_paga_proveedor."""
        precio = PrecioRutaSemiAutonoma(
            ruta=self.ruta_semi,
            precio_ruta_paga_proveedor=Decimal('200'),
            precio_empresa_paga_ruta=Decimal('150'),  # menor
        )
        with self.assertRaises(ValidationError) as ctx:
            precio.clean()
        self.assertIn('precio_empresa_paga_ruta', ctx.exception.message_dict)

    def test_margen_ruta_calculado(self):
        """margen_ruta = precio_empresa - precio_ruta."""
        precio = PrecioRutaSemiAutonoma(
            ruta=self.ruta_semi,
            precio_ruta_paga_proveedor=Decimal('100'),
            precio_empresa_paga_ruta=Decimal('130'),
        )
        self.assertEqual(precio.margen_ruta, Decimal('30'))
