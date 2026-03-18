from django.contrib import admin
from .models import BibliotecaPlantilla


@admin.register(BibliotecaPlantilla)
class BibliotecaPlantillaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'industria', 'norma_iso_codigo', 'version', 'is_active']
    list_filter = ['categoria', 'industria', 'norma_iso_codigo', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['categoria', 'orden', 'nombre']
