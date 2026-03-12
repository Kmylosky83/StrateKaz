"""
Management command para corregir dominios de tenants que quedaron con
sufijo incorrecto (ej: .localhost en vez de .stratekaz.com).

Uso:
    python manage.py fix_tenant_domains              # dry-run (solo muestra)
    python manage.py fix_tenant_domains --apply      # aplica cambios
    python manage.py fix_tenant_domains --apply --old-suffix=localhost  # sufijo específico
"""
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Corregir dominios de tenants con sufijo incorrecto'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Aplicar los cambios (sin esto, solo muestra lo que haría)',
        )
        parser.add_argument(
            '--old-suffix',
            type=str,
            default='localhost',
            help='Sufijo incorrecto a reemplazar (default: localhost)',
        )

    def handle(self, *args, **options):
        from apps.tenant.models import Domain

        apply = options['apply']
        old_suffix = options['old_suffix']
        platform_domain = getattr(settings, 'PLATFORM_DOMAIN', 'stratekaz.com')

        self.stdout.write(f'\nDominio plataforma: {platform_domain}')
        self.stdout.write(f'Sufijo incorrecto: .{old_suffix}')
        self.stdout.write(f'Modo: {"APLICAR CAMBIOS" if apply else "DRY-RUN (solo mostrar)"}\n')

        domains = Domain.objects.filter(domain__endswith=f'.{old_suffix}')
        count = domains.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS(
                f'No se encontraron dominios con sufijo .{old_suffix}'
            ))
            return

        self.stdout.write(f'Encontrados {count} dominios para corregir:\n')

        for domain in domains:
            subdomain = domain.domain.split('.')[0]
            new_domain = f'{subdomain}.{platform_domain}'

            # Verificar que no exista ya un dominio con el nuevo nombre
            if Domain.objects.filter(domain=new_domain).exclude(pk=domain.pk).exists():
                self.stdout.write(self.style.WARNING(
                    f'  SKIP  {domain.domain} -> {new_domain} (ya existe)'
                ))
                continue

            self.stdout.write(
                f'  {"FIX " if apply else "WILL"} '
                f' {domain.domain} -> {new_domain} '
                f'(tenant: {domain.tenant.name})'
            )

            if apply:
                domain.domain = new_domain
                domain.save(update_fields=['domain'])

        if apply:
            self.stdout.write(self.style.SUCCESS(f'\n{count} dominios corregidos.'))
        else:
            self.stdout.write(self.style.WARNING(
                f'\nDry-run completado. Usa --apply para ejecutar los cambios.'
            ))
