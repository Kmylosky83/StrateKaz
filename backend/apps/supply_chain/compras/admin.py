"""
Admin para Compras - Supply Chain
Sistema de Gestión StrateKaz

Registro básico de modelos para el panel de administración.
"""
from django.contrib import admin
from .models import (
    # Catálogos dinámicos
    EstadoRequisicion,
    EstadoCotizacion,
    EstadoOrdenCompra,
    TipoContrato,
    PrioridadRequisicion,
    Moneda,
    EstadoContrato,
    EstadoMaterial,
    # Modelos principales
    Requisicion,
    DetalleRequisicion,
    Cotizacion,
    EvaluacionCotizacion,
    OrdenCompra,
    DetalleOrdenCompra,
    Contrato,
    RecepcionCompra,
)


# ==============================================================================
# REGISTRO BÁSICO DE CATÁLOGOS DINÁMICOS
# ==============================================================================

@admin.register(EstadoRequisicion)
class EstadoRequisicionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'is_active']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']


@admin.register(EstadoCotizacion)
class EstadoCotizacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'is_active']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']


@admin.register(EstadoOrdenCompra)
class EstadoOrdenCompraAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'is_active']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']


@admin.register(TipoContrato)
class TipoContratoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'is_active']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']


@admin.register(PrioridadRequisicion)
class PrioridadRequisicionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'nivel', 'is_active']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']


@admin.register(Moneda)
class MonedaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'simbolo', 'is_active']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']


@admin.register(EstadoContrato)
class EstadoContratoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'is_active']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']


@admin.register(EstadoMaterial)
class EstadoMaterialAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'is_active']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']


# ==============================================================================
# REGISTRO BÁSICO DE MODELOS PRINCIPALES
# ==============================================================================

@admin.register(Requisicion)
class RequisicionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'solicitante', 'estado', 'fecha_solicitud']
    list_filter = ['estado', 'fecha_solicitud']
    search_fields = ['codigo', 'area_solicitante']
    readonly_fields = ['codigo', 'created_at', 'updated_at']


@admin.register(DetalleRequisicion)
class DetalleRequisicionAdmin(admin.ModelAdmin):
    list_display = ['requisicion', 'producto_servicio', 'cantidad', 'unidad_medida']
    list_filter = ['unidad_medida']
    search_fields = ['producto_servicio', 'descripcion']


@admin.register(Cotizacion)
class CotizacionAdmin(admin.ModelAdmin):
    list_display = ['numero_cotizacion', 'proveedor', 'estado', 'fecha_cotizacion', 'total']
    list_filter = ['estado', 'fecha_cotizacion']
    search_fields = ['numero_cotizacion']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EvaluacionCotizacion)
class EvaluacionCotizacionAdmin(admin.ModelAdmin):
    list_display = ['cotizacion', 'evaluado_por', 'puntaje_total', 'fecha_evaluacion']
    list_filter = ['fecha_evaluacion']
    search_fields = ['cotizacion__numero_cotizacion']


@admin.register(OrdenCompra)
class OrdenCompraAdmin(admin.ModelAdmin):
    list_display = ['numero_orden', 'proveedor', 'estado', 'fecha_orden', 'total']
    list_filter = ['estado', 'fecha_orden']
    search_fields = ['numero_orden']
    readonly_fields = ['numero_orden', 'created_at', 'updated_at']


@admin.register(DetalleOrdenCompra)
class DetalleOrdenCompraAdmin(admin.ModelAdmin):
    list_display = ['orden_compra', 'producto_servicio', 'cantidad_solicitada', 'cantidad_recibida']
    search_fields = ['producto_servicio', 'descripcion']


@admin.register(Contrato)
class ContratoAdmin(admin.ModelAdmin):
    list_display = ['numero_contrato', 'proveedor', 'tipo_contrato', 'estado', 'fecha_inicio', 'fecha_fin']
    list_filter = ['tipo_contrato', 'estado', 'fecha_inicio']
    search_fields = ['numero_contrato']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RecepcionCompra)
class RecepcionCompraAdmin(admin.ModelAdmin):
    list_display = ['orden_compra', 'numero_remision', 'fecha_recepcion', 'recibido_por', 'estado_material']
    list_filter = ['fecha_recepcion', 'estado_material']
    search_fields = ['numero_remision']
    readonly_fields = ['created_at', 'updated_at']
