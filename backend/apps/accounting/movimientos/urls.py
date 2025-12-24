"""
URLs para movimientos - accounting
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'movimientos'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
