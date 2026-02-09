"""
Servicio de Permisos Combinados - RBAC StrateKaz v4.1

Combina permisos de múltiples fuentes usando lógica OR:
1. Cargo base (CargoSectionAccess)
2. Roles Adicionales (RolAdicional → permisos)
3. Grupos (Group → GroupRole → permisos)

Si CUALQUIER fuente tiene el permiso, se permite la acción.

Características:
- Cache integrado para alto rendimiento
- Combinación multinivel con lógica OR
- Soporte para acciones personalizadas
- Verificación eficiente de permisos
"""
from typing import Dict, Optional, List
from django.db.models import Q
from django.utils import timezone
import logging

from apps.core.services.permission_cache import PermissionCacheService

logger = logging.getLogger('rbac')


class CombinedPermissionService:
    """
    Servicio central para evaluar permisos de usuario.

    Combina permisos de:
    1. Cargo → CargoSectionAccess
    2. Roles Adicionales → RolAdicionalPermiso (permisos legacy)
    3. Grupos → GroupRole → RolePermiso

    Lógica: OR (si cualquier fuente tiene el permiso, se permite)

    Uso:
        # Verificar permiso específico
        can_edit = CombinedPermissionService.check_section_permission(
            user=request.user,
            section_code='empresa',
            required_permission='can_edit'
        )

        # Obtener todos los permisos
        all_perms = CombinedPermissionService.get_all_section_permissions(user)
    """

    # ==========================================================================
    # VERIFICACIÓN DE PERMISOS
    # ==========================================================================
    @classmethod
    def check_section_permission(
        cls,
        user,
        section_code: str = None,
        section_id: int = None,
        required_permission: str = 'can_view'
    ) -> bool:
        """
        Verifica si el usuario tiene un permiso específico en una sección.

        Args:
            user: Instancia de User
            section_code: Código de la sección (ej: 'empresa')
            section_id: ID de la sección (alternativa a section_code)
            required_permission: 'can_view', 'can_create', 'can_edit', 'can_delete'
                                 o código de acción personalizada

        Returns:
            bool: True si tiene el permiso

        Ejemplo:
            >>> CombinedPermissionService.check_section_permission(
            ...     user=request.user,
            ...     section_code='politicas',
            ...     required_permission='can_edit'
            ... )
            True
        """
        # Superusuario siempre tiene acceso
        if user.is_superuser:
            return True

        # Usuario inactivo o eliminado no tiene acceso
        if not user.is_active or getattr(user, 'is_deleted', False):
            return False

        # Intentar obtener de cache primero
        cached = PermissionCacheService.get_user_section_access(user.id)

        if cached is not None:
            access = cls._find_in_cache(cached, section_code, section_id)
            if access:
                return cls._check_permission_in_access(access, required_permission)
            return False

        # Cargar desde BD y verificar
        combined_access = cls._load_combined_access(user, section_code, section_id)

        if combined_access is None:
            return False

        return cls._check_permission_in_access(combined_access, required_permission)

    @classmethod
    def get_all_section_permissions(cls, user) -> Dict:
        """
        Obtiene todos los permisos de sección del usuario combinados.

        Args:
            user: Instancia de User

        Returns:
            Dict de section_id → {section_code, can_view, can_create, can_edit, can_delete, custom_actions}
        """
        # Superusuario tiene acceso a todo
        if user.is_superuser:
            return cls._get_superuser_permissions()

        # Intentar obtener de cache
        cached = PermissionCacheService.get_user_section_access(user.id)
        if cached is not None:
            return cached

        # Cargar desde BD, combinar y cachear
        all_access = cls._load_all_combined_access(user)

        # Cachear para próximas solicitudes
        PermissionCacheService.set_user_section_access(user.id, all_access)

        return all_access

    @classmethod
    def get_accessible_sections(cls, user, permission: str = 'can_view') -> List[int]:
        """
        Obtiene lista de IDs de secciones accesibles para un usuario.

        Args:
            user: Instancia de User
            permission: Tipo de permiso requerido

        Returns:
            Lista de section_ids accesibles
        """
        all_perms = cls.get_all_section_permissions(user)
        return [
            int(sid) for sid, access in all_perms.items()
            if cls._check_permission_in_access(access, permission)
        ]

    @classmethod
    def get_section_permissions(cls, user, section_code: str = None, section_id: int = None) -> Dict:
        """
        Obtiene los permisos completos de una sección para un usuario.

        Args:
            user: Instancia de User
            section_code: Código de la sección
            section_id: ID de la sección

        Returns:
            Dict con can_view, can_create, can_edit, can_delete, custom_actions
            o dict con todos False si no tiene acceso
        """
        if user.is_superuser:
            return cls._full_access()

        all_perms = cls.get_all_section_permissions(user)
        access = cls._find_in_cache(all_perms, section_code, section_id)

        return access if access else cls._no_access()

    # ==========================================================================
    # MÉTODOS DE CARGA DESDE BD
    # ==========================================================================
    @classmethod
    def _load_combined_access(
        cls,
        user,
        section_code: str = None,
        section_id: int = None
    ) -> Optional[Dict]:
        """
        Carga y combina permisos de todas las fuentes para una sección específica.

        Lógica OR: El resultado tiene True si CUALQUIER fuente tiene True.
        """
        from apps.core.models import CargoSectionAccess, TabSection

        # Obtener section_id si solo tenemos code
        if section_code and not section_id:
            try:
                section = TabSection.objects.get(code=section_code, is_enabled=True)
                section_id = section.id
            except TabSection.DoesNotExist:
                return None

        # Inicializar acceso combinado
        combined = cls._no_access()

        # 1. Permisos del Cargo
        if user.cargo:
            cargo_access = CargoSectionAccess.objects.filter(
                cargo=user.cargo,
                section_id=section_id
            ).first()

            if cargo_access:
                combined = cls._merge_access(combined, {
                    'can_view': cargo_access.can_view,
                    'can_create': cargo_access.can_create,
                    'can_edit': cargo_access.can_edit,
                    'can_delete': cargo_access.can_delete,
                    'custom_actions': cargo_access.custom_actions or {},
                })

        # 2. Permisos de Roles Adicionales
        combined = cls._add_additional_roles_access(user, section_id, combined)

        # 3. Permisos de Grupos
        combined = cls._add_group_access(user, section_id, combined)

        return combined

    @classmethod
    def _load_all_combined_access(cls, user) -> Dict:
        """
        Carga todos los accesos combinados del usuario desde BD.
        """
        from apps.core.models import CargoSectionAccess, TabSection

        result = {}

        # 1. Obtener todas las secciones habilitadas para tener la estructura base
        all_sections = TabSection.objects.filter(
            is_enabled=True
        ).select_related('tab__module')

        # Inicializar todas las secciones sin acceso
        for section in all_sections:
            result[str(section.id)] = {
                'section_code': section.code,
                'section_name': section.name,
                'module_code': section.tab.module.code,
                'tab_code': section.tab.code,
                **cls._no_access()
            }

        # 2. Permisos del Cargo
        if user.cargo:
            cargo_accesses = CargoSectionAccess.objects.filter(
                cargo=user.cargo
            ).select_related('section__tab__module')

            for access in cargo_accesses:
                sid = str(access.section_id)
                if sid in result:
                    result[sid] = cls._merge_access(result[sid], {
                        'section_code': access.section.code,
                        'section_name': access.section.name,
                        'module_code': access.section.tab.module.code,
                        'tab_code': access.section.tab.code,
                        'can_view': access.can_view,
                        'can_create': access.can_create,
                        'can_edit': access.can_edit,
                        'can_delete': access.can_delete,
                        'custom_actions': access.custom_actions or {},
                    })

        # 3. Combinar con roles adicionales
        result = cls._add_all_additional_roles_access(user, result)

        # 4. Combinar con grupos
        result = cls._add_all_group_access(user, result)

        return result

    # ==========================================================================
    # COMBINACIÓN DE FUENTES DE PERMISOS
    # ==========================================================================
    @classmethod
    def _add_additional_roles_access(cls, user, section_id: int, combined: Dict) -> Dict:
        """
        Agrega permisos de roles adicionales activos del usuario para una sección.

        Los roles adicionales otorgan permisos legacy (Permiso), no CargoSectionAccess.
        Aquí verificamos si algún rol adicional tiene permisos que implican acceso.
        """
        # Los roles adicionales en el sistema actual usan permisos legacy,
        # no CargoSectionAccess directamente. Por ahora retornamos sin cambios.
        # En una futura implementación, se podría crear RolAdicionalSectionAccess.
        return combined

    @classmethod
    def _add_group_access(cls, user, section_id: int, combined: Dict) -> Dict:
        """
        Agrega permisos de grupos del usuario para una sección.

        Similar a roles adicionales, los grupos usan permisos legacy.
        """
        return combined

    @classmethod
    def _add_all_additional_roles_access(cls, user, result: Dict) -> Dict:
        """
        Agrega permisos de todos los roles adicionales a todas las secciones.
        """
        # Implementación futura cuando se cree RolAdicionalSectionAccess
        return result

    @classmethod
    def _add_all_group_access(cls, user, result: Dict) -> Dict:
        """
        Agrega permisos de todos los grupos a todas las secciones.
        """
        # Implementación futura cuando se cree GroupSectionAccess
        return result

    # ==========================================================================
    # UTILIDADES
    # ==========================================================================
    @classmethod
    def _find_in_cache(cls, cached: Dict, section_code: str, section_id: int) -> Optional[Dict]:
        """Busca sección en cache por ID o código."""
        if section_id:
            return cached.get(str(section_id))

        if section_code:
            for sid, access in cached.items():
                if access.get('section_code') == section_code:
                    return access

        return None

    @classmethod
    def _check_permission_in_access(cls, access: Dict, permission: str) -> bool:
        """Verifica permiso en dict de acceso."""
        if permission in ['can_view', 'can_create', 'can_edit', 'can_delete']:
            return access.get(permission, False)

        # Acción personalizada
        custom_actions = access.get('custom_actions', {})
        return bool(custom_actions.get(permission, False))

    @classmethod
    def _merge_access(cls, base: Dict, new: Dict) -> Dict:
        """
        Combina dos dicts de acceso usando lógica OR.

        Si cualquiera de las fuentes tiene True, el resultado es True.
        """
        merged = {
            'section_code': new.get('section_code', base.get('section_code', '')),
            'section_name': new.get('section_name', base.get('section_name', '')),
            'module_code': new.get('module_code', base.get('module_code', '')),
            'tab_code': new.get('tab_code', base.get('tab_code', '')),
            'can_view': base.get('can_view', False) or new.get('can_view', False),
            'can_create': base.get('can_create', False) or new.get('can_create', False),
            'can_edit': base.get('can_edit', False) or new.get('can_edit', False),
            'can_delete': base.get('can_delete', False) or new.get('can_delete', False),
            'custom_actions': {**base.get('custom_actions', {})},
        }

        # Merge custom actions con OR
        for action, value in new.get('custom_actions', {}).items():
            if value:
                merged['custom_actions'][action] = True

        return merged

    @classmethod
    def _no_access(cls) -> Dict:
        """Retorna dict de sin acceso."""
        return {
            'can_view': False,
            'can_create': False,
            'can_edit': False,
            'can_delete': False,
            'custom_actions': {},
        }

    @classmethod
    def _full_access(cls) -> Dict:
        """Retorna dict de acceso completo (superusuario)."""
        return {
            'can_view': True,
            'can_create': True,
            'can_edit': True,
            'can_delete': True,
            'custom_actions': {},
        }

    @classmethod
    def _get_superuser_permissions(cls) -> Dict:
        """Retorna todos los permisos para superusuario."""
        from apps.core.models import TabSection

        sections = TabSection.objects.filter(
            is_enabled=True
        ).select_related('tab__module')

        return {
            str(s.id): {
                'section_code': s.code,
                'section_name': s.name,
                'module_code': s.tab.module.code,
                'tab_code': s.tab.code,
                'can_view': True,
                'can_create': True,
                'can_edit': True,
                'can_delete': True,
                'custom_actions': {},
            }
            for s in sections
        }

    # ==========================================================================
    # DEBUGGING Y DIAGNÓSTICO
    # ==========================================================================
    @classmethod
    def debug_user_permissions(cls, user) -> Dict:
        """
        Genera un reporte de debug de los permisos de un usuario.

        Útil para diagnosticar problemas de permisos.

        Args:
            user: Instancia de User

        Returns:
            Dict con información detallada de permisos
        """
        from apps.core.models import CargoSectionAccess

        report = {
            'user_id': user.id,
            'user_email': user.email,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
            'cargo': None,
            'cargo_accesses_count': 0,
            'roles_adicionales': [],
            'groups': [],
            'cached': PermissionCacheService.get_user_section_access(user.id) is not None,
        }

        if user.cargo:
            report['cargo'] = {
                'id': user.cargo.id,
                'code': user.cargo.code,
                'name': user.cargo.name,
                'nivel': user.cargo.nivel_jerarquico,
            }
            report['cargo_accesses_count'] = CargoSectionAccess.objects.filter(
                cargo=user.cargo
            ).count()

        # Roles adicionales
        if hasattr(user, 'usuarios_roles_adicionales'):
            roles = user.usuarios_roles_adicionales.filter(
                is_active=True
            ).select_related('rol_adicional')
            report['roles_adicionales'] = [
                {'code': r.rol_adicional.code, 'nombre': r.rol_adicional.nombre}
                for r in roles
            ]

        # Grupos
        if hasattr(user, 'user_groups'):
            groups = user.user_groups.filter(
                is_active=True
            ).select_related('group')
            report['groups'] = [
                {'code': g.group.code, 'name': g.group.name}
                for g in groups
            ]

        return report
