"""
Serializers Extendidos para el Sistema RBAC Híbrido
Sistema de Gestión StrateKaz

Este módulo complementa serializers_rbac.py con serializers específicos para:
- Gestión de permisos de cargos
- Roles adicionales (sugeridos)
- Permisos efectivos de usuarios
- Asignación de roles a usuarios
"""
from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Q
from .models import (
    Permiso, Role, RolePermiso, Cargo, CargoPermiso,
    Group, GroupRole, UserRole, UserGroup, User, CargoRole
)


# =============================================================================
# SERIALIZERS PARA CARGOS - GESTIÓN DE PERMISOS
# =============================================================================

class PermisoSimpleSerializer(serializers.ModelSerializer):
    """Serializer minimalista para permisos (usado en listas)"""

    module_display = serializers.CharField(source='get_module_display', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    scope_display = serializers.CharField(source='get_scope_display', read_only=True)

    class Meta:
        model = Permiso
        fields = [
            'id', 'code', 'name',
            'module', 'module_display',
            'action', 'action_display',
            'scope', 'scope_display',
        ]


class CargoPermisosSerializer(serializers.Serializer):
    """
    Serializer para obtener/modificar permisos de un cargo

    GET: Retorna permisos actuales del cargo
    PATCH: Actualiza permisos del cargo
    """

    # Permisos directos del cargo
    direct_permissions = serializers.SerializerMethodField()

    # Permisos heredados de roles por defecto
    default_roles_permissions = serializers.SerializerMethodField()

    # Todos los permisos efectivos (combinados)
    effective_permissions = serializers.SerializerMethodField()

    # Resumen
    summary = serializers.SerializerMethodField()

    def get_direct_permissions(self, obj):
        """Permisos asignados directamente al cargo"""
        permisos = obj.permisos.filter(is_active=True)
        return PermisoSimpleSerializer(permisos, many=True).data

    def get_default_roles_permissions(self, obj):
        """Permisos que vienen de roles por defecto del cargo"""
        roles = obj.default_roles.filter(is_active=True)

        result = []
        for role in roles:
            role_perms = role.permisos.filter(is_active=True)
            result.append({
                'role_id': role.id,
                'role_code': role.code,
                'role_name': role.name,
                'permissions': PermisoSimpleSerializer(role_perms, many=True).data,
            })

        return result

    def get_effective_permissions(self, obj):
        """Todos los permisos únicos (directos + roles)"""
        # Permisos directos
        direct = set(obj.permisos.filter(is_active=True).values_list('code', flat=True))

        # Permisos de roles por defecto
        from_roles = set()
        for role in obj.default_roles.filter(is_active=True):
            role_perms = role.permisos.filter(is_active=True).values_list('code', flat=True)
            from_roles.update(role_perms)

        # Combinar códigos únicos
        all_codes = direct | from_roles

        # Obtener objetos de permisos
        permisos = Permiso.objects.filter(code__in=all_codes, is_active=True)
        return PermisoSimpleSerializer(permisos, many=True).data

    def get_summary(self, obj):
        """Resumen de permisos del cargo"""
        direct_count = obj.permisos.filter(is_active=True).count()

        # Contar permisos de roles
        roles_count = 0
        for role in obj.default_roles.filter(is_active=True):
            roles_count += role.permisos.filter(is_active=True).count()

        # Contar permisos únicos totales
        direct = set(obj.permisos.filter(is_active=True).values_list('code', flat=True))
        from_roles = set()
        for role in obj.default_roles.filter(is_active=True):
            role_perms = role.permisos.filter(is_active=True).values_list('code', flat=True)
            from_roles.update(role_perms)

        unique_count = len(direct | from_roles)

        return {
            'direct_permissions_count': direct_count,
            'roles_permissions_count': roles_count,
            'unique_permissions_count': unique_count,
            'default_roles_count': obj.default_roles.filter(is_active=True).count(),
        }


class UpdateCargoPermisosSerializer(serializers.Serializer):
    """Serializer para actualizar permisos de un cargo"""

    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='Lista de IDs de permisos directos (reemplaza los existentes)'
    )

    default_role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='Lista de IDs de roles por defecto (reemplaza los existentes)'
    )

    def validate_permission_ids(self, value):
        """Validar que los permisos existan"""
        if value:
            existing = Permiso.objects.filter(id__in=value, is_active=True)
            if existing.count() != len(value):
                raise serializers.ValidationError('Algunos permisos no existen o están inactivos')
        return value

    def validate_default_role_ids(self, value):
        """Validar que los roles existan"""
        if value:
            existing = Role.objects.filter(id__in=value, is_active=True)
            if existing.count() != len(value):
                raise serializers.ValidationError('Algunos roles no existen o están inactivos')
        return value


