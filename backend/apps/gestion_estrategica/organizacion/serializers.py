"""
Serializers para el módulo de Organización
"""
from rest_framework import serializers
from django.db import transaction
from .models import (
    Area, OrganigramaNodePosition, CaracterizacionProceso,
    CaracterizacionProveedor, CaracterizacionEntrada,
    CaracterizacionActividad, CaracterizacionSalida,
    CaracterizacionCliente, CaracterizacionRecurso,
    CaracterizacionIndicador, CaracterizacionRiesgo,
    CaracterizacionDocumento,
)


class AreaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Area"""
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
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
            'tipo',
            'tipo_display',
            'objetivo',
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
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Area
        fields = [
            'id',
            'code',
            'name',
            'description',
            'tipo',
            'tipo_display',
            'objetivo',
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
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Area
        fields = ['id', 'code', 'name', 'tipo', 'tipo_display', 'objetivo', 'parent', 'parent_name', 'manager', 'manager_name', 'icon', 'color', 'is_active']


class OrganigramaNodePositionSerializer(serializers.ModelSerializer):
    """Serializer para posiciones de nodos del organigrama"""

    class Meta:
        model = OrganigramaNodePosition
        fields = ['node_type', 'node_id', 'view_mode', 'direction', 'x', 'y']


# ==============================================================================
# CARACTERIZACIÓN DE PROCESOS — SERIALIZERS HIJOS (REORG-B5)
# ==============================================================================


class CaracterizacionProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaracterizacionProveedor
        fields = ['id', 'nombre', 'tipo', 'parte_interesada_id', 'parte_interesada_nombre', 'orden']


class CaracterizacionEntradaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaracterizacionEntrada
        fields = ['id', 'descripcion', 'origen', 'orden']


class CaracterizacionActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaracterizacionActividad
        fields = ['id', 'descripcion', 'responsable', 'responsable_cargo_id', 'responsable_cargo_nombre', 'orden']


class CaracterizacionSalidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaracterizacionSalida
        fields = ['id', 'descripcion', 'destino', 'orden']


class CaracterizacionClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaracterizacionCliente
        fields = ['id', 'nombre', 'tipo', 'parte_interesada_id', 'parte_interesada_nombre', 'orden']


class CaracterizacionRecursoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = CaracterizacionRecurso
        fields = ['id', 'tipo', 'tipo_display', 'descripcion', 'orden']


class CaracterizacionIndicadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaracterizacionIndicador
        fields = ['id', 'nombre', 'formula', 'meta', 'indicador_id', 'orden']


class CaracterizacionRiesgoSerializer(serializers.ModelSerializer):
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)

    class Meta:
        model = CaracterizacionRiesgo
        fields = ['id', 'descripcion', 'nivel', 'nivel_display', 'tratamiento', 'riesgo_id', 'orden']


class CaracterizacionDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaracterizacionDocumento
        fields = ['id', 'codigo', 'nombre', 'documento_id', 'orden']


# ==============================================================================
# CARACTERIZACIÓN DE PROCESOS — LIST / DETAIL
# ==============================================================================


class CaracterizacionProcesoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de caracterizaciones"""
    area_name = serializers.CharField(source='area.name', read_only=True)
    area_code = serializers.CharField(source='area.code', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    lider_proceso_nombre = serializers.CharField(
        source='lider_proceso.name', read_only=True, default=None
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
    """
    Serializer completo para detalle/creación/edición.

    REORG-B5: Incluye hijos relacionales nested.
    Los JSONField legacy se mantienen (read-only) hasta que se eliminen.
    En escritura, se procesan los arrays de hijos (items_*).
    """
    area_name = serializers.CharField(source='area.name', read_only=True)
    area_code = serializers.CharField(source='area.code', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    lider_proceso_nombre = serializers.CharField(
        source='lider_proceso.name', read_only=True, default=None
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name', read_only=True, default=None
    )

    # Nested read (relacional)
    items_proveedores = CaracterizacionProveedorSerializer(
        source='caracterizacionproveedors', many=True, read_only=True
    )
    items_entradas = CaracterizacionEntradaSerializer(
        source='caracterizacionentradas', many=True, read_only=True
    )
    items_actividades = CaracterizacionActividadSerializer(
        source='caracterizacionactividads', many=True, read_only=True
    )
    items_salidas = CaracterizacionSalidaSerializer(
        source='caracterizacionsalidas', many=True, read_only=True
    )
    items_clientes = CaracterizacionClienteSerializer(
        source='caracterizacionclientes', many=True, read_only=True
    )
    items_recursos = CaracterizacionRecursoSerializer(
        source='caracterizacionrecursos', many=True, read_only=True
    )
    items_indicadores = CaracterizacionIndicadorSerializer(
        source='caracterizacionindicadors', many=True, read_only=True
    )
    items_riesgos = CaracterizacionRiesgoSerializer(
        source='caracterizacionriesgos', many=True, read_only=True
    )
    items_documentos = CaracterizacionDocumentoSerializer(
        source='caracterizaciondocumentos', many=True, read_only=True
    )

    class Meta:
        model = CaracterizacionProceso
        fields = [
            'id', 'area', 'area_name', 'area_code',
            'version', 'estado', 'estado_display',
            'objetivo', 'alcance',
            'lider_proceso', 'lider_proceso_nombre',
            # SIPOC JSONField legacy (read-only, backup)
            'proveedores', 'entradas', 'actividades_clave', 'salidas', 'clientes',
            'recursos', 'indicadores_vinculados', 'riesgos_asociados',
            'documentos_referencia', 'requisitos_normativos',
            'observaciones',
            # SIPOC relacional (REORG-B5)
            'items_proveedores', 'items_entradas', 'items_actividades',
            'items_salidas', 'items_clientes', 'items_recursos',
            'items_indicadores', 'items_riesgos', 'items_documentos',
            # Audit
            'is_active', 'created_at', 'updated_at',
            'created_by', 'created_by_nombre',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def _sync_children(self, instance, field_name, model_class, items_data):
        """
        Sync pattern: delete-and-recreate children from items array.
        Simple and reliable for small arrays (SIPOC rarely exceeds 20 items).
        Filtra campos read-only (_display, etc.) que vienen del frontend.
        """
        related_name = model_class.__name__.lower() + 's'
        getattr(instance, related_name).all().delete()
        # Campos válidos del modelo (excluir id y caracterizacion)
        valid_fields = {
            f.name for f in model_class._meta.get_fields()
            if hasattr(f, 'column') or hasattr(f, 'attname')
        }
        valid_fields.discard('id')
        valid_fields.discard('caracterizacion')
        for i, item_data in enumerate(items_data):
            clean = {k: v for k, v in item_data.items() if k in valid_fields}
            clean['orden'] = clean.get('orden', i)
            model_class.objects.create(caracterizacion=instance, **clean)

    def _process_children(self, instance, validated_data):
        """Process all 9 child arrays from request.data."""
        request = self.context.get('request')
        if not request:
            return

        data = request.data
        CHILD_MAP = {
            'items_proveedores': CaracterizacionProveedor,
            'items_entradas': CaracterizacionEntrada,
            'items_actividades': CaracterizacionActividad,
            'items_salidas': CaracterizacionSalida,
            'items_clientes': CaracterizacionCliente,
            'items_recursos': CaracterizacionRecurso,
            'items_indicadores': CaracterizacionIndicador,
            'items_riesgos': CaracterizacionRiesgo,
            'items_documentos': CaracterizacionDocumento,
        }

        for field_name, model_class in CHILD_MAP.items():
            if field_name in data:
                items = data[field_name]
                if isinstance(items, list):
                    self._sync_children(instance, field_name, model_class, items)

    @transaction.atomic
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        instance = super().create(validated_data)
        self._process_children(instance, validated_data)
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        self._process_children(instance, validated_data)
        return instance
