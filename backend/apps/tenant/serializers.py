"""
Serializers para Multi-Tenant System (django-tenants)
"""
from rest_framework import serializers
from django.db import transaction
from .models import Tenant, Domain, TenantUser, TenantUserAccess, Plan


class PlanSerializer(serializers.ModelSerializer):
    """Serializer para Plan de suscripción"""

    class Meta:
        model = Plan
        fields = [
            'id', 'code', 'name', 'description',
            'max_users', 'max_storage_gb',
            'price_monthly', 'price_yearly',
            'features', 'is_active', 'is_default',
        ]
        read_only_fields = ['id']


class DomainSerializer(serializers.ModelSerializer):
    """Serializer para Domain (django-tenants)"""

    class Meta:
        model = Domain
        fields = ['id', 'domain', 'is_primary', 'is_active', 'ssl_enabled', 'created_at']
        read_only_fields = ['id', 'created_at']


class TenantSerializer(serializers.ModelSerializer):
    """
    Serializer completo para Tenant.
    Incluye todos los campos de configuración y branding.
    """

    plan_name = serializers.CharField(source='plan.name', read_only=True, allow_null=True)
    is_subscription_valid = serializers.BooleanField(read_only=True)
    effective_max_users = serializers.IntegerField(read_only=True)
    effective_modules = serializers.ListField(read_only=True)
    domains = DomainSerializer(many=True, read_only=True)
    subdomain = serializers.SerializerMethodField()
    primary_domain = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            # Identificación
            'id', 'schema_name', 'code', 'name', 'nit',
            'subdomain', 'primary_domain',
            # Plan y límites
            'plan', 'plan_name',
            'max_users', 'max_storage_gb', 'tier', 'enabled_modules',
            'effective_max_users', 'effective_modules',
            # Estado
            'is_active', 'is_trial', 'trial_ends_at', 'subscription_ends_at',
            'is_subscription_valid',
            'schema_status', 'schema_task_id', 'schema_error',
            # Datos fiscales
            'razon_social', 'nombre_comercial', 'representante_legal',
            'cedula_representante', 'tipo_sociedad', 'actividad_economica',
            'descripcion_actividad', 'regimen_tributario',
            # Contacto
            'direccion_fiscal', 'ciudad', 'departamento', 'pais',
            'codigo_postal', 'telefono_principal', 'telefono_secundario',
            'email_corporativo', 'sitio_web',
            # Registro
            'matricula_mercantil', 'camara_comercio',
            'fecha_constitucion', 'fecha_inscripcion_registro',
            # Configuración regional
            'zona_horaria', 'formato_fecha', 'moneda',
            'simbolo_moneda', 'separador_miles', 'separador_decimales',
            # Branding
            'company_slogan', 'logo', 'logo_white', 'logo_dark',
            'favicon', 'login_background',
            'primary_color', 'secondary_color', 'accent_color',
            'sidebar_color', 'background_color', 'showcase_background',
            'gradient_mission', 'gradient_vision', 'gradient_policy', 'gradient_values',
            # PWA
            'pwa_name', 'pwa_short_name', 'pwa_description',
            'pwa_theme_color', 'pwa_background_color',
            'pwa_icon_192', 'pwa_icon_512', 'pwa_icon_maskable',
            # Notas internas
            'notes',
            # Backup
            'backup_enabled', 'backup_retention_days',
            # Legacy (deprecated)
            'logo_url',
            # Relaciones
            'domains',
            # Auditoria
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'schema_name', 'created_at', 'updated_at']

    def get_subdomain(self, obj):
        """Extraer subdominio del dominio primario."""
        domain = obj.domains.filter(is_primary=True).first()
        if domain:
            return domain.domain.split('.')[0] if domain.domain else None
        return None

    def get_primary_domain(self, obj):
        """Obtener el dominio primario completo."""
        domain = obj.domains.filter(is_primary=True).first()
        return domain.domain if domain else None


