"""
URL Configuration for StrateKaz
Sistema Integrado de Gestión para Recolección de ACU
"""
import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, FileResponse, Http404
from django.views.static import serve
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


def health_check(request):
    """Health check endpoint for Docker."""
    return JsonResponse({"status": "healthy", "service": "grasas-huesos-backend"})


# ═══════════════════════════════════════════════════════════════
# Vista para servir el frontend SPA (React/Vite) en producción
# ═══════════════════════════════════════════════════════════════
import mimetypes
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'public')

# Asegurar tipos MIME correctos para assets modernos
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('font/woff', '.woff')
mimetypes.add_type('font/woff2', '.woff2')


def serve_frontend(request, path=''):
    """
    Sirve archivos estáticos del frontend o index.html para SPA routing.

    IMPORTANTE: Configurado para servir módulos ES6 con headers correctos
    para evitar problemas de carga de dependencias (React, Recharts, etc.)
    """
    if path and not path.startswith('api/') and not path.startswith('admin/'):
        # Intentar servir el archivo estático
        file_path = os.path.join(FRONTEND_DIR, path)
        if os.path.isfile(file_path):
            # Detectar content-type correcto
            content_type, encoding = mimetypes.guess_type(file_path)

            # Override para archivos JavaScript modernos
            if path.endswith('.js') or path.endswith('.mjs'):
                content_type = 'application/javascript'
            elif content_type is None:
                content_type = 'application/octet-stream'

            # Crear respuesta con headers apropiados
            response = FileResponse(open(file_path, 'rb'), content_type=content_type)

            # Headers críticos para módulos ES6
            if content_type == 'application/javascript':
                response['X-Content-Type-Options'] = 'nosniff'
                # Cache agresivo para assets con hash en producción
                if '-' in path or '.min.' in path:
                    response['Cache-Control'] = 'public, max-age=31536000, immutable'
                else:
                    response['Cache-Control'] = 'public, max-age=3600'

            # CORS headers si es necesario
            if request.META.get('HTTP_ORIGIN'):
                response['Access-Control-Allow-Origin'] = '*'

            return response

    # Para cualquier otra ruta (SPA routing), servir index.html
    index_path = os.path.join(FRONTEND_DIR, 'index.html')
    if os.path.isfile(index_path):
        response = FileResponse(open(index_path, 'rb'), content_type='text/html; charset=utf-8')
        # No cachear el index.html para que siempre se obtenga la última versión
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response

    raise Http404("Frontend not found")


urlpatterns = [
    # Health check
    path('api/health/', health_check, name='health_check'),

    # Admin panel
    path('admin/', admin.site.urls),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # JWT Authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API Core
    path('api/core/', include('apps.core.urls')),

    # Apps Legacy Funcionales (pendiente migración a supply_chain)
    path('api/proveedores/', include('apps.proveedores.urls')),  # LEGACY - pendiente eliminar

    # Supply Chain (Módulo 6 - Nivel Operativo)
    path('api/supply-chain/', include('apps.supply_chain.gestion_proveedores.urls')),

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

    # Production Ops - Operaciones de Producción (Módulo 7)
    path('api/production-ops/', include('apps.production_ops.urls')),

    # Logistics Fleet - Logística y Flota (Módulo 8)
    path('api/logistics-fleet/', include('apps.logistics_fleet.urls')),

    # Sales CRM - Ventas y CRM (Módulo 9)
    path('api/sales-crm/', include('apps.sales_crm.urls')),

    # Talent Hub - Gestión del Talento Humano (Módulo 10 - Habilitadores)
    path('api/talent-hub/', include('apps.talent_hub.urls')),

    # Admin Finance - Administración Financiera (Módulo 11 - Habilitadores)
    path('api/admin-finance/', include('apps.admin_finance.urls')),

    # Accounting - Contabilidad (Módulo 12 - ACTIVABLE)
    path('api/accounting/', include('apps.accounting.urls')),

    # Analytics - Analítica y Gestión de Indicadores (Módulo 13)
    path('api/analytics/', include('apps.analytics.urls')),

    # Audit System - Sistema de Auditoría y Notificaciones (Módulo 14)
    path('api/audit/', include('apps.audit_system.urls')),
]

# Serve media files in development
if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    except ImportError:
        pass
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# ═══════════════════════════════════════════════════════════════
# Catch-all para servir el frontend SPA en producción (cPanel)
# IMPORTANTE: Esta ruta debe ir AL FINAL para no interferir con API
# ═══════════════════════════════════════════════════════════════
if os.environ.get('USE_CPANEL', 'False').lower() == 'true':
    urlpatterns += [
        re_path(r'^(?P<path>.*)$', serve_frontend, name='frontend'),
    ]
