"""
Serializers para Mejora Continua - hseq_management
Auditorias internas, hallazgos y evaluacion de cumplimiento
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ProgramaAuditoria,
    Auditoria,
    Hallazgo,
    EvaluacionCumplimiento
)

User = get_user_model()


# ============================================================================
# PROGRAMA DE AUDITORIA
# ============================================================================

class ProgramaAuditoriaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Programas de Auditoria"""

    responsable_programa_nombre = serializers.CharField(
        source='responsable_programa.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    porcentaje_avance = serializers.ReadOnlyField()
    cantidad_auditorias = serializers.SerializerMethodField()

    class Meta:
        model = ProgramaAuditoria
        fields = [
            'id', 'codigo', 'nombre', 'año', 'version',
            'estado', 'estado_display', 'alcance',
            'normas_aplicables', 'presupuesto',
            'responsable_programa', 'responsable_programa_nombre',
            'aprobado_por', 'aprobado_por_nombre',
            'fecha_aprobacion', 'fecha_inicio', 'fecha_fin',
            'porcentaje_avance', 'cantidad_auditorias',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['codigo', 'created_at', 'updated_at']

    def get_cantidad_auditorias(self, obj):
        return obj.auditorias.count()


class ProgramaAuditoriaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Programas de Auditoria"""

    responsable_programa_nombre = serializers.CharField(
        source='responsable_programa.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    porcentaje_avance = serializers.ReadOnlyField()

    # Nested serializers para auditorias
    auditorias = serializers.SerializerMethodField()

    class Meta:
        model = ProgramaAuditoria
        fields = '__all__'
        read_only_fields = ['codigo', 'created_at', 'updated_at', 'created_by']

    def get_auditorias(self, obj):
        auditorias = obj.auditorias.all()[:10]  # Limitar a 10 para evitar sobrecarga
        return AuditoriaListSerializer(auditorias, many=True).data


# ============================================================================
# AUDITORIA
# ============================================================================

class AuditoriaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Auditorias"""

    programa_nombre = serializers.CharField(
        source='programa.nombre',
        read_only=True
    )
    auditor_lider_nombre = serializers.CharField(
        source='auditor_lider.get_full_name',
        read_only=True
    )
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    norma_principal_display = serializers.CharField(
        source='get_norma_principal_display',
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    dias_restantes = serializers.SerializerMethodField()

    class Meta:
        model = Auditoria
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display',
            'norma_principal', 'norma_principal_display',
            'titulo', 'objetivo',
            'programa', 'programa_nombre',
            'estado', 'estado_display',
            'fecha_planificada_inicio', 'fecha_planificada_fin',
            'fecha_real_inicio', 'fecha_real_fin',
            'auditor_lider', 'auditor_lider_nombre',
            'total_hallazgos', 'no_conformidades_mayores',
            'no_conformidades_menores', 'observaciones_count',
            'oportunidades_mejora', 'dias_restantes',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['codigo', 'created_at', 'updated_at']

    def get_dias_restantes(self, obj):
        from django.utils import timezone
        if obj.estado in ['CERRADA', 'CANCELADA']:
            return None
        delta = (obj.fecha_planificada_fin - timezone.now().date()).days
        return delta


class AuditoriaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Auditorias"""

    programa_nombre = serializers.CharField(
        source='programa.nombre',
        read_only=True
    )
    programa_codigo = serializers.CharField(
        source='programa.codigo',
        read_only=True
    )
    auditor_lider_nombre = serializers.CharField(
        source='auditor_lider.get_full_name',
        read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    norma_principal_display = serializers.CharField(
        source='get_norma_principal_display',
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Nested serializers para hallazgos
    hallazgos = serializers.SerializerMethodField()
    equipo_auditor_info = serializers.SerializerMethodField()

    class Meta:
        model = Auditoria
        fields = '__all__'
        read_only_fields = ['codigo', 'created_at', 'updated_at', 'created_by']

    def get_hallazgos(self, obj):
        hallazgos = obj.hallazgos.all()[:20]  # Limitar a 20
        return HallazgoListSerializer(hallazgos, many=True).data

    def get_equipo_auditor_info(self, obj):
        return [
            {'id': u.id, 'nombre': u.get_full_name()}
            for u in obj.equipo_auditor.all()
        ]


# ============================================================================
# HALLAZGO
# ============================================================================

class HallazgoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Hallazgos"""

    auditoria_codigo = serializers.CharField(
        source='auditoria.codigo',
        read_only=True
    )
    auditoria_titulo = serializers.CharField(
        source='auditoria.titulo',
        read_only=True
    )
    identificado_por_nombre = serializers.CharField(
        source='identificado_por.get_full_name',
        read_only=True
    )
    responsable_proceso_nombre = serializers.CharField(
        source='responsable_proceso.get_full_name',
        read_only=True
    )

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)

    requiere_accion_correctiva = serializers.ReadOnlyField()
    dias_abierto = serializers.ReadOnlyField()

    class Meta:
        model = Hallazgo
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display',
            'estado', 'estado_display',
            'titulo', 'descripcion',
            'auditoria', 'auditoria_codigo', 'auditoria_titulo',
            'proceso_area', 'clausula_norma', 'norma_referencia',
            'impacto', 'impacto_display', 'area_impactada', 'recomendacion',
            'identificado_por', 'identificado_por_nombre',
            'responsable_proceso', 'responsable_proceso_nombre',
            'fecha_deteccion', 'fecha_cierre_esperada', 'fecha_cierre_real',
            'requiere_accion_correctiva', 'dias_abierto',
            'es_eficaz', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['codigo', 'created_at', 'updated_at']


class HallazgoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Hallazgos"""

    auditoria_codigo = serializers.CharField(
        source='auditoria.codigo',
        read_only=True
    )
    auditoria_titulo = serializers.CharField(
        source='auditoria.titulo',
        read_only=True
    )
    identificado_por_nombre = serializers.CharField(
        source='identificado_por.get_full_name',
        read_only=True
    )
    responsable_proceso_nombre = serializers.CharField(
        source='responsable_proceso.get_full_name',
        read_only=True
    )
    verificado_por_nombre = serializers.CharField(
        source='verificado_por.get_full_name',
        read_only=True
    )

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)

    requiere_accion_correctiva = serializers.ReadOnlyField()
    dias_abierto = serializers.ReadOnlyField()

    # Info de no conformidad generada si existe
    no_conformidad_info = serializers.SerializerMethodField()

    class Meta:
        model = Hallazgo
        fields = '__all__'
        read_only_fields = ['codigo', 'created_at', 'updated_at']

    def get_no_conformidad_info(self, obj):
        if obj.no_conformidad_generada:
            return {
                'id': obj.no_conformidad_generada.id,
                'codigo': obj.no_conformidad_generada.codigo,
                'titulo': obj.no_conformidad_generada.titulo,
                'estado': obj.no_conformidad_generada.estado
            }
        return None


# ============================================================================
# EVALUACION DE CUMPLIMIENTO
# ============================================================================

class EvaluacionCumplimientoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Evaluaciones de Cumplimiento"""

    evaluador_nombre = serializers.CharField(
        source='evaluador.get_full_name',
        read_only=True
    )
    responsable_cumplimiento_nombre = serializers.CharField(
        source='responsable_cumplimiento.get_full_name',
        read_only=True
    )

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    periodicidad_display = serializers.CharField(source='get_periodicidad_display', read_only=True)

    estado_cumplimiento = serializers.ReadOnlyField()
    dias_para_proxima_evaluacion = serializers.ReadOnlyField()

    class Meta:
        model = EvaluacionCumplimiento
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display',
            'nombre', 'descripcion',
            'resultado', 'resultado_display',
            'porcentaje_cumplimiento',
            'periodicidad', 'periodicidad_display',
            'fecha_evaluacion', 'proxima_evaluacion',
            'evaluador', 'evaluador_nombre',
            'responsable_cumplimiento', 'responsable_cumplimiento_nombre',
            'estado_cumplimiento', 'dias_para_proxima_evaluacion',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['codigo', 'created_at', 'updated_at']


class EvaluacionCumplimientoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Evaluaciones de Cumplimiento"""

    evaluador_nombre = serializers.CharField(
        source='evaluador.get_full_name',
        read_only=True
    )
    responsable_cumplimiento_nombre = serializers.CharField(
        source='responsable_cumplimiento.get_full_name',
        read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    periodicidad_display = serializers.CharField(source='get_periodicidad_display', read_only=True)

    estado_cumplimiento = serializers.ReadOnlyField()
    dias_para_proxima_evaluacion = serializers.ReadOnlyField()

    # Info de requisito legal si existe
    requisito_legal_info = serializers.SerializerMethodField()

    # Info de hallazgo generado si existe
    hallazgo_info = serializers.SerializerMethodField()

    class Meta:
        model = EvaluacionCumplimiento
        fields = '__all__'
        read_only_fields = ['codigo', 'created_at', 'updated_at', 'created_by']

    def get_requisito_legal_info(self, obj):
        if obj.requisito_legal:
            return {
                'id': obj.requisito_legal.id,
                'nombre': getattr(obj.requisito_legal, 'nombre', str(obj.requisito_legal)),
            }
        return None

    def get_hallazgo_info(self, obj):
        if obj.hallazgo_generado:
            return {
                'id': obj.hallazgo_generado.id,
                'codigo': obj.hallazgo_generado.codigo,
                'titulo': obj.hallazgo_generado.titulo,
                'estado': obj.hallazgo_generado.estado
            }
        return None