class TenantMinimalSerializer(serializers.ModelSerializer):
    """
    Serializer mínimo para Tenant (usado en listas, selección y respuesta de login).
    Incluye datos esenciales para identificación y branding básico.
    """
    primary_domain = serializers.SerializerMethodField()
    subdomain = serializers.SerializerMethodField()
    plan_name = serializers.CharField(source='plan.name', read_only=True, allow_null=True)
    is_subscription_valid = serializers.BooleanField(read_only=True)
    logo_effective = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    db_name = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            'id', 'code', 'name',
            'subdomain', 'primary_domain',
            'nit', 'tier', 'plan', 'plan_name',
            'max_users', 'max_storage_gb',
            'is_active', 'is_trial', 'is_subscription_valid',
            'schema_status', 'subscription_ends_at',
            'user_count', 'db_name',
            # Branding básico
            'logo', 'logo_url', 'logo_effective',
            'primary_color', 'secondary_color', 'accent_color',
            'company_slogan', 'nombre_comercial',
            'enabled_modules',
        ]

    def get_primary_domain(self, obj):
        domain = obj.domains.filter(is_primary=True).first()
        return domain.domain if domain else None

    def get_subdomain(self, obj):
        """Extraer subdominio del dominio primario."""
        domain = obj.domains.filter(is_primary=True).first()
        if domain:
            return domain.domain.split('.')[0] if domain.domain else None
        return None

    def get_logo_effective(self, obj):
        """Retorna el logo efectivo como URL absoluta (nuevo campo o URL legacy)."""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return obj.logo_url or None

    def get_user_count(self, obj):
        """Contar usuarios del tenant via query cross-schema."""
        try:
            from django.db import connection
            if obj.schema_name and obj.schema_status == 'ready':
                with connection.cursor() as cursor:
                    cursor.execute(
                        'SELECT COUNT(*) FROM "%s".core_user' % obj.schema_name
                    )
                    return cursor.fetchone()[0]
        except Exception:
            pass
        return 0

    def get_db_name(self, obj):
        """Retorna el schema_name como db_name para el frontend."""
        return obj.schema_name


class TenantCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear Tenant con dominio (creación asíncrona).

    Incluye:
    - Validación de dominio único
    - Transacción atómica para garantizar consistencia
    - Encolamiento de tarea Celery para crear el schema

    FLUJO:
    1. Crea el registro del Tenant (sin schema)
    2. Crea el dominio asociado
    3. Encola la tarea Celery para crear el schema
    4. Retorna inmediatamente con task_id para seguimiento

    El frontend puede consultar el progreso via:
    - GET /api/tenant/tenants/{id}/creation-status/
    - WebSocket en canal tenant_progress:{task_id}
    """
    domain = serializers.CharField(write_only=True)
    # Campos de solo lectura que se retornan después de crear
    task_id = serializers.CharField(read_only=True)
    schema_status = serializers.CharField(read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'code', 'name', 'nit', 'plan',
            'max_users', 'max_storage_gb', 'tier',
            'enabled_modules',  # Módulos habilitados para este tenant
            'logo_url', 'primary_color',
            'domain',
            # Read-only fields retornados después de crear
            'task_id', 'schema_status',
        ]

    def validate_code(self, value):
        """
        Validar formato y unicidad del codigo del tenant.
        Debe empezar con letra, contener solo minusculas/numeros/guion bajo,
        y no existir en la base de datos.
        """
        import re
        if not re.match(r'^[a-z][a-z0-9_]*$', value):
            raise serializers.ValidationError(
                "El codigo debe empezar con letra y contener solo letras minusculas, "
                "numeros y guiones bajos."
            )
        # Verificar que el code no exista
        if Tenant.objects.filter(code=value).exists():
            raise serializers.ValidationError(
                f"Ya existe una empresa con el codigo '{value}'. "
                "Usa un codigo diferente."
            )
        # Verificar que el schema_name no exista
        schema_name = f'tenant_{value}'
        if Tenant.objects.filter(schema_name=schema_name).exists():
            raise serializers.ValidationError(
                f"Ya existe un schema '{schema_name}'. "
                "Usa un codigo diferente."
            )
        return value

    def validate_domain(self, value):
        """Validar que el dominio no exista."""
        if Domain.objects.filter(domain=value).exists():
            raise serializers.ValidationError("Este dominio ya está en uso.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        """
        Crear tenant y dominio, luego encolar tarea para crear schema.

        El schema se crea de forma asíncrona para no bloquear la UI.

        IMPORTANTE: django-tenants solo permite crear Tenant/Domain desde
        el schema 'public'. Como esta request puede llegar desde un dominio
        de tenant (ej: app.stratekaz.com → tenant_stratekaz), usamos
        schema_context('public') para forzar el schema correcto.
        """
        from django_tenants.utils import schema_context
        from apps.tenant.tasks import create_tenant_schema_task

        domain_name = validated_data.pop('domain')

        # Forzar schema public para crear Tenant y Domain
        # (django-tenants exige que sean creados en public)
        with schema_context('public'):
            # Crear tenant con estado 'pending' (sin schema aún)
            tenant = Tenant.objects.create(
                **validated_data,
                schema_status='pending'
            )

            # Crear dominio primario
            Domain.objects.create(
                domain=domain_name,
                tenant=tenant,
                is_primary=True
            )

        # Encolar tarea Celery para crear el schema
        # Obtener el user que está creando (si existe)
        request = self.context.get('request')
        created_by_id = None
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            created_by_id = request.user.id

        # Lanzar tarea asíncrona
        task = create_tenant_schema_task.delay(
            tenant_id=tenant.id,
            created_by_id=created_by_id
        )

        # Actualizar tenant con el task_id (también en public)
        with schema_context('public'):
            tenant.schema_task_id = task.id
            tenant.schema_status = 'creating'
            tenant.save(update_fields=['schema_task_id', 'schema_status'])

        # Agregar task_id al objeto para el serializer de respuesta
        tenant.task_id = task.id

        return tenant

    def to_representation(self, instance):
        """Agregar task_id a la respuesta."""
        data = super().to_representation(instance)
        # Agregar task_id si está disponible
        if hasattr(instance, 'task_id'):
            data['task_id'] = instance.task_id
        elif instance.schema_task_id:
            data['task_id'] = instance.schema_task_id
        return data


class TenantUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar Tenant.

    Excluye campos inmutables como code y schema_name.
    Incluye todos los campos de configuración y branding.
    Soporta eliminación de imágenes via campos *_clear.
    """

    # Campos para marcar eliminación de imágenes
    logo_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    logo_white_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    logo_dark_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    favicon_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    login_background_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    pwa_icon_192_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    pwa_icon_512_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    pwa_icon_maskable_clear = serializers.BooleanField(write_only=True, required=False, default=False)

    # Override campos que deben aceptar null/empty desde el frontend
    enabled_modules = serializers.JSONField(required=False, allow_null=True, default=list)
    nit = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')

    class Meta:
        model = Tenant
        fields = [
            # Identificación
            'name', 'nit',
            # Plan y límites
            'plan', 'max_users', 'max_storage_gb', 'tier', 'enabled_modules',
            # Estado
            'is_active', 'is_trial', 'trial_ends_at', 'subscription_ends_at',
            # Datos fiscales
            'razon_social', 'nombre_comercial', 'representante_legal',
            'cedula_representante', 'tipo_sociedad', 'actividad_economica',
            'descripcion_actividad', 'regimen_tributario',
            # Contacto
            'direccion_fiscal', 'ciudad', 'departamento', 'pais',
            'codigo_postal', 'telefono_principal', 'telefono_secundario',
            'email_corporativo', 'sitio_web',
            # Registro
            'matricula_mercantil', 'camara_comercio',
            'fecha_constitucion', 'fecha_inscripcion_registro',
            # Configuración regional
            'zona_horaria', 'formato_fecha', 'moneda',
            'simbolo_moneda', 'separador_miles', 'separador_decimales',
            # Branding
            'company_slogan', 'logo', 'logo_white', 'logo_dark',
            'favicon', 'login_background',
            'primary_color', 'secondary_color', 'accent_color',
            'sidebar_color', 'background_color', 'showcase_background',
            'gradient_mission', 'gradient_vision', 'gradient_policy', 'gradient_values',
            # PWA
            'pwa_name', 'pwa_short_name', 'pwa_description',
            'pwa_theme_color', 'pwa_background_color',
            'pwa_icon_192', 'pwa_icon_512', 'pwa_icon_maskable',
            # Notas internas
            'notes',
            # Backup
            'backup_enabled', 'backup_retention_days',
            # Legacy (deprecated)
            'logo_url',
            # Campos de eliminacion de imagenes
            'logo_clear', 'logo_white_clear', 'logo_dark_clear',
            'favicon_clear', 'login_background_clear',
            'pwa_icon_192_clear', 'pwa_icon_512_clear', 'pwa_icon_maskable_clear',
        ]

    # Campos de fecha que aceptan null - convertir empty string antes de validar
    NULLABLE_DATE_FIELDS = [
        'trial_ends_at', 'subscription_ends_at',
        'fecha_constitucion', 'fecha_inscripcion_registro',
    ]

    def to_internal_value(self, data):
        """Convertir empty strings a None para campos de fecha/hora antes de validar."""
        # Convertir QueryDict a dict mutable para limpieza
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        for field in self.NULLABLE_DATE_FIELDS:
            if field in mutable_data and mutable_data[field] in ('', 'null', 'None'):
                mutable_data[field] = None
        return super().to_internal_value(mutable_data)

    def validate_plan(self, value):
        """Permitir null para plan."""
        return value

    def validate_nit(self, value):
        """Convertir None a string vacío para nit."""
        return value if value else ''

    def validate_enabled_modules(self, value):
        """Convertir None a lista vacía para enabled_modules."""
        if value is None:
            return []
        if isinstance(value, str):
            import json
            try:
                value = json.loads(value)
            except (json.JSONDecodeError, ValueError):
                raise serializers.ValidationError(
                    "enabled_modules debe ser una lista JSON válida"
                )
        if not isinstance(value, list):
            raise serializers.ValidationError("enabled_modules debe ser una lista")
        return value

    def validate_trial_ends_at(self, value):
        """Permitir null para trial_ends_at."""
        return value

    def validate_subscription_ends_at(self, value):
        """Permitir null para subscription_ends_at."""
        return value

    def update(self, instance, validated_data):
        """
        Actualiza el tenant, manejando la eliminación de imágenes.
        """
        # Campos de imagen y sus flags de clear
        image_clear_fields = {
            'logo': validated_data.pop('logo_clear', False),
            'logo_white': validated_data.pop('logo_white_clear', False),
            'logo_dark': validated_data.pop('logo_dark_clear', False),
            'favicon': validated_data.pop('favicon_clear', False),
            'login_background': validated_data.pop('login_background_clear', False),
            'pwa_icon_192': validated_data.pop('pwa_icon_192_clear', False),
            'pwa_icon_512': validated_data.pop('pwa_icon_512_clear', False),
            'pwa_icon_maskable': validated_data.pop('pwa_icon_maskable_clear', False),
        }

        # Eliminar imágenes marcadas para clear
        for field_name, should_clear in image_clear_fields.items():
            if should_clear:
                # Eliminar el archivo si existe
                image_field = getattr(instance, field_name)
                if image_field:
                    image_field.delete(save=False)
                setattr(instance, field_name, None)

        # Actualizar el resto de campos normalmente
        return super().update(instance, validated_data)


