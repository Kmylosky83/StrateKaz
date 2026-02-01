"""
URLs del Módulo Workflow Engine - Motor de Flujos de Trabajo
Nivel 2: Automatización y Orquestación de Procesos

Submódulos:
- disenador/: Diseñador de flujos BPMN (PlantillaFlujo, Paso)
- ejecucion/: Ejecución de flujos (InstanciaFlujo, TareaActiva)
- monitoreo/: Monitoreo y analytics (MetricaFlujo, AlertaFlujo)
- firma-digital/: Sistema de firma digital (FirmaDigital, Delegación, Revisión)
"""
from django.urls import path, include

urlpatterns = [
    # TAB: Diseñador de Flujos BPMN
    path('disenador/', include('apps.workflow_engine.disenador_flujos.urls')),

    # TAB: Ejecución de Flujos
    path('ejecucion/', include('apps.workflow_engine.ejecucion.urls')),

    # TAB: Monitoreo y Analytics
    path('monitoreo/', include('apps.workflow_engine.monitoreo.urls')),

    # TAB: Firma Digital (Fase 0.3.4 - Sistema centralizado de firmas)
    path('firma-digital/', include('apps.workflow_engine.firma_digital.urls')),
]
