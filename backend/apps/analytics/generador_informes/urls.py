"""
URLs para generador_informes - analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'generador_informes'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
