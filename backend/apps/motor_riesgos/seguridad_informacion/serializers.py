"""
Serializers para Seguridad de la Información - ISO 27001
Motor de Riesgos
"""
from rest_framework import serializers
from .models import (
    ActivoInformacion,
    Amenaza,
    Vulnerabilidad,
    RiesgoSeguridad,
    ControlSeguridad,
    IncidenteSeguridad
)


# =============================================================================
# ACTIVO DE INFORMACIÓN SERIALIZERS
# =============================================================================

class ActivoInformacionSerializer(serializers.ModelSerializer):
    """Serializer completo para activos de información"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    clasificacion_display = serializers.CharField(source='get_clasificacion_display', read_only=True)
    propietario_nombre = serializers.CharField(source='propietario.get_full_name', read_only=True)
    custodio_nombre = serializers.CharField(source='custodio.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = ActivoInformacion
        fields = '__all__'
        read_only_fields = ['criticidad', 'created_at', 'updated_at']


class ActivoInformacionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de activos"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    clasificacion_display = serializers.CharField(source='get_clasificacion_display', read_only=True)
    propietario_nombre = serializers.CharField(source='propietario.get_full_name', read_only=True)

    class Meta:
        model = ActivoInformacion
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'clasificacion', 'clasificacion_display', 'propietario_nombre',
            'criticidad', 'is_active'
        ]


# =============================================================================
# AMENAZA SERIALIZERS
# =============================================================================

class AmenazaSerializer(serializers.ModelSerializer):
    """Serializer completo para amenazas"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Amenaza
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class AmenazaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de amenazas"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Amenaza
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'probabilidad_ocurrencia', 'is_active'
        ]


# =============================================================================
# VULNERABILIDAD SERIALIZERS
# =============================================================================

class VulnerabilidadSerializer(serializers.ModelSerializer):
    """Serializer completo para vulnerabilidades"""
    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    activo_nombre = serializers.CharField(source='activo.nombre', read_only=True)

    class Meta:
        model = Vulnerabilidad
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class VulnerabilidadListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de vulnerabilidades"""
    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    activo_nombre = serializers.CharField(source='activo.nombre', read_only=True)

    class Meta:
        model = Vulnerabilidad
        fields = [
            'id', 'codigo', 'activo_codigo', 'activo_nombre',
            'facilidad_explotacion', 'is_active'
        ]


# =============================================================================
# RIESGO DE SEGURIDAD SERIALIZERS
# =============================================================================

class RiesgoSeguridadListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de riesgos"""
    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    activo_nombre = serializers.CharField(source='activo.nombre', read_only=True)
    amenaza_nombre = serializers.CharField(source='amenaza.nombre', read_only=True)
    nivel_riesgo_display = serializers.CharField(source='get_nivel_riesgo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = RiesgoSeguridad
        fields = [
            'id', 'activo_codigo', 'activo_nombre', 'amenaza_nombre',
            'nivel_riesgo', 'nivel_riesgo_display', 'estado', 'estado_display',
            'aceptabilidad', 'created_at'
        ]


class RiesgoSeguridadDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para riesgos de seguridad"""
    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    activo_nombre = serializers.CharField(source='activo.nombre', read_only=True)
    amenaza_codigo = serializers.CharField(source='amenaza.codigo', read_only=True)
    amenaza_nombre = serializers.CharField(source='amenaza.nombre', read_only=True)
    vulnerabilidad_codigo = serializers.CharField(source='vulnerabilidad.codigo', read_only=True, allow_null=True)
    responsable_nombre = serializers.CharField(source='responsable_tratamiento.get_full_name', read_only=True, allow_null=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)

    probabilidad_display = serializers.CharField(source='get_probabilidad_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)
    nivel_riesgo_display = serializers.CharField(source='get_nivel_riesgo_display', read_only=True)
    aceptabilidad_display = serializers.CharField(source='get_aceptabilidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = RiesgoSeguridad
        fields = '__all__'
        read_only_fields = ['nivel_riesgo', 'nivel_residual', 'created_at', 'updated_at', 'created_by']

    def create(self, validated_data):
        """Asigna el usuario que crea el riesgo"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


# =============================================================================
# CONTROL DE SEGURIDAD SERIALIZERS
# =============================================================================

class ControlSeguridadSerializer(serializers.ModelSerializer):
    """Serializer completo para controles de seguridad"""
    riesgo_info = serializers.SerializerMethodField(read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True, allow_null=True)
    tipo_control_display = serializers.CharField(source='get_tipo_control_display', read_only=True)
    estado_implementacion_display = serializers.CharField(source='get_estado_implementacion_display', read_only=True)

    class Meta:
        model = ControlSeguridad
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_riesgo_info(self, obj):
        """Retorna información resumida del riesgo asociado"""
        return {
            'id': obj.riesgo.id,
            'activo_codigo': obj.riesgo.activo.codigo,
            'amenaza_nombre': obj.riesgo.amenaza.nombre,
            'nivel_riesgo': obj.riesgo.nivel_riesgo,
        }


class ControlSeguridadListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de controles"""
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True, allow_null=True)
    estado_implementacion_display = serializers.CharField(source='get_estado_implementacion_display', read_only=True)
    activo_codigo = serializers.CharField(source='riesgo.activo.codigo', read_only=True)

    class Meta:
        model = ControlSeguridad
        fields = [
            'id', 'control_iso', 'descripcion', 'activo_codigo',
            'estado_implementacion', 'estado_implementacion_display',
            'efectividad', 'responsable_nombre', 'fecha_implementacion'
        ]


# =============================================================================
# INCIDENTE DE SEGURIDAD SERIALIZERS
# =============================================================================

class IncidenteSeguridadSerializer(serializers.ModelSerializer):
    """Serializer completo para incidentes de seguridad"""
    activos_afectados_info = serializers.SerializerMethodField(read_only=True)
    reportado_por_nombre = serializers.CharField(source='reportado_por.get_full_name', read_only=True, allow_null=True)
    tipo_incidente_display = serializers.CharField(source='get_tipo_incidente_display', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = IncidenteSeguridad
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_activos_afectados_info(self, obj):
        """Retorna información resumida de los activos afectados"""
        return [
            {
                'id': activo.id,
                'codigo': activo.codigo,
                'nombre': activo.nombre,
                'tipo': activo.tipo,
            }
            for activo in obj.activos_afectados.all()
        ]

    def create(self, validated_data):
        """Maneja la creación con ManyToMany y asigna reportado_por"""
        activos_data = validated_data.pop('activos_afectados', [])
        request = self.context.get('request')

        if request and hasattr(request, 'user'):
            validated_data['reportado_por'] = request.user

        incidente = IncidenteSeguridad.objects.create(**validated_data)

        if activos_data:
            incidente.activos_afectados.set(activos_data)

        return incidente


class IncidenteSeguridadListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de incidentes"""
    tipo_incidente_display = serializers.CharField(source='get_tipo_incidente_display', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    activos_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = IncidenteSeguridad
        fields = [
            'id', 'fecha_deteccion', 'tipo_incidente', 'tipo_incidente_display',
            'severidad', 'severidad_display', 'estado', 'estado_display',
            'activos_count', 'created_at'
        ]

    def get_activos_count(self, obj):
        """Retorna el número de activos afectados"""
        return obj.activos_afectados.count()
