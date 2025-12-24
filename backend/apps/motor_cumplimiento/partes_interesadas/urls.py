from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TipoParteInteresadaViewSet, ParteInteresadaViewSet, RequisitoParteInteresadaViewSet, MatrizComunicacionViewSet

router = DefaultRouter()
router.register(r"tipos", TipoParteInteresadaViewSet)
router.register(r"partes-interesadas", ParteInteresadaViewSet)
router.register(r"requisitos-pi", RequisitoParteInteresadaViewSet)
router.register(r"matriz-comunicacion", MatrizComunicacionViewSet)

urlpatterns = [path("", include(router.urls))]
