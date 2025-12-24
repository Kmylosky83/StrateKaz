"""
Admin para Gestión de Comités HSEQ
"""
from django.contrib import admin
from .models import (
    TipoComite, Comite, MiembroComite, Reunion, AsistenciaReunion,
    ActaReunion, Compromiso, SeguimientoCompromiso, Votacion, VotoMiembro
)


@admin.register(TipoComite)
class TipoComiteAdmin(admin.ModelAdmin):
    """Admin para TipoComite."""
    list_display = [
        'codigo', 'nombre', 'empresa_id', 'periodicidad_reuniones',
        'num_minimo_miembros', 'requiere_eleccion', 'activo'
    ]
    list_filter = ['empresa_id', 'activo', 'periodicidad_reuniones', 'requiere_eleccion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['empresa_id', 'nombre']


class MiembroComiteInline(admin.TabularInline):
    """Inline para miembros del comité."""
    model = MiembroComite
    extra = 0
    fields = [
        'empleado_nombre', 'empleado_cargo', 'rol', 'es_principal',
        'representa_a', 'fecha_inicio', 'activo'
    ]


@admin.register(Comite)
class ComiteAdmin(admin.ModelAdmin):
    """Admin para Comite."""
    list_display = [
        'codigo_comite', 'nombre', 'tipo_comite', 'empresa_id',
        'periodo_descripcion', 'estado', 'fecha_inicio', 'fecha_fin'
    ]
    list_filter = ['empresa_id', 'tipo_comite', 'estado']
    search_fields = ['codigo_comite', 'nombre', 'periodo_descripcion']
    ordering = ['empresa_id', '-fecha_inicio']
    inlines = [MiembroComiteInline]


@admin.register(MiembroComite)
class MiembroComiteAdmin(admin.ModelAdmin):
    """Admin para MiembroComite."""
    list_display = [
        'empleado_nombre', 'comite', 'rol', 'es_principal',
        'representa_a', 'activo', 'fecha_inicio'
    ]
    list_filter = ['empresa_id', 'comite', 'rol', 'es_principal', 'activo']
    search_fields = ['empleado_nombre', 'empleado_cargo', 'rol']
    ordering = ['comite', 'empleado_nombre']


class AsistenciaReunionInline(admin.TabularInline):
    """Inline para asistencias a reunión."""
    model = AsistenciaReunion
    extra = 0
    fields = ['miembro', 'asistio', 'hora_llegada', 'excusa', 'excusa_justificada']


@admin.register(Reunion)
class ReunionAdmin(admin.ModelAdmin):
    """Admin para Reunion."""
    list_display = [
        'numero_reunion', 'comite', 'tipo', 'fecha_programada',
        'estado', 'cumple_quorum', 'num_asistentes'
    ]
    list_filter = ['empresa_id', 'comite', 'tipo', 'estado', 'modalidad']
    search_fields = ['numero_reunion', 'lugar', 'agenda']
    ordering = ['-fecha_programada']
    inlines = [AsistenciaReunionInline]


@admin.register(AsistenciaReunion)
class AsistenciaReunionAdmin(admin.ModelAdmin):
    """Admin para AsistenciaReunion."""
    list_display = [
        'reunion', 'miembro', 'asistio', 'hora_llegada', 'excusa_justificada'
    ]
    list_filter = ['empresa_id', 'reunion__comite', 'asistio', 'excusa_justificada']
    search_fields = ['miembro__empleado_nombre', 'reunion__numero_reunion', 'excusa']
    ordering = ['reunion', 'miembro']


class CompromisoInline(admin.TabularInline):
    """Inline para compromisos del acta."""
    model = Compromiso
    extra = 0
    fields = [
        'numero_compromiso', 'tipo', 'descripcion', 'responsable_nombre',
        'fecha_limite', 'estado', 'prioridad'
    ]


@admin.register(ActaReunion)
class ActaReunionAdmin(admin.ModelAdmin):
    """Admin para ActaReunion."""
    list_display = [
        'numero_acta', 'reunion', 'estado', 'fecha_aprobacion', 'aprobada_por_nombre'
    ]
    list_filter = ['empresa_id', 'reunion__comite', 'estado']
    search_fields = ['numero_acta', 'desarrollo', 'conclusiones']
    ordering = ['-fecha_aprobacion']
    readonly_fields = ['fecha_aprobacion']
    inlines = [CompromisoInline]


class SeguimientoCompromisoInline(admin.TabularInline):
    """Inline para seguimientos del compromiso."""
    model = SeguimientoCompromiso
    extra = 0
    fields = [
        'fecha_seguimiento', 'avance_reportado', 'descripcion_avance',
        'requiere_apoyo', 'registrado_por_nombre'
    ]


@admin.register(Compromiso)
class CompromisoAdmin(admin.ModelAdmin):
    """Admin para Compromiso."""
    list_display = [
        'numero_compromiso', 'acta', 'tipo', 'responsable_nombre',
        'fecha_limite', 'estado', 'prioridad', 'porcentaje_avance'
    ]
    list_filter = ['empresa_id', 'acta__reunion__comite', 'tipo', 'estado', 'prioridad']
    search_fields = ['numero_compromiso', 'descripcion', 'responsable_nombre']
    ordering = ['fecha_limite']
    inlines = [SeguimientoCompromisoInline]


@admin.register(SeguimientoCompromiso)
class SeguimientoCompromisoAdmin(admin.ModelAdmin):
    """Admin para SeguimientoCompromiso."""
    list_display = [
        'compromiso', 'fecha_seguimiento', 'avance_reportado',
        'requiere_apoyo', 'registrado_por_nombre'
    ]
    list_filter = ['empresa_id', 'compromiso__acta__reunion__comite', 'requiere_apoyo']
    search_fields = ['compromiso__numero_compromiso', 'descripcion_avance', 'dificultades']
    ordering = ['-fecha_seguimiento']


class VotoMiembroInline(admin.TabularInline):
    """Inline para votos de la votación."""
    model = VotoMiembro
    extra = 0
    fields = ['miembro', 'opcion_texto', 'es_abstencion', 'fecha_voto']
    readonly_fields = ['fecha_voto']


@admin.register(Votacion)
class VotacionAdmin(admin.ModelAdmin):
    """Admin para Votacion."""
    list_display = [
        'numero_votacion', 'comite', 'titulo', 'tipo', 'estado',
        'fecha_inicio', 'total_votos_emitidos'
    ]
    list_filter = ['empresa_id', 'comite', 'tipo', 'estado', 'es_secreta']
    search_fields = ['numero_votacion', 'titulo', 'descripcion']
    ordering = ['-fecha_inicio']
    readonly_fields = [
        'total_votos_emitidos', 'resultados', 'opcion_ganadora', 'fecha_cierre_real'
    ]
    inlines = [VotoMiembroInline]


@admin.register(VotoMiembro)
class VotoMiembroAdmin(admin.ModelAdmin):
    """Admin para VotoMiembro."""
    list_display = [
        'votacion', 'miembro', 'opcion_texto', 'es_abstencion', 'fecha_voto'
    ]
    list_filter = ['empresa_id', 'votacion__comite', 'es_abstencion']
    search_fields = ['votacion__numero_votacion', 'miembro__empleado_nombre', 'opcion_texto']
    ordering = ['-fecha_voto']
    readonly_fields = ['fecha_voto']
