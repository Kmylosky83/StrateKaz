"""
Serializers para Riesgos de Procesos - ISO 31000
================================================

Serializers para el módulo de gestión de riesgos según ISO 31000.
Incluye serializers para CategoriaRiesgo, RiesgoProceso, TratamientoRiesgo,
ControlOperacional y Oportunidad.

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    CategoriaRiesgo,
    RiesgoProceso,
    TratamientoRiesgo,
    ControlOperacional,
    Oportunidad
)

User = get_user_model()


class CategoriaRiesgoSerializer(serializers.ModelSerializer):
    """
    Serializer para categorías de riesgo.

    Catálogo global de tipos de riesgo según ISO 31000.
    """

    class Meta:
        model = CategoriaRiesgo
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'color', 'orden', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class RiesgoProcesoListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listado de riesgos.

    Incluye solo campos esenciales para performance en listas.
    """
    categoria_nombre = serializers.CharField(
        source='categoria.nombre',
        read_only=True
    )
    categoria_codigo = serializers.CharField(
        source='categoria.codigo',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    # Campos calculados
    nivel_inherente = serializers.IntegerField(read_only=True)
    nivel_residual = serializers.IntegerField(read_only=True)
    interpretacion_inherente = serializers.CharField(read_only=True)
    interpretacion_residual = serializers.CharField(read_only=True)
    reduccion_riesgo_porcentaje = serializers.FloatField(read_only=True)

    class Meta:
        model = RiesgoProceso
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'categoria', 'categoria_nombre', 'categoria_codigo',
            'proceso', 'estado', 'estado_display',
            'probabilidad_inherente', 'impacto_inherente',
            'nivel_inherente', 'interpretacion_inherente',
            'probabilidad_residual', 'impacto_residual',
            'nivel_residual', 'interpretacion_residual',
            'reduccion_riesgo_porcentaje',
            'responsable', 'responsable_nombre',
            'empresa', 'created_at'
        ]


class RiesgoProcesoDetailSerializer(serializers.ModelSerializer):
    """
    Serializer completo para detalle de riesgo.

    Incluye todos los campos y relaciones para vista de detalle.
    """
    categoria_nombre = serializers.CharField(
        source='categoria.nombre',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    # Campos calculados
    nivel_inherente = serializers.IntegerField(read_only=True)
    nivel_residual = serializers.IntegerField(read_only=True)
    interpretacion_inherente = serializers.CharField(read_only=True)
    interpretacion_residual = serializers.CharField(read_only=True)
    reduccion_riesgo_porcentaje = serializers.FloatField(read_only=True)

    # Contadores de relaciones
    total_tratamientos = serializers.SerializerMethodField()
    total_controles = serializers.SerializerMethodField()

    class Meta:
        model = RiesgoProceso
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def get_total_tratamientos(self, obj) -> int:
        """Retorna el total de tratamientos asociados."""
        return obj.tratamientos.count()

    def get_total_controles(self, obj) -> int:
        """Retorna el total de controles operacionales."""
        return obj.controles.count()


class RiesgoProcesoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para creación/actualización de riesgos.

    Validaciones específicas para crear riesgos.
    """

    class Meta:
        model = RiesgoProceso
        fields = [
            'codigo', 'nombre', 'descripcion', 'tipo', 'categoria',
            'proceso', 'causa_raiz', 'consecuencia',
            'probabilidad_inherente', 'impacto_inherente',
            'probabilidad_residual', 'impacto_residual',
            'responsable', 'estado', 'empresa'
        ]

    def validate(self, data):
        """Validaciones de negocio."""
        # Validar que probabilidad/impacto estén en rango 1-5
        if not (1 <= data.get('probabilidad_inherente', 0) <= 5):
            raise serializers.ValidationError({
                'probabilidad_inherente': 'Debe estar entre 1 y 5'
            })
        if not (1 <= data.get('impacto_inherente', 0) <= 5):
            raise serializers.ValidationError({
                'impacto_inherente': 'Debe estar entre 1 y 5'
            })
        if not (1 <= data.get('probabilidad_residual', 0) <= 5):
            raise serializers.ValidationError({
                'probabilidad_residual': 'Debe estar entre 1 y 5'
            })
        if not (1 <= data.get('impacto_residual', 0) <= 5):
            raise serializers.ValidationError({
                'impacto_residual': 'Debe estar entre 1 y 5'
            })

        return data


class TratamientoRiesgoSerializer(serializers.ModelSerializer):
    """
    Serializer para planes de tratamiento de riesgo.

    Gestiona las estrategias de respuesta al riesgo:
    Evitar, Mitigar, Transferir, Aceptar.
    """
    riesgo_codigo = serializers.CharField(
        source='riesgo.codigo',
        read_only=True
    )
    riesgo_nombre = serializers.CharField(
        source='riesgo.nombre',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = TratamientoRiesgo
        fields = [
            'id', 'riesgo', 'riesgo_codigo', 'riesgo_nombre',
            'tipo', 'tipo_display', 'descripcion', 'control_propuesto',
            'responsable', 'responsable_nombre',
            'fecha_implementacion', 'estado', 'estado_display',
            'efectividad', 'empresa',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ControlOperacionalSerializer(serializers.ModelSerializer):
    """
    Serializer para controles operacionales.

    Controles implementados para gestionar los riesgos:
    Preventivos, Detectivos, Correctivos.
    """
    riesgo_codigo = serializers.CharField(
        source='riesgo.codigo',
        read_only=True
    )
    riesgo_nombre = serializers.CharField(
        source='riesgo.nombre',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    tipo_control_display = serializers.CharField(
        source='get_tipo_control_display',
        read_only=True
    )

    class Meta:
        model = ControlOperacional
        fields = [
            'id', 'riesgo', 'riesgo_codigo', 'riesgo_nombre',
            'nombre', 'descripcion', 'tipo_control', 'tipo_control_display',
            'frecuencia', 'responsable', 'responsable_nombre',
            'documentacion', 'efectividad', 'fecha_ultima_evaluacion',
            'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class OportunidadSerializer(serializers.ModelSerializer):
    """
    Serializer para oportunidades.

    Gestiona el lado positivo del riesgo:
    eventos que pueden generar valor o beneficio.
    """
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = Oportunidad
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'fuente', 'impacto_potencial', 'viabilidad',
            'recursos_requeridos', 'responsable', 'responsable_nombre',
            'estado', 'estado_display', 'empresa',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
