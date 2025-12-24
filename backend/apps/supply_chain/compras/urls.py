"""
URLs para compras - supply_chain
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'compras'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
