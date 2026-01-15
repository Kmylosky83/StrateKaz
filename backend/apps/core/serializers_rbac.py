"""
Serializers para el Sistema RBAC Dinamico
Sistema de Gestion StrateKaz

Este modulo contiene los serializers para la gestion de:
- Permisos (solo lectura)
- Roles (CRUD completo)
- Cargos extendidos con permisos
- Grupos (CRUD completo)
- Permisos de usuario
"""
from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import (
    Permiso, Role, RolePermiso, Cargo, CargoPermiso,
    Group, GroupRole, UserRole, UserGroup, User, MenuItem,
    RiesgoOcupacional, RolAdicional, RolAdicionalPermiso, UserRolAdicional,
    PermisoModulo, PermisoAccion, PermisoAlcance
)


# =============================================================================
# SERIALIZERS DE PERMISOS
# =============================================================================

class PermisoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de permisos"""

    # Campos dinamicos con relaciones FK
    modulo_code = serializers.CharField(source='modulo.code', read_only=True)
    modulo_name = serializers.CharField(source='modulo.name', read_only=True)
    accion_code = serializers.CharField(source='accion.code', read_only=True)
    accion_name = serializers.CharField(source='accion.name', read_only=True)
    alcance_code = serializers.CharField(source='alcance.code', read_only=True)
    alcance_name = serializers.CharField(source='alcance.name', read_only=True)

    class Meta:
        model = Permiso
        fields = [
            'id', 'code', 'name', 'description',
            'modulo', 'modulo_code', 'modulo_name',
            'accion', 'accion_code', 'accion_name',
            'alcance', 'alcance_code', 'alcance_name',
            'recurso', 'is_active', 'created_at',
        ]


class PermisoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de permiso con estadisticas"""

    modulo_code = serializers.CharField(source='modulo.code', read_only=True)
    modulo_name = serializers.CharField(source='modulo.name', read_only=True)
    accion_code = serializers.CharField(source='accion.code', read_only=True)
    accion_name = serializers.CharField(source='accion.name', read_only=True)
    alcance_code = serializers.CharField(source='alcance.code', read_only=True)
    alcance_name = serializers.CharField(source='alcance.name', read_only=True)
    roles_count = serializers.SerializerMethodField()
    cargos_count = serializers.SerializerMethodField()

    class Meta:
        model = Permiso
        fields = [
            'id', 'code', 'name', 'description',
            'modulo', 'modulo_code', 'modulo_name',
            'accion', 'accion_code', 'accion_name',
            'alcance', 'alcance_code', 'alcance_name',
            'recurso', 'is_active', 'roles_count', 'cargos_count', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_roles_count(self, obj):
        return obj.roles.filter(is_active=True).count()

    def get_cargos_count(self, obj):
        return obj.cargos.filter(is_active=True).count()


class PermissionGroupSerializer(serializers.Serializer):
    """Serializer para permisos agrupados por modulo"""
    module = serializers.CharField()
    module_name = serializers.CharField()
    module_icon = serializers.CharField(allow_null=True)
    permissions = PermisoListSerializer(many=True)


# =============================================================================
# SERIALIZERS DE ROLES
# =============================================================================

class RoleListSerializer(serializers.ModelSerializer):
    """Serializer para listado de roles"""

    permissions_count = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()
    groups_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'code', 'name', 'description', 'is_system', 'is_active',
            'permissions_count', 'users_count', 'groups_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_permissions_count(self, obj):
        return obj.permisos.filter(is_active=True).count()

    def get_users_count(self, obj):
        return obj.user_roles.filter(
            user__is_active=True, user__deleted_at__isnull=True
        ).count()

    def get_groups_count(self, obj):
        return obj.groups.filter(is_active=True).count()


class RoleDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de rol con permisos y usuarios"""

    permisos = PermisoListSerializer(many=True, read_only=True)
    permissions_count = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()
    groups_count = serializers.SerializerMethodField()
    users = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'code', 'name', 'description', 'is_system', 'is_active',
            'permisos', 'permissions_count', 'users_count', 'groups_count', 'users',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_permissions_count(self, obj):
        return obj.permisos.filter(is_active=True).count()

    def get_users_count(self, obj):
        return obj.user_roles.filter(
            user__is_active=True, user__deleted_at__isnull=True
        ).count()

    def get_groups_count(self, obj):
        return obj.groups.filter(is_active=True).count()

    def get_users(self, obj):
        """Lista simplificada de usuarios con este rol"""
        user_roles = obj.user_roles.select_related('user').filter(
            user__is_active=True, user__deleted_at__isnull=True
        )[:20]  # Limitar a 20 usuarios
        return [{
            'user_id': ur.user.id,
            'username': ur.user.username,
            'full_name': ur.user.get_full_name() or ur.user.username,
            'assigned_at': ur.assigned_at,
            'expires_at': ur.expires_at,
            'is_expired': ur.is_expired,
        } for ur in user_roles]


class RoleCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear roles"""

    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de permisos a asignar'
    )

    class Meta:
        model = Role
        fields = ['code', 'name', 'description', 'is_active', 'permission_ids']

    def validate_code(self, value):
        if Role.objects.filter(code=value).exists():
            raise serializers.ValidationError('Este codigo de rol ya existe')
        return value

    @transaction.atomic
    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])
        role = Role.objects.create(**validated_data)

        if permission_ids:
            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            user = self.context['request'].user if 'request' in self.context else None

            for permiso in permisos:
                RolePermiso.objects.create(role=role, permiso=permiso, granted_by=user)

        return role


class RoleUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar roles"""

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
            # Los roles del sistema solo pueden modificar is_active
            allowed_fields = {'is_active'}
            changed_fields = set(attrs.keys()) - {'is_active'}
            if changed_fields:
                raise serializers.ValidationError(
                    f'Los roles del sistema no pueden modificar: {", ".join(changed_fields)}'
                )
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)

        # Actualizar campos basicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si se proporcionaron permisos, reemplazar
        if permission_ids is not None and not instance.is_system:
            user = self.context['request'].user if 'request' in self.context else None

            # Eliminar permisos existentes
            RolePermiso.objects.filter(role=instance).delete()

            # Agregar nuevos permisos
            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            for permiso in permisos:
                RolePermiso.objects.create(role=instance, permiso=permiso, granted_by=user)

        return instance


class AssignPermissionsSerializer(serializers.Serializer):
    """Serializer para asignar/quitar permisos a rol"""

    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text='Lista de IDs de permisos'
    )
    replace = serializers.BooleanField(
        default=False,
        help_text='Si es True, reemplaza permisos existentes. Si es False, agrega.'
    )

    def validate_permission_ids(self, value):
        if not value:
            raise serializers.ValidationError('Debe proporcionar al menos un permiso')
        existing = Permiso.objects.filter(id__in=value, is_active=True)
        if existing.count() != len(value):
            raise serializers.ValidationError('Algunos permisos no existen o estan inactivos')
        return value


class RemovePermissionsSerializer(serializers.Serializer):
    """Serializer para quitar permisos de rol"""

    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text='Lista de IDs de permisos a quitar'
    )


# =============================================================================
# SERIALIZERS DE CARGOS (EXTENDIDOS CON MANUAL DE FUNCIONES)
# =============================================================================

class RiesgoOcupacionalSerializer(serializers.ModelSerializer):
    """Serializer para Riesgos Ocupacionales (SST)"""

    clasificacion_display = serializers.CharField(source='get_clasificacion_display', read_only=True)
    nivel_riesgo_display = serializers.CharField(source='get_nivel_riesgo_display', read_only=True)

    class Meta:
        model = RiesgoOcupacional
        fields = [
            'id', 'code', 'name', 'clasificacion', 'clasificacion_display',
            'descripcion', 'fuente', 'efectos_posibles',
            'nivel_riesgo', 'nivel_riesgo_display', 'controles_existentes',
            'is_active',
        ]


class CargoListRBACSerializer(serializers.ModelSerializer):
    """Serializer para listado de cargos con info RBAC"""

    nivel_jerarquico_display = serializers.CharField(source='get_nivel_jerarquico_display', read_only=True)
    area_nombre = serializers.CharField(read_only=True)
    area_code = serializers.CharField(source='area.code', read_only=True)
    users_count = serializers.SerializerMethodField()
    posiciones_disponibles = serializers.IntegerField(read_only=True)
    default_roles_count = serializers.SerializerMethodField()

    class Meta:
        model = Cargo
        fields = [
            'id', 'code', 'name', 'description',
            'nivel_jerarquico', 'nivel_jerarquico_display',
            'area', 'area_nombre', 'area_code',
            'cantidad_posiciones', 'is_jefatura', 'is_externo',
            'is_system', 'is_active', 'version',
            'users_count', 'posiciones_disponibles',
            'default_roles_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_users_count(self, obj):
        return obj.usuarios.filter(is_active=True, deleted_at__isnull=True).count()

    def get_default_roles_count(self, obj):
        return obj.default_roles.filter(is_active=True).count()


class CargoDetailRBACSerializer(serializers.ModelSerializer):
    """Serializer completo para Cargo con Manual de Funciones, Requisitos y SST"""

    # Displays
    nivel_jerarquico_display = serializers.CharField(source='get_nivel_jerarquico_display', read_only=True)
    nivel_educativo_display = serializers.CharField(source='get_nivel_educativo_display', read_only=True)
    experiencia_requerida_display = serializers.CharField(source='get_experiencia_requerida_display', read_only=True)

    # Relaciones
    area_detail = serializers.SerializerMethodField()
    parent_cargo_detail = serializers.SerializerMethodField()
    rol_sistema_detail = serializers.SerializerMethodField()
    expuesto_riesgos_detail = RiesgoOcupacionalSerializer(source='expuesto_riesgos', many=True, read_only=True)
    permisos = PermisoListSerializer(many=True, read_only=True)
    default_roles = RoleListSerializer(many=True, read_only=True)

    # Contadores
    permissions_count = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()
    posiciones_disponibles = serializers.IntegerField(read_only=True)
    usuarios_asignados_count = serializers.IntegerField(read_only=True)

    # Usuarios asignados
    users = serializers.SerializerMethodField()

    class Meta:
        model = Cargo
        fields = [
            # TAB 1: Identificación y Ubicación
            'id', 'code', 'name', 'description',
            'area', 'area_detail',
            'parent_cargo', 'parent_cargo_detail',
            'nivel_jerarquico', 'nivel_jerarquico_display',
            'cantidad_posiciones', 'is_jefatura', 'is_externo',
            'requiere_licencia_conduccion', 'categoria_licencia',
            'requiere_licencia_sst', 'requiere_tarjeta_contador', 'requiere_tarjeta_abogado',

            # TAB 2: Manual de Funciones
            'objetivo_cargo', 'funciones_responsabilidades',
            'autoridad_autonomia', 'relaciones_internas', 'relaciones_externas',

            # TAB 3: Requisitos
            'nivel_educativo', 'nivel_educativo_display', 'titulo_requerido',
            'experiencia_requerida', 'experiencia_requerida_display', 'experiencia_especifica',
            'competencias_tecnicas', 'competencias_blandas',
            'licencias_certificaciones', 'formacion_complementaria',

            # TAB 4: SST
            'expuesto_riesgos', 'expuesto_riesgos_detail',
            'epp_requeridos', 'examenes_medicos',
            'restricciones_medicas', 'capacitaciones_sst',

            # TAB 5: Permisos del Sistema
            'rol_sistema', 'rol_sistema_detail',
            'permisos', 'default_roles',
            'permissions_count',

            # Control
            'is_system', 'is_active', 'version',
            'fecha_aprobacion', 'aprobado_por',
            'users_count', 'usuarios_asignados_count', 'posiciones_disponibles', 'users',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'version']

    def get_area_detail(self, obj):
        if obj.area:
            return {
                'id': obj.area.id,
                'code': obj.area.code,
                'name': obj.area.name,
                'full_path': obj.area.full_path,
            }
        return None

    def get_parent_cargo_detail(self, obj):
        if obj.parent_cargo:
            return {
                'id': obj.parent_cargo.id,
                'code': obj.parent_cargo.code,
                'name': obj.parent_cargo.name,
                'nivel_jerarquico': obj.parent_cargo.nivel_jerarquico,
            }
        return None

    def get_rol_sistema_detail(self, obj):
        if obj.rol_sistema:
            return {
                'id': obj.rol_sistema.id,
                'code': obj.rol_sistema.code,
                'name': obj.rol_sistema.name,
                'permissions_count': obj.rol_sistema.permisos.filter(is_active=True).count(),
            }
        return None

    def get_permissions_count(self, obj):
        # Cuenta permisos CRUD (CargoPermiso), no secciones UI
        return obj.permisos.filter(is_active=True).count()

    def get_users_count(self, obj):
        return obj.usuarios.filter(is_active=True, deleted_at__isnull=True).count()

    def get_users(self, obj):
        """Lista de usuarios con este cargo (primeros 20)"""
        usuarios = obj.usuarios.filter(
            is_active=True, deleted_at__isnull=True
        )[:20]
        return [{
            'id': u.id,
            'username': u.username,
            'full_name': u.get_full_name() or u.username,
            'email': u.email,
            'fecha_ingreso': u.fecha_ingreso,
            'estado_empleado': u.estado_empleado,
        } for u in usuarios]


class CargoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear cargos con todos los campos"""

    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de permisos directos'
    )
    default_role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de roles por defecto'
    )
    riesgo_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de riesgos ocupacionales'
    )
    section_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de secciones (TabSection) a las que el cargo tiene acceso'
    )

    class Meta:
        model = Cargo
        fields = [
            # Identificación
            'code', 'name', 'description',
            # Ubicación
            'area', 'parent_cargo', 'nivel_jerarquico',
            # Configuración
            'cantidad_posiciones', 'is_jefatura', 'is_externo',
            'requiere_licencia_conduccion', 'categoria_licencia',
            'requiere_licencia_sst', 'requiere_tarjeta_contador', 'requiere_tarjeta_abogado',
            # Manual de funciones
            'objetivo_cargo', 'funciones_responsabilidades',
            'autoridad_autonomia', 'relaciones_internas', 'relaciones_externas',
            # Requisitos
            'nivel_educativo', 'titulo_requerido',
            'experiencia_requerida', 'experiencia_especifica',
            'competencias_tecnicas', 'competencias_blandas',
            'licencias_certificaciones', 'formacion_complementaria',
            # SST
            'riesgo_ids', 'epp_requeridos', 'examenes_medicos',
            'restricciones_medicas', 'capacitaciones_sst',
            # Permisos
            'rol_sistema', 'permission_ids', 'default_role_ids',
            # Acceso a secciones UI
            'section_ids',
            # Control
            'is_active',
        ]

    def validate_code(self, value):
        if Cargo.objects.filter(code=value).exists():
            raise serializers.ValidationError('Este código de cargo ya existe')
        return value.upper()

    @transaction.atomic
    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])
        default_role_ids = validated_data.pop('default_role_ids', [])
        riesgo_ids = validated_data.pop('riesgo_ids', [])
        section_ids = validated_data.pop('section_ids', [])

        user = self.context['request'].user if 'request' in self.context else None
        validated_data['created_by'] = user

        cargo = Cargo.objects.create(**validated_data)

        # Asignar riesgos ocupacionales (M2M)
        if riesgo_ids:
            from .models import RiesgoOcupacional
            riesgos = RiesgoOcupacional.objects.filter(id__in=riesgo_ids, is_active=True)
            cargo.expuesto_riesgos.set(riesgos)

        # Asignar permisos directos
        if permission_ids:
            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            for permiso in permisos:
                CargoPermiso.objects.create(cargo=cargo, permiso=permiso, granted_by=user)

        # Asignar roles por defecto
        if default_role_ids:
            from .models import CargoRole
            roles = Role.objects.filter(id__in=default_role_ids, is_active=True)
            for role in roles:
                CargoRole.objects.create(cargo=cargo, role=role)

        # Asignar acceso a secciones de UI (CargoSectionAccess)
        if section_ids:
            from .models import TabSection, CargoSectionAccess
            sections = TabSection.objects.filter(id__in=section_ids, is_active=True)
            for section in sections:
                CargoSectionAccess.objects.create(
                    cargo=cargo,
                    section=section,
                    can_view=True,
                    can_edit=True,
                    granted_by=user
                )

        return cargo


class CargoUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar cargos"""

    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    default_role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    riesgo_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    section_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de secciones (TabSection) a las que el cargo tiene acceso'
    )

    class Meta:
        model = Cargo
        fields = [
            # Identificación (code no editable)
            'name', 'description',
            # Ubicación
            'area', 'parent_cargo', 'nivel_jerarquico',
            # Configuración
            'cantidad_posiciones', 'is_jefatura', 'is_externo',
            'requiere_licencia_conduccion', 'categoria_licencia',
            'requiere_licencia_sst', 'requiere_tarjeta_contador', 'requiere_tarjeta_abogado',
            # Manual de funciones
            'objetivo_cargo', 'funciones_responsabilidades',
            'autoridad_autonomia', 'relaciones_internas', 'relaciones_externas',
            # Requisitos
            'nivel_educativo', 'titulo_requerido',
            'experiencia_requerida', 'experiencia_especifica',
            'competencias_tecnicas', 'competencias_blandas',
            'licencias_certificaciones', 'formacion_complementaria',
            # SST
            'riesgo_ids', 'epp_requeridos', 'examenes_medicos',
            'restricciones_medicas', 'capacitaciones_sst',
            # Permisos
            'rol_sistema', 'permission_ids', 'default_role_ids',
            # Acceso a secciones UI
            'section_ids',
            # Control
            'is_active', 'fecha_aprobacion',
        ]

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.is_system:
            # Los cargos del sistema tienen restricciones
            non_editable = {'nivel_jerarquico', 'area'}
            changed = set(attrs.keys()) & non_editable
            if changed:
                raise serializers.ValidationError(
                    f'Los cargos del sistema no pueden modificar: {", ".join(changed)}'
                )
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        default_role_ids = validated_data.pop('default_role_ids', None)
        riesgo_ids = validated_data.pop('riesgo_ids', None)
        section_ids = validated_data.pop('section_ids', None)

        # Verificar si se modificó el manual de funciones para incrementar versión
        manual_fields = ['objetivo_cargo', 'funciones_responsabilidades', 'autoridad_autonomia',
                        'relaciones_internas', 'relaciones_externas']
        manual_changed = any(
            field in validated_data and validated_data[field] != getattr(instance, field)
            for field in manual_fields
        )

        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if manual_changed:
            instance.version += 1

        instance.save()

        user = self.context['request'].user if 'request' in self.context else None

        # Actualizar riesgos M2M
        if riesgo_ids is not None:
            from .models import RiesgoOcupacional
            riesgos = RiesgoOcupacional.objects.filter(id__in=riesgo_ids, is_active=True)
            instance.expuesto_riesgos.set(riesgos)

        # Actualizar permisos si se proporcionaron
        if permission_ids is not None:
            CargoPermiso.objects.filter(cargo=instance).delete()
            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            for permiso in permisos:
                CargoPermiso.objects.create(cargo=instance, permiso=permiso, granted_by=user)

        # Actualizar roles por defecto si se proporcionaron
        if default_role_ids is not None:
            from .models import CargoRole
            CargoRole.objects.filter(cargo=instance).delete()
            roles = Role.objects.filter(id__in=default_role_ids, is_active=True)
            for role in roles:
                CargoRole.objects.create(cargo=instance, role=role)

        # Actualizar acceso a secciones de UI si se proporcionaron
        if section_ids is not None:
            from .models import TabSection, CargoSectionAccess
            CargoSectionAccess.objects.filter(cargo=instance).delete()
            sections = TabSection.objects.filter(id__in=section_ids, is_active=True)
            for section in sections:
                CargoSectionAccess.objects.create(
                    cargo=instance,
                    section=section,
                    can_view=True,
                    can_edit=True,
                    granted_by=user
                )

        return instance


class CargoChoicesSerializer(serializers.Serializer):
    """Serializer para obtener opciones de selects de Cargo"""

    nivel_jerarquico_choices = serializers.SerializerMethodField()
    nivel_educativo_choices = serializers.SerializerMethodField()
    experiencia_choices = serializers.SerializerMethodField()

    def get_nivel_jerarquico_choices(self, obj):
        return [{'value': k, 'label': v} for k, v in Cargo.NIVEL_JERARQUICO_CHOICES]

    def get_nivel_educativo_choices(self, obj):
        return [{'value': k, 'label': v} for k, v in Cargo.NIVEL_EDUCATIVO_CHOICES]

    def get_experiencia_choices(self, obj):
        return [{'value': k, 'label': v} for k, v in Cargo.EXPERIENCIA_CHOICES]


# =============================================================================
# SERIALIZERS DE GRUPOS
# =============================================================================

class GroupListSerializer(serializers.ModelSerializer):
    """Serializer para listado de grupos"""

    roles_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id', 'code', 'name', 'description', 'is_active',
            'roles_count', 'members_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_roles_count(self, obj):
        return obj.roles.filter(is_active=True).count()

    def get_members_count(self, obj):
        return obj.user_groups.filter(
            user__is_active=True, user__deleted_at__isnull=True
        ).count()


class GroupDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de grupo con roles y miembros"""

    roles = RoleListSerializer(many=True, read_only=True)
    members = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id', 'code', 'name', 'description', 'is_active',
            'roles', 'members', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_members(self, obj):
        user_groups = obj.user_groups.select_related('user', 'user__cargo').filter(
            user__is_active=True, user__deleted_at__isnull=True
        )[:50]
        return [{
            'user_id': ug.user.id,
            'username': ug.user.username,
            'full_name': ug.user.get_full_name() or ug.user.username,
            'cargo': ug.user.cargo.name if ug.user.cargo else None,
            'is_leader': ug.is_leader,
            'assigned_at': ug.assigned_at,
        } for ug in user_groups]


class GroupCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear grupos"""

    role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Group
        fields = ['code', 'name', 'description', 'is_active', 'role_ids']

    def validate_code(self, value):
        if Group.objects.filter(code=value).exists():
            raise serializers.ValidationError('Este codigo de grupo ya existe')
        return value

    @transaction.atomic
    def create(self, validated_data):
        role_ids = validated_data.pop('role_ids', [])
        group = Group.objects.create(**validated_data)

        if role_ids:
            roles = Role.objects.filter(id__in=role_ids, is_active=True)
            user = self.context['request'].user if 'request' in self.context else None

            for role in roles:
                GroupRole.objects.create(group=group, role=role, assigned_by=user)

        return group


class GroupUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar grupos"""

    role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Group
        fields = ['name', 'description', 'is_active', 'role_ids']

    @transaction.atomic
    def update(self, instance, validated_data):
        role_ids = validated_data.pop('role_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if role_ids is not None:
            user = self.context['request'].user if 'request' in self.context else None
            GroupRole.objects.filter(group=instance).delete()
            roles = Role.objects.filter(id__in=role_ids, is_active=True)
            for role in roles:
                GroupRole.objects.create(group=instance, role=role, assigned_by=user)

        return instance


class ManageGroupUsersSerializer(serializers.Serializer):
    """Serializer para agregar/quitar usuarios de grupo"""

    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text='Lista de IDs de usuarios'
    )
    leader_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='ID del usuario lider (solo para add-users)'
    )


