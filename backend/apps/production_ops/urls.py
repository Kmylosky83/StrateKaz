"""
URLs principales del módulo Production Ops.
Consolida todas las rutas de las apps de operaciones de producción.
"""
from django.urls import path, include

app_name = 'production_ops'

urlpatterns = [
    path('recepcion/', include('apps.production_ops.recepcion.urls')),
    path('procesamiento/', include('apps.production_ops.procesamiento.urls')),
    path('mantenimiento/', include('apps.production_ops.mantenimiento.urls')),
    path('producto-terminado/', include('apps.production_ops.producto_terminado.urls')),
]
