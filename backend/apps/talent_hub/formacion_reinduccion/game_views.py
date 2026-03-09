"""
Views para Juego SST: Los Héroes de la Seguridad
Talent Hub - StrateKaz

Endpoints para niveles, preguntas, progreso y sesiones del juego.
Accesible desde Mi Portal por todos los colaboradores.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.db.models import F

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    GameLevel, GameQuizQuestion, GameProgress, GameSession,
    GamificacionColaborador,
)
from .game_serializers import (
    GameLevelListSerializer, GameLevelDetailSerializer,
    GameQuizQuestionSerializer, GameProgressSerializer,
    GameSessionSerializer, CompletarNivelSerializer,
    GameLeaderboardSerializer,
)


class GameViewSet(viewsets.ViewSet):
    """
    ViewSet para el Juego SST: Los Héroes de la Seguridad.

    Endpoints:
    - GET  /mi-progreso/         → Progreso del jugador actual
    - GET  /niveles/             → Lista de niveles disponibles
    - GET  /niveles/{id}/preguntas/ → Preguntas quiz de un nivel
    - POST /completar-nivel/     → Registrar completación de nivel
    - GET  /leaderboard-juego/   → Ranking del juego
    - GET  /historial/           → Historial de sesiones del jugador
    """
    permission_classes = [IsAuthenticated]

    def _get_colaborador(self, request):
        """Obtiene el colaborador asociado al usuario autenticado."""
        user = request.user
        if hasattr(user, 'colaborador'):
            return user.colaborador
        return None

    def _get_or_create_progress(self, colaborador):
        """Obtiene o crea el progreso del juego para un colaborador."""
        empresa = get_tenant_empresa()
        progress, created = GameProgress.objects.get_or_create(
            colaborador=colaborador,
            defaults={
                'empresa': empresa,
                'created_by': colaborador.usuario,
                'updated_by': colaborador.usuario,
            }
        )
        return progress

    # =========================================================================
    # MI PROGRESO
    # =========================================================================

    @action(detail=False, methods=['get'], url_path='mi-progreso')
    def mi_progreso(self, request):
        """Retorna el progreso del jugador actual (lo crea si no existe)."""
        colaborador = self._get_colaborador(request)
        if not colaborador:
            return Response(
                {'detail': 'No tienes un perfil de colaborador asociado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        progress = self._get_or_create_progress(colaborador)
        serializer = GameProgressSerializer(progress)
        return Response(serializer.data)

    # =========================================================================
    # NIVELES
    # =========================================================================

    @action(detail=False, methods=['get'], url_path='niveles')
    def niveles(self, request):
        """Lista los niveles disponibles con estado de completado del jugador."""
        niveles = GameLevel.objects.filter(
            is_active=True
        ).prefetch_related('preguntas').order_by('orden', 'numero_nivel')

        serializer = GameLevelListSerializer(niveles, many=True)
        data = serializer.data

        # Agregar estado de completado por jugador
        colaborador = self._get_colaborador(request)
        if colaborador:
            try:
                progress = GameProgress.objects.get(colaborador=colaborador)
                completados = progress.niveles_completados or []
                mejores = progress.mejor_puntaje_nivel or {}
                for nivel_data in data:
                    nivel_id = nivel_data['id']
                    nivel_data['completado'] = nivel_id in completados
                    nivel_data['mejor_puntaje'] = mejores.get(str(nivel_id), 0)
                    # Desbloqueado si es nivel 1 o el anterior está completado
                    numero = nivel_data['numero_nivel']
                    if numero == 1:
                        nivel_data['desbloqueado'] = True
                    else:
                        # Buscar si el nivel anterior está completado
                        nivel_anterior = GameLevel.objects.filter(
                            numero_nivel=numero - 1, is_active=True
                        ).first()
                        nivel_data['desbloqueado'] = (
                            nivel_anterior and nivel_anterior.id in completados
                        )
            except GameProgress.DoesNotExist:
                for nivel_data in data:
                    nivel_data['completado'] = False
                    nivel_data['mejor_puntaje'] = 0
                    nivel_data['desbloqueado'] = nivel_data['numero_nivel'] == 1

        return Response(data)

    @action(
        detail=False, methods=['get'],
        url_path='niveles/(?P<nivel_id>[0-9]+)/preguntas'
    )
    def nivel_preguntas(self, request, nivel_id=None):
        """Retorna las preguntas quiz de un nivel específico."""
        try:
            nivel = GameLevel.objects.get(id=nivel_id, is_active=True)
        except GameLevel.DoesNotExist:
            return Response(
                {'detail': 'Nivel no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        preguntas = GameQuizQuestion.objects.filter(
            nivel=nivel, is_active=True
        ).order_by('orden')

        serializer = GameQuizQuestionSerializer(preguntas, many=True)
        return Response(serializer.data)

    # =========================================================================
    # COMPLETAR NIVEL
    # =========================================================================

    @action(detail=False, methods=['post'], url_path='completar-nivel')
    @transaction.atomic
    def completar_nivel(self, request):
        """
        Registra la completación de un nivel.

        Crea una GameSession, actualiza GameProgress,
        y sincroniza con GamificacionColaborador.
        """
        colaborador = self._get_colaborador(request)
        if not colaborador:
            return Response(
                {'detail': 'No tienes un perfil de colaborador asociado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CompletarNivelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        nivel = GameLevel.objects.get(id=data['nivel_id'])
        empresa = get_tenant_empresa()
        progress = self._get_or_create_progress(colaborador)

        # Calcular XP ganado
        xp_base = nivel.puntos_completar
        precision = (
            data['preguntas_correctas'] / max(data['preguntas_totales'], 1)
        )
        xp_ganado = int(xp_base * precision)

        # Determinar si completó el nivel
        completado = (
            data['preguntas_correctas'] >= nivel.min_preguntas_correctas
        )

        # 1. Crear GameSession
        session = GameSession.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            nivel=nivel,
            puntaje=data['puntaje'],
            xp_ganado=xp_ganado,
            preguntas_correctas=data['preguntas_correctas'],
            preguntas_totales=data['preguntas_totales'],
            epps_recolectados=data.get('epps_recolectados', []),
            completado=completado,
            duracion_segundos=data['duracion_segundos'],
            detalle_respuestas=data.get('detalle_respuestas', []),
            created_by=request.user,
            updated_by=request.user,
        )

        # 2. Actualizar GameProgress
        progress.xp_total += xp_ganado
        progress.xp_nivel_actual += xp_ganado
        progress.preguntas_correctas += data['preguntas_correctas']
        progress.preguntas_totales += data['preguntas_totales']
        progress.tiempo_jugado_segundos += data['duracion_segundos']
        progress.sesiones_jugadas += 1
        progress.ultima_sesion = timezone.now()

        # Level up check
        while progress.xp_nivel_actual >= progress.xp_siguiente_nivel:
            progress.xp_nivel_actual -= progress.xp_siguiente_nivel
            progress.nivel_actual += 1
            progress.xp_siguiente_nivel = int(
                progress.xp_siguiente_nivel * 1.5
            )

        if completado:
            # Marcar nivel como completado
            completados = progress.niveles_completados or []
            if nivel.id not in completados:
                completados.append(nivel.id)
                progress.niveles_completados = completados

            # Mejor puntaje
            mejores = progress.mejor_puntaje_nivel or {}
            nivel_key = str(nivel.id)
            if data['puntaje'] > mejores.get(nivel_key, 0):
                mejores[nivel_key] = data['puntaje']
                progress.mejor_puntaje_nivel = mejores

            # EPPs recolectados (acumular)
            epps = progress.epps_recolectados or []
            for epp in data.get('epps_recolectados', []):
                if epp not in epps:
                    epps.append(epp)
            progress.epps_recolectados = epps

        progress.updated_by = request.user
        progress.save()

        # 3. Sincronizar con GamificacionColaborador
        self._sync_gamificacion(colaborador, progress, xp_ganado)

        # Response
        response_data = {
            'sesion': GameSessionSerializer(session).data,
            'progreso': GameProgressSerializer(progress).data,
            'completado': completado,
            'xp_ganado': xp_ganado,
            'level_up': progress.nivel_actual > (progress.nivel_actual - 1),
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

    def _sync_gamificacion(self, colaborador, game_progress, xp_ganado):
        """Sincroniza el progreso del juego con GamificacionColaborador."""
        empresa = get_tenant_empresa()
        gamificacion, _ = GamificacionColaborador.objects.get_or_create(
            colaborador=colaborador,
            defaults={
                'empresa': empresa,
                'created_by': colaborador.usuario,
                'updated_by': colaborador.usuario,
            }
        )

        # Sumar puntos del juego
        gamificacion.puntos_totales = F('puntos_totales') + xp_ganado
        gamificacion.puntos_mes = F('puntos_mes') + xp_ganado
        gamificacion.puntos_anio = F('puntos_anio') + xp_ganado
        gamificacion.ultima_actividad = timezone.now()

        # Sincronizar nivel
        NOMBRES_NIVEL = {
            1: 'Novato', 2: 'Aprendiz', 3: 'Inspector Jr.',
            4: 'Inspector', 5: 'Inspector Sr.', 6: 'Supervisor SST',
            7: 'Jefe SST', 8: 'Director SST', 9: 'Experto SST',
            10: 'Héroe de la Seguridad',
        }
        gamificacion.nivel = game_progress.nivel_actual
        gamificacion.nombre_nivel = NOMBRES_NIVEL.get(
            game_progress.nivel_actual,
            f'Nivel {game_progress.nivel_actual}'
        )
        gamificacion.updated_by = colaborador.usuario
        gamificacion.save()

    # =========================================================================
    # LEADERBOARD
    # =========================================================================

    @action(detail=False, methods=['get'], url_path='leaderboard-juego')
    def leaderboard_juego(self, request):
        """Retorna el ranking del juego SST."""
        limite = int(request.query_params.get('limite', 10))
        progresiones = GameProgress.objects.filter(
            is_active=True,
            xp_total__gt=0,
        ).select_related('colaborador').order_by('-xp_total')[:limite]

        data = []
        for i, progress in enumerate(progresiones, 1):
            data.append({
                'posicion': i,
                'colaborador_id': progress.colaborador.id,
                'colaborador_nombre': progress.colaborador.get_nombre_completo(),
                'nivel_actual': progress.nivel_actual,
                'xp_total': progress.xp_total,
                'niveles_completados': len(progress.niveles_completados or []),
                'precision_quizzes': progress.precision_quizzes,
            })

        serializer = GameLeaderboardSerializer(data, many=True)
        return Response(serializer.data)

    # =========================================================================
    # HISTORIAL
    # =========================================================================

    @action(detail=False, methods=['get'], url_path='historial')
    def historial(self, request):
        """Retorna el historial de sesiones del jugador actual."""
        colaborador = self._get_colaborador(request)
        if not colaborador:
            return Response(
                {'detail': 'No tienes un perfil de colaborador asociado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        sesiones = GameSession.objects.filter(
            colaborador=colaborador, is_active=True
        ).select_related('nivel').order_by('-fecha_sesion')[:50]

        serializer = GameSessionSerializer(sesiones, many=True)
        return Response(serializer.data)
