from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BibliotecaPlantillaViewSet

router = DefaultRouter()
router.register('plantillas', BibliotecaPlantillaViewSet, basename='biblioteca-plantillas')

urlpatterns = [
    path('', include(router.urls)),
]
