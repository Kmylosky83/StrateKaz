"""
URLs para gestion_clientes - sales_crm
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'gestion_clientes'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
