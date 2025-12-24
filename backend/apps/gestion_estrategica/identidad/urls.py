"""
URLs del módulo Identidad Corporativa - Dirección Estratégica
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CorporateIdentityViewSet, CorporateValueViewSet

app_name = 'identidad'

router = DefaultRouter()
router.register(r'identidad', CorporateIdentityViewSet, basename='corporate-identity')
router.register(r'valores', CorporateValueViewSet, basename='corporate-values')

urlpatterns = [
    path('', include(router.urls)),
]
