"""
URLs para informes_contables - accounting
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'informes_contables'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
