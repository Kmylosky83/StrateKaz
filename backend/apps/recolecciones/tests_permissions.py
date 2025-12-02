"""
Tests para permisos del módulo Recolecciones
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from apps.core.models import Cargo
from apps.recolecciones.models import Recoleccion
from apps.recolecciones.permissions import (
    PuedeRegistrarRecoleccion,
    PuedeVerRecolecciones,
    PuedeGenerarVoucher,
    PuedeVerEstadisticas,
    PuedeEditarRecoleccion,
    PuedeEliminarRecoleccion,
)

User = get_user_model()


class PermissionsTestCase(TestCase):
    """Tests para permisos de recolecciones"""

    def setUp(self):
        """Setup inicial para tests"""
        # Crear cargos
        self.cargo_recolector = Cargo.objects.create(
            code='recolector_econorte',
            name='Recolector Econorte',
            level=0
        )
        self.cargo_comercial = Cargo.objects.create(
            code='comercial_econorte',
            name='Comercial Econorte',
            level=1
        )
        self.cargo_lider_logistica = Cargo.objects.create(
            code='lider_logistica_econorte',
            name='Líder Logística Econorte',
            level=2
        )
        self.cargo_gerente = Cargo.objects.create(
            code='gerente',
            name='Gerente',
            level=3
        )

        # Crear usuarios
        self.recolector = User.objects.create_user(
            username='recolector1',
            document_number='1000000001',
            cargo=self.cargo_recolector
        )
        self.comercial = User.objects.create_user(
            username='comercial1',
            document_number='1000000002',
            cargo=self.cargo_comercial
        )
        self.lider_logistica = User.objects.create_user(
            username='lider_log1',
            document_number='1000000003',
            cargo=self.cargo_lider_logistica
        )
        self.gerente = User.objects.create_user(
            username='gerente1',
            document_number='1000000004',
            cargo=self.cargo_gerente
        )
        self.superadmin = User.objects.create_superuser(
            username='admin',
            document_number='1000000005',
            password='admin123'
        )

        # Request factory
        self.factory = APIRequestFactory()

    def test_puede_registrar_recoleccion_recolector(self):
        """Recolector puede registrar recolecciones"""
        permission = PuedeRegistrarRecoleccion()
        request = self.factory.post('/api/recolecciones/registrar/')
        request.user = self.recolector

        self.assertTrue(permission.has_permission(request, None))

    def test_puede_registrar_recoleccion_comercial_no(self):
        """Comercial NO puede registrar recolecciones"""
        permission = PuedeRegistrarRecoleccion()
        request = self.factory.post('/api/recolecciones/registrar/')
        request.user = self.comercial

        self.assertFalse(permission.has_permission(request, None))

    def test_puede_registrar_recoleccion_lider_logistica(self):
        """Líder Logística puede registrar recolecciones"""
        permission = PuedeRegistrarRecoleccion()
        request = self.factory.post('/api/recolecciones/registrar/')
        request.user = self.lider_logistica

        self.assertTrue(permission.has_permission(request, None))

    def test_puede_registrar_recoleccion_gerente(self):
        """Gerente puede registrar recolecciones"""
        permission = PuedeRegistrarRecoleccion()
        request = self.factory.post('/api/recolecciones/registrar/')
        request.user = self.gerente

        self.assertTrue(permission.has_permission(request, None))

    def test_puede_ver_recolecciones_todos_autenticados(self):
        """Todos los usuarios autenticados pueden ver recolecciones"""
        permission = PuedeVerRecolecciones()

        for user in [self.recolector, self.comercial, self.lider_logistica, self.gerente]:
            request = self.factory.get('/api/recolecciones/')
            request.user = user
            self.assertTrue(permission.has_permission(request, None))

    def test_puede_editar_recoleccion_recolector_no(self):
        """Recolector NO puede editar recolecciones"""
        permission = PuedeEditarRecoleccion()
        request = self.factory.put('/api/recolecciones/1/')
        request.user = self.recolector

        self.assertFalse(permission.has_permission(request, None))

    def test_puede_editar_recoleccion_lider_logistica(self):
        """Líder Logística puede editar recolecciones"""
        permission = PuedeEditarRecoleccion()
        request = self.factory.put('/api/recolecciones/1/')
        request.user = self.lider_logistica

        self.assertTrue(permission.has_permission(request, None))

    def test_puede_editar_recoleccion_gerente(self):
        """Gerente puede editar recolecciones"""
        permission = PuedeEditarRecoleccion()
        request = self.factory.put('/api/recolecciones/1/')
        request.user = self.gerente

        self.assertTrue(permission.has_permission(request, None))

    def test_puede_eliminar_recoleccion_recolector_no(self):
        """Recolector NO puede eliminar recolecciones"""
        permission = PuedeEliminarRecoleccion()
        request = self.factory.delete('/api/recolecciones/1/')
        request.user = self.recolector

        self.assertFalse(permission.has_permission(request, None))

    def test_puede_eliminar_recoleccion_lider_logistica_no(self):
        """Líder Logística NO puede eliminar recolecciones"""
        permission = PuedeEliminarRecoleccion()
        request = self.factory.delete('/api/recolecciones/1/')
        request.user = self.lider_logistica

        self.assertFalse(permission.has_permission(request, None))

    def test_puede_eliminar_recoleccion_gerente(self):
        """Gerente puede eliminar recolecciones"""
        permission = PuedeEliminarRecoleccion()
        request = self.factory.delete('/api/recolecciones/1/')
        request.user = self.gerente

        self.assertTrue(permission.has_permission(request, None))

    def test_puede_eliminar_recoleccion_superadmin(self):
        """SuperAdmin puede eliminar recolecciones"""
        permission = PuedeEliminarRecoleccion()
        request = self.factory.delete('/api/recolecciones/1/')
        request.user = self.superadmin

        self.assertTrue(permission.has_permission(request, None))

    def test_puede_ver_estadisticas_recolector_no(self):
        """Recolector NO puede ver estadísticas"""
        permission = PuedeVerEstadisticas()
        request = self.factory.get('/api/recolecciones/estadisticas/')
        request.user = self.recolector

        self.assertFalse(permission.has_permission(request, None))

    def test_puede_ver_estadisticas_comercial(self):
        """Comercial puede ver estadísticas"""
        permission = PuedeVerEstadisticas()
        request = self.factory.get('/api/recolecciones/estadisticas/')
        request.user = self.comercial

        self.assertTrue(permission.has_permission(request, None))

    def test_puede_ver_estadisticas_lider_logistica(self):
        """Líder Logística puede ver estadísticas"""
        permission = PuedeVerEstadisticas()
        request = self.factory.get('/api/recolecciones/estadisticas/')
        request.user = self.lider_logistica

        self.assertTrue(permission.has_permission(request, None))

    def test_superadmin_bypasses_all_permissions(self):
        """SuperAdmin bypasses todas las restricciones"""
        permissions_list = [
            PuedeRegistrarRecoleccion(),
            PuedeVerRecolecciones(),
            PuedeGenerarVoucher(),
            PuedeVerEstadisticas(),
            PuedeEditarRecoleccion(),
            PuedeEliminarRecoleccion(),
        ]

        for permission in permissions_list:
            request = self.factory.get('/')
            request.user = self.superadmin
            self.assertTrue(
                permission.has_permission(request, None),
                f"{permission.__class__.__name__} should allow superadmin"
            )

    def test_unauthenticated_user_denied(self):
        """Usuario no autenticado es denegado"""
        from django.contrib.auth.models import AnonymousUser

        permissions_list = [
            PuedeRegistrarRecoleccion(),
            PuedeVerRecolecciones(),
            PuedeGenerarVoucher(),
            PuedeVerEstadisticas(),
            PuedeEditarRecoleccion(),
            PuedeEliminarRecoleccion(),
        ]

        for permission in permissions_list:
            request = self.factory.get('/')
            request.user = AnonymousUser()
            self.assertFalse(
                permission.has_permission(request, None),
                f"{permission.__class__.__name__} should deny anonymous user"
            )

    def test_user_without_cargo_denied(self):
        """Usuario sin cargo es denegado"""
        user_sin_cargo = User.objects.create_user(
            username='sin_cargo',
            document_number='9999999999',
            cargo=None
        )

        permissions_list = [
            PuedeRegistrarRecoleccion(),
            PuedeVerEstadisticas(),
            PuedeEditarRecoleccion(),
            PuedeEliminarRecoleccion(),
        ]

        for permission in permissions_list:
            request = self.factory.get('/')
            request.user = user_sin_cargo
            self.assertFalse(
                permission.has_permission(request, None),
                f"{permission.__class__.__name__} should deny user without cargo"
            )
