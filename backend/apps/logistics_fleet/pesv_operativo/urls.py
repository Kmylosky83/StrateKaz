"""
URLs para pesv_operativo - logistics_fleet
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'pesv_operativo'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
