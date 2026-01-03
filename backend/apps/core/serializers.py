"""
Serializers del módulo Core - API REST
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Cargo, Permiso, CargoPermiso


class CargoSerializer(serializers.ModelSerializer):
    """Serializer básico para Cargo"""

    level_display = serializers.CharField(source='get_level_display', read_only=True)
    subordinados_count = serializers.SerializerMethodField()

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
            'subordinados_count',
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
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    cargo_level = serializers.IntegerField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

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

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'cargo_id',
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
        """Cambiar contraseña del usuario"""
        user = self.context.get('user')
        user.set_password(self.validated_data['new_password'])
        user.save()
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
    Serializer personalizado para JWT que incluye información del usuario en el token

    Agrega al payload del token:
    - username
    - email
    - cargo_code
    - cargo_name
    - full_name
    - is_superuser
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Agregar información personalizada al token
        token['username'] = user.username
        token['email'] = user.email or ''
        token['full_name'] = user.get_full_name() or user.username
        token['is_superuser'] = user.is_superuser

        # Agregar información del cargo
        if user.cargo:
            token['cargo_code'] = user.cargo.code
            token['cargo_name'] = user.cargo.name
            token['cargo_level'] = user.cargo.level
        else:
            token['cargo_code'] = None
            token['cargo_name'] = None
            token['cargo_level'] = None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Agregar información adicional en la respuesta
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
