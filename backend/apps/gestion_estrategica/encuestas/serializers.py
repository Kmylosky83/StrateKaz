"""
Serializers para Encuestas de Contexto Organizacional
======================================================

Serializers para CRUD de encuestas PCI-POAM y libres,
incluyendo serializers públicos para acceso anónimo.
"""
from rest_framework import serializers
from .models import (
    PreguntaContexto,
    EncuestaDofa,
    TemaEncuesta,
    ParticipanteEncuesta,
    RespuestaEncuesta
)


# ==============================================================================
# SERIALIZERS PARA PREGUNTAS PCI-POAM
# ==============================================================================

class PreguntaContextoSerializer(serializers.ModelSerializer):
    """Serializer completo para preguntas del banco PCI-POAM"""
    perfil_display = serializers.CharField(source='get_perfil_display', read_only=True)
    capacidad_pci_display = serializers.CharField(source='get_capacidad_pci_display', read_only=True)
    factor_poam_display = serializers.CharField(source='get_factor_poam_display', read_only=True)
    clasificacion_esperada_display = serializers.CharField(
        source='get_clasificacion_esperada_display', read_only=True
    )

    class Meta:
        model = PreguntaContexto
        fields = [
            'id', 'codigo', 'texto', 'perfil', 'perfil_display',
            'capacidad_pci', 'capacidad_pci_display',
            'factor_poam', 'factor_poam_display',
            'clasificacion_esperada', 'clasificacion_esperada_display',
            'dimension_pestel', 'orden', 'es_sistema', 'is_active',
        ]
        read_only_fields = ['id']


# ==============================================================================
# SERIALIZERS PARA TEMAS
# ==============================================================================

