from rest_framework import serializers
from .models import (
    MetricaFlujo,
    AlertaFlujo,
    ReglaSLA,
    DashboardWidget,
    ReporteAutomatico
)


class MetricaFlujoSerializer(serializers.ModelSerializer):
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True)
    tasa_completadas = serializers.SerializerMethodField()
    tasa_canceladas = serializers.SerializerMethodField()
    tasa_completadas_tareas = serializers.SerializerMethodField()

    class Meta:
        model = MetricaFlujo
        fields = [
            'id',
            'plantilla',
            'plantilla_nombre',
            'periodo',
            'fecha_inicio',
            'fecha_fin',
            'total_instancias',
            'instancias_completadas',
            'instancias_canceladas',
            'tiempo_promedio_dias',
            'tareas_totales',
            'tareas_completadas',
            'tareas_rechazadas',
            'cuellos_botella',
            'tasa_completadas',
            'tasa_canceladas',
            'tasa_completadas_tareas',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_tasa_completadas(self, obj):
        if obj.total_instancias > 0:
            return round((obj.instancias_completadas / obj.total_instancias) * 100, 2)
        return 0

    def get_tasa_canceladas(self, obj):
        if obj.total_instancias > 0:
            return round((obj.instancias_canceladas / obj.total_instancias) * 100, 2)
        return 0

    def get_tasa_completadas_tareas(self, obj):
        if obj.tareas_totales > 0:
            return round((obj.tareas_completadas / obj.tareas_totales) * 100, 2)
        return 0


class AlertaFlujoSerializer(serializers.ModelSerializer):
    instancia_codigo = serializers.CharField(source='instancia.codigo_instancia', read_only=True)
    tarea_codigo = serializers.CharField(source='tarea.codigo_tarea', read_only=True)
    atendida_por_nombre = serializers.CharField(
        source='atendida_por.get_full_name',
        read_only=True
    )
    tiempo_sin_atender = serializers.SerializerMethodField()

    class Meta:
        model = AlertaFlujo
        fields = [
            'id',
            'tipo',
            'severidad',
            'instancia',
            'instancia_codigo',
            'tarea',
            'tarea_codigo',
            'titulo',
            'descripcion',
            'fecha_generacion',
            'fecha_atencion',
            'atendida_por',
            'atendida_por_nombre',
            'acciones_tomadas',
            'estado',
            'tiempo_sin_atender',
            'empresa_id',
            'created_at',
        ]
        read_only_fields = ['fecha_generacion', 'empresa_id', 'created_at']

    def get_tiempo_sin_atender(self, obj):
        if obj.estado == 'ACTIVA':
            from django.utils import timezone
            delta = timezone.now() - obj.fecha_generacion
            return round(delta.total_seconds() / 3600, 2)  # Horas
        return None


class ReglaSLASerializer(serializers.ModelSerializer):
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True)
    nodo_nombre = serializers.CharField(source='nodo.nombre', read_only=True)

    class Meta:
        model = ReglaSLA
        fields = [
            'id',
            'plantilla',
            'plantilla_nombre',
            'nodo',
            'nodo_nombre',
            'nombre',
            'tiempo_limite_horas',
            'tiempo_alerta_horas',
            'accion_vencimiento',
            'destinatarios_alerta',
            'is_active',
            'empresa_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['empresa_id', 'created_at', 'updated_at']

    def validate(self, data):
        tiempo_alerta = data.get('tiempo_alerta_horas')
        tiempo_limite = data.get('tiempo_limite_horas')
        if tiempo_alerta and tiempo_limite and tiempo_alerta >= tiempo_limite:
            raise serializers.ValidationError({
                'tiempo_alerta_horas': 'El tiempo de alerta debe ser menor al tiempo límite'
            })
        return data


class DashboardWidgetSerializer(serializers.ModelSerializer):
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = DashboardWidget
        fields = [
            'id',
            'nombre',
            'tipo',
            'configuracion',
            'posicion_x',
            'posicion_y',
            'ancho',
            'alto',
            'is_active',
            'empresa_id',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']


class ReporteAutomaticoSerializer(serializers.ModelSerializer):
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    ultima_generacion = serializers.SerializerMethodField()

    class Meta:
        model = ReporteAutomatico
        fields = [
            'id',
            'nombre',
            'descripcion',
            'tipo_reporte',
            'plantillas',
            'formato_salida',
            'frecuencia',
            'dia_semana',
            'dia_mes',
            'hora_ejecucion',
            'destinatarios',
            'filtros',
            'columnas',
            'is_active',
            'ultima_generacion',
            'empresa_id',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']

    def get_ultima_generacion(self, obj):
        # Se podría implementar buscando el último log de generación
        return None

    def validate(self, data):
        frecuencia = data.get('frecuencia')
        dia_semana = data.get('dia_semana')
        dia_mes = data.get('dia_mes')

        if frecuencia == 'SEMANAL' and dia_semana is None:
            raise serializers.ValidationError({
                'dia_semana': 'Debe especificar el día de la semana para frecuencia semanal'
            })

        if frecuencia == 'MENSUAL' and dia_mes is None:
            raise serializers.ValidationError({
                'dia_mes': 'Debe especificar el día del mes para frecuencia mensual'
            })

        return data
