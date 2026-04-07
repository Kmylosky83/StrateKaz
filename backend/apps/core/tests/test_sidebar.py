"""
Tests del Sub-bloque 3 — System Modules / Sidebar.

Cubre:
1. Sidebar retorna módulos correctos para un cargo con permisos
2. Sidebar vacío para usuario sin cargo
3. Superuser ve todos los módulos habilitados
4. Módulo deshabilitado no aparece en el sidebar
5. Middleware module_access retorna 403 para módulo deshabilitado
"""

from django.test import RequestFactory
from django.http import JsonResponse
from rest_framework import status

from apps.core.tests.base import BaseTenantTestCase


class SidebarEndpointTests(BaseTenantTestCase):
    """Tests del endpoint GET /api/core/system-modules/sidebar/"""

    SIDEBAR_URL = '/api/core/system-modules/sidebar/'

    def test_sidebar_returns_modules_for_cargo(self):
        """
        Un usuario con cargo y CargoSectionAccess sobre dos módulos
        recibe esos dos módulos en el sidebar.
        """
        cargo = self.create_cargo(name='Analista Test')
        user = self.create_user(cargo=cargo)

        mod_a, _, sec_a = self.create_module_with_section()
        mod_b, _, sec_b = self.create_module_with_section()
        self.grant_section_access(cargo, sec_a)
        self.grant_section_access(cargo, sec_b)

        headers = self.authenticate_as(user)
        response = self.client.get(self.SIDEBAR_URL, **headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()

        visible_codes = self._extract_module_codes(payload)
        self.assertIn(mod_a.code, visible_codes)
        self.assertIn(mod_b.code, visible_codes)

    def test_sidebar_empty_for_user_without_cargo(self):
        """
        Un usuario sin cargo asignado no ve ningún módulo en el sidebar.
        """
        user = self.create_user(cargo=None)

        mod_orphan, _, _ = self.create_module_with_section()

        headers = self.authenticate_as(user)
        response = self.client.get(self.SIDEBAR_URL, **headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        visible_codes = self._extract_module_codes(response.json())
        self.assertNotIn(mod_orphan.code, visible_codes)

    def test_sidebar_superuser_sees_all(self):
        """
        Un superuser ve todos los módulos habilitados sin pasar por RBAC.
        """
        superuser = self.create_user(
            is_superuser=True,
            is_staff=True,
        )

        mod_x, _, _ = self.create_module_with_section()
        mod_y, _, _ = self.create_module_with_section()

        headers = self.authenticate_as(superuser)
        response = self.client.get(self.SIDEBAR_URL, **headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        visible_codes = self._extract_module_codes(response.json())
        self.assertIn(mod_x.code, visible_codes)
        self.assertIn(mod_y.code, visible_codes)

    def test_sidebar_hides_disabled_module(self):
        """
        Un módulo con is_enabled=False NO aparece en el sidebar
        aunque el cargo tenga permisos sobre él.
        """
        cargo = self.create_cargo(name='Cargo Disabled')
        user = self.create_user(cargo=cargo)

        mod_off, _, sec_off = self.create_module_with_section(is_enabled=False)
        self.grant_section_access(cargo, sec_off)

        headers = self.authenticate_as(user)
        response = self.client.get(self.SIDEBAR_URL, **headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        visible_codes = self._extract_module_codes(response.json())
        self.assertNotIn(mod_off.code, visible_codes)

    # ------------------------------------------------------------------
    # Helper interno
    # ------------------------------------------------------------------
    def _extract_module_codes(self, payload):
        """
        Extrae todos los `code` de módulos del payload del sidebar,
        sea cual sea la estructura (lista plana, categorías anidadas, etc.).

        Lógica: un nodo con `code` y sin `is_category=True` es un módulo.
        Los nodos con `is_category=True` son wrappers de capa — se ignoran
        pero se recorren sus children.
        """
        codes = set()

        def walk(node):
            if isinstance(node, dict):
                is_category = node.get('is_category', False)
                if 'code' in node and not is_category:
                    codes.add(node['code'])
                children = node.get('children')
                if children:
                    walk(children)
            elif isinstance(node, list):
                for item in node:
                    walk(item)

        walk(payload)
        return codes


class ModuleAccessMiddlewareTests(BaseTenantTestCase):
    """
    Test del middleware module_access (Test #5).
    Instanciamos el middleware directamente con un request fabricado.
    """

    def test_middleware_returns_403_for_disabled_module(self):
        """
        El middleware retorna 403 cuando el módulo mapeado a la URL
        está deshabilitado en SystemModule.
        """
        from apps.core.middleware.module_access import (
            ModuleAccessMiddleware,
            URL_TO_MODULE_CODE,
        )
        from apps.core.models import SystemModule

        self.assertTrue(
            URL_TO_MODULE_CODE,
            'URL_TO_MODULE_CODE está vacío — no se puede testear el middleware',
        )
        sample_url, mapped_codes = next(iter(URL_TO_MODULE_CODE.items()))
        target_code = (
            mapped_codes[0]
            if isinstance(mapped_codes, (list, tuple))
            else mapped_codes
        )

        SystemModule.objects.update_or_create(
            code=target_code,
            defaults={
                'name': f'Test {target_code}',
                'category': 'OPERATIONAL',
                'is_enabled': False,
            },
        )

        factory = RequestFactory()
        request = factory.get(f'/{sample_url.lstrip("/")}')
        user = self.create_user()
        request.user = user

        def fail_get_response(req):
            raise AssertionError(
                'get_response fue llamado — el middleware no bloqueó el request'
            )

        middleware = ModuleAccessMiddleware(fail_get_response)
        response = middleware(request)

        self.assertIsInstance(response, JsonResponse)
        self.assertEqual(response.status_code, 403)
