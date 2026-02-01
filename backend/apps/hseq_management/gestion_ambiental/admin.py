"""
Admin para Gestión Ambiental - HSEQ Management
"""
from django.contrib import admin
from .models import (
    TipoResiduo, GestorAmbiental, RegistroResiduo,
    Vertimiento, FuenteEmision, RegistroEmision,
    TipoRecurso, ConsumoRecurso, CalculoHuellaCarbono,
    CertificadoAmbiental
)


# ============================================================================
# RESIDUOS
# ============================================================================

@admin.register(TipoResiduo)
class TipoResiduoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'clase', 'color_contenedor',
        'requiere_tratamiento_especial', 'activo'
    ]
    list_filter = ['clase', 'activo', 'requiere_tratamiento_especial']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'clase', 'codigo_cer')
        }),
        ('Características de Peligrosidad', {
            'fields': (
                'es_corrosivo', 'es_reactivo', 'es_explosivo',
                'es_toxico', 'es_inflamable', 'es_infeccioso'
            ),
            'classes': ('collapse',)
        }),
        ('Tratamiento y Manejo', {
            'fields': (
                'requiere_tratamiento_especial', 'instrucciones_manejo',
                'color_contenedor'
            )
        }),
        ('Estado', {
            'fields': ('activo',)
        })
    )


@admin.register(GestorAmbiental)
class GestorAmbientalAdmin(admin.ModelAdmin):
    list_display = [
        'razon_social', 'nit', 'tipo_gestor', 'ciudad',
        'fecha_vencimiento_licencia', 'activo'
    ]
    list_filter = ['tipo_gestor', 'activo', 'ciudad']
    search_fields = ['razon_social', 'nit']
    filter_horizontal = ['tipos_residuos']
    ordering = ['razon_social']

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa_id', 'razon_social', 'nit', 'tipo_gestor')
        }),
        ('Licencias y Permisos', {
            'fields': (
                'numero_licencia_ambiental', 'fecha_expedicion_licencia',
                'fecha_vencimiento_licencia', 'autoridad_ambiental_emisor'
            )
        }),
        ('Tipos de Residuos Gestionados', {
            'fields': ('tipos_residuos',)
        }),
        ('Contacto', {
            'fields': (
                'contacto_nombre', 'contacto_telefono',
                'contacto_email', 'direccion', 'ciudad'
            )
        }),
        ('Certificaciones', {
            'fields': ('certificaciones',)
        }),
        ('Estado', {
            'fields': ('activo',)
        })
    )


@admin.register(RegistroResiduo)
class RegistroResiduoAdmin(admin.ModelAdmin):
    list_display = [
        'fecha', 'tipo_residuo', 'tipo_movimiento',
        'cantidad', 'unidad_medida', 'area_generadora', 'gestor'
    ]
    list_filter = ['tipo_movimiento', 'tipo_residuo__clase', 'fecha']
    search_fields = ['area_generadora', 'numero_manifiesto']
    date_hierarchy = 'fecha'
    ordering = ['-fecha']
    raw_id_fields = ['tipo_residuo', 'gestor']

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa_id', 'fecha', 'tipo_residuo', 'tipo_movimiento')
        }),
        ('Cantidad', {
            'fields': ('cantidad', 'unidad_medida')
        }),
        ('Origen/Destino', {
            'fields': ('area_generadora', 'gestor', 'tratamiento_aplicado')
        }),
        ('Documentación', {
            'fields': ('numero_manifiesto', 'certificado_disposicion')
        }),
        ('Observaciones', {
            'fields': ('observaciones', 'registrado_por')
        })
    )


# ============================================================================
# VERTIMIENTOS
# ============================================================================

@admin.register(Vertimiento)
class VertimientoAdmin(admin.ModelAdmin):
    list_display = [
        'fecha_vertimiento', 'tipo_vertimiento', 'punto_vertimiento',
        'cuerpo_receptor', 'cumple_normativa'
    ]
    list_filter = ['tipo_vertimiento', 'cuerpo_receptor', 'cumple_normativa']
    search_fields = ['punto_vertimiento', 'nombre_cuerpo_receptor']
    date_hierarchy = 'fecha_vertimiento'
    ordering = ['-fecha_vertimiento']

    fieldsets = (
        ('Información Básica', {
            'fields': (
                'empresa_id', 'fecha_vertimiento', 'hora_vertimiento',
                'tipo_vertimiento'
            )
        }),
        ('Punto de Vertimiento', {
            'fields': (
                'punto_vertimiento', 'coordenadas', 'cuerpo_receptor',
                'nombre_cuerpo_receptor', 'caudal_m3_dia'
            )
        }),
        ('Parámetros Fisicoquímicos', {
            'fields': (
                'ph', 'temperatura_celsius', 'dbo5_mg_l', 'dqo_mg_l',
                'sst_mg_l', 'grasas_aceites_mg_l', 'parametros_adicionales'
            )
        }),
        ('Cumplimiento Normativo', {
            'fields': (
                'cumple_normativa', 'norma_referencia', 'tratamiento_previo'
            )
        }),
        ('Análisis de Laboratorio', {
            'fields': (
                'laboratorio_analisis', 'numero_informe_laboratorio',
                'archivo_informe'
            )
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        })
    )


# ============================================================================
# EMISIONES
# ============================================================================

