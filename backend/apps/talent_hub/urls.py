"""
URLs para Talent Hub
Sistema de Gestión StrateKaz

Unifica las URLs de todas las apps del módulo Talent Hub:
- estructura_cargos: Profesiogramas, competencias, requisitos, vacantes
- seleccion_contratacion: Proceso de selección, candidatos, entrevistas, pruebas
- colaboradores: Empleados, hojas de vida, información personal, historial
- onboarding_induccion: Módulos de inducción, checklist, entregas EPP/activos
- formacion_reinduccion: Planes de formación, capacitaciones, gamificación, certificados
- desempeno: Evaluaciones 360°, planes de mejora, reconocimientos
- control_tiempo: Turnos, asistencia, horas extras, consolidados mensuales
- novedades: Incapacidades, licencias, permisos, vacaciones
- proceso_disciplinario: Llamados de atención, descargos, memorandos, historial
- nomina: Configuración, conceptos, periodos, liquidaciones, prestaciones, pagos
- off_boarding: Retiros, checklist, paz y salvos, exámenes, entrevistas, liquidación final
"""
from django.urls import path, include
from apps.talent_hub.api.people_analytics import PeopleAnalyticsView

app_name = 'talent_hub'

urlpatterns = [
    # Estructura de Cargos
    path('estructura-cargos/', include('apps.talent_hub.estructura_cargos.urls')),

    # Selección y Contratación
    path('seleccion/', include('apps.talent_hub.seleccion_contratacion.urls')),

    # Colaboradores (Empleados)
    path('empleados/', include('apps.talent_hub.colaboradores.urls')),

    # Onboarding e Inducción
    path('onboarding/', include('apps.talent_hub.onboarding_induccion.urls')),

    # Formación y Reinducción (LMS)
    path('formacion/', include('apps.talent_hub.formacion_reinduccion.urls')),

    # Desempeño (Evaluaciones, Planes de Mejora, Reconocimientos)
    path('desempeno/', include('apps.talent_hub.desempeno.urls')),

    # Control de Tiempo (Turnos, Asistencia, Horas Extras)
    path('control-tiempo/', include('apps.talent_hub.control_tiempo.urls')),

    # Novedades (Incapacidades, Licencias, Permisos, Vacaciones)
    path('novedades/', include('apps.talent_hub.novedades.urls')),

    # Proceso Disciplinario (Llamados de Atención, Descargos, Memorandos)
    path('proceso-disciplinario/', include('apps.talent_hub.proceso_disciplinario.urls')),

    # Nómina (Configuración, Liquidaciones, Prestaciones, Pagos)
    path('nomina/', include('apps.talent_hub.nomina.urls')),

    # Off-Boarding (Retiros, Paz y Salvos, Liquidación Final)
    path('off-boarding/', include('apps.talent_hub.off_boarding.urls')),

    # Portal Empleado (ESS - Employee Self-Service)
    path('mi-portal/', include('apps.talent_hub.api.ess_urls')),

    # Portal Jefe (MSS) → MOVIDO a apps.mi_equipo (L20, /api/mi-equipo/)

    # Consultores Externos
    path('consultores-externos/', include('apps.talent_hub.consultores_externos.urls')),

    # People Analytics
    path('people-analytics/', PeopleAnalyticsView.as_view(), name='people-analytics'),
]
