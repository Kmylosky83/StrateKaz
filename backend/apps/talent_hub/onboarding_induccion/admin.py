"""
Admin para Onboarding e Inducción - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from .models import (
    ModuloInduccion,
    AsignacionPorCargo,
    ItemChecklist,
    ChecklistIngreso,
    EjecucionIntegral,
    EntregaEPP,
    EntregaActivo,
    FirmaDocumento,
)


@admin.register(ModuloInduccion)
class ModuloInduccionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_modulo', 'duracion_minutos', 'es_obligatorio', 'is_active']
    list_filter = ['tipo_modulo', 'formato_contenido', 'es_obligatorio', 'requiere_evaluacion', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(AsignacionPorCargo)
class AsignacionPorCargoAdmin(admin.ModelAdmin):
    list_display = ['cargo', 'modulo', 'es_obligatorio', 'dias_para_completar', 'orden_ejecucion']
    list_filter = ['es_obligatorio', 'cargo']
    search_fields = ['cargo__nombre', 'modulo__nombre']
    ordering = ['cargo', 'orden_ejecucion']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ItemChecklist)
class ItemChecklistAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'descripcion', 'categoria', 'requiere_adjunto', 'aplica_a_todos', 'is_active']
    list_filter = ['categoria', 'aplica_a_todos', 'requiere_adjunto', 'is_active']
    search_fields = ['codigo', 'descripcion']
    ordering = ['categoria', 'orden']
    filter_horizontal = ['cargos_aplicables']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ChecklistIngreso)
class ChecklistIngresoAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'item', 'estado', 'fecha_cumplimiento', 'verificado_por']
    list_filter = ['estado', 'item__categoria']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'item__descripcion']
    ordering = ['colaborador', 'item__orden']
    readonly_fields = ['created_at', 'updated_at', 'fecha_verificacion']


@admin.register(EjecucionIntegral)
class EjecucionIntegralAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'modulo', 'estado', 'fecha_limite', 'progreso_porcentaje', 'nota_obtenida']
    list_filter = ['estado', 'modulo__tipo_modulo']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'modulo__nombre']
    ordering = ['colaborador', 'modulo__orden']
    readonly_fields = ['created_at', 'updated_at', 'fecha_asignacion']


@admin.register(EntregaEPP)
class EntregaEPPAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'tipo_epp', 'descripcion', 'fecha_entrega', 'fecha_vencimiento', 'recibido_conforme']
    list_filter = ['tipo_epp', 'recibido_conforme']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'descripcion']
    ordering = ['-fecha_entrega']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EntregaActivo)
class EntregaActivoAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'tipo_activo', 'descripcion', 'codigo_activo', 'fecha_entrega', 'devuelto']
    list_filter = ['tipo_activo', 'devuelto', 'estado_entrega']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'descripcion', 'codigo_activo']
    ordering = ['-fecha_entrega']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FirmaDocumento)
class FirmaDocumentoAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'tipo_documento', 'nombre_documento', 'fecha_firma', 'firmado', 'metodo_firma']
    list_filter = ['tipo_documento', 'firmado', 'metodo_firma']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'nombre_documento']
    ordering = ['-fecha_firma']
    readonly_fields = ['created_at', 'updated_at']
