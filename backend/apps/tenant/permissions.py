"""
Permisos Multi-Tenant - Validación de acceso a módulos

Permisos personalizados para DRF que validan el acceso del tenant
a módulos específicos según su plan.

Uso en ViewSets:
    class IncidentViewSet(viewsets.ModelViewSet):
        permission_classes = [IsAuthenticated, HasModuleAccess]
        required_module = 'sst'  # Código del módulo requerido
"""
from rest_framework.permissions import BasePermission

from apps.tenant.middleware import get_current_tenant
from apps.tenant.plan_enforcement import PlanEnforcer


class HasModuleAccess(BasePermission):
    """
    Permiso que valida que el tenant tenga acceso al módulo requerido.

    El ViewSet debe definir el atributo `required_module` con el código
    del módulo que se requiere para acceder.

    Ejemplo:
        class VehicleViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, HasModuleAccess]
            required_module = 'pesv'

        class IncidentViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, HasModuleAccess]
            required_module = 'sst'
    """

    def has_permission(self, request, view):
        # Obtener el módulo requerido del ViewSet
        required_module = getattr(view, 'required_module', None)

        # Si no se especifica módulo, permitir acceso
        if not required_module:
            return True

        # Obtener tenant actual
        tenant = get_current_tenant()

        # Sin tenant (path público o superusuario global), permitir
        if not tenant:
            return True

        # Validar acceso al módulo
        has_access, message = PlanEnforcer.has_module_access(tenant, required_module)

        if not has_access:
            self.message = message

        return has_access


class HasValidSubscription(BasePermission):
    """
    Permiso que valida que el tenant tenga una suscripción vigente.

    Ejemplo:
        class SomeViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, HasValidSubscription]
    """

    def has_permission(self, request, view):
        tenant = get_current_tenant()

        # Sin tenant, permitir (paths públicos)
        if not tenant:
            return True

        # Validar suscripción
        if not tenant.is_subscription_valid:
            self.message = (
                "Su suscripción ha vencido. "
                "Por favor renueve su plan para continuar."
            )
            return False

        return True


class CanCreateUsers(BasePermission):
    """
    Permiso que valida que el tenant pueda crear más usuarios.

    Usar en endpoints de creación de usuarios.

    Ejemplo:
        class UserViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated]

            def get_permissions(self):
                if self.action == 'create':
                    return [IsAuthenticated(), CanCreateUsers()]
                return super().get_permissions()
    """

    def has_permission(self, request, view):
        tenant = get_current_tenant()

        # Sin tenant, permitir
        if not tenant:
            return True

        # Validar límite de usuarios
        can_create, message = PlanEnforcer.can_create_user(tenant)

        if not can_create:
            self.message = message

        return can_create


class IsTenantAdmin(BasePermission):
    """
    Permiso que valida que el usuario sea admin del tenant actual.

    Verifica el rol en TenantUserAccess.
    """

    def has_permission(self, request, view):
        from apps.tenant.models import TenantUserAccess

        tenant = get_current_tenant()

        if not tenant:
            return True

        user = request.user

        # Superusuario siempre tiene acceso
        if user.is_superuser:
            return True

        # Verificar acceso como admin
        try:
            access = TenantUserAccess.objects.get(
                tenant_user__email=user.email,
                tenant=tenant,
                is_active=True
            )
            return access.role == 'admin'
        except TenantUserAccess.DoesNotExist:
            return False
