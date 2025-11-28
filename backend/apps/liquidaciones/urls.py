from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

# Registrar ViewSets aquí
# router.register(r'endpoint', ViewSetName, basename='basename')

urlpatterns = [
    path('', include(router.urls)),
]
