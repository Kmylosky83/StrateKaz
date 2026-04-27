"""
CertificateService — Generación idempotente de certificados X.509 por tenant.

Encapsula la lógica de creación de certificados self-signed que se usan para
sellar PDFs vía pyHanko (`PDFSealingService`). El servicio se invoca desde:

1. Management command `generar_certificado_x509` (manual / batch).
2. `TenantLifecycleService._execute_phase_b` (bootstrap automático al
   crear un tenant nuevo) — H-GD-A3.

Idempotencia:
    Si el certificado ya existe en `MEDIA_ROOT/certificados/{schema}/`,
    `ensure_certificate_for_schema` retorna sin regenerar (a menos que
    se pase `force=True`).

Razón de existir como servicio:
    Antes vivía sólo dentro del management command, lo que obligaba al
    operador a ejecutarlo manualmente por cada tenant nuevo. Esto era
    una brecha de bootstrap que provocaba que el sellado fallara con
    `ValueError` la primera vez que se publicaba un documento.
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class CertificateResult:
    """Resultado de `ensure_certificate_for_schema`."""

    schema_name: str
    cert_path: str
    key_path: str
    created: bool  # True si se generó en esta llamada
    valid_until: datetime | None  # None si created=False y se reusa el existente


class CertificateService:
    """
    Servicio de gestión de certificados X.509 self-signed por tenant.

    Cada tenant tiene su propio par cert/clave en
    `MEDIA_ROOT/certificados/{schema_name}/`.
    """

    DEFAULT_VALIDITY_YEARS = 5
    DEFAULT_KEY_SIZE = 2048
    DEFAULT_ORG_UNIT = 'Sistema de Gestion Documental'
    DEFAULT_COUNTRY = 'CO'

    @classmethod
    def get_paths(cls, schema_name: str) -> tuple[str, str]:
        """
        Retorna (cert_path, key_path) para un schema dado.

        No verifica si los archivos existen — sólo construye las rutas.
        """
        cert_dir = os.path.join(
            settings.MEDIA_ROOT, 'certificados', schema_name
        )
        cert_path = os.path.join(cert_dir, 'certificado.pem')
        key_path = os.path.join(cert_dir, 'clave_privada.key')
        return cert_path, key_path

    @classmethod
    def certificate_exists(cls, schema_name: str) -> bool:
        """True si ya existe el par cert/clave para el schema."""
        cert_path, key_path = cls.get_paths(schema_name)
        return os.path.exists(cert_path) and os.path.exists(key_path)

    @classmethod
    def ensure_certificate_for_schema(
        cls,
        schema_name: str,
        *,
        empresa_nombre: str | None = None,
        razon_social: str | None = None,
        validity_years: int = DEFAULT_VALIDITY_YEARS,
        force: bool = False,
    ) -> CertificateResult:
        """
        Garantiza que existe un certificado X.509 self-signed para el schema.

        Idempotente: si ya existe el cert (y `force=False`), retorna sin
        regenerar.

        Args:
            schema_name: nombre del schema PostgreSQL (ej. 'tenant_demo').
            empresa_nombre: CN del cert. Default: schema_name.
            razon_social: O del cert. Default: schema_name.
            validity_years: años de validez (default 5).
            force: si True, regenera aunque ya exista.

        Returns:
            CertificateResult con paths + flag `created`.

        Raises:
            OSError: si no se puede crear el directorio o escribir archivos.
        """
        cert_path, key_path = cls.get_paths(schema_name)

        if cls.certificate_exists(schema_name) and not force:
            return CertificateResult(
                schema_name=schema_name,
                cert_path=cert_path,
                key_path=key_path,
                created=False,
                valid_until=None,
            )

        empresa_nombre = empresa_nombre or schema_name
        razon_social = razon_social or schema_name

        # Generar clave privada RSA 2048
        key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=cls.DEFAULT_KEY_SIZE,
        )

        # Construir Subject del certificado
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, cls.DEFAULT_COUNTRY),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, razon_social[:64]),
            x509.NameAttribute(NameOID.COMMON_NAME, empresa_nombre[:64]),
            x509.NameAttribute(
                NameOID.ORGANIZATIONAL_UNIT_NAME,
                cls.DEFAULT_ORG_UNIT,
            ),
        ])

        now = datetime.now(timezone.utc)
        valid_until = now + timedelta(days=validity_years * 365)
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now)
            .not_valid_after(valid_until)
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
        cert_dir = os.path.dirname(cert_path)
        os.makedirs(cert_dir, exist_ok=True)

        with open(key_path, 'wb') as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            ))
        # En Windows os.chmod tiene efecto limitado pero no falla
        try:
            os.chmod(key_path, 0o600)
        except OSError:
            # Filesystems sin soporte de permisos POSIX (ej. NTFS) — no fatal
            pass

        with open(cert_path, 'wb') as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))

        logger.info(
            'CertificateService: schema=%s result=generated valid_until=%s',
            schema_name,
            valid_until.strftime('%Y-%m-%d'),
        )

        return CertificateResult(
            schema_name=schema_name,
            cert_path=cert_path,
            key_path=key_path,
            created=True,
            valid_until=valid_until,
        )

    @classmethod
    def ensure_certificate_for_current_tenant(cls) -> CertificateResult:
        """
        Wrapper que toma el schema activo de la conexión.

        Útil cuando se invoca dentro de un `schema_context(...)` sin
        tener referencia explícita al objeto Tenant.
        """
        from django.db import connection

        schema_name = connection.schema_name
        empresa_nombre = schema_name
        razon_social = schema_name

        # Mejor esfuerzo: si Empresa existe en este schema, usar su nombre
        try:
            from apps.gestion_estrategica.configuracion.models import Empresa

            empresa = Empresa.objects.first()
            if empresa:
                empresa_nombre = getattr(empresa, 'nombre', empresa_nombre)
                razon_social = getattr(empresa, 'razon_social', razon_social)
        except Exception:
            # Modelo Empresa puede no existir o tabla aún no migrada — no fatal
            pass

        return cls.ensure_certificate_for_schema(
            schema_name=schema_name,
            empresa_nombre=empresa_nombre,
            razon_social=razon_social,
        )
