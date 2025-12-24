"""
URLs para pipeline_ventas - sales_crm
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'pipeline_ventas'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
