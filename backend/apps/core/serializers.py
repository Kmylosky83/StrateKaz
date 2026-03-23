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


class CargoDetailSerializer(CargoSerializer):
    """Serializer detallado para Cargo incluyendo campos SST."""

    epp_requeridos = serializers.JSONField(read_only=True)
    examenes_medicos = serializers.JSONField(read_only=True)
    capacitaciones_sst = serializers.JSONField(read_only=True)
    restricciones_medicas = serializers.JSONField(read_only=True)
    expuesto_riesgos = serializers.SerializerMethodField()

    class Meta(CargoSerializer.Meta):
        fields = CargoSerializer.Meta.fields + [
            'epp_requeridos',
            'examenes_medicos',
            'capacitaciones_sst',
            'restricciones_medicas',
            'expuesto_riesgos',
        ]

    def get_expuesto_riesgos(self, obj):
        """Retorna riesgos ocupacionales asociados al cargo."""
        if not hasattr(obj, 'expuesto_riesgos'):
            return []
        return [
            {
                'id': r.id,
                'code': r.code,
                'name': r.name,
                'clasificacion': r.clasificacion,
                'nivel_riesgo': r.nivel_riesgo,
            }
            for r in obj.expuesto_riesgos.all()
        ]


class UserListSerializer(serializers.ModelSerializer):
    """Serializer para listado de usuarios (campos resumidos)"""

    full_name = serializers.SerializerMethodField()
    cargo = CargoSerializer(read_only=True)
    cargo_name = serializers.CharField(source='cargo.name', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    origen = serializers.SerializerMethodField()

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
            'origen',
            'nivel_firma',
        ]

    def get_full_name(self, obj):
        """Retorna nombre completo del usuario"""
        return obj.get_full_name() or obj.username

    def get_origen(self, obj):
        """Calcula el origen del usuario basado en FKs existentes."""
        cargo_code = obj.cargo.code if obj.cargo else None
        if obj.proveedor_id_ext:
            if cargo_code == 'PROVEEDOR_PORTAL':
                return 'proveedor_portal'
            return 'proveedor_profesional'
        if obj.cliente_id_ext:
            return 'cliente_portal'
        # Check if linked to Colaborador (reverse FK)
        if hasattr(obj, '_has_colaborador'):
            return 'colaborador' if obj._has_colaborador else 'manual'
        try:
            from django.apps import apps
            Colaborador = apps.get_model('colaboradores', 'Colaborador')
            if Colaborador.objects.filter(usuario=obj).exists():
                return 'colaborador'
        except (LookupError, Exception):
            pass
        return 'manual'


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
    role_codes = serializers.SerializerMethodField()
    group_codes = serializers.SerializerMethodField()

    # Campos de contexto laboral para perfil/dropdown
    empresa_nombre = serializers.SerializerMethodField()
    area_nombre = serializers.SerializerMethodField()

    # URL de foto de perfil
    photo_url = serializers.SerializerMethodField()

    # Proveedor vinculado (para usuarios externos: consultores, auditores)
    # IntegerField directo para evitar cross-module PrimaryKeyRelatedField
    proveedor = serializers.IntegerField(source='proveedor_id_ext', read_only=True, allow_null=True)
    proveedor_nombre = serializers.SerializerMethodField()

    # Cliente vinculado (para usuarios del portal de clientes)
    cliente = serializers.IntegerField(source='cliente_id_ext', read_only=True, allow_null=True)
    cliente_nombre = serializers.SerializerMethodField()

    # Firma guardada (solo booleanos para no exponer base64 en /me)
    tiene_firma_guardada = serializers.SerializerMethodField()
    tiene_iniciales_guardadas = serializers.SerializerMethodField()

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
            'role_codes',
            'group_codes',
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
            # Firma digital
            'nivel_firma',
            'nivel_firma_manual',
            # Firma guardada
            'tiene_firma_guardada',
            'tiene_iniciales_guardadas',
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
        if not obj.proveedor_id_ext:
            return None
        try:
            from django.apps import apps
            Proveedor = apps.get_model('gestion_proveedores', 'Proveedor')
            prov = Proveedor.objects.filter(pk=obj.proveedor_id_ext).first()
            return prov.nombre_comercial if prov else None
        except LookupError:
            return None

    def get_cliente_nombre(self, obj):
        """Retorna el nombre comercial del cliente vinculado (None si no tiene)"""
        if not obj.cliente_id_ext:
            return None
        try:
            from django.apps import apps
            Cliente = apps.get_model('gestion_clientes', 'Cliente')
            cli = Cliente.objects.filter(pk=obj.cliente_id_ext).first()
            return (cli.nombre_comercial or cli.razon_social) if cli else None
        except LookupError:
            return None

    def get_tiene_firma_guardada(self, obj):
        """Indica si el usuario tiene firma guardada"""
        return bool(obj.firma_guardada)

    def get_tiene_iniciales_guardadas(self, obj):
        """Indica si el usuario tiene iniciales guardadas"""
        return bool(obj.iniciales_guardadas)

    def get_section_ids(self, obj):
        """
        Retorna IDs de secciones autorizadas (RBAC Unificado v4.0).
        Delegado a compute_user_rbac() como fuente única de verdad.
        """
        from apps.core.utils.rbac import compute_user_rbac
        section_ids, _ = compute_user_rbac(obj)
        return section_ids

    def get_permission_codes(self, obj):
        """
        Retorna códigos de permisos CRUD (RBAC Unificado v4.0).
        Formato: "modulo.seccion.accion" — Delegado a compute_user_rbac().
        """
        from apps.core.utils.rbac import compute_user_rbac
        _, permission_codes = compute_user_rbac(obj)
        return permission_codes

    def get_role_codes(self, obj):
        """
        Retorna lista de códigos de roles asignados directamente al usuario.
        Solo incluye roles activos y no expirados.
        Usado por hasRole() en el frontend.
        """
        from django.utils import timezone
        now = timezone.now()
        qs = obj.user_roles.select_related('role').filter(role__is_active=True)
        return [
            ur.role.code
            for ur in qs
            if ur.expires_at is None or ur.expires_at > now
        ]

    def get_group_codes(self, obj):
        """
        Retorna lista de códigos de grupos a los que pertenece el usuario.
        Usado por isInGroup() en el frontend.
        """
        return list(
            obj.user_groups.select_related('group').values_list('group__code', flat=True)
        )


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios.

    La contraseña es OPCIONAL (A6):
    - Si se proporciona: se usa directamente (flujo clásico).
    - Si se omite: se genera un uuid4 hex como contraseña temporal
      inutilizable y se envía email de invitación con link de setup.
    En ambos casos se llama a UserSetupFactory para generar el token
    de setup y enviar el correo de invitación al colaborador.
    """

    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={'input_type': 'password'},
        help_text='Contraseña del usuario (mínimo 8 caracteres). Opcional: si se omite se envía invitación por email.'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={'input_type': 'password'},
        help_text='Confirmación de contraseña (requerida solo si se envía password)'
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
        """Validar contraseña segura (solo si se proporciona)"""
        if not value:
            return value

        if len(value) < 8:
            raise serializers.ValidationError('La contraseña debe tener al menos 8 caracteres')

        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))

        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        password = attrs.get('password', '')
        password_confirm = attrs.pop('password_confirm', '')

        # Validar coincidencia solo cuando se proporcionó contraseña
        if password or password_confirm:
            if password != password_confirm:
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
        """Crear usuario y enviar invitación por email.

        Si no se proporciona contraseña se genera una temporal inutilizable
        y se emite el email de setup de contraseña vía UserSetupFactory.
        Si se proporciona contraseña se usa directamente (backward compatible)
        y aún así se genera token + envía invitación.
        """
        import uuid as _uuid
        import logging as _logging
        _logger = _logging.getLogger(__name__)

        password = validated_data.pop('password', None) or ''

        # Si no hay contraseña, generar una temporal inutilizable
        use_setup_flow = not bool(password)
        if not password:
            password = _uuid.uuid4().hex

        # Obtener usuario creador del contexto
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        # Crear usuario con password hasheado
        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        # Siempre generar setup token y enviar invitación (A6)
        try:
            from apps.core.utils.user_factory import UserSetupFactory

            # Generar token de setup (hashea en BD, raw va al email)
            user.set_password_setup_token()

            # Enviar email de invitación con link de setup
            cargo_name = user.cargo.name if user.cargo else ''
            UserSetupFactory.send_setup_email(
                user,
                cargo_name=cargo_name,
            )
            _logger.info(
                'A6: Setup token generado y email de invitación enviado para User #%s (%s)',
                user.pk,
                user.email,
            )
        except Exception as exc:
            # No bloquear la creación del usuario si el email falla
            _logger.error(
                'A6: Error generando setup token/enviando invitación para User #%s (%s): %s',
                user.pk,
                getattr(user, 'email', '?'),
                exc,
                exc_info=True,
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
    nivel_firma = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=3,
        help_text='Nivel de firma digital (1=Sin 2FA, 2=TOTP, 3=TOTP+Email OTP)',
    )
    nivel_firma_manual = serializers.BooleanField(
        required=False,
        help_text='Si True, nivel_firma no se auto-asigna al cambiar cargo',
    )

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
            'nivel_firma',
            'nivel_firma_manual',
        ]

    def validate_proveedor_id(self, value):
        """Valida que el proveedor exista si se proporciona un ID"""
        if value is None:
            return None
        try:
            from django.apps import apps
            Proveedor = apps.get_model('gestion_proveedores', 'Proveedor')
            Proveedor.objects.get(id=value, is_active=True)
            return value
        except LookupError:
            return value
        except Exception:
            raise serializers.ValidationError('Proveedor no encontrado o inactivo')

    def validate_email(self, value):
        """Validar email válido y único (excepto usuario actual)"""
        if not value or '@' not in value:
            raise serializers.ValidationError('Proporcione un email válido')
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
        """Actualizar usuario con soporte para proveedor_id y nivel_firma"""
        proveedor_id = validated_data.pop('proveedor_id', 'NOT_SET')

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if proveedor_id != 'NOT_SET':
            instance.proveedor_id_ext = proveedor_id
            instance.save(update_fields=['proveedor_id_ext'])

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

    modulo_code = serializers.CharField(source='modulo.code', read_only=True)
    accion_code = serializers.CharField(source='accion.code', read_only=True)
    alcance_code = serializers.CharField(source='alcance.code', read_only=True)

    class Meta:
        model = Permiso
        fields = [
            'id',
            'code',
            'name',
            'description',
            'modulo',
            'modulo_code',
            'accion',
            'accion_code',
            'alcance',
            'alcance_code',
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
