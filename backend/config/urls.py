"""
URL Configuration for Grasas y Huesos del Norte S.A.S
Sistema Integrado de Gestión para Recolección de ACU
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # JWT Authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API Apps
    path('api/core/', include('apps.core.urls')),
    path('api/unidades/', include('apps.unidades.urls')),
    path('api/proveedores/', include('apps.proveedores.urls')),
    path('api/ecoaliados/', include('apps.ecoaliados.urls')),
    path('api/programaciones/', include('apps.programaciones.urls')),
    path('api/recolecciones/', include('apps.recolecciones.urls')),
    path('api/recepciones/', include('apps.recepciones.urls')),
    path('api/lotes/', include('apps.lotes.urls')),
    path('api/liquidaciones/', include('apps.liquidaciones.urls')),
    path('api/certificados/', include('apps.certificados.urls')),
    path('api/reportes/', include('apps.reportes.urls')),

    # Dirección Estratégica (Módulo 1)
    path('api/organizacion/', include('apps.gestion_estrategica.organizacion.urls')),
    path('api/configuracion/', include('apps.gestion_estrategica.configuracion.urls')),
]

# Serve media files in development
if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
