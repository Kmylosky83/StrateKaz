"""
URLs del módulo Planeación Estratégica - Dirección Estratégica
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StrategicPlanViewSet, StrategicObjectiveViewSet

app_name = 'planeacion'

router = DefaultRouter()
router.register(r'planes', StrategicPlanViewSet, basename='strategic-plans')
router.register(r'objetivos', StrategicObjectiveViewSet, basename='strategic-objectives')

urlpatterns = [
    path('', include(router.urls)),
]
