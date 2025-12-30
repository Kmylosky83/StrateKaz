"""
URLs principal para Sales CRM (Módulo 9)
Sistema de Gestión Grasas y Huesos del Norte

Incluye todas las sub-apps:
- gestion_clientes: Gestión de clientes y contactos
- pipeline_ventas: Pipeline de oportunidades y cotizaciones
- pedidos_facturacion: Pedidos y facturación
- servicio_cliente: PQRS, encuestas y fidelización
"""
from django.urls import path, include

app_name = 'sales_crm'

urlpatterns = [
    # Gestión de Clientes
    path('clientes/', include('apps.sales_crm.gestion_clientes.urls')),

    # Pipeline de Ventas
    path('pipeline/', include('apps.sales_crm.pipeline_ventas.urls')),

    # Pedidos y Facturación
    path('pedidos/', include('apps.sales_crm.pedidos_facturacion.urls')),

    # Servicio al Cliente
    path('servicio/', include('apps.sales_crm.servicio_cliente.urls')),
]
