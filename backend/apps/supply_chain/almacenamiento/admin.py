"""
Admin de Almacenamiento — Supply Chain.

Configuración mínima para visibilidad en /admin/ durante desarrollo.
"""
from django.contrib import admin

from .models import (
    AlertaStock,
    ConfiguracionStock,
    EstadoInventario,
    Inventario,
    Kardex,
    MovimientoInventario,
    TipoAlerta,
    TipoMovimientoInventario,
)


@admin.register(TipoMovimientoInventario)
class TipoMovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'afecta_stock', 'is_active', 'orden')
    list_filter = ('afecta_stock', 'is_active')
    search_fields = ('codigo', 'nombre')
    ordering = ('orden', 'nombre')


@admin.register(EstadoInventario)
class EstadoInventarioAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'permite_uso', 'is_active', 'orden')
    list_filter = ('permite_uso', 'is_active')
    search_fields = ('codigo', 'nombre')
    ordering = ('orden', 'nombre')


@admin.register(TipoAlerta)
class TipoAlertaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'prioridad', 'is_active', 'orden')
    list_filter = ('prioridad', 'is_active')
    search_fields = ('codigo', 'nombre')
    ordering = ('orden', 'nombre')


@admin.register(Inventario)
class InventarioAdmin(admin.ModelAdmin):
    list_display = (
        'producto', 'almacen', 'lote', 'estado',
        'cantidad_disponible', 'unidad_medida', 'valor_total',
    )
    list_filter = ('almacen', 'estado', 'fecha_vencimiento')
    search_fields = ('producto__codigo', 'producto__nombre', 'lote')
    raw_id_fields = ('almacen', 'producto', 'unidad_medida', 'estado')
    ordering = ('-updated_at',)


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = (
        'codigo', 'tipo_movimiento', 'producto',
        'cantidad', 'unidad_medida', 'almacen_destino', 'fecha_movimiento',
    )
    list_filter = ('tipo_movimiento', 'almacen_destino', 'fecha_movimiento')
    search_fields = ('codigo', 'producto__codigo', 'producto__nombre', 'documento_referencia')
    raw_id_fields = (
        'almacen_origen', 'almacen_destino', 'tipo_movimiento',
        'producto', 'unidad_medida', 'registrado_por',
    )
    ordering = ('-fecha_movimiento', '-created_at')


@admin.register(Kardex)
class KardexAdmin(admin.ModelAdmin):
    list_display = (
        'inventario', 'movimiento',
        'cantidad_entrada', 'cantidad_salida', 'saldo_cantidad', 'fecha',
    )
    list_filter = ('fecha',)
    raw_id_fields = ('inventario', 'movimiento')
    ordering = ('-fecha',)


@admin.register(AlertaStock)
class AlertaStockAdmin(admin.ModelAdmin):
    list_display = (
        'tipo_alerta', 'inventario', 'almacen',
        'criticidad', 'leida', 'resuelta', 'fecha_generacion',
    )
    list_filter = ('tipo_alerta', 'criticidad', 'leida', 'resuelta')
    search_fields = ('mensaje', 'inventario__producto__nombre')
    raw_id_fields = ('almacen', 'inventario', 'tipo_alerta', 'resuelta_por')
    ordering = ('-fecha_generacion',)


@admin.register(ConfiguracionStock)
class ConfiguracionStockAdmin(admin.ModelAdmin):
    list_display = (
        'producto', 'almacen',
        'stock_minimo', 'punto_reorden', 'stock_maximo', 'activo',
    )
    list_filter = ('almacen', 'activo')
    search_fields = ('producto__codigo', 'producto__nombre')
    raw_id_fields = ('almacen', 'producto')
    ordering = ('producto__nombre',)
