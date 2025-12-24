from django.contrib import admin
from .models import TipoRequisito, RequisitoLegal, EmpresaRequisito, AlertaVencimiento


@admin.register(TipoRequisito)
class TipoRequisitoAdmin(admin.ModelAdmin):
    list_display = ["codigo", "nombre", "requiere_renovacion", "dias_anticipacion_alerta", "is_active"]
    search_fields = ["codigo", "nombre"]


@admin.register(RequisitoLegal)
class RequisitoLegalAdmin(admin.ModelAdmin):
    list_display = ["codigo", "nombre", "tipo", "entidad_emisora", "es_obligatorio", "is_active"]
    list_filter = ["tipo", "aplica_sst", "aplica_ambiental", "aplica_calidad", "aplica_pesv"]
    search_fields = ["codigo", "nombre"]


@admin.register(EmpresaRequisito)
class EmpresaRequisitoAdmin(admin.ModelAdmin):
    list_display = ["requisito", "empresa_id", "numero_documento", "fecha_vencimiento", "estado"]
    list_filter = ["estado", "empresa_id"]
    date_hierarchy = "fecha_vencimiento"


@admin.register(AlertaVencimiento)
class AlertaVencimientoAdmin(admin.ModelAdmin):
    list_display = ["empresa_requisito", "dias_antes", "fecha_programada", "enviada"]
    list_filter = ["enviada", "tipo_alerta"]
