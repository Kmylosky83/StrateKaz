"""
Configuración de la app Sistema Documental - HSEQ Management
"""
from django.apps import AppConfig


class SistemaDocumentalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.sistema_documental'
    verbose_name = 'Sistema Documental'