class CargoUsuariosSerializer(serializers.Serializer):
    """Serializer para listar usuarios de un cargo"""

    users = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()

    def get_users(self, obj):
        """Lista de usuarios con este cargo"""
        usuarios = obj.usuarios.filter(
            is_active=True,
            deleted_at__isnull=True
        ).select_related('cargo')[:100]  # Limitar a 100

        return [{
            'id': u.id,
            'username': u.username,
            'full_name': u.get_full_name() or u.username,
            'email': u.email,
            'document_number': u.document_number,
            'fecha_ingreso': u.fecha_ingreso,
            'estado_empleado': u.estado_empleado,
            'estado_empleado_display': u.get_estado_empleado_display(),
            # Roles adicionales del usuario
            'additional_roles': self._get_user_additional_roles(u),
            # Grupos del usuario
            'groups': self._get_user_groups(u),
        } for u in usuarios]

    def _get_user_additional_roles(self, user):
        """Roles adicionales asignados al usuario (fuera del cargo)"""
        user_roles = user.user_roles.select_related('role').filter(
            role__is_active=True
        )

        return [{
            'role_id': ur.role.id,
            'role_code': ur.role.code,
            'role_name': ur.role.name,
            'assigned_at': ur.assigned_at,
            'expires_at': ur.expires_at,
            'is_expired': ur.is_expired,
        } for ur in user_roles]

    def _get_user_groups(self, user):
        """Grupos a los que pertenece el usuario"""
        user_groups = user.user_groups.select_related('group').filter(
            group__is_active=True
        )

        return [{
            'group_id': ug.group.id,
            'group_code': ug.group.code,
            'group_name': ug.group.name,
            'is_leader': ug.is_leader,
        } for ug in user_groups]

    def get_summary(self, obj):
        """Resumen de usuarios del cargo"""
        total_users = obj.usuarios.filter(
            is_active=True,
            deleted_at__isnull=True
        ).count()

        by_estado = obj.usuarios.filter(
            is_active=True,
            deleted_at__isnull=True
        ).values('estado_empleado').annotate(count=Count('id'))

        return {
            'total_users': total_users,
            'posiciones_totales': obj.cantidad_posiciones,
            'posiciones_ocupadas': total_users,
            'posiciones_disponibles': max(0, obj.cantidad_posiciones - total_users),
            'by_estado': list(by_estado),
        }


# =============================================================================
# SERIALIZERS PARA ROLES ADICIONALES
# =============================================================================

class RolAdicionalListSerializer(serializers.ModelSerializer):
    """Serializer para listado de roles adicionales"""

    permissions_count = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()
    groups_count = serializers.SerializerMethodField()
    is_suggested = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'code', 'name', 'description',
            'is_system', 'is_active', 'is_suggested',
            'permissions_count', 'users_count', 'groups_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_permissions_count(self, obj):
        return obj.permisos.filter(is_active=True).count()

    def get_users_count(self, obj):
        """Usuarios con este rol asignado directamente"""
        return obj.user_roles.filter(
            user__is_active=True,
            user__deleted_at__isnull=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).count()

    def get_groups_count(self, obj):
        return obj.groups.filter(is_active=True).count()

    def get_is_suggested(self, obj):
        """Determina si es un rol sugerido (no es de sistema y tiene usuarios)"""
        return not obj.is_system and self.get_users_count(obj) >= 3


class RolAdicionalDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para roles adicionales"""

    permisos = PermisoSimpleSerializer(many=True, read_only=True)
    permissions_count = serializers.SerializerMethodField()
    users_assigned = serializers.SerializerMethodField()
    groups_assigned = serializers.SerializerMethodField()
    is_suggested = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'code', 'name', 'description',
            'is_system', 'is_active', 'is_suggested',
            'permisos', 'permissions_count',
            'users_assigned', 'groups_assigned',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_permissions_count(self, obj):
        return obj.permisos.filter(is_active=True).count()

    def get_is_suggested(self, obj):
        return not obj.is_system and len(self.get_users_assigned(obj)) >= 3

    def get_users_assigned(self, obj):
        """Usuarios con este rol (primeros 50)"""
        user_roles = obj.user_roles.select_related('user', 'user__cargo').filter(
            user__is_active=True,
            user__deleted_at__isnull=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )[:50]

        return [{
            'user_id': ur.user.id,
            'username': ur.user.username,
            'full_name': ur.user.get_full_name() or ur.user.username,
            'cargo': ur.user.cargo.name if ur.user.cargo else None,
            'assigned_at': ur.assigned_at,
            'expires_at': ur.expires_at,
            'is_expired': ur.is_expired,
        } for ur in user_roles]

    def get_groups_assigned(self, obj):
        """Grupos con este rol (primeros 20)"""
        group_roles = obj.group_roles.select_related('group').filter(
            group__is_active=True
        )[:20]

        return [{
            'group_id': gr.group.id,
            'group_code': gr.group.code,
            'group_name': gr.group.name,
            'members_count': gr.group.user_groups.filter(
                user__is_active=True,
                user__deleted_at__isnull=True
            ).count(),
        } for gr in group_roles]


class RolAdicionalCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear roles adicionales"""

    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de permisos'
    )

    class Meta:
        model = Role
        fields = ['code', 'name', 'description', 'is_active', 'permission_ids']

    def validate_code(self, value):
        if Role.objects.filter(code=value).exists():
            raise serializers.ValidationError('Este código de rol ya existe')
        return value

    @transaction.atomic
    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])

        # Los roles creados por usuarios NO son del sistema
        validated_data['is_system'] = False

        role = Role.objects.create(**validated_data)

        if permission_ids:
            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            user = self.context['request'].user if 'request' in self.context else None

            for permiso in permisos:
                RolePermiso.objects.create(
                    role=role,
                    permiso=permiso,
                    granted_by=user
                )

        return role


class RolAdicionalUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar roles adicionales"""

    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de permisos (reemplaza los existentes)'
    )

    class Meta:
        model = Role
        fields = ['name', 'description', 'is_active', 'permission_ids']

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.is_system:
            # Los roles del sistema no pueden ser modificados
            raise serializers.ValidationError(
                'Los roles del sistema no pueden ser modificados'
            )
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)

        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si se proporcionaron permisos, reemplazar
        if permission_ids is not None:
            user = self.context['request'].user if 'request' in self.context else None

            # Eliminar permisos existentes
            RolePermiso.objects.filter(role=instance).delete()

            # Agregar nuevos permisos
            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            for permiso in permisos:
                RolePermiso.objects.create(
                    role=instance,
                    permiso=permiso,
                    granted_by=user
                )

        return instance


class RolSugeridoSerializer(serializers.Serializer):
    """Serializer para roles sugeridos (basados en patrones de uso)"""

    role_id = serializers.IntegerField()
    role_code = serializers.CharField()
    role_name = serializers.CharField()
    description = serializers.CharField()

    # Estadísticas que lo hacen sugerido
    users_count = serializers.IntegerField()
    permissions_count = serializers.IntegerField()
    groups_count = serializers.IntegerField()

    # Razón de la sugerencia
    suggestion_reason = serializers.CharField()

    # Permisos del rol
    permissions = PermisoSimpleSerializer(many=True)


class RolAdicionalUsuariosSerializer(serializers.Serializer):
    """Serializer para obtener usuarios de un rol adicional"""

    users = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()

    def get_users(self, obj):
        """Usuarios con este rol (primeros 100)"""
        user_roles = obj.user_roles.select_related('user', 'user__cargo').filter(
            user__is_active=True,
            user__deleted_at__isnull=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )[:100]

        return [{
            'user_id': ur.user.id,
            'username': ur.user.username,
            'full_name': ur.user.get_full_name() or ur.user.username,
            'email': ur.user.email,
            'cargo': ur.user.cargo.name if ur.user.cargo else None,
            'cargo_code': ur.user.cargo.code if ur.user.cargo else None,
            'assigned_at': ur.assigned_at,
            'assigned_by': ur.assigned_by.get_full_name() if ur.assigned_by else None,
            'expires_at': ur.expires_at,
            'is_expired': ur.is_expired,
            'is_valid': ur.is_valid,
        } for ur in user_roles]

    def get_summary(self, obj):
        """Resumen de usuarios con este rol"""
        total_active = obj.user_roles.filter(
            user__is_active=True,
            user__deleted_at__isnull=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).count()

        total_expired = obj.user_roles.filter(
            user__is_active=True,
            user__deleted_at__isnull=True,
            expires_at__lte=timezone.now()
        ).count()

        return {
            'total_active': total_active,
            'total_expired': total_expired,
            'total': total_active + total_expired,
        }


# =============================================================================
# SERIALIZERS PARA PERMISOS AGRUPADOS
# =============================================================================

class PermisosAgrupadosSerializer(serializers.Serializer):
    """Serializer para permisos agrupados por módulo"""

    module = serializers.CharField()
    module_name = serializers.CharField()
    permissions = PermisoSimpleSerializer(many=True)
    total_count = serializers.IntegerField()


# =============================================================================
# SERIALIZERS PARA USUARIOS - PERMISOS EFECTIVOS
# =============================================================================

class UserPermisosEfectivosSerializer(serializers.Serializer):
    """Serializer para permisos efectivos de un usuario"""

    # Usuario básico
    user = serializers.SerializerMethodField()

    # Fuentes de permisos
    permissions_from_cargo = serializers.SerializerMethodField()
    permissions_from_direct_roles = serializers.SerializerMethodField()
    permissions_from_groups = serializers.SerializerMethodField()

    # Permisos efectivos (únicos)
    effective_permissions = serializers.SerializerMethodField()

    # Resumen
    summary = serializers.SerializerMethodField()

    def get_user(self, obj):
        """Información básica del usuario"""
        return {
            'id': obj.id,
            'username': obj.username,
            'full_name': obj.get_full_name() or obj.username,
            'email': obj.email,
            'cargo': obj.cargo.name if obj.cargo else None,
            'cargo_code': obj.cargo.code if obj.cargo else None,
            'is_superuser': obj.is_superuser,
        }

    def get_permissions_from_cargo(self, obj):
        """Permisos del cargo"""
        if not obj.cargo:
            return {
                'cargo': None,
                'direct_permissions': [],
                'default_roles_permissions': [],
            }

        # Permisos directos del cargo
        direct_perms = obj.cargo.permisos.filter(is_active=True)

        # Permisos de roles por defecto del cargo
        roles_perms = []
        for role in obj.cargo.default_roles.filter(is_active=True):
            role_perms = role.permisos.filter(is_active=True)
            roles_perms.append({
                'role_id': role.id,
                'role_code': role.code,
                'role_name': role.name,
                'permissions': PermisoSimpleSerializer(role_perms, many=True).data,
            })

        return {
            'cargo': {
                'id': obj.cargo.id,
                'code': obj.cargo.code,
                'name': obj.cargo.name,
            },
            'direct_permissions': PermisoSimpleSerializer(direct_perms, many=True).data,
            'default_roles_permissions': roles_perms,
        }

    def get_permissions_from_direct_roles(self, obj):
        """Permisos de roles asignados directamente al usuario"""
        user_roles = obj.user_roles.select_related('role').filter(
            role__is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )

        result = []
        for ur in user_roles:
            role_perms = ur.role.permisos.filter(is_active=True)
            result.append({
                'role_id': ur.role.id,
                'role_code': ur.role.code,
                'role_name': ur.role.name,
                'assigned_at': ur.assigned_at,
                'expires_at': ur.expires_at,
                'permissions': PermisoSimpleSerializer(role_perms, many=True).data,
            })

        return result

    def get_permissions_from_groups(self, obj):
        """Permisos de grupos a los que pertenece"""
        user_groups = obj.user_groups.select_related('group').filter(
            group__is_active=True
        )

        result = []
        for ug in user_groups:
            group = ug.group

            # Obtener roles del grupo
            group_roles = group.roles.filter(is_active=True)
            roles_data = []

            for role in group_roles:
                role_perms = role.permisos.filter(is_active=True)
                roles_data.append({
                    'role_id': role.id,
                    'role_code': role.code,
                    'role_name': role.name,
                    'permissions': PermisoSimpleSerializer(role_perms, many=True).data,
                })

            result.append({
                'group_id': group.id,
                'group_code': group.code,
                'group_name': group.name,
                'is_leader': ug.is_leader,
                'roles': roles_data,
            })

        return result

    def get_effective_permissions(self, obj):
        """Todos los permisos únicos del usuario"""
        permisos = obj.get_all_permissions()
        return PermisoSimpleSerializer(permisos, many=True).data

    def get_summary(self, obj):
        """Resumen de permisos del usuario"""
        all_perms = obj.get_all_permissions()

        # Contar por módulo
        by_module = {}
        for perm in all_perms:
            if perm.module not in by_module:
                by_module[perm.module] = 0
            by_module[perm.module] += 1

        # Fuentes
        sources = []
        if obj.cargo:
            sources.append('cargo')
        if obj.user_roles.filter(role__is_active=True).exists():
            sources.append('direct_roles')
        if obj.user_groups.filter(group__is_active=True).exists():
            sources.append('groups')

        return {
            'total_permissions': all_perms.count(),
            'by_module': by_module,
            'sources': sources,
            'has_superuser': obj.is_superuser,
            'cargo': obj.cargo.name if obj.cargo else None,
            'direct_roles_count': obj.user_roles.filter(role__is_active=True).count(),
            'groups_count': obj.user_groups.filter(group__is_active=True).count(),
        }


class AsignarRolesSerializer(serializers.Serializer):
    """Serializer para asignar/quitar roles a un usuario"""

    add_role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='Lista de IDs de roles a agregar'
    )

    remove_role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='Lista de IDs de roles a quitar'
    )

    expires_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text='Fecha de expiración para los roles agregados (opcional)'
    )

    def validate_add_role_ids(self, value):
        if value:
            existing = Role.objects.filter(id__in=value, is_active=True)
            if existing.count() != len(value):
                raise serializers.ValidationError('Algunos roles no existen o están inactivos')
        return value

    def validate_remove_role_ids(self, value):
        if value:
            existing = Role.objects.filter(id__in=value)
            if existing.count() != len(value):
                raise serializers.ValidationError('Algunos roles no existen')
        return value

    def validate_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError('La fecha de expiración debe ser futura')
        return value

    def validate(self, attrs):
        add_ids = attrs.get('add_role_ids', [])
        remove_ids = attrs.get('remove_role_ids', [])

        if not add_ids and not remove_ids:
            raise serializers.ValidationError(
                'Debe proporcionar add_role_ids o remove_role_ids'
            )

        # Verificar que no haya duplicados entre agregar y quitar
        if add_ids and remove_ids:
            duplicates = set(add_ids) & set(remove_ids)
            if duplicates:
                raise serializers.ValidationError(
                    f'No puede agregar y quitar los mismos roles: {duplicates}'
                )

        return attrs


class RolesDisponiblesSerializer(serializers.Serializer):
    """Serializer para listar roles disponibles para asignar a un usuario"""

    all_roles = serializers.SerializerMethodField()
    current_roles = serializers.SerializerMethodField()
    available_roles = serializers.SerializerMethodField()
    suggested_roles = serializers.SerializerMethodField()

    def get_all_roles(self, obj):
        """Todos los roles activos del sistema"""
        roles = Role.objects.filter(is_active=True)
        return [{
            'id': r.id,
            'code': r.code,
            'name': r.name,
            'description': r.description,
            'is_system': r.is_system,
            'permissions_count': r.permisos.filter(is_active=True).count(),
        } for r in roles]

    def get_current_roles(self, obj):
        """Roles actualmente asignados al usuario"""
        user_roles = obj.user_roles.select_related('role').filter(
            role__is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )

        return [{
            'role_id': ur.role.id,
            'role_code': ur.role.code,
            'role_name': ur.role.name,
            'assigned_at': ur.assigned_at,
            'expires_at': ur.expires_at,
        } for ur in user_roles]

    def get_available_roles(self, obj):
        """Roles que NO están asignados al usuario"""
        current_role_ids = obj.user_roles.filter(
            role__is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).values_list('role_id', flat=True)

        available = Role.objects.filter(
            is_active=True
        ).exclude(
            id__in=current_role_ids
        )

        return [{
            'id': r.id,
            'code': r.code,
            'name': r.name,
            'description': r.description,
            'is_system': r.is_system,
            'permissions_count': r.permisos.filter(is_active=True).count(),
        } for r in available]

    def get_suggested_roles(self, obj):
        """Roles sugeridos basados en el cargo del usuario"""
        if not obj.cargo:
            return []

        # Roles por defecto del cargo que no estén asignados
        current_role_ids = obj.user_roles.filter(
            role__is_active=True
        ).values_list('role_id', flat=True)

        suggested = obj.cargo.default_roles.filter(
            is_active=True
        ).exclude(
            id__in=current_role_ids
        )

        return [{
            'id': r.id,
            'code': r.code,
            'name': r.name,
            'description': r.description,
            'reason': f'Rol por defecto del cargo {obj.cargo.name}',
            'permissions_count': r.permisos.filter(is_active=True).count(),
        } for r in suggested]
