"""
Comando para configuración inicial de producción.

Crea:
1. SuperAdmin global (si no existe)
2. Planes de suscripción por defecto (Básico, Profesional, Empresarial)

Uso:
    python manage.py create_initial_setup
    python manage.py create_initial_setup --email=admin@miempresa.com --password=MiPassword123!
    python manage.py create_initial_setup --skip-plans  # Solo crear superadmin
    python manage.py create_initial_setup --skip-admin  # Solo crear planes

Los planes son completamente editables desde Admin Global UI después de creados.
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.tenant.models import TenantUser, Plan


# Módulos disponibles en el sistema (códigos reales)
ALL_MODULES = [
    'gestion_estrategica',
    'sistema_gestion',
    'motor_cumplimiento',
    'motor_riesgos',
    'sst',
    'pesv',
    'gestion_ambiental',
    'calidad',
    'talento_humano',
    'cadena_suministro',
    'produccion',
    'logistica',
    'comercial',
    'finanzas',
    'analitica',
]

# Planes por defecto
DEFAULT_PLANS = [
    {
        'code': 'basico',
        'name': 'Plan Básico',
        'description': 'Ideal para pequeñas empresas que inician su sistema de gestión.',
        'max_users': 5,
        'max_storage_gb': 5,
        'price_monthly': '99000.00',  # COP
        'price_yearly': '990000.00',
        'features': [
            'gestion_estrategica',
            'sistema_gestion',
            'motor_cumplimiento',
        ],
        'order': 1,
    },
    {
        'code': 'profesional',
        'name': 'Plan Profesional',
        'description': 'Para empresas en crecimiento con múltiples sistemas de gestión.',
        'max_users': 25,
        'max_storage_gb': 25,
        'price_monthly': '299000.00',
        'price_yearly': '2990000.00',
        'features': [
            'gestion_estrategica',
            'sistema_gestion',
            'motor_cumplimiento',
            'motor_riesgos',
            'sst',
            'pesv',
            'gestion_ambiental',
            'calidad',
            'talento_humano',
        ],
        'order': 2,
    },
    {
        'code': 'empresarial',
        'name': 'Plan Empresarial',
        'description': 'Solución completa para grandes organizaciones. Todos los módulos incluidos.',
        'max_users': 100,
        'max_storage_gb': 100,
        'price_monthly': '599000.00',
        'price_yearly': '5990000.00',
        'features': ALL_MODULES,  # Todos los módulos
        'is_default': True,
        'order': 3,
    },
]


class Command(BaseCommand):
    help = 'Configuración inicial para producción: SuperAdmin y Planes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@stratekaz.com',
            help='Email del superadmin (default: admin@stratekaz.com)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='Admin.2024!',
            help='Contraseña del superadmin (default: Admin.2024!)',
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='Super',
            help='Nombre del superadmin',
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='Admin',
            help='Apellido del superadmin',
        )
        parser.add_argument(
            '--skip-admin',
            action='store_true',
            help='No crear superadmin, solo planes',
        )
        parser.add_argument(
            '--skip-plans',
            action='store_true',
            help='No crear planes, solo superadmin',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Sobrescribir planes existentes',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n═══════════════════════════════════════'))
        self.stdout.write(self.style.MIGRATE_HEADING('  STRATEKAZ - Configuración Inicial'))
        self.stdout.write(self.style.MIGRATE_HEADING('═══════════════════════════════════════\n'))

        results = {
            'admin_created': False,
            'admin_exists': False,
            'plans_created': 0,
            'plans_updated': 0,
            'plans_skipped': 0,
        }

        # 1. Crear SuperAdmin
        if not options['skip_admin']:
            results.update(self._create_superadmin(options))

        # 2. Crear Planes
        if not options['skip_plans']:
            results.update(self._create_plans(options['force']))

        # Resumen final
        self._print_summary(results, options)

    def _create_superadmin(self, options):
        """Crear o actualizar SuperAdmin global"""
        self.stdout.write('\n📌 SuperAdmin Global')
        self.stdout.write('─' * 40)

        email = options['email'].lower().strip()

        try:
            user = TenantUser.objects.get(email=email)
            self.stdout.write(f'   Usuario existente: {email}')
            self.stdout.write(self.style.WARNING('   → Ya existe, no se modificó'))
            return {'admin_exists': True}

        except TenantUser.DoesNotExist:
            user = TenantUser(
                email=email,
                first_name=options['first_name'],
                last_name=options['last_name'],
                is_active=True,
                is_superadmin=True,
            )
            user.set_password(options['password'])
            user.save()

            self.stdout.write(self.style.SUCCESS(f'   ✅ SuperAdmin creado: {email}'))
            self.stdout.write(f'      Contraseña: {options["password"]}')
            return {'admin_created': True}

    def _create_plans(self, force=False):
        """Crear planes de suscripción por defecto"""
        self.stdout.write('\n📌 Planes de Suscripción')
        self.stdout.write('─' * 40)

        created = 0
        updated = 0
        skipped = 0

        for plan_data in DEFAULT_PLANS:
            code = plan_data['code']

            try:
                existing = Plan.objects.get(code=code)

                if force:
                    # Actualizar plan existente
                    for key, value in plan_data.items():
                        setattr(existing, key, value)
                    existing.save()
                    self.stdout.write(self.style.WARNING(f'   🔄 {plan_data["name"]} actualizado'))
                    updated += 1
                else:
                    self.stdout.write(f'   ⏭️  {plan_data["name"]} ya existe (use --force para actualizar)')
                    skipped += 1

            except Plan.DoesNotExist:
                Plan.objects.create(**plan_data)
                self.stdout.write(self.style.SUCCESS(f'   ✅ {plan_data["name"]} creado'))
                created += 1

        return {
            'plans_created': created,
            'plans_updated': updated,
            'plans_skipped': skipped,
        }

    def _print_summary(self, results, options):
        """Imprimir resumen de la operación"""
        self.stdout.write('\n' + '═' * 50)
        self.stdout.write(self.style.MIGRATE_HEADING('  RESUMEN'))
        self.stdout.write('═' * 50)

        # SuperAdmin
        if results.get('admin_created'):
            self.stdout.write(self.style.SUCCESS('\n✅ SuperAdmin CREADO'))
            self.stdout.write(f'   Email: {options["email"]}')
            self.stdout.write(f'   Password: {options["password"]}')
        elif results.get('admin_exists'):
            self.stdout.write(self.style.WARNING('\n⚠️  SuperAdmin ya existía'))

        # Planes
        if results.get('plans_created') or results.get('plans_updated'):
            self.stdout.write(self.style.SUCCESS(f'\n✅ Planes: {results["plans_created"]} creados, {results["plans_updated"]} actualizados'))
        if results.get('plans_skipped'):
            self.stdout.write(f'   ({results["plans_skipped"]} planes ya existían)')

        # Acceso
        self.stdout.write('\n' + '─' * 50)
        self.stdout.write(self.style.MIGRATE_HEADING('  ACCESO'))
        self.stdout.write('─' * 50)
        self.stdout.write('\n  Admin Global: /admin-global')
        self.stdout.write('  Django Admin: /admin/')
        self.stdout.write('\n  Próximos pasos:')
        self.stdout.write('  1. Ingresar a Admin Global')
        self.stdout.write('  2. Crear tu primera empresa (tenant)')
        self.stdout.write('  3. Asignar módulos y usuarios')
        self.stdout.write('\n')
