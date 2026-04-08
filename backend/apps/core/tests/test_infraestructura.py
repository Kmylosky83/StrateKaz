"""
Tests del Sub-bloque 7 — Infraestructura Transversal

Cubre:
- get_tenant_empresa() (función con 68 consumidores)
- Signal: propagate_section_to_cargos (mágico — crea CargoSectionAccess al crear TabSection)
- Signal: auto_create_tenant_user (mágico — crea TenantUser en schema public)
- Signal: auto_create_user_onboarding (mágico — crea UserOnboarding al crear User)
- Signal: propagate_nivel_firma_on_cargo_change (propaga nivel_firma a usuarios)
- Importabilidad de tareas Celery críticas

Base: BaseTenantTestCase (schema real, datos reales, sin mocks)
"""

from apps.core.tests.base import BaseTenantTestCase


class TestGetTenantEmpresa(BaseTenantTestCase):
    """Tests para get_tenant_empresa() — la función más importada del codebase."""

    def test_returns_empresa_when_exists(self):
        """Si ya existe EmpresaConfig en el schema, la retorna."""
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa(auto_create=True)
        self.assertIsNotNone(empresa)

        # Llamar de nuevo debe retornar la misma instancia
        empresa2 = get_tenant_empresa(auto_create=False)
        self.assertEqual(empresa.pk, empresa2.pk)

    def test_auto_creates_when_missing(self):
        """Con auto_create=True, crea EmpresaConfig si no existe."""
        from django.apps import apps
        from apps.core.base_models.mixins import get_tenant_empresa

        EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')
        EmpresaConfig.objects.all().delete()

        empresa = get_tenant_empresa(auto_create=True)
        self.assertIsNotNone(empresa)
        self.assertEqual(EmpresaConfig.objects.count(), 1)

    def test_returns_none_when_missing_and_no_autocreate(self):
        """Con auto_create=False, retorna None si no existe EmpresaConfig."""
        from django.apps import apps
        from apps.core.base_models.mixins import get_tenant_empresa

        EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')
        EmpresaConfig.objects.all().delete()

        result = get_tenant_empresa(auto_create=False)
        self.assertIsNone(result)


class TestSignalPropagateSectionToCargos(BaseTenantTestCase):
    """
    Test del signal mágico: al crear TabSection, se auto-crean
    CargoSectionAccess para los cargos activos existentes.
    """

    def test_creating_section_propagates_to_existing_cargo(self):
        """Crear una TabSection debe crear CargoSectionAccess para cargos existentes."""
        from apps.core.models import CargoSectionAccess

        cargo = self.create_cargo(nivel='OPERATIVO')
        _, _, section = self.create_module_with_section()

        access = CargoSectionAccess.objects.filter(
            cargo=cargo, section=section
        ).first()
        self.assertIsNotNone(access, "El signal debe propagar la sección al cargo existente")
        self.assertTrue(access.can_view)


class TestSignalAutoCreateTenantUser(BaseTenantTestCase):
    """
    Test del signal mágico: al crear un User en un tenant, se auto-crea
    TenantUser + TenantUserAccess en el schema public.
    """

    def test_creating_user_creates_tenant_user(self):
        """Crear un User no-superuser debe crear TenantUser en public."""
        from django.db import connection
        from django_tenants.utils import schema_context

        user = self.create_user('nuevo_empleado')

        # Verificar en schema public
        with schema_context('public'):
            from apps.tenant.models import TenantUser
            tu = TenantUser.objects.filter(email=user.email).first()
            self.assertIsNotNone(tu, "Debe existir TenantUser en public schema")
            self.assertTrue(tu.is_active)


class TestSignalAutoCreateOnboarding(BaseTenantTestCase):
    """
    Test del signal mágico: al crear un User, se auto-crea UserOnboarding.
    """

    def test_creating_user_creates_onboarding(self):
        """Al crear un User se debe crear automáticamente su UserOnboarding."""
        from apps.core.models import UserOnboarding

        user = self.create_user('nuevo_usuario')

        onboarding = UserOnboarding.objects.filter(user=user).first()
        self.assertIsNotNone(onboarding, "Debe existir UserOnboarding para el usuario nuevo")
        self.assertEqual(onboarding.onboarding_type, 'empleado')
        self.assertEqual(onboarding.profile_percentage, 0)

    def test_superuser_gets_admin_onboarding_type(self):
        """Superuser sin cargo recibe tipo 'admin'."""
        from apps.core.models import UserOnboarding
        from django.contrib.auth import get_user_model

        User = get_user_model()
        admin = User.objects.create_superuser(
            username=f'admin_{self._next_id()}',
            email=f'admin_{self._next_id()}@test.com',
            password='testpass123',
        )

        onboarding = UserOnboarding.objects.filter(user=admin).first()
        self.assertIsNotNone(onboarding)
        self.assertEqual(onboarding.onboarding_type, 'admin')


class TestSignalPropagateNivelFirma(BaseTenantTestCase):
    """
    Test del signal: al cambiar nivel_jerarquico de un Cargo, se propaga
    nivel_firma a los usuarios de ese cargo.
    """

    def test_cargo_nivel_change_propagates_to_users(self):
        """Cambiar nivel_jerarquico del cargo actualiza nivel_firma de sus usuarios."""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        cargo = self.create_cargo(nivel='OPERATIVO')
        user = self.create_user('emp_firma', cargo=cargo)

        # Nivel OPERATIVO → nivel_firma=1
        user.refresh_from_db()
        self.assertEqual(user.nivel_firma, 1)

        # Cambiar cargo a ESTRATEGICO → nivel_firma=3
        cargo.nivel_jerarquico = 'ESTRATEGICO'
        cargo.save(update_fields=['nivel_jerarquico'])

        user.refresh_from_db()
        self.assertEqual(user.nivel_firma, 3)


class TestCeleryTasksImportable(BaseTenantTestCase):
    """
    Smoke test: las tareas Celery críticas (Tier 1) son importables
    y están registradas correctamente.
    """

    def test_critical_tasks_importable(self):
        """Todas las tareas críticas deben ser importables sin error."""
        from apps.core.tasks import (
            send_email_async,
            send_welcome_email_task,
            send_setup_password_email_task,
            system_health_check,
            backup_database,
            cleanup_temp_files,
            check_pending_activations,
            check_incomplete_profiles,
        )

        # Verificar que son tareas Celery registradas
        self.assertTrue(hasattr(send_email_async, 'delay'))
        self.assertTrue(hasattr(system_health_check, 'delay'))
        self.assertTrue(hasattr(backup_database, 'delay'))
        self.assertTrue(hasattr(check_pending_activations, 'delay'))

    def test_deleted_stubs_not_importable(self):
        """Las tareas eliminadas NO deben existir."""
        import importlib
        tasks_module = importlib.import_module('apps.core.tasks')

        self.assertFalse(hasattr(tasks_module, 'generate_report_async'))
        self.assertFalse(hasattr(tasks_module, 'process_file_upload'))
        self.assertFalse(hasattr(tasks_module, 'example_task'))
        self.assertFalse(hasattr(tasks_module, 'long_running_task'))
