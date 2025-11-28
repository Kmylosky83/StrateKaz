# -*- coding: utf-8 -*-
"""
Admin del modulo Recolecciones - Sistema de Gestion Grasas y Huesos del Norte
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Recoleccion


@admin.register(Recoleccion)
class RecoleccionAdmin(admin.ModelAdmin):
    """Admin para el modelo Recoleccion"""

    list_display = [
        'codigo_voucher',
        'ecoaliado_display',
        'recolector_display',
        'fecha_recoleccion',
        'cantidad_kg',
        'precio_kg',
        'valor_total_display',
        'estado_display',
    ]

    list_filter = [
        'fecha_recoleccion',
        'ecoaliado__ciudad',
        'recolector',
        ('deleted_at', admin.EmptyFieldListFilter),
    ]

    search_fields = [
        'codigo_voucher',
        'ecoaliado__codigo',
        'ecoaliado__razon_social',
        'recolector__first_name',
        'recolector__last_name',
    ]

    readonly_fields = [
        'codigo_voucher',
        'valor_total',
        'created_at',
        'updated_at',
        'created_by',
    ]

    autocomplete_fields = ['ecoaliado', 'recolector', 'programacion']

    fieldsets = (
        ('Identificacion', {
            'fields': (
                'codigo_voucher',
                'programacion',
            )
        }),
        ('Datos de Recoleccion', {
            'fields': (
                'ecoaliado',
                'recolector',
                'fecha_recoleccion',
            )
        }),
        ('Valores', {
            'fields': (
                'cantidad_kg',
                'precio_kg',
                'valor_total',
            )
        }),
        ('Informacion Adicional', {
            'fields': (
                'observaciones',
            ),
            'classes': ('collapse',),
        }),
        ('Auditoria', {
            'fields': (
                'created_by',
                'created_at',
                'updated_at',
                'deleted_at',
            ),
            'classes': ('collapse',),
        }),
    )

    date_hierarchy = 'fecha_recoleccion'

    def ecoaliado_display(self, obj):
        """Muestra codigo y razon social del ecoaliado"""
        return f"{obj.ecoaliado.codigo} - {obj.ecoaliado.razon_social}"
    ecoaliado_display.short_description = 'Ecoaliado'

    def recolector_display(self, obj):
        """Muestra nombre del recolector"""
        return obj.recolector.get_full_name()
    recolector_display.short_description = 'Recolector'

    def valor_total_display(self, obj):
        """Muestra valor total formateado"""
        return format_html(
            '<span style="color: green; font-weight: bold;">$ {:,.0f}</span>',
            obj.valor_total
        )
    valor_total_display.short_description = 'Valor Total'

    def estado_display(self, obj):
        """Muestra si esta activo o eliminado"""
        if obj.is_deleted:
            return format_html(
                '<span style="color: red;">Eliminado</span>'
            )
        return format_html(
            '<span style="color: green;">Activo</span>'
        )
    estado_display.short_description = 'Estado'

    def get_queryset(self, request):
        """Incluye recolecciones eliminadas para admins"""
        return Recoleccion.objects.select_related(
            'ecoaliado', 'recolector', 'programacion', 'created_by'
        )

    def has_delete_permission(self, request, obj=None):
        """Solo superadmin puede eliminar definitivamente"""
        return request.user.is_superuser

    def save_model(self, request, obj, form, change):
        """Asigna created_by al crear"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
