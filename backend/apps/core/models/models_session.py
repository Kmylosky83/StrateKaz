"""
MS-002-A: Modelo de Sesiones de Usuario - StrateKaz

UserSession: Registra sesiones activas de usuarios para gestión de dispositivos.

Características:
- Tracking de dispositivos y navegadores
- Registro de IP y ubicación aproximada
- Última actividad por sesión
- Cierre remoto de sesiones
"""
import hashlib
from django.db import models
from django.conf import settings
from django.utils import timezone


class UserSession(models.Model):
    """
    Modelo para registrar sesiones activas de usuarios.

    Cada vez que un usuario hace login, se crea una sesión vinculada
    al refresh token. Permite:
    - Ver dispositivos conectados
    - Cerrar sesiones remotamente
    - Auditar actividad por dispositivo
    """

    # Relación con usuario
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name='Usuario'
    )

    # Token (hasheado para seguridad)
    refresh_token_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name='Hash del Refresh Token',
        help_text='SHA256 del refresh token para identificación'
    )

    # Información del dispositivo
    user_agent = models.TextField(
        verbose_name='User Agent',
        help_text='User-Agent completo del navegador'
    )
    device_type = models.CharField(
        max_length=20,
        default='desktop',
        verbose_name='Tipo de Dispositivo',
        help_text='desktop, mobile, tablet'
    )
    device_os = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Sistema Operativo',
        help_text='Windows, macOS, Linux, iOS, Android'
    )
    device_browser = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Navegador',
        help_text='Chrome, Firefox, Safari, Edge'
    )
    device_name = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Nombre del Dispositivo',
        help_text='Nombre personalizado por el usuario'
    )

    # Ubicación
    ip_address = models.GenericIPAddressField(
        verbose_name='Dirección IP'
    )
    country = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='País'
    )
    city = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Ciudad'
    )

    # Tiempos
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Inicio'
    )
    last_activity = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actividad'
    )
    expires_at = models.DateTimeField(
        verbose_name='Fecha de Expiración'
    )

    # Estado
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activa'
    )
    is_current = models.BooleanField(
        default=False,
        verbose_name='Es Sesión Actual',
        help_text='Marcador temporal para indicar la sesión del request actual'
    )

    class Meta:
        db_table = 'core_user_session'
        verbose_name = 'Sesión de Usuario'
        verbose_name_plural = 'Sesiones de Usuario'
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['refresh_token_hash']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.device_browser} en {self.device_os} ({self.ip_address})"

    @classmethod
    def hash_token(cls, token: str) -> str:
        """Genera hash SHA256 de un token."""
        return hashlib.sha256(token.encode()).hexdigest()

    @classmethod
    def create_session(
        cls,
        user,
        refresh_token: str,
        request,
        expires_at
    ) -> 'UserSession':
        """
        Crea una nueva sesión para un usuario.

        Args:
            user: Usuario autenticado
            refresh_token: Token de refresh (se hasheará)
            request: Request HTTP para extraer info del dispositivo
            expires_at: Fecha de expiración del token

        Returns:
            UserSession creada
        """
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        ip_address = cls._get_client_ip(request)

        # Parsear user agent
        device_info = cls._parse_user_agent(user_agent)

        session = cls.objects.create(
            user=user,
            refresh_token_hash=cls.hash_token(refresh_token),
            user_agent=user_agent,
            device_type=device_info['device_type'],
            device_os=device_info['os'],
            device_browser=device_info['browser'],
            ip_address=ip_address,
            expires_at=expires_at,
        )

        return session

    @classmethod
    def _get_client_ip(cls, request) -> str:
        """Obtiene la IP real del cliente considerando proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        return ip

    @classmethod
    def _parse_user_agent(cls, user_agent: str) -> dict:
        """
        Parsea el user agent para extraer información del dispositivo.
        Implementación simple sin dependencias externas.
        """
        ua = user_agent.lower()

        # Detectar SO
        if 'windows' in ua:
            os_name = 'Windows'
        elif 'macintosh' in ua or 'mac os' in ua:
            os_name = 'macOS'
        elif 'linux' in ua and 'android' not in ua:
            os_name = 'Linux'
        elif 'android' in ua:
            os_name = 'Android'
        elif 'iphone' in ua or 'ipad' in ua:
            os_name = 'iOS'
        else:
            os_name = 'Desconocido'

        # Detectar navegador
        if 'edg/' in ua or 'edge/' in ua:
            browser = 'Edge'
        elif 'chrome' in ua and 'chromium' not in ua:
            browser = 'Chrome'
        elif 'firefox' in ua:
            browser = 'Firefox'
        elif 'safari' in ua and 'chrome' not in ua:
            browser = 'Safari'
        elif 'opera' in ua or 'opr/' in ua:
            browser = 'Opera'
        else:
            browser = 'Desconocido'

        # Detectar tipo de dispositivo
        if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
            device_type = 'mobile'
        elif 'tablet' in ua or 'ipad' in ua:
            device_type = 'tablet'
        else:
            device_type = 'desktop'

        return {
            'os': os_name,
            'browser': browser,
            'device_type': device_type,
        }

    @classmethod
    def get_by_token(cls, refresh_token: str):
        """Obtiene una sesión por su refresh token."""
        token_hash = cls.hash_token(refresh_token)
        try:
            return cls.objects.get(
                refresh_token_hash=token_hash,
                is_active=True
            )
        except cls.DoesNotExist:
            return None

    @classmethod
    def invalidate_by_token(cls, refresh_token: str) -> bool:
        """Invalida una sesión por su refresh token."""
        token_hash = cls.hash_token(refresh_token)
        updated = cls.objects.filter(
            refresh_token_hash=token_hash
        ).update(is_active=False)
        return updated > 0

    @classmethod
    def get_active_sessions(cls, user) -> models.QuerySet:
        """Obtiene todas las sesiones activas de un usuario."""
        now = timezone.now()
        return cls.objects.filter(
            user=user,
            is_active=True,
            expires_at__gt=now
        ).order_by('-last_activity')

    @classmethod
    def cleanup_expired(cls) -> int:
        """Limpia sesiones expiradas. Retorna cantidad eliminadas."""
        now = timezone.now()
        expired = cls.objects.filter(expires_at__lt=now)
        count = expired.count()
        expired.delete()
        return count

    def close(self) -> None:
        """Cierra esta sesión."""
        self.is_active = False
        self.save(update_fields=['is_active'])

    def update_activity(self) -> None:
        """Actualiza la última actividad de la sesión."""
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])

    @property
    def is_expired(self) -> bool:
        """Verifica si la sesión ha expirado."""
        return timezone.now() > self.expires_at

    @property
    def display_name(self) -> str:
        """Nombre para mostrar de la sesión."""
        if self.device_name:
            return self.device_name
        return f"{self.device_browser} en {self.device_os}"
