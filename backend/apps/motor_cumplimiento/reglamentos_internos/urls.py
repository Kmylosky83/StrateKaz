from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TipoReglamentoViewSet, ReglamentoViewSet, VersionReglamentoViewSet, PublicacionReglamentoViewSet, SocializacionReglamentoViewSet

router = DefaultRouter()
router.register(r"tipos-reglamento", TipoReglamentoViewSet)
router.register(r"reglamentos", ReglamentoViewSet)
router.register(r"versiones", VersionReglamentoViewSet)
router.register(r"publicaciones", PublicacionReglamentoViewSet)
router.register(r"socializaciones", SocializacionReglamentoViewSet)

urlpatterns = [path("", include(router.urls))]
