"""
URLs para tesoreria - admin_finance
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'tesoreria'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
