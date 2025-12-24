"""
URLs para analisis_tendencias - analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'analisis_tendencias'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
