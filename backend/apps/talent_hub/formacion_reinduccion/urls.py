"""
URLs para formacion_reinduccion - talent_hub
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'formacion_reinduccion'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