@admin.register(FuenteEmision)
class FuenteEmisionAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'tipo_fuente', 'area_ubicacion',
        'proceso_generador', 'activo'
    ]
    list_filter = ['tipo_fuente', 'activo']
    search_fields = ['codigo', 'nombre', 'proceso_generador']
    ordering = ['codigo']

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa_id', 'codigo', 'nombre', 'descripcion', 'tipo_fuente')
        }),
        ('Ubicación', {
            'fields': ('area_ubicacion', 'coordenadas', 'altura_chimenea_m')
        }),
        ('Proceso y Combustible', {
            'fields': ('proceso_generador', 'tipo_combustible')
        }),
        ('Control de Emisiones', {
            'fields': ('sistema_control',)
        }),
        ('Estado', {
            'fields': ('activo',)
        })
    )


@admin.register(RegistroEmision)
class RegistroEmisionAdmin(admin.ModelAdmin):
    list_display = [
        'fecha_medicion', 'fuente_emision', 'material_particulado_mg_m3',
        'co2_ppm', 'cumple_normativa'
    ]
    list_filter = ['cumple_normativa', 'fuente_emision__tipo_fuente']
    search_fields = ['fuente_emision__nombre', 'numero_informe']
    date_hierarchy = 'fecha_medicion'
    ordering = ['-fecha_medicion']
    raw_id_fields = ['fuente_emision']


# ============================================================================
# CONSUMO DE RECURSOS
# ============================================================================

@admin.register(TipoRecurso)
class TipoRecursoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'categoria', 'unidad_medida',
        'factor_emision_co2_kg', 'activo'
    ]
    list_filter = ['categoria', 'activo']
    search_fields = ['codigo', 'nombre']
    ordering = ['categoria', 'codigo']


@admin.register(ConsumoRecurso)
class ConsumoRecursoAdmin(admin.ModelAdmin):
    list_display = [
        'periodo_year', 'periodo_month', 'tipo_recurso',
        'cantidad_consumida', 'area_consumidora', 'emision_co2_kg'
    ]
    list_filter = ['periodo_year', 'tipo_recurso__categoria']
    search_fields = ['area_consumidora', 'fuente_suministro']
    ordering = ['-periodo_year', '-periodo_month']
    raw_id_fields = ['tipo_recurso']


# ============================================================================
# HUELLA DE CARBONO
# ============================================================================

@admin.register(CalculoHuellaCarbono)
class CalculoHuellaCarbonoAdmin(admin.ModelAdmin):
    list_display = [
        'periodo_year', 'huella_total', 'alcance1_total',
        'alcance2_total', 'alcance3_total', 'verificado'
    ]
    list_filter = ['periodo_year', 'verificado', 'metodologia']
    search_fields = ['verificador_externo']
    ordering = ['-periodo_year']

    fieldsets = (
        ('Información Básica', {
            'fields': (
                'empresa_id', 'periodo_year', 'periodo_inicio',
                'periodo_fin', 'metodologia', 'version_metodologia'
            )
        }),
        ('Alcance 1: Emisiones Directas', {
            'fields': (
                'alcance1_combustion_estacionaria', 'alcance1_combustion_movil',
                'alcance1_emisiones_proceso', 'alcance1_emisiones_fugitivas',
                'alcance1_total'
            )
        }),
        ('Alcance 2: Emisiones Indirectas por Energía', {
            'fields': (
                'alcance2_electricidad', 'alcance2_vapor',
                'alcance2_calefaccion', 'alcance2_total'
            )
        }),
        ('Alcance 3: Otras Emisiones Indirectas', {
            'fields': (
                'alcance3_viajes_negocio', 'alcance3_desplazamiento_empleados',
                'alcance3_transporte_upstream', 'alcance3_transporte_downstream',
                'alcance3_residuos', 'alcance3_otros', 'alcance3_total'
            ),
            'classes': ('collapse',)
        }),
        ('Totales y Per Cápita', {
            'fields': (
                'huella_total', 'numero_empleados', 'huella_per_capita'
            )
        }),
        ('Verificación', {
            'fields': (
                'verificado', 'verificador_externo', 'fecha_verificacion'
            )
        }),
        ('Compensación', {
            'fields': ('compensaciones_co2', 'huella_neta')
        }),
        ('Documentación', {
            'fields': ('detalle_calculos', 'informe_pdf', 'observaciones')
        })
    )
    readonly_fields = [
        'alcance1_total', 'alcance2_total', 'alcance3_total',
        'huella_total', 'huella_neta', 'huella_per_capita'
    ]


# ============================================================================
# CERTIFICADOS AMBIENTALES
# ============================================================================

@admin.register(CertificadoAmbiental)
class CertificadoAmbientalAdmin(admin.ModelAdmin):
    list_display = [
        'numero_certificado', 'tipo_certificado', 'emisor',
        'fecha_emision', 'fecha_vencimiento', 'vigente'
    ]
    list_filter = ['tipo_certificado', 'vigente', 'fecha_emision']
    search_fields = ['numero_certificado', 'emisor', 'descripcion']
    date_hierarchy = 'fecha_emision'
    ordering = ['-fecha_emision']
    filter_horizontal = ['residuos_relacionados']
    raw_id_fields = ['gestor']

    fieldsets = (
        ('Información Básica', {
            'fields': (
                'empresa_id', 'numero_certificado', 'tipo_certificado'
            )
        }),
        ('Emisor', {
            'fields': ('emisor', 'gestor')
        }),
        ('Fechas', {
            'fields': ('fecha_emision', 'fecha_vencimiento')
        }),
        ('Detalles', {
            'fields': (
                'descripcion', 'cantidad_certificada', 'unidad_medida'
            )
        }),
        ('Residuos Relacionados', {
            'fields': ('residuos_relacionados',)
        }),
        ('Archivo', {
            'fields': ('archivo_certificado',)
        }),
        ('Validez', {
            'fields': ('vigente', 'observaciones')
        })
    )
