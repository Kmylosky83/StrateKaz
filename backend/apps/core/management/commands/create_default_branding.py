"""
Management command para crear configuración de branding por defecto
"""
from django.core.management.base import BaseCommand
from apps.core.models import BrandingConfig


class Command(BaseCommand):
    help = 'Crea configuración de branding por defecto para el sistema'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Creando configuración de branding por defecto...'))

        # Verificar si ya existe
        if BrandingConfig.objects.filter(is_active=True).exists():
            self.stdout.write(
                self.style.WARNING('Ya existe una configuración de branding activa.')
            )
            active = BrandingConfig.objects.filter(is_active=True).first()
            self.stdout.write(f'  ID: {active.id}')
            self.stdout.write(f'  Nombre: {active.company_name}')
            self.stdout.write(f'  Favicon: {active.favicon or "No configurado"}')
            self.stdout.write(f'  Login Background: {active.login_background or "No configurado"}')

            response = input('\n¿Deseas crear una nueva configuración de todas formas? (s/N): ')
            if response.lower() != 's':
                self.stdout.write(self.style.SUCCESS('Operación cancelada.'))
                return

        # Crear nueva configuración
        branding = BrandingConfig.objects.create(
            company_name='StrateKaz',
            company_short_name='GRASHNORTE',
            company_slogan='Consultoría 4.0',
            # Los archivos de imagen se deben subir manualmente desde la UI
            # o copiar a backend/media/branding/ antes de ejecutar este comando
            logo='',  # Dejar vacío, subir desde UI
            logo_white='',  # Dejar vacío, subir desde UI
            favicon='',  # Dejar vacío, subir desde UI
            login_background='',  # Dejar vacío, subir desde UI
            primary_color='#16A34A',  # Verde
            secondary_color='#059669',  # Verde oscuro
            accent_color='#10B981',  # Verde claro
            app_version='2.0.0',
            is_active=True,
        )

        self.stdout.write(self.style.SUCCESS(f'\n✅ Branding creado exitosamente (ID: {branding.id})'))
        self.stdout.write('\nConfiguración:')
        self.stdout.write(f'  - Nombre de la empresa: {branding.company_name}')
        self.stdout.write(f'  - Nombre corto: {branding.company_short_name}')
        self.stdout.write(f'  - Slogan: {branding.company_slogan}')
        self.stdout.write(f'  - Color primario: {branding.primary_color}')
        self.stdout.write(f'  - Versión: {branding.app_version}')

        self.stdout.write(self.style.WARNING('\n⚠️  IMPORTANTE:'))
        self.stdout.write('Para agregar logo, favicon e imagen de fondo:')
        self.stdout.write('1. Accede a la interfaz de administración de Django')
        self.stdout.write('2. Ve a Core > Branding Configs')
        self.stdout.write(f'3. Edita el registro ID {branding.id}')
        self.stdout.write('4. Sube las imágenes requeridas:')
        self.stdout.write('   - Logo principal (PNG recomendado, ~200x50px)')
        self.stdout.write('   - Logo blanco para fondos oscuros (PNG con transparencia)')
        self.stdout.write('   - Favicon (ICO o PNG de 32x32px)')
        self.stdout.write('   - Imagen de fondo login (JPG/PNG de 1920x1080px)')
        self.stdout.write('\nO ejecuta: python manage.py upload_default_branding_files')
