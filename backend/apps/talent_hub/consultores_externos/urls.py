"""
URLs para Consultores Externos - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .viewsets import ConsultorExternoViewSet

app_name = 'consultores_externos'

router = DefaultRouter()
router.register(r'', ConsultorExternoViewSet, basename='consultor-externo')

urlpatterns = [
    path('', include(router.urls)),
]
