"""
URLs para pedidos_facturacion - sales_crm
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'pedidos_facturacion'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
