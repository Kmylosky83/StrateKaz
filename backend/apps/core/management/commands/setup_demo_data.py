"""
Management command para setup inicial del sistema con datos de prueba
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.core.models import BrandingConfig, Cargo

User = get_user_model()


class Command(BaseCommand):
    help = 'Configura datos de prueba iniciales (usuario demo + branding)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-user',
            action='store_true',
            help='No crear usuario de prueba',
        )
        parser.add_argument(
            '--skip-branding',
            action='store_true',
            help='No crear configuración de branding',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('SETUP DE DATOS DE PRUEBA - StrateKaz'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        # 1. Crear usuario de prueba
        if not options['skip_user']:
            self.create_demo_user()

        # 2. Crear configuración de branding
        if not options['skip_branding']:
            self.create_default_branding()

        self.stdout.write(self.style.SUCCESS('\n' + '=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ SETUP COMPLETADO'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write('\nPuedes acceder al sistema con:')
        self.stdout.write('  Usuario: demo')
        self.stdout.write('  Contraseña: demo123')
        self.stdout.write('\nPara acceder al admin de Django:')
        self.stdout.write('  http://localhost:8000/admin/')
        self.stdout.write('  Usuario: admin (si fue creado con createsuperuser)')

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

    def create_default_branding(self):
        self.stdout.write('\n' + '-' * 60)
        self.stdout.write('2. CREANDO CONFIGURACIÓN DE BRANDING')
        self.stdout.write('-' * 60)

        # Verificar si ya existe configuración activa
        if BrandingConfig.objects.filter(is_active=True).exists():
            active = BrandingConfig.objects.filter(is_active=True).first()
            self.stdout.write(
                self.style.WARNING(f'Ya existe configuración de branding activa (ID: {active.id}). Omitiendo...')
            )
            return

        # Crear configuración
        try:
            branding = BrandingConfig.objects.create(
                company_name='StrateKaz',
                company_short_name='GRASHNORTE',
                company_slogan='Consultoría 4.0',
                # Imágenes se suben desde la UI
                logo='',
                logo_white='',
                favicon='',
                login_background='',
                primary_color='#16A34A',
                secondary_color='#059669',
                accent_color='#10B981',
                app_version='2.0.0',
                is_active=True,
            )

            self.stdout.write(self.style.SUCCESS(f'\n  ✅ Branding creado (ID: {branding.id})'))
            self.stdout.write(f'     Nombre: {branding.company_name}')
            self.stdout.write(f'     Color primario: {branding.primary_color}')

            self.stdout.write(self.style.WARNING('\n  ⚠️  Para agregar imágenes (logo, favicon, fondo):'))
            self.stdout.write('     1. Accede a http://localhost:8000/admin/')
            self.stdout.write(f'     2. Ve a Core > Branding Configs > ID {branding.id}')
            self.stdout.write('     3. Sube las imágenes requeridas')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n  ❌ Error al crear branding: {str(e)}'))
