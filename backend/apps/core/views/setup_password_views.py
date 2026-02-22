"""
View para configurar contraseña inicial de empleados.

Endpoint publico (sin auth) que permite a empleados creados desde Talent Hub
establecer su contraseña por primera vez usando un token temporal.
"""
import logging

from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
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
    Token expira en 72 horas y solo puede usarse una vez.
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

        return Response({
            'message': 'Contraseña configurada exitosamente. Ya puedes iniciar sesión.'
        })
