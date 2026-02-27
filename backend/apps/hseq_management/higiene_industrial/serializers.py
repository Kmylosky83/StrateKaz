"""
Serializers para Higiene Industrial - HSEQ Management
"""
from rest_framework import serializers
from .models import (
    TipoAgente,
    AgenteRiesgo,
    GrupoExposicionSimilar,
    PuntoMedicion,
    MedicionAmbiental,
    ControlExposicion,
    MonitoreoBiologico
)


class TipoAgenteSerializer(serializers.ModelSerializer):
    """Serializer para Tipos de Agente"""
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = TipoAgente
        fields = [
            'id', 'empresa_id', 'codigo', 'nombre', 'categoria', 'categoria_display',
            'descripcion', 'normativa_aplicable', 'is_active',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }


class AgenteRiesgoSerializer(serializers.ModelSerializer):
    """Serializer para Agentes de Riesgo"""
    tipo_agente_nombre = serializers.CharField(source='tipo_agente.nombre', read_only=True)
    tipo_agente_categoria = serializers.CharField(source='tipo_agente.categoria', read_only=True)

    class Meta:
        model = AgenteRiesgo
        fields = [
            'id', 'empresa_id', 'tipo_agente', 'tipo_agente_nombre', 'tipo_agente_categoria',
            'codigo', 'nombre', 'descripcion',
            'limite_permisible', 'unidad_medida', 'tiempo_exposicion_referencia',
            'efectos_salud',
            'via_respiratoria', 'via_dermica', 'via_digestiva', 'via_parenteral',
            'normativa_referencia', 'is_active',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validar que el tipo_agente pertenezca a la misma empresa"""
        if 'tipo_agente' in data and 'empresa_id' in data:
            if data['tipo_agente'].empresa_id != data['empresa_id']:
                raise serializers.ValidationError({
                    'tipo_agente': 'El tipo de agente debe pertenecer a la misma empresa'
                })
        return data


class AgenteRiesgoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    tipo_agente_nombre = serializers.CharField(source='tipo_agente.nombre', read_only=True)

    class Meta:
        model = AgenteRiesgo
        fields = ['id', 'codigo', 'nombre', 'tipo_agente_nombre', 'unidad_medida', 'limite_permisible']


class GrupoExposicionSimilarSerializer(serializers.ModelSerializer):
    """Serializer para Grupos de Exposición Similar (GES)"""
    agentes_riesgo_detalle = AgenteRiesgoListSerializer(source='agentes_riesgo', many=True, read_only=True)
    total_horas_semanales = serializers.SerializerMethodField()

    class Meta:
        model = GrupoExposicionSimilar
        fields = [
            'id', 'empresa_id', 'codigo', 'nombre', 'descripcion',
            'area', 'proceso', 'numero_trabajadores',
            'agentes_riesgo', 'agentes_riesgo_detalle',
            'horas_dia', 'dias_semana', 'total_horas_semanales',
            'observaciones', 'is_active',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_horas_semanales(self, obj):
        """Calcular total de horas semanales"""
        return float(obj.horas_dia) * obj.dias_semana


class PuntoMedicionSerializer(serializers.ModelSerializer):
    """Serializer para Puntos de Medición"""
    grupo_exposicion_nombre = serializers.CharField(source='grupo_exposicion.nombre', read_only=True)

    class Meta:
        model = PuntoMedicion
        fields = [
            'id', 'empresa_id', 'codigo', 'nombre',
            'area', 'seccion',
            'coordenadas_x', 'coordenadas_y', 'coordenadas_z',
            'grupo_exposicion', 'grupo_exposicion_nombre',
            'descripcion', 'observaciones', 'is_active',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MedicionAmbientalSerializer(serializers.ModelSerializer):
    """Serializer para Mediciones Ambientales"""
    agente_riesgo_nombre = serializers.CharField(source='agente_riesgo.nombre', read_only=True)
    punto_medicion_nombre = serializers.CharField(source='punto_medicion.nombre', read_only=True)
    grupo_exposicion_nombre = serializers.CharField(source='grupo_exposicion.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cumplimiento_display = serializers.CharField(source='get_cumplimiento_display', read_only=True)

    class Meta:
        model = MedicionAmbiental
        fields = [
            'id', 'empresa_id', 'numero_medicion',
            'agente_riesgo', 'agente_riesgo_nombre',
            'punto_medicion', 'punto_medicion_nombre',
            'grupo_exposicion', 'grupo_exposicion_nombre',
            'fecha_medicion', 'hora_inicio', 'hora_fin', 'duracion_minutos',
            'valor_medido', 'unidad_medida',
            'limite_permisible_aplicable',
            'cumplimiento', 'cumplimiento_display', 'porcentaje_limite',
            'temperatura_ambiente', 'humedad_relativa', 'presion_atmosferica',
            'equipo_utilizado', 'numero_serie', 'fecha_calibracion',
            'realizado_por', 'licencia_profesional',
            'estado', 'estado_display',
            'observaciones', 'recomendaciones',
            'informe_adjunto',
            'fecha_proxima_medicion',
            'is_active',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'cumplimiento', 'porcentaje_limite']

    def validate(self, data):
        """Validaciones cruzadas"""
        # Validar que todos los elementos pertenezcan a la misma empresa
        empresa_id = data.get('empresa_id')

        if 'agente_riesgo' in data:
            if data['agente_riesgo'].empresa_id != empresa_id:
                raise serializers.ValidationError({
                    'agente_riesgo': 'El agente de riesgo debe pertenecer a la misma empresa'
                })

        if 'punto_medicion' in data:
            if data['punto_medicion'].empresa_id != empresa_id:
                raise serializers.ValidationError({
                    'punto_medicion': 'El punto de medición debe pertenecer a la misma empresa'
                })

        # Validar que hora_fin sea posterior a hora_inicio
        if 'hora_inicio' in data and 'hora_fin' in data and data['hora_fin']:
            if data['hora_fin'] <= data['hora_inicio']:
                raise serializers.ValidationError({
                    'hora_fin': 'La hora de fin debe ser posterior a la hora de inicio'
                })

        return data


class MedicionAmbientalListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de mediciones"""
    agente_riesgo_nombre = serializers.CharField(source='agente_riesgo.nombre', read_only=True)
    punto_medicion_nombre = serializers.CharField(source='punto_medicion.nombre', read_only=True)
    cumplimiento_display = serializers.CharField(source='get_cumplimiento_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = MedicionAmbiental
        fields = [
            'id', 'numero_medicion', 'fecha_medicion',
            'agente_riesgo_nombre', 'punto_medicion_nombre',
            'valor_medido', 'unidad_medida',
            'cumplimiento', 'cumplimiento_display',
            'porcentaje_limite',
            'estado', 'estado_display'
        ]


class RegistrarMedicionSerializer(serializers.Serializer):
    """Serializer para action de registrar medición"""
    agente_riesgo_id = serializers.IntegerField()
    punto_medicion_id = serializers.IntegerField()
    grupo_exposicion_id = serializers.IntegerField(required=False, allow_null=True)
    fecha_medicion = serializers.DateField()
    hora_inicio = serializers.TimeField()
    hora_fin = serializers.TimeField(required=False, allow_null=True)
    duracion_minutos = serializers.IntegerField(required=False, allow_null=True)
    valor_medido = serializers.DecimalField(max_digits=12, decimal_places=4)
    unidad_medida = serializers.CharField(max_length=50)
    temperatura_ambiente = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    humedad_relativa = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    presion_atmosferica = serializers.DecimalField(max_digits=7, decimal_places=2, required=False, allow_null=True)
    equipo_utilizado = serializers.CharField(max_length=200, required=False, allow_blank=True)
    numero_serie = serializers.CharField(max_length=100, required=False, allow_blank=True)
    fecha_calibracion = serializers.DateField(required=False, allow_null=True)
    realizado_por = serializers.CharField(max_length=200, required=False, allow_blank=True)
    licencia_profesional = serializers.CharField(max_length=100, required=False, allow_blank=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)


class EvaluarCumplimientoSerializer(serializers.Serializer):
    """Serializer para action de evaluar cumplimiento"""
    medicion_id = serializers.IntegerField()
    limite_permisible_aplicable = serializers.DecimalField(
        max_digits=12,
        decimal_places=4,
        required=False,
        allow_null=True
    )


class ControlExposicionSerializer(serializers.ModelSerializer):
    """Serializer para Controles de Exposición"""
    agente_riesgo_nombre = serializers.CharField(source='agente_riesgo.nombre', read_only=True)
    jerarquia_control_display = serializers.CharField(source='get_jerarquia_control_display', read_only=True)
    tipo_control_display = serializers.CharField(source='get_tipo_control_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    grupos_exposicion_detalle = GrupoExposicionSimilarSerializer(
        source='grupos_exposicion',
        many=True,
        read_only=True
    )
    puntos_medicion_detalle = PuntoMedicionSerializer(
        source='puntos_medicion',
        many=True,
        read_only=True
    )

    class Meta:
        model = ControlExposicion
        fields = [
            'id', 'empresa_id', 'codigo', 'nombre', 'descripcion',
            'jerarquia_control', 'jerarquia_control_display',
            'tipo_control', 'tipo_control_display',
            'agente_riesgo', 'agente_riesgo_nombre',
            'area_aplicacion',
            'grupos_exposicion', 'grupos_exposicion_detalle',
            'puntos_medicion', 'puntos_medicion_detalle',
            'fecha_implementacion', 'responsable_implementacion',
            'efectividad_esperada', 'efectividad_medida', 'fecha_medicion_efectividad',
            'requiere_mantenimiento', 'frecuencia_mantenimiento',
            'fecha_ultimo_mantenimiento', 'fecha_proximo_mantenimiento',
            'costo_implementacion', 'costo_mantenimiento_anual',
            'estado', 'estado_display',
            'observaciones', 'is_active',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }


class ControlExposicionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de controles"""
    agente_riesgo_nombre = serializers.CharField(source='agente_riesgo.nombre', read_only=True)
    jerarquia_control_display = serializers.CharField(source='get_jerarquia_control_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = ControlExposicion
        fields = [
            'id', 'codigo', 'nombre',
            'agente_riesgo_nombre',
            'jerarquia_control', 'jerarquia_control_display',
            'efectividad_medida',
            'estado', 'estado_display'
        ]


class MonitoreoBiologicoSerializer(serializers.ModelSerializer):
    """Serializer para Monitoreo Biológico"""
    grupo_exposicion_nombre = serializers.CharField(source='grupo_exposicion.nombre', read_only=True)
    agentes_riesgo_detalle = AgenteRiesgoListSerializer(source='agentes_riesgo', many=True, read_only=True)
    tipo_examen_display = serializers.CharField(source='get_tipo_examen_display', read_only=True)
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)

    class Meta:
        model = MonitoreoBiologico
        fields = [
            'id', 'empresa_id', 'numero_examen',
            'trabajador_nombre', 'trabajador_identificacion', 'trabajador_cargo',
            'grupo_exposicion', 'grupo_exposicion_nombre',
            'agentes_riesgo', 'agentes_riesgo_detalle',
            'tipo_examen', 'tipo_examen_display',
            'fecha_examen',
            'examenes_realizados',
            'indicador_biologico', 'valor_medido', 'unidad_medida', 'valor_referencia',
            'resultado', 'resultado_display',
            'hallazgos', 'recomendaciones', 'restricciones',
            'medico_responsable', 'licencia_medica', 'ips_entidad',
            'requiere_seguimiento', 'fecha_proximo_examen',
            'informe_adjunto',
            'observaciones', 'is_active',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MonitoreoBiologicoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de monitoreo biológico"""
    tipo_examen_display = serializers.CharField(source='get_tipo_examen_display', read_only=True)
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)

    class Meta:
        model = MonitoreoBiologico
        fields = [
            'id', 'numero_examen',
            'trabajador_nombre', 'trabajador_identificacion',
            'tipo_examen', 'tipo_examen_display',
            'fecha_examen',
            'resultado', 'resultado_display',
            'requiere_seguimiento'
        ]


# Serializers para estadísticas y reportes
class EstadisticasMedicionesSerializer(serializers.Serializer):
    """Serializer para estadísticas de mediciones"""
    total_mediciones = serializers.IntegerField()
    mediciones_cumple = serializers.IntegerField()
    mediciones_no_cumple = serializers.IntegerField()
    mediciones_pendientes = serializers.IntegerField()
    porcentaje_cumplimiento = serializers.DecimalField(max_digits=5, decimal_places=2)
    agentes_criticos = serializers.ListField()


class EstadisticasControlesSerializer(serializers.Serializer):
    """Serializer para estadísticas de controles"""
    total_controles = serializers.IntegerField()
    controles_implementados = serializers.IntegerField()
    controles_planificados = serializers.IntegerField()
    efectividad_promedio = serializers.DecimalField(max_digits=5, decimal_places=2)
    distribucion_jerarquia = serializers.DictField()
