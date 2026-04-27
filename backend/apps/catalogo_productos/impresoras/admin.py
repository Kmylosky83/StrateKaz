"""Admin para ImpresoraTermica."""
from django.contrib import admin

from .models import ImpresoraTermica


@admin.register(ImpresoraTermica)
class ImpresoraTermicaAdmin(admin.ModelAdmin):
    list_display = (
        'nombre', 'tipo_conexion', 'ancho_papel',
        'usuario_asignado', 'sede', 'is_active',
    )
    list_filter = ('tipo_conexion', 'ancho_papel', 'is_active')
    search_fields = ('nombre', 'direccion')
    autocomplete_fields = ('usuario_asignado', 'sede')
