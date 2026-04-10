"""
Bootstrap completo de producción para StrateKaz.

Crea un tenant operativo con schema, migraciones, seeds y superadmin.
Idempotente: correrlo 2 veces no rompe nada.

Usa TenantLifecycleService para la creación del tenant (fases 3-6+8+10),
garantizando el invariante row↔schema. El setup de admin (fases 1,2,7,9)
queda fuera del servicio porque es concern de bootstrap, no de lifecycle.

Uso:
    DJANGO_SETTINGS_MODULE=config.settings.production python manage.py bootstrap_production
    DJANGO_SETTINGS_MODULE=config.settings.production python manage.py bootstrap_production --domain=stratekaz.com
    DJANGO_SETTINGS_MODULE=config.settings.production python manage.py bootstrap_production --tenant-code=stratekaz
"""
import logging
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection

logger = logging.getLogger('apps')


class Command(BaseCommand):
    help = 'Bootstrap completo de producción: tenant, schema, migraciones, seeds, superadmin'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@stratekaz.com',
            help='Email del superadmin',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='Admin.2024!',
            help='Contraseña del superadmin',
        )
        parser.add_argument(
            '--tenant-code',
            type=str,
            default='stratekaz',
            help='Código del tenant (se usará como tenant_{code} para el schema)',
        )
        parser.add_argument(
            '--tenant-name',
            type=str,
            default='StrateKaz Demo',
            help='Nombre del tenant',
        )
        parser.add_argument(
            '--domain',
            type=str,
            default='stratekaz.com',
            help='Dominio principal del tenant',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING(
            '\n=============================================='
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  STRATEKAZ - Bootstrap de Produccion'
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '==============================================\n'
        ))

        email = options['email'].lower().strip()
        password = options['password']
        tenant_code = options['tenant_code']
        tenant_name = options['tenant_name']
        domain = options['domain']
        schema_name = f'tenant_{tenant_code}'

        # ==============================================
        # FASE 1: TenantUser superadmin (schema public)
        # ==============================================
        self.stdout.write('\n[*]Fase 1: TenantUser superadmin (schema public)')
        self.stdout.write('-' * 50)

        from apps.tenant.models import TenantUser
        tenant_user, created = TenantUser.objects.get_or_create(
            email=email,
            defaults={
                'first_name': 'Super',
                'last_name': 'Admin',
                'is_active': True,
                'is_superadmin': True,
            }
        )
        if created:
            tenant_user.set_password(password)
            tenant_user.save()
            self.stdout.write(self.style.SUCCESS(f'   [OK]TenantUser creado: {email}'))
        else:
            self.stdout.write(f'   [i]TenantUser ya existe: {email}')
            # Asegurar que es superadmin
            if not tenant_user.is_superadmin:
                tenant_user.is_superadmin = True
                tenant_user.save(update_fields=['is_superadmin'])
                self.stdout.write('   ->Marcado como superadmin')

        # ==============================================
        # FASE 2: Planes (schema public)
        # ==============================================
        self.stdout.write('\n[*]Fase 2: Planes de suscripcion')
        self.stdout.write('-' * 50)

        from apps.tenant.models import Plan
        plan, plan_created = Plan.objects.get_or_create(
            code='empresarial',
            defaults={
                'name': 'Plan Empresarial',
                'description': 'Todos los modulos incluidos.',
                'max_users': 100,
                'max_storage_gb': 100,
                'is_default': True,
                'order': 1,
            }
        )
        if plan_created:
            self.stdout.write(self.style.SUCCESS('   [OK]Plan Empresarial creado'))
        else:
            self.stdout.write('   [i]Plan Empresarial ya existe')

        # ==============================================
        # FASES 3-6+8+10: Tenant via TenantLifecycleService
        # ==============================================
        # Delega al servicio: row + domain + schema + migrate + seeds + ready.
        # plan_code='empresarial' es el plan de producción (creado en Fase 2).
        # is_trial=False porque bootstrap de producción no es trial.
        self.stdout.write('\n[*]Fases 3-6: Tenant + Schema + Migraciones + Seeds')
        self.stdout.write('-' * 50)
        self.stdout.write(f'   Schema: {schema_name}')
        self.stdout.write('   (esto puede tardar varios minutos)')

        from apps.tenant.services import TenantLifecycleService, TenantAlreadyExistsError

        tenant = None
        try:
            tenant, warnings = TenantLifecycleService.create_tenant(
                schema_name=schema_name,
                name=tenant_name,
                domain_url=domain,
                plan_code='empresarial',
                is_trial=False,
            )
            self.stdout.write(self.style.SUCCESS(
                f'   [OK]Tenant creado: {tenant_name} (schema: {schema_name})'
            ))
            for w in warnings:
                self.stdout.write(self.style.WARNING(f'   [warn]{w}'))

        except TenantAlreadyExistsError:
            # Idempotencia: si el tenant ya existe, validar invariante y continuar.
            status = TenantLifecycleService.validate_invariant(schema_name)
            if status.is_consistent:
                from django_tenants.utils import get_tenant_model
                tenant = get_tenant_model().objects.get(schema_name=schema_name)
                self.stdout.write(
                    f'   [i]Tenant ya existe: {tenant.name} (schema: {schema_name})'
                )
            else:
                self.stderr.write(self.style.ERROR(
                    f'   [ERROR]Tenant {schema_name} existe pero en estado inconsistente: '
                    f'{status.inconsistency_type}. Correr cleanup_orphan_schemas o '
                    f'delete_tenant antes de reintentar bootstrap.'
                ))
                return

        # ============================================================
        # Fase 4b — Cleanup de migraciones fantasma (legacy)
        # ============================================================
        # Limpia registros de django_migrations en public.* que NO
        # corresponden a SHARED_APPS. Parche histórico para tenants
        # creados antes de que django-tenants separara correctamente
        # migraciones shared vs tenant.
        #
        # Corre SIEMPRE porque es idempotente y barato: si no hay
        # registros fantasma, el DELETE no afecta nada.
        #
        # NO pertenece al TenantLifecycleService porque no es parte
        # del lifecycle de tenants nuevos — es reparación de estado
        # legacy en el schema public.
        #
        # Hallazgo relacionado: H18 — evaluar si este cleanup sigue
        # siendo necesario o si puede eliminarse con evidencia de que
        # ningún tenant activo depende de él.
        # ============================================================
        self.stdout.write('\n[*]Fase 4b: Limpiar migraciones fantasma (schema public)')
        self.stdout.write('-' * 50)

        shared_apps = ('contenttypes', 'sessions', 'tenant')
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM public.django_migrations WHERE app NOT IN %s",
                [shared_apps]
            )
            deleted = cursor.rowcount
        if deleted:
            self.stdout.write(self.style.WARNING(
                f'   [clean]{deleted} registros fantasma eliminados de public.django_migrations'
            ))
        else:
            self.stdout.write('   [i]Sin registros fantasma')

        # ==============================================
        # FASE 7: User superadmin dentro del tenant
        # ==============================================
        self.stdout.write('\n[*]Fase 7: User en schema del tenant')
        self.stdout.write('-' * 50)

        from django_tenants.utils import schema_context
        with schema_context(schema_name):
            from apps.core.models import User
            user, user_created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': 'Super',
                    'last_name': 'Admin',
                    'is_active': True,
                    'is_staff': True,
                    'is_superuser': True,
                }
            )
            if user_created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'   [OK]User creado en {schema_name}: {email}'))
            else:
                self.stdout.write(f'   [i]User ya existe en {schema_name}: {email}')
                # Asegurar permisos
                if not user.is_superuser:
                    user.is_superuser = True
                    user.is_staff = True
                    user.save(update_fields=['is_superuser', 'is_staff'])

        # ==============================================
        # FASE 9: TenantUserAccess
        # ==============================================
        self.stdout.write('\n[*]Fase 9: Acceso del superadmin al tenant')
        self.stdout.write('-' * 50)

        from apps.tenant.models import TenantUserAccess
        access, access_created = TenantUserAccess.objects.get_or_create(
            tenant_user=tenant_user,
            tenant=tenant,
            defaults={'is_active': True}
        )
        if access_created:
            self.stdout.write(self.style.SUCCESS('   [OK]Acceso otorgado'))
        else:
            self.stdout.write('   [i]Acceso ya existia')

        # ==============================================
        # RESUMEN
        # ==============================================
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.MIGRATE_HEADING('  [OK] BOOTSTRAP COMPLETADO'))
        self.stdout.write('=' * 50)
        self.stdout.write(f'\n  Tenant:     {tenant.name}')
        self.stdout.write(f'  Schema:     {schema_name}')
        self.stdout.write(f'  Dominio:    {domain}')
        self.stdout.write(f'  SuperAdmin: {email}')
        self.stdout.write(f'  Password:   {password}')
        self.stdout.write(f'\n  URL: https://{domain}/login')
        self.stdout.write('\n  Proximo paso: reiniciar gunicorn')
        self.stdout.write('  pkill gunicorn && DJANGO_SETTINGS_MODULE=config.settings.production '
                          'gunicorn config.wsgi:application --bind 127.0.0.1:8000 '
                          '--workers 3 --timeout 120 --daemon '
                          '--access-logfile /var/log/stratekaz/gunicorn-access.log '
                          '--error-logfile /var/log/stratekaz/gunicorn-error.log')
        self.stdout.write('')