class TemaEncuestaSerializer(serializers.ModelSerializer):
    """Serializer completo para temas de encuesta"""
    area_name = serializers.CharField(source='area.name', read_only=True)
    total_votos_fortaleza = serializers.IntegerField(read_only=True)
    total_votos_debilidad = serializers.IntegerField(read_only=True)
    clasificacion_consenso = serializers.CharField(read_only=True)
    pregunta_codigo = serializers.CharField(
        source='pregunta_contexto.codigo', read_only=True
    )
    clasificacion_esperada = serializers.CharField(
        source='pregunta_contexto.clasificacion_esperada', read_only=True
    )

    class Meta:
        model = TemaEncuesta
        fields = [
            'id', 'encuesta', 'area', 'area_name',
            'pregunta_contexto', 'pregunta_codigo', 'clasificacion_esperada',
            'titulo', 'descripcion', 'orden',
            'total_votos_fortaleza', 'total_votos_debilidad',
            'clasificacion_consenso',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TemaEncuestaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear temas"""

    class Meta:
        model = TemaEncuesta
        fields = ['area', 'titulo', 'descripcion', 'orden']


class TemaEncuestaPublicoSerializer(serializers.ModelSerializer):
    """Serializer público para mostrar temas (sin datos sensibles)"""
    area_name = serializers.CharField(source='area.name', read_only=True)
    clasificacion_esperada = serializers.CharField(
        source='pregunta_contexto.clasificacion_esperada', read_only=True
    )
    capacidad_pci = serializers.CharField(
        source='pregunta_contexto.capacidad_pci', read_only=True
    )
    factor_poam = serializers.CharField(
        source='pregunta_contexto.factor_poam', read_only=True
    )

    class Meta:
        model = TemaEncuesta
        fields = [
            'id', 'titulo', 'descripcion', 'area_name', 'orden',
            'clasificacion_esperada', 'capacidad_pci', 'factor_poam',
        ]


# ==============================================================================
# SERIALIZERS PARA PARTICIPANTES
# ==============================================================================

class ParticipanteEncuestaSerializer(serializers.ModelSerializer):
    """Serializer completo para participantes"""
    usuario_nombre = serializers.CharField(
        source='usuario.get_full_name', read_only=True
    )
    area_nombre = serializers.CharField(source='area.name', read_only=True)
    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = ParticipanteEncuesta
        fields = [
            'id', 'encuesta', 'tipo', 'tipo_display',
            'usuario', 'usuario_nombre',
            'area', 'area_nombre',
            'cargo', 'cargo_nombre',
            'estado', 'estado_display',
            'fecha_notificacion', 'fecha_inicio_respuesta', 'fecha_completado',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'estado', 'fecha_notificacion',
            'fecha_inicio_respuesta', 'fecha_completado',
            'created_at', 'updated_at'
        ]


class ParticipanteEncuestaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear participantes"""

    class Meta:
        model = ParticipanteEncuesta
        fields = ['tipo', 'usuario', 'area', 'cargo']

    def validate(self, attrs):
        tipo = attrs.get('tipo')

        if tipo == ParticipanteEncuesta.TipoParticipante.USUARIO:
            if not attrs.get('usuario'):
                raise serializers.ValidationError({
                    'usuario': 'Debe especificar un usuario'
                })
        elif tipo == ParticipanteEncuesta.TipoParticipante.AREA:
            if not attrs.get('area'):
                raise serializers.ValidationError({
                    'area': 'Debe especificar un área'
                })
        elif tipo == ParticipanteEncuesta.TipoParticipante.CARGO:
            if not attrs.get('cargo'):
                raise serializers.ValidationError({
                    'cargo': 'Debe especificar un cargo'
                })

        return attrs


# ==============================================================================
# SERIALIZERS PARA RESPUESTAS
# ==============================================================================

class RespuestaEncuestaSerializer(serializers.ModelSerializer):
    """Serializer completo para respuestas"""
    respondente_nombre = serializers.CharField(
        source='respondente.get_full_name', read_only=True
    )
    tema_titulo = serializers.CharField(source='tema.titulo', read_only=True)
    clasificacion_display = serializers.CharField(
        source='get_clasificacion_display', read_only=True
    )
    impacto_display = serializers.CharField(
        source='get_impacto_percibido_display', read_only=True
    )

    class Meta:
        model = RespuestaEncuesta
        fields = [
            'id', 'tema', 'tema_titulo',
            'respondente', 'respondente_nombre',
            'clasificacion', 'clasificacion_display',
            'justificacion',
            'impacto_percibido', 'impacto_display',
            'created_at'
        ]
        read_only_fields = ['id', 'respondente', 'created_at']


class RespuestaEncuestaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear respuestas (usuario autenticado)"""

    class Meta:
        model = RespuestaEncuesta
        fields = ['tema', 'clasificacion', 'justificacion', 'impacto_percibido']

    def validate(self, attrs):
        tema = attrs.get('tema')
        request = self.context.get('request')

        if not tema.encuesta.esta_vigente:
            raise serializers.ValidationError(
                'La encuesta no está vigente'
            )

        if request and request.user.is_authenticated:
            existe = RespuestaEncuesta.objects.filter(
                tema=tema,
                respondente=request.user
            ).exists()
            if existe:
                raise serializers.ValidationError(
                    'Ya has respondido a este tema'
                )

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['respondente'] = request.user
            validated_data['ip_address'] = self.get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        return super().create(validated_data)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RespuestaPublicaCreateSerializer(serializers.Serializer):
    """Serializer para respuestas públicas/anónimas"""
    tema_id = serializers.IntegerField()
    clasificacion = serializers.ChoiceField(
        choices=RespuestaEncuesta.Clasificacion.choices
    )
    justificacion = serializers.CharField(required=False, allow_blank=True)
    impacto_percibido = serializers.ChoiceField(
        choices=RespuestaEncuesta.NivelImpacto.choices,
        default=RespuestaEncuesta.NivelImpacto.MEDIO
    )


class RespuestasLoteSerializer(serializers.Serializer):
    """Serializer para enviar múltiples respuestas en lote"""
    respuestas = RespuestaPublicaCreateSerializer(many=True)


# ==============================================================================
# SERIALIZERS PARA ENCUESTA
# ==============================================================================

class EncuestaDofaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de encuestas"""
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_encuesta_display = serializers.CharField(source='get_tipo_encuesta_display', read_only=True)
    analisis_dofa_nombre = serializers.CharField(
        source='analisis_dofa.nombre', read_only=True
    )
    total_temas = serializers.SerializerMethodField()
    porcentaje_participacion = serializers.FloatField(read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)

    enlace_publico = serializers.CharField(read_only=True)
    token_publico = serializers.UUIDField(read_only=True)

    class Meta:
        model = EncuestaDofa
        fields = [
            'id', 'titulo', 'descripcion',
            'tipo_encuesta', 'tipo_encuesta_display',
            'analisis_dofa', 'analisis_dofa_nombre',
            'analisis_pestel',
            'estado', 'estado_display',
            'es_publica', 'fecha_inicio', 'fecha_cierre',
            'responsable', 'responsable_nombre',
            'total_invitados', 'total_respondidos',
            'porcentaje_participacion', 'esta_vigente',
            'total_temas', 'notificacion_enviada',
            'enlace_publico', 'token_publico',
            'created_at'
        ]

    def get_total_temas(self, obj):
        return obj.temas.count()


class EncuestaDofaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para encuesta con temas y participantes"""
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_encuesta_display = serializers.CharField(source='get_tipo_encuesta_display', read_only=True)
    analisis_dofa_nombre = serializers.CharField(
        source='analisis_dofa.nombre', read_only=True
    )
    temas = TemaEncuestaSerializer(many=True, read_only=True)
    participantes = ParticipanteEncuestaSerializer(many=True, read_only=True)
    porcentaje_participacion = serializers.FloatField(read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)
    enlace_publico = serializers.CharField(read_only=True)

    class Meta:
        model = EncuestaDofa
        fields = [
            'id', 'titulo', 'descripcion',
            'tipo_encuesta', 'tipo_encuesta_display',
            'analisis_dofa', 'analisis_dofa_nombre',
            'analisis_pestel',
            'token_publico', 'es_publica', 'enlace_publico',
            'requiere_justificacion',
            'fecha_inicio', 'fecha_cierre',
            'estado', 'estado_display',
            'responsable', 'responsable_nombre',
            'total_invitados', 'total_respondidos',
            'porcentaje_participacion', 'esta_vigente',
            'notificacion_enviada', 'fecha_notificacion',
            'temas', 'participantes',
            'created_at', 'updated_at'
        ]


class EncuestaDofaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear encuesta (libre o PCI-POAM)"""
    temas = TemaEncuestaCreateSerializer(many=True, required=False)
    participantes = ParticipanteEncuestaCreateSerializer(many=True, required=False)

    class Meta:
        model = EncuestaDofa
        fields = [
            'tipo_encuesta', 'analisis_dofa', 'analisis_pestel',
            'titulo', 'descripcion',
            'es_publica', 'requiere_justificacion',
            'fecha_inicio', 'fecha_cierre',
            'temas', 'participantes'
        ]

    def validate(self, attrs):
        fecha_inicio = attrs.get('fecha_inicio')
        fecha_cierre = attrs.get('fecha_cierre')

        if fecha_inicio and fecha_cierre and fecha_cierre <= fecha_inicio:
            raise serializers.ValidationError({
                'fecha_cierre': 'La fecha de cierre debe ser posterior a la fecha de inicio'
            })

        return attrs

    def create(self, validated_data):
        from apps.core.base_models.mixins import get_tenant_empresa

        temas_data = validated_data.pop('temas', [])
        participantes_data = validated_data.pop('participantes', [])

        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['responsable'] = request.user

        empresa = get_tenant_empresa()
        if empresa:
            validated_data['empresa'] = empresa

        encuesta = EncuestaDofa.objects.create(**validated_data)

        # Para PCI-POAM: auto-generar temas desde banco de preguntas
        if encuesta.tipo_encuesta == EncuestaDofa.TipoEncuesta.PCI_POAM:
            preguntas = PreguntaContexto.objects.filter(
                is_active=True
            ).order_by('orden')

            for pregunta in preguntas:
                TemaEncuesta.objects.create(
                    encuesta=encuesta,
                    empresa=encuesta.empresa,
                    pregunta_contexto=pregunta,
                    titulo=pregunta.texto,
                    orden=pregunta.orden,
                )
        else:
            # Para libre: crear temas manuales
            for i, tema_data in enumerate(temas_data):
                TemaEncuesta.objects.create(
                    encuesta=encuesta,
                    empresa=encuesta.empresa,
                    orden=tema_data.get('orden', i),
                    **tema_data
                )

        # Crear participantes
        for participante_data in participantes_data:
            ParticipanteEncuesta.objects.create(
                encuesta=encuesta,
                **participante_data
            )

        return encuesta


class EncuestaDofaUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar encuesta"""

    class Meta:
        model = EncuestaDofa
        fields = [
            'titulo', 'descripcion',
            'es_publica', 'requiere_justificacion',
            'fecha_inicio', 'fecha_cierre',
            'analisis_pestel',
        ]


# ==============================================================================
# SERIALIZERS PARA COMPARTIR
# ==============================================================================

class CompartirEmailSerializer(serializers.Serializer):
    """Serializer para compartir encuesta por email"""
    emails = serializers.ListField(
        child=serializers.EmailField(),
        min_length=1,
        max_length=50,
    )
    mensaje_personalizado = serializers.CharField(required=False, allow_blank=True)


# ==============================================================================
# SERIALIZERS PÚBLICOS (SIN AUTENTICACIÓN)
# ==============================================================================

class EncuestaPublicaSerializer(serializers.ModelSerializer):
    """Serializer para mostrar encuesta pública (sin datos sensibles)"""
    temas = TemaEncuestaPublicoSerializer(many=True, read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)
    tipo_encuesta = serializers.CharField(read_only=True)
    empresa_nombre = serializers.SerializerMethodField()
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )

    class Meta:
        model = EncuestaDofa
        fields = [
            'id', 'titulo', 'descripcion',
            'tipo_encuesta',
            'requiere_justificacion',
            'fecha_inicio', 'fecha_cierre',
            'esta_vigente', 'temas',
            'empresa_nombre', 'responsable_nombre',
        ]

    def get_empresa_nombre(self, obj):
        """Obtiene el nombre de la empresa del tenant."""
        try:
            from apps.gestion_estrategica.configuracion.models import EmpresaConfig
            config = EmpresaConfig.objects.first()
            if config:
                return config.razon_social
        except Exception:
            pass
        return 'Organización'


class EstadisticasEncuestaSerializer(serializers.Serializer):
    """Serializer para estadísticas de encuesta"""
    encuesta_id = serializers.IntegerField()
    titulo = serializers.CharField()
    estado = serializers.CharField()
    tipo_encuesta = serializers.CharField()
    fecha_inicio = serializers.DateTimeField()
    fecha_cierre = serializers.DateTimeField()
    total_invitados = serializers.IntegerField()
    total_respondieron = serializers.IntegerField()
    porcentaje_participacion = serializers.FloatField()
    total_temas = serializers.IntegerField()
    esta_vigente = serializers.BooleanField()
    temas = serializers.ListField()