# =============================================================================
# SERIALIZERS DE USER PERMISSIONS
# =============================================================================

class UserPermissionsSerializer(serializers.Serializer):
    """Serializer para listar todos los permisos efectivos del usuario"""

    permissions = serializers.SerializerMethodField()
    permissions_by_source = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()

    def get_permissions(self, obj):
        """Lista de todos los permisos unicos"""
        permisos = obj.get_all_permissions()
        return PermisoListSerializer(permisos, many=True).data

    def get_permissions_by_source(self, obj):
        """Permisos organizados por fuente (cargo, roles, grupos)"""
        result = {'cargo': [], 'direct_roles': [], 'groups': []}

        # Permisos del cargo
        if obj.cargo:
            cargo_perms = obj.cargo.permisos.filter(is_active=True)
            result['cargo'] = PermisoListSerializer(cargo_perms, many=True).data

        # Permisos de roles directos
        user_roles = obj.user_roles.filter(role__is_active=True)
        for user_role in user_roles:
            if user_role.is_valid:
                role_perms = user_role.role.permisos.filter(is_active=True)
                result['direct_roles'].append({
                    'role': RoleListSerializer(user_role.role).data,
                    'permissions': PermisoListSerializer(role_perms, many=True).data,
                    'expires_at': user_role.expires_at,
                })

        # Permisos de grupos
        user_groups = obj.user_groups.filter(group__is_active=True)
        for user_group in user_groups:
            group = user_group.group
            group_perms = group.get_all_permissions()
            result['groups'].append({
                'group': GroupListSerializer(group).data,
                'permissions': PermisoListSerializer(group_perms, many=True).data,
                'is_leader': user_group.is_leader,
            })

        return result

    def get_summary(self, obj):
        """Resumen de permisos"""
        all_perms = obj.get_all_permissions()

        # Contar por modulo
        by_module = {}
        for perm in all_perms:
            if perm.module not in by_module:
                by_module[perm.module] = 0
            by_module[perm.module] += 1

        return {
            'total_permissions': all_perms.count(),
            'by_module': by_module,
            'has_superuser': obj.is_superuser,
            'cargo': obj.cargo.name if obj.cargo else None,
        }


