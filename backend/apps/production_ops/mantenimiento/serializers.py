"""
Serializers para Mantenimiento de Equipos - Production Ops
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from datetime import date, timedelta

from .models import (
    # Catálogos dinámicos
    TipoActivo,
    TipoMantenimiento,
    # Activos
    ActivoProduccion,
    EquipoMedicion,
    # Planificación
    PlanMantenimiento,
    # Ejecución
    OrdenTrabajo,
    Calibracion,
    Parada,
)


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class TipoActivoSerializer(serializers.ModelSerializer):
    """Serializer para tipos de activo"""
    class Meta:
        model = TipoActivo
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'vida_util_anios', 'depreciacion_anual',
            'requiere_calibracion', 'frecuencia_calibracion_meses',
            'activo', 'orden', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TipoMantenimientoSerializer(serializers.ModelSerializer):
    """Serializer para tipos de mantenimiento"""
    class Meta:
        model = TipoMantenimiento
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'es_preventivo', 'es_correctivo', 'es_predictivo',
            'frecuencia_dias', 'activo', 'orden',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


# ==============================================================================
# SERIALIZERS DE ACTIVOS
# ==============================================================================

class ActivoProduccionListSerializer(serializers.ModelSerializer):
    """Serializer para listar activos (solo campos esenciales)"""
    tipo_activo_nombre = serializers.CharField(
        source='tipo_activo.nombre',
        read_only=True
    )
    linea_produccion_nombre = serializers.CharField(
        source='linea_produccion.nombre',
        read_only=True
    )
    estado_badge = serializers.SerializerMethodField()
    dias_hasta_mantenimiento = serializers.SerializerMethodField()

    class Meta:
        model = ActivoProduccion
        fields = [
            'id', 'codigo', 'nombre', 'tipo_activo', 'tipo_activo_nombre',
            'linea_produccion', 'linea_produccion_nombre', 'estado',
            'estado_badge', 'fecha_proximo_mantenimiento',
            'dias_hasta_mantenimiento', 'valor_actual', 'ubicacion',
            'created_at'
        ]

    def get_estado_badge(self, obj):
        """Badge de estado con color"""
        colores = {
            'OPERATIVO': '#28a745',
            'EN_MANTENIMIENTO': '#ffc107',
            'FUERA_SERVICIO': '#dc3545',
            'DADO_DE_BAJA': '#6c757d',
        }
        return {
            'estado': obj.estado,
            'color': colores.get(obj.estado, '#6c757d')
        }

    def get_dias_hasta_mantenimiento(self, obj):
        """Días restantes hasta próximo mantenimiento"""
        if not obj.fecha_proximo_mantenimiento:
            return None

        delta = obj.fecha_proximo_mantenimiento - date.today()
        return delta.days


class ActivoProduccionSerializer(serializers.ModelSerializer):
    """Serializer completo para activos de producción"""
    tipo_activo_nombre = serializers.CharField(
        source='tipo_activo.nombre',
        read_only=True
    )
    linea_produccion_nombre = serializers.CharField(
        source='linea_produccion.nombre',
        read_only=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )

    # Campos calculados
    requiere_mantenimiento_urgente = serializers.SerializerMethodField()
    esta_vencido_mantenimiento = serializers.SerializerMethodField()
    anios_uso = serializers.SerializerMethodField()
    porcentaje_depreciacion = serializers.SerializerMethodField()

    # Estadísticas
    total_ordenes = serializers.SerializerMethodField()
    total_paradas = serializers.SerializerMethodField()
    costo_total_mantenimiento = serializers.SerializerMethodField()

    class Meta:
        model = ActivoProduccion
        fields = [
            'id', 'codigo', 'empresa', 'empresa_nombre', 'nombre', 'descripcion',
            'tipo_activo', 'tipo_activo_nombre', 'linea_produccion',
            'linea_produccion_nombre', 'marca', 'modelo', 'numero_serie',
            'fecha_adquisicion', 'valor_adquisicion', 'valor_actual',
            'fecha_ultima_revision', 'fecha_proximo_mantenimiento',
            'estado', 'ubicacion', 'manual_url', 'orden',
            'requiere_mantenimiento_urgente', 'esta_vencido_mantenimiento',
            'anios_uso', 'porcentaje_depreciacion',
            'total_ordenes', 'total_paradas', 'costo_total_mantenimiento',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'codigo', 'valor_actual', 'created_by', 'created_at', 'updated_at'
        ]

    def get_requiere_mantenimiento_urgente(self, obj):
        return obj.requiere_mantenimiento_urgente()

    def get_esta_vencido_mantenimiento(self, obj):
        return obj.esta_vencido_mantenimiento()

    def get_anios_uso(self, obj):
        """Años de uso del activo"""
        delta = date.today() - obj.fecha_adquisicion
        return round(delta.days / 365.25, 1)

    def get_porcentaje_depreciacion(self, obj):
        """Porcentaje de depreciación acumulada"""
        if obj.valor_adquisicion and obj.valor_actual:
            depreciacion = ((obj.valor_adquisicion - obj.valor_actual) / obj.valor_adquisicion) * 100
            return round(depreciacion, 2)
        return 0

    def get_total_ordenes(self, obj):
        """Total de órdenes de trabajo"""
        return obj.ordenes_trabajo.count()

    def get_total_paradas(self, obj):
        """Total de paradas no programadas"""
        return obj.paradas.count()

    def get_costo_total_mantenimiento(self, obj):
        """Costo total acumulado de mantenimiento"""
        from django.db.models import Sum
        total = obj.ordenes_trabajo.aggregate(
            total=Sum('costo_total')
        )['total'] or Decimal('0.00')
        return str(total)


class EquipoMedicionListSerializer(serializers.ModelSerializer):
    """Serializer para listar equipos de medición"""
    estado_badge = serializers.SerializerMethodField()
    dias_hasta_calibracion = serializers.SerializerMethodField()

    class Meta:
        model = EquipoMedicion
        fields = [
            'id', 'codigo', 'nombre', 'marca', 'modelo',
            'unidad_medida', 'estado', 'estado_badge',
            'fecha_proxima_calibracion', 'dias_hasta_calibracion',
            'created_at'
        ]

    def get_estado_badge(self, obj):
        """Badge de estado con color"""
        colores = {
            'OPERATIVO': '#28a745',
            'EN_CALIBRACION': '#ffc107',
            'FUERA_SERVICIO': '#dc3545',
            'DADO_DE_BAJA': '#6c757d',
        }
        return {
            'estado': obj.estado,
            'color': colores.get(obj.estado, '#6c757d')
        }

    def get_dias_hasta_calibracion(self, obj):
        """Días restantes hasta próxima calibración"""
        if not obj.fecha_proxima_calibracion:
            return None

        delta = obj.fecha_proxima_calibracion - date.today()
        return delta.days


class EquipoMedicionSerializer(serializers.ModelSerializer):
    """Serializer completo para equipos de medición"""
    activo_codigo = serializers.CharField(
        source='activo.codigo',
        read_only=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )

    # Campos calculados
    requiere_calibracion_urgente = serializers.SerializerMethodField()
    esta_vencida_calibracion = serializers.SerializerMethodField()
    total_calibraciones = serializers.SerializerMethodField()
    ultima_calibracion_info = serializers.SerializerMethodField()

    class Meta:
        model = EquipoMedicion
        fields = [
            'id', 'codigo', 'empresa', 'empresa_nombre', 'activo', 'activo_codigo',
            'nombre', 'marca', 'modelo', 'numero_serie',
            'rango_medicion_min', 'rango_medicion_max', 'unidad_medida',
            'resolucion', 'exactitud', 'fecha_calibracion',
            'fecha_proxima_calibracion', 'certificado_calibracion_url',
            'estado', 'requiere_calibracion_urgente', 'esta_vencida_calibracion',
            'total_calibraciones', 'ultima_calibracion_info',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'codigo', 'created_by', 'created_at', 'updated_at'
        ]

    def get_requiere_calibracion_urgente(self, obj):
        return obj.requiere_calibracion_urgente()

    def get_esta_vencida_calibracion(self, obj):
        return obj.esta_vencida_calibracion()

    def get_total_calibraciones(self, obj):
        return obj.calibraciones.count()

    def get_ultima_calibracion_info(self, obj):
        """Información de la última calibración"""
        ultima = obj.calibraciones.order_by('-fecha_calibracion').first()
        if ultima:
            return {
                'fecha': ultima.fecha_calibracion,
                'resultado': ultima.resultado,
                'certificado': ultima.numero_certificado,
                'laboratorio': ultima.laboratorio_calibrador
            }
        return None


# ==============================================================================
# SERIALIZERS DE PLANIFICACIÓN
# ==============================================================================

class PlanMantenimientoListSerializer(serializers.ModelSerializer):
    """Serializer para listar planes de mantenimiento"""
    activo_nombre = serializers.CharField(
        source='activo.nombre',
        read_only=True
    )
    activo_codigo = serializers.CharField(
        source='activo.codigo',
        read_only=True
    )
    tipo_mantenimiento_nombre = serializers.CharField(
        source='tipo_mantenimiento.nombre',
        read_only=True
    )
    dias_hasta_ejecucion = serializers.SerializerMethodField()

    class Meta:
        model = PlanMantenimiento
        fields = [
            'id', 'nombre', 'activo', 'activo_codigo', 'activo_nombre',
            'tipo_mantenimiento', 'tipo_mantenimiento_nombre',
            'frecuencia_dias', 'ultima_ejecucion', 'proxima_ejecucion',
            'dias_hasta_ejecucion', 'activo_plan', 'created_at'
        ]

    def get_dias_hasta_ejecucion(self, obj):
        """Días restantes hasta próxima ejecución"""
        if not obj.proxima_ejecucion:
            return None

        delta = obj.proxima_ejecucion - date.today()
        return delta.days


class PlanMantenimientoSerializer(serializers.ModelSerializer):
    """Serializer completo para planes de mantenimiento"""
    activo_nombre = serializers.CharField(
        source='activo.nombre',
        read_only=True
    )
    tipo_mantenimiento_nombre = serializers.CharField(
        source='tipo_mantenimiento.nombre',
        read_only=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )

    # Campos calculados
    requiere_ejecucion_urgente = serializers.SerializerMethodField()
    esta_vencido = serializers.SerializerMethodField()
    total_ejecuciones = serializers.SerializerMethodField()

    class Meta:
        model = PlanMantenimiento
        fields = [
            'id', 'empresa', 'empresa_nombre', 'nombre', 'descripcion',
            'activo', 'activo_nombre', 'tipo_mantenimiento',
            'tipo_mantenimiento_nombre', 'frecuencia_dias',
            'frecuencia_horas_uso', 'tareas_realizar', 'repuestos_necesarios',
            'tiempo_estimado_horas', 'costo_estimado', 'ultima_ejecucion',
            'proxima_ejecucion', 'activo_plan', 'requiere_ejecucion_urgente',
            'esta_vencido', 'total_ejecuciones',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'proxima_ejecucion', 'created_by', 'created_at', 'updated_at'
        ]

    def get_requiere_ejecucion_urgente(self, obj):
        return obj.requiere_ejecucion_urgente()

    def get_esta_vencido(self, obj):
        return obj.esta_vencido()

    def get_total_ejecuciones(self, obj):
        """Total de órdenes generadas por este plan"""
        return obj.ordenes_trabajo.count()


# ==============================================================================
# SERIALIZERS DE EJECUCIÓN
# ==============================================================================

class OrdenTrabajoListSerializer(serializers.ModelSerializer):
    """Serializer para listar órdenes de trabajo"""
    activo_nombre = serializers.CharField(
        source='activo.nombre',
        read_only=True
    )
    activo_codigo = serializers.CharField(
        source='activo.codigo',
        read_only=True
    )
    tipo_mantenimiento_nombre = serializers.CharField(
        source='tipo_mantenimiento.nombre',
        read_only=True
    )
    solicitante_nombre = serializers.CharField(
        source='solicitante.get_full_name',
        read_only=True
    )
    asignado_a_nombre = serializers.CharField(
        source='asignado_a.get_full_name',
        read_only=True
    )
    estado_badge = serializers.SerializerMethodField()
    prioridad_badge = serializers.SerializerMethodField()

    class Meta:
        model = OrdenTrabajo
        fields = [
            'id', 'codigo', 'fecha_solicitud', 'fecha_programada',
            'activo', 'activo_codigo', 'activo_nombre',
            'tipo_mantenimiento', 'tipo_mantenimiento_nombre',
            'prioridad', 'prioridad_badge', 'estado', 'estado_badge',
            'solicitante', 'solicitante_nombre',
            'asignado_a', 'asignado_a_nombre',
            'costo_total', 'created_at'
        ]

    def get_estado_badge(self, obj):
        """Badge de estado con color"""
        colores = {
            'ABIERTA': '#17a2b8',
            'EN_PROCESO': '#ffc107',
            'COMPLETADA': '#28a745',
            'CANCELADA': '#6c757d',
        }
        return {
            'estado': obj.estado,
            'color': colores.get(obj.estado, '#6c757d')
        }

    def get_prioridad_badge(self, obj):
        """Badge de prioridad con color"""
        colores = {
            1: '#dc3545',  # Crítica - Rojo
            2: '#fd7e14',  # Alta - Naranja
            3: '#ffc107',  # Media - Amarillo
            4: '#17a2b8',  # Baja - Celeste
            5: '#6c757d',  # Muy Baja - Gris
        }
        nombres = {
            1: 'Crítica',
            2: 'Alta',
            3: 'Media',
            4: 'Baja',
            5: 'Muy Baja',
        }
        return {
            'nivel': obj.prioridad,
            'nombre': nombres.get(obj.prioridad, ''),
            'color': colores.get(obj.prioridad, '#6c757d')
        }


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    """Serializer completo para órdenes de trabajo"""
    activo_nombre = serializers.CharField(
        source='activo.nombre',
        read_only=True
    )
    tipo_mantenimiento_nombre = serializers.CharField(
        source='tipo_mantenimiento.nombre',
        read_only=True
    )
    plan_mantenimiento_nombre = serializers.CharField(
        source='plan_mantenimiento.nombre',
        read_only=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )
    solicitante_nombre = serializers.CharField(
        source='solicitante.get_full_name',
        read_only=True
    )
    asignado_a_nombre = serializers.CharField(
        source='asignado_a.get_full_name',
        read_only=True
    )

    # Campos calculados
    duracion_horas = serializers.SerializerMethodField()
    esta_vencida = serializers.SerializerMethodField()
    dias_en_proceso = serializers.SerializerMethodField()

    class Meta:
        model = OrdenTrabajo
        fields = [
            'id', 'codigo', 'empresa', 'empresa_nombre',
            'activo', 'activo_nombre', 'tipo_mantenimiento',
            'tipo_mantenimiento_nombre', 'plan_mantenimiento',
            'plan_mantenimiento_nombre', 'prioridad', 'estado',
            'fecha_solicitud', 'fecha_programada', 'fecha_inicio', 'fecha_fin',
            'descripcion_problema', 'descripcion_trabajo_realizado',
            'solicitante', 'solicitante_nombre', 'asignado_a', 'asignado_a_nombre',
            'horas_trabajadas', 'costo_mano_obra', 'costo_repuestos', 'costo_total',
            'observaciones', 'duracion_horas', 'esta_vencida', 'dias_en_proceso',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'codigo', 'costo_total', 'created_by', 'created_at', 'updated_at'
        ]

    def get_duracion_horas(self, obj):
        """Duración total de la orden en horas"""
        if obj.fecha_inicio and obj.fecha_fin:
            delta = obj.fecha_fin - obj.fecha_inicio
            return round(delta.total_seconds() / 3600, 2)
        return None

    def get_esta_vencida(self, obj):
        """Verificar si la orden está vencida"""
        if obj.estado in ['COMPLETADA', 'CANCELADA']:
            return False
        if obj.fecha_programada:
            return obj.fecha_programada < date.today()
        return False

    def get_dias_en_proceso(self, obj):
        """Días que lleva la orden en proceso"""
        if obj.estado == 'EN_PROCESO' and obj.fecha_inicio:
            delta = timezone.now() - obj.fecha_inicio
            return delta.days
        return None


class IniciarTrabajoSerializer(serializers.Serializer):
    """Serializer para acción de iniciar trabajo"""
    asignado_a = serializers.IntegerField(required=False, allow_null=True)
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate_asignado_a(self, value):
        """Validar que el usuario existe y está activo"""
        if value is None:
            return None
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            return User.objects.get(pk=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Usuario no encontrado o inactivo")


class CompletarTrabajoSerializer(serializers.Serializer):
    """Serializer para acción de completar trabajo"""
    descripcion_trabajo_realizado = serializers.CharField(required=True)
    horas_trabajadas = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        required=True
    )
    costo_mano_obra = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=True
    )
    costo_repuestos = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=True
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate_horas_trabajadas(self, value):
        if value <= 0:
            raise serializers.ValidationError("Las horas trabajadas deben ser mayores a cero")
        return value


class CalibracionListSerializer(serializers.ModelSerializer):
    """Serializer para listar calibraciones"""
    equipo_nombre = serializers.CharField(
        source='equipo.nombre',
        read_only=True
    )
    equipo_codigo = serializers.CharField(
        source='equipo.codigo',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    resultado_badge = serializers.SerializerMethodField()

    class Meta:
        model = Calibracion
        fields = [
            'id', 'equipo', 'equipo_codigo', 'equipo_nombre',
            'fecha_calibracion', 'fecha_vencimiento',
            'numero_certificado', 'laboratorio_calibrador',
            'resultado', 'resultado_badge', 'responsable', 'responsable_nombre',
            'created_at'
        ]

    def get_resultado_badge(self, obj):
        """Badge de resultado con color"""
        colores = {
            'APROBADO': '#28a745',
            'AJUSTADO': '#ffc107',
            'RECHAZADO': '#dc3545',
        }
        return {
            'resultado': obj.resultado,
            'color': colores.get(obj.resultado, '#6c757d')
        }


class CalibracionSerializer(serializers.ModelSerializer):
    """Serializer completo para calibraciones"""
    equipo_nombre = serializers.CharField(
        source='equipo.nombre',
        read_only=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )

    # Campos calculados
    dias_hasta_vencimiento = serializers.SerializerMethodField()
    esta_vencida = serializers.SerializerMethodField()

    class Meta:
        model = Calibracion
        fields = [
            'id', 'empresa', 'empresa_nombre', 'equipo', 'equipo_nombre',
            'fecha_calibracion', 'fecha_vencimiento', 'numero_certificado',
            'laboratorio_calibrador', 'resultado', 'patron_utilizado',
            'incertidumbre_medicion', 'valores_antes', 'valores_despues',
            'certificado_url', 'responsable', 'responsable_nombre',
            'observaciones', 'dias_hasta_vencimiento', 'esta_vencida',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_dias_hasta_vencimiento(self, obj):
        """Días restantes hasta vencimiento"""
        delta = obj.fecha_vencimiento - date.today()
        return delta.days

    def get_esta_vencida(self, obj):
        """Verificar si está vencida"""
        return obj.fecha_vencimiento < date.today()

    def validate(self, data):
        """Validar fechas"""
        if data['fecha_vencimiento'] <= data['fecha_calibracion']:
            raise serializers.ValidationError({
                'fecha_vencimiento': 'La fecha de vencimiento debe ser posterior a la fecha de calibración'
            })
        return data


class ParadaListSerializer(serializers.ModelSerializer):
    """Serializer para listar paradas"""
    activo_nombre = serializers.CharField(
        source='activo.nombre',
        read_only=True
    )
    activo_codigo = serializers.CharField(
        source='activo.codigo',
        read_only=True
    )
    reportado_por_nombre = serializers.CharField(
        source='reportado_por.get_full_name',
        read_only=True
    )
    esta_activa = serializers.SerializerMethodField()
    tipo_badge = serializers.SerializerMethodField()

    class Meta:
        model = Parada
        fields = [
            'id', 'activo', 'activo_codigo', 'activo_nombre',
            'fecha_inicio', 'fecha_fin', 'duracion_horas',
            'tipo', 'tipo_badge', 'causa', 'esta_activa',
            'reportado_por', 'reportado_por_nombre',
            'impacto_produccion_kg', 'costo_estimado_parada',
            'created_at'
        ]

    def get_esta_activa(self, obj):
        return obj.esta_activa()

    def get_tipo_badge(self, obj):
        """Badge de tipo con color"""
        colores = {
            'FALLA_MECANICA': '#dc3545',
            'FALLA_ELECTRICA': '#fd7e14',
            'FALTA_REPUESTOS': '#ffc107',
            'FALTA_OPERADOR': '#17a2b8',
            'OTRO': '#6c757d',
        }
        nombres = {
            'FALLA_MECANICA': 'Falla Mecánica',
            'FALLA_ELECTRICA': 'Falla Eléctrica',
            'FALTA_REPUESTOS': 'Falta Repuestos',
            'FALTA_OPERADOR': 'Falta Operador',
            'OTRO': 'Otro',
        }
        return {
            'tipo': obj.tipo,
            'nombre': nombres.get(obj.tipo, ''),
            'color': colores.get(obj.tipo, '#6c757d')
        }


class ParadaSerializer(serializers.ModelSerializer):
    """Serializer completo para paradas"""
    activo_nombre = serializers.CharField(
        source='activo.nombre',
        read_only=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )
    reportado_por_nombre = serializers.CharField(
        source='reportado_por.get_full_name',
        read_only=True
    )
    orden_trabajo_codigo = serializers.CharField(
        source='orden_trabajo.codigo',
        read_only=True
    )

    # Campos calculados
    esta_activa = serializers.SerializerMethodField()
    horas_parada_actual = serializers.SerializerMethodField()

    class Meta:
        model = Parada
        fields = [
            'id', 'empresa', 'empresa_nombre', 'activo', 'activo_nombre',
            'fecha_inicio', 'fecha_fin', 'duracion_horas', 'tipo',
            'causa', 'descripcion_falla', 'impacto_produccion_kg',
            'costo_estimado_parada', 'orden_trabajo', 'orden_trabajo_codigo',
            'acciones_correctivas', 'reportado_por', 'reportado_por_nombre',
            'esta_activa', 'horas_parada_actual',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'duracion_horas', 'created_by', 'created_at', 'updated_at'
        ]

    def get_esta_activa(self, obj):
        return obj.esta_activa()

    def get_horas_parada_actual(self, obj):
        """Horas de parada hasta ahora (si está activa)"""
        if obj.esta_activa():
            delta = timezone.now() - obj.fecha_inicio
            return round(delta.total_seconds() / 3600, 2)
        return None

    def validate(self, data):
        """Validar fechas"""
        if data.get('fecha_fin') and data.get('fecha_inicio'):
            if data['fecha_fin'] < data['fecha_inicio']:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio'
                })
        return data


class CerrarParadaSerializer(serializers.Serializer):
    """Serializer para acción de cerrar parada"""
    acciones_correctivas = serializers.CharField(required=True)
    costo_estimado_parada = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False
    )
    genera_orden_trabajo = serializers.BooleanField(default=False)
    tipo_mantenimiento = serializers.IntegerField(required=False, allow_null=True)

    def validate_tipo_mantenimiento(self, value):
        """Validar que el tipo de mantenimiento existe y es correctivo"""
        if value is None:
            return None
        try:
            return TipoMantenimiento.objects.get(pk=value, activo=True, es_correctivo=True)
        except TipoMantenimiento.DoesNotExist:
            raise serializers.ValidationError("Tipo de mantenimiento no encontrado o no es correctivo")
