"""
Core Models - Two Factor Authentication (2FA)

Modelo para autenticación de dos factores usando TOTP.
Soporta códigos de respaldo para recuperación.
Secret TOTP cifrado con Fernet (AES-128-CBC).
"""

from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
import pyotp
import qrcode
from io import BytesIO
import base64
import secrets

from utils.encryption import encrypt_value, try_decrypt_value


class TwoFactorAuth(models.Model):
    """
    Configuración de autenticación de dos factores por usuario.
    Almacena el secret TOTP cifrado, códigos de respaldo y estado de activación.
    """
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='two_factor',
        help_text="Usuario propietario de esta configuración 2FA"
    )

    # TOTP Secret (cifrado con Fernet)
    secret_key = models.CharField(
        max_length=256,
        blank=True,
        help_text="Secret key TOTP cifrado con Fernet"
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

    def _get_raw_secret(self) -> str:
        """Obtiene el secret descifrado (soporta legacy sin cifrar)."""
        return try_decrypt_value(self.secret_key)

    def generate_secret(self):
        """Genera un nuevo secret key TOTP y lo guarda cifrado."""
        raw_secret = pyotp.random_base32()
        self.secret_key = encrypt_value(raw_secret)
        self.save()
        return raw_secret

    def get_totp_uri(self):
        """Genera URI para QR code."""
        raw_secret = self._get_raw_secret()
        totp = pyotp.TOTP(raw_secret)
        return totp.provisioning_uri(
            name=self.user.email,
            issuer_name='StrateKaz'
        )

    def generate_qr_code(self):
        """Genera QR code como imagen base64."""
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
        """Verifica un código TOTP de 6 dígitos."""
        raw_secret = self._get_raw_secret()
        totp = pyotp.TOTP(raw_secret)
        return totp.verify(token, valid_window=1)

    def generate_backup_codes(self, count=10):
        """Genera códigos de respaldo y retorna los códigos sin hashear."""
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
        """Verifica un código de backup y lo marca como usado."""
        for i, hashed_code in enumerate(self.backup_codes):
            if i not in self.backup_codes_used:
                if check_password(code, hashed_code):
                    self.backup_codes_used.append(i)
                    self.save()
                    return True
        return False

    def get_remaining_backup_codes_count(self):
        """Retorna la cantidad de códigos de backup restantes."""
        return len(self.backup_codes) - len(self.backup_codes_used)


class EmailOTP(models.Model):
    """
    OTP enviado por email para verificación de NIVEL_3.
    Usado tanto en login como en firma de documentos.
    TTL: 10 minutos. Rate limit: 3 por 15 min.
    """
    PURPOSE_CHOICES = [
        ('LOGIN', 'Login 2FA'),
        ('FIRMA', 'Firma Digital'),
    ]

    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='email_otps',
        verbose_name='Usuario'
    )
    otp_hash = models.CharField(
        max_length=128,
        verbose_name='OTP hasheado',
        help_text='Hash del código OTP (make_password)'
    )
    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES,
        verbose_name='Propósito'
    )
    is_used = models.BooleanField(
        default=False,
        verbose_name='Usado'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        verbose_name='Expira en'
    )

    class Meta:
        db_table = 'core_email_otp'
        verbose_name = 'OTP por Email'
        verbose_name_plural = 'OTPs por Email'
        indexes = [
            models.Index(fields=['user', 'purpose', 'is_used']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"OTP {self.purpose} - {self.user.username} ({'usado' if self.is_used else 'pendiente'})"

    @property
    def is_expired(self):
        """Verifica si el OTP ha expirado."""
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        """Verifica si el OTP aún es usable."""
        return not self.is_used and not self.is_expired

    def verify(self, code: str) -> bool:
        """Verifica el código OTP y lo marca como usado si es correcto."""
        if not self.is_valid:
            return False
        if check_password(code, self.otp_hash):
            self.is_used = True
            self.save(update_fields=['is_used'])
            return True
        return False

    @classmethod
    def create_for_user(cls, user, purpose: str = 'LOGIN') -> tuple:
        """
        Genera un OTP de 6 dígitos para el usuario.
        Invalida OTPs anteriores del mismo propósito.

        Returns:
            tuple: (EmailOTP instance, raw_code)
        """
        # Invalidar OTPs anteriores del mismo propósito
        cls.objects.filter(
            user=user,
            purpose=purpose,
            is_used=False,
        ).update(is_used=True)

        raw_code = f"{secrets.randbelow(1000000):06d}"
        otp = cls.objects.create(
            user=user,
            otp_hash=make_password(raw_code),
            purpose=purpose,
            expires_at=timezone.now() + timezone.timedelta(minutes=10),
        )
        return otp, raw_code
