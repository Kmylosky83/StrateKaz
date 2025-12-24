"""
URLs para config_indicadores - analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'config_indicadores'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
