"""
Vistas de autenticación de dos factores (2FA).

Provee endpoints para:
- Verificar estado 2FA
- Configurar 2FA (generar QR)
- Habilitar 2FA (verificar código)
- Deshabilitar 2FA
- Verificar código durante login
- Regenerar códigos de backup
"""

import logging
from datetime import timedelta
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import TwoFactorAuth, User, UserSession
from apps.core.serializers_2fa import (
    TwoFactorStatusSerializer,
    TwoFactorSetupSerializer,
    TwoFactorEnableSerializer,
    TwoFactorVerifySerializer,
    TwoFactorDisableSerializer,
    BackupCodesSerializer,
    TwoFactorSetupResponseSerializer,
    TwoFactorRegenerateBackupCodesSerializer,
)
from apps.core.decorators import api_rate_limit
from apps.core.utils.audit_logging import (
    log_2fa_enabled,
    log_2fa_disabled,
    log_2fa_verified,
    log_2fa_failed,
    log_backup_codes_generated,
    log_backup_code_used,
)

# Logger de seguridad
security_logger = logging.getLogger('security')


class TwoFactorStatusView(APIView):
    """
    GET: Obtiene el estado actual de 2FA del usuario autenticado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retorna el estado de 2FA del usuario"""
        user = request.user

        # Obtener o crear configuración 2FA
        two_factor, created = TwoFactorAuth.objects.get_or_create(user=user)

        serializer = TwoFactorStatusSerializer(two_factor)
        return Response(serializer.data)


