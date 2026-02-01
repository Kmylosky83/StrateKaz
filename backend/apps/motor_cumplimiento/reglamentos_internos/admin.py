from django.contrib import admin
from .models import TipoReglamento, Reglamento, VersionReglamento, PublicacionReglamento, SocializacionReglamento


@admin.register(TipoReglamento)
class TipoReglamentoAdmin(admin.ModelAdmin):
    list_display = ["codigo", "nombre", "vigencia_anios", "requiere_aprobacion_legal", "is_active"]


@admin.register(Reglamento)
class ReglamentoAdmin(admin.ModelAdmin):
    list_display = ["codigo", "nombre", "tipo", "version_actual", "estado", "fecha_vigencia"]
    list_filter = ["tipo", "estado", "empresa_id"]
    search_fields = ["codigo", "nombre"]
    date_hierarchy = "fecha_vigencia"


@admin.register(VersionReglamento)
class VersionReglamentoAdmin(admin.ModelAdmin):
    list_display = ["reglamento", "numero_version", "fecha_version", "elaborado_por"]
    list_filter = ["reglamento"]


@admin.register(PublicacionReglamento)
class PublicacionReglamentoAdmin(admin.ModelAdmin):
    list_display = ["reglamento", "version_publicada", "fecha_publicacion", "medio"]
    list_filter = ["medio"]
    date_hierarchy = "fecha_publicacion"


@admin.register(SocializacionReglamento)
class SocializacionReglamentoAdmin(admin.ModelAdmin):
    list_display = ["reglamento", "tipo", "fecha", "numero_asistentes", "facilitador"]
    list_filter = ["tipo"]
    date_hierarchy = "fecha"
