"""
URLs para config_alertas - audit_system
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'config_alertas'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
