"""
URLs del Módulo Motor de Cumplimiento (Nivel 2)
Centraliza las rutas de todas las apps del módulo
"""
from django.urls import path, include

app_name = 'motor_cumplimiento'

urlpatterns = [
    # Matriz Legal y Cumplimiento
    path('matriz-legal/', include('apps.motor_cumplimiento.matriz_legal.urls')),

    # Requisitos Legales
    path('requisitos-legales/', include('apps.motor_cumplimiento.requisitos_legales.urls')),

    # Partes Interesadas ELIMINADO — fuente canónica en gestion_estrategica.contexto (ISO 9001:2015 §4.2)

    # Reglamentos Internos
    path('reglamentos-internos/', include('apps.motor_cumplimiento.reglamentos_internos.urls')),

    # Evidencias Centralizadas
    path('evidencias/', include('apps.motor_cumplimiento.evidencias.urls')),
]
