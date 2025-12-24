"""
URLs para dashboard_gerencial - analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'dashboard_gerencial'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
