"""
URLs principales del módulo Logistics Fleet.
Consolida todas las rutas de las apps de logística y flota.
"""
from django.urls import path, include

app_name = 'logistics_fleet'

urlpatterns = [
    path('flota/', include('apps.logistics_fleet.gestion_flota.urls')),
    path('transporte/', include('apps.logistics_fleet.gestion_transporte.urls')),
]
