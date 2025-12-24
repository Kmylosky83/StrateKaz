"""
URLs del Módulo Motor de Riesgos - Nivel 2
Sistema Integrado de Gestión para Recolección de ACU

Este módulo consolida todas las apps relacionadas con la gestión de riesgos:
- Contexto Organizacional (DOFA/PESTEL)
- Riesgos de Procesos (ISO 31000)
- IPEVR - Peligros y Riesgos SST (GTC-45)
- Aspectos e Impactos Ambientales (ISO 14001)
- Riesgos Viales (PESV)
- SAGRILAFT/PTEE (Lavado de Activos)
- Seguridad de la Información (ISO 27001)
"""
from django.urls import path, include

app_name = 'motor_riesgos'

urlpatterns = [
    # Contexto Organizacional - DOFA/PESTEL
    path('contexto/', include('apps.motor_riesgos.contexto_organizacional.urls')),

    # Riesgos de Procesos - ISO 31000
    path('riesgos-procesos/', include('apps.motor_riesgos.riesgos_procesos.urls')),

    # IPEVR - Identificación de Peligros y Evaluación de Riesgos (GTC-45)
    path('ipevr/', include('apps.motor_riesgos.ipevr.urls')),

    # Aspectos e Impactos Ambientales - ISO 14001
    path('aspectos-ambientales/', include('apps.motor_riesgos.aspectos_ambientales.urls')),

    # Riesgos Viales - Plan Estratégico de Seguridad Vial (PESV)
    path('riesgos-viales/', include('apps.motor_riesgos.riesgos_viales.urls')),

    # SAGRILAFT/PTEE - Sistema de Administración de Riesgo de Lavado de Activos
    path('sagrilaft/', include('apps.motor_riesgos.sagrilaft_ptee.urls')),

    # Seguridad de la Información - ISO 27001
    path('seguridad-info/', include('apps.motor_riesgos.seguridad_informacion.urls')),
]