class TenantSelfEditSerializer(serializers.ModelSerializer):
    """
    Serializer para que el Admin Tenant edite datos de su propia empresa.

    EXCLUYE campos peligrosos que solo el SuperAdmin puede modificar:
    plan, max_users, max_storage_gb, tier, enabled_modules,
    is_active, is_trial, trial_ends_at, subscription_ends_at, backup_*.
    """

    # Campos para marcar eliminación de imágenes
    logo_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    logo_white_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    logo_dark_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    favicon_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    login_background_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    pwa_icon_192_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    pwa_icon_512_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    pwa_icon_maskable_clear = serializers.BooleanField(write_only=True, required=False, default=False)

    nit = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')

    class Meta:
        model = Tenant
        fields = [
            # Identificación (solo name editable, code/schema inmutables)
            'name', 'nit',
            # Datos fiscales
            'razon_social', 'nombre_comercial', 'representante_legal',
            'cedula_representante', 'tipo_sociedad', 'actividad_economica',
            'descripcion_actividad', 'regimen_tributario',
            # Contacto
            'direccion_fiscal', 'ciudad', 'departamento', 'pais',
            'codigo_postal', 'telefono_principal', 'telefono_secundario',
            'email_corporativo', 'sitio_web',
            # Registro
            'matricula_mercantil', 'camara_comercio',
            'fecha_constitucion', 'fecha_inscripcion_registro',
            # Configuración regional
            'zona_horaria', 'formato_fecha', 'moneda',
            'simbolo_moneda', 'separador_miles', 'separador_decimales',
            # Branding
            'company_slogan', 'logo', 'logo_white', 'logo_dark',
            'favicon', 'login_background',
            'primary_color', 'secondary_color', 'accent_color',
            'sidebar_color', 'background_color', 'showcase_background',
            'gradient_mission', 'gradient_vision', 'gradient_policy', 'gradient_values',
            # PWA
            'pwa_name', 'pwa_short_name', 'pwa_description',
            'pwa_theme_color', 'pwa_background_color',
            'pwa_icon_192', 'pwa_icon_512', 'pwa_icon_maskable',
            # Legacy
            'logo_url',
            # Campos de eliminación de imágenes
            'logo_clear', 'logo_white_clear', 'logo_dark_clear',
            'favicon_clear', 'login_background_clear',
            'pwa_icon_192_clear', 'pwa_icon_512_clear', 'pwa_icon_maskable_clear',
        ]

    def validate_nit(self, value):
        """Convertir None a string vacío para nit."""
        return value if value else ''

    def update(self, instance, validated_data):
        """Actualiza el tenant, manejando la eliminación de imágenes."""
        image_clear_fields = {
            'logo': validated_data.pop('logo_clear', False),
            'logo_white': validated_data.pop('logo_white_clear', False),
            'logo_dark': validated_data.pop('logo_dark_clear', False),
            'favicon': validated_data.pop('favicon_clear', False),
            'login_background': validated_data.pop('login_background_clear', False),
            'pwa_icon_192': validated_data.pop('pwa_icon_192_clear', False),
            'pwa_icon_512': validated_data.pop('pwa_icon_512_clear', False),
            'pwa_icon_maskable': validated_data.pop('pwa_icon_maskable_clear', False),
        }

        for field_name, should_clear in image_clear_fields.items():
            if should_clear:
                image_field = getattr(instance, field_name)
                if image_field:
                    image_field.delete(save=False)
                setattr(instance, field_name, None)

        return super().update(instance, validated_data)


