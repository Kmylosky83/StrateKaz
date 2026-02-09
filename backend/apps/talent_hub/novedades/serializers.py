"""
Serializers de Novedades - Talent Hub

Serializers para gestión de incapacidades, licencias, permisos y vacaciones.
Incluye serializers de lista, detalle y creación.
"""
from rest_framework import serializers
from decimal import Decimal

from .models import (
    TipoIncapacidad,
    Incapacidad,
    TipoLicencia,
    Licencia,
    Permiso,
    PeriodoVacaciones,
    SolicitudVacaciones,
    ConfiguracionDotacion,
    EntregaDotacion
)


# =============================================================================
# TIPOS DE INCAPACIDAD Y LICENCIA
# =============================================================================

class TipoIncapacidadListSerializer(serializers.ModelSerializer):
    """Serializer de lista para tipos de incapacidad"""

    class Meta:
        model = TipoIncapacidad
        fields = [
            'id', 'codigo', 'nombre', 'origen',
            'porcentaje_pago', 'dias_maximos', 'requiere_prorroga',
            'is_active'
        ]


class TipoIncapacidadDetailSerializer(serializers.ModelSerializer):
    """Serializer de detalle para tipos de incapacidad"""

    class Meta:
        model = TipoIncapacidad
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class TipoLicenciaListSerializer(serializers.ModelSerializer):
    """Serializer de lista para tipos de licencia"""

    class Meta:
        model = TipoLicencia
        fields = [
            'id', 'codigo', 'nombre', 'categoria',
            'dias_permitidos', 'requiere_aprobacion',
            'is_active'
        ]


class TipoLicenciaDetailSerializer(serializers.ModelSerializer):
    """Serializer de detalle para tipos de licencia"""

    class Meta:
        model = TipoLicencia
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


# =============================================================================
# INCAPACIDADES
# =============================================================================

class IncapacidadListSerializer(serializers.ModelSerializer):
    """Serializer de lista para incapacidades"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_nombre = serializers.CharField(source='tipo_incapacidad.nombre', read_only=True)
    dias_incapacidad = serializers.IntegerField(read_only=True)
    es_prorroga = serializers.BooleanField(read_only=True)

    class Meta:
        model = Incapacidad
        fields = [
            'id', 'numero_incapacidad', 'colaborador', 'colaborador_nombre',
            'tipo_incapacidad', 'tipo_nombre', 'fecha_inicio', 'fecha_fin',
            'dias_incapacidad', 'eps_arl', 'estado', 'es_prorroga',
            'created_at'
        ]


class IncapacidadDetailSerializer(serializers.ModelSerializer):
    """Serializer de detalle para incapacidades"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_nombre = serializers.CharField(source='tipo_incapacidad.nombre', read_only=True)
    dias_incapacidad = serializers.IntegerField(read_only=True)
    es_prorroga = serializers.BooleanField(read_only=True)
    tiene_prorrogas = serializers.BooleanField(read_only=True)
    dias_totales_con_prorrogas = serializers.IntegerField(read_only=True)

    class Meta:
        model = Incapacidad
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class IncapacidadCreateSerializer(serializers.ModelSerializer):
    """Serializer de creación para incapacidades"""

    class Meta:
        model = Incapacidad
        fields = [
            'colaborador', 'tipo_incapacidad', 'fecha_inicio', 'fecha_fin',
            'diagnostico', 'codigo_cie10', 'eps_arl', 'numero_incapacidad',
            'prorroga_de', 'archivo_soporte', 'observaciones'
        ]

    def validate(self, data):
        """Validaciones adicionales"""
        # Validar fechas
        if data['fecha_fin'] < data['fecha_inicio']:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'
            })

        # Validar prórroga
        if data.get('prorroga_de'):
            if not data['tipo_incapacidad'].requiere_prorroga:
                raise serializers.ValidationError({
                    'prorroga_de': 'Este tipo de incapacidad no permite prórrogas.'
                })
            if data['fecha_inicio'] <= data['prorroga_de'].fecha_fin:
                raise serializers.ValidationError({
                    'fecha_inicio': 'La prórroga debe iniciar después de la incapacidad original.'
                })

        return data


# =============================================================================
# LICENCIAS
# =============================================================================

