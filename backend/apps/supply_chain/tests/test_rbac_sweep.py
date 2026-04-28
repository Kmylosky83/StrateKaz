"""
Tests del sweep RBAC granular de Supply Chain (H-SC-RBAC).

Valida que los viewsets LIVE de SC ahora aplican capability checks contra
las 24 capabilities seedadas en seed_permisos_rbac.py:
    supply_chain.<seccion>.<accion>
    secciones: gestion_proveedores, catalogos, compras, almacenamiento,
               recepcion, liquidaciones
    acciones:  view, create, update, delete

Cubre 3 viewsets representativos:
    - VoucherRecepcionViewSet  (supply_chain.recepcion.*)
    - LiquidacionViewSet        (supply_chain.liquidaciones.*)
    - PrecioMateriaPrimaViewSet (supply_chain.gestion_proveedores.*)

Patrón: BaseTenantTestCase + TenantClient real + JWT real.
"""
from apps.core.tests.base import BaseTenantTestCase


def _ensure_capability(modulo_code, seccion_code, accion_code):
    """Crea (idempotente) un Permiso con código modulo.seccion.accion."""
    from apps.core.models import Permiso, PermisoAccion, PermisoAlcance, PermisoModulo

    modulo, _ = PermisoModulo.objects.get_or_create(
        code=modulo_code,
        defaults={'name': modulo_code.title(), 'orden': 99},
    )
    accion, _ = PermisoAccion.objects.get_or_create(
        code=accion_code,
        defaults={'name': accion_code.title(), 'orden': 1},
    )
    alcance, _ = PermisoAlcance.objects.get_or_create(
        code='empresa',
        defaults={'name': 'Empresa', 'nivel': 4},
    )
    code = f'{modulo_code}.{seccion_code}.{accion_code}'
    permiso, _ = Permiso.objects.get_or_create(
        code=code,
        defaults={
            'name': code,
            'modulo': modulo,
            'accion': accion,
            'alcance': alcance,
            'recurso': seccion_code,
            'is_active': True,
        },
    )
    return permiso


def _grant_capability(cargo, modulo_code, seccion_code, accion_code):
    """Asigna una capability al cargo (idempotente)."""
    from apps.core.models import CargoPermiso

    permiso = _ensure_capability(modulo_code, seccion_code, accion_code)
    CargoPermiso.objects.get_or_create(cargo=cargo, permiso=permiso)
    return permiso


class TestSupplyChainRBACSweep(BaseTenantTestCase):
    """
    Verifica que los viewsets LIVE de SC retornan 403 sin capability
    y 200/2xx con la capability correcta.
    """

    def setUp(self):
        super().setUp()
        # Cargo no-superuser para ambos casos
        self.cargo = self.create_cargo(name='Operador SC', code=f'op_sc_{self._next_id()}')
        self.user = self.create_user(
            username=f'opsc_{self._next_id()}', cargo=self.cargo,
        )
        self.headers = self.authenticate_as(self.user)

    # ─── recepcion ─────────────────────────────────────────────────────
    def test_voucher_recepcion_list_denied_sin_capability(self):
        """GET /api/supply-chain/recepcion/vouchers/ → 403 sin capability."""
        response = self.client.get(
            '/api/supply-chain/recepcion/vouchers/', **self.headers,
        )
        # 403 esperado; 404 indicaría URL mal configurada (no aplica al test).
        self.assertEqual(
            response.status_code, 403,
            f'Esperaba 403 sin capability, recibí {response.status_code}: '
            f'{response.content[:200]}',
        )

    def test_voucher_recepcion_list_allowed_con_capability(self):
        """GET /api/supply-chain/recepcion/vouchers/ → 200 con capability."""
        _grant_capability(self.cargo, 'supply_chain', 'recepcion', 'view')
        response = self.client.get(
            '/api/supply-chain/recepcion/vouchers/', **self.headers,
        )
        self.assertEqual(
            response.status_code, 200,
            f'Esperaba 200 con capability, recibí {response.status_code}: '
            f'{response.content[:200]}',
        )

    # ─── liquidaciones ────────────────────────────────────────────────
    def test_liquidacion_list_denied_sin_capability(self):
        response = self.client.get(
            '/api/supply-chain/liquidaciones/', **self.headers,
        )
        self.assertEqual(
            response.status_code, 403,
            f'Esperaba 403 sin capability, recibí {response.status_code}: '
            f'{response.content[:200]}',
        )

    def test_liquidacion_list_allowed_con_capability(self):
        _grant_capability(self.cargo, 'supply_chain', 'liquidaciones', 'view')
        response = self.client.get(
            '/api/supply-chain/liquidaciones/', **self.headers,
        )
        self.assertEqual(
            response.status_code, 200,
            f'Esperaba 200 con capability, recibí {response.status_code}: '
            f'{response.content[:200]}',
        )

    # ─── gestion_proveedores (precios MP) ─────────────────────────────
    def test_precio_materia_prima_list_denied_sin_capability(self):
        response = self.client.get(
            '/api/supply-chain/precios-mp/',
            **self.headers,
        )
        self.assertEqual(
            response.status_code, 403,
            f'Esperaba 403 sin capability, recibí {response.status_code}: '
            f'{response.content[:200]}',
        )

    def test_precio_materia_prima_list_allowed_con_capability(self):
        _grant_capability(self.cargo, 'supply_chain', 'gestion_proveedores', 'view')
        response = self.client.get(
            '/api/supply-chain/precios-mp/',
            **self.headers,
        )
        self.assertEqual(
            response.status_code, 200,
            f'Esperaba 200 con capability, recibí {response.status_code}: '
            f'{response.content[:200]}',
        )

    # ─── superuser bypass ─────────────────────────────────────────────
    def test_superuser_bypassa_rbac(self):
        """Superuser pasa todos los checks sin necesidad de capability."""
        admin = self.create_user(
            username=f'admin_{self._next_id()}', is_superuser=True, is_staff=True,
        )
        admin_headers = self.authenticate_as(admin)
        response = self.client.get(
            '/api/supply-chain/recepcion/vouchers/', **admin_headers,
        )
        self.assertEqual(
            response.status_code, 200,
            f'Superuser debe pasar, recibí {response.status_code}: '
            f'{response.content[:200]}',
        )
