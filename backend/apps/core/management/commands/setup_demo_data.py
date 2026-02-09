"""
Management command para setup inicial del sistema con datos de prueba

NOTA: El branding ahora se gestiona en el modelo Tenant (apps.tenant.models.Tenant)
Para configurar branding, usar el endpoint /api/tenant/public/branding/ o el admin de Django.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.core.models import Cargo

User = get_user_model()


class Command(BaseCommand):
    help = 'Configura datos de prueba iniciales (usuario demo)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-user',
            action='store_true',
            help='No crear usuario de prueba',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('SETUP DE DATOS DE PRUEBA - StrateKaz'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        # 1. Crear usuario de prueba
        if not options['skip_user']:
            self.create_demo_user()

        self.stdout.write(self.style.SUCCESS('\n' + '=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ SETUP COMPLETADO'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write('\nPuedes acceder al sistema con:')
        self.stdout.write('  Usuario: demo')
        self.stdout.write('  Contraseña: demo123')
        self.stdout.write('\nPara acceder al admin de Django:')
        self.stdout.write('  http://localhost:8000/admin/')
        self.stdout.write('  Usuario: admin (si fue creado con createsuperuser)')
        self.stdout.write('\nNOTA: El branding se configura en el modelo Tenant')
        self.stdout.write('  Endpoint: /api/tenant/public/branding/')
        self.stdout.write('  Admin: Tenant > Tenants > [tenant] > Branding')

    def create_demo_user(self):
        self.stdout.write('\n' + '-' * 60)
        self.stdout.write('1. CREANDO USUARIO DE PRUEBA')
        self.stdout.write('-' * 60)

        # Verificar si ya existe
        if User.objects.filter(username='demo').exists():
            self.stdout.write(self.style.WARNING('El usuario "demo" ya existe. Omitiendo...'))
            return

        # Crear o obtener cargo por defecto
        cargo, created = Cargo.objects.get_or_create(
            code='GENERAL',
            defaults={
                'name': 'Usuario General',
                'level': 'OPERATIONAL',
                'description': 'Cargo general para usuarios de prueba',
                'is_active': True,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✅ Cargo creado: {cargo.name}'))
        else:
            self.stdout.write(f'  Usando cargo existente: {cargo.name}')

        # Crear usuario demo
        try:
            user = User.objects.create_user(
                username='demo',
                email='demo@grasasyhuesos.com',
                password='demo123',
                first_name='Usuario',
                last_name='Demo',
                cargo=cargo,
                is_active=True,
                is_staff=False,
                is_superuser=False,
            )

            self.stdout.write(self.style.SUCCESS('\n  ✅ Usuario demo creado exitosamente'))
            self.stdout.write(f'     Username: {user.username}')
            self.stdout.write(f'     Email: {user.email}')
            self.stdout.write(f'     Password: demo123')
            self.stdout.write(f'     Cargo: {user.cargo.name}')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n  ❌ Error al crear usuario: {str(e)}'))
