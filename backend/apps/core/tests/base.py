"""
BaseTenantTestCase — Base para todos los tests de backend que tocan TENANT_APPS.

Hereda de FastTenantTestCase (django-tenants) que:
- Crea el schema de test UNA sola vez por clase (no por test)
- Limpia datos entre tests (flush_data=True)
- Reutiliza el schema si ya existe

Uso:
    from apps.core.tests.base import BaseTenantTestCase

    class TestMiFeature(BaseTenantTestCase):
        def test_algo(self):
            user = self.create_user('ana')
            headers = self.authenticate_as(user)
            response = self.client.get('/api/algo/', **headers)
            self.assertEqual(response.status_code, 200)
"""

import hashlib

from django.contrib.auth import get_user_model

from django_tenants.test.cases import FastTenantTestCase
from django_tenants.test.client import TenantClient
from django_tenants.utils import get_tenant_domain_model, get_tenant_model

User = get_user_model()


class BaseTenantTestCase(FastTenantTestCase):
    """
    Base para tests de StrateKaz que requieren un tenant con schema real.

    Provee helpers para crear usuarios, autenticación JWT, y factories
    mínimas de modelos core (Cargo, SystemModule).
    """

    @classmethod
    def get_test_schema_name(cls):
        return 'test'

    @classmethod
    def get_test_tenant_domain(cls):
        return 'tenant.test.com'

    @classmethod
    def use_existing_tenant(cls):
        """
        Override: cuando FastTenantTestCase reutiliza un tenant pre-existente
        (--keepdb), asegurar que tiene un Domain con is_primary=True. Sin
        esto, TenantClient revienta con AttributeError 'NoneType.domain' al
        llamar tenant.get_primary_domain().domain (django-tenants
        FastTenantTestCase no setea is_primary por default).

        Se ejecuta en setUpClass cuando el tenant ya existe en test_db.
        """
        DomainModel = get_tenant_domain_model()
        tenant_domain = cls.get_test_tenant_domain()
        domain, _ = DomainModel.objects.get_or_create(
            tenant=cls.tenant,
            domain=tenant_domain,
            defaults={'is_primary': True},
        )
        if not domain.is_primary:
            DomainModel.objects.filter(tenant=cls.tenant).update(is_primary=False)
            domain.is_primary = True
            domain.save(update_fields=['is_primary'])
        cls.domain = domain

    @classmethod
    def setup_test_tenant_and_domain(cls):
        """
        Override necesario porque nuestro modelo Tenant tiene
        auto_create_schema=False (creación asíncrona vía Celery en prod).
        Aquí forzamos la creación síncrona del schema para tests.
        """
        TenantModel = get_tenant_model()
        DomainModel = get_tenant_domain_model()

        cls.tenant = TenantModel(
            schema_name=cls.get_test_schema_name(),
            code='test',
            name='Test Tenant',
        )
        cls.setup_tenant(cls.tenant)
        cls.tenant.save(verbosity=cls.get_verbosity())

        # noqa: TENANT-LIFECYCLE
        # BaseTenantTestCase crea schemas directamente sin el
        # TenantLifecycleService porque hereda de FastTenantTestCase
        # (django-tenants) que gestiona su propio ciclo de setup/teardown.
        # El servicio agregaría seeds, locks y validaciones innecesarias
        # para el contexto de unittest donde el schema es efímero y
        # controlado por el framework de test.
        cls.tenant.create_schema(
            check_if_exists=True,
            sync_schema=True,
            verbosity=0,
        )

        # Dominio de test — idempotente con is_primary=True garantizado.
        # FastTenantTestCase reusa el schema entre runs (--keepdb), así que
        # un Domain creado por un setup anterior con is_primary=False (bug
        # legacy) debe ser corregido aquí para que TenantClient pueda
        # resolver tenant.get_primary_domain().domain.
        tenant_domain = cls.get_test_tenant_domain()
        cls.domain, _ = DomainModel.objects.get_or_create(
            tenant=cls.tenant,
            domain=tenant_domain,
            defaults={'is_primary': True},
        )
        if not cls.domain.is_primary:
            cls.domain.is_primary = True
            cls.domain.save(update_fields=['is_primary'])
        cls.setup_domain(cls.domain)

        cls.use_new_tenant()

    def _pre_setup(self):
        """
        Override para reemplazar self.client por un TenantClient que
        apunta automáticamente al schema del tenant de test. Sin esto,
        self.client.get() llega al schema 'public' y las tablas de
        TENANT_APPS no existen.
        """
        super()._pre_setup()
        self.client = TenantClient(self.tenant)
        self._test_counter = 0

    def _next_id(self):
        """
        Genera un sufijo único corto para códigos de objetos creados en tests.
        Formato: '{hash6}_{counter}' — max 9 chars (asume <100 objetos por test).
        """
        self._test_counter += 1
        test_hash = hashlib.md5(self._testMethodName.encode()).hexdigest()[:6]
        return f'{test_hash}_{self._test_counter}'

    # ==========================================================================
    # HELPERS — Usuarios
    # ==========================================================================

    def create_user(self, username=None, email=None, password='testpass123', **kwargs):
        """Crea un User dentro del tenant de test."""
        if username is None:
            username = f'user_{self._next_id()}'
        if email is None:
            email = f'{username}@test.com'
        defaults = {
            'first_name': username.capitalize(),
            'last_name': 'Test',
            'document_type': 'CC',
            'document_number': str(hash(username))[-10:].lstrip('-'),
            'is_active': True,
        }
        defaults.update(kwargs)
        return User.objects.create_user(
            username=username,
            email=email,
            password=password,
            **defaults,
        )

    @staticmethod
    def authenticate_as(user):
        """
        Genera JWT access token y devuelve dict de headers HTTP.

        Uso: response = self.client.get('/api/.../', **self.authenticate_as(user))
        """
        from rest_framework_simplejwt.tokens import AccessToken

        token = AccessToken.for_user(user)
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    # ==========================================================================
    # HELPERS — Factories mínimas
    # ==========================================================================

    def create_cargo(self, name='Cargo Test', code=None, nivel='OPERATIVO', area=None, **kwargs):
        """Factory mínima de Cargo. Crea Area si no se provee."""
        from apps.core.models import Cargo

        if area is None:
            from apps.gestion_estrategica.organizacion.models import Area
            area_code = f'a_{self._next_id()}'
            area = Area.objects.create(
                code=area_code,
                name='Proceso Test',
                tipo='APOYO',
            )
        if code is None:
            code = f'cargo_{self._next_id()}'
        defaults = {
            'area': area,
            'nivel_jerarquico': nivel,
        }
        defaults.update(kwargs)
        return Cargo.objects.create(code=code, name=name, **defaults)

    def create_system_module(self, code=None, name=None, **kwargs):
        """Factory mínima de SystemModule."""
        from apps.core.models import SystemModule

        if code is None:
            code = f'mod_{self._next_id()}'
        if name is None:
            name = code.replace('_', ' ').title()
        defaults = {
            'is_enabled': True,
            'category': 'OPERATIONAL',
        }
        defaults.update(kwargs)
        return SystemModule.objects.create(code=code, name=name, **defaults)

    # ==========================================================================
    # HELPERS — Factories compuestas (sidebar / RBAC)
    # ==========================================================================

    def create_module_with_section(
        self,
        module_code=None,
        module_name=None,
        category='OPERATIONAL',
        is_enabled=True,
        tab_code=None,
        section_code=None,
    ):
        """
        Crea SystemModule + ModuleTab + TabSection en cascada.
        Devuelve la tupla (module, tab, section).
        """
        from apps.core.models import SystemModule, ModuleTab, TabSection

        if module_code is None:
            module_code = f'mod_{self._next_id()}'
        module = SystemModule.objects.create(
            code=module_code,
            name=module_name or module_code.replace('_', ' ').title(),
            category=category,
            is_enabled=is_enabled,
        )
        tab = ModuleTab.objects.create(
            module=module,
            code=tab_code or f'{module_code}_tab',
            name='Main Tab',
            is_enabled=True,
        )
        section = TabSection.objects.create(
            tab=tab,
            code=section_code or f'{module_code}_sec',
            name='Default Section',
            is_enabled=True,
        )
        return module, tab, section

    def grant_section_access(
        self,
        cargo,
        section,
        can_view=True,
        can_create=False,
        can_edit=False,
        can_delete=False,
    ):
        """
        Crea o actualiza un CargoSectionAccess. Usa get_or_create porque
        el signal rbac_signals auto-propaga secciones nuevas a cargos
        existentes, y el registro puede ya existir.
        """
        from apps.core.models import CargoSectionAccess

        obj, created = CargoSectionAccess.objects.get_or_create(
            cargo=cargo,
            section=section,
            defaults={
                'can_view': can_view,
                'can_create': can_create,
                'can_edit': can_edit,
                'can_delete': can_delete,
            },
        )
        if not created:
            obj.can_view = can_view
            obj.can_create = can_create
            obj.can_edit = can_edit
            obj.can_delete = can_delete
            obj.save(update_fields=['can_view', 'can_create', 'can_edit', 'can_delete'])
        return obj
