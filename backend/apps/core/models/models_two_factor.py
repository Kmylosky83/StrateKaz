"""
Core Models - Two Factor Authentication (2FA)

Modelo para autenticación de dos factores usando TOTP.
Soporta códigos de respaldo para recuperación.
"""

from django.db import models
from django.contrib.auth.hashers import make_password, check_password
import pyotp
import qrcode
from io import BytesIO
import base64
import secrets


class TwoFactorAuth(models.Model):
    """
    Configuración de autenticación de dos factores por usuario.
    Almacena el secret TOTP, códigos de respaldo y estado de activación.
    """
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='two_factor',
        help_text="Usuario propietario de esta configuración 2FA"
    )

    # TOTP Secret (base32)
    secret_key = models.CharField(
        max_length=32,
        blank=True,
        help_text="Secret key TOTP en formato base32"
    )

    # Estado
    is_enabled = models.BooleanField(
        default=False,
        help_text="Si el 2FA está habilitado para este usuario"
    )

    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha de primera verificación exitosa"
    )

    # Códigos de respaldo (hasheados)
    backup_codes = models.JSONField(
        default=list,
        help_text="Lista de códigos de backup hasheados"
    )

    backup_codes_used = models.JSONField(
        default=list,
        help_text="Índices de códigos ya utilizados"
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_two_factor_auth'
        verbose_name = 'Autenticación 2FA'
        verbose_name_plural = 'Autenticaciones 2FA'

    def __str__(self):
        status = "Habilitado" if self.is_enabled else "Deshabilitado"
        return f"2FA - {self.user.username} ({status})"

    def generate_secret(self):
        """Genera un nuevo secret key TOTP"""
        self.secret_key = pyotp.random_base32()
        self.save()
        return self.secret_key

    def get_totp_uri(self):
        """Genera URI para QR code"""
        totp = pyotp.TOTP(self.secret_key)
        return totp.provisioning_uri(
            name=self.user.email,
            issuer_name='StrateKaz'
        )

    def generate_qr_code(self):
        """Genera QR code como imagen base64"""
        uri = self.get_totp_uri()
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"

    def verify_token(self, token):
        """Verifica un código TOTP de 6 dígitos"""
        totp = pyotp.TOTP(self.secret_key)
        return totp.verify(token, valid_window=1)

    def generate_backup_codes(self, count=10):
        """Genera códigos de respaldo y retorna los códigos sin hashear"""
        codes = []
        hashed_codes = []

        for _ in range(count):
            code = f"{secrets.randbelow(1000000):06d}"
            codes.append(code)
            hashed_codes.append(make_password(code))

        self.backup_codes = hashed_codes
        self.backup_codes_used = []
        self.save()

        return codes

    def verify_backup_code(self, code):
        """Verifica un código de backup y lo marca como usado"""
        for i, hashed_code in enumerate(self.backup_codes):
            if i not in self.backup_codes_used:
                if check_password(code, hashed_code):
                    self.backup_codes_used.append(i)
                    self.save()
                    return True
        return False

    def get_remaining_backup_codes_count(self):
        """Retorna la cantidad de códigos de backup restantes"""
        return len(self.backup_codes) - len(self.backup_codes_used)
