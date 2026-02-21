"""
Admin para Estructura de Cargos - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from .models import Profesiograma, MatrizCompetencia, RequisitoEspecial, Vacante


class MatrizCompetenciaInline(admin.TabularInline):
    """Inline para competencias dentro de Profesiograma"""
    model = MatrizCompetencia
    extra = 0
    fields = [
        'tipo_competencia',
        'nombre_competencia',
        'nivel_requerido',
        'criticidad',
        'peso_evaluacion',
        'is_active',
    ]


class RequisitoEspecialInline(admin.TabularInline):
    """Inline para requisitos especiales dentro de Profesiograma"""
    model = RequisitoEspecial
    extra = 0
    fields = [
        'tipo_requisito',
        'nombre_requisito',
        'criticidad',
        'es_renovable',
        'vigencia_meses',
        'is_active',
    ]


@admin.register(Profesiograma)
class ProfesiogramaAdmin(admin.ModelAdmin):
    """Admin para Profesiograma"""
    list_display = [
        'codigo',
        'nombre',
        'cargo',
        'area',
        'estado',
        'nivel_educativo_minimo',
        'experiencia_minima',
        'esta_vigente',
        'is_active',
    ]
    list_filter = [
        'estado',
        'nivel_educativo_minimo',
        'experiencia_minima',
        'is_active',
        'empresa',
    ]
    search_fields = [
        'codigo',
        'nombre',
        'cargo__name',
        'area__name',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    fieldsets = [
        ('Identificación', {
            'fields': ['empresa', 'codigo', 'nombre', 'descripcion', 'version', 'estado']
        }),
        ('Relaciones', {
            'fields': ['cargo', 'area']
        }),
        ('Requisitos Académicos', {
            'fields': [
                'nivel_educativo_minimo',
                'titulo_requerido',
                'areas_conocimiento',
                'formacion_complementaria',
            ]
        }),
        ('Experiencia', {
            'fields': [
                'experiencia_minima',
                'experiencia_especifica',
                'experiencia_cargos_similares',
            ]
        }),
        ('Competencias (Resumen)', {
            'fields': [
                'competencias_tecnicas_resumen',
                'competencias_blandas_resumen',
            ],
            'classes': ['collapse'],
        }),
        ('Salud Ocupacional', {
            'fields': [
                'examenes_medicos_ingreso',
                'examenes_medicos_periodicos',
                'periodicidad_examenes',
                'restricciones_medicas',
                'factores_riesgo',
                'epp_requeridos',
            ],
            'classes': ['collapse'],
        }),
        ('Certificaciones y Licencias', {
            'fields': [
                'requiere_licencia_conduccion',
                'categoria_licencia',
                'otras_certificaciones',
            ],
            'classes': ['collapse'],
        }),
        ('Condiciones del Cargo', {
            'fields': [
                'jornada_laboral',
                'disponibilidad_viajar',
                'disponibilidad_turnos',
                'condiciones_especiales',
            ],
            'classes': ['collapse'],
        }),
        ('Aprobación y Vigencia', {
            'fields': [
                'fecha_aprobacion',
                'aprobado_por',
                'fecha_vigencia_inicio',
                'fecha_vigencia_fin',
            ]
        }),
        ('Observaciones', {
            'fields': ['observaciones']
        }),
        ('Auditoría', {
            'fields': [
                'is_active',
                'created_at',
                'updated_at',
                'created_by',
                'updated_by',
            ],
            'classes': ['collapse'],
        }),
    ]
    inlines = [MatrizCompetenciaInline, RequisitoEspecialInline]

    def esta_vigente(self, obj):
        return obj.esta_vigente
    esta_vigente.boolean = True
    esta_vigente.short_description = 'Vigente'


@admin.register(MatrizCompetencia)
class MatrizCompetenciaAdmin(admin.ModelAdmin):
    """Admin para MatrizCompetencia"""
    list_display = [
        'nombre_competencia',
        'profesiograma',
        'tipo_competencia',
        'nivel_requerido',
        'criticidad',
        'peso_evaluacion',
        'is_active',
    ]
    list_filter = [
        'tipo_competencia',
        'nivel_requerido',
        'criticidad',
        'is_active',
    ]
    search_fields = [
        'nombre_competencia',
        'profesiograma__codigo',
        'profesiograma__nombre',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]


@admin.register(RequisitoEspecial)
class RequisitoEspecialAdmin(admin.ModelAdmin):
    """Admin para RequisitoEspecial"""
    list_display = [
        'nombre_requisito',
        'profesiograma',
        'tipo_requisito',
        'criticidad',
        'es_renovable',
        'vigencia_meses',
        'is_active',
    ]
    list_filter = [
        'tipo_requisito',
        'criticidad',
        'es_renovable',
        'is_active',
    ]
    search_fields = [
        'nombre_requisito',
        'profesiograma__codigo',
        'profesiograma__nombre',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]


@admin.register(Vacante)
class VacanteAdmin(admin.ModelAdmin):
    """Admin para Vacante"""
    list_display = [
        'codigo',
        'titulo_vacante',
        'cargo',
        'area',
        'estado',
        'prioridad',
        'cantidad_posiciones',
        'posiciones_cubiertas',
        'fecha_apertura',
        'esta_abierta',
        'is_active',
    ]
    list_filter = [
        'estado',
        'prioridad',
        'tipo_contrato',
        'motivo_vacante',
        'publicar_externamente',
        'is_active',
        'empresa',
    ]
    search_fields = [
        'codigo',
        'titulo_vacante',
        'cargo__name',
        'area__name',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'posiciones_pendientes',
        'dias_abierta',
    ]
    date_hierarchy = 'fecha_apertura'
    fieldsets = [
        ('Identificación', {
            'fields': ['empresa', 'codigo', 'titulo_vacante', 'descripcion']
        }),
        ('Relaciones', {
            'fields': ['cargo', 'area', 'profesiograma']
        }),
        ('Motivo y Cantidad', {
            'fields': [
                'motivo_vacante',
                'cantidad_posiciones',
                'posiciones_cubiertas',
                'posiciones_pendientes',
            ]
        }),
        ('Estado', {
            'fields': ['estado', 'prioridad']
        }),
        ('Condiciones Laborales', {
            'fields': [
                'tipo_contrato',
                'salario_minimo',
                'salario_maximo',
                'salario_a_convenir',
                'beneficios_adicionales',
            ]
        }),
        ('Fechas', {
            'fields': [
                'fecha_apertura',
                'fecha_cierre_estimada',
                'fecha_cierre_real',
                'fecha_incorporacion_deseada',
                'dias_abierta',
            ]
        }),
        ('Aprobación', {
            'fields': ['aprobado_por', 'fecha_aprobacion']
        }),
        ('Publicación', {
            'fields': ['publicar_externamente', 'canales_publicacion']
        }),
        ('Responsable', {
            'fields': ['responsable_reclutamiento']
        }),
        ('Observaciones', {
            'fields': ['observaciones', 'motivo_cierre']
        }),
        ('Auditoría', {
            'fields': [
                'is_active',
                'created_at',
                'updated_at',
                'created_by',
                'updated_by',
            ],
            'classes': ['collapse'],
        }),
    ]

    def esta_abierta(self, obj):
        return obj.esta_abierta
    esta_abierta.boolean = True
    esta_abierta.short_description = 'Abierta'

    def posiciones_pendientes(self, obj):
        return obj.posiciones_pendientes
    posiciones_pendientes.short_description = 'Pendientes'
