"""
URLs para tareas_recordatorios - audit_system
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'tareas_recordatorios'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
