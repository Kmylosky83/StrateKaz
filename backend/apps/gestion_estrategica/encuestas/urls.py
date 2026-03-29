"""
URLs para Encuestas Colaborativas DOFA
=======================================
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PreguntaContextoViewSet,
    EncuestaDofaViewSet,
    TemaEncuestaViewSet,
    ParticipanteEncuestaViewSet,
    RespuestaEncuestaViewSet,
)

app_name = 'encuestas'

router = DefaultRouter()
router.register(r'preguntas-contexto', PreguntaContextoViewSet, basename='pregunta-contexto')
router.register(r'encuestas', EncuestaDofaViewSet, basename='encuesta')
router.register(r'temas', TemaEncuestaViewSet, basename='tema')
router.register(r'participantes', ParticipanteEncuestaViewSet, basename='participante')
router.register(r'respuestas', RespuestaEncuestaViewSet, basename='respuesta')

urlpatterns = [
    path('', include(router.urls)),
]
