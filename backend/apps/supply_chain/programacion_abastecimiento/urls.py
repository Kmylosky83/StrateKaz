"""
URLs para programacion_abastecimiento - supply_chain
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'programacion_abastecimiento'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
