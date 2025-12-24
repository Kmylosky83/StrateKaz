"""
URLs para Gestión de Proyectos (PMI)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PortafolioViewSet, ProgramaViewSet, ProyectoViewSet,
    ProjectCharterViewSet, InteresadoProyectoViewSet,
    FaseProyectoViewSet, ActividadProyectoViewSet,
    RecursoProyectoViewSet, RiesgoProyectoViewSet,
    SeguimientoProyectoViewSet, LeccionAprendidaViewSet,
    ActaCierreViewSet
)

router = DefaultRouter()

# Portafolio
router.register(r'portafolios', PortafolioViewSet)
router.register(r'programas', ProgramaViewSet)

# Iniciación
router.register(r'proyectos', ProyectoViewSet)
router.register(r'charters', ProjectCharterViewSet)

# Planificación
router.register(r'interesados', InteresadoProyectoViewSet)
router.register(r'fases', FaseProyectoViewSet)
router.register(r'actividades', ActividadProyectoViewSet)
router.register(r'recursos', RecursoProyectoViewSet)

# Ejecución/Monitoreo
router.register(r'riesgos', RiesgoProyectoViewSet)
router.register(r'seguimientos', SeguimientoProyectoViewSet)

# Cierre
router.register(r'lecciones', LeccionAprendidaViewSet)
router.register(r'actas-cierre', ActaCierreViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
