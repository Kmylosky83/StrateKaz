"""
URLs para novedades - talent_hub
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'novedades'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
