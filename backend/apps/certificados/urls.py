from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.recolecciones.views import CertificadoViewSet

router = DefaultRouter()
router.register(r'', CertificadoViewSet, basename='certificado')

urlpatterns = [
    path('', include(router.urls)),
]
