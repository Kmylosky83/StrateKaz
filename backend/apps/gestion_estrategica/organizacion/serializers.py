"""
Serializers para el módulo de Organización
"""
from rest_framework import serializers
from .models import Area, OrganigramaNodePosition, CaracterizacionProceso


class AreaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Area"""
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    children_count = serializers.IntegerField(read_only=True)
    full_path = serializers.CharField(read_only=True)
    level = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Area
        fields = [
            'id',
            'code',
            'name',
            'description',
            'parent',
            'parent_name',
            'cost_center',
            'manager',
            'manager_name',
            'icon',
            'color',
            'is_active',
            'orden',
            'children_count',
            'full_path',
            'level',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def create(self, validated_data):
        """Asigna el usuario que crea el área"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AreaTreeSerializer(serializers.ModelSerializer):
    """Serializer para árbol jerárquico de áreas"""
    children = serializers.SerializerMethodField()
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)

    class Meta:
        model = Area
        fields = [
            'id',
            'code',
            'name',
            'description',
            'cost_center',
            'manager',
            'manager_name',
            'icon',
            'color',
            'is_active',
            'orden',
            'children',
        ]

    def get_children(self, obj):
        """Obtiene las subáreas recursivamente"""
        children = obj.children.filter(is_active=True).order_by('orden', 'name')
        return AreaTreeSerializer(children, many=True).data


class AreaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas"""
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)

    class Meta:
        model = Area
        fields = ['id', 'code', 'name', 'parent', 'parent_name', 'manager', 'manager_name', 'icon', 'color', 'is_active']


class OrganigramaNodePositionSerializer(serializers.ModelSerializer):
    """Serializer para posiciones de nodos del organigrama"""

    class Meta:
        model = OrganigramaNodePosition
        fields = ['node_type', 'node_id', 'view_mode', 'direction', 'x', 'y']


# ==============================================================================
# CARACTERIZACIÓN DE PROCESOS
# ==============================================================================


class CaracterizacionProcesoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de caracterizaciones"""
    area_name = serializers.CharField(source='area.name', read_only=True)
    area_code = serializers.CharField(source='area.code', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    lider_proceso_nombre = serializers.CharField(
        source='lider_proceso.get_full_name', read_only=True, default=None
    )
    objetivo_resumen = serializers.SerializerMethodField()

    class Meta:
        model = CaracterizacionProceso
        fields = [
            'id', 'area', 'area_name', 'area_code',
            'estado', 'estado_display',
            'objetivo_resumen', 'lider_proceso', 'lider_proceso_nombre',
            'version', 'is_active',
            'created_at', 'updated_at',
        ]

    def get_objetivo_resumen(self, obj):
        """Primeros 120 caracteres del objetivo"""
        if obj.objetivo:
            return obj.objetivo[:120] + ('...' if len(obj.objetivo) > 120 else '')
        return ''


class CaracterizacionProcesoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle/creación/edición"""
    area_name = serializers.CharField(source='area.name', read_only=True)
    area_code = serializers.CharField(source='area.code', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    lider_proceso_nombre = serializers.CharField(
        source='lider_proceso.get_full_name', read_only=True, default=None
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name', read_only=True, default=None
    )

    class Meta:
        model = CaracterizacionProceso
        fields = [
            'id', 'area', 'area_name', 'area_code',
            'version', 'estado', 'estado_display',
            'objetivo', 'alcance',
            'lider_proceso', 'lider_proceso_nombre',
            # SIPOC
            'proveedores', 'entradas', 'actividades_clave', 'salidas', 'clientes',
            # Recursos y referencias
            'recursos', 'indicadores_vinculados', 'riesgos_asociados',
            'documentos_referencia', 'requisitos_normativos',
            'observaciones',
            # Audit
            'is_active', 'created_at', 'updated_at',
            'created_by', 'created_by_nombre',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
