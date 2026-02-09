"""
Admin de Control de Tiempo - Talent Hub
"""
from django.contrib import admin
from .models import Turno, AsignacionTurno, RegistroAsistencia, HoraExtra, ConsolidadoAsistencia, ConfiguracionRecargo


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'hora_inicio', 'hora_fin', 'duracion_jornada', 'aplica_recargo_nocturno', 'is_active']
    list_filter = ['aplica_recargo_nocturno', 'is_active', 'created_at']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    
    fieldsets = (
        ('Informacion Basica', {
            'fields': ('empresa', 'codigo', 'nombre', 'descripcion', 'color')
        }),
        ('Horario', {
            'fields': ('hora_inicio', 'hora_fin', 'duracion_jornada', 'aplica_recargo_nocturno')
        }),
        ('Dias de Aplicacion', {
            'fields': ('dias_semana',)
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AsignacionTurno)
class AsignacionTurnoAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'turno', 'fecha_inicio', 'fecha_fin', 'es_rotativo', 'is_active']
    list_filter = ['es_rotativo', 'is_active', 'fecha_inicio', 'turno']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    autocomplete_fields = ['colaborador', 'turno']
    
    fieldsets = (
        ('Asignacion', {
            'fields': ('empresa', 'colaborador', 'turno')
        }),
        ('Periodo', {
            'fields': ('fecha_inicio', 'fecha_fin', 'es_rotativo')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(RegistroAsistencia)
class RegistroAsistenciaAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'fecha', 'turno', 'hora_entrada', 'hora_salida', 'estado', 'minutos_tardanza']
    list_filter = ['estado', 'fecha', 'turno']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    readonly_fields = ['minutos_tardanza', 'created_at', 'updated_at', 'created_by', 'updated_by']
    autocomplete_fields = ['colaborador', 'turno', 'registrado_por']
    date_hierarchy = 'fecha'
    
    fieldsets = (
        ('Registro', {
            'fields': ('empresa', 'colaborador', 'turno', 'fecha', 'estado')
        }),
        ('Horarios', {
            'fields': ('hora_entrada', 'hora_salida', 'hora_entrada_almuerzo', 'hora_salida_almuerzo')
        }),
        ('Tardanza', {
            'fields': ('minutos_tardanza',)
        }),
        ('Observaciones', {
            'fields': ('observaciones', 'registrado_por')
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(HoraExtra)
class HoraExtraAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'fecha', 'hora_inicio', 'hora_fin', 'tipo', 'horas_trabajadas', 'estado', 'aprobado']
    list_filter = ['tipo', 'estado', 'aprobado', 'fecha']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    readonly_fields = ['horas_trabajadas', 'factor_recargo', 'aprobado_por', 'fecha_aprobacion', 'created_at', 'updated_at']
    autocomplete_fields = ['colaborador']
    date_hierarchy = 'fecha'
    
    fieldsets = (
        ('Hora Extra', {
            'fields': ('empresa', 'colaborador', 'fecha', 'hora_inicio', 'hora_fin', 'tipo')
        }),
        ('Calculo', {
            'fields': ('horas_trabajadas', 'factor_recargo')
        }),
        ('Justificacion', {
            'fields': ('justificacion',)
        }),
        ('Aprobacion', {
            'fields': ('estado', 'aprobado', 'aprobado_por', 'fecha_aprobacion')
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ConsolidadoAsistencia)
class ConsolidadoAsistenciaAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'anio', 'mes', 'dias_trabajados', 'total_horas_trabajadas', 'total_horas_extras', 'porcentaje_asistencia', 'cerrado']
    list_filter = ['anio', 'mes', 'cerrado']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    readonly_fields = ['dias_trabajados', 'dias_ausente', 'dias_tardanza', 'total_horas_trabajadas',
                       'total_horas_extras', 'total_minutos_tardanza', 'porcentaje_asistencia',
                       'cerrado_por', 'fecha_cierre', 'created_at', 'updated_at']
    autocomplete_fields = ['colaborador']

    fieldsets = (
        ('Periodo', {
            'fields': ('empresa', 'colaborador', 'anio', 'mes')
        }),
        ('Contadores', {
            'fields': ('dias_trabajados', 'dias_ausente', 'dias_tardanza')
        }),
        ('Horas', {
            'fields': ('total_horas_trabajadas', 'total_horas_extras', 'total_minutos_tardanza')
        }),
        ('Indicadores', {
            'fields': ('porcentaje_asistencia',)
        }),
        ('Cierre', {
            'fields': ('cerrado', 'cerrado_por', 'fecha_cierre')
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ConfiguracionRecargo)
class ConfiguracionRecargoAdmin(admin.ModelAdmin):
    """Admin para Configuracion de Recargos - Ley 2466/2025"""
    list_display = [
        'tipo_hora_extra', 'factor_vigente',
        'factor_fase_1', 'fecha_inicio_fase_1',
        'factor_fase_2', 'fecha_inicio_fase_2',
        'factor_fase_3', 'fecha_inicio_fase_3',
        'is_active',
    ]
    list_filter = ['tipo_hora_extra', 'is_active', 'empresa']
    search_fields = ['tipo_hora_extra']
    ordering = ['tipo_hora_extra']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    fieldsets = (
        ('Configuracion', {
            'fields': ('empresa', 'tipo_hora_extra')
        }),
        ('Factor Vigente', {
            'fields': ('factor_vigente',),
            'description': 'Factor de recargo vigente antes de la Ley 2466/2025',
        }),
        ('Fase 1 - Julio 2025 (80%)', {
            'fields': ('factor_fase_1', 'fecha_inicio_fase_1')
        }),
        ('Fase 2 - Julio 2026 (90%)', {
            'fields': ('factor_fase_2', 'fecha_inicio_fase_2')
        }),
        ('Fase 3 - Julio 2027 (100%)', {
            'fields': ('factor_fase_3', 'fecha_inicio_fase_3')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
