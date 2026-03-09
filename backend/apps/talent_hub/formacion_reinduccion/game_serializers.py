"""
Serializers para Juego SST: Los Héroes de la Seguridad
Talent Hub - StrateKaz

Serializers para niveles, preguntas quiz, progreso y sesiones del juego.
"""
from rest_framework import serializers
from .models import GameLevel, GameQuizQuestion, GameProgress, GameSession


# =============================================================================
# NIVEL DEL JUEGO
# =============================================================================

class GameLevelListSerializer(serializers.ModelSerializer):
    """Serializer de lista para niveles del juego."""
    zona_display = serializers.CharField(source='get_zona_display', read_only=True)
    total_preguntas = serializers.IntegerField(source='preguntas.count', read_only=True)

    class Meta:
        model = GameLevel
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'zona', 'zona_display',
            'numero_nivel', 'puntos_completar', 'tiempo_limite_segundos',
            'min_preguntas_correctas', 'total_epps', 'mapa_key',
            'es_boss', 'disponible_desde', 'total_preguntas', 'orden',
        ]


class GameLevelDetailSerializer(serializers.ModelSerializer):
    """Serializer detalle para nivel del juego (incluye config)."""
    zona_display = serializers.CharField(source='get_zona_display', read_only=True)
    total_preguntas = serializers.IntegerField(source='preguntas.count', read_only=True)

    class Meta:
        model = GameLevel
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'zona', 'zona_display',
            'numero_nivel', 'puntos_completar', 'tiempo_limite_segundos',
            'min_preguntas_correctas', 'total_epps', 'mapa_key', 'config',
            'es_boss', 'disponible_desde', 'total_preguntas', 'orden',
        ]


# =============================================================================
# PREGUNTAS QUIZ
# =============================================================================

class GameQuizQuestionSerializer(serializers.ModelSerializer):
    """Serializer para preguntas quiz SST."""
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    dificultad_display = serializers.CharField(source='get_dificultad_display', read_only=True)

    class Meta:
        model = GameQuizQuestion
        fields = [
            'id', 'pregunta', 'opciones', 'explicacion', 'norma_referencia',
            'categoria', 'categoria_display', 'dificultad', 'dificultad_display',
            'puntos', 'orden',
        ]


# =============================================================================
# PROGRESO DEL JUGADOR
# =============================================================================

class GameProgressSerializer(serializers.ModelSerializer):
    """Serializer para progreso del jugador."""
    colaborador_nombre = serializers.CharField(
        source='colaborador.get_nombre_completo', read_only=True
    )
    porcentaje_xp = serializers.ReadOnlyField()
    precision_quizzes = serializers.ReadOnlyField()
    tiempo_jugado_formateado = serializers.ReadOnlyField()

    class Meta:
        model = GameProgress
        fields = [
            'id', 'colaborador_nombre',
            'nivel_actual', 'xp_total', 'xp_nivel_actual', 'xp_siguiente_nivel',
            'vidas', 'epps_recolectados', 'niveles_completados',
            'mejor_puntaje_nivel', 'preguntas_correctas', 'preguntas_totales',
            'tiempo_jugado_segundos', 'sesiones_jugadas', 'ultima_sesion',
            'porcentaje_xp', 'precision_quizzes', 'tiempo_jugado_formateado',
        ]
        read_only_fields = [
            'empresa', 'colaborador', 'created_at', 'updated_at',
        ]


# =============================================================================
# SESIÓN DE JUEGO
# =============================================================================

class GameSessionSerializer(serializers.ModelSerializer):
    """Serializer para sesiones de juego."""
    nivel_nombre = serializers.CharField(source='nivel.nombre', read_only=True)
    nivel_numero = serializers.IntegerField(source='nivel.numero_nivel', read_only=True)

    class Meta:
        model = GameSession
        fields = [
            'id', 'nivel', 'nivel_nombre', 'nivel_numero',
            'puntaje', 'xp_ganado', 'preguntas_correctas', 'preguntas_totales',
            'epps_recolectados', 'completado', 'duracion_segundos',
            'detalle_respuestas', 'fecha_sesion',
        ]
        read_only_fields = [
            'empresa', 'colaborador', 'fecha_sesion',
            'created_at', 'updated_at',
        ]


# =============================================================================
# COMPLETAR NIVEL (input)
# =============================================================================

class CompletarNivelSerializer(serializers.Serializer):
    """Serializer de entrada para completar un nivel."""
    nivel_id = serializers.IntegerField(help_text='ID del nivel completado')
    puntaje = serializers.IntegerField(min_value=0, help_text='Puntaje obtenido')
    preguntas_correctas = serializers.IntegerField(min_value=0)
    preguntas_totales = serializers.IntegerField(min_value=0)
    epps_recolectados = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text='Lista de EPP IDs recolectados'
    )
    duracion_segundos = serializers.IntegerField(min_value=0)
    detalle_respuestas = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        help_text='[{"pregunta_id": 1, "respuesta": "b", "correcta": true}]'
    )

    def validate_nivel_id(self, value):
        """Valida que el nivel exista y esté activo."""
        try:
            GameLevel.objects.get(id=value, is_active=True)
        except GameLevel.DoesNotExist:
            raise serializers.ValidationError('Nivel no encontrado o no disponible.')
        return value


# =============================================================================
# LEADERBOARD DEL JUEGO
# =============================================================================

class GameLeaderboardSerializer(serializers.Serializer):
    """Serializer para el leaderboard del juego SST."""
    posicion = serializers.IntegerField()
    colaborador_id = serializers.IntegerField()
    colaborador_nombre = serializers.CharField()
    nivel_actual = serializers.IntegerField()
    xp_total = serializers.IntegerField()
    niveles_completados = serializers.IntegerField()
    precision_quizzes = serializers.FloatField()
