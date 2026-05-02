"""
Tests para VoucherRecoleccion — H-SC-RUTA-02 refactor 2 (1 = 1 parada).
"""
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError

from apps.core.tests.base import BaseTenantTestCase
from apps.core.models import TipoDocumentoIdentidad
from apps.supply_chain.catalogos.models import RutaRecoleccion
from apps.supply_chain.recoleccion.models import VoucherRecoleccion


def _crear_proveedor(numero, nombre='Productor Test'):
    tipo_doc, _ = TipoDocumentoIdentidad.objects.get_or_create(
        codigo='CC',
        defaults={'nombre': 'Cédula de Ciudadanía', 'orden': 1, 'is_active': True},
    )
    from apps.infraestructura.catalogo_productos.proveedores.models import Proveedor
    return Proveedor.objects.create(
        razon_social=nombre,
        nombre_comercial=nombre,
        tipo_persona=Proveedor.TipoPersona.NATURAL,
        tipo_documento=tipo_doc,
        numero_documento=numero,
    )


class TestVoucherRecoleccionAutoCodigo(BaseTenantTestCase):
    def test_codigo_se_auto_genera(self):
        user = self.create_user('operador')
        ruta = RutaRecoleccion.objects.create(nombre='Norte')
        prov = _crear_proveedor('111111')
        # Crear producto
        from apps.infraestructura.catalogo_productos.models import Producto
        prod = Producto.objects.create(
            codigo='LECHE', nombre='Leche cruda', tipo='MATERIA_PRIMA',
        )
        v1 = VoucherRecoleccion.objects.create(
            ruta=ruta, fecha_recoleccion=date.today(),
            proveedor=prov, producto=prod, cantidad=Decimal('150'),
            operador=user,
        )
        # Crear segundo proveedor para no chocar con FK
        prov2 = _crear_proveedor('222222', 'Otro Productor')
        v2 = VoucherRecoleccion.objects.create(
            ruta=ruta, fecha_recoleccion=date.today(),
            proveedor=prov2, producto=prod, cantidad=Decimal('80'),
            operador=user,
        )
        self.assertEqual(v1.codigo, 'VRC-001')
        self.assertEqual(v2.codigo, 'VRC-002')


class TestVoucherRecoleccionValidaciones(BaseTenantTestCase):
    def test_cantidad_negativa_o_cero_invalida(self):
        user = self.create_user('op2')
        ruta = RutaRecoleccion.objects.create(nombre='Sur')
        prov = _crear_proveedor('333333')
        from apps.infraestructura.catalogo_productos.models import Producto
        prod = Producto.objects.create(
            codigo='LECHE2', nombre='Leche', tipo='MATERIA_PRIMA',
        )
        v = VoucherRecoleccion(
            ruta=ruta, fecha_recoleccion=date.today(),
            proveedor=prov, producto=prod, cantidad=Decimal('0'),
            operador=user,
        )
        with self.assertRaises(ValidationError):
            v.full_clean()

    def test_estado_default_borrador(self):
        user = self.create_user('op3')
        ruta = RutaRecoleccion.objects.create(nombre='Sur2')
        prov = _crear_proveedor('444444')
        from apps.infraestructura.catalogo_productos.models import Producto
        prod = Producto.objects.create(
            codigo='LECHE3', nombre='Leche', tipo='MATERIA_PRIMA',
        )
        v = VoucherRecoleccion.objects.create(
            ruta=ruta, fecha_recoleccion=date.today(),
            proveedor=prov, producto=prod, cantidad=Decimal('1'),
            operador=user,
        )
        self.assertEqual(v.estado, VoucherRecoleccion.Estado.BORRADOR)