class LicenciaListSerializer(serializers.ModelSerializer):
    """Serializer de lista para licencias"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_nombre = serializers.CharField(source='tipo_licencia.nombre', read_only=True)
    tipo_categoria = serializers.CharField(source='tipo_licencia.categoria', read_only=True)
    dias_solicitados = serializers.IntegerField(read_only=True)
    esta_aprobada = serializers.BooleanField(read_only=True)

    class Meta:
        model = Licencia
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'tipo_licencia',
            'tipo_nombre', 'tipo_categoria', 'fecha_inicio', 'fecha_fin',
            'dias_solicitados', 'estado', 'esta_aprobada', 'created_at'
        ]


class LicenciaDetailSerializer(serializers.ModelSerializer):
    """Serializer de detalle para licencias"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_nombre = serializers.CharField(source='tipo_licencia.nombre', read_only=True)
    tipo_categoria = serializers.CharField(source='tipo_licencia.categoria', read_only=True)
    dias_solicitados = serializers.IntegerField(read_only=True)
    esta_aprobada = serializers.BooleanField(read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Licencia
        fields = '__all__'
        read_only_fields = [
            'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by',
            'aprobado_por', 'fecha_aprobacion'
        ]


class LicenciaCreateSerializer(serializers.ModelSerializer):
    """Serializer de creación para licencias"""

    class Meta:
        model = Licencia
        fields = [
            'colaborador', 'tipo_licencia', 'fecha_inicio', 'fecha_fin',
            'motivo', 'archivo_soporte'
        ]

    def validate(self, data):
        """Validaciones adicionales"""
        # Validar fechas
        if data['fecha_fin'] < data['fecha_inicio']:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'
            })

        # Validar días permitidos
        tipo_licencia = data['tipo_licencia']
        if tipo_licencia.dias_permitidos:
            dias_solicitados = (data['fecha_fin'] - data['fecha_inicio']).days + 1
            if dias_solicitados > tipo_licencia.dias_permitidos:
                raise serializers.ValidationError({
                    'fecha_fin': f'El tipo de licencia permite máximo {tipo_licencia.dias_permitidos} días.'
                })

        return data


# =============================================================================
# PERMISOS
# =============================================================================

class PermisoListSerializer(serializers.ModelSerializer):
    """Serializer de lista para permisos"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    horas_permiso = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    esta_aprobado = serializers.BooleanField(read_only=True)

    class Meta:
        model = Permiso
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'fecha',
            'hora_salida', 'hora_regreso', 'horas_permiso', 'tipo',
            'compensable', 'estado', 'esta_aprobado', 'created_at'
        ]


class PermisoDetailSerializer(serializers.ModelSerializer):
    """Serializer de detalle para permisos"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    horas_permiso = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    esta_aprobado = serializers.BooleanField(read_only=True)
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Permiso
        fields = '__all__'
        read_only_fields = [
            'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by',
            'aprobado_por'
        ]


class PermisoCreateSerializer(serializers.ModelSerializer):
    """Serializer de creación para permisos"""

    class Meta:
        model = Permiso
        fields = [
            'colaborador', 'fecha', 'hora_salida', 'hora_regreso',
            'motivo', 'tipo', 'compensable'
        ]

    def validate(self, data):
        """Validaciones adicionales"""
        # Validar horarios diferentes
        if data['hora_salida'] == data['hora_regreso']:
            raise serializers.ValidationError({
                'hora_regreso': 'La hora de regreso debe ser diferente a la hora de salida.'
            })

        return data


# =============================================================================
# VACACIONES
# =============================================================================

class PeriodoVacacionesListSerializer(serializers.ModelSerializer):
    """Serializer de lista para períodos de vacaciones"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    dias_pendientes = serializers.DecimalField(max_digits=7, decimal_places=2, read_only=True)

    class Meta:
        model = PeriodoVacaciones
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'fecha_ingreso',
            'dias_derecho_anual', 'dias_acumulados', 'dias_disfrutados',
            'dias_pendientes', 'ultimo_corte'
        ]


class PeriodoVacacionesDetailSerializer(serializers.ModelSerializer):
    """Serializer de detalle para períodos de vacaciones"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    dias_pendientes = serializers.DecimalField(max_digits=7, decimal_places=2, read_only=True)
    dias_acumulados_actualizados = serializers.DecimalField(max_digits=7, decimal_places=2, read_only=True)

    class Meta:
        model = PeriodoVacaciones
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class PeriodoVacacionesCreateSerializer(serializers.ModelSerializer):
    """Serializer de creación para períodos de vacaciones"""

    class Meta:
        model = PeriodoVacaciones
        fields = [
            'colaborador', 'fecha_ingreso', 'dias_derecho_anual',
            'dias_acumulados', 'dias_disfrutados', 'ultimo_corte',
            'observaciones'
        ]


