"""
Serializers para el Módulo de Dirección Estratégica
Sistema de Gestión StrateKaz

Este módulo contiene los serializers para:
- Tab 1: Identidad Corporativa (Misión, Visión, Valores, Política Integral)
- Tab 2: Planeación Estratégica (Mapa Estratégico, Objetivos BSC/ISO)
- Tab 4: Configuración (Módulos, Branding, Consecutivos)
"""
from rest_framework import serializers
from django.db import transaction

# Modelos de core (RBAC, Configuración del Sistema)
from .models import (
    SystemModule, ModuleTab, TabSection,
    BrandingConfig,
    User, Cargo
)

# Modelos movidos a sus respectivas apps (TAB = Django App)
from apps.gestion_estrategica.identidad.models import CorporateIdentity, CorporateValue
from apps.gestion_estrategica.planeacion.models import StrategicPlan, StrategicObjective


# =============================================================================
# TAB 1: IDENTIDAD CORPORATIVA
# =============================================================================

class CorporateValueSerializer(serializers.ModelSerializer):
    """Serializer para Valores Corporativos"""

    class Meta:
        model = CorporateValue
        fields = [
            'id', 'name', 'description', 'icon', 'orden',
            'is_active', 'created_at'
        ]
        read_only_fields = ['created_at']


class CorporateValueCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Valores Corporativos"""

    class Meta:
        model = CorporateValue
        fields = ['name', 'description', 'icon', 'orden', 'is_active']


class CorporateIdentityListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Identidades Corporativas"""

    values_count = serializers.SerializerMethodField()
    is_signed = serializers.BooleanField(read_only=True)
    signed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CorporateIdentity
        fields = [
            'id', 'version', 'effective_date', 'is_active',
            'is_signed', 'signed_by_name', 'values_count',
            'created_at', 'updated_at'
        ]

    def get_values_count(self, obj):
        return obj.values.filter(is_active=True).count()

    def get_signed_by_name(self, obj):
        if obj.policy_signed_by:
            return obj.policy_signed_by.get_full_name() or obj.policy_signed_by.username
        return None


class CorporateIdentityDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de Identidad Corporativa"""

    values = CorporateValueSerializer(many=True, read_only=True)
    is_signed = serializers.BooleanField(read_only=True)
    signed_by_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CorporateIdentity
        fields = [
            'id', 'mission', 'vision', 'integral_policy',
            'policy_signed_by', 'policy_signed_at', 'policy_signature_hash',
            'is_signed', 'signed_by_name',
            'effective_date', 'version', 'is_active',
            'values', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]

    def get_signed_by_name(self, obj):
        if obj.policy_signed_by:
            return obj.policy_signed_by.get_full_name() or obj.policy_signed_by.username
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class CorporateIdentityCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Identidad Corporativa"""

    values = CorporateValueCreateSerializer(many=True, required=False)

    class Meta:
        model = CorporateIdentity
        fields = [
            'mission', 'vision', 'integral_policy',
            'effective_date', 'version', 'is_active', 'values'
        ]

    @transaction.atomic
    def create(self, validated_data):
        values_data = validated_data.pop('values', [])
        user = self.context['request'].user if 'request' in self.context else None

        identity = CorporateIdentity.objects.create(
            **validated_data,
            created_by=user
        )

        for idx, value_data in enumerate(values_data):
            CorporateValue.objects.create(
                identity=identity,
                orden=value_data.get('orden', idx),
                **value_data
            )

        return identity


class CorporateIdentityUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar Identidad Corporativa"""

    values = CorporateValueCreateSerializer(many=True, required=False)

    class Meta:
        model = CorporateIdentity
        fields = [
            'mission', 'vision', 'integral_policy',
            'effective_date', 'version', 'is_active', 'values'
        ]

    @transaction.atomic
    def update(self, instance, validated_data):
        values_data = validated_data.pop('values', None)

        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si se proporcionaron valores, reemplazar
        if values_data is not None:
            instance.values.all().delete()
            for idx, value_data in enumerate(values_data):
                CorporateValue.objects.create(
                    identity=instance,
                    orden=value_data.get('orden', idx),
                    **value_data
                )

        return instance


class SignPolicySerializer(serializers.Serializer):
    """Serializer para firmar la Política Integral"""

    confirm = serializers.BooleanField(
        help_text='Confirmar la firma digital de la política'
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError('Debe confirmar la firma')
        return value


# =============================================================================
# TAB 2: PLANEACIÓN ESTRATÉGICA
# =============================================================================

class StrategicObjectiveListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Objetivos Estratégicos"""

    bsc_perspective_display = serializers.CharField(
        source='get_bsc_perspective_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    responsible_name = serializers.SerializerMethodField()
    iso_standards_display = serializers.SerializerMethodField()

    class Meta:
        model = StrategicObjective
        fields = [
            'id', 'code', 'name', 'bsc_perspective', 'bsc_perspective_display',
            'iso_standards', 'iso_standards_display',
            'progress', 'status', 'status_display',
            'target_value', 'current_value', 'unit',
            'responsible', 'responsible_name',
            'start_date', 'due_date', 'orden'
        ]

    def get_responsible_name(self, obj):
        if obj.responsible:
            return obj.responsible.get_full_name() or obj.responsible.username
        return None

    def get_iso_standards_display(self, obj):
        if not obj.iso_standards:
            return []
        choices_dict = dict(StrategicObjective.ISO_STANDARD_CHOICES)
        return [choices_dict.get(std, std) for std in obj.iso_standards]


class StrategicObjectiveDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de Objetivo Estratégico"""

    bsc_perspective_display = serializers.CharField(
        source='get_bsc_perspective_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    responsible_name = serializers.SerializerMethodField()
    responsible_cargo_name = serializers.SerializerMethodField()
    iso_standards_display = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StrategicObjective
        fields = [
            'id', 'plan', 'code', 'name', 'description',
            'bsc_perspective', 'bsc_perspective_display',
            'iso_standards', 'iso_standards_display',
            'responsible', 'responsible_name',
            'responsible_cargo', 'responsible_cargo_name',
            'target_value', 'current_value', 'unit',
            'progress', 'status', 'status_display',
            'start_date', 'due_date', 'completed_at',
            'orden', 'is_active',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]

    def get_responsible_name(self, obj):
        if obj.responsible:
            return obj.responsible.get_full_name() or obj.responsible.username
        return None

    def get_responsible_cargo_name(self, obj):
        if obj.responsible_cargo:
            return obj.responsible_cargo.name
        return None

    def get_iso_standards_display(self, obj):
        if not obj.iso_standards:
            return []
        choices_dict = dict(StrategicObjective.ISO_STANDARD_CHOICES)
        return [choices_dict.get(std, std) for std in obj.iso_standards]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class StrategicObjectiveCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Objetivo Estratégico"""

    class Meta:
        model = StrategicObjective
        fields = [
            'plan', 'code', 'name', 'description',
            'bsc_perspective', 'iso_standards',
            'responsible', 'responsible_cargo',
            'target_value', 'current_value', 'unit',
            'start_date', 'due_date', 'orden', 'is_active'
        ]

    def validate_code(self, value):
        plan = self.initial_data.get('plan')
        if plan and StrategicObjective.objects.filter(plan_id=plan, code=value).exists():
            raise serializers.ValidationError('Este código ya existe en el plan')
        return value

    def create(self, validated_data):
        user = self.context['request'].user if 'request' in self.context else None
        return StrategicObjective.objects.create(**validated_data, created_by=user)


class StrategicObjectiveUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar Objetivo Estratégico"""

    class Meta:
        model = StrategicObjective
        fields = [
            'name', 'description', 'bsc_perspective', 'iso_standards',
            'responsible', 'responsible_cargo',
            'target_value', 'current_value', 'unit',
            'progress', 'status',
            'start_date', 'due_date', 'orden', 'is_active'
        ]


class StrategicPlanListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Planes Estratégicos"""

    period_type_display = serializers.CharField(
        source='get_period_type_display', read_only=True
    )
    objectives_count = serializers.SerializerMethodField()
    progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = StrategicPlan
        fields = [
            'id', 'name', 'period_type', 'period_type_display',
            'start_date', 'end_date', 'is_active',
            'objectives_count', 'progress',
            'approved_by', 'approved_at',
            'created_at', 'updated_at'
        ]

    def get_objectives_count(self, obj):
        return obj.objectives.filter(is_active=True).count()


class StrategicPlanDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de Plan Estratégico"""

    period_type_display = serializers.CharField(
        source='get_period_type_display', read_only=True
    )
    objectives = StrategicObjectiveListSerializer(many=True, read_only=True)
    objectives_count = serializers.SerializerMethodField()
    progress = serializers.IntegerField(read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    bsc_summary = serializers.SerializerMethodField()

    class Meta:
        model = StrategicPlan
        fields = [
            'id', 'name', 'description',
            'period_type', 'period_type_display',
            'start_date', 'end_date',
            'strategic_map_image', 'strategic_map_description',
            'is_active', 'objectives', 'objectives_count', 'progress',
            'bsc_summary',
            'approved_by', 'approved_by_name', 'approved_at',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]

    def get_objectives_count(self, obj):
        return obj.objectives.filter(is_active=True).count()

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_bsc_summary(self, obj):
        """Resumen por perspectiva BSC"""
        objectives = obj.objectives.filter(is_active=True)
        summary = {}
        for code, label in StrategicObjective.BSC_PERSPECTIVE_CHOICES:
            perspective_objs = objectives.filter(bsc_perspective=code)
            total = perspective_objs.count()
            completed = perspective_objs.filter(status='COMPLETADO').count()
            avg_progress = perspective_objs.values_list('progress', flat=True)
            avg = sum(avg_progress) / len(avg_progress) if avg_progress else 0
            summary[code] = {
                'label': label,
                'total': total,
                'completed': completed,
                'avg_progress': round(avg, 1)
            }
        return summary


class StrategicPlanCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Plan Estratégico"""

    class Meta:
        model = StrategicPlan
        fields = [
            'name', 'description', 'period_type',
            'start_date', 'end_date',
            'strategic_map_image', 'strategic_map_description',
            'is_active'
        ]

    def validate(self, attrs):
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['start_date'] >= attrs['end_date']:
                raise serializers.ValidationError(
                    {'end_date': 'La fecha de fin debe ser posterior a la de inicio'}
                )
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user if 'request' in self.context else None
        return StrategicPlan.objects.create(**validated_data, created_by=user)


class StrategicPlanUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar Plan Estratégico"""

    class Meta:
        model = StrategicPlan
        fields = [
            'name', 'description', 'period_type',
            'start_date', 'end_date',
            'strategic_map_image', 'strategic_map_description',
            'is_active'
        ]


class ApprovePlanSerializer(serializers.Serializer):
    """Serializer para aprobar Plan Estratégico"""

    confirm = serializers.BooleanField(
        help_text='Confirmar la aprobación del plan'
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError('Debe confirmar la aprobación')
        return value


# =============================================================================
# TAB 4: CONFIGURACIÓN
# =============================================================================

class SystemModuleListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Módulos del Sistema"""

    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )
    dependencies_count = serializers.SerializerMethodField()
    dependents_count = serializers.SerializerMethodField()

    class Meta:
        model = SystemModule
        fields = [
            'id', 'code', 'name', 'description',
            'category', 'category_display', 'icon',
            'is_core', 'is_enabled',
            'requires_license', 'license_expires_at',
            'dependencies_count', 'dependents_count',
            'orden'
        ]

    def get_dependencies_count(self, obj):
        return obj.dependencies.count()

    def get_dependents_count(self, obj):
        return obj.dependents.count()


class SystemModuleDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de Módulo del Sistema"""

    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )
    dependencies = SystemModuleListSerializer(many=True, read_only=True)
    dependents = SystemModuleListSerializer(many=True, read_only=True)
    can_disable_info = serializers.SerializerMethodField()

    class Meta:
        model = SystemModule
        fields = [
            'id', 'code', 'name', 'description',
            'category', 'category_display', 'icon',
            'is_core', 'is_enabled',
            'requires_license', 'license_expires_at',
            'dependencies', 'dependents', 'can_disable_info',
            'orden', 'created_at', 'updated_at'
        ]

    def get_can_disable_info(self, obj):
        can_disable, reason = obj.can_disable()
        return {'can_disable': can_disable, 'reason': reason}


class SystemModuleCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Módulo del Sistema"""

    dependency_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='IDs de módulos de los que depende'
    )

    class Meta:
        model = SystemModule
        fields = [
            'code', 'name', 'description', 'category', 'icon',
            'is_core', 'is_enabled', 'requires_license',
            'license_expires_at', 'orden', 'dependency_ids'
        ]

    def validate_code(self, value):
        if SystemModule.objects.filter(code=value).exists():
            raise serializers.ValidationError('Este código ya existe')
        return value

    @transaction.atomic
    def create(self, validated_data):
        dependency_ids = validated_data.pop('dependency_ids', [])
        module = SystemModule.objects.create(**validated_data)

        if dependency_ids:
            dependencies = SystemModule.objects.filter(id__in=dependency_ids)
            module.dependencies.set(dependencies)

        return module


class SystemModuleUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar Módulo del Sistema"""

    dependency_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = SystemModule
        fields = [
            'name', 'description', 'category', 'icon',
            'is_enabled', 'requires_license',
            'license_expires_at', 'orden', 'dependency_ids'
        ]

    @transaction.atomic
    def update(self, instance, validated_data):
        dependency_ids = validated_data.pop('dependency_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if dependency_ids is not None:
            dependencies = SystemModule.objects.filter(id__in=dependency_ids)
            instance.dependencies.set(dependencies)

        return instance


class ToggleModuleSerializer(serializers.Serializer):
    """Serializer para activar/desactivar módulo"""

    enable = serializers.BooleanField(
        help_text='True para activar, False para desactivar'
    )


class BrandingConfigSerializer(serializers.ModelSerializer):
    """Serializer para Configuración de Branding"""

    logo = serializers.SerializerMethodField()
    logo_white = serializers.SerializerMethodField()
    favicon = serializers.SerializerMethodField()
    login_background = serializers.SerializerMethodField()

    class Meta:
        model = BrandingConfig
        fields = [
            'id', 'company_name', 'company_short_name', 'company_slogan',
            'logo', 'logo_white', 'favicon', 'login_background',
            'primary_color', 'secondary_color', 'accent_color',
            'app_version', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def _build_absolute_url(self, file_field):
        """Construye URL absoluta para archivos de media"""
        if not file_field:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(file_field.url)
        return file_field.url

    def get_logo(self, obj):
        return self._build_absolute_url(obj.logo)

    def get_logo_white(self, obj):
        return self._build_absolute_url(obj.logo_white)

    def get_favicon(self, obj):
        return self._build_absolute_url(obj.favicon)

    def get_login_background(self, obj):
        return self._build_absolute_url(obj.login_background)


class BrandingConfigCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Configuración de Branding"""

    class Meta:
        model = BrandingConfig
        fields = [
            'company_name', 'company_short_name', 'company_slogan',
            'logo', 'logo_white', 'favicon', 'login_background',
            'primary_color', 'secondary_color', 'accent_color',
            'app_version', 'is_active'
        ]

    def validate_primary_color(self, value):
        if value and not value.startswith('#'):
            raise serializers.ValidationError('El color debe estar en formato HEX (#RRGGBB)')
        return value

    def validate_secondary_color(self, value):
        if value and not value.startswith('#'):
            raise serializers.ValidationError('El color debe estar en formato HEX (#RRGGBB)')
        return value

    def validate_accent_color(self, value):
        if value and not value.startswith('#'):
            raise serializers.ValidationError('El color debe estar en formato HEX (#RRGGBB)')
        return value


class BrandingConfigUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar Configuración de Branding

    Soporta campos *_clear para eliminar archivos existentes:
    - logo_clear: 'true' para eliminar el logo principal
    - logo_white_clear: 'true' para eliminar el logo blanco
    - favicon_clear: 'true' para eliminar el favicon
    """

    # Campos write_only para indicar eliminación de archivos
    logo_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    logo_white_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    favicon_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    login_background_clear = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = BrandingConfig
        fields = [
            'company_name', 'company_short_name', 'company_slogan',
            'logo', 'logo_white', 'favicon', 'login_background',
            'logo_clear', 'logo_white_clear', 'favicon_clear', 'login_background_clear',
            'primary_color', 'secondary_color', 'accent_color',
            'app_version', 'is_active'
        ]
        extra_kwargs = {
            'logo': {'required': False},
            'logo_white': {'required': False},
            'favicon': {'required': False},
            'login_background': {'required': False},
        }

    def validate_primary_color(self, value):
        if value and not value.startswith('#'):
            raise serializers.ValidationError('El color debe estar en formato HEX (#RRGGBB)')
        return value

    def validate_secondary_color(self, value):
        if value and not value.startswith('#'):
            raise serializers.ValidationError('El color debe estar en formato HEX (#RRGGBB)')
        return value

    def validate_accent_color(self, value):
        if value and not value.startswith('#'):
            raise serializers.ValidationError('El color debe estar en formato HEX (#RRGGBB)')
        return value

    def update(self, instance, validated_data):
        # Extraer campos clear
        logo_clear = validated_data.pop('logo_clear', False)
        logo_white_clear = validated_data.pop('logo_white_clear', False)
        favicon_clear = validated_data.pop('favicon_clear', False)
        login_background_clear = validated_data.pop('login_background_clear', False)

        # Eliminar archivos si se solicitó
        if logo_clear and instance.logo:
            instance.logo.delete(save=False)
            instance.logo = None

        if logo_white_clear and instance.logo_white:
            instance.logo_white.delete(save=False)
            instance.logo_white = None

        if favicon_clear and instance.favicon:
            instance.favicon.delete(save=False)
            instance.favicon = None

        if login_background_clear and instance.login_background:
            instance.login_background.delete(save=False)
            instance.login_background = None

        # Actualizar campos restantes
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


# NOTA: Los serializers de Consecutivo fueron migrados a:
# apps.gestion_estrategica.organizacion.serializers
# Los consecutivos ahora están disponibles en /api/organizacion/consecutivos/


# =============================================================================
# SERIALIZERS PARA SISTEMA DINÁMICO DE MÓDULOS
# =============================================================================

class TabSectionSerializer(serializers.ModelSerializer):
    """Serializer para secciones de un tab"""
    can_disable = serializers.SerializerMethodField()

    class Meta:
        model = TabSection
        fields = [
            'id', 'code', 'name', 'description', 'icon',
            'orden', 'is_enabled', 'is_core', 'can_disable'
        ]

    def get_can_disable(self, obj):
        return obj.can_disable()


class ModuleTabSerializer(serializers.ModelSerializer):
    """Serializer para tabs de un módulo"""
    sections = TabSectionSerializer(many=True, read_only=True)
    enabled_sections_count = serializers.SerializerMethodField()
    total_sections_count = serializers.SerializerMethodField()
    can_disable = serializers.SerializerMethodField()

    class Meta:
        model = ModuleTab
        fields = [
            'id', 'code', 'name', 'description', 'icon', 'orden',
            'is_enabled', 'is_core', 'can_disable',
            'sections', 'enabled_sections_count', 'total_sections_count'
        ]

    def get_enabled_sections_count(self, obj):
        return obj.get_enabled_section_count()

    def get_total_sections_count(self, obj):
        return obj.get_section_count()

    def get_can_disable(self, obj):
        return obj.can_disable()


class SystemModuleTreeSerializer(serializers.ModelSerializer):
    """Serializer para módulos con árbol completo (tabs y secciones)"""
    tabs = ModuleTabSerializer(many=True, read_only=True)
    enabled_tabs_count = serializers.SerializerMethodField()
    total_tabs_count = serializers.SerializerMethodField()
    can_disable = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    color = serializers.SerializerMethodField()

    class Meta:
        model = SystemModule
        fields = [
            'id', 'code', 'name', 'description', 'icon', 'color',
            'category', 'category_display', 'orden',
            'is_enabled', 'is_core', 'requires_license', 'license_expires_at',
            'can_disable',
            'tabs', 'enabled_tabs_count', 'total_tabs_count'
        ]

    def get_color(self, obj):
        """Retorna color efectivo (asignado o por categoría)"""
        return obj.get_effective_color()

    def get_enabled_tabs_count(self, obj):
        return obj.get_enabled_tab_count()

    def get_total_tabs_count(self, obj):
        return obj.get_tab_count()

    def get_can_disable(self, obj):
        return obj.can_disable()


class ModulesTreeSerializer(serializers.Serializer):
    """Serializer para el árbol completo de módulos"""
    modules = SystemModuleTreeSerializer(many=True)
    total_modules = serializers.IntegerField()
    enabled_modules = serializers.IntegerField()
    categories = serializers.ListField(child=serializers.DictField())


class ToggleTabSerializer(serializers.Serializer):
    """Serializer para activar/desactivar un tab"""
    is_enabled = serializers.BooleanField()


class ToggleSectionSerializer(serializers.Serializer):
    """Serializer para activar/desactivar una sección"""
    is_enabled = serializers.BooleanField()


# Serializers compactos para el Sidebar (sin anidar todo)
# =============================================================================
# TABS Y SECCIONES DE MÓDULOS
# =============================================================================

class TabSectionSerializer(serializers.ModelSerializer):
    """Serializer para Secciones de Tabs"""
    tab_name = serializers.CharField(source='tab.name', read_only=True)
    module_name = serializers.CharField(source='tab.module.name', read_only=True)

    class Meta:
        model = TabSection
        fields = [
            'id', 'tab', 'tab_name', 'module_name',
            'code', 'name', 'description', 'icon', 'orden',
            'is_enabled', 'is_core', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TabSectionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Secciones de Tabs"""

    class Meta:
        model = TabSection
        fields = ['tab', 'code', 'name', 'description', 'icon', 'orden', 'is_enabled', 'is_core']


