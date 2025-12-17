# -*- coding: utf-8 -*-
"""
URLs del módulo Recepciones - Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecepcionViewSet

router = DefaultRouter()
router.register(r'', RecepcionViewSet, basename='recepcion')

urlpatterns = [
    # Router principal
    path('', include(router.urls)),
]
