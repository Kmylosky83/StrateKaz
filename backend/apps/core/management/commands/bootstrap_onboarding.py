"""
Management command: bootstrap_onboarding

Crea registros TenantOnboarding y UserOnboarding para tenants y usuarios
existentes que no los tienen.

Uso:
    python manage.py bootstrap_onboarding              # Todos los tenants
    python manage.py bootstrap_onboarding --tenant demo # Solo un tenant
    python manage.py bootstrap_onboarding --dry-run     # Solo mostrar qué haría
"""
import logging

from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Crea registros de onboarding para tenants y usuarios existentes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            default=None,
            help='Código del tenant específico (sin prefijo tenant_)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo mostrar qué se haría, sin crear registros',
        )

    def handle(self, *args, **options):
        from apps.tenant.models import Tenant

        tenant_code = options.get('tenant')
        dry_run = options.get('dry_run', False)

        if dry_run:
            self.stdout.write(self.style.WARNING('=== DRY RUN ==='))

        # Filtrar tenants activos y listos
        tenants = Tenant.objects.filter(
            schema_status='ready',
            is_active=True,
        ).exclude(schema_name='public')

        if tenant_code:
            tenants = tenants.filter(code=tenant_code)

        if not tenants.exists():
            self.stdout.write(self.style.WARNING('No se encontraron tenants.'))
            return

        total_tenant_onb = 0
        total_user_onb = 0

        for tenant in tenants:
            self.stdout.write(f'\n--- Tenant: {tenant.name} ({tenant.schema_name}) ---')

            # 1. TenantOnboarding (schema public)
            tenant_onb_created = self._bootstrap_tenant_onboarding(tenant, dry_run)
            total_tenant_onb += tenant_onb_created

            # 2. UserOnboarding (schema tenant)
            user_onb_created = self._bootstrap_user_onboarding(tenant, dry_run)
            total_user_onb += user_onb_created

        self.stdout.write(self.style.SUCCESS(
            f'\nResumen: {total_tenant_onb} TenantOnboarding + '
            f'{total_user_onb} UserOnboarding creados'
            f'{" (dry-run)" if dry_run else ""}'
        ))

    def _bootstrap_tenant_onboarding(self, tenant, dry_run):
        from apps.tenant.models_onboarding import TenantOnboarding

        if TenantOnboarding.objects.filter(tenant=tenant).exists():
            self.stdout.write(f'  TenantOnboarding: ya existe')
            return 0

        if dry_run:
            self.stdout.write(f'  TenantOnboarding: se crearía')
            return 1

        TenantOnboarding.objects.create(tenant=tenant)
        self.stdout.write(self.style.SUCCESS(f'  TenantOnboarding: creado'))
        return 1

    def _bootstrap_user_onboarding(self, tenant, dry_run):
        from django.apps import apps as django_apps

        User = django_apps.get_model('core', 'User')
        UserOnboarding = django_apps.get_model('core', 'UserOnboarding')

        created_count = 0

        with schema_context(tenant.schema_name):
            users = User.objects.filter(is_active=True)
            for user in users:
                if UserOnboarding.objects.filter(user=user).exists():
                    continue

                if dry_run:
                    self.stdout.write(
                        f'  UserOnboarding: se crearía para {user.email}'
                    )
                    created_count += 1
                    continue

                # Determinar tipo
                onboarding_type = self._resolve_type(user)

                UserOnboarding.objects.create(
                    user=user,
                    onboarding_type=onboarding_type,
                )
                self.stdout.write(self.style.SUCCESS(
                    f'  UserOnboarding: creado para {user.email} '
                    f'(tipo={onboarding_type})'
                ))
                created_count += 1

        return created_count

    def _resolve_type(self, user):
        if user.is_superuser:
            return 'admin'
        if user.cargo and getattr(user.cargo, 'is_jefatura', False):
            return 'jefe'
        if getattr(user, 'proveedor_id_ext', None):
            return 'proveedor'
        if getattr(user, 'cliente_id_ext', None):
            return 'cliente'
        return 'empleado'
