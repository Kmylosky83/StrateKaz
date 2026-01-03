"""
Serializers para Servicio al Cliente - Sales CRM
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    # Catálogos
    TipoPQRS, EstadoPQRS, PrioridadPQRS, CanalRecepcion, NivelSatisfaccion,
    # Principales
    PQRS, SeguimientoPQRS,
    EncuestaSatisfaccion, PreguntaEncuesta, RespuestaEncuesta,
    ProgramaFidelizacion, PuntosFidelizacion, MovimientoPuntos
)

User = get_user_model()


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS
# ==============================================================================

class TipoPQRSSerializer(serializers.ModelSerializer):
    """Serializer para TipoPQRS"""
    class Meta:
        model = TipoPQRS
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class EstadoPQRSSerializer(serializers.ModelSerializer):
    """Serializer para EstadoPQRS"""
    class Meta:
        model = EstadoPQRS
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PrioridadPQRSSerializer(serializers.ModelSerializer):
    """Serializer para PrioridadPQRS"""
    class Meta:
        model = PrioridadPQRS
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class CanalRecepcionSerializer(serializers.ModelSerializer):
    """Serializer para CanalRecepcion"""
    class Meta:
        model = CanalRecepcion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class NivelSatisfaccionSerializer(serializers.ModelSerializer):
    """Serializer para NivelSatisfaccion"""
    class Meta:
        model = NivelSatisfaccion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


# ==============================================================================
# SERIALIZERS PRINCIPALES
# ==============================================================================

class SeguimientoPQRSSerializer(serializers.ModelSerializer):
    """Serializer para SeguimientoPQRS"""
    registrado_por_nombre = serializers.CharField(
        source='registrado_por.get_full_name',
        read_only=True
    )
    tipo_accion_display = serializers.CharField(
        source='get_tipo_accion_display',
        read_only=True
    )

    class Meta:
        model = SeguimientoPQRS
        fields = '__all__'
        read_only_fields = ['fecha', 'created_at', 'updated_at']

    def validate(self, data):
        # El usuario autenticado será el registrado_por
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            data['registrado_por'] = request.user
        return data


class PQRSSerializer(serializers.ModelSerializer):
    """Serializer para PQRS con seguimientos anidados"""
    # Campos de solo lectura
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    estado_color = serializers.CharField(source='estado.color_hex', read_only=True)
    prioridad_nombre = serializers.CharField(source='prioridad.nombre', read_only=True)
    prioridad_color = serializers.CharField(source='prioridad.color_hex', read_only=True)
    canal_nombre = serializers.CharField(source='canal_recepcion.nombre', read_only=True)
    asignado_a_nombre = serializers.CharField(
        source='asignado_a.get_full_name',
        read_only=True,
        allow_null=True
    )
    escalado_a_nombre = serializers.CharField(
        source='escalado_a.get_full_name',
        read_only=True,
        allow_null=True
    )
    cliente_nombre = serializers.CharField(
        source='cliente.nombre_comercial',
        read_only=True,
        allow_null=True
    )

    # Campos calculados
    esta_vencida = serializers.BooleanField(read_only=True)
    horas_restantes_sla = serializers.IntegerField(read_only=True, allow_null=True)
    porcentaje_tiempo_sla = serializers.FloatField(read_only=True)

    # Seguimientos anidados (solo lectura)
    seguimientos = SeguimientoPQRSSerializer(many=True, read_only=True)

    class Meta:
        model = PQRS
        fields = '__all__'
        read_only_fields = [
            'codigo', 'fecha_radicacion', 'fecha_vencimiento_sla',
            'created_by', 'created_at', 'updated_at', 'deleted_at'
        ]

    def validate(self, data):
        # Validar que el estado sea inicial al crear
        if not self.instance:
            if 'estado' not in data:
                # Asignar estado inicial por defecto
                try:
                    estado_inicial = EstadoPQRS.objects.get(
                        es_inicial=True,
                        is_active=True
                    )
                    data['estado'] = estado_inicial
                except EstadoPQRS.DoesNotExist:
                    raise serializers.ValidationError(
                        "No existe un estado inicial configurado"
                    )

        # Validar que el tipo esté activo
        if 'tipo' in data and not data['tipo'].is_active:
            raise serializers.ValidationError({
                'tipo': 'El tipo seleccionado no está activo'
            })

        # Validar que la prioridad esté activa
        if 'prioridad' in data and not data['prioridad'].is_active:
            raise serializers.ValidationError({
                'prioridad': 'La prioridad seleccionada no está activa'
            })

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class PQRSListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listados de PQRS"""
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    estado_color = serializers.CharField(source='estado.color_hex', read_only=True)
    prioridad_nombre = serializers.CharField(source='prioridad.nombre', read_only=True)
    prioridad_nivel = serializers.IntegerField(source='prioridad.nivel', read_only=True)
    asignado_a_nombre = serializers.CharField(
        source='asignado_a.get_full_name',
        read_only=True,
        allow_null=True
    )
    esta_vencida = serializers.BooleanField(read_only=True)

    class Meta:
        model = PQRS
        fields = [
            'id', 'codigo', 'asunto', 'tipo', 'tipo_nombre',
            'estado', 'estado_nombre', 'estado_color',
            'prioridad', 'prioridad_nombre', 'prioridad_nivel',
            'fecha_radicacion', 'fecha_vencimiento_sla',
            'asignado_a', 'asignado_a_nombre',
            'contacto_nombre', 'esta_vencida'
        ]


