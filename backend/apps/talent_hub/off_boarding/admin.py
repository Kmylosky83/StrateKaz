"""
Admin de Off-Boarding - Talent Hub

Configuración del panel de administración de Django para off-boarding.
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    TipoRetiro,
    ProcesoRetiro,
    ChecklistRetiro,
    PazSalvo,
    ExamenEgreso,
    EntrevistaRetiro,
    LiquidacionFinal,
    CertificadoTrabajo
)


# =============================================================================
# TIPO DE RETIRO
# =============================================================================

@admin.register(TipoRetiro)
class TipoRetiroAdmin(admin.ModelAdmin):
    """Admin para TipoRetiro."""

    list_display = [
        'codigo', 'nombre', 'tipo', 'requiere_indemnizacion',
        'requiere_preaviso', 'dias_preaviso', 'orden', 'is_active'
    ]
    list_filter = ['tipo', 'requiere_indemnizacion', 'requiere_preaviso', 'empresa', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'codigo', 'nombre', 'descripcion', 'tipo', 'orden')
        }),
        ('Configuración de Indemnización', {
            'fields': ('requiere_indemnizacion', 'formula_indemnizacion')
        }),
        ('Configuración de Preaviso', {
            'fields': ('requiere_preaviso', 'dias_preaviso')
        }),
        ('Configuración Administrativa', {
            'fields': ('requiere_autorizacion', 'requiere_entrevista_salida')
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )


# =============================================================================
# PROCESO DE RETIRO
# =============================================================================

class ChecklistRetiroInline(admin.TabularInline):
    """Inline para checklist de retiro."""
    model = ChecklistRetiro
    extra = 0
    readonly_fields = ['validado_por', 'fecha_validacion']
    fields = ['tipo_item', 'descripcion', 'estado', 'responsable_area', 'validado_por', 'orden']


class PazSalvoInline(admin.TabularInline):
    """Inline para paz y salvos."""
    model = PazSalvo
    extra = 0
    readonly_fields = ['aprobado_por', 'fecha_aprobacion']
    fields = ['area', 'estado', 'responsable', 'aprobado_por']


@admin.register(ProcesoRetiro)
class ProcesoRetiroAdmin(admin.ModelAdmin):
    """Admin para ProcesoRetiro."""

    list_display = [
        'colaborador_nombre', 'tipo_retiro', 'fecha_notificacion',
        'fecha_ultimo_dia_trabajo', 'estado_badge', 'progreso_porcentaje',
        'is_active'
    ]
    list_filter = [
        'estado', 'motivo_retiro', 'tipo_retiro',
        'cumple_preaviso', 'empresa', 'is_active'
    ]
    search_fields = [
        'colaborador__primer_nombre',
        'colaborador__primer_apellido',
        'colaborador__numero_identificacion'
    ]
    ordering = ['-fecha_notificacion']
    readonly_fields = [
        'progreso_porcentaje', 'checklist_completado', 'paz_salvo_completo',
        'examen_egreso_realizado', 'entrevista_realizada', 'liquidacion_aprobada',
        'autorizado_por', 'fecha_autorizacion', 'cerrado_por', 'fecha_cierre',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]
    inlines = [ChecklistRetiroInline, PazSalvoInline]

    fieldsets = (
        ('Información del Proceso', {
            'fields': ('empresa', 'colaborador', 'tipo_retiro', 'responsable_proceso')
        }),
        ('Fechas', {
            'fields': (
                'fecha_notificacion', 'fecha_ultimo_dia_trabajo',
                'fecha_retiro_efectivo'
            )
        }),
        ('Motivo de Retiro', {
            'fields': ('motivo_retiro', 'motivo_detallado', 'justa_causa_detalle')
        }),
        ('Estado y Progreso', {
            'fields': ('estado', 'progreso_porcentaje')
        }),
        ('Completitud de Pasos', {
            'fields': (
                'checklist_completado', 'paz_salvo_completo',
                'examen_egreso_realizado', 'entrevista_realizada',
                'liquidacion_aprobada'
            )
        }),
        ('Autorización', {
            'fields': (
                'requiere_autorizacion', 'autorizado_por', 'fecha_autorizacion'
            )
        }),
        ('Preaviso', {
            'fields': ('dias_preaviso_cumplidos', 'cumple_preaviso')
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Cierre', {
            'fields': ('cerrado_por', 'fecha_cierre')
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def colaborador_nombre(self, obj):
        """Nombre del colaborador."""
        return obj.colaborador.get_nombre_completo() if obj.colaborador else '-'
    colaborador_nombre.short_description = 'Colaborador'

    def estado_badge(self, obj):
        """Badge con color según estado."""
        colors = {
            'iniciado': '#6c757d',
            'checklist_pendiente': '#17a2b8',
            'paz_salvo_pendiente': '#ffc107',
            'examen_pendiente': '#fd7e14',
            'entrevista_pendiente': '#e83e8c',
            'liquidacion_pendiente': '#20c997',
            'completado': '#28a745',
            'cancelado': '#dc3545'
        }
        color = colors.get(obj.estado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# =============================================================================
# CHECKLIST DE RETIRO
# =============================================================================

@admin.register(ChecklistRetiro)
class ChecklistRetiroAdmin(admin.ModelAdmin):
    """Admin para ChecklistRetiro."""

    list_display = [
        'proceso_retiro', 'tipo_item', 'descripcion',
        'estado_badge', 'responsable_area', 'validado_por', 'orden', 'is_active'
    ]
    list_filter = ['tipo_item', 'estado', 'responsable_area', 'empresa', 'is_active']
    search_fields = ['descripcion', 'detalles']
    ordering = ['proceso_retiro', 'orden', 'tipo_item']
    readonly_fields = ['validado_por', 'fecha_validacion', 'created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información del Item', {
            'fields': ('empresa', 'proceso_retiro', 'tipo_item', 'descripcion', 'detalles', 'orden')
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Responsable', {
            'fields': ('responsable_area', 'validado_por', 'fecha_validacion')
        }),
        ('Evidencia', {
            'fields': ('evidencia',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Badge con color según estado."""
        colors = {
            'pendiente': '#6c757d',
            'en_proceso': '#17a2b8',
            'completado': '#28a745',
            'no_aplica': '#ffc107'
        }
        color = colors.get(obj.estado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# =============================================================================
# PAZ Y SALVO
# =============================================================================

@admin.register(PazSalvo)
class PazSalvoAdmin(admin.ModelAdmin):
    """Admin para PazSalvo."""

    list_display = [
        'proceso_retiro', 'area', 'estado_badge',
        'responsable', 'aprobado_por', 'fecha_aprobacion', 'is_active'
    ]
    list_filter = ['area', 'estado', 'empresa', 'is_active']
    search_fields = ['proceso_retiro__colaborador__primer_apellido', 'pendientes']
    ordering = ['proceso_retiro', 'area']
    readonly_fields = ['aprobado_por', 'fecha_aprobacion', 'created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información del Paz y Salvo', {
            'fields': ('empresa', 'proceso_retiro', 'area', 'descripcion_area')
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Responsable', {
            'fields': ('responsable', 'aprobado_por', 'fecha_aprobacion')
        }),
        ('Pendientes', {
            'fields': ('pendientes', 'resolucion_pendientes')
        }),
        ('Documentos', {
            'fields': ('documento_paz_salvo',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Badge con color según estado."""
        colors = {
            'pendiente': '#6c757d',
            'aprobado': '#28a745',
            'rechazado': '#dc3545'
        }
        color = colors.get(obj.estado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# =============================================================================
# EXAMEN DE EGRESO
# =============================================================================

@admin.register(ExamenEgreso)
class ExamenEgresoAdmin(admin.ModelAdmin):
    """Admin para ExamenEgreso."""

    list_display = [
        'proceso_retiro_colaborador', 'fecha_examen', 'entidad_prestadora',
        'medico_evaluador', 'resultado_badge', 'enfermedad_laboral_identificada',
        'is_active'
    ]
    list_filter = ['resultado', 'enfermedad_laboral_identificada', 'requiere_seguimiento', 'empresa', 'is_active']
    search_fields = ['proceso_retiro__colaborador__primer_apellido', 'medico_evaluador', 'entidad_prestadora']
    ordering = ['-fecha_examen']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información del Examen', {
            'fields': ('empresa', 'proceso_retiro', 'fecha_examen')
        }),
        ('Entidad y Médico', {
            'fields': ('entidad_prestadora', 'medico_evaluador', 'licencia_medico')
        }),
        ('Resultados', {
            'fields': ('resultado', 'concepto_medico')
        }),
        ('Hallazgos', {
            'fields': ('hallazgos_clinicos', 'diagnostico_egreso')
        }),
        ('Comparación y Enfermedad Laboral', {
            'fields': (
                'comparacion_examen_ingreso',
                'enfermedad_laboral_identificada',
                'enfermedad_laboral_detalle'
            )
        }),
        ('Recomendaciones', {
            'fields': ('recomendaciones', 'requiere_seguimiento')
        }),
        ('Documentos', {
            'fields': ('certificado_medico', 'examenes_adjuntos')
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def proceso_retiro_colaborador(self, obj):
        """Nombre del colaborador del proceso."""
        return obj.proceso_retiro.colaborador.get_nombre_completo() if obj.proceso_retiro else '-'
    proceso_retiro_colaborador.short_description = 'Colaborador'

    def resultado_badge(self, obj):
        """Badge con color según resultado."""
        colors = {
            'apto': '#28a745',
            'apto_con_recomendaciones': '#ffc107',
            'no_apto': '#dc3545'
        }
        color = colors.get(obj.resultado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_resultado_display()
        )
    resultado_badge.short_description = 'Resultado'


# =============================================================================
# ENTREVISTA DE RETIRO
# =============================================================================

@admin.register(EntrevistaRetiro)
class EntrevistaRetiroAdmin(admin.ModelAdmin):
    """Admin para EntrevistaRetiro."""

    list_display = [
        'proceso_retiro_colaborador', 'fecha_entrevista', 'entrevistador',
        'satisfaccion_general', 'promedio_evaluacion_display',
        'volveria_trabajar', 'recomendaria_empresa', 'is_active'
    ]
    list_filter = [
        'modalidad', 'motivo_principal_retiro', 'satisfaccion_general',
        'volveria_trabajar', 'recomendaria_empresa', 'empresa', 'is_active'
    ]
    search_fields = ['proceso_retiro__colaborador__primer_apellido', 'motivo_detallado']
    ordering = ['-fecha_entrevista']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información de la Entrevista', {
            'fields': ('empresa', 'proceso_retiro', 'fecha_entrevista', 'entrevistador', 'modalidad')
        }),
        ('Evaluaciones (1-5)', {
            'fields': (
                'satisfaccion_general', 'evaluacion_liderazgo',
                'evaluacion_clima_laboral', 'evaluacion_remuneracion',
                'evaluacion_desarrollo', 'evaluacion_equilibrio_vida'
            )
        }),
        ('Motivo de Retiro', {
            'fields': ('motivo_principal_retiro', 'motivo_detallado')
        }),
        ('Aspectos Positivos y a Mejorar', {
            'fields': ('aspectos_positivos', 'aspectos_mejorar', 'sugerencias')
        }),
        ('Recontratación', {
            'fields': (
                'volveria_trabajar', 'justificacion_recontratacion',
                'recomendaria_empresa'
            )
        }),
        ('Análisis', {
            'fields': ('analisis_entrevistador', 'recomendaciones_organizacion')
        }),
        ('Documentos', {
            'fields': ('acta_entrevista',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def proceso_retiro_colaborador(self, obj):
        """Nombre del colaborador."""
        return obj.proceso_retiro.colaborador.get_nombre_completo() if obj.proceso_retiro else '-'
    proceso_retiro_colaborador.short_description = 'Colaborador'

    def promedio_evaluacion_display(self, obj):
        """Promedio de evaluación."""
        return f"{obj.promedio_evaluacion}/5"
    promedio_evaluacion_display.short_description = 'Promedio'


# =============================================================================
# LIQUIDACIÓN FINAL
# =============================================================================

@admin.register(LiquidacionFinal)
class LiquidacionFinalAdmin(admin.ModelAdmin):
    """Admin para LiquidacionFinal."""

    list_display = [
        'proceso_retiro_colaborador', 'fecha_liquidacion', 'neto_pagar_display',
        'esta_aprobada', 'esta_pagada', 'fecha_pago', 'is_active'
    ]
    list_filter = ['aplica_indemnizacion', 'metodo_pago', 'empresa', 'is_active']
    search_fields = ['proceso_retiro__colaborador__primer_apellido', 'observaciones']
    ordering = ['-fecha_liquidacion']
    readonly_fields = [
        'cesantias_causadas', 'cesantias_pendientes', 'intereses_cesantias',
        'prima_causada', 'prima_pendiente', 'dias_vacaciones_causados',
        'dias_vacaciones_pendientes', 'valor_vacaciones',
        'total_devengados', 'total_deducciones', 'neto_pagar',
        'aprobado_por', 'fecha_aprobacion',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Información de la Liquidación', {
            'fields': ('empresa', 'proceso_retiro', 'fecha_liquidacion')
        }),
        ('Fechas Laborales', {
            'fields': ('fecha_ingreso', 'fecha_retiro')
        }),
        ('Datos Base', {
            'fields': ('salario_base', 'salario_promedio', 'dias_trabajados_total')
        }),
        ('Cesantías', {
            'fields': (
                'cesantias_causadas', 'cesantias_pagadas', 'cesantias_pendientes',
                'intereses_cesantias'
            )
        }),
        ('Prima de Servicios', {
            'fields': ('prima_causada', 'prima_pagada', 'prima_pendiente')
        }),
        ('Vacaciones', {
            'fields': (
                'dias_vacaciones_causados', 'dias_vacaciones_disfrutados',
                'dias_vacaciones_pendientes', 'valor_vacaciones'
            )
        }),
        ('Indemnización', {
            'fields': (
                'aplica_indemnizacion', 'valor_indemnizacion',
                'formula_indemnizacion'
            )
        }),
        ('Otros Devengados', {
            'fields': (
                'bonificaciones', 'otros_devengados',
                'detalle_otros_devengados'
            )
        }),
        ('Deducciones', {
            'fields': (
                'prestamos_pendientes', 'libranzas_pendientes',
                'otras_deducciones', 'detalle_otras_deducciones'
            )
        }),
        ('Totales', {
            'fields': ('total_devengados', 'total_deducciones', 'neto_pagar')
        }),
        ('Aprobación', {
            'fields': ('aprobado_por', 'fecha_aprobacion')
        }),
        ('Pago', {
            'fields': ('fecha_pago', 'metodo_pago', 'referencia_pago')
        }),
        ('Documentos', {
            'fields': ('documento_liquidacion', 'comprobante_pago')
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def proceso_retiro_colaborador(self, obj):
        """Nombre del colaborador."""
        return obj.proceso_retiro.colaborador.get_nombre_completo() if obj.proceso_retiro else '-'
    proceso_retiro_colaborador.short_description = 'Colaborador'

    def neto_pagar_display(self, obj):
        """Neto a pagar formateado."""
        return f"${obj.neto_pagar:,.2f}"
    neto_pagar_display.short_description = 'Neto a Pagar'


# =============================================================================
# CERTIFICADO DE TRABAJO - Art. 57 y 62 CST
# =============================================================================

@admin.register(CertificadoTrabajo)
class CertificadoTrabajoAdmin(admin.ModelAdmin):
    """Admin para certificados de trabajo."""
    list_display = [
        'colaborador', 'tipo_certificado', 'fecha_solicitud',
        'estado', 'generado_por', 'is_active'
    ]
    list_filter = ['tipo_certificado', 'estado', 'empresa', 'is_active']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'dirigido_a']
    ordering = ['-fecha_solicitud']
    readonly_fields = ['fecha_solicitud', 'created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['colaborador', 'generado_por']

    fieldsets = (
        ('Solicitud', {
            'fields': ('empresa', 'colaborador', 'tipo_certificado', 'fecha_solicitud', 'dirigido_a')
        }),
        ('Contenido', {
            'fields': ('incluir_cargo', 'incluir_salario', 'incluir_funciones', 'informacion_adicional')
        }),
        ('Generación', {
            'fields': ('estado', 'fecha_expedicion', 'documento_generado', 'generado_por')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
