"""
Seed Org Templates — Listar y aplicar plantillas de estructura organizacional

Uso:
    python manage.py seed_org_templates                     # Lista templates disponibles
    python manage.py seed_org_templates --apply manufactura  # Aplica template a todos los tenants
    python manage.py seed_org_templates --apply manufactura --tenant stratekaz_demo  # Solo a un tenant
"""
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

from apps.core.services.org_templates import get_all_templates, apply_template
from apps.tenant.models import Tenant


class Command(BaseCommand):
    help = 'Listar o aplicar plantillas de estructura organizacional por industria'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            type=str,
            help='Código del template a aplicar (ej: manufactura, servicios, construccion)',
        )
        parser.add_argument(
            '--tenant',
            type=str,
            help='Schema específico del tenant (si se omite, aplica a todos)',
        )

    def handle(self, *args, **options):
        template_code = options.get('apply')
        tenant_schema = options.get('tenant')

        if not template_code:
            # Solo listar templates
            self._list_templates()
            return

        # Aplicar template
        if tenant_schema:
            tenants = Tenant.objects.filter(schema_name=tenant_schema)
        else:
            tenants = Tenant.objects.exclude(schema_name='public')

        if not tenants.exists():
            self.stderr.write(self.style.ERROR('No se encontraron tenants'))
            return

        for tenant in tenants:
            self.stdout.write(f'\n--- Aplicando "{template_code}" a {tenant.schema_name} ---')
            try:
                with schema_context(tenant.schema_name):
                    result = apply_template(template_code)
                    self.stdout.write(self.style.SUCCESS(
                        f'  Áreas creadas: {result["areas_created"]} | '
                        f'Cargos creados: {result["cargos_created"]} | '
                        f'Omitidos: {result["skipped"]}'
                    ))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'  Error: {e}'))

    def _list_templates(self):
        templates = get_all_templates()
        self.stdout.write(self.style.SUCCESS(f'\n{"="*60}'))
        self.stdout.write(self.style.SUCCESS('PLANTILLAS DE ESTRUCTURA ORGANIZACIONAL'))
        self.stdout.write(self.style.SUCCESS(f'{"="*60}\n'))

        for t in templates:
            self.stdout.write(f'  {t["code"]:<20} {t["name"]}')
            self.stdout.write(f'  {"":20} {t["description"]}')
            self.stdout.write(f'  {"":20} Áreas: {t["areas_count"]} | Cargos: {t["cargos_count"]}')
            self.stdout.write('')

        self.stdout.write(self.style.NOTICE(
            'Uso: python manage.py seed_org_templates --apply <code> [--tenant <schema>]'
        ))
