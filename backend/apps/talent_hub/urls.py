"""
URLs para Talent Hub
Sistema de Gestión StrateKaz

Sub-apps divididas en dos niveles de cascada:
- L20 (Mi Equipo): estructura_cargos, seleccion, colaboradores, onboarding, novedades
- L60 (Talento):   formacion, desempeno, control_tiempo, nomina, disciplinario, off_boarding

Solo se incluyen las URLs de sub-apps que estén en INSTALLED_APPS.
"""
from django.apps import apps
from django.urls import path, include

app_name = 'talent_hub'


def _is_installed(app_label):
    """Verifica si una app está en INSTALLED_APPS."""
    try:
        apps.get_app_config(app_label)
        return True
    except LookupError:
        return False


urlpatterns = []

# ═══════════════════════════════════════════════════════════════════════════
# L20: MI EQUIPO — Ciclo de vinculación (se activan con mi_equipo)
# ═══════════════════════════════════════════════════════════════════════════
if _is_installed('estructura_cargos'):
    urlpatterns.append(path('estructura-cargos/', include('apps.talent_hub.estructura_cargos.urls')))

if _is_installed('seleccion_contratacion'):
    urlpatterns.append(path('seleccion/', include('apps.talent_hub.seleccion_contratacion.urls')))

if _is_installed('colaboradores'):
    urlpatterns.append(path('empleados/', include('apps.talent_hub.colaboradores.urls')))

if _is_installed('onboarding_induccion'):
    urlpatterns.append(path('onboarding/', include('apps.talent_hub.onboarding_induccion.urls')))

if _is_installed('novedades'):
    urlpatterns.append(path('novedades/', include('apps.talent_hub.novedades.urls')))

# ═══════════════════════════════════════════════════════════════════════════
# L60: TALENTO — Gestión continua (se activan después)
# ═══════════════════════════════════════════════════════════════════════════
if _is_installed('formacion_reinduccion'):
    urlpatterns.append(path('formacion/', include('apps.talent_hub.formacion_reinduccion.urls')))

if _is_installed('desempeno'):
    urlpatterns.append(path('desempeno/', include('apps.talent_hub.desempeno.urls')))

if _is_installed('control_tiempo'):
    urlpatterns.append(path('control-tiempo/', include('apps.talent_hub.control_tiempo.urls')))

if _is_installed('nomina'):
    urlpatterns.append(path('nomina/', include('apps.talent_hub.nomina.urls')))

if _is_installed('proceso_disciplinario'):
    urlpatterns.append(path('proceso-disciplinario/', include('apps.talent_hub.proceso_disciplinario.urls')))

if _is_installed('off_boarding'):
    urlpatterns.append(path('off-boarding/', include('apps.talent_hub.off_boarding.urls')))

# ═══════════════════════════════════════════════════════════════════════════
# Portales y servicios transversales
# ═══════════════════════════════════════════════════════════════════════════
if _is_installed('colaboradores'):
    # ESS solo funciona si colaboradores está activo
    urlpatterns.append(path('mi-portal/', include('apps.talent_hub.api.ess_urls')))

# Portal Jefe (MSS) → MOVIDO a apps.mi_equipo (L20, /api/mi-equipo/)

if _is_installed('consultores_externos'):
    urlpatterns.append(path('consultores-externos/', include('apps.talent_hub.consultores_externos.urls')))

# People Analytics — solo si hay datos de colaboradores
if _is_installed('colaboradores'):
    from apps.talent_hub.api.people_analytics import PeopleAnalyticsView
    urlpatterns.append(path('people-analytics/', PeopleAnalyticsView.as_view(), name='people-analytics'))
