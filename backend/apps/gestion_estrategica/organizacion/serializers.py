"""
Serializers para el módulo de Organización

Actualizado para soportar CategoriaDocumento dinámico.
"""
from rest_framework import serializers
from .models import Area, CategoriaDocumento, TipoDocumento, ConsecutivoConfig


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

    class Meta:
        model = Area
        fields = ['id', 'code', 'name', 'parent', 'parent_name', 'is_active']


# =============================================================================
# CATEGORÍA DOCUMENTO SERIALIZERS (NUEVO - DINÁMICO)
# =============================================================================

class CategoriaDocumentoSerializer(serializers.ModelSerializer):
    """Serializer completo para CategoriaDocumento"""
    puede_eliminar = serializers.SerializerMethodField()
    tipos_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CategoriaDocumento
        fields = [
            'id', 'code', 'name', 'description',
            'color', 'icon',
            'is_system', 'is_active', 'orden',
            'tipos_count', 'puede_eliminar',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_puede_eliminar(self, obj):
        """Retorna objeto con puede y motivo"""
        puede, mensaje = obj.puede_eliminar()
        return {'puede': puede, 'motivo': mensaje}


class CategoriaDocumentoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas y selects"""
    tipos_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CategoriaDocumento
        fields = ['id', 'code', 'name', 'color', 'icon', 'is_system', 'is_active', 'orden', 'tipos_count']


class CategoriaDocumentoChoicesSerializer(serializers.Serializer):
    """Serializer para opciones de categorías en dropdowns"""
    categorias = serializers.SerializerMethodField()

    def get_categorias(self, obj):
        """Retorna categorías activas para selects"""
        categorias = CategoriaDocumento.objects.filter(is_active=True).order_by('orden', 'name')
        return [
            {
                'value': c.id,
                'label': c.name,
                'code': c.code,
                'color': c.color,
                'icon': c.icon
            }
            for c in categorias
        ]


# =============================================================================
# TIPO DOCUMENTO SERIALIZERS (ACTUALIZADO PARA FK)
# =============================================================================

class TipoDocumentoSerializer(serializers.ModelSerializer):
    """Serializer completo para TipoDocumento"""
    # Campos de la categoría relacionada
    categoria_code = serializers.CharField(source='categoria.code', read_only=True)
    categoria_name = serializers.CharField(source='categoria.name', read_only=True)
    categoria_color = serializers.CharField(source='categoria.color', read_only=True)
    categoria_icon = serializers.CharField(source='categoria.icon', read_only=True)

    tiene_consecutivo = serializers.BooleanField(read_only=True)
    puede_eliminar = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = TipoDocumento
        fields = [
            'id', 'code', 'name',
            'categoria', 'categoria_code', 'categoria_name', 'categoria_color', 'categoria_icon',
            'description', 'prefijo_sugerido', 'is_system', 'is_active', 'orden',
            'tiene_consecutivo', 'puede_eliminar',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_puede_eliminar(self, obj):
        """Retorna objeto con puede y motivo"""
        puede, mensaje = obj.puede_eliminar()
        return {'puede': puede, 'motivo': mensaje}

    def create(self, validated_data):
        """Asigna el usuario que crea el tipo"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TipoDocumentoListSerializer(serializers.ModelSerializer):
    """Serializer para listas de tipos de documento (con campos para tabla)"""
    categoria_code = serializers.CharField(source='categoria.code', read_only=True)
    categoria_name = serializers.CharField(source='categoria.name', read_only=True)
    categoria_color = serializers.CharField(source='categoria.color', read_only=True)
    tiene_consecutivo = serializers.BooleanField(read_only=True)
    puede_eliminar = serializers.SerializerMethodField()

    class Meta:
        model = TipoDocumento
        fields = [
            'id', 'code', 'name', 'description',
            'categoria', 'categoria_code', 'categoria_name', 'categoria_color',
            'prefijo_sugerido', 'is_system', 'is_active', 'tiene_consecutivo', 'puede_eliminar'
        ]

    def get_puede_eliminar(self, obj):
        """Retorna objeto con puede y motivo"""
        puede, mensaje = obj.puede_eliminar()
        return {'puede': puede, 'motivo': mensaje}


class TipoDocumentoChoicesSerializer(serializers.Serializer):
    """Serializer para opciones de tipo documento"""
    categorias = serializers.SerializerMethodField()

    def get_categorias(self, obj):
        """Retorna categorías activas con sus tipos"""
        categorias = CategoriaDocumento.objects.filter(is_active=True).order_by('orden', 'name')
        return [
            {
                'value': c.id,
                'label': c.name,
                'code': c.code,
                'color': c.color,
                'icon': c.icon
            }
            for c in categorias
        ]


# =============================================================================
# CONSECUTIVO CONFIG SERIALIZERS
# =============================================================================

class ConsecutivoConfigSerializer(serializers.ModelSerializer):
    """Serializer completo para ConsecutivoConfig"""
    tipo_documento_code = serializers.CharField(source='tipo_documento.code', read_only=True)
    tipo_documento_name = serializers.CharField(source='tipo_documento.name', read_only=True)
    # Campos de categoría via tipo_documento
    tipo_documento_categoria_id = serializers.IntegerField(source='tipo_documento.categoria.id', read_only=True)
    tipo_documento_categoria_code = serializers.CharField(source='tipo_documento.categoria.code', read_only=True)
    tipo_documento_categoria_name = serializers.CharField(source='tipo_documento.categoria.name', read_only=True)
    tipo_documento_categoria_color = serializers.CharField(source='tipo_documento.categoria.color', read_only=True)

    separator_display = serializers.CharField(source='get_separator_display', read_only=True)
    ejemplo_formato = serializers.SerializerMethodField()

    class Meta:
        model = ConsecutivoConfig
        fields = [
            'id', 'tipo_documento', 'tipo_documento_code', 'tipo_documento_name',
            'tipo_documento_categoria_id', 'tipo_documento_categoria_code',
            'tipo_documento_categoria_name', 'tipo_documento_categoria_color',
            'prefix', 'suffix', 'current_number', 'padding',
            'include_year', 'include_month', 'include_day',
            'separator', 'separator_display',
            'reset_yearly', 'reset_monthly', 'last_reset_date',
            'is_active', 'ejemplo_formato',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_number', 'last_reset_date', 'created_at', 'updated_at']

    def get_ejemplo_formato(self, obj):
        """Genera un ejemplo del formato del consecutivo"""
        return obj.get_ejemplo_formato()


class ConsecutivoConfigListSerializer(serializers.ModelSerializer):
    """Serializer para listas de consecutivos (incluye todos los campos para la tabla)"""
    tipo_documento_code = serializers.CharField(source='tipo_documento.code', read_only=True)
    tipo_documento_name = serializers.CharField(source='tipo_documento.name', read_only=True)
    # Campos de categoría via tipo_documento
    tipo_documento_categoria_id = serializers.IntegerField(source='tipo_documento.categoria.id', read_only=True)
    tipo_documento_categoria_code = serializers.CharField(source='tipo_documento.categoria.code', read_only=True)
    tipo_documento_categoria_name = serializers.CharField(source='tipo_documento.categoria.name', read_only=True)
    tipo_documento_categoria_color = serializers.CharField(source='tipo_documento.categoria.color', read_only=True)
    ejemplo = serializers.SerializerMethodField()

    class Meta:
        model = ConsecutivoConfig
        fields = [
            'id', 'tipo_documento', 'tipo_documento_code', 'tipo_documento_name',
            'tipo_documento_categoria_id', 'tipo_documento_categoria_code',
            'tipo_documento_categoria_name', 'tipo_documento_categoria_color',
            'prefix', 'suffix', 'current_number', 'padding',
            'include_year', 'include_month', 'include_day', 'separator',
            'reset_yearly', 'reset_monthly',
            'is_active', 'ejemplo'
        ]

    def get_ejemplo(self, obj):
        """Genera ejemplo con el siguiente número"""
        return obj.get_ejemplo_formato()


class ConsecutivoChoicesSerializer(serializers.Serializer):
    """Serializer para opciones de consecutivos"""
    separators = serializers.SerializerMethodField()
    tipos_documento = serializers.SerializerMethodField()
    categorias = serializers.SerializerMethodField()

    def get_separators(self, obj):
        return [{'value': s[0], 'label': s[1]} for s in ConsecutivoConfig.SEPARATOR_CHOICES]

    def get_tipos_documento(self, obj):
        """Retorna tipos disponibles para configurar consecutivos"""
        tipos = TipoDocumento.objects.filter(
            is_active=True
        ).select_related('categoria').order_by('categoria__orden', 'name')
        return [
            {
                'value': t.id,
                'label': t.name,
                'categoria_id': t.categoria.id,
                'categoria_code': t.categoria.code,
                'categoria_name': t.categoria.name,
                'categoria_color': t.categoria.color,
                'prefijo_sugerido': t.prefijo_sugerido
            }
            for t in tipos
        ]

    def get_categorias(self, obj):
        """Retorna categorías para filtrar tipos de documento"""
        categorias = CategoriaDocumento.objects.filter(is_active=True).order_by('orden', 'name')
        return [
            {
                'value': c.id,
                'label': c.name,
                'code': c.code,
                'color': c.color
            }
            for c in categorias
        ]
