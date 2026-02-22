"""
Serializers para SAGRILAFT/PTEE - Motor de Riesgos
"""
from rest_framework import serializers
from .models import (
    FactorRiesgoLAFT,
    SegmentoCliente,
    MatrizRiesgoLAFT,
    SenalAlerta,
    ReporteOperacionSospechosa,
    DebidaDiligencia
)


# =============================================================================
# Factor Riesgo LAFT Serializers
# =============================================================================
class FactorRiesgoLAFTListSerializer(serializers.ModelSerializer):
    """Serializer para listado de factores de riesgo"""
    tipo_factor_display = serializers.CharField(source='get_tipo_factor_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_riesgo_inherente_display', read_only=True)

    class Meta:
        model = FactorRiesgoLAFT
        fields = [
            'id', 'codigo', 'tipo_factor', 'tipo_factor_display',
            'nombre', 'nivel_riesgo_inherente', 'nivel_display',
            'puntaje_base', 'is_active'
        ]


class FactorRiesgoLAFTDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de factores de riesgo"""
    tipo_factor_display = serializers.CharField(source='get_tipo_factor_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_riesgo_inherente_display', read_only=True)

    class Meta:
        model = FactorRiesgoLAFT
        fields = [
            'id', 'codigo', 'tipo_factor', 'tipo_factor_display',
            'nombre', 'descripcion', 'nivel_riesgo_inherente', 'nivel_display',
            'puntaje_base', 'criterios_evaluacion', 'normativa_aplicable',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


# =============================================================================
# Segmento Cliente Serializers
# =============================================================================
class SegmentoClienteListSerializer(serializers.ModelSerializer):
    """Serializer para listado de segmentos"""
    tipo_cliente_display = serializers.CharField(source='get_tipo_cliente_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_riesgo_display', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = SegmentoCliente
        fields = [
            'id', 'codigo', 'nombre', 'tipo_cliente', 'tipo_cliente_display',
            'nivel_riesgo', 'nivel_display', 'requiere_debida_diligencia_reforzada',
            'frecuencia_monitoreo_dias', 'is_active', 'created_by_nombre'
        ]


class SegmentoClienteDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de segmentos"""
    tipo_cliente_display = serializers.CharField(source='get_tipo_cliente_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_riesgo_display', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = SegmentoCliente
        fields = [
            'id', 'codigo', 'nombre', 'tipo_cliente', 'tipo_cliente_display',
            'nivel_riesgo', 'nivel_display', 'descripcion', 'criterios_clasificacion',
            'requiere_debida_diligencia_reforzada', 'requiere_debida_diligencia_simplificada',
            'frecuencia_monitoreo_dias', 'monto_maximo_transaccion', 'is_active',
            'empresa_id', 'created_by', 'created_by_nombre', 'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']


# =============================================================================
# Matriz Riesgo LAFT Serializers
# =============================================================================
class MatrizRiesgoLAFTListSerializer(serializers.ModelSerializer):
    """Serializer para listado de matrices"""
    tipo_evaluado_display = serializers.CharField(source='get_tipo_evaluado_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    segmento_nombre = serializers.CharField(source='segmento.nombre', read_only=True)

    class Meta:
        model = MatrizRiesgoLAFT
        fields = [
            'id', 'codigo', 'tipo_evaluado', 'tipo_evaluado_display',
            'nombre_evaluado', 'identificacion_evaluado', 'segmento', 'segmento_nombre',
            'nivel_riesgo_inherente', 'nivel_riesgo_residual', 'estado', 'estado_display',
            'fecha_evaluacion', 'proxima_revision'
        ]


class MatrizRiesgoLAFTDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de matrices"""
    tipo_evaluado_display = serializers.CharField(source='get_tipo_evaluado_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    segmento_nombre = serializers.CharField(source='segmento.nombre', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)

    class Meta:
        model = MatrizRiesgoLAFT
        fields = [
            'id', 'codigo', 'tipo_evaluado', 'tipo_evaluado_display',
            'nombre_evaluado', 'identificacion_evaluado', 'segmento', 'segmento_nombre',
            'puntaje_factor_cliente', 'puntaje_factor_jurisdiccion',
            'puntaje_factor_producto', 'puntaje_factor_canal',
            'puntaje_riesgo_inherente', 'nivel_riesgo_inherente',
            'controles_aplicados', 'efectividad_controles',
            'puntaje_riesgo_residual', 'nivel_riesgo_residual',
            'fecha_evaluacion', 'proxima_revision', 'estado', 'estado_display',
            'observaciones', 'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'empresa_id', 'created_by', 'created_by_nombre', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'puntaje_riesgo_inherente', 'nivel_riesgo_inherente',
            'puntaje_riesgo_residual', 'nivel_riesgo_residual',
            'empresa_id', 'created_by', 'created_at', 'updated_at'
        ]


# =============================================================================
# Señal Alerta Serializers
# =============================================================================
class SenalAlertaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de señales"""
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = SenalAlerta
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_display',
            'severidad', 'severidad_display', 'estado', 'estado_display',
            'es_catalogo', 'fecha_deteccion', 'requiere_ros', 'is_active'
        ]


class SenalAlertaDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de señales"""
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    matriz_riesgo_codigo = serializers.CharField(source='matriz_riesgo.codigo', read_only=True)
    analista_nombre = serializers.CharField(source='analista_asignado.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = SenalAlerta
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_display',
            'descripcion', 'severidad', 'severidad_display', 'criterios_deteccion',
            'es_catalogo', 'matriz_riesgo', 'matriz_riesgo_codigo',
            'fecha_deteccion', 'origen_deteccion', 'evidencia', 'monto_involucrado',
            'analista_asignado', 'analista_nombre', 'fecha_analisis', 'resultado_analisis',
            'estado', 'estado_display', 'requiere_ros', 'normativa_aplicable',
            'is_active', 'empresa_id', 'created_by', 'created_by_nombre',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']


# =============================================================================
# Reporte Operación Sospechosa (ROS) Serializers
# =============================================================================
class ReporteOperacionSospechosaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de ROS"""
    tipo_operacion_display = serializers.CharField(source='get_tipo_operacion_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    total_senales = serializers.SerializerMethodField()

    class Meta:
        model = ReporteOperacionSospechosa
        fields = [
            'id', 'numero_ros', 'fecha_deteccion', 'tipo_operacion', 'tipo_operacion_display',
            'nombre_reportado', 'identificacion_reportado', 'monto_total', 'moneda',
            'estado', 'estado_display', 'total_senales', 'fecha_envio_uiaf'
        ]

    def get_total_senales(self, obj):
        return obj.senales_alerta.count()


class ReporteOperacionSospechosaDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de ROS"""
    tipo_operacion_display = serializers.CharField(source='get_tipo_operacion_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    matriz_riesgo_codigo = serializers.CharField(source='matriz_riesgo.codigo', read_only=True)
    elaborado_por_nombre = serializers.CharField(source='elaborado_por.get_full_name', read_only=True)
    revisado_por_nombre = serializers.CharField(source='revisado_por.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    senales_detail = SenalAlertaListSerializer(source='senales_alerta', many=True, read_only=True)

    class Meta:
        model = ReporteOperacionSospechosa
        fields = [
            'id', 'numero_ros', 'fecha_deteccion', 'tipo_operacion', 'tipo_operacion_display',
            'matriz_riesgo', 'matriz_riesgo_codigo', 'nombre_reportado',
            'identificacion_reportado', 'tipo_identificacion',
            'senales_alerta', 'senales_detail',
            'descripcion_operacion', 'monto_total', 'moneda', 'periodo_operaciones',
            'analisis_detallado', 'fundamentos_sospecha', 'documentos_soporte',
            'elaborado_por', 'elaborado_por_nombre', 'fecha_elaboracion',
            'revisado_por', 'revisado_por_nombre', 'fecha_revision',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'fecha_envio_uiaf', 'numero_radicado_uiaf', 'respuesta_uiaf',
            'estado', 'estado_display', 'observaciones',
            'empresa_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa_id', 'created_at', 'updated_at']


# =============================================================================
# Debida Diligencia Serializers
# =============================================================================
class DebidaDiligenciaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de debidas diligencias"""
    tipo_display = serializers.CharField(source='get_tipo_diligencia_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    evaluado_nombre = serializers.CharField(source='matriz_riesgo.nombre_evaluado', read_only=True)

    class Meta:
        model = DebidaDiligencia
        fields = [
            'id', 'codigo', 'tipo_diligencia', 'tipo_display',
            'evaluado_nombre', 'fecha_inicio', 'fecha_vencimiento',
            'porcentaje_completitud', 'estado', 'estado_display',
            'es_pep', 'verificacion_identidad_realizada'
        ]


class DebidaDiligenciaDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de debidas diligencias"""
    tipo_display = serializers.CharField(source='get_tipo_diligencia_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    matriz_riesgo_codigo = serializers.CharField(source='matriz_riesgo.codigo', read_only=True)
    evaluado_nombre = serializers.CharField(source='matriz_riesgo.nombre_evaluado', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = DebidaDiligencia
        fields = [
            'id', 'codigo', 'matriz_riesgo', 'matriz_riesgo_codigo', 'evaluado_nombre',
            'tipo_diligencia', 'tipo_display',
            'fecha_inicio', 'fecha_vencimiento', 'fecha_completada', 'proxima_actualizacion',
            'documentos_requeridos', 'documentos_recibidos', 'porcentaje_completitud',
            'verificacion_identidad_realizada', 'metodo_verificacion', 'fecha_verificacion_identidad',
            'consulta_listas_onu', 'consulta_listas_ofac', 'consulta_listas_clinton',
            'consulta_listas_nacionales', 'fecha_consulta_listas', 'resultado_listas',
            'es_pep', 'detalles_pep', 'origen_fondos_declarado', 'origen_fondos_verificado',
            'referencias_comerciales', 'referencias_bancarias',
            'requiere_visita', 'fecha_visita', 'informe_visita',
            'responsable', 'responsable_nombre',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'estado', 'estado_display', 'observaciones', 'motivo_rechazo',
            'empresa_id', 'created_by', 'created_by_nombre', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'porcentaje_completitud', 'empresa_id', 'created_by', 'created_at', 'updated_at'
        ]
