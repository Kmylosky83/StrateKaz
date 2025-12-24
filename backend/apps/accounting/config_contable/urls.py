"""
URLs para config_contable - accounting
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'config_contable'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
