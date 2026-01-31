"""
Management command para crear un nuevo tenant.

Uso:
    python manage.py create_tenant

Este comando:
1. Solicita datos del nuevo tenant
2. Crea el registro en la BD master
3. Crea la base de datos del tenant
4. Ejecuta las migraciones
5. Crea el usuario administrador inicial
6. Crea la configuración de empresa inicial
"""
import getpass
import re
from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.db import connections, connection
from django.contrib.auth.hashers import make_password
from apps.tenant.models import Tenant, Plan, TenantUser, TenantUserAccess


class Command(BaseCommand):
    help = 'Crea un nuevo tenant con su base de datos y usuario administrador'

    def add_arguments(self, parser):
        parser.add_argument(
            '--code',
            type=str,
            help='Código único del tenant (ej: constructora-abc)'
        )
        parser.add_argument(
            '--name',
            type=str,
            help='Nombre de la empresa'
        )
        parser.add_argument(
            '--nit',
            type=str,
            help='NIT de la empresa'
        )
        parser.add_argument(
            '--subdomain',
            type=str,
            help='Subdominio (ej: constructora-abc)'
        )
        parser.add_argument(
            '--plan',
            type=str,
            default=None,
            help='Código del plan (opcional)'
        )
        parser.add_argument(
            '--tier',
            type=str,
            default='small',
            choices=['starter', 'small', 'medium', 'large', 'enterprise'],
            help='Tamaño de empresa (default: small)'
        )
        parser.add_argument(
            '--max-users',
            type=int,
            default=50,
            help='Máximo de usuarios (default: 50, 0=ilimitado)'
        )
        parser.add_argument(
            '--admin-email',
            type=str,
            help='Email del administrador'
        )
        parser.add_argument(
            '--admin-password',
            type=str,
            help='Password del administrador (si no se proporciona, se solicita)'
        )
        parser.add_argument(
            '--skip-migrate',
            action='store_true',
            help='Omitir migraciones (útil si la BD ya existe)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== CREAR NUEVO TENANT ===\n'))

        # Obtener datos del tenant
        code = options['code'] or self._prompt('Código del tenant (ej: constructora-abc)')
        name = options['name'] or self._prompt('Nombre de la empresa')
        nit = options['nit'] or self._prompt('NIT (opcional)', required=False)
        subdomain = options['subdomain'] or code  # Default al código

        # Validar subdominio
        if not self._validate_subdomain(subdomain):
            raise CommandError(
                'Subdominio inválido. Solo letras minúsculas, números y guiones. '
                'No puede empezar ni terminar con guión.'
            )

        # Verificar que no exista
        if Tenant.objects.filter(code=code).exists():
            raise CommandError(f'Ya existe un tenant con el código "{code}"')
        if Tenant.objects.filter(subdomain=subdomain).exists():
            raise CommandError(f'Ya existe un tenant con el subdominio "{subdomain}"')

        # Plan es opcional
        plan = None
        plan_code = options['plan']
        if plan_code:
            try:
                plan = Plan.objects.get(code=plan_code, is_active=True)
            except Plan.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'Plan "{plan_code}" no encontrado. Continuando sin plan...'
                ))

        # Tier y límites
        tier = options['tier']
        max_users = options['max_users']

        # Datos del administrador
        admin_email = options['admin_email'] or self._prompt('Email del administrador')
        admin_password = options['admin_password']
        if not admin_password:
            admin_password = getpass.getpass('Password del administrador: ')
            confirm_password = getpass.getpass('Confirmar password: ')
            if admin_password != confirm_password:
                raise CommandError('Las contraseñas no coinciden')

        admin_first_name = self._prompt('Nombre del administrador')
        admin_last_name = self._prompt('Apellido del administrador')

        # Generar nombre de BD
        db_name = f"stratekaz_{code.replace('-', '_')}"

        self.stdout.write('\n')
        self.stdout.write(self.style.MIGRATE_HEADING('Resumen:'))
        self.stdout.write(f'  Código: {code}')
        self.stdout.write(f'  Nombre: {name}')
        self.stdout.write(f'  NIT: {nit or "N/A"}')
        self.stdout.write(f'  Subdominio: {subdomain}.stratekaz.com')
        self.stdout.write(f'  Base de datos: {db_name}')
        self.stdout.write(f'  Tier: {tier}')
        self.stdout.write(f'  Máx. usuarios: {max_users if max_users > 0 else "Ilimitado"}')
        self.stdout.write(f'  Plan: {plan.name if plan else "Sin plan (límites directos)"}')
        self.stdout.write(f'  Admin: {admin_email}')
        self.stdout.write('\n')

        confirm = input('¿Continuar? [y/N]: ')
        if confirm.lower() != 'y':
            self.stdout.write(self.style.WARNING('Cancelado'))
            return

        # 1. Crear el registro del tenant
        self.stdout.write('\n1. Creando registro del tenant...')
        tenant = Tenant.objects.create(
            code=code,
            name=name,
            nit=nit,
            subdomain=subdomain,
            db_name=db_name,
            plan=plan,
            tier=tier,
            max_users=max_users,
            enabled_modules=['core', 'sst', 'pesv'],  # Módulos por defecto
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS(f'   ✓ Tenant creado: {tenant}'))

        # 2. Crear la base de datos
        self.stdout.write('\n2. Creando base de datos...')
        try:
            self._create_database(db_name)
            self.stdout.write(self.style.SUCCESS(f'   ✓ Base de datos creada: {db_name}'))
        except Exception as e:
            tenant.delete()
            raise CommandError(f'Error creando base de datos: {e}')

        # 3. Configurar conexión a la nueva BD
        self.stdout.write('\n3. Configurando conexión...')
        db_alias = f"tenant_{tenant.id}"
        connections.databases[db_alias] = tenant.get_database_config()
        self.stdout.write(self.style.SUCCESS(f'   ✓ Conexión configurada: {db_alias}'))

        # 4. Ejecutar migraciones
        if not options['skip_migrate']:
            self.stdout.write('\n4. Ejecutando migraciones...')
            try:
                call_command('migrate', database=db_alias, verbosity=0)
                self.stdout.write(self.style.SUCCESS('   ✓ Migraciones completadas'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ✗ Error en migraciones: {e}'))
                self.stdout.write(self.style.WARNING('   Puede ejecutar manualmente: python manage.py migrate --database=' + db_alias))
        else:
            self.stdout.write('\n4. Migraciones omitidas (--skip-migrate)')

        # 5. Crear usuario administrador en BD tenant
        self.stdout.write('\n5. Creando usuario administrador...')
        try:
            self._create_admin_user(
                db_alias, admin_email, admin_password,
                admin_first_name, admin_last_name
            )
            self.stdout.write(self.style.SUCCESS(f'   ✓ Admin creado en BD tenant'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ✗ Error: {e}'))

        # 6. Crear TenantUser en BD master
        self.stdout.write('\n6. Creando usuario global...')
        tenant_user, created = TenantUser.objects.get_or_create(
            email=admin_email,
            defaults={
                'password': make_password(admin_password),
                'first_name': admin_first_name,
                'last_name': admin_last_name,
                'is_active': True,
                'last_tenant': tenant
            }
        )
        TenantUserAccess.objects.get_or_create(
            tenant_user=tenant_user,
            tenant=tenant,
            defaults={'role': 'admin', 'is_active': True}
        )
        self.stdout.write(self.style.SUCCESS(f'   ✓ Usuario global {"creado" if created else "vinculado"}'))

        # 7. Crear configuración de empresa inicial
        self.stdout.write('\n7. Creando configuración inicial de empresa...')
        try:
            self._create_empresa_config(db_alias, name, nit)
            self.stdout.write(self.style.SUCCESS('   ✓ EmpresaConfig creada'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'   ⚠ Advertencia: {e}'))

        # Resumen final
        self.stdout.write('\n')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('¡TENANT CREADO EXITOSAMENTE!'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(f'\nURL de acceso: https://{subdomain}.stratekaz.com')
        self.stdout.write(f'Usuario: {admin_email}')
        self.stdout.write(f'Base de datos: {db_name}')
        self.stdout.write('\nPróximos pasos:')
        self.stdout.write('  1. Configurar DNS: *.stratekaz.com → IP del servidor')
        self.stdout.write('  2. El usuario puede acceder y configurar su branding')
        self.stdout.write('')

    def _prompt(self, message, required=True):
        """Solicita input al usuario"""
        while True:
            value = input(f'{message}: ').strip()
            if value or not required:
                return value or None
            self.stdout.write(self.style.ERROR('Este campo es requerido'))

    def _validate_subdomain(self, subdomain):
        """Valida formato del subdominio"""
        pattern = r'^[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?$'
        return bool(re.match(pattern, subdomain.lower()))

    def _create_database(self, db_name):
        """Crea la base de datos en MySQL"""
        with connection.cursor() as cursor:
            # Crear BD con charset UTF8MB4
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )

    def _create_admin_user(self, db_alias, email, password, first_name, last_name):
        """Crea el usuario administrador en la BD del tenant"""
        from apps.core.models import User

        # Crear superusuario en la BD del tenant
        User.objects.using(db_alias).create_superuser(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

    def _create_empresa_config(self, db_alias, name, nit):
        """Crea la configuración inicial de empresa"""
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig

        # Verificar si ya existe
        if EmpresaConfig.objects.using(db_alias).exists():
            return

        # Crear configuración mínima
        EmpresaConfig.objects.using(db_alias).create(
            nit=nit or '000000000-0',
            razon_social=name,
            nombre_comercial=name,
            representante_legal='Por configurar',
            direccion_fiscal='Por configurar',
            ciudad='Por configurar',
            departamento='BOGOTA_DC',
            telefono_principal='0000000',
            email_corporativo=f'info@{name.lower().replace(" ", "")}.com',
            # Branding por defecto
            color_primario='#1E40AF',
            color_secundario='#3B82F6',
            color_acento='#10B981',
            pwa_theme_color='#1E40AF',
            pwa_background_color='#FFFFFF',
        )
