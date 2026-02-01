"""
Serializers de Control de Tiempo - Talent Hub
"""
from rest_framework import serializers
from .models import Turno, AsignacionTurno, RegistroAsistencia, HoraExtra, ConsolidadoAsistencia


class TurnoListSerializer(serializers.ModelSerializer):
    """List serializer for Turno"""
    class Meta:
        model = Turno
        fields = ['id', 'codigo', 'nombre', 'hora_inicio', 'hora_fin', 'duracion_jornada',
                  'aplica_recargo_nocturno', 'dias_semana', 'color', 'is_active']
        read_only_fields = ['id']


class TurnoDetailSerializer(serializers.ModelSerializer):
    """Detail serializer for Turno"""
    es_nocturno = serializers.BooleanField(read_only=True)
    duracion_calculada = serializers.DecimalField(max_digits=4, decimal_places=2, read_only=True)
    
    class Meta:
        model = Turno
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']


class AsignacionTurnoSerializer(serializers.ModelSerializer):
    """Serializer for AsignacionTurno"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    turno_nombre = serializers.CharField(source='turno.nombre', read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = AsignacionTurno
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']


class RegistroAsistenciaSerializer(serializers.ModelSerializer):
    """Serializer for RegistroAsistencia"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    turno_nombre = serializers.CharField(source='turno.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    horas_trabajadas = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = RegistroAsistencia
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'minutos_tardanza', 'created_at', 'updated_at']


class HoraExtraSerializer(serializers.ModelSerializer):
    """Serializer for HoraExtra"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    valor_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = HoraExtra
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'horas_trabajadas', 'factor_recargo',
                           'aprobado', 'aprobado_por', 'fecha_aprobacion', 'created_at', 'updated_at']


class ConsolidadoAsistenciaSerializer(serializers.ModelSerializer):
    """Serializer for ConsolidadoAsistencia"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    nombre_mes = serializers.CharField(read_only=True)
    
    class Meta:
        model = ConsolidadoAsistencia
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'dias_trabajados', 'dias_ausente', 'dias_tardanza',
                           'total_horas_trabajadas', 'total_horas_extras', 'total_minutos_tardanza',
                           'porcentaje_asistencia', 'cerrado', 'cerrado_por', 'fecha_cierre',
                           'created_at', 'updated_at']
