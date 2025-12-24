"""
URLs para indicadores_area - analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'indicadores_area'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
