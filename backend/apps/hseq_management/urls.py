"""
URLs para HSEQ Management - Torre de Control

NOTA: sistema_documental migrado a gestion_estrategica.gestion_documental (N1)
      Nuevo path: /api/estrategia/gestion-documental/
"""
from django.urls import path, include

app_name = 'hseq_management'

urlpatterns = [
    # sistema_documental MIGRADO a N1 - ver gestion_estrategica/gestion_documental
    path('planificacion/', include('apps.hseq_management.planificacion_sistema.urls')),
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
