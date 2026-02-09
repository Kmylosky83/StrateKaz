"""
URLs para evidencias - motor_cumplimiento
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvidenciaViewSet

app_name = 'evidencias'

router = DefaultRouter()
router.register(r'', EvidenciaViewSet, basename='evidencia')

urlpatterns = [
    path('', include(router.urls)),
]