class ToggleSectionSerializer(serializers.Serializer):
    """Serializer para activar/desactivar sección"""
    is_enabled = serializers.BooleanField(required=True)


class ModuleTabSerializer(serializers.ModelSerializer):
    """Serializer para Tabs de Módulos"""
    module_name = serializers.CharField(source='module.name', read_only=True)
    sections = TabSectionSerializer(many=True, read_only=True)
    section_count = serializers.SerializerMethodField()
    enabled_section_count = serializers.SerializerMethodField()

    class Meta:
        model = ModuleTab
        fields = [
            'id', 'module', 'module_name',
            'code', 'name', 'description', 'icon', 'orden',
            'is_enabled', 'is_core',
            'sections', 'section_count', 'enabled_section_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_section_count(self, obj):
        return obj.get_section_count()

    def get_enabled_section_count(self, obj):
        return obj.get_enabled_section_count()


class ModuleTabCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Tabs de Módulos"""

    class Meta:
        model = ModuleTab
        fields = ['module', 'code', 'name', 'description', 'icon', 'orden', 'is_enabled', 'is_core']


class ToggleTabSerializer(serializers.Serializer):
    """Serializer para activar/desactivar tab"""
    is_enabled = serializers.BooleanField(required=True)


class SidebarSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TabSection
        fields = ['code', 'name', 'icon', 'is_enabled']


class SidebarTabSerializer(serializers.ModelSerializer):
    sections = SidebarSectionSerializer(many=True, source='get_enabled_sections')

    class Meta:
        model = ModuleTab
        fields = ['code', 'name', 'icon', 'sections']


class SidebarModuleSerializer(serializers.Serializer):
    """
    Serializer para módulos del Sidebar con estructura jerárquica.

    Devuelve la estructura que espera el frontend:
    {
        code: string,
        name: string,
        icon: string,
        color?: string,
        route?: string,
        is_category: boolean,
        children?: SidebarModule[]
    }
    """
    code = serializers.CharField()
    name = serializers.CharField()
    icon = serializers.CharField(allow_null=True)
    color = serializers.CharField(allow_null=True)
    route = serializers.SerializerMethodField()
    is_category = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    def get_route(self, obj):
        """
        Genera la ruta del módulo basada en su código.
        Las categorías (6 niveles) no tienen ruta.
        """
        if isinstance(obj, dict):
            # Es una categoría
            return None
        # Es un módulo
        return f"/{obj.code.lower().replace('_', '-')}"

    def get_is_category(self, obj):
        """
        Determina si es una categoría o un módulo navegable.
        Las 6 categorías (ESTRATEGICO, MOTOR, INTEGRAL, MISIONAL, APOYO, INTELIGENCIA)
        son grupos que contienen módulos.
        """
        return isinstance(obj, dict)

    def get_children(self, obj):
        """
        Obtiene los hijos del elemento.
        - Si es categoría: retorna los módulos de esa categoría
        - Si es módulo: retorna los tabs habilitados como hijos
        """
        if isinstance(obj, dict):
            # Es una categoría, los hijos son los módulos
            modules = obj.get('modules', [])
            return SidebarModuleSerializer(modules, many=True).data

        # Es un módulo, los hijos son los tabs habilitados
        tabs = obj.get_enabled_tabs() if hasattr(obj, 'get_enabled_tabs') else []
        if not tabs:
            return None

        # Convertir tabs a estructura de navegación
        children = []
        for tab in tabs:
            child = {
                'code': tab.code,
                'name': tab.name,
                'icon': tab.icon,
                'color': obj.color,
                'route': f"/{obj.code.lower().replace('_', '-')}/{tab.code.lower().replace('_', '-')}",
                'is_category': False,
                'children': None
            }
            children.append(child)

        return children if children else None


class ModulesTreeSerializer(serializers.Serializer):
    """Serializer para árbol completo de módulos"""
    modules = SystemModuleDetailSerializer(many=True)
    total_modules = serializers.IntegerField()
    enabled_modules = serializers.IntegerField()
    categories = serializers.ListField(
        child=serializers.DictField()
    )


# =============================================================================
# ESTADÍSTICAS DE GESTIÓN ESTRATÉGICA
# =============================================================================

class StrategicStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de Dirección Estratégica"""

    # Identidad
    has_active_identity = serializers.BooleanField()
    identity_is_signed = serializers.BooleanField()
    values_count = serializers.IntegerField()

    # Planeación
    active_plan_name = serializers.CharField(allow_null=True)
    total_objectives = serializers.IntegerField()
    completed_objectives = serializers.IntegerField()
    in_progress_objectives = serializers.IntegerField()
    avg_progress = serializers.FloatField()

    # Configuración
    enabled_modules = serializers.IntegerField()
    total_modules = serializers.IntegerField()
    configured_consecutivos = serializers.IntegerField()
