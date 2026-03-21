"""
sync_nivel_firma - Sincroniza nivel_firma de todos los usuarios

1. Actualiza Cargo.level desde nivel_jerarquico (elimina desconexión legacy)
2. Auto-asigna User.nivel_firma basado en cargo.nivel_jerarquico
   (respeta nivel_firma_manual=True)
"""
from django.core.management.base import BaseCommand
from django.db import connection

from django_tenants.utils import get_tenant_model, tenant_context


# Mapeo: nivel_jerarquico → nivel_firma
NIVEL_MAP = {
    'ESTRATEGICO': 3,
    'TACTICO': 2,
    'OPERATIVO': 1,
    'APOYO': 1,
    'EXTERNO': 1,
}


class Command(BaseCommand):
    help = 'Sincroniza Cargo.level y User.nivel_firma en todos los tenants'

    def handle(self, *args, **options):
        TenantModel = get_tenant_model()
        tenants = TenantModel.objects.exclude(schema_name='public')

        self.stdout.write(f'Procesando {tenants.count()} tenants...\n')

        for tenant in tenants:
            with tenant_context(tenant):
                self._sync_tenant(tenant)

        self.stdout.write(self.style.SUCCESS('\nSincronización completada.'))

    def _sync_tenant(self, tenant):
        from apps.core.models import Cargo
        from django.contrib.auth import get_user_model
        User = get_user_model()

        self.stdout.write(f'\n--- {tenant.name} ({tenant.schema_name}) ---')

        # 1. Sincronizar Cargo.level desde nivel_jerarquico
        cargos_updated = 0
        for cargo in Cargo.objects.all():
            expected_level = cargo.NIVEL_JERARQUICO_TO_LEVEL.get(
                cargo.nivel_jerarquico, 0
            )
            if cargo.level != expected_level:
                Cargo.objects.filter(pk=cargo.pk).update(level=expected_level)
                self.stdout.write(
                    f'  Cargo "{cargo.code}": level {cargo.level} → {expected_level}'
                )
                cargos_updated += 1

        # 2. Sincronizar User.nivel_firma
        users_updated = 0
        users_skipped = 0
        for user in User.objects.filter(
            is_active=True, deleted_at__isnull=True
        ).select_related('cargo'):
            if user.nivel_firma_manual:
                users_skipped += 1
                continue

            if user.cargo and user.cargo.nivel_jerarquico:
                expected = NIVEL_MAP.get(user.cargo.nivel_jerarquico, 1)
            else:
                expected = 1

            if user.nivel_firma != expected:
                User.objects.filter(pk=user.pk).update(nivel_firma=expected)
                self.stdout.write(
                    f'  User "{user.username}" ({user.cargo.code if user.cargo else "sin cargo"}): '
                    f'nivel_firma {user.nivel_firma} → {expected}'
                )
                users_updated += 1

        self.stdout.write(
            f'  Resultado: {cargos_updated} cargos, '
            f'{users_updated} usuarios actualizados, '
            f'{users_skipped} manuales omitidos'
        )
