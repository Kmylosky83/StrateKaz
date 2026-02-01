"""
URLs para Dashboard Gerencial - Analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VistaDashboardViewSet, WidgetDashboardViewSet, FavoritoDashboardViewSet

router = DefaultRouter()
router.register(r'vistas', VistaDashboardViewSet, basename='vista-dashboard')
router.register(r'widgets', WidgetDashboardViewSet, basename='widget-dashboard')
router.register(r'favoritos', FavoritoDashboardViewSet, basename='favorito-dashboard')

urlpatterns = router.urls
