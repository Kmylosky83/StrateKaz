"""
URLs para colaboradores - talent_hub
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'colaboradores'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
