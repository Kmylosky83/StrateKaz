"""
Admin para Gestión de Proveedores - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: Admin configurado para modelos de catálogo dinámicos.
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    # Catálogos dinámicos
    CategoriaMateriaPrima,
    TipoMateriaPrima,
    TipoProveedor,
    ModalidadLogistica,
    FormaPago,
    TipoCuentaBancaria,
    # Modelos principales
    # NOTA: UnidadNegocio → Migrado a Fundación (configuracion)
    Proveedor,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
    CondicionComercialProveedor,
    # Evaluación
    CriterioEvaluacion,
    EvaluacionProveedor,
    DetalleEvaluacion,
)


# ==============================================================================
# ADMIN PARA CATÁLOGOS DINÁMICOS
# ==============================================================================

class CatalogoBaseAdmin(admin.ModelAdmin):
    """Admin base para catálogos dinámicos."""
    list_display = ['codigo', 'nombre', 'orden', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']


@admin.register(CategoriaMateriaPrima)
class CategoriaMateriaPrimaAdmin(CatalogoBaseAdmin):
    """Admin para Categorías de Materia Prima."""
    list_display = ['codigo', 'nombre', 'descripcion', 'orden', 'is_active', 'count_tipos']

    def count_tipos(self, obj):
        return obj.tipos.count()
    count_tipos.short_description = 'Tipos'


@admin.register(TipoMateriaPrima)
class TipoMateriaPrimaAdmin(admin.ModelAdmin):
    """Admin para Tipos de Materia Prima."""
    list_display = [
        'codigo', 'nombre', 'categoria', 'acidez_range', 'orden', 'is_active'
    ]
    list_filter = ['categoria', 'is_active']
    search_fields = ['codigo', 'nombre', 'categoria__nombre']
    ordering = ['categoria__orden', 'orden', 'nombre']
    list_editable = ['orden', 'is_active']
    raw_id_fields = ['categoria']

    def acidez_range(self, obj):
        if obj.acidez_min is not None and obj.acidez_max is not None:
            return f"{obj.acidez_min}% - {obj.acidez_max}%"
        return "-"
    acidez_range.short_description = 'Rango Acidez'


@admin.register(TipoProveedor)
class TipoProveedorAdmin(CatalogoBaseAdmin):
    """Admin para Tipos de Proveedor."""
    list_display = [
        'codigo', 'nombre', 'requiere_materia_prima',
        'requiere_modalidad_logistica', 'orden', 'is_active'
    ]
    list_filter = ['is_active', 'requiere_materia_prima', 'requiere_modalidad_logistica']
    list_editable = ['requiere_materia_prima', 'requiere_modalidad_logistica', 'orden', 'is_active']


@admin.register(ModalidadLogistica)
class ModalidadLogisticaAdmin(CatalogoBaseAdmin):
    """Admin para Modalidades Logísticas."""
    pass


@admin.register(FormaPago)
class FormaPagoAdmin(CatalogoBaseAdmin):
    """Admin para Formas de Pago."""
    pass


@admin.register(TipoCuentaBancaria)
class TipoCuentaBancariaAdmin(CatalogoBaseAdmin):
    """Admin para Tipos de Cuenta Bancaria."""
    list_display = ['codigo', 'nombre', 'orden', 'is_active']


# ==============================================================================
# ADMIN PARA MODELOS PRINCIPALES
# ==============================================================================

# NOTA: UnidadNegocioAdmin → Migrado a Fundación (configuracion)


class PrecioMateriaPrimaInline(admin.TabularInline):
    """Inline para precios de materia prima en Proveedor."""
    model = PrecioMateriaPrima
    extra = 0
    readonly_fields = ['updated_by', 'updated_at', 'created_at']
    raw_id_fields = ['tipo_materia', 'producto']


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    """Admin para Proveedores."""
    list_display = [
        'codigo_interno', 'nombre_comercial', 'tipo_entidad', 'tipo_proveedor',
        'numero_documento', 'ciudad', 'is_active', 'is_deleted_display'
    ]
    list_filter = [
        'tipo_entidad', 'tipo_proveedor', 'modalidad_logistica',
        'departamento', 'is_active', 'is_deleted',
    ]
    search_fields = ['codigo_interno', 'nombre_comercial', 'razon_social', 'numero_documento', 'nit']
    ordering = ['nombre_comercial']
    raw_id_fields = [
        'tipo_proveedor', 'tipo_documento', 'modalidad_logistica',
        'departamento', 'tipo_cuenta', 'created_by', 'updated_by', 'deleted_by',
    ]
    filter_horizontal = ['tipos_materia_prima', 'formas_pago']
    readonly_fields = [
        'codigo_interno', 'created_at', 'updated_at', 'deleted_at',
        'created_by', 'updated_by', 'deleted_by',
    ]
    inlines = [PrecioMateriaPrimaInline]

    fieldsets = (
        ('Identificación', {
            'fields': (
                'codigo_interno', 'tipo_entidad', 'tipo_proveedor',
                'tipos_materia_prima', 'modalidad_logistica',
            )
        }),
        ('Datos Básicos', {
            'fields': ('nombre_comercial', 'razon_social', 'tipo_documento', 'numero_documento', 'nit')
        }),
        ('Contacto', {
            'fields': ('telefono', 'email', 'direccion', 'ciudad', 'departamento')
        }),
        ('Relaciones', {
            'fields': ('unidad_negocio_id', 'unidad_negocio_nombre')
        }),
        ('Información Financiera', {
            'fields': ('formas_pago', 'dias_plazo_pago', 'banco', 'tipo_cuenta', 'numero_cuenta', 'titular_cuenta')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Estado', {
            'fields': ('is_active', 'is_deleted', 'deleted_at', 'deleted_by')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_by', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def is_deleted_display(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: red;">Eliminado</span>')
        return format_html('<span style="color: green;">Activo</span>')
    is_deleted_display.short_description = 'Estado'


@admin.register(PrecioMateriaPrima)
class PrecioMateriaPrimaAdmin(admin.ModelAdmin):
    """Admin para Precios de Materia Prima."""
    list_display = [
        'proveedor', 'tipo_materia', 'producto', 'precio_kg',
        'updated_by', 'updated_at',
    ]
    list_filter = ['tipo_materia__categoria', 'tipo_materia']
    search_fields = [
        'proveedor__nombre_comercial', 'tipo_materia__nombre', 'producto__nombre',
    ]
    raw_id_fields = ['proveedor', 'tipo_materia', 'producto', 'updated_by', 'created_by']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(HistorialPrecioProveedor)
class HistorialPrecioProveedorAdmin(admin.ModelAdmin):
    """Admin para Historial de Precios (append-only, solo lectura)."""
    list_display = [
        'proveedor', 'tipo_materia', 'producto', 'precio_anterior', 'precio_nuevo',
        'variacion_display', 'modificado_por', 'created_at',
    ]
    list_filter = ['tipo_materia__categoria', 'tipo_materia', 'modificado_por']
    search_fields = ['proveedor__nombre_comercial', 'motivo']
    ordering = ['-created_at']
    readonly_fields = [
        'proveedor', 'tipo_materia', 'producto', 'precio_anterior', 'precio_nuevo',
        'modificado_por', 'motivo', 'created_at', 'updated_at',
    ]

    def variacion_display(self, obj):
        if obj.variacion_precio is not None:
            color = 'green' if obj.variacion_precio < 0 else 'red' if obj.variacion_precio > 0 else 'gray'
            return format_html(
                '<span style="color: {};">{:+.2f}%</span>',
                color, obj.variacion_precio
            )
        return "-"
    variacion_display.short_description = 'Variación'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CondicionComercialProveedor)
class CondicionComercialProveedorAdmin(admin.ModelAdmin):
    """Admin para Condiciones Comerciales."""
    list_display = [
        'proveedor', 'descripcion', 'vigencia_desde',
        'vigencia_hasta', 'esta_vigente_display', 'created_by',
    ]
    list_filter = ['proveedor__tipo_proveedor', 'is_deleted']
    search_fields = ['proveedor__nombre_comercial', 'descripcion']
    ordering = ['-vigencia_desde']
    raw_id_fields = ['proveedor', 'created_by', 'updated_by', 'deleted_by']
    readonly_fields = [
        'created_by', 'updated_by', 'deleted_by',
        'created_at', 'updated_at', 'deleted_at',
    ]

    def esta_vigente_display(self, obj):
        if obj.esta_vigente:
            return format_html('<span style="color: green;">Vigente</span>')
        return format_html('<span style="color: red;">Vencida</span>')
    esta_vigente_display.short_description = 'Estado'


# ==============================================================================
# ADMIN PARA EVALUACIÓN DE PROVEEDORES
# ==============================================================================

@admin.register(CriterioEvaluacion)
class CriterioEvaluacionAdmin(admin.ModelAdmin):
    """Admin para Criterios de Evaluación."""
    list_display = ['codigo', 'nombre', 'peso', 'orden', 'is_active']
    list_filter = ['is_active', 'aplica_a_tipo']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['peso', 'orden', 'is_active']
    filter_horizontal = ['aplica_a_tipo']


class DetalleEvaluacionInline(admin.TabularInline):
    """Inline para detalles de evaluación."""
    model = DetalleEvaluacion
    extra = 0
    raw_id_fields = ['criterio']


@admin.register(EvaluacionProveedor)
class EvaluacionProveedorAdmin(admin.ModelAdmin):
    """Admin para Evaluaciones de Proveedores."""
    list_display = [
        'proveedor', 'periodo', 'fecha_evaluacion',
        'estado', 'calificacion_total', 'evaluado_por'
    ]
    list_filter = ['estado', 'proveedor__tipo_proveedor']
    search_fields = ['proveedor__nombre_comercial', 'periodo']
    ordering = ['-fecha_evaluacion']
    raw_id_fields = ['proveedor', 'evaluado_por', 'aprobado_por']
    readonly_fields = ['calificacion_total', 'fecha_aprobacion', 'created_at', 'updated_at']
    inlines = [DetalleEvaluacionInline]

    fieldsets = (
        ('Evaluación', {
            'fields': ('proveedor', 'periodo', 'fecha_evaluacion', 'estado')
        }),
        ('Resultados', {
            'fields': ('calificacion_total', 'observaciones')
        }),
        ('Aprobación', {
            'fields': ('evaluado_por', 'aprobado_por', 'fecha_aprobacion')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DetalleEvaluacion)
class DetalleEvaluacionAdmin(admin.ModelAdmin):
    """Admin para Detalles de Evaluación."""
    list_display = ['evaluacion', 'criterio', 'calificacion', 'observaciones']
    list_filter = ['criterio', 'evaluacion__estado']
    search_fields = ['evaluacion__proveedor__nombre_comercial', 'criterio__nombre']
    raw_id_fields = ['evaluacion', 'criterio']
