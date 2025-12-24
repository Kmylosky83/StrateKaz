"""
URLs del Módulo Workflow Engine - Motor de Flujos de Trabajo
Nivel 2: Automatización y Orquestación de Procesos
"""
from django.urls import path, include

urlpatterns = [
    # TAB: Diseñador de Flujos BPMN
    path('disenador/', include('apps.workflow_engine.disenador_flujos.urls')),

    # TAB: Ejecución de Flujos
    path('ejecucion/', include('apps.workflow_engine.ejecucion.urls')),

    # TAB: Monitoreo y Analytics
    path('monitoreo/', include('apps.workflow_engine.monitoreo.urls')),
]
