"""
URLs para gestion_flota - logistics_fleet
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'gestion_flota'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
