"""
URL Configuration for StrateKaz
Sistema de Gestión Integral (SGI)

SISTEMA MODULAR: Las URLs se registran condicionalmente según las apps
que estén activas en INSTALLED_APPS (ver config/settings/base.py)

Hosting: VPS Hostinger | Producción: Nginx + Gunicorn
"""
import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, FileResponse, Http404
from django.views.static import serve
from django.apps import apps
from apps.core.views import RateLimitedTokenObtainPairView, RateLimitedTokenRefreshView
from apps.core.views.core_views import logout_view
from django.contrib.auth.decorators import login_required
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


def is_app_installed(app_name):
    """Helper para verificar si una app está instalada"""
    return apps.is_installed(app_name)


def health_check(request):
    """Health check endpoint básico para monitoreo de uptime."""
    return JsonResponse({"status": "healthy", "service": "stratekaz-backend"})


# ═══════════════════════════════════════════════════════════════
# Vista para servir el frontend SPA (React/Vite) en producción
# ═══════════════════════════════════════════════════════════════
import mimetypes

# Determine path based on environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BASE_DIR)

# Logic to find the frontend directory
# 1. Production: ../grasas.stratekaz.com (sibling of backend root)
# 2. Local: ../frontend/dist
production_frontend = os.path.join(os.path.dirname(ROOT_DIR), 'grasas.stratekaz.com')
local_frontend = os.path.join(ROOT_DIR, 'frontend', 'dist')

if os.path.isdir(production_frontend):
    FRONTEND_DIR = production_frontend
else:
    FRONTEND_DIR = local_frontend

# Asegurar tipos MIME correctos para assets modernos
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('font/woff', '.woff')
mimetypes.add_type('font/woff2', '.woff2')
# PWA manifest
mimetypes.add_type('application/manifest+json', '.webmanifest')


def serve_frontend(request, path=''):
    """
    Sirve archivos estáticos del frontend o index.html para SPA routing.

    IMPORTANTE: Configurado para servir módulos ES6 con headers correctos
    para evitar problemas de carga de dependencias (React, Recharts, etc.)

    NO debe interferir con rutas de Django (admin, static, api).
    """
    # Rutas que Django debe manejar - NO servir index.html para estas
    django_routes = ('admin/', 'static/', 'api/', 'media/', '__debug__/')
    if path.startswith(django_routes):
        raise Http404(f"Django should handle: {path}")

    # Intentar servir archivo estático del frontend
    if path:
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

    # Para rutas SPA (frontend React), servir index.html
    index_path = os.path.join(FRONTEND_DIR, 'index.html')
    if os.path.isfile(index_path):
        response = FileResponse(open(index_path, 'rb'), content_type='text/html; charset=utf-8')
        # No cachear el index.html para que siempre se obtenga la última versión
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response

    raise Http404("Frontend not found")


# ═══════════════════════════════════════════════════════════════════════════
# URL PATTERNS BASE (siempre activas)
# ═══════════════════════════════════════════════════════════════════════════
from apps.core.views import health_check_deep

