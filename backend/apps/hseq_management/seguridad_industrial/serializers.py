"""
Serializers para Seguridad Industrial
"""
from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()
from .models import (
    TipoPermisoTrabajo, PermisoTrabajo,
    TipoInspeccion, PlantillaInspeccion, Inspeccion, ItemInspeccion,
    TipoEPP, EntregaEPP,
    ProgramaSeguridad
)


# =============================================================================
# PERMISOS DE TRABAJO
# =============================================================================

class TipoPermisoTrabajoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPermisoTrabajo
        fields = '__all__'


class PermisoTrabajoSerializer(serializers.ModelSerializer):
    tipo_permiso_detalle = TipoPermisoTrabajoSerializer(source='tipo_permiso', read_only=True)
    solicitante_nombre = serializers.CharField(source='solicitante.nombre_completo', read_only=True)
    ejecutor_nombre = serializers.CharField(source='ejecutor.nombre_completo', read_only=True, allow_null=True)
    supervisor_nombre = serializers.CharField(source='supervisor.nombre_completo', read_only=True)

    # Campos calculados
    esta_activo = serializers.BooleanField(read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    puede_aprobar = serializers.BooleanField(read_only=True)

    class Meta:
        model = PermisoTrabajo
        fields = '__all__'
        read_only_fields = [
            'numero_permiso', 'duracion_horas',
            'autorizado_sst_por', 'autorizado_sst_fecha',
            'autorizado_operaciones_por', 'autorizado_operaciones_fecha',
            'fecha_cierre', 'cerrado_por'
        ]

    def validate(self, data):
        """Validaciones de negocio"""
        # Validar que fecha_fin sea posterior a fecha_inicio
        if data.get('fecha_inicio') and data.get('fecha_fin'):
            if data['fecha_fin'] <= data['fecha_inicio']:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio'
                })

        # Validar duración máxima según tipo de permiso
        if data.get('fecha_inicio') and data.get('fecha_fin') and data.get('tipo_permiso'):
            delta = data['fecha_fin'] - data['fecha_inicio']
            duracion_horas = delta.total_seconds() / 3600
            max_horas = data['tipo_permiso'].duracion_maxima_horas

            if duracion_horas > max_horas:
                raise serializers.ValidationError({
                    'fecha_fin': f'La duración no puede exceder {max_horas} horas para este tipo de permiso'
                })

        return data


class PermisoTrabajoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    tipo_permiso_nombre = serializers.CharField(source='tipo_permiso.nombre', read_only=True)
    solicitante_nombre = serializers.CharField(source='solicitante.nombre_completo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = PermisoTrabajo
        fields = [
            'id', 'numero_permiso', 'tipo_permiso_nombre', 'ubicacion',
            'fecha_inicio', 'fecha_fin', 'solicitante_nombre',
            'estado', 'estado_display', 'autorizado_sst', 'autorizado_operaciones'
        ]


# =============================================================================
# INSPECCIONES
# =============================================================================

class TipoInspeccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoInspeccion
        fields = '__all__'


class PlantillaInspeccionSerializer(serializers.ModelSerializer):
    tipo_inspeccion_detalle = TipoInspeccionSerializer(source='tipo_inspeccion', read_only=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = PlantillaInspeccion
        fields = '__all__'

    def get_total_items(self, obj):
        return len(obj.items) if obj.items else 0


class ItemInspeccionSerializer(serializers.ModelSerializer):
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)

    class Meta:
        model = ItemInspeccion
        fields = '__all__'


class InspeccionSerializer(serializers.ModelSerializer):
    tipo_inspeccion_detalle = TipoInspeccionSerializer(source='tipo_inspeccion', read_only=True)
    plantilla_detalle = PlantillaInspeccionSerializer(source='plantilla', read_only=True)
    inspector_nombre = serializers.CharField(source='inspector.nombre_completo', read_only=True)
    acompanante_nombre = serializers.CharField(
        source='acompanante.nombre_completo',
        read_only=True,
        allow_null=True
    )
    items_inspeccion = ItemInspeccionSerializer(many=True, read_only=True)

    class Meta:
        model = Inspeccion
        fields = '__all__'
        read_only_fields = [
            'numero_inspeccion', 'porcentaje_cumplimiento',
            'calificacion_general', 'resultado_global'
        ]


class InspeccionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    tipo_inspeccion_nombre = serializers.CharField(source='tipo_inspeccion.nombre', read_only=True)
    inspector_nombre = serializers.CharField(source='inspector.nombre_completo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    resultado_display = serializers.CharField(source='get_resultado_global_display', read_only=True)

    class Meta:
        model = Inspeccion
        fields = [
            'id', 'numero_inspeccion', 'tipo_inspeccion_nombre',
            'fecha_programada', 'fecha_realizada', 'inspector_nombre',
            'estado', 'estado_display', 'porcentaje_cumplimiento',
            'resultado_global', 'resultado_display', 'tiene_hallazgos'
        ]


class InspeccionCreateSerializer(serializers.Serializer):
    """Serializer para crear inspección con items desde plantilla"""
    tipo_inspeccion_id = serializers.IntegerField()
    plantilla_id = serializers.IntegerField()
    fecha_programada = serializers.DateField()
    ubicacion = serializers.CharField(max_length=200)
    area = serializers.CharField(max_length=100, required=False, allow_blank=True)
    inspector_id = serializers.IntegerField()
    acompanante_id = serializers.IntegerField(required=False, allow_null=True)
    empresa_id = serializers.IntegerField()


# =============================================================================
# EPP
# =============================================================================

class TipoEPPSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = TipoEPP
        fields = '__all__'


class EntregaEPPSerializer(serializers.ModelSerializer):
    tipo_epp_detalle = TipoEPPSerializer(source='tipo_epp', read_only=True)
    colaborador_nombre = serializers.CharField(source='colaborador.nombre_completo', read_only=True)
    entregado_por_nombre = serializers.CharField(source='entregado_por.nombre_completo', read_only=True)
    requiere_reposicion = serializers.BooleanField(read_only=True)

    class Meta:
        model = EntregaEPP
        fields = '__all__'
        read_only_fields = ['numero_entrega', 'fecha_reposicion_programada']


class EntregaEPPListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    tipo_epp_nombre = serializers.CharField(source='tipo_epp.nombre', read_only=True)
    colaborador_nombre = serializers.CharField(source='colaborador.nombre_completo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = EntregaEPP
        fields = [
            'id', 'numero_entrega', 'tipo_epp_nombre', 'colaborador_nombre',
            'fecha_entrega', 'fecha_reposicion_programada', 'cantidad',
            'estado', 'estado_display', 'capacitacion_realizada'
        ]


# =============================================================================
# PROGRAMAS DE SEGURIDAD
# =============================================================================

class ProgramaSeguridadSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    equipo_apoyo_detalle = serializers.SerializerMethodField()
    esta_vigente = serializers.BooleanField(read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProgramaSeguridad
        fields = '__all__'

    def get_equipo_apoyo_detalle(self, obj):
        return [
            {
                'id': colaborador.id,
                'nombre_completo': colaborador.nombre_completo
            }
            for colaborador in obj.equipo_apoyo.all()
        ]

    def validate(self, data):
        """Validaciones de negocio"""
        # Validar fechas
        if data.get('fecha_inicio') and data.get('fecha_fin'):
            if data['fecha_fin'] <= data['fecha_inicio']:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio'
                })

        # Validar presupuesto
        if data.get('presupuesto_ejecutado') and data.get('presupuesto_asignado'):
            if data['presupuesto_ejecutado'] > data['presupuesto_asignado']:
                raise serializers.ValidationError({
                    'presupuesto_ejecutado': 'El presupuesto ejecutado no puede superar el asignado'
                })

        return data


class ProgramaSeguridadListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    tipo_programa_display = serializers.CharField(source='get_tipo_programa_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = ProgramaSeguridad
        fields = [
            'id', 'codigo', 'nombre', 'tipo_programa', 'tipo_programa_display',
            'responsable_nombre', 'fecha_inicio', 'fecha_fin',
            'estado', 'estado_display', 'porcentaje_avance', 'activo'
        ]


# =============================================================================
# ACTIONS - Serializers para acciones específicas
# =============================================================================

class AprobarPermisoSerializer(serializers.Serializer):
    """Serializer para aprobar permiso de trabajo"""
    tipo_aprobacion = serializers.ChoiceField(
        choices=['SST', 'OPERACIONES'],
        help_text="Tipo de aprobación: SST u OPERACIONES"
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Observaciones de la aprobación"
    )


class CerrarPermisoSerializer(serializers.Serializer):
    """Serializer para cerrar permiso de trabajo"""
    hubo_incidente = serializers.BooleanField(default=False)
    descripcion_incidente = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Descripción del incidente si lo hubo"
    )
    observaciones_cierre = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Observaciones al cerrar el permiso"
    )


class GenerarHallazgoSerializer(serializers.Serializer):
    """Serializer para generar hallazgo desde item de inspección"""
    item_inspeccion_id = serializers.IntegerField(help_text="ID del item de inspección")
    descripcion_hallazgo = serializers.CharField(help_text="Descripción del hallazgo")
    tipo_hallazgo = serializers.ChoiceField(
        choices=['NO_CONFORMIDAD', 'OBSERVACION', 'MEJORA'],
        default='NO_CONFORMIDAD'
    )
    criticidad = serializers.ChoiceField(
        choices=['BAJA', 'MEDIA', 'ALTA', 'CRITICA'],
        default='MEDIA'
    )


class CompletarInspeccionSerializer(serializers.Serializer):
    """Serializer para completar inspección"""
    items = serializers.ListField(
        child=serializers.DictField(),
        help_text="Lista de items con resultados"
    )
    observaciones_generales = serializers.CharField(required=False, allow_blank=True)
    recomendaciones = serializers.CharField(required=False, allow_blank=True)
    fotos = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        default=list
    )
