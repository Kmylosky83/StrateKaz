"""
Serializers para Gestión de Calidad
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    NoConformidad,
    AccionCorrectiva,
    SalidaNoConforme,
    SolicitudCambio,
    ControlCambio
)

User = get_user_model()


# ============================================================================
# NO CONFORMIDADES
# ============================================================================

class NoConformidadListSerializer(serializers.ModelSerializer):
    """Serializer para listado de No Conformidades"""

    detectado_por_nombre = serializers.CharField(
        source='detectado_por.get_full_name',
        read_only=True
    )
    responsable_analisis_nombre = serializers.CharField(
        source='responsable_analisis.get_full_name',
        read_only=True
    )
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    origen_display = serializers.CharField(source='get_origen_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)

    dias_abierta = serializers.SerializerMethodField()
    cantidad_acciones = serializers.SerializerMethodField()

    class Meta:
        model = NoConformidad
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display', 'origen', 'origen_display',
            'severidad', 'severidad_display', 'titulo', 'descripcion',
            'fecha_deteccion', 'ubicacion', 'estado', 'estado_display',
            'detectado_por', 'detectado_por_nombre',
            'responsable_analisis', 'responsable_analisis_nombre',
            'dias_abierta', 'cantidad_acciones',
        ]
        read_only_fields = ['codigo']

    def get_dias_abierta(self, obj):
        return obj.calcular_dias_abierta()

    def get_cantidad_acciones(self, obj):
        return obj.acciones_correctivas.count()


class NoConformidadDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para No Conformidades"""

    detectado_por_nombre = serializers.CharField(
        source='detectado_por.get_full_name',
        read_only=True
    )
    responsable_analisis_nombre = serializers.CharField(
        source='responsable_analisis.get_full_name',
        read_only=True
    )
    responsable_cierre_nombre = serializers.CharField(
        source='responsable_cierre.get_full_name',
        read_only=True
    )

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    origen_display = serializers.CharField(source='get_origen_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    metodo_analisis_display = serializers.CharField(
        source='get_metodo_analisis_display',
        read_only=True
    )

    dias_abierta = serializers.SerializerMethodField()
    puede_cerrar = serializers.SerializerMethodField()

    # Nested serializers para acciones (se definirá después)
    acciones_correctivas = serializers.SerializerMethodField()

    class Meta:
        model = NoConformidad
        fields = '__all__'
        read_only_fields = ['codigo']

    def get_dias_abierta(self, obj):
        return obj.calcular_dias_abierta()

    def get_puede_cerrar(self, obj):
        return obj.puede_cerrar()

    def get_acciones_correctivas(self, obj):
        acciones = obj.acciones_correctivas.all()
        return AccionCorrectivaListSerializer(acciones, many=True).data


# ============================================================================
# ACCIONES CORRECTIVAS
# ============================================================================

class AccionCorrectivaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Acciones Correctivas"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    no_conformidad_codigo = serializers.CharField(
        source='no_conformidad.codigo',
        read_only=True
    )
    esta_vencida = serializers.SerializerMethodField()

    class Meta:
        model = AccionCorrectiva
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display', 'no_conformidad',
            'no_conformidad_codigo', 'descripcion', 'fecha_planificada',
            'fecha_limite', 'responsable', 'responsable_nombre',
            'estado', 'estado_display', 'eficaz', 'esta_vencida',
        ]
        read_only_fields = ['codigo']

    def get_esta_vencida(self, obj):
        return obj.esta_vencida()


class AccionCorrectivaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Acciones Correctivas"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    verificador_nombre = serializers.CharField(
        source='verificador.get_full_name',
        read_only=True
    )
    no_conformidad_info = NoConformidadListSerializer(
        source='no_conformidad',
        read_only=True
    )

    esta_vencida = serializers.SerializerMethodField()

    class Meta:
        model = AccionCorrectiva
        fields = '__all__'
        read_only_fields = ['codigo']

    def get_esta_vencida(self, obj):
        return obj.esta_vencida()


# ============================================================================
# SALIDAS NO CONFORMES
# ============================================================================

class SalidaNoConformeListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Salidas No Conformes"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    disposicion_display = serializers.CharField(
        source='get_disposicion_display',
        read_only=True
    )
    detectado_por_nombre = serializers.CharField(
        source='detectado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = SalidaNoConforme
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display', 'descripcion_producto',
            'descripcion_no_conformidad', 'fecha_deteccion', 'lote_numero',
            'cantidad_afectada', 'unidad_medida', 'ubicacion_actual',
            'bloqueada', 'riesgo_uso', 'estado', 'estado_display',
            'disposicion', 'disposicion_display',
            'detectado_por', 'detectado_por_nombre',
        ]
        read_only_fields = ['codigo']


class SalidaNoConformeDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Salidas No Conformes"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    disposicion_display = serializers.CharField(
        source='get_disposicion_display',
        read_only=True
    )

    detectado_por_nombre = serializers.CharField(
        source='detectado_por.get_full_name',
        read_only=True
    )
    responsable_evaluacion_nombre = serializers.CharField(
        source='responsable_evaluacion.get_full_name',
        read_only=True
    )
    responsable_disposicion_nombre = serializers.CharField(
        source='responsable_disposicion.get_full_name',
        read_only=True
    )

    puede_liberar = serializers.SerializerMethodField()

    class Meta:
        model = SalidaNoConforme
        fields = '__all__'
        read_only_fields = ['codigo']

    def get_puede_liberar(self, obj):
        return obj.puede_liberar()


# ============================================================================
# SOLICITUDES DE CAMBIO
# ============================================================================

class SolicitudCambioListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Solicitudes de Cambio"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )
    solicitante_nombre = serializers.CharField(
        source='solicitante.get_full_name',
        read_only=True
    )

    class Meta:
        model = SolicitudCambio
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display', 'prioridad',
            'prioridad_display', 'titulo', 'descripcion_cambio',
            'solicitante', 'solicitante_nombre', 'fecha_solicitud',
            'estado', 'estado_display', 'fecha_aprobacion',
            'fecha_implementacion_planificada', 'costo_estimado',
        ]
        read_only_fields = ['codigo', 'fecha_solicitud']


class SolicitudCambioDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Solicitudes de Cambio"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )

    solicitante_nombre = serializers.CharField(
        source='solicitante.get_full_name',
        read_only=True
    )
    revisado_por_nombre = serializers.CharField(
        source='revisado_por.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True
    )
    responsable_implementacion_nombre = serializers.CharField(
        source='responsable_implementacion.get_full_name',
        read_only=True
    )

    class Meta:
        model = SolicitudCambio
        fields = '__all__'
        read_only_fields = ['codigo', 'fecha_solicitud']


# ============================================================================
# CONTROL DE CAMBIOS
# ============================================================================

class ControlCambioListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Controles de Cambio"""

    solicitud_codigo = serializers.CharField(
        source='solicitud_cambio.codigo',
        read_only=True
    )
    solicitud_titulo = serializers.CharField(
        source='solicitud_cambio.titulo',
        read_only=True
    )

    class Meta:
        model = ControlCambio
        fields = [
            'id', 'solicitud_cambio', 'solicitud_codigo', 'solicitud_titulo',
            'fecha_inicio_implementacion', 'fecha_fin_implementacion',
            'capacitacion_realizada', 'verificacion_realizada', 'eficaz',
            'costo_real'
        ]


class ControlCambioDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Controles de Cambio"""

    solicitud_cambio_info = SolicitudCambioListSerializer(
        source='solicitud_cambio',
        read_only=True
    )

    class Meta:
        model = ControlCambio
        fields = '__all__'
        read_only_fields = []
