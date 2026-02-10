"""
Bootstrap completo de producción para StrateKaz.

Resuelve el problema de que el tenant público (schema_name='public')
NO tiene tablas de TENANT_APPS porque django-tenants solo crea esas
tablas en schemas de tenant propios (tenant_xxx), no en 'public'.

Este comando:
1. Verifica/crea el TenantUser superadmin en schema public (SHARED_APPS)
2. Verifica/crea el Tenant con un schema propio (tenant_stratekaz)
3. Crea el schema en PostgreSQL si no existe
4. Corre migraciones en el schema del tenant
5. Crea el User (core) dentro del schema del tenant
6. Carga seed data (módulos, permisos, cargo admin)
7. Asocia el dominio app.stratekaz.com al tenant

Uso:
    DJANGO_SETTINGS_MODULE=config.settings.production python manage.py bootstrap_production
    DJANGO_SETTINGS_MODULE=config.settings.production python manage.py bootstrap_production --domain=app.stratekaz.com
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
            default='app.stratekaz.com',
            help='Dominio principal del tenant',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING(
            '\n══════════════════════════════════════════════'
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  STRATEKAZ - Bootstrap de Producción'
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '══════════════════════════════════════════════\n'
        ))

        email = options['email'].lower().strip()
        password = options['password']
        tenant_code = options['tenant_code']
        tenant_name = options['tenant_name']
        domain = options['domain']
        schema_name = f'tenant_{tenant_code}'

        # ══════════════════════════════════════════════
        # FASE 1: TenantUser superadmin (schema public)
        # ══════════════════════════════════════════════
        self.stdout.write('\n📌 Fase 1: TenantUser superadmin (schema public)')
        self.stdout.write('─' * 50)

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
            self.stdout.write(self.style.SUCCESS(f'   ✅ TenantUser creado: {email}'))
        else:
            self.stdout.write(f'   ℹ️  TenantUser ya existe: {email}')
            # Asegurar que es superadmin
            if not tenant_user.is_superadmin:
                tenant_user.is_superadmin = True
                tenant_user.save(update_fields=['is_superadmin'])
                self.stdout.write('   → Marcado como superadmin')

        # ══════════════════════════════════════════════
        # FASE 2: Planes (schema public)
        # ══════════════════════════════════════════════
        self.stdout.write('\n📌 Fase 2: Planes de suscripción')
        self.stdout.write('─' * 50)

        from apps.tenant.models import Plan
        plan, plan_created = Plan.objects.get_or_create(
            code='empresarial',
            defaults={
                'name': 'Plan Empresarial',
                'description': 'Todos los módulos incluidos.',
                'max_users': 100,
                'max_storage_gb': 100,
                'is_default': True,
                'order': 1,
            }
        )
        if plan_created:
            self.stdout.write(self.style.SUCCESS('   ✅ Plan Empresarial creado'))
        else:
            self.stdout.write('   ℹ️  Plan Empresarial ya existe')

        # ══════════════════════════════════════════════
        # FASE 3: Tenant (schema public)
        # ══════════════════════════════════════════════
        self.stdout.write('\n📌 Fase 3: Tenant')
        self.stdout.write('─' * 50)

        from apps.tenant.models import Tenant
        tenant = Tenant.objects.filter(code=tenant_code).first()

        if tenant:
            old_schema = tenant.schema_name
            if old_schema == 'public':
                self.stdout.write(self.style.WARNING(
                    f'   ⚠️  Tenant existe con schema_name="public" (incorrecto)'
                ))
                self.stdout.write(f'   → Actualizando a schema_name="{schema_name}"')
                tenant.schema_name = schema_name
                tenant.save(update_fields=['schema_name'])
            elif old_schema == schema_name:
                self.stdout.write(f'   ℹ️  Tenant ya existe: {tenant.name} (schema: {schema_name})')
            else:
                self.stdout.write(f'   ℹ️  Tenant existe con schema: {old_schema}')
                schema_name = old_schema  # Usar el schema existente
        else:
            tenant = Tenant(
                code=tenant_code,
                name=tenant_name,
                schema_name=schema_name,
                plan=plan,
                is_active=True,
                schema_status='creating',
                created_by=tenant_user,
            )
            # Bypass auto_create_schema=False
            tenant.auto_create_schema = False
            tenant.save()
            self.stdout.write(self.style.SUCCESS(
                f'   ✅ Tenant creado: {tenant_name} (schema: {schema_name})'
            ))

        # ══════════════════════════════════════════════
        # FASE 4: Crear schema PostgreSQL
        # ══════════════════════════════════════════════
        self.stdout.write('\n📌 Fase 4: Schema PostgreSQL')
        self.stdout.write('─' * 50)

        with connection.cursor() as cursor:
            cursor.execute(
                f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'
            )
        self.stdout.write(self.style.SUCCESS(f'   ✅ Schema "{schema_name}" listo'))

        # ══════════════════════════════════════════════
        # FASE 4b: Limpiar migraciones fantasma del schema public
        # ══════════════════════════════════════════════
        # Las migraciones de TENANT_APPS quedaron registradas en public
        # pero sin tablas reales. Limpiar para evitar conflictos.
        self.stdout.write('\n📌 Fase 4b: Limpiar migraciones fantasma (schema public)')
        self.stdout.write('─' * 50)

        shared_apps = ('contenttypes', 'sessions', 'tenant')
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM public.django_migrations WHERE app NOT IN %s",
                [shared_apps]
            )
            deleted = cursor.rowcount
        if deleted:
            self.stdout.write(self.style.WARNING(
                f'   🧹 {deleted} registros fantasma eliminados de public.django_migrations'
            ))
        else:
            self.stdout.write('   ℹ️  Sin registros fantasma')

        # ══════════════════════════════════════════════
        # FASE 5: Migraciones en el schema del tenant
        # ══════════════════════════════════════════════
        self.stdout.write('\n📌 Fase 5: Migraciones')
        self.stdout.write('─' * 50)
        self.stdout.write(f'   Ejecutando migraciones en schema "{schema_name}"...')
        self.stdout.write('   (esto puede tardar varios minutos)')

        call_command(
            'migrate_schemas',
            schema_name=schema_name,
            interactive=False,
            verbosity=1,
        )
        self.stdout.write(self.style.SUCCESS('   ✅ Migraciones completadas'))

        # ══════════════════════════════════════════════
        # FASE 6: Seed data dentro del schema del tenant
        # ══════════════════════════════════════════════
        self.stdout.write('\n📌 Fase 6: Datos iniciales (seeds)')
        self.stdout.write('─' * 50)

        from django_tenants.utils import schema_context
        with schema_context(schema_name):
            # 6a. Estructura de módulos
            try:
                call_command('seed_estructura_final', verbosity=0)
                self.stdout.write(self.style.SUCCESS('   ✅ seed_estructura_final'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'   ⚠️  seed_estructura_final: {e}'))

            # 6b. Permisos RBAC
            try:
                call_command('seed_permisos_rbac', verbosity=0)
                self.stdout.write(self.style.SUCCESS('   ✅ seed_permisos_rbac'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'   ⚠️  seed_permisos_rbac: {e}'))

            # 6c. Cargo Admin
            try:
                call_command('seed_admin_cargo', verbosity=0)
                self.stdout.write(self.style.SUCCESS('   ✅ seed_admin_cargo'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'   ⚠️  seed_admin_cargo: {e}'))

        # ══════════════════════════════════════════════
        # FASE 7: User superadmin dentro del tenant
        # ══════════════════════════════════════════════
        self.stdout.write('\n📌 Fase 7: User en schema del tenant')
        self.stdout.write('─' * 50)

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
                self.stdout.write(self.style.SUCCESS(f'   ✅ User creado en {schema_name}: {email}'))
            else:
                self.stdout.write(f'   ℹ️  User ya existe en {schema_name}: {email}')
                # Asegurar permisos
                if not user.is_superuser:
                    user.is_superuser = True
                    user.is_staff = True
                    user.save(update_fields=['is_superuser', 'is_staff'])

        # ══════════════════════════════════════════════
        # FASE 8: Dominio
        # ══════════════════════════════════════════════
        self.stdout.write('\n📌 Fase 8: Dominio')
        self.stdout.write('─' * 50)

        from apps.tenant.models import Domain
        # Limpiar dominios viejos que apunten a este tenant
        Domain.objects.filter(tenant=tenant).delete()
        Domain.objects.create(
            domain=domain,
            tenant=tenant,
            is_primary=True,
        )
        self.stdout.write(self.style.SUCCESS(f'   ✅ Dominio configurado: {domain} → {schema_name}'))

        # ══════════════════════════════════════════════
        # FASE 9: TenantUserAccess
        # ══════════════════════════════════════════════
        self.stdout.write('\n📌 Fase 9: Acceso del superadmin al tenant')
        self.stdout.write('─' * 50)

        from apps.tenant.models import TenantUserAccess
        access, access_created = TenantUserAccess.objects.get_or_create(
            tenant_user=tenant_user,
            tenant=tenant,
            defaults={'is_admin': True}
        )
        if access_created:
            self.stdout.write(self.style.SUCCESS('   ✅ Acceso otorgado'))
        else:
            self.stdout.write('   ℹ️  Acceso ya existía')

        # ══════════════════════════════════════════════
        # FASE 10: Actualizar estado del tenant
        # ══════════════════════════════════════════════
        tenant.schema_status = 'ready'
        tenant.schema_error = ''
        tenant.save(update_fields=['schema_status', 'schema_error'])

        # ══════════════════════════════════════════════
        # RESUMEN
        # ══════════════════════════════════════════════
        self.stdout.write('\n' + '═' * 50)
        self.stdout.write(self.style.MIGRATE_HEADING('  ✅ BOOTSTRAP COMPLETADO'))
        self.stdout.write('═' * 50)
        self.stdout.write(f'\n  Tenant:     {tenant.name}')
        self.stdout.write(f'  Schema:     {schema_name}')
        self.stdout.write(f'  Dominio:    {domain}')
        self.stdout.write(f'  SuperAdmin: {email}')
        self.stdout.write(f'  Password:   {password}')
        self.stdout.write(f'\n  URL: https://{domain}/login')
        self.stdout.write('\n  Próximo paso: reiniciar gunicorn')
        self.stdout.write('  pkill gunicorn && DJANGO_SETTINGS_MODULE=config.settings.production '
                          'gunicorn config.wsgi:application --bind 127.0.0.1:8000 '
                          '--workers 3 --timeout 120 --daemon '
                          '--access-logfile /var/log/stratekaz/gunicorn-access.log '
                          '--error-logfile /var/log/stratekaz/gunicorn-error.log')
        self.stdout.write('')
