"""
URLs del Módulo Workflow Engine - Motor de Flujos de Trabajo
Nivel 2: Automatización y Orquestación de Procesos

Submódulos:
- disenador/: Diseñador de flujos BPMN (PlantillaFlujo, Paso)
- ejecucion/: Ejecución de flujos (InstanciaFlujo, TareaActiva)
- monitoreo/: Monitoreo y analytics (MetricaFlujo, AlertaFlujo)
- firma-digital/: Sistema de firma digital (FirmaDigital, Delegación, Revisión)
"""
from django.apps import apps
from django.urls import path, include

urlpatterns = []

# TAB: Diseñador de Flujos BPMN
if apps.is_installed('apps.infraestructura.workflow_engine.disenador_flujos'):
    urlpatterns.append(
        path('disenador/', include('apps.infraestructura.workflow_engine.disenador_flujos.urls')),
    )

# TAB: Ejecución de Flujos
if apps.is_installed('apps.infraestructura.workflow_engine.ejecucion'):
    urlpatterns.append(
        path('ejecucion/', include('apps.infraestructura.workflow_engine.ejecucion.urls')),
    )

# TAB: Monitoreo y Analytics
if apps.is_installed('apps.infraestructura.workflow_engine.monitoreo'):
    urlpatterns.append(
        path('monitoreo/', include('apps.infraestructura.workflow_engine.monitoreo.urls')),
    )

# TAB: Firma Digital
if apps.is_installed('apps.infraestructura.workflow_engine.firma_digital'):
    urlpatterns.append(
        path('firma-digital/', include('apps.infraestructura.workflow_engine.firma_digital.urls')),
    )
