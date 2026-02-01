"""
Admin para Formación y Reinducción - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from .models import (
    PlanFormacion,
    Capacitacion,
    ProgramacionCapacitacion,
    EjecucionCapacitacion,
    Badge,
    GamificacionColaborador,
    BadgeColaborador,
    EvaluacionEficacia,
    Certificado,
)


@admin.register(PlanFormacion)
class PlanFormacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'anio', 'fecha_inicio', 'fecha_fin', 'aprobado', 'is_active']
    list_filter = ['anio', 'aprobado', 'is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['-anio', '-fecha_inicio']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'fecha_inicio'


@admin.register(Capacitacion)
class CapacitacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_capacitacion', 'modalidad', 'duracion_horas', 'estado', 'puntos_otorgados', 'is_active']
    list_filter = ['tipo_capacitacion', 'modalidad', 'estado', 'requiere_evaluacion', 'genera_certificado', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['plan_formacion', 'instructor_interno']
    filter_horizontal = ['cargos_objetivo']


@admin.register(ProgramacionCapacitacion)
class ProgramacionCapacitacionAdmin(admin.ModelAdmin):
    list_display = ['capacitacion', 'numero_sesion', 'titulo_sesion', 'fecha', 'hora_inicio', 'hora_fin', 'inscritos', 'estado']
    list_filter = ['estado', 'fecha']
    search_fields = ['capacitacion__nombre', 'titulo_sesion', 'lugar']
    ordering = ['fecha', 'hora_inicio']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['capacitacion', 'instructor']
    date_hierarchy = 'fecha'


@admin.register(EjecucionCapacitacion)
class EjecucionCapacitacionAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'get_capacitacion', 'get_fecha', 'estado', 'asistio', 'nota_evaluacion', 'puntos_ganados']
    list_filter = ['estado', 'asistio']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'programacion__capacitacion__nombre']
    ordering = ['-programacion__fecha']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['colaborador', 'programacion']

    @admin.display(description='Capacitación')
    def get_capacitacion(self, obj):
        return obj.programacion.capacitacion.nombre if obj.programacion else '-'

    @admin.display(description='Fecha')
    def get_fecha(self, obj):
        return obj.programacion.fecha if obj.programacion else '-'


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'puntos_requeridos', 'orden', 'is_active']
    list_filter = ['tipo', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(GamificacionColaborador)
class GamificacionColaboradorAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'nivel', 'nombre_nivel', 'puntos_totales', 'badges_obtenidos', 'capacitaciones_completadas', 'racha_actual']
    list_filter = ['nivel']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    ordering = ['-puntos_totales']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['colaborador']


@admin.register(BadgeColaborador)
class BadgeColaboradorAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'badge', 'fecha_obtencion']
    list_filter = ['badge', 'fecha_obtencion']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'badge__nombre']
    ordering = ['-fecha_obtencion']
    readonly_fields = ['created_at', 'updated_at', 'fecha_obtencion']
    raw_id_fields = ['colaborador', 'badge']


@admin.register(EvaluacionEficacia)
class EvaluacionEficaciaAdmin(admin.ModelAdmin):
    list_display = ['get_colaborador', 'get_capacitacion', 'nivel_evaluacion', 'calificacion', 'fecha_evaluacion', 'requiere_refuerzo']
    list_filter = ['nivel_evaluacion', 'requiere_refuerzo']
    search_fields = ['ejecucion__colaborador__primer_nombre', 'ejecucion__colaborador__primer_apellido']
    ordering = ['-fecha_evaluacion']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['ejecucion', 'evaluador']

    @admin.display(description='Colaborador')
    def get_colaborador(self, obj):
        return obj.ejecucion.colaborador.get_nombre_corto() if obj.ejecucion else '-'

    @admin.display(description='Capacitación')
    def get_capacitacion(self, obj):
        return obj.ejecucion.programacion.capacitacion.nombre if obj.ejecucion and obj.ejecucion.programacion else '-'


@admin.register(Certificado)
class CertificadoAdmin(admin.ModelAdmin):
    list_display = ['numero_certificado', 'titulo_capacitacion', 'get_colaborador', 'fecha_emision', 'fecha_vencimiento', 'anulado']
    list_filter = ['anulado', 'fecha_emision']
    search_fields = ['numero_certificado', 'titulo_capacitacion', 'ejecucion__colaborador__primer_nombre']
    ordering = ['-fecha_emision']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by', 'fecha_emision', 'codigo_verificacion']
    raw_id_fields = ['ejecucion']
    date_hierarchy = 'fecha_emision'

    @admin.display(description='Colaborador')
    def get_colaborador(self, obj):
        return obj.ejecucion.colaborador.get_nombre_corto() if obj.ejecucion else '-'
