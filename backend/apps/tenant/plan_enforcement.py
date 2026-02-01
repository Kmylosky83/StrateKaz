"""
Plan Enforcement - Validaciones restrictivas del Plan

Valida límites y acceso a módulos según el plan del tenant.
NO usa valores hardcodeados. Lee siempre del tenant y plan.
"""
from typing import Tuple


class PlanEnforcer:
    """
    Clase para validar restricciones del plan de un tenant.

    Uso:
        enforcer = PlanEnforcer()
        can_create, message = enforcer.can_create_user(tenant)
        if not can_create:
            return Response({'error': message}, status=403)
    """

    @staticmethod
    def can_create_user(tenant) -> Tuple[bool, str]:
        """
        Valida si el tenant puede crear un nuevo usuario.

        Args:
            tenant: Instancia del modelo Tenant

        Returns:
            Tupla (puede_crear: bool, mensaje: str)

        Ejemplo:
            can_create, message = PlanEnforcer.can_create_user(tenant)
            if not can_create:
                raise PermissionDenied(message)
        """
        from apps.core.models import User

        # Obtener límite efectivo de usuarios
        max_users = tenant.effective_max_users

        # Si es 0 = ilimitado
        if max_users == 0:
            return True, "OK"

        # Contar usuarios activos (no eliminados lógicamente)
        # Este queryset debe ejecutarse en la BD del tenant
        current_user_count = User.objects.filter(
            deleted_at__isnull=True
        ).count()

        # Validar límite
        if current_user_count >= max_users:
            plan_name = tenant.plan.name if tenant.plan else "actual"
            return False, (
                f"Ha alcanzado el límite de usuarios de su plan {plan_name} "
                f"({max_users} usuarios). "
                f"Actualmente tiene {current_user_count} usuarios activos. "
                f"Para agregar más usuarios, actualice su plan o contacte a soporte."
            )

        return True, "OK"

    @staticmethod
    def has_module_access(tenant, module_code: str) -> Tuple[bool, str]:
        """
        Valida si el tenant tiene acceso a un módulo específico.

        Args:
            tenant: Instancia del modelo Tenant
            module_code: Código del módulo (ej: 'sst', 'pesv', 'iso', 'analytics')

        Returns:
            Tupla (tiene_acceso: bool, mensaje: str)

        Ejemplo:
            has_access, message = PlanEnforcer.has_module_access(tenant, 'analytics')
            if not has_access:
                raise PermissionDenied(message)
        """
        # Obtener módulos habilitados efectivos
        enabled_modules = tenant.effective_modules

        # Validar acceso
        if module_code not in enabled_modules:
            plan_name = tenant.plan.name if tenant.plan else "actual"

            # Construir mensaje amigable
            available_modules = ", ".join(enabled_modules) if enabled_modules else "ninguno"

            return False, (
                f"El módulo '{module_code}' no está disponible en su plan {plan_name}. "
                f"Módulos disponibles: {available_modules}. "
                f"Para acceder a este módulo, actualice su plan o contacte a soporte."
            )

        return True, "OK"

    @staticmethod
    def get_usage_stats(tenant) -> dict:
        """
        Obtiene estadísticas de uso del tenant vs sus límites.

        Args:
            tenant: Instancia del modelo Tenant

        Returns:
            Diccionario con estadísticas de uso

        Ejemplo:
            stats = PlanEnforcer.get_usage_stats(tenant)
            # {
            #     'users': {'current': 8, 'max': 10, 'percentage': 80.0},
            #     'modules': {'enabled': ['core', 'sst', 'pesv'], 'count': 3}
            # }
        """
        from apps.core.models import User

        # Usuarios
        max_users = tenant.effective_max_users
        current_users = User.objects.filter(deleted_at__isnull=True).count()

        user_stats = {
            'current': current_users,
            'max': max_users,
            'unlimited': max_users == 0,
        }

        if max_users > 0:
            user_stats['percentage'] = round((current_users / max_users) * 100, 1)
            user_stats['remaining'] = max_users - current_users
        else:
            user_stats['percentage'] = 0.0
            user_stats['remaining'] = None  # Ilimitado

        # Módulos
        enabled_modules = tenant.effective_modules
        module_stats = {
            'enabled': enabled_modules,
            'count': len(enabled_modules),
        }

        # Almacenamiento (si se implementa en el futuro)
        max_storage = tenant.max_storage_gb
        if tenant.plan and not max_storage:
            max_storage = tenant.plan.max_storage_gb

        storage_stats = {
            'max_gb': max_storage,
            'unlimited': max_storage == 0,
        }

        return {
            'users': user_stats,
            'modules': module_stats,
            'storage': storage_stats,
            'plan': {
                'code': tenant.plan.code if tenant.plan else None,
                'name': tenant.plan.name if tenant.plan else 'Sin plan',
            }
        }
