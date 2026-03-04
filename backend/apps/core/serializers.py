"""
Serializers del módulo Core - API REST
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Cargo, Permiso, CargoPermiso, CargoSectionAccess


class CargoSerializer(serializers.ModelSerializer):
    """Serializer básico para Cargo"""

    level_display = serializers.CharField(source='get_level_display', read_only=True)
    subordinados_count = serializers.SerializerMethodField()
    # Area info para mostrar en perfil/dropdown
    area_id = serializers.IntegerField(source='area.id', read_only=True)
    area_nombre = serializers.CharField(source='area.name', read_only=True)

    class Meta:
        model = Cargo
        fields = [
            'id',
            'code',
            'name',
            'description',
            'level',
            'level_display',
            'parent_cargo',
            'is_active',
            'is_jefatura',
            'is_externo',
            'subordinados_count',
            'area_id',
            'area_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_subordinados_count(self, obj):
        """Retorna la cantidad de subordinados directos"""
        return obj.subordinados.filter(is_active=True).count()


class UserListSerializer(serializers.ModelSerializer):
    """Serializer para listado de usuarios (campos resumidos)"""

    full_name = serializers.SerializerMethodField()
    cargo = CargoSerializer(read_only=True)
    cargo_name = serializers.CharField(source='cargo.name', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'cargo',
            'cargo_name',
            'document_type',
            'document_type_display',
            'document_number',
            'phone',
            'is_active',
            'date_joined',
        ]

    def get_full_name(self, obj):
        """Retorna nombre completo del usuario"""
        return obj.get_full_name() or obj.username


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo de usuario"""

    full_name = serializers.SerializerMethodField()
    cargo = CargoSerializer(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True, default=None)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    cargo_code = serializers.CharField(read_only=True, allow_null=True)
    cargo_level = serializers.IntegerField(read_only=True, allow_null=True)
    is_deleted = serializers.BooleanField(read_only=True)

    # Campos RBAC para control de acceso
    section_ids = serializers.SerializerMethodField()
    permission_codes = serializers.SerializerMethodField()

    # Campos de contexto laboral para perfil/dropdown
    empresa_nombre = serializers.SerializerMethodField()
    area_nombre = serializers.SerializerMethodField()

    # URL de foto de perfil
    photo_url = serializers.SerializerMethodField()

    # Proveedor vinculado (para usuarios externos: consultores, auditores)
    # IntegerField directo para evitar cross-module PrimaryKeyRelatedField
    proveedor = serializers.IntegerField(source='proveedor_id', read_only=True, allow_null=True)
    proveedor_nombre = serializers.SerializerMethodField()

    # Cliente vinculado (para usuarios del portal de clientes)
    cliente = serializers.IntegerField(source='cliente_id', read_only=True, allow_null=True)
    cliente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'cargo',
            'cargo_code',
            'cargo_level',
            'phone',
            'document_type',
            'document_type_display',
            'document_number',
            'is_active',
            'is_staff',
            'is_superuser',
            'is_deleted',
            'date_joined',
            'last_login',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
            'deleted_at',
            # Campos RBAC
            'section_ids',
            'permission_codes',
            # Campos de contexto laboral
            'empresa_nombre',
            'area_nombre',
            # Foto de perfil
            'photo_url',
            # Proveedor vinculado
            'proveedor',
            'proveedor_nombre',
            # Cliente vinculado
            'cliente',
            'cliente_nombre',
        ]
        read_only_fields = [
            'id',
            'date_joined',
            'last_login',
            'created_by',
            'created_at',
            'updated_at',
            'deleted_at',
        ]

    def get_full_name(self, obj):
        """Retorna nombre completo del usuario"""
        return obj.get_full_name() or obj.username

    def get_empresa_nombre(self, obj):
        """
        Retorna el nombre de la empresa desde el Tenant actual.
        NOTA: El branding (company_name) está ahora en el modelo Tenant.
        """
        request = self.context.get('request')
        if request and hasattr(request, 'tenant') and request.tenant:
            return request.tenant.name
        return None

    def get_area_nombre(self, obj):
        """Retorna el nombre del área del cargo (None si no tiene cargo o área)"""
        cargo = getattr(obj, 'cargo', None)
        if cargo and hasattr(cargo, 'area') and cargo.area:
            return cargo.area.name
        return None

    def get_photo_url(self, obj):
        """
        Retorna la URL completa de la foto de perfil
        """
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

    def get_proveedor_nombre(self, obj):
        """Retorna el nombre comercial del proveedor vinculado (None si no tiene)"""
        proveedor = getattr(obj, 'proveedor', None)
        if proveedor:
            return proveedor.nombre_comercial
        return None

    def get_cliente_nombre(self, obj):
        """Retorna el nombre comercial del cliente vinculado (None si no tiene)"""
        cliente = getattr(obj, 'cliente', None)
        if cliente:
            return cliente.nombre_comercial or cliente.razon_social
        return None

    def get_section_ids(self, obj):
        """
        Retorna IDs de secciones autorizadas por el cargo del usuario.
        - Super usuario: None (tiene acceso total, no necesita lista)
        - Usuario normal: lista de section_ids autorizados (donde can_view=True)
        """
        if obj.is_superuser:
            return None  # Super usuario no necesita filtrado

        cargo = getattr(obj, 'cargo', None)
        if not cargo:
            return []

        return list(
            CargoSectionAccess.objects.filter(cargo=cargo, can_view=True)
            .values_list('section_id', flat=True)
        )

    def get_permission_codes(self, obj):
        """
        Retorna códigos de permisos CRUD autorizados desde CargoSectionAccess.
        Sistema RBAC Unificado v4.0 - permisos integrados en acceso a secciones.

        Formato: "modulo.seccion.accion"
        Ejemplo: "gestion_estrategica.empresa.edit"

        - Super usuario: ['*'] (tiene todos los permisos)
        - Usuario normal: lista de códigos derivados de CargoSectionAccess
        """
        if obj.is_superuser:
            return ['*']  # Super usuario tiene todos los permisos

        cargo = getattr(obj, 'cargo', None)
        if not cargo:
            return []

        # Obtener accesos con sus secciones y módulos
        accesses = CargoSectionAccess.objects.filter(cargo=cargo).select_related(
            'section__tab__module'
        )

        permission_codes = []
        for access in accesses:
            section = access.section
            module_code = section.tab.module.code.lower()
            section_code = section.code.lower()

            # Generar códigos de permiso basados en las acciones habilitadas
            if access.can_view:
                permission_codes.append(f"{module_code}.{section_code}.view")
            if access.can_create:
                permission_codes.append(f"{module_code}.{section_code}.create")
            if access.can_edit:
                permission_codes.append(f"{module_code}.{section_code}.edit")
            if access.can_delete:
                permission_codes.append(f"{module_code}.{section_code}.delete")

        return permission_codes


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios"""

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Contraseña del usuario (mínimo 8 caracteres)'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Confirmación de contraseña'
    )
    cargo_id = serializers.PrimaryKeyRelatedField(
        queryset=Cargo.objects.filter(is_active=True),
        source='cargo',
        required=True,
        help_text='ID del cargo'
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'cargo_id',
            'phone',
            'document_type',
            'document_number',
            'is_active',
            'is_staff',
        ]

    def validate_username(self, value):
        """Validar username único y sin espacios"""
        if ' ' in value:
            raise serializers.ValidationError('El nombre de usuario no puede contener espacios')

        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Este nombre de usuario ya existe')

        return value

    def validate_email(self, value):
        """Validar email válido y único"""
        if not value or '@' not in value:
            raise serializers.ValidationError('Proporcione un email válido')

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Este email ya está registrado')

        return value

    def validate_document_number(self, value):
        """Validar document_number único"""
        if User.objects.filter(document_number=value).exists():
            raise serializers.ValidationError('Este número de documento ya está registrado')

        return value

    def validate_password(self, value):
        """Validar contraseña segura"""
        if len(value) < 8:
            raise serializers.ValidationError('La contraseña debe tener al menos 8 caracteres')

        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))

        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Validar que las contraseñas coincidan
        if attrs.get('password') != attrs.pop('password_confirm', None):
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden'
            })

        # Validar que el cargo existe y está activo
        cargo = attrs.get('cargo')
        if cargo and not cargo.is_active:
            raise serializers.ValidationError({
                'cargo_id': 'El cargo seleccionado no está activo'
            })

        return attrs

    def create(self, validated_data):
        """Crear usuario con password hasheado correctamente"""
        password = validated_data.pop('password')

        # Obtener usuario creador del contexto
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        # Crear usuario
        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar usuarios"""

    cargo_id = serializers.PrimaryKeyRelatedField(
        queryset=Cargo.objects.filter(is_active=True),
        source='cargo',
        required=False,
        allow_null=True,
        help_text='ID del cargo'
    )
    proveedor_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='ID del proveedor vinculado (para usuarios externos)',
    )

    def validate_proveedor_id(self, value):
        """Valida que el proveedor exista si se proporciona un ID"""
        if value is None:
            return None
        try:
            from django.apps import apps
            Proveedor = apps.get_model('gestion_proveedores', 'Proveedor')
            return Proveedor.objects.get(id=value, is_active=True)
        except Exception:
            raise serializers.ValidationError('Proveedor no encontrado o inactivo')

    def update(self, instance, validated_data):
        """Override para manejar proveedor_id → proveedor FK"""
        proveedor = validated_data.pop('proveedor_id', 'NOT_SET')
        instance = super().update(instance, validated_data)
        if proveedor != 'NOT_SET':
            # proveedor es None (desvinculado) o una instancia Proveedor
            instance.proveedor = proveedor
            instance.save(update_fields=['proveedor'])
        return instance

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'cargo_id',
            'proveedor_id',
            'is_active',
            'is_staff',
        ]

    def validate_email(self, value):
        """Validar email válido y único (excepto usuario actual)"""
        if not value or '@' not in value:
            raise serializers.ValidationError('Proporcione un email válido')

        # Verificar que no exista otro usuario con el mismo email
        user_id = self.instance.id if self.instance else None
        if User.objects.filter(email=value).exclude(id=user_id).exists():
            raise serializers.ValidationError('Este email ya está registrado')

        return value

    def validate_cargo_id(self, value):
        """Validar que el cargo está activo"""
        if value and not value.is_active:
            raise serializers.ValidationError('El cargo seleccionado no está activo')

        return value

    def update(self, instance, validated_data):
        """Actualizar usuario"""
        # Actualizar campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""

    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='Contraseña actual'
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='Nueva contraseña (mínimo 8 caracteres)'
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='Confirmación de nueva contraseña'
    )

    def validate_old_password(self, value):
        """Validar que la contraseña actual es correcta"""
        user = self.context.get('user')
        if not user or not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta')

        return value

    def validate_new_password(self, value):
        """Validar nueva contraseña segura"""
        if len(value) < 8:
            raise serializers.ValidationError('La contraseña debe tener al menos 8 caracteres')

        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))

        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Validar que las contraseñas coincidan
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({
                'confirm_password': 'Las contraseñas no coinciden'
            })

        # Validar que la nueva contraseña sea diferente a la actual
        if attrs.get('old_password') == attrs.get('new_password'):
            raise serializers.ValidationError({
                'new_password': 'La nueva contraseña debe ser diferente a la actual'
            })

        return attrs

    def save(self, **kwargs):
        """Cambiar contraseña del usuario y sincronizar a TenantUser."""
        user = self.context.get('user')
        user.set_password(self.validated_data['new_password'])
        user.save()

        # Sincronizar password al TenantUser (public schema) para que el login funcione
        from apps.core.utils import sync_password_to_tenant_user
        sync_password_to_tenant_user(user)

        return user


