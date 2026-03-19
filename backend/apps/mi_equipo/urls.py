"""
URLs de Mi Equipo (L20).

Incluye:
- Portal Jefe (MSS): /api/mi-equipo/
- Estructura de Cargos: /api/mi-equipo/estructura-cargos/
- Selección y Contratación: /api/mi-equipo/seleccion/
- Colaboradores: /api/mi-equipo/empleados/
- Onboarding e Inducción: /api/mi-equipo/onboarding/
"""
from django.apps import apps
from django.urls import path, include

app_name = 'mi_equipo'


def _is_installed(app_label):
    try:
        apps.get_app_config(app_label)
        return True
    except LookupError:
        return False


urlpatterns = [
    # Portal Jefe (MSS)
    path('', include('apps.mi_equipo.api.urls')),
]

# Sub-apps de Mi Equipo
if _is_installed('estructura_cargos'):
    urlpatterns.append(path('estructura-cargos/', include('apps.mi_equipo.estructura_cargos.urls')))

if _is_installed('seleccion_contratacion'):
    urlpatterns.append(path('seleccion/', include('apps.mi_equipo.seleccion_contratacion.urls')))

if _is_installed('colaboradores'):
    urlpatterns.append(path('empleados/', include('apps.mi_equipo.colaboradores.urls')))

if _is_installed('onboarding_induccion'):
    urlpatterns.append(path('onboarding/', include('apps.mi_equipo.onboarding_induccion.urls')))