urlpatterns = [
    # Health check endpoints
    path('api/health/', health_check, name='health_check'),
    path('api/health/deep/', health_check_deep, name='health_check_deep'),

    # Admin panel
    path('admin/', admin.site.urls),

    # API Documentation (protegido con login requerido)
    path('api/schema/', login_required(SpectacularAPIView.as_view()), name='schema'),
    path('api/docs/', login_required(SpectacularSwaggerView.as_view(url_name='schema')), name='swagger-ui'),
    path('api/redoc/', login_required(SpectacularRedocView.as_view(url_name='schema')), name='redoc'),

    # JWT Authentication (with rate limiting protection)
    path('api/auth/login/', RateLimitedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', RateLimitedTokenRefreshView.as_view(), name='token_refresh'),
    # P0-03: Logout endpoint para invalidar refresh tokens
    path('api/auth/logout/', logout_view, name='token_logout'),

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 0: CORE (siempre activo)
    # ═══════════════════════════════════════════════════════════════════════════
    path('api/core/', include('apps.core.urls')),
    # Multi-Tenant System
    path('api/tenant/', include('apps.tenant.urls')),
    # Inteligencia Artificial (ayuda contextual, asistente de texto)
    path('api/ia/', include('apps.ia.urls')),
    # Biblioteca Maestra (plantillas compartidas multi-tenant, Fase 8)
    path('api/shared-library/', include('apps.shared_library.urls')),
]

# ═══════════════════════════════════════════════════════════════════════════
# NIVEL 1: ESTRATÉGICO - Dirección Estratégica (6 apps)
# ═══════════════════════════════════════════════════════════════════════════
# URL canónica del módulo completo (incluye ViewSets estratégicos + sub-apps)
if is_app_installed('apps.gestion_estrategica.identidad'):
    urlpatterns.append(path('api/gestion-estrategica/', include('apps.gestion_estrategica.urls')))

# URLs directas a sub-apps (mantener por compatibilidad)
if is_app_installed('apps.gestion_estrategica.configuracion'):
    urlpatterns.append(path('api/configuracion/', include('apps.gestion_estrategica.configuracion.urls')))

if is_app_installed('apps.gestion_estrategica.organizacion'):
    urlpatterns.append(path('api/organizacion/', include('apps.gestion_estrategica.organizacion.urls')))

if is_app_installed('apps.gestion_estrategica.identidad'):
    urlpatterns.append(path('api/identidad/', include('apps.gestion_estrategica.identidad.urls')))

if is_app_installed('apps.gestion_estrategica.planeacion'):
    urlpatterns.append(path('api/planeacion/', include('apps.gestion_estrategica.planeacion.urls')))

if is_app_installed('apps.gestion_estrategica.encuestas'):
    urlpatterns.append(path('api/encuestas-dofa/', include('apps.gestion_estrategica.encuestas.urls')))

if is_app_installed('apps.gestion_estrategica.gestion_proyectos'):
    urlpatterns.append(path('api/proyectos/', include('apps.gestion_estrategica.gestion_proyectos.urls')))

if is_app_installed('apps.gestion_estrategica.revision_direccion'):
    urlpatterns.append(path('api/revision-direccion/', include('apps.gestion_estrategica.revision_direccion.urls')))

# ═══════════════════════════════════════════════════════════════════════════
# NIVEL 2: CUMPLIMIENTO - Motor Cumplimiento + Riesgos + Workflows
# ═══════════════════════════════════════════════════════════════════════════
if is_app_installed('apps.motor_cumplimiento.matriz_legal'):
    urlpatterns.append(path('api/cumplimiento/', include('apps.motor_cumplimiento.urls')))

if is_app_installed('apps.motor_riesgos.riesgos_procesos'):
    urlpatterns.append(path('api/riesgos/', include('apps.motor_riesgos.urls')))

if is_app_installed('apps.workflow_engine.disenador_flujos'):
    urlpatterns.append(path('api/workflows/', include('apps.workflow_engine.urls')))

# ═══════════════════════════════════════════════════════════════════════════
# NIVEL 3: TORRE DE CONTROL - HSEQ Management
# NOTA: sistema_documental migrado a N1 (gestion_estrategica.gestion_documental)
# ═══════════════════════════════════════════════════════════════════════════
if is_app_installed('apps.hseq_management.calidad'):
    urlpatterns.append(path('api/hseq/', include('apps.hseq_management.urls')))

# ═══════════════════════════════════════════════════════════════════════════
# NIVEL 4: CADENA DE VALOR - Supply + Production + Logistics + Sales
# ═══════════════════════════════════════════════════════════════════════════
if is_app_installed('apps.supply_chain.gestion_proveedores'):
    urlpatterns.append(path('api/supply-chain/', include('apps.supply_chain.urls')))

if is_app_installed('apps.production_ops.recepcion'):
    urlpatterns.append(path('api/production-ops/', include('apps.production_ops.urls')))

if is_app_installed('apps.logistics_fleet.gestion_flota'):
    urlpatterns.append(path('api/logistics-fleet/', include('apps.logistics_fleet.urls')))

if is_app_installed('apps.sales_crm.gestion_clientes'):
    urlpatterns.append(path('api/sales-crm/', include('apps.sales_crm.urls')))

# ═══════════════════════════════════════════════════════════════════════════
# NIVEL L20: MI EQUIPO — Portal Jefe + Ciclo de vinculación
# ═══════════════════════════════════════════════════════════════════════════
if is_app_installed('apps.mi_equipo'):
    urlpatterns.append(path('api/mi-equipo/', include('apps.mi_equipo.urls')))

# ═══════════════════════════════════════════════════════════════════════════
# GAMIFICACIÓN — Módulo independiente (Juego SST)
# ═══════════════════════════════════════════════════════════════════════════
if is_app_installed('apps.gamificacion.juego_sst'):
    urlpatterns.append(path('api/game/', include('apps.gamificacion.juego_sst.urls')))

# ═══════════════════════════════════════════════════════════════════════════
# NIVEL L60: TALENTO — Gestión continua (formación, desempeño, nómina)
# talent_hub/urls.py se auto-detecta: solo monta sub-apps instaladas
# ═══════════════════════════════════════════════════════════════════════════
if is_app_installed('apps.mi_equipo') or is_app_installed('apps.talent_hub.novedades'):
    urlpatterns.append(path('api/talent-hub/', include('apps.talent_hub.urls')))

if is_app_installed('apps.administracion.presupuesto'):
    urlpatterns.append(path('api/administracion/', include('apps.administracion.urls')))

if is_app_installed('apps.tesoreria.tesoreria'):
    urlpatterns.append(path('api/tesoreria/', include('apps.tesoreria.urls')))

if is_app_installed('apps.accounting.config_contable'):
    urlpatterns.append(path('api/accounting/', include('apps.accounting.urls')))

# ═══════════════════════════════════════════════════════════════════════════
# NIVEL 6: INTELIGENCIA - Analytics + Audit System
# ═══════════════════════════════════════════════════════════════════════════
if is_app_installed('apps.analytics.config_indicadores'):
    urlpatterns.append(path('api/analytics/', include('apps.analytics.urls')))

if is_app_installed('apps.audit_system.logs_sistema'):
    urlpatterns.append(path('api/audit/', include('apps.audit_system.urls')))

# Serve static and media files
if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    except ImportError:
        pass

# En desarrollo, Django sirve archivos estáticos y media directamente
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# ═══════════════════════════════════════════════════════════════
# Catch-all para servir el frontend SPA en producción (VPS)
# IMPORTANTE: Esta ruta debe ir AL FINAL para no interferir con API
# En producción (VPS Hostinger), Nginx sirve el frontend directamente.
# Este catch-all solo se usa como fallback si SERVE_FRONTEND=True.
# ═══════════════════════════════════════════════════════════════
if os.environ.get('SERVE_FRONTEND', 'False').lower() == 'true':
    urlpatterns += [
        re_path(r'^(?P<path>.*)$', serve_frontend, name='frontend'),
    ]