class PermisoSerializer(serializers.ModelSerializer):
    """Serializer para Permisos"""

    module_display = serializers.CharField(source='get_module_display', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    scope_display = serializers.CharField(source='get_scope_display', read_only=True)

    class Meta:
        model = Permiso
        fields = [
            'id',
            'code',
            'name',
            'description',
            'module',
            'module_display',
            'action',
            'action_display',
            'scope',
            'scope_display',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['created_at']


class CargoPermisoSerializer(serializers.ModelSerializer):
    """Serializer para relación Cargo-Permiso"""

    permiso = PermisoSerializer(read_only=True)
    cargo_name = serializers.CharField(source='cargo.name', read_only=True)
    granted_by_username = serializers.CharField(source='granted_by.username', read_only=True)

    class Meta:
        model = CargoPermiso
        fields = [
            'id',
            'cargo',
            'cargo_name',
            'permiso',
            'granted_at',
            'granted_by',
            'granted_by_username',
        ]
        read_only_fields = ['granted_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para JWT con payload mínimo (P0-04)

    SEGURIDAD: El payload del token SOLO contiene datos mínimos:
    - user_id (standard JWT)
    - exp (expiration)
    - iat (issued at)
    - jti (JWT ID para blacklist)
    - is_superuser (para verificaciones de admin)

    La información detallada del usuario se devuelve en la respuesta HTTP,
    NO en el payload del token (evita exposición de datos personales en base64).
    """

    @classmethod
    def get_token(cls, user):
        # P0-04: Payload mínimo - Solo datos esenciales para autenticación
        token = super().get_token(user)
        # Solo is_superuser para verificaciones rápidas (no es dato personal sensible)
        token['is_superuser'] = user.is_superuser
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # La información del usuario va en la respuesta HTTP (no en el token)
        # Esto permite al frontend tener los datos sin exponerlos en el JWT
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email or '',
            'full_name': self.user.get_full_name() or self.user.username,
            'cargo_code': self.user.cargo.code if self.user.cargo else None,
            'cargo_name': self.user.cargo.name if self.user.cargo else None,
            'cargo_level': self.user.cargo.level if self.user.cargo else None,
            'is_superuser': self.user.is_superuser,
            'is_staff': self.user.is_staff,
        }

        return data


class UserPhotoUploadSerializer(serializers.Serializer):
    """Serializer para carga de foto de perfil"""

    photo = serializers.ImageField(
        required=True,
        help_text='Foto de perfil del usuario (JPG, PNG, WebP - Máx. 2MB)'
    )

    def validate_photo(self, value):
        """Validar formato y tamaño de imagen"""
        # Validar tamaño máximo (2MB)
        if value.size > 2 * 1024 * 1024:  # 2MB en bytes
            raise serializers.ValidationError(
                'El tamaño de la imagen no debe superar 2MB'
            )

        # Validar formato
        allowed_formats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if value.content_type not in allowed_formats:
            raise serializers.ValidationError(
                'Formato de imagen no válido. Use JPG, PNG o WebP'
            )

        return value

    def save(self, user):
        """Guardar foto de perfil del usuario"""
        # Eliminar foto anterior si existe
        if user.photo:
            try:
                user.photo.delete(save=False)
            except Exception:
                pass  # Ignorar errores al eliminar foto anterior

        # Guardar nueva foto
        user.photo = self.validated_data['photo']
        user.save(update_fields=['photo'])
        return user


class LogoutSerializer(serializers.Serializer):
    """
    Serializer para logout (P0-03) - Invalida el refresh token
    MS-002-A: También invalida la sesión de usuario asociada
    """
    refresh = serializers.CharField(
        help_text="Refresh token a invalidar"
    )

    def validate_refresh(self, value):
        """Valida que el token sea un refresh token válido"""
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError
        try:
            self.token = RefreshToken(value)
            # Guardar el valor original para invalidar la sesión
            self._refresh_token_value = value
        except TokenError as e:
            raise serializers.ValidationError(str(e))
        return value

    def save(self, **kwargs):
        """Agrega el token a la blacklist y cierra la sesión de usuario"""
        import logging
        from apps.core.models import UserSession

        logger = logging.getLogger('security')

        # MS-002-A: Invalidar la sesión de usuario
        try:
            if hasattr(self, '_refresh_token_value'):
                invalidated = UserSession.invalidate_by_token(self._refresh_token_value)
                if invalidated:
                    logger.info("MS-002-A: Sesión de usuario invalidada en logout")
        except Exception as e:
            # No fallar el logout si hay error en la sesión
            logger.warning(f"MS-002-A: Error invalidando sesión en logout: {e}")

        # Agregar token a blacklist
        self.token.blacklist()


# =============================================================================
# USER PREFERENCES SERIALIZER (MS-003)
# =============================================================================

class UserPreferencesSerializer(serializers.ModelSerializer):
    """
    Serializer para preferencias de usuario.

    Maneja la configuración personal del usuario:
    - Idioma de interfaz
    - Zona horaria
    - Formato de fecha
    """

    # Read-only fields para mostrar valores legibles
    language_display = serializers.CharField(read_only=True)
    date_format_display = serializers.CharField(read_only=True)

    class Meta:
        from apps.core.models import UserPreferences
        model = UserPreferences
        fields = [
            'language',
            'language_display',
            'timezone',
            'date_format',
            'date_format_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_language(self, value):
        """Valida que el idioma esté en las opciones permitidas."""
        from apps.core.models import UserPreferences
        valid_languages = [choice[0] for choice in UserPreferences.LANGUAGE_CHOICES]
        if value not in valid_languages:
            raise serializers.ValidationError(
                f"Idioma inválido. Opciones válidas: {', '.join(valid_languages)}"
            )
        return value

    def validate_date_format(self, value):
        """Valida que el formato de fecha esté en las opciones permitidas."""
        from apps.core.models import UserPreferences
        valid_formats = [choice[0] for choice in UserPreferences.DATE_FORMAT_CHOICES]
        if value not in valid_formats:
            raise serializers.ValidationError(
                f"Formato de fecha inválido. Opciones válidas: {', '.join(valid_formats)}"
            )
        return value

    def validate_timezone(self, value):
        """Valida que la zona horaria sea válida."""
        import pytz
        try:
            pytz.timezone(value)
        except pytz.exceptions.UnknownTimeZoneError:
            raise serializers.ValidationError(
                f"Zona horaria inválida: {value}"
            )
        return value
