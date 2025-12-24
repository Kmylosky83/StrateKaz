"""
URLs para exportacion_integracion - analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'exportacion_integracion'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
