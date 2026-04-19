"""
Tests de viewsets de almacenamiento — CRUD básico con JWT auth.

Valida que las URLs responden y los permisos de IsAuthenticated aplican.
"""
from decimal import Decimal

from django.urls import reverse

from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.almacenamiento.models import Inventario

from . import factories


class TestInventarioViewSetAuth(BaseTenantTestCase):
    """Auth: endpoints requieren autenticación."""

    def setUp(self):
        super().setUp()
        # Necesario para pasar ModuleAccessMiddleware
        self.create_system_module(code='supply_chain', name='Supply Chain')

    def test_list_unauthenticated_returns_401(self):
        response = self.client.get('/api/supply-chain/almacenamiento/inventarios/')
        self.assertEqual(response.status_code, 401)


class TestInventarioViewSetCRUD(BaseTenantTestCase):
    """CRUD básico de Inventario autenticado."""

    def setUp(self):
        super().setUp()
        self.create_system_module(code='supply_chain', name='Supply Chain')
        factories.setup_full_supply_chain(self)
        self.user = self.create_user()
        self.headers = self.authenticate_as(self.user)

        self.inventario = Inventario.objects.create(
            almacen=self.almacen,
            producto=self.producto,
            lote='LOTE-TEST',
            estado=self.estado_disponible,
            unidad_medida=self.unidad_kg,
            cantidad_disponible=Decimal('100.000'),
            costo_unitario=Decimal('1500.00'),
            costo_promedio=Decimal('1500.00'),
        )

    def test_list_returns_inventarios(self):
        response = self.client.get('/api/supply-chain/almacenamiento/inventarios/', **self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        results = data.get('results', data)
        self.assertGreaterEqual(len(results), 1)

    def test_detail_expone_producto_codigo_y_nombre_desde_fk(self):
        response = self.client.get(
            f'/api/supply-chain/almacenamiento/inventarios/{self.inventario.pk}/',
            **self.headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['producto'], self.producto.pk)
        self.assertEqual(data['producto_codigo'], self.producto.codigo)
        self.assertEqual(data['producto_nombre'], self.producto.nombre)

    def test_reservar_action_reduce_disponible(self):
        response = self.client.post(
            f'/api/supply-chain/almacenamiento/inventarios/{self.inventario.pk}/reservar/',
            data={'cantidad': 30},
            content_type='application/json',
            **self.headers,
        )
        self.assertEqual(response.status_code, 200)
        self.inventario.refresh_from_db()
        self.assertEqual(self.inventario.cantidad_disponible, Decimal('70.000'))
        self.assertEqual(self.inventario.cantidad_reservada, Decimal('30.000'))


class TestTipoMovimientoViewSet(BaseTenantTestCase):
    """Catálogo TipoMovimiento — CRUD básico."""

    def setUp(self):
        super().setUp()
        self.create_system_module(code='supply_chain', name='Supply Chain')
        self.user = self.create_user()
        self.headers = self.authenticate_as(self.user)

    def test_crear_tipo_movimiento_via_api(self):
        response = self.client.post(
            '/api/supply-chain/almacenamiento/tipos-movimiento/',
            data={
                'codigo': 'SALIDA',
                'nombre': 'Salida de Inventario',
                'afecta_stock': 'NEGATIVO',
                'requiere_origen': True,
                'requiere_destino': False,
            },
            content_type='application/json',
            **self.headers,
        )
        self.assertEqual(response.status_code, 201, response.content)
        data = response.json()
        self.assertEqual(data['codigo'], 'SALIDA')
        self.assertEqual(data['signo'], '-')
