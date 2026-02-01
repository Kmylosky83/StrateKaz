"""
Serializers para Procesamiento de Materia Prima - Production Ops
Sistema de Gestión StrateKaz

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from rest_framework import serializers
from decimal import Decimal

from .models import (
    TipoProceso,
    EstadoProceso,
    LineaProduccion,
    OrdenProduccion,
    LoteProduccion,
    ConsumoMateriaPrima,
    ControlCalidadProceso
)


# ==============================================================================
# SERIALIZERS DE CATÁLOGO
# ==============================================================================

class TipoProcesoSerializer(serializers.ModelSerializer):
    """Serializer para Tipo de Proceso."""

    class Meta:
        model = TipoProceso
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'tiempo_estimado_horas', 'requiere_temperatura', 'requiere_presion',
            'producto_resultante', 'activo', 'orden',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class EstadoProcesoSerializer(serializers.ModelSerializer):
    """Serializer para Estado de Proceso."""

    class Meta:
        model = EstadoProceso
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'color',
            'es_inicial', 'es_final', 'permite_edicion',
            'activo', 'orden',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class LineaProduccionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de Línea de Producción."""

    cantidad_tipos_compatibles = serializers.IntegerField(read_only=True)

    class Meta:
        model = LineaProduccion
        fields = [
            'id', 'codigo', 'nombre', 'ubicacion',
            'capacidad_kg_hora', 'cantidad_tipos_compatibles',
            'is_active'
        ]


class LineaProduccionSerializer(serializers.ModelSerializer):
    """Serializer completo para Línea de Producción."""

    tipo_proceso_compatible_display = TipoProcesoSerializer(
        source='tipo_proceso_compatible',
        many=True,
        read_only=True
    )
    cantidad_tipos_compatibles = serializers.IntegerField(read_only=True)

    class Meta:
        model = LineaProduccion
        fields = [
            'id', 'empresa', 'codigo', 'nombre', 'descripcion', 'ubicacion',
            'capacidad_kg_hora', 'tipo_proceso_compatible',
            'tipo_proceso_compatible_display', 'cantidad_tipos_compatibles',
            'orden', 'is_active', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'created_by', 'updated_by',
            'tipo_proceso_compatible_display', 'cantidad_tipos_compatibles'
        ]


# ==============================================================================
# SERIALIZERS DE CONTROL DE CALIDAD
# ==============================================================================

class ControlCalidadProcesoSerializer(serializers.ModelSerializer):
    """Serializer para Control de Calidad de Proceso."""

    verificado_por_nombre = serializers.CharField(
        source='verificado_por.get_full_name',
        read_only=True
    )
    parametro_display = serializers.CharField(
        source='get_parametro_display',
        read_only=True
    )
    estado_cumplimiento = serializers.CharField(read_only=True)

    class Meta:
        model = ControlCalidadProceso
        fields = [
            'id', 'lote_produccion', 'parametro', 'parametro_display',
            'valor_minimo', 'valor_maximo', 'valor_obtenido',
            'cumple', 'estado_cumplimiento', 'observaciones',
            'verificado_por', 'verificado_por_nombre', 'fecha_verificacion',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'cumple', 'estado_cumplimiento', 'fecha_verificacion',
            'parametro_display', 'verificado_por_nombre',
            'created_at', 'updated_at'
        ]


# ==============================================================================
# SERIALIZERS DE CONSUMO DE MATERIA PRIMA
# ==============================================================================

class ConsumoMateriaPrimaSerializer(serializers.ModelSerializer):
    """Serializer para Consumo de Materia Prima."""

    tipo_materia_prima_nombre = serializers.CharField(
        source='tipo_materia_prima.nombre',
        read_only=True
    )

    class Meta:
        model = ConsumoMateriaPrima
        fields = [
            'id', 'lote_produccion', 'tipo_materia_prima',
            'tipo_materia_prima_nombre', 'cantidad', 'unidad_medida',
            'costo_unitario', 'costo_total', 'lote_origen',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'costo_total', 'tipo_materia_prima_nombre',
            'created_at', 'updated_at'
        ]


# ==============================================================================
# SERIALIZERS DE LOTE DE PRODUCCIÓN
# ==============================================================================

class LoteProduccionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de Lote de Producción."""

    orden_produccion_codigo = serializers.CharField(
        source='orden_produccion.codigo',
        read_only=True
    )
    operador_nombre = serializers.CharField(
        source='operador.get_full_name',
        read_only=True
    )

    class Meta:
        model = LoteProduccion
        fields = [
            'id', 'codigo', 'orden_produccion', 'orden_produccion_codigo',
            'fecha_produccion', 'producto_salida', 'cantidad_salida',
            'porcentaje_rendimiento', 'operador_nombre'
        ]


class LoteProduccionSerializer(serializers.ModelSerializer):
    """Serializer completo para Lote de Producción."""

    orden_produccion_codigo = serializers.CharField(
        source='orden_produccion.codigo',
        read_only=True
    )
    operador_nombre = serializers.CharField(
        source='operador.get_full_name',
        read_only=True
    )
    duracion_produccion_horas = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        read_only=True
    )
    tiene_consumos = serializers.BooleanField(read_only=True)
    total_costo_materia_prima = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True
    )
    tiene_controles_calidad = serializers.BooleanField(read_only=True)
    todos_controles_cumplen = serializers.BooleanField(read_only=True)

    # Nested serializers
    consumos = ConsumoMateriaPrimaSerializer(many=True, read_only=True)
    controles_calidad = ControlCalidadProcesoSerializer(many=True, read_only=True)

    class Meta:
        model = LoteProduccion
        fields = [
            'id', 'codigo', 'orden_produccion', 'orden_produccion_codigo',
            'materia_prima_entrada', 'cantidad_entrada',
            'producto_salida', 'cantidad_salida',
            'merma_kg', 'porcentaje_rendimiento',
            'fecha_produccion', 'hora_inicio', 'hora_fin',
            'duracion_produccion_horas',
            'operador', 'operador_nombre',
            'tiene_consumos', 'total_costo_materia_prima',
            'tiene_controles_calidad', 'todos_controles_cumplen',
            'consumos', 'controles_calidad',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'codigo', 'merma_kg', 'porcentaje_rendimiento',
            'orden_produccion_codigo', 'operador_nombre',
            'duracion_produccion_horas', 'tiene_consumos',
            'total_costo_materia_prima', 'tiene_controles_calidad',
            'todos_controles_cumplen', 'consumos', 'controles_calidad',
            'created_at', 'updated_at'
        ]


# ==============================================================================
# SERIALIZERS DE ORDEN DE PRODUCCIÓN
# ==============================================================================

class OrdenProduccionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de Orden de Producción."""

    tipo_proceso_nombre = serializers.CharField(
        source='tipo_proceso.nombre',
        read_only=True
    )
    linea_produccion_nombre = serializers.CharField(
        source='linea_produccion.nombre',
        read_only=True
    )
    estado_nombre = serializers.CharField(
        source='estado.nombre',
        read_only=True
    )
    estado_color = serializers.CharField(
        source='estado.color',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )

    class Meta:
        model = OrdenProduccion
        fields = [
            'id', 'codigo', 'fecha_programada',
            'tipo_proceso', 'tipo_proceso_nombre',
            'linea_produccion', 'linea_produccion_nombre',
            'estado', 'estado_nombre', 'estado_color',
            'cantidad_programada', 'cantidad_real',
            'prioridad', 'prioridad_display',
            'responsable_nombre'
        ]


class OrdenProduccionSerializer(serializers.ModelSerializer):
    """Serializer completo para Orden de Producción."""

    tipo_proceso_detail = TipoProcesoSerializer(
        source='tipo_proceso',
        read_only=True
    )
    linea_produccion_detail = LineaProduccionListSerializer(
        source='linea_produccion',
        read_only=True
    )
    estado_detail = EstadoProcesoSerializer(
        source='estado',
        read_only=True
    )
    recepcion_origen_codigo = serializers.CharField(
        source='recepcion_origen.codigo',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )

    # Propiedades calculadas
    duracion_proceso_horas = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        read_only=True
    )
    porcentaje_completado = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    tiene_lotes = serializers.BooleanField(read_only=True)
    cantidad_lotes = serializers.IntegerField(read_only=True)
    total_cantidad_producida = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        read_only=True
    )
    rendimiento_promedio = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )

    # Nested serializers
    lotes = LoteProduccionListSerializer(many=True, read_only=True)

    class Meta:
        model = OrdenProduccion
        fields = [
            'id', 'empresa', 'codigo',
            'fecha_programada', 'fecha_inicio', 'fecha_fin',
            'tipo_proceso', 'tipo_proceso_detail',
            'linea_produccion', 'linea_produccion_detail',
            'estado', 'estado_detail',
            'recepcion_origen', 'recepcion_origen_codigo',
            'cantidad_programada', 'cantidad_real',
            'prioridad', 'prioridad_display',
            'responsable', 'responsable_nombre',
            'observaciones',
            'duracion_proceso_horas', 'porcentaje_completado',
            'tiene_lotes', 'cantidad_lotes',
            'total_cantidad_producida', 'rendimiento_promedio',
            'lotes',
            'is_active', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]
        read_only_fields = [
            'codigo', 'fecha_inicio', 'fecha_fin',
            'tipo_proceso_detail', 'linea_produccion_detail',
            'estado_detail', 'recepcion_origen_codigo',
            'responsable_nombre', 'prioridad_display',
            'duracion_proceso_horas', 'porcentaje_completado',
            'tiene_lotes', 'cantidad_lotes',
            'total_cantidad_producida', 'rendimiento_promedio',
            'lotes',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]


class OrdenProduccionCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de Orden de Producción."""

    class Meta:
        model = OrdenProduccion
        fields = [
            'empresa', 'fecha_programada',
            'tipo_proceso', 'linea_produccion', 'estado',
            'recepcion_origen', 'cantidad_programada', 'prioridad',
            'responsable', 'observaciones'
        ]

    def validate(self, attrs):
        """Validaciones personalizadas."""
        # Validar compatibilidad de tipo de proceso con línea
        tipo_proceso = attrs.get('tipo_proceso')
        linea_produccion = attrs.get('linea_produccion')

        if tipo_proceso and linea_produccion:
            if linea_produccion.tipo_proceso_compatible.exists():
                if not linea_produccion.tipo_proceso_compatible.filter(
                    id=tipo_proceso.id
                ).exists():
                    raise serializers.ValidationError({
                        'tipo_proceso': f'El tipo de proceso {tipo_proceso.nombre} '
                                       f'no es compatible con la línea {linea_produccion.nombre}'
                    })

        return attrs


# ==============================================================================
# SERIALIZERS DE ACCIONES
# ==============================================================================

class IniciarProcesoSerializer(serializers.Serializer):
    """Serializer para iniciar un proceso."""
    # No requiere campos adicionales
    pass


class FinalizarProcesoSerializer(serializers.Serializer):
    """Serializer para finalizar un proceso."""
    cantidad_real = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        required=False
    )
