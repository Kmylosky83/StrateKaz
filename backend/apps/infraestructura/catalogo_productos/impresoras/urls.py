"""URLs para Impresoras (CT-layer)."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ImpresoraTermicaViewSet

app_name = 'impresoras'

router = DefaultRouter()
router.register('impresoras', ImpresoraTermicaViewSet, basename='impresoras')

urlpatterns = [
    path('', include(router.urls)),
]
