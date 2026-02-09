"""
Serializers para Configuración del Sistema (Tab 4)
Sistema de Gestión StrateKaz

Este módulo contiene SOLO serializers que usan modelos de core,
sin dependencias de otras apps. Esto permite que core funcione
de forma independiente en el sistema modular.

Incluye:
- SystemModule serializers
- ModuleTab serializers
- TabSection serializers

NOTA: BrandingConfig serializers fueron ELIMINADOS - el branding se maneja ahora
directamente en el modelo Tenant (apps.tenant.serializers)
"""
from rest_framework import serializers
from django.db import transaction

# Solo modelos de core (sin dependencias externas)
from .models import (
    SystemModule, ModuleTab, TabSection
)


# =============================================================================
# SYSTEM MODULE SERIALIZERS
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
    is_enabled = serializers.BooleanField(
        help_text='True para activar, False para desactivar'
    )


# =============================================================================
# TAB SECTION SERIALIZERS
# =============================================================================

class TabSectionSerializer(serializers.ModelSerializer):
    """Serializer para Secciones de Tabs"""
    tab_name = serializers.CharField(source='tab.name', read_only=True)
    module_name = serializers.CharField(source='tab.module.name', read_only=True)
    can_disable = serializers.SerializerMethodField()

    class Meta:
        model = TabSection
        fields = [
            'id', 'tab', 'tab_name', 'module_name',
            'code', 'name', 'description', 'icon', 'orden',
            'supported_actions',
            'is_enabled', 'is_core', 'can_disable',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_can_disable(self, obj):
        can_disable, reason = obj.can_disable()
        return {'can_disable': can_disable, 'reason': reason}


class TabSectionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Secciones de Tabs"""

    class Meta:
        model = TabSection
        fields = ['tab', 'code', 'name', 'description', 'icon', 'orden', 'is_enabled', 'is_core']


class ToggleSectionSerializer(serializers.Serializer):
    """Serializer para activar/desactivar sección"""
    is_enabled = serializers.BooleanField(required=True)


# =============================================================================
# MODULE TAB SERIALIZERS
# =============================================================================

class ModuleTabSerializer(serializers.ModelSerializer):
    """Serializer para Tabs de Módulos"""
    module_name = serializers.CharField(source='module.name', read_only=True)
    sections = TabSectionSerializer(many=True, read_only=True)
    section_count = serializers.SerializerMethodField()
    enabled_section_count = serializers.SerializerMethodField()
    can_disable = serializers.SerializerMethodField()

    class Meta:
        model = ModuleTab
        fields = [
            'id', 'module', 'module_name',
            'code', 'name', 'description', 'icon', 'route', 'orden',
            'is_enabled', 'is_core', 'can_disable',
            'sections', 'section_count', 'enabled_section_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_section_count(self, obj):
        return obj.get_section_count()

    def get_enabled_section_count(self, obj):
        return obj.get_enabled_section_count()

    def get_can_disable(self, obj):
        can_disable, reason = obj.can_disable()
        return {'can_disable': can_disable, 'reason': reason}


class ModuleTabCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Tabs de Módulos"""

    class Meta:
        model = ModuleTab
        fields = ['module', 'code', 'name', 'description', 'icon', 'orden', 'is_enabled', 'is_core']


class ToggleTabSerializer(serializers.Serializer):
    """Serializer para activar/desactivar tab"""
    is_enabled = serializers.BooleanField(required=True)


# =============================================================================
# TREE / SIDEBAR SERIALIZERS
# =============================================================================

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
            'id', 'code', 'name', 'description', 'icon', 'color', 'route',
            'category', 'category_display', 'orden',
            'is_enabled', 'is_core', 'requires_license', 'license_expires_at',
            'can_disable',
            'tabs', 'enabled_tabs_count', 'total_tabs_count'
        ]

    def get_color(self, obj):
        return obj.get_effective_color()

    def get_enabled_tabs_count(self, obj):
        return obj.get_enabled_tab_count()

    def get_total_tabs_count(self, obj):
        return obj.get_tab_count()

    def get_can_disable(self, obj):
        can_disable, reason = obj.can_disable()
        return {'can_disable': can_disable, 'reason': reason}


class SidebarModuleSerializer(serializers.Serializer):
    """Serializer para módulos del Sidebar con estructura jerárquica

    Las rutas se obtienen del campo `route` de los modelos SystemModule y ModuleTab.
    Si el campo route es null, se genera automaticamente a partir del code.
    Esto permite definir rutas personalizadas en la BD para mayor mantenibilidad.
    """
    code = serializers.CharField()
    name = serializers.CharField()
    icon = serializers.CharField(allow_null=True)
    color = serializers.CharField(allow_null=True)
    route = serializers.SerializerMethodField()
    is_category = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    def _generate_route_from_code(self, code: str) -> str:
        """Genera ruta a partir del code si no hay route definida"""
        return f"/{code.lower().replace('_', '-')}"

    def get_route(self, obj):
        if isinstance(obj, dict):
            return None
        # Usar route del modelo si existe, sino generar desde code
        if hasattr(obj, 'route') and obj.route:
            return obj.route if obj.route.startswith('/') else f"/{obj.route}"
        return self._generate_route_from_code(obj.code)

    def get_is_category(self, obj):
        return isinstance(obj, dict)

    def get_children(self, obj):
        if isinstance(obj, dict):
            modules = obj.get('modules', [])
            return SidebarModuleSerializer(modules, many=True).data

        tabs = obj.get_enabled_tabs() if hasattr(obj, 'get_enabled_tabs') else []
        if not tabs:
            return None

        # Obtener ruta base del modulo
        module_route = self.get_route(obj)

        children = []
        for tab in tabs:
            # Usar route del tab si existe, sino generar desde code
            if tab.route:
                tab_route = tab.route if tab.route.startswith('/') else f"/{tab.route}"
                # Si tab_route es ruta absoluta, usarla directamente
                if tab_route.startswith('/'):
                    full_route = f"{module_route}{tab_route}" if not tab.route.startswith('/') else f"{module_route}/{tab.route}"
                else:
                    full_route = f"{module_route}/{tab.route}"
            else:
                # Generar desde code
                tab_slug = tab.code.lower().replace('_', '-')
                full_route = f"{module_route}/{tab_slug}"

            child = {
                'code': tab.code,
                'name': tab.name,
                'icon': tab.icon,
                'color': obj.color if hasattr(obj, 'color') else None,
                'route': full_route,
                'is_category': False,
                'children': None
            }
            children.append(child)

        return children if children else None
