"""
Genera certificado X.509 self-signed por tenant para sellado PDF (pyHanko).

Uso:
    python manage.py generar_certificado_x509
    python manage.py generar_certificado_x509 --tenant demo
    python manage.py generar_certificado_x509 --validity-years 10
    python manage.py generar_certificado_x509 --force
"""
import os
from datetime import datetime, timedelta, timezone

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from django.conf import settings
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context


class Command(BaseCommand):
    help = 'Genera certificado X.509 self-signed por tenant para sellado PDF con pyHanko'

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
        cert_dir = os.path.join(settings.MEDIA_ROOT, 'certificados', tenant.schema_name)
        cert_path = os.path.join(cert_dir, 'certificado.pem')
        key_path = os.path.join(cert_dir, 'clave_privada.key')

        if os.path.exists(cert_path) and not force:
            self.stdout.write(
                self.style.WARNING(
                    f'  [{tenant.schema_name}] Certificado ya existe. Use --force para regenerar.'
                )
            )
            return

        # Obtener datos de la empresa del tenant
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

        # Generar clave privada RSA 2048
        key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )

        # Construir Subject del certificado
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, 'CO'),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, razon_social[:64]),
            x509.NameAttribute(NameOID.COMMON_NAME, empresa_nombre[:64]),
            x509.NameAttribute(
                NameOID.ORGANIZATIONAL_UNIT_NAME,
                'Sistema de Gestión Documental'
            ),
        ])

        now = datetime.now(timezone.utc)
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now)
            .not_valid_after(now + timedelta(days=validity_years * 365))
            .add_extension(
                x509.BasicConstraints(ca=False, path_length=None),
                critical=True,
            )
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    content_commitment=True,  # non_repudiation
                    key_encipherment=False,
                    data_encipherment=False,
                    key_agreement=False,
                    key_cert_sign=False,
                    crl_sign=False,
                    encipher_only=False,
                    decipher_only=False,
                ),
                critical=True,
            )
            .sign(key, hashes.SHA256())
        )

        # Guardar archivos
        os.makedirs(cert_dir, exist_ok=True)

        with open(key_path, 'wb') as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            ))
        os.chmod(key_path, 0o600)

        with open(cert_path, 'wb') as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))

        self.stdout.write(
            self.style.SUCCESS(
                f'  [{tenant.schema_name}] Certificado generado '
                f'(válido hasta {cert.not_valid_after_utc.strftime("%Y-%m-%d")})'
            )
        )
