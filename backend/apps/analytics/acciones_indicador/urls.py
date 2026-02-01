"""URLs para Acciones por Indicador"""
from rest_framework.routers import DefaultRouter
from .views import (
    PlanAccionKPIViewSet, ActividadPlanKPIViewSet,
    SeguimientoPlanKPIViewSet, IntegracionAccionCorrectivaViewSet
)

router = DefaultRouter()
router.register(r'planes', PlanAccionKPIViewSet, basename='plan-accion-kpi')
router.register(r'actividades', ActividadPlanKPIViewSet, basename='actividad-plan-kpi')
router.register(r'seguimientos', SeguimientoPlanKPIViewSet, basename='seguimiento-plan-kpi')
router.register(r'integraciones', IntegracionAccionCorrectivaViewSet, basename='integracion-accion-correctiva')

urlpatterns = router.urls
