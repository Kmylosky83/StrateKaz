"""
URL Configuration for Supply Chain Module

Agrega las URLs de todas las sub-apps del módulo Supply Chain:
- gestion_proveedores: Gestión de proveedores, catálogos, evaluaciones
- almacenamiento: Inventarios, movimientos, kardex, alertas
- compras: Requisiciones, cotizaciones, órdenes de compra, contratos
- programacion_abastecimiento: Programación, ejecución, liquidación
"""
from django.urls import path, include


urlpatterns = [
    # Gestión de Proveedores (endpoints raíz: proveedores/, categorias-materia-prima/, etc.)
    path('', include('apps.supply_chain.gestion_proveedores.urls')),

    # Almacenamiento e Inventario
    path('almacenamiento/', include('apps.supply_chain.almacenamiento.urls')),

    # Compras (Requisiciones, Cotizaciones, Órdenes, Contratos)
    path('compras/', include('apps.supply_chain.compras.urls')),

    # Programación de Abastecimiento
    path('programacion-abastecimiento/', include('apps.supply_chain.programacion_abastecimiento.urls')),
]
