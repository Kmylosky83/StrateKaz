"""
Backend de Autenticación Multi-Tenant

Este módulo proporciona:
1. TenantJWTAuthentication: Autentica usando TenantUser
2. TenantUserBackend: Backend de autenticación Django para TenantUser
"""
import logging
from django.contrib.auth.backends import BaseBackend
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

from .models import TenantUser

logger = logging.getLogger(__name__)


class TenantUserBackend(BaseBackend):
    """
    Backend de autenticación Django que usa TenantUser.

    Permite autenticar usuarios globales (schema público) en lugar
    de usuarios por tenant.
    """

    def authenticate(self, request, email=None, password=None, **kwargs):
        """
        Autentica un usuario por email y contraseña.
        """
        if email is None:
            email = kwargs.get('username')  # Soporte para username como email

        if email is None or password is None:
            return None

        try:
            user = TenantUser.objects.get(email=email.lower().strip())
        except TenantUser.DoesNotExist:
            return None

        if user.check_password(password) and user.is_active:
            return user

        return None

    def get_user(self, user_id):
        """
        Obtiene un usuario por su ID.
        """
        try:
            return TenantUser.objects.get(pk=user_id)
        except TenantUser.DoesNotExist:
            return None


class TenantJWTAuthentication(JWTAuthentication):
    """
    Autenticación JWT personalizada para sistema multi-tenant.

    Funciona de dos maneras:
    1. Si el token tiene claim 'tenant_user_id', usa TenantUser (global)
    2. Si no, usa el usuario del schema actual (comportamiento default)

    Esto permite:
    - Endpoints públicos usen TenantUser (login, select-tenant, etc.)
    - Endpoints de negocio usen User del tenant actual
    """

    def get_user(self, validated_token):
        """
        Obtiene el usuario a partir del token validado.

        Si el token incluye 'tenant_user_id', busca en TenantUser.
        De lo contrario, usa el comportamiento default de SimpleJWT.
        """
        # Verificar si es un token de TenantUser
        tenant_user_id = validated_token.get('tenant_user_id')

        if tenant_user_id:
            try:
                return TenantUser.objects.get(id=tenant_user_id, is_active=True)
            except TenantUser.DoesNotExist:
                raise AuthenticationFailed('Usuario no encontrado o inactivo')

        # Comportamiento default: buscar en el modelo User actual
        return super().get_user(validated_token)


class HybridJWTAuthentication(JWTAuthentication):
    """
    Autenticación JWT híbrida para sistema multi-tenant.

    Cuando el token viene de TenantUser (tiene 'email' claim),
    busca el User del tenant actual por email.

    Si el User no existe en el tenant, lo crea automáticamente
    sincronizando datos desde TenantUser y asignando el cargo ADMIN
    si corresponde.

    Esto permite usar tokens de TenantUser para acceder a recursos
    del tenant, encontrando o creando el User correspondiente.
    """

    def get_user(self, validated_token):
        """
        Obtiene el usuario del tenant actual por email.

        Si el token tiene 'email' (viene de TenantUser login),
        busca el User en el schema actual con ese email.
        Si no existe, lo crea automáticamente.
        """
        email = validated_token.get('email')

        if email:
            # Token de TenantUser - buscar o crear User en schema actual
            from apps.core.models import User
            try:
                return User.objects.get(email=email, is_active=True)
            except User.DoesNotExist:
                # El User no existe en este tenant, intentar crearlo
                tenant_user_id = validated_token.get('tenant_user_id')
                is_superadmin = validated_token.get('is_superadmin', False)

                if tenant_user_id:
                    try:
                        tenant_user = TenantUser.objects.get(id=tenant_user_id, is_active=True)
                        # Crear User sincronizado con TenantUser
                        user = self._create_user_from_tenant_user(tenant_user, is_superadmin)
                        if user:
                            logger.info(f"Created User {email} in current tenant from TenantUser")
                            return user
                    except TenantUser.DoesNotExist:
                        pass

                raise AuthenticationFailed(
                    'Usuario no encontrado en esta empresa. '
                    'Contacta al administrador para obtener acceso.'
                )

        # Token tradicional - comportamiento default
        return super().get_user(validated_token)

    def _create_user_from_tenant_user(self, tenant_user: TenantUser, is_superadmin: bool = False):
        """
        Crea un User en el tenant actual basado en los datos del TenantUser.

        Si es superadmin, es el primer usuario, o tiene rol 'admin' en TenantUserAccess,
        le asigna el cargo ADMIN.

        Args:
            tenant_user: El TenantUser fuente
            is_superadmin: Si el TenantUser es superadmin global

        Returns:
            User creado o None si falla
        """
        from apps.core.models import User, Cargo
        from apps.tenant.models import TenantUserAccess
        from django.db import connection
        import uuid

        try:
            # Verificar si es el primer usuario del tenant
            is_first_user = not User.objects.filter(deleted_at__isnull=True).exists()

            # Verificar si tiene rol 'admin' en TenantUserAccess para el tenant actual
            current_schema = connection.schema_name
            has_admin_role = TenantUserAccess.objects.filter(
                tenant_user=tenant_user,
                tenant__schema_name=current_schema,
                role='admin',
                is_active=True
            ).exists()

            # Siempre asignar cargo ADMIN por defecto a todo usuario nuevo.
            # El admin del tenant puede cambiar el cargo después desde
            # Configuración > Usuarios > Editar > Posición Organizacional.
            admin_cargo = None
            try:
                admin_cargo = Cargo.objects.get(code='ADMIN', is_active=True)
            except Cargo.DoesNotExist:
                logger.warning("Cargo ADMIN not found in tenant schema")

            # Crear el User
            # Generar username único basado en email
            base_username = tenant_user.email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            # Generar un document_number temporal (requerido por el modelo)
            temp_document = f"TEMP-{uuid.uuid4().hex[:8].upper()}"

            user = User.objects.create(
                username=username,
                email=tenant_user.email,
                first_name=tenant_user.first_name or '',
                last_name=tenant_user.last_name or '',
                is_active=True,
                is_superuser=False,  # Nunca auto-grant is_superuser; permisos via RBAC (Cargo)
                is_staff=False,
                document_type='CC',
                document_number=temp_document,
                cargo=admin_cargo,  # Asignar cargo ADMIN si aplica
            )

            # NO establecer password - el User no tiene password propio,
            # la autenticación es via TenantUser
            user.set_unusable_password()
            user.save()

            return user

        except Exception as e:
            logger.error(f"Error creating User from TenantUser: {e}")
            return None


def get_tokens_for_tenant_user(user: TenantUser) -> dict:
    """
    Genera tokens JWT para un TenantUser.

    Incluye claims personalizados para identificar que es un usuario global.
    """
    refresh = RefreshToken.for_user(user)

    # Agregar claims personalizados
    refresh['tenant_user_id'] = user.id
    refresh['email'] = user.email
    refresh['is_superadmin'] = user.is_superadmin

    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }
