"""
URLs para informes_contables - accounting
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InformeContableViewSet, LineaInformeViewSet, GeneracionInformeViewSet

app_name = 'informes_contables'

router = DefaultRouter()
router.register(r'informes', InformeContableViewSet, basename='informe-contable')
router.register(r'lineas', LineaInformeViewSet, basename='linea-informe')
router.register(r'generaciones', GeneracionInformeViewSet, basename='generacion-informe')

urlpatterns = [
    path('', include(router.urls)),
]
