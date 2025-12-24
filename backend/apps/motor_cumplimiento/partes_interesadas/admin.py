from django.contrib import admin
from .models import TipoParteInteresada, ParteInteresada, RequisitoParteInteresada, MatrizComunicacion


@admin.register(TipoParteInteresada)
class TipoParteInteresadaAdmin(admin.ModelAdmin):
    list_display = ["codigo", "nombre", "categoria", "is_active"]
    list_filter = ["categoria", "is_active"]


@admin.register(ParteInteresada)
class ParteInteresadaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "tipo", "nivel_influencia", "nivel_interes", "empresa_id"]
    list_filter = ["tipo", "nivel_influencia", "nivel_interes"]
    search_fields = ["nombre", "representante"]


@admin.register(RequisitoParteInteresada)
class RequisitoParteInteresadaAdmin(admin.ModelAdmin):
    list_display = ["parte_interesada", "tipo", "prioridad", "cumple"]
    list_filter = ["tipo", "prioridad", "cumple"]


@admin.register(MatrizComunicacion)
class MatrizComunicacionAdmin(admin.ModelAdmin):
    list_display = ["parte_interesada", "que_comunicar", "cuando_comunicar", "como_comunicar", "responsable"]
    list_filter = ["cuando_comunicar", "como_comunicar"]
