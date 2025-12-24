"""
URLs para matriz_legal - motor_cumplimiento
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TipoNormaViewSet, NormaLegalViewSet, EmpresaNormaViewSet

app_name = 'matriz_legal'

router = DefaultRouter()
router.register(r'tipos-norma', TipoNormaViewSet, basename='tipo-norma')
router.register(r'normas', NormaLegalViewSet, basename='norma-legal')
router.register(r'empresa-normas', EmpresaNormaViewSet, basename='empresa-norma')

urlpatterns = [
    path('', include(router.urls)),
]
