# -*- coding: utf-8 -*-
"""
App Config para Planificacion del Sistema - HSEQ Management
"""
from django.apps import AppConfig


class PlanificacionSistemaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.planificacion_sistema'
    verbose_name = 'Planificacion del Sistema HSEQ'
