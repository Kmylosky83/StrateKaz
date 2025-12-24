"""
URLs para logs_sistema - audit_system
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'logs_sistema'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
