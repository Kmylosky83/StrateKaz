"""
Views para configurar contraseña inicial de empleados.

Endpoints publicos (sin auth):
- POST /api/core/setup-password/        → Configurar contraseña con token
- POST /api/core/setup-password/resend/ → Reenviar enlace si token expiró
"""
import logging
import uuid
from datetime import timedelta

from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)

User = get_user_model()


class SetupPasswordSerializer(serializers.Serializer):
    """Serializer para validar datos de configuracion de contraseña."""
    token = serializers.CharField(required=True, max_length=64)
    email = serializers.EmailField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True, min_length=8)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Las contraseñas no coinciden.'
            })

        # Validar contraseña contra reglas de Django
        try:
            validate_password(attrs['new_password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                'new_password': list(e.messages)
            })

        return attrs


class SetupPasswordView(APIView):
    """
    POST /api/core/setup-password/

    Endpoint publico para que empleados configuren su contraseña inicial.
    Requiere token valido generado al crear el colaborador con acceso al sistema.

    Body: {token, email, new_password, new_password_confirm}
    Token expira en 7 días y solo puede usarse una vez.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = SetupPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        email = serializer.validated_data['email']
        new_password = serializer.validated_data['new_password']

        # Buscar usuario con token valido
        try:
            user = User.objects.get(
                email=email,
                password_setup_token=token,
            )
        except User.DoesNotExist:
            return Response(
                {'message': 'Token invalido o expirado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar expiracion
        if not user.password_setup_expires or user.password_setup_expires < timezone.now():
            # Limpiar token expirado
            user.password_setup_token = None
            user.password_setup_expires = None
            user.save(update_fields=['password_setup_token', 'password_setup_expires'])
            return Response(
                {'message': 'El enlace ha expirado. Solicita un nuevo enlace a tu administrador.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Configurar contraseña
        user.set_password(new_password)
        user.password_setup_token = None
        user.password_setup_expires = None
        user.save(update_fields=['password', 'password_setup_token', 'password_setup_expires'])

        logger.info(
            'Contraseña configurada exitosamente para User %s (%s)',
            user.id, user.email
        )

        # Sincronizar password al TenantUser (public schema) para que el login funcione
        # En try/except para no bloquear la respuesta exitosa si falla el sync
        try:
            from apps.core.utils import sync_password_to_tenant_user
            sync_password_to_tenant_user(user)
        except Exception as e:
            logger.error(
                'Error sincronizando password a TenantUser para User %s (%s): %s',
                user.id, user.email, e, exc_info=True
            )

        return Response({
            'message': 'Contraseña configurada exitosamente. Ya puedes iniciar sesión.'
        })


class ResendSetupPasswordSerializer(serializers.Serializer):
    """Serializer para reenvío de enlace de configuración de contraseña."""
    email = serializers.EmailField(required=True)


class ResendSetupPasswordView(APIView):
    """
    POST /api/core/setup-password/resend/

    Endpoint público para reenviar el enlace de configuración de contraseña.
    Genera un nuevo token y envía el email de setup nuevamente.

    Casos de uso:
    - Token expirado (usuario no lo usó a tiempo)
    - Email de setup no llegó o se perdió

    Body: {email}
    Throttle: 3/min (password_reset scope) para evitar abuso.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = ResendSetupPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        # Respuesta genérica para no revelar si el email existe
        generic_response = Response({
            'message': 'Si el correo está registrado y requiere configuración de contraseña, recibirás un nuevo enlace.'
        })

        # Buscar usuario que necesite setup de contraseña
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return generic_response

        # Solo reenviar si el usuario ya tenía un token (o ya expiró)
        # Si nunca tuvo token, no es un usuario que necesite setup
        if not user.password_setup_token and user.password_setup_expires is None:
            # Verificar si el usuario tiene contraseña "usable" — si ya la configuró, no reenviar
            if user.has_usable_password():
                return generic_response

        # Generar nuevo token
        new_token = uuid.uuid4().hex
        user.password_setup_token = new_token
        user.password_setup_expires = timezone.now() + timedelta(
            hours=User.PASSWORD_SETUP_EXPIRY_HOURS
        )
        user.save(update_fields=['password_setup_token', 'password_setup_expires'])

        # Enviar email de setup
        try:
            from apps.core.tasks import send_setup_password_email_task

            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com')
            tenant_id = getattr(connection.tenant, 'id', '')
            setup_url = f"{frontend_url}/setup-password?token={new_token}&email={email}&tenant_id={tenant_id}"

            current_tenant = getattr(connection, 'tenant', None)
            tenant_name = getattr(current_tenant, 'name', 'StrateKaz')

            try:
                primary_color = current_tenant.primary_color or '#3b82f6'
                secondary_color = current_tenant.secondary_color or '#1e40af'
            except Exception:
                primary_color = '#3b82f6'
                secondary_color = '#1e40af'

            send_setup_password_email_task.delay(
                user_email=email,
                user_name=user.get_full_name() or user.username,
                tenant_name=tenant_name,
                cargo_name=user.cargo.name if user.cargo else '',
                setup_url=setup_url,
                expiry_hours=User.PASSWORD_SETUP_EXPIRY_HOURS,
                primary_color=primary_color,
                secondary_color=secondary_color,
            )

            logger.info(
                'Reenvío de setup password programado para User %s (%s)',
                user.id, user.email
            )

        except Exception as e:
            logger.error(
                'Error reenviando email de setup para User %s (%s): %s',
                user.id, user.email, e, exc_info=True
            )

        return generic_response
