"""
URLs para Liquidaciones — Supply Chain S3
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LiquidacionViewSet

app_name = 'liquidaciones'

router = DefaultRouter()
router.register(r'liquidaciones', LiquidacionViewSet, basename='liquidacion')

urlpatterns = [
    path('', include(router.urls)),
]
