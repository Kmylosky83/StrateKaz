"""
URLs para gestion_transporte - logistics_fleet
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'gestion_transporte'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
