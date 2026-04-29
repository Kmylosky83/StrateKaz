"""URLs para Proveedores (CT)."""
from rest_framework.routers import DefaultRouter

from .viewsets import ProveedorViewSet, TipoProveedorViewSet

router = DefaultRouter()
router.register('tipos-proveedor', TipoProveedorViewSet, basename='tipos-proveedor')
router.register('proveedores', ProveedorViewSet, basename='proveedores')

urlpatterns = router.urls