class AssignRoleToUserSerializer(serializers.Serializer):
    """Serializer para asignar rol a usuario"""

    role_id = serializers.IntegerField(help_text='ID del rol a asignar')
    expires_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text='Fecha de expiracion del rol (opcional)'
    )

    def validate_role_id(self, value):
        if not Role.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('El rol no existe o esta inactivo')
        return value

    def validate_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError('La fecha de expiracion debe ser futura')
        return value


class RemoveRoleFromUserSerializer(serializers.Serializer):
    """Serializer para quitar rol de usuario"""

    role_id = serializers.IntegerField(help_text='ID del rol a quitar')


class UserRolesListSerializer(serializers.Serializer):
    """Serializer para listar roles de un usuario"""

    direct_roles = serializers.SerializerMethodField()
    group_roles = serializers.SerializerMethodField()

    def get_direct_roles(self, obj):
        """Roles asignados directamente"""
        user_roles = obj.user_roles.select_related('role').filter(role__is_active=True)
        return [{
            'role_id': ur.role.id,
            'role_code': ur.role.code,
            'role_name': ur.role.name,
            'assigned_at': ur.assigned_at,
            'expires_at': ur.expires_at,
            'is_expired': ur.is_expired,
            'is_valid': ur.is_valid,
        } for ur in user_roles]

    def get_group_roles(self, obj):
        """Roles heredados de grupos"""
        user_groups = obj.user_groups.select_related('group').filter(group__is_active=True)
        result = []

        for ug in user_groups:
            group_roles = ug.group.roles.filter(is_active=True)
            for role in group_roles:
                result.append({
                    'role_id': role.id,
                    'role_code': role.code,
                    'role_name': role.name,
                    'group_code': ug.group.code,
                    'group_name': ug.group.name,
                    'is_leader': ug.is_leader,
                })

        return result


# =============================================================================
# SERIALIZERS DE MENU
# =============================================================================

class MenuItemSerializer(serializers.ModelSerializer):
    """Serializer para items de menu"""

    children = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            'id', 'code', 'name', 'path', 'icon',
            'macroprocess', 'color', 'order', 'badge',
            'is_category', 'allow_all', 'is_active',
            'children'
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('order')
        return MenuItemSerializer(children, many=True).data


class MenuItemCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear items de menu"""

    allowed_cargo_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    allowed_role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    required_permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = MenuItem
        fields = [
            'code', 'name', 'path', 'icon', 'parent',
            'macroprocess', 'color', 'order', 'badge',
            'is_category', 'allow_all', 'is_active',
            'allowed_cargo_ids', 'allowed_role_ids', 'required_permission_ids'
        ]

    @transaction.atomic
    def create(self, validated_data):
        cargo_ids = validated_data.pop('allowed_cargo_ids', [])
        role_ids = validated_data.pop('allowed_role_ids', [])
        permission_ids = validated_data.pop('required_permission_ids', [])

        menu_item = MenuItem.objects.create(**validated_data)

        if cargo_ids:
            cargos = Cargo.objects.filter(id__in=cargo_ids, is_active=True)
            menu_item.allowed_cargos.set(cargos)

        if role_ids:
            roles = Role.objects.filter(id__in=role_ids, is_active=True)
            menu_item.allowed_roles.set(roles)

        if permission_ids:
            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            menu_item.required_permissions.set(permisos)

        return menu_item


# =============================================================================
# SERIALIZERS DE ESTADISTICAS RBAC
# =============================================================================

class RBACStatsSerializer(serializers.Serializer):
    """Serializer para estadisticas RBAC"""

    total_cargos = serializers.IntegerField()
    active_cargos = serializers.IntegerField()
    system_cargos = serializers.IntegerField()
    total_roles = serializers.IntegerField()
    active_roles = serializers.IntegerField()
    system_roles = serializers.IntegerField()
    total_groups = serializers.IntegerField()
    active_groups = serializers.IntegerField()
    total_permissions = serializers.IntegerField()
    active_permissions = serializers.IntegerField()
    total_users = serializers.IntegerField()
    users_with_cargo = serializers.IntegerField()


# =============================================================================
# SERIALIZERS DE ROLES ADICIONALES (RBAC Híbrido)
# =============================================================================

class RolAdicionalListSerializer(serializers.ModelSerializer):
    """Serializer para listado de roles adicionales"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    permisos_count = serializers.SerializerMethodField()
    usuarios_count = serializers.SerializerMethodField()
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        default=None
    )

    class Meta:
        model = RolAdicional
        fields = [
            'id', 'code', 'nombre', 'descripcion',
            'tipo', 'tipo_display',
            'justificacion_legal',
            'requiere_certificacion', 'certificacion_requerida',
            'is_system', 'is_active',
            'permisos_count', 'usuarios_count',
            'created_by_nombre',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_permisos_count(self, obj):
        return obj.permisos.filter(is_active=True).count()

    def get_usuarios_count(self, obj):
        return obj.usuarios_asignados.filter(is_active=True).count()


class RolAdicionalDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de rol adicional con permisos y usuarios"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    permisos = PermisoListSerializer(many=True, read_only=True)
    usuarios_asignados = serializers.SerializerMethodField()
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        default=None
    )

    class Meta:
        model = RolAdicional
        fields = [
            'id', 'code', 'nombre', 'descripcion',
            'tipo', 'tipo_display',
            'justificacion_legal',
            'requiere_certificacion', 'certificacion_requerida',
            'is_system', 'is_active',
            'permisos', 'usuarios_asignados',
            'created_by', 'created_by_nombre',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_usuarios_asignados(self, obj):
        """Obtiene los usuarios asignados con su información"""
        asignaciones = obj.usuarios_asignados.filter(
            is_active=True
        ).select_related('user', 'assigned_by')

        return [
            {
                'id': a.id,
                'user_id': a.user.id,
                'user_nombre': a.user.get_full_name(),
                'user_email': a.user.email,
                'assigned_at': a.assigned_at,
                'expires_at': a.expires_at,
                'assigned_by_nombre': a.assigned_by.get_full_name() if a.assigned_by else None,
                'justificacion': a.justificacion,
                'fecha_certificacion': a.fecha_certificacion,
                'certificacion_expira': a.certificacion_expira,
                'is_expired': a.is_expired,
                'is_certification_expired': a.is_certification_expired,
            }
            for a in asignaciones
        ]


class RolAdicionalCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear roles adicionales"""

    permisos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list
    )

    class Meta:
        model = RolAdicional
        fields = [
            'code', 'nombre', 'descripcion',
            'tipo',
            'justificacion_legal',
            'requiere_certificacion', 'certificacion_requerida',
            'is_active',
            'permisos_ids',
        ]

    def validate_code(self, value):
        """Validar que el código sea único"""
        if RolAdicional.objects.filter(code=value).exists():
            raise serializers.ValidationError(
                f"Ya existe un rol adicional con el código '{value}'"
            )
        return value

    def validate(self, data):
        """Validación cruzada"""
        if data.get('requiere_certificacion') and not data.get('certificacion_requerida'):
            raise serializers.ValidationError({
                'certificacion_requerida': 'Debe especificar la certificación requerida'
            })
        return data

    @transaction.atomic
    def create(self, validated_data):
        permisos_ids = validated_data.pop('permisos_ids', [])
        request = self.context.get('request')

        rol = RolAdicional.objects.create(
            **validated_data,
            created_by=request.user if request else None
        )

        # Asignar permisos
        if permisos_ids:
            permisos = Permiso.objects.filter(id__in=permisos_ids, is_active=True)
            for permiso in permisos:
                RolAdicionalPermiso.objects.create(
                    rol_adicional=rol,
                    permiso=permiso,
                    granted_by=request.user if request else None
                )

        return rol


class RolAdicionalUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar roles adicionales"""

    permisos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = RolAdicional
        fields = [
            'nombre', 'descripcion',
            'tipo',
            'justificacion_legal',
            'requiere_certificacion', 'certificacion_requerida',
            'is_active',
            'permisos_ids',
        ]

    def validate(self, data):
        """Validación: no permitir desactivar roles del sistema"""
        if self.instance and self.instance.is_system:
            if 'is_active' in data and not data['is_active']:
                raise serializers.ValidationError({
                    'is_active': 'No se puede desactivar un rol del sistema'
                })
        return data

    @transaction.atomic
    def update(self, instance, validated_data):
        permisos_ids = validated_data.pop('permisos_ids', None)
        request = self.context.get('request')

        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar permisos si se proporcionaron
        if permisos_ids is not None:
            # Eliminar permisos actuales
            instance.rol_adicional_permisos.all().delete()

            # Agregar nuevos permisos
            permisos = Permiso.objects.filter(id__in=permisos_ids, is_active=True)
            for permiso in permisos:
                RolAdicionalPermiso.objects.create(
                    rol_adicional=instance,
                    permiso=permiso,
                    granted_by=request.user if request else None
                )

        return instance


class UserRolAdicionalListSerializer(serializers.ModelSerializer):
    """Serializer para listar asignaciones de roles adicionales a usuarios"""

    rol_adicional_nombre = serializers.CharField(
        source='rol_adicional.nombre',
        read_only=True
    )
    rol_adicional_code = serializers.CharField(
        source='rol_adicional.code',
        read_only=True
    )
    rol_adicional_tipo = serializers.CharField(
        source='rol_adicional.tipo',
        read_only=True
    )
    user_nombre = serializers.CharField(
        source='user.get_full_name',
        read_only=True
    )
    assigned_by_nombre = serializers.CharField(
        source='assigned_by.get_full_name',
        read_only=True,
        default=None
    )
    is_expired = serializers.BooleanField(read_only=True)
    is_certification_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserRolAdicional
        fields = [
            'id', 'user', 'user_nombre',
            'rol_adicional', 'rol_adicional_nombre', 'rol_adicional_code', 'rol_adicional_tipo',
            'assigned_at', 'expires_at',
            'assigned_by', 'assigned_by_nombre',
            'justificacion',
            'certificacion_adjunta',
            'fecha_certificacion', 'certificacion_expira',
            'is_active', 'is_expired', 'is_certification_expired',
        ]


class AsignarRolAdicionalSerializer(serializers.Serializer):
    """Serializer para asignar un rol adicional a un usuario"""

    user_id = serializers.IntegerField()
    rol_adicional_id = serializers.IntegerField()
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    justificacion = serializers.CharField(required=False, allow_blank=True, default='')
    fecha_certificacion = serializers.DateField(required=False, allow_null=True)
    certificacion_expira = serializers.DateField(required=False, allow_null=True)

    def validate_user_id(self, value):
        if not User.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Usuario no encontrado o inactivo')
        return value

    def validate_rol_adicional_id(self, value):
        if not RolAdicional.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Rol adicional no encontrado o inactivo')
        return value

    def validate(self, data):
        """Validar que no exista ya la asignación activa"""
        if UserRolAdicional.objects.filter(
            user_id=data['user_id'],
            rol_adicional_id=data['rol_adicional_id'],
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                'El usuario ya tiene asignado este rol adicional'
            )

        # Validar certificación si el rol lo requiere
        rol = RolAdicional.objects.get(id=data['rol_adicional_id'])
        if rol.requiere_certificacion:
            if not data.get('fecha_certificacion'):
                raise serializers.ValidationError({
                    'fecha_certificacion': 'Este rol requiere certificación'
                })

        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')

        asignacion = UserRolAdicional.objects.create(
            user_id=validated_data['user_id'],
            rol_adicional_id=validated_data['rol_adicional_id'],
            expires_at=validated_data.get('expires_at'),
            justificacion=validated_data.get('justificacion', ''),
            fecha_certificacion=validated_data.get('fecha_certificacion'),
            certificacion_expira=validated_data.get('certificacion_expira'),
            assigned_by=request.user if request else None,
        )
        return asignacion


class RevocarRolAdicionalSerializer(serializers.Serializer):
    """Serializer para revocar un rol adicional de un usuario"""

    user_id = serializers.IntegerField()
    rol_adicional_id = serializers.IntegerField()

    def validate(self, data):
        """Validar que exista la asignación activa"""
        try:
            asignacion = UserRolAdicional.objects.get(
                user_id=data['user_id'],
                rol_adicional_id=data['rol_adicional_id'],
                is_active=True
            )
            data['asignacion'] = asignacion
        except UserRolAdicional.DoesNotExist:
            raise serializers.ValidationError(
                'El usuario no tiene asignado este rol adicional'
            )
        return data


class RolesSugeridosSerializer(serializers.Serializer):
    """Serializer para las plantillas de roles sugeridos"""

    code = serializers.CharField()
    nombre = serializers.CharField()
    descripcion = serializers.CharField()
    tipo = serializers.CharField()
    tipo_display = serializers.CharField()
    justificacion_legal = serializers.CharField(allow_blank=True, required=False)
    requiere_certificacion = serializers.BooleanField()
    certificacion_requerida = serializers.CharField(allow_blank=True, required=False)
    permisos_sugeridos = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class UserPermisosEfectivosSerializer(serializers.Serializer):
    """Serializer para obtener los permisos efectivos de un usuario"""

    user_id = serializers.IntegerField(read_only=True)
    user_nombre = serializers.CharField(read_only=True)
    cargo = serializers.CharField(read_only=True, allow_null=True)
    permisos_cargo = PermisoListSerializer(many=True, read_only=True)
    permisos_roles_adicionales = serializers.SerializerMethodField()
    permisos_roles = PermisoListSerializer(many=True, read_only=True)
    permisos_grupos = PermisoListSerializer(many=True, read_only=True)
    permisos_efectivos = PermisoListSerializer(many=True, read_only=True)
    total_permisos = serializers.IntegerField(read_only=True)

    def get_permisos_roles_adicionales(self, obj):
        """Obtiene permisos por cada rol adicional"""
        user = obj.get('user')
        if not user:
            return []

        result = []
        for asignacion in user.get_roles_adicionales_activos():
            result.append({
                'rol_code': asignacion.rol_adicional.code,
                'rol_nombre': asignacion.rol_adicional.nombre,
                'permisos': PermisoListSerializer(
                    asignacion.rol_adicional.permisos.filter(is_active=True),
                    many=True
                ).data
            })
        return result
