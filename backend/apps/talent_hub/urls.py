"""
URLs para Talent Hub (L60)

Sub-apps de gestión continua del colaborador.
Las sub-apps L20 (estructura_cargos, selección, colaboradores, onboarding)
se movieron a apps.mi_equipo — ver mi_equipo/urls.py.

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
# L60: TALENTO — Gestión continua (se activan después)
# ═══════════════════════════════════════════════════════════════════════════
if _is_installed('novedades'):
    urlpatterns.append(path('novedades/', include('apps.talent_hub.novedades.urls')))

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

# ESS (Mi Portal) — MOVIDO a apps.mi_portal (app LIVE independiente)
# Ya no se monta aquí. Ver config/urls.py → api/mi-portal/

if _is_installed('consultores_externos'):
    urlpatterns.append(path('consultores-externos/', include('apps.talent_hub.consultores_externos.urls')))

# People Analytics — solo si hay datos de colaboradores
if _is_installed('colaboradores'):
    from apps.talent_hub.api.people_analytics import PeopleAnalyticsView
    urlpatterns.append(path('people-analytics/', PeopleAnalyticsView.as_view(), name='people-analytics'))
