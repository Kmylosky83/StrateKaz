"""
URLs para control_tiempo - talent_hub
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'control_tiempo'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
