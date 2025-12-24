"""
Admin para Seguridad Industrial
"""
from django.contrib import admin
from .models import (
    TipoPermisoTrabajo, PermisoTrabajo,
    TipoInspeccion, PlantillaInspeccion, Inspeccion, ItemInspeccion,
    TipoEPP, EntregaEPP,
    ProgramaSeguridad
)


# =============================================================================
# PERMISOS DE TRABAJO
# =============================================================================

@admin.register(TipoPermisoTrabajo)
class TipoPermisoTrabajoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'requiere_autorizacion_sst',
        'requiere_autorizacion_operaciones', 'duracion_maxima_horas',
        'orden', 'activo'
    ]
    list_filter = ['activo', 'requiere_autorizacion_sst', 'requiere_autorizacion_operaciones']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'color', 'orden', 'activo')
        }),
        ('Configuración de Autorización', {
            'fields': (
                'requiere_autorizacion_sst',
                'requiere_autorizacion_operaciones',
                'duracion_maxima_horas'
            )
        }),
        ('Checklist y EPP', {
            'fields': ('checklist_items', 'epp_requeridos')
        }),
    )


@admin.register(PermisoTrabajo)
class PermisoTrabajoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_permiso', 'tipo_permiso', 'ubicacion', 'solicitante',
        'fecha_inicio', 'fecha_fin', 'estado', 'autorizado_sst',
        'autorizado_operaciones'
    ]
    list_filter = [
        'estado', 'tipo_permiso', 'autorizado_sst', 'autorizado_operaciones',
        'fecha_inicio', 'empresa_id'
    ]
    search_fields = ['numero_permiso', 'ubicacion', 'descripcion_trabajo']
    readonly_fields = ['numero_permiso', 'duracion_horas']
    date_hierarchy = 'fecha_inicio'

    fieldsets = (
        ('Información del Permiso', {
            'fields': (
                'empresa_id', 'numero_permiso', 'tipo_permiso',
                'ubicacion', 'descripcion_trabajo'
            )
        }),
        ('Fechas y Duración', {
            'fields': ('fecha_inicio', 'fecha_fin', 'duracion_horas')
        }),
        ('Personal', {
            'fields': (
                'solicitante', 'ejecutor', 'supervisor',
                'requiere_vigilia', 'vigilia'
            )
        }),
        ('Autorización SST', {
            'fields': (
                'autorizado_sst', 'autorizado_sst_por', 'autorizado_sst_fecha'
            )
        }),
        ('Autorización Operaciones', {
            'fields': (
                'autorizado_operaciones', 'autorizado_operaciones_por',
                'autorizado_operaciones_fecha'
            )
        }),
        ('Verificación', {
            'fields': ('checklist_verificado', 'epp_verificado')
        }),
        ('Estado y Cierre', {
            'fields': (
                'estado', 'fecha_cierre', 'cerrado_por', 'observaciones_cierre'
            )
        }),
        ('Incidentes', {
            'fields': ('hubo_incidente', 'descripcion_incidente')
        }),
        ('Documentos', {
            'fields': ('documentos',)
        }),
    )


# =============================================================================
# INSPECCIONES
# =============================================================================

@admin.register(TipoInspeccion)
class TipoInspeccionAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'frecuencia_recomendada',
        'area_responsable', 'empresa_id', 'activo'
    ]
    list_filter = ['empresa_id', 'frecuencia_recomendada', 'activo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['empresa_id', 'orden', 'nombre']


@admin.register(PlantillaInspeccion)
class PlantillaInspeccionAdmin(admin.ModelAdmin):
    list_display = [
        'nombre', 'tipo_inspeccion', 'version',
        'requiere_calificacion_numerica', 'umbral_critico', 'activo'
    ]
    list_filter = ['empresa_id', 'tipo_inspeccion', 'activo', 'requiere_calificacion_numerica']
    search_fields = ['nombre', 'descripcion']
    readonly_fields = []

    fieldsets = (
        ('Información Básica', {
            'fields': (
                'empresa_id', 'tipo_inspeccion', 'nombre',
                'descripcion', 'version', 'activo'
            )
        }),
        ('Items de Verificación', {
            'fields': ('items',)
        }),
        ('Configuración de Calificación', {
            'fields': (
                'requiere_calificacion_numerica',
                'escala_minima', 'escala_maxima', 'umbral_critico'
            )
        }),
    )


class ItemInspeccionInline(admin.TabularInline):
    model = ItemInspeccion
    extra = 0
    readonly_fields = ['item_plantilla_id', 'categoria', 'descripcion', 'es_critico']
    fields = [
        'item_plantilla_id', 'categoria', 'descripcion', 'resultado',
        'calificacion', 'observaciones', 'genera_hallazgo'
    ]


@admin.register(Inspeccion)
class InspeccionAdmin(admin.ModelAdmin):
    list_display = [
        'numero_inspeccion', 'tipo_inspeccion', 'fecha_programada',
        'fecha_realizada', 'inspector', 'estado', 'porcentaje_cumplimiento',
        'resultado_global', 'tiene_hallazgos'
    ]
    list_filter = [
        'empresa_id', 'estado', 'tipo_inspeccion', 'resultado_global',
        'tiene_hallazgos', 'fecha_programada'
    ]
    search_fields = ['numero_inspeccion', 'ubicacion']
    readonly_fields = [
        'numero_inspeccion', 'porcentaje_cumplimiento',
        'calificacion_general', 'resultado_global'
    ]
    date_hierarchy = 'fecha_programada'
    inlines = [ItemInspeccionInline]

    fieldsets = (
        ('Información de la Inspección', {
            'fields': (
                'empresa_id', 'numero_inspeccion', 'tipo_inspeccion',
                'plantilla', 'ubicacion', 'area'
            )
        }),
        ('Programación', {
            'fields': (
                'fecha_programada', 'fecha_realizada',
                'inspector', 'acompanante', 'estado'
            )
        }),
        ('Resultados', {
            'fields': (
                'porcentaje_cumplimiento', 'calificacion_general',
                'resultado_global'
            )
        }),
        ('Hallazgos', {
            'fields': (
                'tiene_hallazgos', 'numero_hallazgos',
                'numero_hallazgos_criticos'
            )
        }),
        ('Observaciones', {
            'fields': ('observaciones_generales', 'recomendaciones')
        }),
        ('Evidencias', {
            'fields': ('fotos', 'documentos')
        }),
    )


# =============================================================================
# EPP
# =============================================================================

@admin.register(TipoEPP)
class TipoEPPAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'categoria', 'vida_util_dias',
        'requiere_talla', 'requiere_capacitacion', 'activo'
    ]
    list_filter = ['categoria', 'requiere_talla', 'requiere_capacitacion', 'es_desechable', 'activo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['categoria', 'orden', 'nombre']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'categoria', 'orden', 'activo')
        }),
        ('Vida Útil', {
            'fields': ('vida_util_dias', 'es_desechable')
        }),
        ('Configuración', {
            'fields': (
                'requiere_talla', 'tallas_disponibles',
                'requiere_capacitacion'
            )
        }),
        ('Normativas', {
            'fields': ('normas_aplicables',)
        }),
    )


