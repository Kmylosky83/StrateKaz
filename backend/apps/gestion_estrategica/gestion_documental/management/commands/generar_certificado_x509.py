"""
Genera certificado X.509 self-signed por tenant para sellado PDF (pyHanko).

Delegado a `CertificateService.ensure_certificate_for_schema` para que la
lógica sea reutilizable desde el bootstrap del tenant
(`TenantLifecycleService`) y desde este comando manual / batch.

Uso:
    python manage.py generar_certificado_x509
    python manage.py generar_certificado_x509 --tenant demo
    python manage.py generar_certificado_x509 --validity-years 10
    python manage.py generar_certificado_x509 --force
"""
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context


class Command(BaseCommand):
    help = (
        'Genera certificado X.509 self-signed por tenant para sellado PDF '
        'con pyHanko. Idempotente: si el certificado ya existe se respeta '
        '(use --force para regenerar).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Schema específico (sin prefijo tenant_)',
        )
        parser.add_argument(
            '--validity-years',
            type=int,
            default=5,
            help='Años de validez del certificado (default: 5)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Regenerar certificado aunque ya exista',
        )

    def handle(self, *args, **options):
        from apps.tenant.models import Tenant

        validity_years = options['validity_years']
        force = options['force']

        tenants = Tenant.objects.exclude(schema_name='public').filter(is_active=True)

        if tenant_filter := options.get('tenant'):
            schema = (
                f'tenant_{tenant_filter}'
                if not tenant_filter.startswith('tenant_')
                else tenant_filter
            )
            tenants = tenants.filter(schema_name=schema)

        if not tenants.exists():
            self.stderr.write(self.style.ERROR('No se encontraron tenants activos.'))
            return

        for tenant in tenants:
            self._generar_para_tenant(tenant, validity_years, force)

    def _generar_para_tenant(self, tenant, validity_years, force):
        """Genera certificado X.509 para un tenant específico."""
        from apps.gestion_estrategica.gestion_documental.services import (
            CertificateService,
        )

        # Resolver datos de empresa dentro del schema del tenant
        empresa_nombre = tenant.schema_name
        razon_social = tenant.schema_name

        with schema_context(tenant.schema_name):
            try:
                from apps.gestion_estrategica.configuracion.models import Empresa
                empresa = Empresa.objects.first()
                if empresa:
                    empresa_nombre = getattr(empresa, 'nombre', empresa_nombre)
                    razon_social = getattr(empresa, 'razon_social', razon_social)
            except Exception:
                pass

        result = CertificateService.ensure_certificate_for_schema(
            schema_name=tenant.schema_name,
            empresa_nombre=empresa_nombre,
            razon_social=razon_social,
            validity_years=validity_years,
            force=force,
        )

        if result.created:
            self.stdout.write(
                self.style.SUCCESS(
                    f'  [{tenant.schema_name}] Certificado generado '
                    f'(válido hasta {result.valid_until.strftime("%Y-%m-%d")})'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'  [{tenant.schema_name}] Certificado ya existe. '
                    f'Use --force para regenerar.'
                )
            )
