"""
Configuración del Admin de Django para Programaciones
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.contrib import admin
from .models import Programacion


@admin.register(Programacion)
class ProgramacionAdmin(admin.ModelAdmin):
    """
    Configuración del admin para Programaciones
    """
    list_display = [
        'id',
        'ecoaliado',
        'fecha_programada',
        'estado',
        'tipo_programacion',
        'programado_por',
        'recolector_asignado',
        'cantidad_estimada_kg',
        'created_at',
    ]
    list_filter = [
        'estado',
        'tipo_programacion',
        'fecha_programada',
        'created_at',
    ]
    search_fields = [
        'ecoaliado__codigo',
        'ecoaliado__razon_social',
        'programado_por__username',
        'recolector_asignado__username',
        'observaciones_comercial',
        'observaciones_logistica',
    ]
    readonly_fields = [
        'created_by',
        'created_at',
        'updated_at',
        'deleted_at',
    ]
    fieldsets = (
        ('Información General', {
            'fields': (
                'ecoaliado',
                'tipo_programacion',
                'programado_por',
                'estado',
            )
        }),
        ('Programación', {
            'fields': (
                'fecha_programada',
                'cantidad_estimada_kg',
                'observaciones_comercial',
            )
        }),
        ('Asignación de Recolector', {
            'fields': (
                'recolector_asignado',
                'asignado_por',
                'fecha_asignacion',
                'observaciones_logistica',
            )
        }),
        ('Cancelación', {
            'fields': (
                'motivo_cancelacion',
            ),
            'classes': ('collapse',)
        }),
        ('Reprogramación', {
            'fields': (
                'programacion_origen',
            ),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'created_by',
                'created_at',
                'updated_at',
                'deleted_at',
            ),
            'classes': ('collapse',)
        }),
    )
    raw_id_fields = [
        'ecoaliado',
        'programado_por',
        'recolector_asignado',
        'asignado_por',
        'programacion_origen',
        'created_by',
    ]
    date_hierarchy = 'fecha_programada'
    ordering = ['-fecha_programada', '-created_at']

    def get_queryset(self, request):
        """Optimizar queryset con select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related(
            'ecoaliado',
            'programado_por',
            'recolector_asignado',
            'asignado_por',
            'created_by'
        )
