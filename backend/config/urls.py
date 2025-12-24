"""
URL Configuration for Grasas y Huesos del Norte S.A.S
Sistema Integrado de Gestión para Recolección de ACU
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def health_check(request):
    """Health check endpoint for Docker."""
    return JsonResponse({"status": "healthy", "service": "grasas-huesos-backend"})


urlpatterns = [
    # Health check
    path('api/health/', health_check, name='health_check'),

    # Admin panel
    path('admin/', admin.site.urls),
    
    # JWT Authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API Core
    path('api/core/', include('apps.core.urls')),

    # Apps Legacy Funcionales (pendiente migración a supply_chain)
    path('api/proveedores/', include('apps.proveedores.urls')),

    # Dirección Estratégica (Módulo 1 - Nivel Estratégico)
    path('api/organizacion/', include('apps.gestion_estrategica.organizacion.urls')),
    path('api/configuracion/', include('apps.gestion_estrategica.configuracion.urls')),
    path('api/identidad/', include('apps.gestion_estrategica.identidad.urls')),
    path('api/planeacion/', include('apps.gestion_estrategica.planeacion.urls')),
    path('api/proyectos/', include('apps.gestion_estrategica.gestion_proyectos.urls')),
    path('api/revision-direccion/', include('apps.gestion_estrategica.revision_direccion.urls')),

    # Motor de Cumplimiento (Módulo 2 - Nivel Cumplimiento)
    path('api/cumplimiento/', include('apps.motor_cumplimiento.urls')),

    # Motor de Riesgos (Módulo 3 - Nivel Riesgos)
    path('api/riesgos/', include('apps.motor_riesgos.urls')),

    # Motor de Flujos (Módulo 4 - Automatización)
    path('api/workflows/', include('apps.workflow_engine.urls')),

    # HSEQ Management - Torre de Control (Módulo 5)
    path('api/hseq/', include('apps.hseq_management.urls')),
]

# Serve media files in development
if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
