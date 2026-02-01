"""
Admin para Contexto Organizacional - Gestión Estratégica
=========================================================

Configuración del admin de Django para los modelos de contexto.

Autor: Sistema ERP StrateKaz
Fecha: 2026-01-24
"""

from django.contrib import admin
from .models import (
    AnalisisDOFA,
    FactorDOFA,
    EstrategiaTOWS,
    AnalisisPESTEL,
    FactorPESTEL,
    FuerzaPorter,
    TipoParteInteresada,
    ParteInteresada,
    RequisitoParteInteresada,
    MatrizComunicacion
)


@admin.register(AnalisisDOFA)
class AnalisisDOFAAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'periodo', 'estado', 'responsable', 'empresa', 'fecha_analisis']
    list_filter = ['estado', 'empresa', 'periodo']
    search_fields = ['nombre', 'observaciones']
    date_hierarchy = 'fecha_analisis'


@admin.register(FactorDOFA)
class FactorDOFAAdmin(admin.ModelAdmin):
    list_display = ['descripcion', 'tipo', 'impacto', 'analisis', 'empresa']
    list_filter = ['tipo', 'impacto', 'empresa']
    search_fields = ['descripcion', 'area_afectada']


@admin.register(EstrategiaTOWS)
class EstrategiaTOWSAdmin(admin.ModelAdmin):
    list_display = ['descripcion', 'tipo', 'estado', 'prioridad', 'responsable', 'empresa']
    list_filter = ['tipo', 'estado', 'prioridad', 'empresa']
    search_fields = ['descripcion', 'objetivo']


@admin.register(AnalisisPESTEL)
class AnalisisPESTELAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'periodo', 'estado', 'responsable', 'empresa', 'fecha_analisis']
    list_filter = ['estado', 'empresa', 'periodo']
    search_fields = ['nombre', 'conclusiones']
    date_hierarchy = 'fecha_analisis'


@admin.register(FactorPESTEL)
class FactorPESTELAdmin(admin.ModelAdmin):
    list_display = ['descripcion', 'tipo', 'impacto', 'probabilidad', 'tendencia', 'empresa']
    list_filter = ['tipo', 'impacto', 'probabilidad', 'tendencia', 'empresa']
    search_fields = ['descripcion', 'implicaciones']


@admin.register(FuerzaPorter)
class FuerzaPorterAdmin(admin.ModelAdmin):
    list_display = ['tipo', 'nivel', 'periodo', 'empresa', 'fecha_analisis']
    list_filter = ['tipo', 'nivel', 'empresa', 'periodo']
    search_fields = ['descripcion', 'implicaciones_estrategicas']
    date_hierarchy = 'fecha_analisis'


@admin.register(TipoParteInteresada)
class TipoParteInteresadaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'orden', 'is_active']
    list_filter = ['categoria', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'categoria', 'nombre']


@admin.register(ParteInteresada)
class ParteInteresadaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'nivel_influencia', 'nivel_interes', 'empresa', 'is_active']
    list_filter = ['tipo', 'nivel_influencia', 'nivel_interes', 'empresa', 'is_active']
    search_fields = ['nombre', 'descripcion', 'representante']


@admin.register(RequisitoParteInteresada)
class RequisitoParteInteresadaAdmin(admin.ModelAdmin):
    list_display = ['descripcion', 'tipo', 'prioridad', 'cumple', 'parte_interesada', 'empresa']
    list_filter = ['tipo', 'prioridad', 'cumple', 'empresa']
    search_fields = ['descripcion', 'como_se_aborda']


@admin.register(MatrizComunicacion)
class MatrizComunicacionAdmin(admin.ModelAdmin):
    list_display = ['parte_interesada', 'que_comunicar', 'cuando_comunicar', 'como_comunicar', 'responsable']
    list_filter = ['cuando_comunicar', 'como_comunicar', 'empresa']
    search_fields = ['que_comunicar', 'registro_evidencia']
