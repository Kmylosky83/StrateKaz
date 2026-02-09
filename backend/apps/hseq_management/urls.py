"""
URLs para HSEQ Management - Torre de Control (9 sub-apps)

planificacion_sistema y gestion_documental fueron migrados a gestion_estrategica (N1).
"""
from django.urls import path, include

app_name = 'hseq_management'

urlpatterns = [
    path('calidad/', include('apps.hseq_management.calidad.urls')),
    path('medicina/', include('apps.hseq_management.medicina_laboral.urls')),
    path('seguridad/', include('apps.hseq_management.seguridad_industrial.urls')),
    path('higiene/', include('apps.hseq_management.higiene_industrial.urls')),
    path('comites/', include('apps.hseq_management.gestion_comites.urls')),
    path('accidentalidad/', include('apps.hseq_management.accidentalidad.urls')),
    path('emergencias/', include('apps.hseq_management.emergencias.urls')),
    path('ambiental/', include('apps.hseq_management.gestion_ambiental.urls')),
    path('mejora/', include('apps.hseq_management.mejora_continua.urls')),
]