@method_decorator(api_rate_limit, name='post')
class TwoFactorSetupView(APIView):
    """
    POST: Inicia la configuración de 2FA.
    Genera un secret key y QR code para que el usuario lo escanee.
    Requiere contraseña para confirmar identidad.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Genera QR code y secret para configurar 2FA"""
        serializer = TwoFactorSetupSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        # Obtener o crear configuración 2FA
        two_factor, created = TwoFactorAuth.objects.get_or_create(user=user)

        # Si ya está habilitado, rechazar
        if two_factor.is_enabled:
            return Response(
                {'error': 'El 2FA ya está habilitado. Deshabílitalo primero si deseas reconfigurarlo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generar nuevo secret
        secret = two_factor.generate_secret()

        # Generar QR code
        qr_code = two_factor.generate_qr_code()

        # Log de auditoría (setup iniciado - no requiere log especial, solo info)
        security_logger.info(
            f"2FA Setup iniciado - User: {user.username} - IP: {self._get_client_ip(request)}"
        )

        response_serializer = TwoFactorSetupResponseSerializer({
            'qr_code': qr_code,
            'secret_key': secret,
            'message': 'Escanea el QR code con tu app de autenticación (Google Authenticator, Authy, etc.)'
        })

        return Response(response_serializer.data)

    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@method_decorator(api_rate_limit, name='post')
class TwoFactorEnableView(APIView):
    """
    POST: Habilita 2FA después de verificar el código TOTP.
    También genera códigos de backup.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Habilita 2FA tras verificar el código"""
        serializer = TwoFactorEnableSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        token = serializer.validated_data['token']

        # Obtener configuración 2FA
        try:
            two_factor = user.two_factor
        except TwoFactorAuth.DoesNotExist:
            return Response(
                {'error': 'Primero debes iniciar la configuración de 2FA'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que no esté ya habilitado
        if two_factor.is_enabled:
            return Response(
                {'error': 'El 2FA ya está habilitado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar el código TOTP
        if not two_factor.verify_token(token):
            security_logger.warning(
                f"2FA Enable falló - Código inválido - User: {user.username}"
            )
            return Response(
                {'error': 'Código inválido. Verifica e intenta nuevamente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Habilitar 2FA
        two_factor.is_enabled = True
        two_factor.verified_at = timezone.now()
        two_factor.save()

        # Sincronizar estado 2FA a TenantUser (public schema)
        self._sync_2fa_to_tenant_user(user, enabled=True)

        # Generar códigos de backup
        backup_codes = two_factor.generate_backup_codes(count=10)

        # Log de auditoría
        log_2fa_enabled(request, user)
        log_backup_codes_generated(request, user)

        response_serializer = BackupCodesSerializer({
            'codes': backup_codes,
            'message': 'IMPORTANTE: Guarda estos códigos de backup en un lugar seguro. Los necesitarás si pierdes acceso a tu app de autenticación.'
        })

        return Response(response_serializer.data)

    def _sync_2fa_to_tenant_user(self, user, enabled):
        """Sincroniza estado 2FA al TenantUser en schema público."""
        try:
            from django.apps import apps
            from django_tenants.utils import schema_context
            with schema_context('public'):
                TenantUser = apps.get_model('tenant', 'TenantUser')
                tenant_user = TenantUser.objects.filter(email=user.email).first()
                if tenant_user:
                    tenant_user.has_2fa_enabled = enabled
                    tenant_user.save(update_fields=['has_2fa_enabled'])
        except Exception as e:
            import logging
            logging.getLogger('security').warning(
                f"Error sincronizando 2FA a TenantUser para {user.email}: {e}"
            )

    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@method_decorator(api_rate_limit, name='post')
class TwoFactorDisableView(APIView):
    """
    POST: Deshabilita 2FA.
    Requiere contraseña para confirmar identidad.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Deshabilita 2FA tras verificar la contraseña"""
        serializer = TwoFactorDisableSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        # Obtener configuración 2FA
        try:
            two_factor = user.two_factor
        except TwoFactorAuth.DoesNotExist:
            return Response(
                {'error': 'El 2FA no está configurado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que esté habilitado
        if not two_factor.is_enabled:
            return Response(
                {'error': 'El 2FA no está habilitado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Deshabilitar 2FA
        two_factor.is_enabled = False
        two_factor.secret_key = ''
        two_factor.backup_codes = []
        two_factor.backup_codes_used = []
        two_factor.verified_at = None
        two_factor.save()

        # Sincronizar estado 2FA a TenantUser (public schema)
        self._sync_2fa_to_tenant_user(user, enabled=False)

        # Log de auditoría
        log_2fa_disabled(request, user)

        return Response({
            'message': '2FA deshabilitado exitosamente'
        })

    def _sync_2fa_to_tenant_user(self, user, enabled):
        """Sincroniza estado 2FA al TenantUser en schema público."""
        try:
            from django.apps import apps
            from django_tenants.utils import schema_context
            with schema_context('public'):
                TenantUser = apps.get_model('tenant', 'TenantUser')
                tenant_user = TenantUser.objects.filter(email=user.email).first()
                if tenant_user:
                    tenant_user.has_2fa_enabled = enabled
                    tenant_user.save(update_fields=['has_2fa_enabled'])
        except Exception as e:
            import logging
            logging.getLogger('security').warning(
                f"Error sincronizando 2FA a TenantUser para {user.email}: {e}"
            )

    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@method_decorator(api_rate_limit, name='post')
class TwoFactorVerifyView(APIView):
    """
    POST: Verifica un código 2FA durante el login y completa la autenticación.
    Permite usar códigos TOTP o códigos de backup.
    NO requiere autenticación (se usa durante el proceso de login).
    Retorna los tokens JWT si la verificación es exitosa.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """Verifica el código 2FA y retorna tokens"""
        serializer = TwoFactorVerifySerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        username = serializer.validated_data['username']
        token = serializer.validated_data['token']
        use_backup_code = serializer.validated_data['use_backup_code']

        # Buscar usuario (por username o email)
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User.objects.filter(email=username).first()
            if not user:
                security_logger.warning(
                    f"2FA Verify falló - Usuario no encontrado: {username}"
                )
                return Response(
                    {'error': 'Código inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Obtener configuración 2FA
        try:
            two_factor = user.two_factor
        except TwoFactorAuth.DoesNotExist:
            security_logger.warning(
                f"2FA Verify falló - 2FA no configurado para: {username}"
            )
            return Response(
                {'error': 'Código inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que esté habilitado
        if not two_factor.is_enabled:
            security_logger.warning(
                f"2FA Verify falló - 2FA no habilitado para: {username}"
            )
            return Response(
                {'error': 'Código inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar el código
        is_valid = False
        code_type = 'TOTP'

        if use_backup_code:
            is_valid = two_factor.verify_backup_code(token)
            code_type = 'BACKUP'
        else:
            is_valid = two_factor.verify_token(token)

        if not is_valid:
            security_logger.warning(
                f"2FA Verify falló - Código inválido ({code_type}) - User: {username}"
            )
            return Response(
                {'error': 'Código inválido. Verifica e intenta nuevamente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Crear sesión de usuario
        try:
            refresh_lifetime = getattr(
                settings, 'SIMPLE_JWT', {}
            ).get('REFRESH_TOKEN_LIFETIME', timedelta(days=7))
            expires_at = timezone.now() + refresh_lifetime

            session = UserSession.create_session(
                user=user,
                refresh_token=refresh_token,
                request=request,
                expires_at=expires_at
            )

            security_logger.info(
                f"MS-002-A: Sesión creada para {username} (vía 2FA) - "
                f"Device: {session.device_browser}/{session.device_os} - "
                f"IP: {session.ip_address}"
            )
        except Exception as e:
            security_logger.error(
                f"MS-002-A: Error creando sesión para {username} (vía 2FA): {e}"
            )

        # Log de auditoría
        if use_backup_code:
            log_backup_code_used(request, user)
        else:
            log_2fa_verified(request, user, method='totp')

        # Si usó un código de backup, informar cuántos quedan
        remaining_codes = None
        if use_backup_code:
            remaining_codes = two_factor.get_remaining_backup_codes_count()

        return Response({
            'message': 'Código verificado exitosamente',
            'verified': True,
            'access': access_token,
            'refresh': refresh_token,
            'backup_codes_remaining': remaining_codes
        })

    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@method_decorator(api_rate_limit, name='post')
class TwoFactorRegenerateBackupCodesView(APIView):
    """
    POST: Regenera códigos de backup.
    Invalida los códigos anteriores.
    Requiere contraseña para confirmar identidad.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Regenera los códigos de backup"""
        serializer = TwoFactorRegenerateBackupCodesSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        # Obtener configuración 2FA
        try:
            two_factor = user.two_factor
        except TwoFactorAuth.DoesNotExist:
            return Response(
                {'error': 'El 2FA no está configurado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que esté habilitado
        if not two_factor.is_enabled:
            return Response(
                {'error': 'El 2FA no está habilitado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generar nuevos códigos de backup
        backup_codes = two_factor.generate_backup_codes(count=10)

        # Log de auditoría
        log_backup_codes_generated(request, user)

        response_serializer = BackupCodesSerializer({
            'codes': backup_codes,
            'message': 'IMPORTANTE: Estos nuevos códigos reemplazan a los anteriores. Guárdalos en un lugar seguro.'
        })

        return Response(response_serializer.data)

    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@method_decorator(api_rate_limit, name='post')
class SendEmailOTPView(APIView):
    """
    POST: Envía un OTP de 6 dígitos al email del usuario.
    Para usuarios NIVEL_3 que necesitan verificación adicional.
    Propósitos: LOGIN (durante login 2FA) o FIRMA (al firmar documentos).
    Rate limit: 3 por 15 minutos.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        purpose = request.data.get('purpose', 'FIRMA')

        if purpose not in ('LOGIN', 'FIRMA'):
            return Response(
                {'error': 'Propósito inválido. Use LOGIN o FIRMA.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        # Verificar que tiene 2FA habilitado
        try:
            two_factor = user.two_factor
            if not two_factor.is_enabled:
                return Response(
                    {'error': 'Debe tener 2FA habilitado para usar OTP por email'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except TwoFactorAuth.DoesNotExist:
            return Response(
                {'error': 'Debe configurar 2FA primero'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Rate limit: máximo 3 OTPs por 15 minutos
        from apps.core.models import EmailOTP
        recent_count = EmailOTP.objects.filter(
            user=user,
            purpose=purpose,
            created_at__gte=timezone.now() - timezone.timedelta(minutes=15),
        ).count()

        if recent_count >= 3:
            return Response(
                {'error': 'Demasiados códigos solicitados. Intente en 15 minutos.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Crear OTP
        otp, raw_code = EmailOTP.create_for_user(user, purpose=purpose)

        # Enviar por email
        try:
            from apps.audit_system.centro_notificaciones.email_service import EmailService
            purpose_label = 'iniciar sesión' if purpose == 'LOGIN' else 'firmar un documento'

            EmailService.send_email(
                to_email=user.email,
                subject=f'Código de verificación — StrateKaz',
                template_name='otp_verificacion',
                context={
                    'user_name': user.get_full_name() or user.username,
                    'otp_code': raw_code,
                    'purpose_label': purpose_label,
                    'expiry_minutes': 10,
                }
            )
        except Exception as e:
            # Fallback: email simple con Django
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                send_mail(
                    subject='Código de verificación — StrateKaz',
                    message=(
                        f'Hola {user.get_full_name()},\n\n'
                        f'Tu código de verificación es: {raw_code}\n\n'
                        f'Este código expira en 10 minutos.\n\n'
                        f'Si no solicitaste este código, ignora este mensaje.\n\n'
                        f'Equipo StrateKaz'
                    ),
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@stratekaz.com'),
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e2:
                logger.error(f"Error enviando OTP email a {user.email}: {e2}")
                return Response(
                    {'error': 'Error al enviar el código por email'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        security_logger.info(
            f"OTP email enviado - User: {user.username} - Purpose: {purpose}"
        )

        return Response({
            'message': 'Código enviado a tu correo electrónico',
            'expires_in_minutes': 10,
        })
