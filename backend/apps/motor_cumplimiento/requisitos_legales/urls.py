from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TipoRequisitoViewSet, RequisitoLegalViewSet, EmpresaRequisitoViewSet, AlertaVencimientoViewSet

router = DefaultRouter()
router.register(r"tipos-requisito", TipoRequisitoViewSet)
router.register(r"requisitos", RequisitoLegalViewSet)
router.register(r"empresa-requisitos", EmpresaRequisitoViewSet)
router.register(r"alertas", AlertaVencimientoViewSet)

urlpatterns = [path("", include(router.urls))]
