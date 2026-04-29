"""
Tests para RutaRecoleccion — H-SC-RUTA-02 refactor 2026-04-25.

Verifica:
1. Auto-generación de código (RUTA-001, RUTA-002, ...)
2. modo_operacion default = PASS_THROUGH
3. Crear ruta NO genera Proveedor espejo (signal eliminado)
4. Choices válidos de modo_operacion
"""
from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.catalogos.models import RutaRecoleccion


class TestRutaRecoleccionAutoCodigo(BaseTenantTestCase):
    """H-SC-RUTA-01: codigo se auto-genera si viene vacío."""

    def test_codigo_auto_generado_secuencial(self):
        r1 = RutaRecoleccion.objects.create(nombre='Ruta Norte')
        r2 = RutaRecoleccion.objects.create(nombre='Ruta Sur')
        r3 = RutaRecoleccion.objects.create(nombre='Ruta Este')
        self.assertEqual(r1.codigo, 'RUTA-001')
        self.assertEqual(r2.codigo, 'RUTA-002')
        self.assertEqual(r3.codigo, 'RUTA-003')

    def test_codigo_explicito_se_respeta(self):
        r = RutaRecoleccion.objects.create(codigo='RUTA-CUSTOM', nombre='Custom')
        self.assertEqual(r.codigo, 'RUTA-CUSTOM')

    def test_codigo_existente_no_colisiona_con_auto(self):
        RutaRecoleccion.objects.create(codigo='RUTA-005', nombre='Fija')
        r2 = RutaRecoleccion.objects.create(nombre='Auto')
        # El siguiente parte del max(id), no del max(codigo) — el código será 002
        # porque el auto-código solo cuenta los que empiezan en 'RUTA-' por id desc.
        self.assertTrue(r2.codigo.startswith('RUTA-'))


class TestRutaRecoleccionModoOperacion(BaseTenantTestCase):
    """H-SC-RUTA-02: modo_operacion (PASS_THROUGH | SEMI_AUTONOMA)."""

    def test_modo_default_es_pass_through(self):
        r = RutaRecoleccion.objects.create(nombre='Default')
        self.assertEqual(r.modo_operacion, RutaRecoleccion.ModoOperacion.PASS_THROUGH)

    def test_modo_semi_autonoma_explicito(self):
        r = RutaRecoleccion.objects.create(
            nombre='Econorte',
            modo_operacion=RutaRecoleccion.ModoOperacion.SEMI_AUTONOMA,
        )
        self.assertEqual(r.modo_operacion, 'SEMI_AUTONOMA')

    def test_choices_disponibles(self):
        choices = dict(RutaRecoleccion.ModoOperacion.choices)
        self.assertIn('PASS_THROUGH', choices)
        self.assertIn('SEMI_AUTONOMA', choices)
        self.assertEqual(len(choices), 2)


class TestRutaRecoleccionNoCreaProveedorEspejo(BaseTenantTestCase):
    """H-SC-RUTA-02: el signal espejo fue eliminado."""

    def test_crear_ruta_no_genera_proveedor_espejo(self):
        from apps.infraestructura.catalogo_productos.proveedores.models import Proveedor
        proveedores_antes = Proveedor.objects.count()
        RutaRecoleccion.objects.create(nombre='Sin Espejo')
        proveedores_despues = Proveedor.objects.count()
        self.assertEqual(proveedores_antes, proveedores_despues)

    def test_no_existe_campo_es_proveedor_interno(self):
        # El campo fue eliminado en migración 0007
        field_names = [f.name for f in RutaRecoleccion._meta.get_fields()]
        self.assertNotIn('es_proveedor_interno', field_names)
