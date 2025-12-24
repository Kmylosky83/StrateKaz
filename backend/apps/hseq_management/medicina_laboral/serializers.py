"""
Serializers para Medicina Laboral - HSEQ Management

Serializers para los modelos de medicina laboral y vigilancia epidemiológica
"""
from rest_framework import serializers
from .models import (
    TipoExamen,
    ExamenMedico,
    RestriccionMedica,
    ProgramaVigilancia,
    CasoVigilancia,
    DiagnosticoOcupacional,
    EstadisticaMedica
)


class TipoExamenSerializer(serializers.ModelSerializer):
    """Serializer para TipoExamen"""

    class Meta:
        model = TipoExamen
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'descripcion',
            'periodicidad', 'meses_periodicidad',
            'incluye_clinico', 'incluye_laboratorio', 'incluye_paraclinicos',
            'incluye_audiometria', 'incluye_visiometria', 'incluye_espirometria',
            'enfasis_osteomuscular', 'enfasis_cardiovascular',
            'enfasis_respiratorio', 'enfasis_neurologico',
            'observaciones', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validaciones personalizadas"""
        if data.get('periodicidad') == 'PERSONALIZADO' and not data.get('meses_periodicidad'):
            raise serializers.ValidationError({
                'meses_periodicidad': 'Debe especificar los meses para periodicidad personalizada'
            })
        return data


class TipoExamenListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de tipos de examen"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    periodicidad_display = serializers.CharField(source='get_periodicidad_display', read_only=True)

    class Meta:
        model = TipoExamen
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'periodicidad', 'periodicidad_display', 'is_active'
        ]


class ExamenMedicoSerializer(serializers.ModelSerializer):
    """Serializer para ExamenMedico"""
    tipo_examen_nombre = serializers.CharField(source='tipo_examen.nombre', read_only=True)
    concepto_aptitud_display = serializers.CharField(source='get_concepto_aptitud_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = ExamenMedico
        fields = [
            'id', 'empresa_id', 'numero_examen', 'tipo_examen', 'tipo_examen_nombre',
            'colaborador_id', 'cargo_id', 'fecha_programada', 'fecha_realizado',
            'entidad_prestadora', 'medico_evaluador', 'licencia_medica',
            'concepto_aptitud', 'concepto_aptitud_display', 'hallazgos_relevantes',
            'recomendaciones', 'diagnosticos', 'requiere_restricciones',
            'restricciones_temporales', 'restricciones_permanentes',
            'requiere_seguimiento', 'tipo_seguimiento', 'fecha_proximo_control',
            'archivo_resultado', 'estado', 'estado_display', 'costo_examen',
            'observaciones', 'created_by_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'numero_examen', 'created_at', 'updated_at']

    def validate(self, data):
        """Validaciones personalizadas"""
        if data.get('estado') == 'COMPLETADO' and not data.get('fecha_realizado'):
            raise serializers.ValidationError({
                'fecha_realizado': 'Debe especificar la fecha de realización para exámenes completados'
            })

        if data.get('concepto_aptitud') != 'PENDIENTE' and not data.get('fecha_realizado'):
            raise serializers.ValidationError({
                'concepto_aptitud': 'No puede asignar concepto sin fecha de realización'
            })
        return data


class ExamenMedicoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de exámenes médicos"""
    tipo_examen_nombre = serializers.CharField(source='tipo_examen.nombre', read_only=True)
    concepto_aptitud_display = serializers.CharField(source='get_concepto_aptitud_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = ExamenMedico
        fields = [
            'id', 'numero_examen', 'tipo_examen_nombre', 'colaborador_id',
            'fecha_programada', 'fecha_realizado', 'concepto_aptitud',
            'concepto_aptitud_display', 'estado', 'estado_display'
        ]


class RestriccionMedicaSerializer(serializers.ModelSerializer):
    """Serializer para RestriccionMedica"""
    tipo_restriccion_display = serializers.CharField(source='get_tipo_restriccion_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    esta_vigente = serializers.ReadOnlyField()
    examen_medico_numero = serializers.CharField(source='examen_medico.numero_examen', read_only=True)

    class Meta:
        model = RestriccionMedica
        fields = [
            'id', 'empresa_id', 'codigo_restriccion', 'examen_medico',
            'examen_medico_numero', 'colaborador_id', 'cargo_id',
            'tipo_restriccion', 'tipo_restriccion_display', 'categoria',
            'categoria_display', 'descripcion', 'actividades_restringidas',
            'fecha_inicio', 'fecha_fin', 'medico_ordena', 'licencia_medica',
            'requiere_evaluacion_periodica', 'frecuencia_evaluacion_meses',
            'proxima_evaluacion', 'ajuste_realizado', 'descripcion_ajuste',
            'estado', 'estado_display', 'fecha_levantamiento', 'motivo_levantamiento',
            'archivo_soporte', 'observaciones', 'esta_vigente',
            'created_by_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'codigo_restriccion', 'esta_vigente', 'created_at', 'updated_at']

    def validate(self, data):
        """Validaciones personalizadas"""
        if data.get('tipo_restriccion') == 'TEMPORAL' and not data.get('fecha_fin'):
            raise serializers.ValidationError({
                'fecha_fin': 'Las restricciones temporales deben tener fecha de fin'
            })

        if data.get('tipo_restriccion') == 'PERMANENTE' and data.get('fecha_fin'):
            raise serializers.ValidationError({
                'fecha_fin': 'Las restricciones permanentes no deben tener fecha de fin'
            })
        return data


class RestriccionMedicaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de restricciones"""
    tipo_restriccion_display = serializers.CharField(source='get_tipo_restriccion_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    esta_vigente = serializers.ReadOnlyField()

    class Meta:
        model = RestriccionMedica
        fields = [
            'id', 'codigo_restriccion', 'colaborador_id', 'tipo_restriccion',
            'tipo_restriccion_display', 'categoria', 'categoria_display',
            'fecha_inicio', 'fecha_fin', 'estado', 'estado_display', 'esta_vigente'
        ]


class ProgramaVigilanciaSerializer(serializers.ModelSerializer):
    """Serializer para ProgramaVigilancia"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    casos_activos_count = serializers.ReadOnlyField()

    class Meta:
        model = ProgramaVigilancia
        fields = [
            'id', 'empresa_id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'descripcion', 'objetivo', 'alcance', 'cargos_aplicables',
            'areas_aplicables', 'actividades_vigilancia',
            'frecuencia_evaluacion_meses', 'indicadores', 'fecha_inicio',
            'fecha_revision', 'proxima_revision', 'responsable_id',
            'estado', 'estado_display', 'archivo_programa', 'observaciones',
            'casos_activos_count', 'created_by_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'casos_activos_count', 'created_at', 'updated_at']


class ProgramaVigilanciaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de programas"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    casos_activos_count = serializers.ReadOnlyField()

    class Meta:
        model = ProgramaVigilancia
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'estado', 'estado_display', 'casos_activos_count',
            'fecha_inicio', 'proxima_revision'
        ]


class CasoVigilanciaSerializer(serializers.ModelSerializer):
    """Serializer para CasoVigilancia"""
    programa_nombre = serializers.CharField(source='programa.nombre', read_only=True)
    programa_tipo = serializers.CharField(source='programa.tipo', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = CasoVigilancia
        fields = [
            'id', 'empresa_id', 'numero_caso', 'programa', 'programa_nombre',
            'programa_tipo', 'colaborador_id', 'cargo_id', 'fecha_apertura',
            'descripcion_caso', 'severidad', 'severidad_display',
            'diagnosticos_cie10', 'factores_riesgo_identificados',
            'exposicion_laboral', 'plan_intervencion', 'acciones_implementadas',
            'seguimientos', 'fecha_ultimo_seguimiento', 'fecha_proximo_seguimiento',
            'fecha_cierre', 'motivo_cierre', 'resultado_final', 'estado',
            'estado_display', 'archivo_adjunto', 'observaciones',
            'created_by_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'numero_caso', 'created_at', 'updated_at']


class CasoVigilanciaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de casos"""
    programa_nombre = serializers.CharField(source='programa.nombre', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = CasoVigilancia
        fields = [
            'id', 'numero_caso', 'programa_nombre', 'colaborador_id',
            'fecha_apertura', 'severidad', 'severidad_display',
            'estado', 'estado_display', 'fecha_proximo_seguimiento'
        ]


class RegistrarSeguimientoSerializer(serializers.Serializer):
    """Serializer para registrar seguimiento en caso de vigilancia"""
    descripcion = serializers.CharField(
        required=True,
        help_text='Descripción del seguimiento realizado'
    )
    responsable_id = serializers.IntegerField(
        required=True,
        help_text='ID del usuario responsable del seguimiento'
    )

    def create(self, validated_data):
        """No crear, solo validar"""
        raise NotImplementedError('Use el action registrar_seguimiento')

    def update(self, instance, validated_data):
        """No actualizar, solo validar"""
        raise NotImplementedError('Use el action registrar_seguimiento')


class CerrarCasoSerializer(serializers.Serializer):
    """Serializer para cerrar caso de vigilancia"""
    motivo = serializers.CharField(
        required=True,
        help_text='Motivo del cierre del caso'
    )
    resultado = serializers.CharField(
        required=True,
        help_text='Resultado final y conclusiones del caso'
    )

    def create(self, validated_data):
        """No crear, solo validar"""
        raise NotImplementedError('Use el action cerrar_caso')

    def update(self, instance, validated_data):
        """No actualizar, solo validar"""
        raise NotImplementedError('Use el action cerrar_caso')


class DiagnosticoOcupacionalSerializer(serializers.ModelSerializer):
    """Serializer para DiagnosticoOcupacional"""
    origen_display = serializers.CharField(source='get_origen_display', read_only=True)

    class Meta:
        model = DiagnosticoOcupacional
        fields = [
            'id', 'codigo_cie10', 'nombre', 'descripcion', 'categoria',
            'origen', 'origen_display', 'riesgos_relacionados',
            'requiere_vigilancia', 'programa_vigilancia_sugerido',
            'requiere_reporte_arl', 'requiere_reporte_secretaria',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DiagnosticoOcupacionalListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de diagnósticos"""
    origen_display = serializers.CharField(source='get_origen_display', read_only=True)

    class Meta:
        model = DiagnosticoOcupacional
        fields = [
            'id', 'codigo_cie10', 'nombre', 'categoria', 'origen',
            'origen_display', 'requiere_vigilancia', 'is_active'
        ]


class EstadisticaMedicaSerializer(serializers.ModelSerializer):
    """Serializer para EstadisticaMedica"""

    class Meta:
        model = EstadisticaMedica
        fields = [
            'id', 'empresa_id', 'anio', 'mes', 'total_colaboradores',
            'examenes_realizados', 'examenes_ingreso', 'examenes_periodicos',
            'examenes_egreso', 'aptos', 'aptos_con_restricciones',
            'no_aptos_temporal', 'no_aptos_permanente', 'restricciones_activas',
            'restricciones_nuevas', 'restricciones_levantadas',
            'casos_vigilancia_activos', 'casos_nuevos', 'casos_cerrados',
            'diagnosticos_ocupacionales', 'diagnosticos_comunes',
            'top_diagnosticos', 'porcentaje_aptitud', 'porcentaje_cobertura_examenes',
            'costo_total_examenes', 'observaciones', 'created_by_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'porcentaje_aptitud', 'porcentaje_cobertura_examenes',
            'created_at', 'updated_at'
        ]


class EstadisticaMedicaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de estadísticas"""
    periodo = serializers.SerializerMethodField()

    class Meta:
        model = EstadisticaMedica
        fields = [
            'id', 'anio', 'mes', 'periodo', 'total_colaboradores',
            'examenes_realizados', 'porcentaje_aptitud',
            'porcentaje_cobertura_examenes', 'casos_vigilancia_activos'
        ]

    def get_periodo(self, obj):
        """Retorna período formateado"""
        return f"{obj.anio}-{obj.mes:02d}"
