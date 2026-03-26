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

        SEGURIDAD: TenantUserAccess se valida en AMBAS ramas (User existente
        y User no existente) para evitar cross-tenant bypass.
        """
        email = validated_token.get('email')

        if email:
            # Token de TenantUser - buscar o crear User en schema actual
            from apps.core.models import User
            is_superadmin = validated_token.get('is_superadmin', False)
            tenant_user_id = validated_token.get('tenant_user_id')

            try:
                user = User.objects.get(email=email, is_active=True)

                # SECURITY FIX: validar TenantUserAccess aunque el User ya exista.
                # Sin esta verificación, si el mismo email tiene un User en varios
                # schemas, cualquier token válido puede acceder a todos ellos.
                if not is_superadmin and tenant_user_id:
                    self._assert_tenant_access(tenant_user_id)

                # Sincronizar nombres si el User los tiene vacíos (ej: fue creado
                # antes de que el TenantUser tuviera first_name/last_name).
                if tenant_user_id and (not user.first_name or not user.last_name):
                    self._sync_name_if_empty(user, tenant_user_id)

                if is_superadmin:
                    logger.info(
                        "Superadmin access: TenantUser %s accessing tenant as local User "
                        "(is_superuser=%s)",
                        email, user.is_superuser
                    )
                return user

            except User.DoesNotExist:
                # El User no existe en este tenant, intentar crearlo
                if tenant_user_id:
                    try:
                        tenant_user = TenantUser.objects.get(id=tenant_user_id, is_active=True)

                        # Verificar acceso antes de auto-crear el User en el schema
                        if not is_superadmin:
                            self._assert_tenant_access(tenant_user_id)

                        # Crear User sincronizado con TenantUser
                        user = self._create_user_from_tenant_user(tenant_user, is_superadmin)
                        if user:
                            logger.info(
                                "Created User %s in current tenant from TenantUser", email
                            )
                            return user
                    except TenantUser.DoesNotExist:
                        pass

                raise AuthenticationFailed(
                    'Usuario no encontrado en esta empresa. '
                    'Contacta al administrador para obtener acceso.'
                )

        # Token tradicional - comportamiento default
        return super().get_user(validated_token)

    def _assert_tenant_access(self, tenant_user_id: int):
        """
        Verifica que el TenantUser está activo y tiene TenantUserAccess
        activo al tenant actual.
        Lanza AuthenticationFailed si no tiene acceso.
        """
        from django.db import connection
        from django_tenants.utils import schema_context
        from apps.tenant.models import TenantUser, TenantUserAccess

        with schema_context('public'):
            # Verificar que el TenantUser existe y está activo
            try:
                tenant_user = TenantUser.objects.only(
                    'id', 'is_active', 'is_superadmin'
                ).get(id=tenant_user_id)
            except TenantUser.DoesNotExist:
                raise AuthenticationFailed('Usuario no encontrado.')

            if not tenant_user.is_active:
                logger.warning(
                    "TenantUser id=%s está desactivado — acceso denegado",
                    tenant_user_id
                )
                raise AuthenticationFailed(
                    'Tu cuenta ha sido desactivada. '
                    'Contacta al administrador.'
                )

            # Superadmins pueden acceder a cualquier tenant
            if tenant_user.is_superadmin:
                return

        current_tenant = getattr(connection, 'tenant', None)
        if not current_tenant:
            return  # Sin tenant activo, no se puede verificar

        with schema_context('public'):
            has_access = TenantUserAccess.objects.filter(
                tenant_user_id=tenant_user_id,
                tenant=current_tenant,
                is_active=True
            ).exists()
            if not has_access:
                logger.warning(
                    "TenantUser id=%s intentó acceder a tenant '%s' sin TenantUserAccess activo",
                    tenant_user_id, current_tenant.schema_name
                )
                raise AuthenticationFailed(
                    'No tiene acceso autorizado a esta empresa. '
                    'Contacte al administrador.'
                )

    def _sync_name_if_empty(self, user, tenant_user_id: int):
        """
        Sincroniza first_name/last_name desde TenantUser si el User los tiene vacíos.
        Caso de uso: User creado antes de que se rellenaran los nombres en TenantUser
        (ej: se creó con test data o desde Admin Global sin nombre).
        """
        from django_tenants.utils import schema_context
        try:
            with schema_context('public'):
                tu = TenantUser.objects.get(id=tenant_user_id)
                if tu.first_name or tu.last_name:
                    user.first_name = tu.first_name or user.first_name
                    user.last_name = tu.last_name or user.last_name
                    user.save(update_fields=['first_name', 'last_name'])
                    logger.info(
                        "Sincronizados nombres para User %s desde TenantUser %s",
                        user.email, tenant_user_id
                    )
        except Exception as e:
            logger.debug("No se pudieron sincronizar nombres desde TenantUser: %s", e)

    def _create_user_from_tenant_user(self, tenant_user: TenantUser, is_superadmin: bool = False):
        """
        Crea un User en el tenant actual basado en los datos del TenantUser.

        El User se crea SIN cargo asignado. El cargo se asigna cuando:
        - Se crea un Colaborador desde Gestión de Personas (signal sincroniza)
        - Un admin asigna cargo manualmente

        Superadmins obtienen is_superuser=True, que les da acceso completo
        via GranularActionPermission sin necesidad de cargo.

        Args:
            tenant_user: El TenantUser fuente
            is_superadmin: Si el TenantUser es superadmin global

        Returns:
            User creado o None si falla
        """
        from apps.core.models import User
        import uuid

        try:
            base_username = tenant_user.email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            # Generar un document_number temporal (requerido por el modelo)
            temp_document = f"TEMP-{uuid.uuid4().hex[:8].upper()}"

            # Superadmin global -> is_superuser=True para acceso total en el tenant
            # Esto permite que GranularActionPermission y el sistema RBAC le den acceso completo
            grant_superuser = is_superadmin

            user = User.objects.create(
                username=username,
                email=tenant_user.email,
                first_name=tenant_user.first_name or '',
                last_name=tenant_user.last_name or '',
                is_active=True,
                is_superuser=grant_superuser,
                is_staff=grant_superuser,
                document_type='CC',
                document_number=temp_document,
                cargo=None,  # Sin cargo — se asigna al crear Colaborador
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
