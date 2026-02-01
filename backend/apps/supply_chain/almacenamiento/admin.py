"""
Admin para Gestión de Almacenamiento e Inventario - Supply Chain
Sistema de Gestión StrateKaz

Admin básico - solo registra los modelos sin configuraciones.
"""
from django.contrib import admin
from .models import (
    TipoMovimientoInventario,
    EstadoInventario,
    TipoAlerta,
    Inventario,
    MovimientoInventario,
    Kardex,
    AlertaStock,
    ConfiguracionStock,
)


# Registro básico de modelos
admin.site.register(TipoMovimientoInventario)
admin.site.register(EstadoInventario)
admin.site.register(TipoAlerta)
admin.site.register(Inventario)
admin.site.register(MovimientoInventario)
admin.site.register(Kardex)
admin.site.register(AlertaStock)
admin.site.register(ConfiguracionStock)
