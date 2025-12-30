"""
Admin para Selección y Contratación - Talent Hub
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.contrib import admin
from .models import (
    TipoContrato,
    TipoEntidad,
    EntidadSeguridadSocial,
    TipoPrueba,
    VacanteActiva,
    Candidato,
    Entrevista,
    Prueba,
    AfiliacionSS,
)


# =============================================================================
# CATÁLOGOS
# =============================================================================

@admin.register(TipoContrato)
class TipoContratoAdmin(admin.ModelAdmin):
    """Admin para TipoContrato"""
    list_display = ['codigo', 'nombre', 'requiere_duracion', 'requiere_objeto', 'orden', 'is_active']
    list_filter = ['is_active', 'requiere_duracion', 'requiere_objeto']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']


@admin.register(TipoEntidad)
class TipoEntidadAdmin(admin.ModelAdmin):
    """Admin para TipoEntidad"""
    list_display = ['codigo', 'nombre', 'es_obligatorio', 'orden', 'is_active']
    list_filter = ['is_active', 'es_obligatorio']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']


@admin.register(EntidadSeguridadSocial)
class EntidadSeguridadSocialAdmin(admin.ModelAdmin):
    """Admin para EntidadSeguridadSocial"""
    list_display = ['codigo', 'nombre', 'tipo_entidad', 'nit', 'orden', 'is_active']
    list_filter = ['tipo_entidad', 'is_active']
    search_fields = ['codigo', 'nombre', 'razon_social', 'nit']
    ordering = ['tipo_entidad__orden', 'orden', 'nombre']


@admin.register(TipoPrueba)
class TipoPruebaAdmin(admin.ModelAdmin):
    """Admin para TipoPrueba"""
    list_display = [
        'codigo', 'nombre', 'permite_calificacion',
        'requiere_archivo', 'duracion_estimada_minutos', 'orden', 'is_active'
    ]
    list_filter = ['is_active', 'permite_calificacion', 'requiere_archivo']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']


# =============================================================================
# VACANTE ACTIVA
# =============================================================================

class CandidatoInline(admin.TabularInline):
    """Inline para candidatos en VacanteActiva"""
    model = Candidato
    extra = 0
    fields = ['nombres', 'apellidos', 'numero_documento', 'estado', 'fecha_postulacion']
    readonly_fields = ['fecha_postulacion']
    show_change_link = True


@admin.register(VacanteActiva)
class VacanteActivaAdmin(admin.ModelAdmin):
    """Admin para VacanteActiva"""
    list_display = [
        'codigo_vacante',
        'titulo',
        'cargo_requerido',
        'area',
        'tipo_contrato',
        'estado',
        'prioridad',
        'numero_posiciones',
        'fecha_apertura',
        'is_active',
    ]
    list_filter = [
        'estado',
        'prioridad',
        'modalidad',
        'tipo_contrato',
        'publicada_externamente',
        'is_active',
        'empresa',
    ]
    search_fields = [
        'codigo_vacante',
        'titulo',
        'cargo_requerido',
        'area',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    date_hierarchy = 'fecha_apertura'
    fieldsets = [
        ('Identificación', {
            'fields': ['empresa', 'codigo_vacante', 'titulo', 'cargo_requerido', 'area']
        }),
        ('Descripción', {
            'fields': [
                'descripcion',
                'requisitos_minimos',
                'requisitos_deseables',
                'funciones_principales',
                'competencias_requeridas',
            ]
        }),
        ('Condiciones Laborales', {
            'fields': [
                'tipo_contrato',
                'salario_minimo',
                'salario_maximo',
                'salario_oculto',
                'beneficios',
                'horario',
                'modalidad',
                'ubicacion',
            ]
        }),
        ('Gestión', {
            'fields': [
                'numero_posiciones',
                'estado',
                'prioridad',
                'fecha_apertura',
                'fecha_cierre_esperada',
                'fecha_cierre_real',
            ]
        }),
        ('Publicación', {
            'fields': ['publicada_externamente', 'url_publicacion']
        }),
        ('Responsables', {
            'fields': ['responsable_proceso', 'reclutador']
        }),
        ('Observaciones', {
            'fields': ['observaciones', 'motivo_cierre']
        }),
        ('Auditoría', {
            'fields': ['is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
            'classes': ['collapse'],
        }),
    ]
    inlines = [CandidatoInline]


# =============================================================================
# CANDIDATO
# =============================================================================

class EntrevistaInline(admin.TabularInline):
    """Inline para entrevistas en Candidato"""
    model = Entrevista
    extra = 0
    fields = [
        'numero_entrevista', 'tipo_entrevista', 'fecha_programada',
        'estado', 'calificacion_general', 'recomendacion'
    ]
    readonly_fields = ['numero_entrevista']
    show_change_link = True


class PruebaInline(admin.TabularInline):
    """Inline para pruebas en Candidato"""
    model = Prueba
    extra = 0
    fields = ['tipo_prueba', 'fecha_programada', 'estado', 'calificacion', 'aprobado']
    show_change_link = True


class AfiliacionSSInline(admin.TabularInline):
    """Inline para afiliaciones en Candidato"""
    model = AfiliacionSS
    extra = 0
    fields = ['entidad', 'estado', 'fecha_afiliacion', 'numero_afiliacion']
    show_change_link = True


@admin.register(Candidato)
class CandidatoAdmin(admin.ModelAdmin):
    """Admin para Candidato"""
    list_display = [
        'nombre_completo',
        'vacante',
        'numero_documento',
        'email',
        'estado',
        'nivel_educativo',
        'anos_experiencia',
        'calificacion_general',
        'fecha_postulacion',
        'is_active',
    ]
    list_filter = [
        'estado',
        'nivel_educativo',
        'origen_postulacion',
        'is_active',
        'empresa',
    ]
    search_fields = [
        'nombres',
        'apellidos',
        'numero_documento',
        'email',
        'vacante__codigo_vacante',
    ]
    readonly_fields = [
        'nombre_completo',
        'edad',
        'dias_en_proceso',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    date_hierarchy = 'fecha_postulacion'
    fieldsets = [
        ('Vacante', {
            'fields': ['empresa', 'vacante']
        }),
        ('Información Personal', {
            'fields': [
                'nombres', 'apellidos', 'nombre_completo',
                'tipo_documento', 'numero_documento',
                'fecha_nacimiento', 'edad', 'genero',
            ]
        }),
        ('Contacto', {
            'fields': [
                'email', 'telefono', 'telefono_alternativo',
                'ciudad', 'direccion',
            ]
        }),
        ('Perfil Profesional', {
            'fields': [
                'nivel_educativo', 'titulo_obtenido',
                'anos_experiencia', 'anos_experiencia_cargo',
            ]
        }),
        ('Gestión del Proceso', {
            'fields': [
                'estado', 'origen_postulacion',
                'fecha_postulacion', 'dias_en_proceso',
            ]
        }),
        ('Documentos', {
            'fields': ['hoja_vida', 'carta_presentacion']
        }),
        ('Pretensión y Disponibilidad', {
            'fields': [
                'pretension_salarial',
                'fecha_disponibilidad',
                'requiere_reubicacion',
                'disponibilidad_viajes',
            ]
        }),
        ('Referencias', {
            'fields': ['referido_por']
        }),
        ('Evaluación', {
            'fields': [
                'calificacion_general',
                'fortalezas',
                'debilidades',
                'observaciones',
                'motivo_rechazo',
            ]
        }),
        ('Contratación', {
            'fields': ['fecha_contratacion', 'salario_ofrecido']
        }),
        ('Auditoría', {
            'fields': ['is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
            'classes': ['collapse'],
        }),
    ]
    inlines = [EntrevistaInline, PruebaInline, AfiliacionSSInline]


# =============================================================================
# ENTREVISTA
# =============================================================================

@admin.register(Entrevista)
class EntrevistaAdmin(admin.ModelAdmin):
    """Admin para Entrevista"""
    list_display = [
        'candidato',
        'numero_entrevista',
        'tipo_entrevista',
        'fecha_programada',
        'entrevistador_principal',
        'estado',
        'calificacion_general',
        'recomendacion',
        'is_active',
    ]
    list_filter = [
        'estado',
        'tipo_entrevista',
        'recomendacion',
        'is_active',
    ]
    search_fields = [
        'candidato__nombres',
        'candidato__apellidos',
        'candidato__vacante__codigo_vacante',
    ]
    readonly_fields = [
        'numero_entrevista',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    date_hierarchy = 'fecha_programada'


# =============================================================================
# PRUEBA
# =============================================================================

@admin.register(Prueba)
class PruebaAdmin(admin.ModelAdmin):
    """Admin para Prueba"""
    list_display = [
        'candidato',
        'tipo_prueba',
        'fecha_programada',
        'estado',
        'calificacion',
        'aprobado',
        'responsable',
        'is_active',
    ]
    list_filter = [
        'estado',
        'tipo_prueba',
        'aprobado',
        'is_active',
    ]
    search_fields = [
        'candidato__nombres',
        'candidato__apellidos',
        'tipo_prueba__nombre',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    date_hierarchy = 'fecha_programada'


# =============================================================================
# AFILIACIÓN SEGURIDAD SOCIAL
# =============================================================================

@admin.register(AfiliacionSS)
class AfiliacionSSAdmin(admin.ModelAdmin):
    """Admin para AfiliacionSS"""
    list_display = [
        'candidato',
        'entidad',
        'estado',
        'fecha_solicitud',
        'fecha_afiliacion',
        'numero_afiliacion',
        'responsable_tramite',
        'is_active',
    ]
    list_filter = [
        'estado',
        'entidad__tipo_entidad',
        'is_active',
    ]
    search_fields = [
        'candidato__nombres',
        'candidato__apellidos',
        'entidad__nombre',
        'numero_afiliacion',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    date_hierarchy = 'fecha_solicitud'
