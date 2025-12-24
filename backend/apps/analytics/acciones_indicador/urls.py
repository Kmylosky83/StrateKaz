"""
URLs para acciones_indicador - analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'acciones_indicador'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