class SolicitudVacacionesListSerializer(serializers.ModelSerializer):
    """Serializer de lista para solicitudes de vacaciones"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    dias_habiles = serializers.IntegerField(read_only=True)
    esta_aprobada = serializers.BooleanField(read_only=True)

    class Meta:
        model = SolicitudVacaciones
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'periodo',
            'fecha_inicio', 'fecha_fin', 'dias_habiles', 'dias_calendario',
            'incluye_prima', 'estado', 'esta_aprobada', 'created_at'
        ]


class SolicitudVacacionesDetailSerializer(serializers.ModelSerializer):
    """Serializer de detalle para solicitudes de vacaciones"""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    dias_habiles = serializers.IntegerField(read_only=True)
    esta_aprobada = serializers.BooleanField(read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )
    periodo_dias_pendientes = serializers.DecimalField(
        source='periodo.dias_pendientes',
        max_digits=7,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = SolicitudVacaciones
        fields = '__all__'
        read_only_fields = [
            'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by',
            'aprobado_por', 'fecha_aprobacion', 'dias_calendario'
        ]


class SolicitudVacacionesCreateSerializer(serializers.ModelSerializer):
    """Serializer de creación para solicitudes de vacaciones"""

    class Meta:
        model = SolicitudVacaciones
        fields = [
            'colaborador', 'periodo', 'fecha_inicio', 'fecha_fin',
            'incluye_prima', 'observaciones'
        ]

    def validate(self, data):
        """Validaciones adicionales"""
        # Validar fechas
        if data['fecha_fin'] < data['fecha_inicio']:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'
            })

        # Calcular días hábiles (simplificado)
        from datetime import timedelta
        dias_habiles = 0
        fecha_actual = data['fecha_inicio']
        while fecha_actual <= data['fecha_fin']:
            if fecha_actual.weekday() < 5:  # Lunes a Viernes
                dias_habiles += 1
            fecha_actual += timedelta(days=1)

        # Validar días disponibles
        periodo = data['periodo']
        if dias_habiles > periodo.dias_pendientes:
            raise serializers.ValidationError({
                'fecha_fin': f'Solo tiene {periodo.dias_pendientes} días disponibles.'
            })

        # Validar período pertenece a colaborador
        if periodo.colaborador != data['colaborador']:
            raise serializers.ValidationError({
                'periodo': 'El período no pertenece al colaborador seleccionado.'
            })

        return data


# =============================================================================
# DOTACION - Art. 230 CST
# =============================================================================

class ConfiguracionDotacionSerializer(serializers.ModelSerializer):
    """Serializer para configuracion de dotacion."""

    class Meta:
        model = ConfiguracionDotacion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class EntregaDotacionListSerializer(serializers.ModelSerializer):
    """Serializer de lista para entregas de dotacion."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    periodo_display = serializers.CharField(source='get_periodo_display', read_only=True)

    class Meta:
        model = EntregaDotacion
        fields = [
            'id', 'colaborador', 'colaborador_nombre',
            'periodo', 'periodo_display', 'anio',
            'fecha_entrega', 'firma_recibido', 'created_at'
        ]


class EntregaDotacionDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para entregas de dotacion."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    periodo_display = serializers.CharField(source='get_periodo_display', read_only=True)

    class Meta:
        model = EntregaDotacion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class EntregaDotacionCreateSerializer(serializers.ModelSerializer):
    """Serializer de creacion para entregas de dotacion."""

    class Meta:
        model = EntregaDotacion
        fields = [
            'colaborador', 'periodo', 'anio', 'fecha_entrega',
            'items_entregados', 'acta_entrega', 'firma_recibido',
            'observaciones'
        ]

    def validate(self, data):
        """Validar entrega unica por colaborador/periodo/anio."""
        empresa = self.context['request'].user.empresa
        if EntregaDotacion.objects.filter(
            empresa=empresa,
            colaborador=data['colaborador'],
            periodo=data['periodo'],
            anio=data['anio'],
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                f"Ya existe una entrega de dotacion para este colaborador en {data['periodo']}/{data['anio']}."
            )
        return data