class RespuestaEncuestaSerializer(serializers.ModelSerializer):
    """Serializer para RespuestaEncuesta"""
    pregunta_texto = serializers.CharField(source='pregunta.pregunta', read_only=True)

    class Meta:
        model = RespuestaEncuesta
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class EncuestaSatisfaccionSerializer(serializers.ModelSerializer):
    """Serializer para EncuestaSatisfaccion"""
    cliente_nombre = serializers.CharField(
        source='cliente.nombre_comercial',
        read_only=True
    )
    satisfaccion_nombre = serializers.CharField(
        source='satisfaccion_general.nombre',
        read_only=True,
        allow_null=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    categoria_nps = serializers.CharField(read_only=True, allow_null=True)
    esta_vencida = serializers.BooleanField(read_only=True)

    # Respuestas anidadas
    respuestas = RespuestaEncuestaSerializer(many=True, read_only=True)

    class Meta:
        model = EncuestaSatisfaccion
        fields = '__all__'
        read_only_fields = [
            'codigo', 'fecha_envio', 'enviada_por',
            'created_at', 'updated_at', 'deleted_at'
        ]

    def validate_nps_score(self, value):
        """Validar que el NPS esté entre 0 y 10"""
        if value is not None and (value < 0 or value > 10):
            raise serializers.ValidationError(
                'El NPS debe estar entre 0 y 10'
            )
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['enviada_por'] = request.user
        return super().create(validated_data)


class PreguntaEncuestaSerializer(serializers.ModelSerializer):
    """Serializer para PreguntaEncuesta"""
    tipo_respuesta_display = serializers.CharField(
        source='get_tipo_respuesta_display',
        read_only=True
    )

    class Meta:
        model = PreguntaEncuesta
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class MovimientoPuntosSerializer(serializers.ModelSerializer):
    """Serializer para MovimientoPuntos"""
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )
    registrado_por_nombre = serializers.CharField(
        source='registrado_por.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = MovimientoPuntos
        fields = '__all__'
        read_only_fields = ['fecha', 'created_at']


class PuntosFidelizacionSerializer(serializers.ModelSerializer):
    """Serializer para PuntosFidelizacion"""
    cliente_nombre = serializers.CharField(
        source='cliente.nombre_comercial',
        read_only=True
    )
    programa_nombre = serializers.CharField(
        source='programa.nombre',
        read_only=True
    )
    nivel_display = serializers.CharField(
        source='get_nivel_actual_display',
        read_only=True
    )
    puntos_para_siguiente_nivel = serializers.IntegerField(read_only=True)

    # Movimientos anidados (solo lectura)
    movimientos = MovimientoPuntosSerializer(many=True, read_only=True)

    class Meta:
        model = PuntosFidelizacion
        fields = '__all__'
        read_only_fields = [
            'puntos_acumulados', 'puntos_canjeados', 'puntos_disponibles',
            'nivel_actual', 'fecha_nivel', 'ultima_actualizacion',
            'created_at', 'updated_at'
        ]


class ProgramaFidelizacionSerializer(serializers.ModelSerializer):
    """Serializer para ProgramaFidelizacion"""
    esta_vigente = serializers.BooleanField(read_only=True)
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ProgramaFidelizacion
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def validate(self, data):
        # Validar que fecha_fin sea posterior a fecha_inicio
        if 'fecha_inicio' in data and 'fecha_fin' in data:
            if data['fecha_fin'] and data['fecha_fin'] < data['fecha_inicio']:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de finalización debe ser posterior a la fecha de inicio'
                })

        # Validar que los niveles sean progresivos
        if all(k in data for k in ['nivel_bronce_puntos', 'nivel_plata_puntos', 'nivel_oro_puntos']):
            if not (data['nivel_bronce_puntos'] < data['nivel_plata_puntos'] < data['nivel_oro_puntos']):
                raise serializers.ValidationError(
                    'Los niveles de puntos deben ser progresivos: Bronce < Plata < Oro'
                )

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


# ==============================================================================
# SERIALIZERS DE ACCIONES
# ==============================================================================

class EncuestaSatisfaccionListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listados de encuestas"""
    cliente_nombre = serializers.CharField(
        source='cliente.nombre_comercial',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    esta_vencida = serializers.BooleanField(read_only=True)

    class Meta:
        model = EncuestaSatisfaccion
        fields = [
            'id', 'codigo', 'cliente', 'cliente_nombre',
            'estado', 'estado_display', 'fecha_envio',
            'fecha_respuesta', 'nps_score', 'esta_vencida'
        ]


class ResponderEncuestaSerializer(serializers.Serializer):
    """Serializer para responder encuestas"""
    satisfaccion_general = serializers.IntegerField(required=True)
    nps_score = serializers.IntegerField(min_value=0, max_value=10)
    comentarios = serializers.CharField(required=False, allow_blank=True)
    sugerencias = serializers.CharField(required=False, allow_blank=True)
    respuestas = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=[]
    )

    def validate_satisfaccion_general(self, value):
        if value is not None and not NivelSatisfaccion.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("Nivel de satisfacción inválido")
        return value


class AcumularPuntosSerializer(serializers.Serializer):
    """Serializer para acumular puntos de fidelización"""
    cliente_id = serializers.IntegerField()
    puntos = serializers.IntegerField(min_value=1)
    concepto = serializers.CharField(max_length=200)
    referencia = serializers.CharField(max_length=50, required=False, allow_blank=True)


class CanjearPuntosSerializer(serializers.Serializer):
    """Serializer para canjear puntos de fidelización"""
    cliente_id = serializers.IntegerField()
    puntos = serializers.IntegerField(min_value=1)
    concepto = serializers.CharField(max_length=200)
    referencia = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_puntos(self, value):
        # La validación de puntos disponibles se hace en la vista
        if value <= 0:
            raise serializers.ValidationError("Los puntos a canjear deben ser positivos")
        return value
