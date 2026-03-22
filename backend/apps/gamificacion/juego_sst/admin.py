"""
Admin para Juego SST: Los Héroes de la Seguridad
Módulo independiente — apps.gamificacion.juego_sst
"""
from django.contrib import admin
from .models import (
    GamificacionColaborador, GameLevel, GameQuizQuestion,
    GameProgress, GameSession,
)


@admin.register(GamificacionColaborador)
class GamificacionColaboradorAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'nivel', 'nombre_nivel', 'puntos_totales', 'puntos_mes', 'ultima_actividad']
    list_filter = ['nivel']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    ordering = ['-puntos_totales']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['colaborador']


@admin.register(GameLevel)
class GameLevelAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'zona', 'numero_nivel', 'puntos_completar', 'es_boss', 'orden']
    list_filter = ['zona', 'es_boss']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'numero_nivel']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(GameQuizQuestion)
class GameQuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['get_nivel', 'categoria', 'dificultad', 'puntos', 'get_pregunta_corta', 'orden']
    list_filter = ['categoria', 'dificultad', 'nivel__zona']
    search_fields = ['pregunta', 'norma_referencia']
    ordering = ['nivel__numero_nivel', 'orden']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['nivel']

    @admin.display(description='Nivel')
    def get_nivel(self, obj):
        return f"Nivel {obj.nivel.numero_nivel}"

    @admin.display(description='Pregunta')
    def get_pregunta_corta(self, obj):
        return obj.pregunta[:80] + '...' if len(obj.pregunta) > 80 else obj.pregunta


@admin.register(GameProgress)
class GameProgressAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'nivel_actual', 'xp_total', 'get_niveles_completados', 'precision_quizzes', 'sesiones_jugadas']
    list_filter = ['nivel_actual']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    ordering = ['-xp_total']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['colaborador']

    @admin.display(description='Completados')
    def get_niveles_completados(self, obj):
        return len(obj.niveles_completados or [])


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'get_nivel', 'puntaje', 'xp_ganado', 'completado', 'duracion_segundos', 'fecha_sesion']
    list_filter = ['completado', 'nivel__zona']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    ordering = ['-fecha_sesion']
    readonly_fields = ['created_at', 'updated_at', 'fecha_sesion']
    raw_id_fields = ['colaborador', 'nivel']

    @admin.display(description='Nivel')
    def get_nivel(self, obj):
        return f"Nivel {obj.nivel.numero_nivel}: {obj.nivel.nombre}"
