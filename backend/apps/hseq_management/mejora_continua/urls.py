"""
URLs para mejora_continua - hseq_management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'mejora_continua'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