class TenantBrandingSerializer(serializers.ModelSerializer):
    """
    Serializer específico para branding público.
    Usado en el endpoint público de branding por dominio.
    """

    class Meta:
        model = Tenant
        fields = [
            'name', 'nombre_comercial', 'company_slogan',
            'logo', 'logo_white', 'logo_dark', 'favicon', 'login_background',
            'primary_color', 'secondary_color', 'accent_color',
            'sidebar_color', 'background_color', 'showcase_background',
            'gradient_mission', 'gradient_vision', 'gradient_policy', 'gradient_values',
            'pwa_name', 'pwa_short_name', 'pwa_description',
            'pwa_theme_color', 'pwa_background_color',
            'pwa_icon_192', 'pwa_icon_512', 'pwa_icon_maskable',
            # Legacy
            'logo_url',
        ]
        read_only_fields = fields  # Todos son de solo lectura

    def to_representation(self, instance):
        """
        Transforma URLs de archivos a URLs completas.
        Agrega campos calculados para PWA.
        """
        data = super().to_representation(instance)
        request = self.context.get('request')

        # Campos de imagen
        image_fields = [
            'logo', 'logo_white', 'logo_dark', 'favicon', 'login_background',
            'pwa_icon_192', 'pwa_icon_512', 'pwa_icon_maskable'
        ]

        for field in image_fields:
            if data.get(field) and request:
                data[field] = request.build_absolute_uri(data[field])

        # Valores por defecto para PWA
        data['pwa_name'] = data['pwa_name'] or data['name']
        data['pwa_short_name'] = data['pwa_short_name'] or data.get('nombre_comercial') or data['name'][:12]
        data['pwa_theme_color'] = data['pwa_theme_color'] or data['primary_color']

        # Alias para compatibilidad con frontend existente
        data['company_name'] = data['name']
        data['company_short_name'] = data.get('nombre_comercial') or data['name']

        return data


class TenantUserAccessSerializer(serializers.ModelSerializer):
    """Serializer para acceso de usuario a tenant"""
    tenant = TenantMinimalSerializer(read_only=True)

    class Meta:
        model = TenantUserAccess
        fields = ['tenant', 'is_active', 'granted_at']


class TenantUserSerializer(serializers.ModelSerializer):
    """Serializer para TenantUser"""
    # Usamos 'accesses' como alias para el frontend
    accesses = TenantUserAccessSerializer(source='tenant_accesses', many=True, read_only=True)
    tenant_count = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = TenantUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'is_active', 'is_superadmin',
            'last_login', 'last_tenant',
            'accesses', 'tenant_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'last_login', 'created_at', 'updated_at']

    def get_tenant_count(self, obj):
        return obj.tenants.count()


class TenantUserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear TenantUser con asignación opcional de tenants.

    Permite crear el usuario y asignarle acceso a tenants en una sola operación.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    tenant_assignments = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        default=list,
        help_text='Lista de {"tenant_id": int, "role": str} para asignar al crear'
    )

    class Meta:
        model = TenantUser
        fields = [
            'email', 'password', 'first_name', 'last_name',
            'is_active', 'is_superadmin', 'tenant_assignments',
        ]

    def validate_tenant_assignments(self, value):
        """Validar que los tenants existan."""
        for assignment in value:
            tenant_id = assignment.get('tenant_id')
            if tenant_id:
                if not Tenant.objects.filter(id=tenant_id).exists():
                    raise serializers.ValidationError(
                        f"Tenant con ID {tenant_id} no existe."
                    )
        return value

    @transaction.atomic
    def create(self, validated_data):
        """
        Crear usuario y asignar tenants en una transacción atómica.
        """
        password = validated_data.pop('password')
        tenant_assignments = validated_data.pop('tenant_assignments', [])

        # Crear usuario
        user = TenantUser(**validated_data)
        user.set_password(password)
        user.save()

        # Asignar tenants si se proporcionaron
        for assignment in tenant_assignments:
            tenant_id = assignment.get('tenant_id')

            if tenant_id:
                tenant = Tenant.objects.get(id=tenant_id)
                TenantUserAccess.objects.create(
                    tenant_user=user,
                    tenant=tenant,
                    is_active=True
                )

        return user


class TenantUserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar TenantUser con sincronización de accesos a tenants.

    Procesa tenant_assignments para hacer sync completo:
    - Nuevos tenant_ids -> crear TenantUserAccess
    - tenant_ids removidos -> desactivar TenantUserAccess
    - Existentes -> mantener sin cambios
    """
    password = serializers.CharField(
        write_only=True, min_length=8, required=False, allow_blank=True
    )
    tenant_assignments = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = TenantUser
        fields = [
            'first_name', 'last_name',
            'is_active', 'is_superadmin',
            'password', 'tenant_assignments',
        ]

    def validate_tenant_assignments(self, value):
        """Validar que los tenants existan."""
        for assignment in value:
            tenant_id = assignment.get('tenant_id')
            if tenant_id and not Tenant.objects.filter(id=tenant_id).exists():
                raise serializers.ValidationError(
                    f"Tenant con ID {tenant_id} no existe."
                )
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        tenant_assignments = validated_data.pop('tenant_assignments', None)

        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Actualizar password si se proporcionó
        if password:
            instance.set_password(password)

        instance.save()

        # Sincronizar accesos a tenants (solo si se envió el campo)
        if tenant_assignments is not None:
            desired_ids = {
                a['tenant_id'] for a in tenant_assignments if a.get('tenant_id')
            }
            current_accesses = TenantUserAccess.objects.filter(tenant_user=instance)
            current_ids = set(current_accesses.values_list('tenant_id', flat=True))

            # Revocar accesos que ya no están en la lista
            to_revoke = current_ids - desired_ids
            if to_revoke:
                current_accesses.filter(tenant_id__in=to_revoke).delete()

            # Crear accesos nuevos
            to_grant = desired_ids - current_ids
            for tenant_id in to_grant:
                TenantUserAccess.objects.create(
                    tenant_user=instance,
                    tenant_id=tenant_id,
                    role='user',
                    is_active=True,
                )

            # Reactivar accesos que existían pero estaban inactivos
            current_accesses.filter(
                tenant_id__in=desired_ids, is_active=False
            ).update(is_active=True)

        return instance


class UserTenantsSerializer(serializers.ModelSerializer):
    """
    Serializer para obtener los tenants de un usuario.
    Usado en el endpoint /tenant/users/me/
    """
    tenants = serializers.SerializerMethodField()

    class Meta:
        model = TenantUser
        fields = ['id', 'email', 'first_name', 'last_name', 'last_tenant', 'tenants']

    def get_tenants(self, obj):
        accesses = obj.tenant_accesses.filter(
            is_active=True,
            tenant__is_active=True
        ).select_related('tenant')

        return [
            {
                'tenant': TenantMinimalSerializer(access.tenant, context=self.context).data,
            }
            for access in accesses
        ]
