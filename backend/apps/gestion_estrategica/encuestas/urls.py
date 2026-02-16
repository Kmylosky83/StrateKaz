"""
URLs para Encuestas Colaborativas DOFA
=======================================

Rutas para gestión de encuestas, incluyendo endpoint público.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PreguntaContextoViewSet,
    EncuestaDofaViewSet,
    TemaEncuestaViewSet,
    ParticipanteEncuestaViewSet,
    RespuestaEncuestaViewSet,
    EncuestaPublicaView
)

app_name = 'encuestas'

router = DefaultRouter()
router.register(r'preguntas-contexto', PreguntaContextoViewSet, basename='pregunta-contexto')
router.register(r'encuestas', EncuestaDofaViewSet, basename='encuesta')
router.register(r'temas', TemaEncuestaViewSet, basename='tema')
router.register(r'participantes', ParticipanteEncuestaViewSet, basename='participante')
router.register(r'respuestas', RespuestaEncuestaViewSet, basename='respuesta')

urlpatterns = [
    # Endpoint público para diligenciamiento (sin autenticación)
    path(
        'publica/<uuid:token>/',
        EncuestaPublicaView.as_view(),
        name='encuesta-publica'
    ),

    # Rutas del router (requieren autenticación)
    path('', include(router.urls)),
]