@admin.register(EntregaEPP)
class EntregaEPPAdmin(admin.ModelAdmin):
    list_display = [
        'numero_entrega', 'tipo_epp', 'colaborador', 'fecha_entrega',
        'fecha_reposicion_programada', 'cantidad', 'estado',
        'capacitacion_realizada'
    ]
    list_filter = [
        'empresa_id', 'estado', 'tipo_epp__categoria',
        'capacitacion_realizada', 'fecha_entrega'
    ]
    search_fields = [
        'numero_entrega', 'colaborador__nombre_completo',
        'tipo_epp__nombre', 'serial'
    ]
    readonly_fields = ['numero_entrega']
    date_hierarchy = 'fecha_entrega'

    fieldsets = (
        ('Información de la Entrega', {
            'fields': (
                'empresa_id', 'numero_entrega', 'colaborador',
                'tipo_epp', 'cantidad'
            )
        }),
        ('Detalles del Elemento', {
            'fields': ('marca', 'modelo', 'talla', 'serial')
        }),
        ('Fechas', {
            'fields': (
                'fecha_entrega', 'fecha_reposicion_programada'
            )
        }),
        ('Responsable de la Entrega', {
            'fields': ('entregado_por',)
        }),
        ('Capacitación', {
            'fields': ('capacitacion_realizada', 'fecha_capacitacion')
        }),
        ('Estado', {
            'fields': (
                'estado', 'fecha_devolucion', 'motivo_devolucion'
            )
        }),
        ('Observaciones y Documentos', {
            'fields': ('observaciones', 'firma_colaborador', 'foto_entrega', 'documentos')
        }),
    )


# =============================================================================
# PROGRAMAS DE SEGURIDAD
# =============================================================================

@admin.register(ProgramaSeguridad)
class ProgramaSeguridadAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'tipo_programa', 'responsable',
        'fecha_inicio', 'fecha_fin', 'estado', 'porcentaje_avance', 'activo'
    ]
    list_filter = [
        'empresa_id', 'tipo_programa', 'estado', 'activo', 'fecha_inicio'
    ]
    search_fields = ['codigo', 'nombre', 'descripcion']
    readonly_fields = []
    date_hierarchy = 'fecha_inicio'
    filter_horizontal = ['equipo_apoyo']

    fieldsets = (
        ('Información del Programa', {
            'fields': (
                'empresa_id', 'codigo', 'nombre', 'descripcion',
                'tipo_programa', 'alcance', 'activo'
            )
        }),
        ('Responsables', {
            'fields': ('responsable', 'equipo_apoyo')
        }),
        ('Periodo', {
            'fields': ('fecha_inicio', 'fecha_fin')
        }),
        ('Objetivos e Indicadores', {
            'fields': ('objetivos', 'indicadores')
        }),
        ('Actividades', {
            'fields': ('actividades',)
        }),
        ('Recursos', {
            'fields': (
                'presupuesto_asignado', 'presupuesto_ejecutado',
                'recursos_requeridos'
            )
        }),
        ('Estado y Seguimiento', {
            'fields': (
                'estado', 'porcentaje_avance',
                'fecha_ultima_revision', 'resultado_ultima_revision'
            )
        }),
        ('Documentación', {
            'fields': ('documentos', 'normativa_aplicable')
        }),
    )
