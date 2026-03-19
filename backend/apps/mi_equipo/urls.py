"""
URLs raíz de Mi Equipo (L20).

Incluye:
- Portal Jefe (MSS): /api/mi-equipo/
"""
from django.urls import path, include

app_name = 'mi_equipo'

urlpatterns = [
    path('', include('apps.mi_equipo.api.urls')),
]
