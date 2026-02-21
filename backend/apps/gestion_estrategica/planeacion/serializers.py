"""
Serializers del módulo Planeación Estratégica - Dirección Estratégica

Serializers para:
- StrategicPlan: Plan estratégico
- StrategicObjective: Objetivos estratégicos
- MapaEstrategico: Mapa estratégico con perspectivas BSC
- CausaEfecto: Relaciones causa-efecto
- KPIObjetivo: Indicadores clave
- MedicionKPI: Mediciones de KPI
- GestionCambio: Gestión de cambios
"""
from rest_framework import serializers
from .models import (
    StrategicPlan, StrategicObjective, MapaEstrategico,
    CausaEfecto, KPIObjetivo, MedicionKPI, GestionCambio
)


class NormaISOMinimalSerializer(serializers.Serializer):
    """Serializer mínimo para Normas ISO en objetivos"""
    id = serializers.IntegerField()
    code = serializers.CharField()
    short_name = serializers.CharField()
    name = serializers.CharField()
    icon = serializers.CharField(allow_null=True)
    color = serializers.CharField(allow_null=True)


class StrategicObjectiveSerializer(serializers.ModelSerializer):
    """Serializer para Objetivos Estratégicos"""

    responsible_name = serializers.CharField(
        source='responsible.get_full_name',
        read_only=True
    )
    responsible_cargo_name = serializers.CharField(
        source='responsible_cargo.name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    bsc_perspective_display = serializers.CharField(
        source='get_bsc_perspective_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    # Normas ISO vinculadas (ManyToMany) - lectura con detalles
    normas_iso_detail = NormaISOMinimalSerializer(
        source='normas_iso',
        many=True,
        read_only=True
    )
    # IDs para escritura
    normas_iso_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list
    )

    class Meta:
        model = StrategicObjective
        fields = [
            'id', 'plan', 'code', 'name', 'description',
            'bsc_perspective', 'bsc_perspective_display',
            'normas_iso', 'normas_iso_detail', 'normas_iso_ids',
            'responsible', 'responsible_name',
            'responsible_cargo', 'responsible_cargo_name',
            'target_value', 'current_value', 'unit', 'progress',
            'status', 'status_display', 'start_date', 'due_date',
            'completed_at', 'orden', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at', 'completed_at'
        ]

    def validate_normas_iso_ids(self, value):
        """Valida que los IDs de normas ISO existan"""
        if not value:
            return value
        from apps.gestion_estrategica.configuracion.models import NormaISO
        valid_ids = set(NormaISO.objects.filter(
            id__in=value,
            is_active=True,
            deleted_at__isnull=True
        ).values_list('id', flat=True))
        invalid_ids = set(value) - valid_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f"Normas ISO no encontradas o inactivas: {invalid_ids}"
            )
        return value

    def update(self, instance, validated_data):
        normas_iso_ids = validated_data.pop('normas_iso_ids', None)
        instance = super().update(instance, validated_data)
        if normas_iso_ids is not None:
            from apps.gestion_estrategica.configuracion.models import NormaISO
            instance.normas_iso.set(NormaISO.objects.filter(id__in=normas_iso_ids))
        return instance


class StrategicObjectiveCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Objetivos Estratégicos"""

    # IDs de normas ISO para vincular (ManyToMany)
    normas_iso_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list
    )

    class Meta:
        model = StrategicObjective
        fields = [
            'plan', 'code', 'name', 'description',
            'bsc_perspective', 'normas_iso_ids',
            'responsible', 'responsible_cargo',
            'target_value', 'current_value', 'unit',
            'start_date', 'due_date', 'orden', 'is_active'
        ]

    def validate_normas_iso_ids(self, value):
        """Valida que los IDs de normas ISO existan"""
        if not value:
            return value
        from apps.gestion_estrategica.configuracion.models import NormaISO
        valid_ids = set(NormaISO.objects.filter(
            id__in=value,
            is_active=True,
            deleted_at__isnull=True
        ).values_list('id', flat=True))
        invalid_ids = set(value) - valid_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f"Normas ISO no encontradas o inactivas: {invalid_ids}"
            )
        return value

    def create(self, validated_data):
        normas_iso_ids = validated_data.pop('normas_iso_ids', [])
        instance = super().create(validated_data)
        if normas_iso_ids:
            from apps.gestion_estrategica.configuracion.models import NormaISO
            instance.normas_iso.set(NormaISO.objects.filter(id__in=normas_iso_ids))
        return instance

    def update(self, instance, validated_data):
        normas_iso_ids = validated_data.pop('normas_iso_ids', None)
        instance = super().update(instance, validated_data)
        if normas_iso_ids is not None:
            from apps.gestion_estrategica.configuracion.models import NormaISO
            instance.normas_iso.set(NormaISO.objects.filter(id__in=normas_iso_ids))
        return instance


class StrategicPlanSerializer(serializers.ModelSerializer):
    """Serializer para Plan Estratégico"""

    objectives = StrategicObjectiveSerializer(many=True, read_only=True)
    progress = serializers.ReadOnlyField()
    period_type_display = serializers.CharField(
        source='get_period_type_display',
        read_only=True
    )
    approved_by_name = serializers.CharField(
        source='approved_by.get_full_name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    objectives_count = serializers.SerializerMethodField()
    objectives_completed = serializers.SerializerMethodField()

    class Meta:
        model = StrategicPlan
        fields = [
            'id', 'name', 'description', 'period_type',
            'period_type_display', 'start_date', 'end_date',
            'strategic_map_image', 'strategic_map_description',
            'is_active', 'progress', 'approved_by', 'approved_by_name',
            'approved_at', 'objectives', 'objectives_count',
            'objectives_completed', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'progress', 'approved_by', 'approved_at',
            'created_by', 'created_at', 'updated_at'
        ]

    def get_objectives_count(self, obj):
        return obj.objectives.filter(is_active=True).count()

    def get_objectives_completed(self, obj):
        return obj.objectives.filter(is_active=True, status='COMPLETADO').count()


class StrategicPlanCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Plan Estratégico"""

    class Meta:
        model = StrategicPlan
        fields = [
            'name', 'description', 'period_type',
            'start_date', 'end_date', 'strategic_map_image',
            'strategic_map_description', 'is_active'
        ]


class ApprovePlanSerializer(serializers.Serializer):
    """Serializer para aprobar el plan estratégico"""
    confirm = serializers.BooleanField(
        required=True,
        help_text="Confirmar la aprobación del plan"
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe confirmar la aprobación del plan"
            )
        return value


class UpdateProgressSerializer(serializers.Serializer):
    """Serializer para actualizar progreso de objetivo"""
    current_value = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=True,
        help_text="Nuevo valor actual del indicador"
    )


# =============================================================================
# MAPA ESTRATÉGICO
# =============================================================================

class CausaEfectoSerializer(serializers.ModelSerializer):
    """Serializer para Relaciones Causa-Efecto"""
    source_objective_code = serializers.CharField(
        source='source_objective.code',
        read_only=True
    )
    source_objective_name = serializers.CharField(
        source='source_objective.name',
        read_only=True
    )
    target_objective_code = serializers.CharField(
        source='target_objective.code',
        read_only=True
    )
    target_objective_name = serializers.CharField(
        source='target_objective.name',
        read_only=True
    )

    class Meta:
        model = CausaEfecto
        fields = [
            'id', 'mapa', 'source_objective', 'source_objective_code',
            'source_objective_name', 'target_objective', 'target_objective_code',
            'target_objective_name', 'description', 'weight',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MapaEstrategicoSerializer(serializers.ModelSerializer):
    """Serializer para Mapa Estratégico"""
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    relaciones = CausaEfectoSerializer(many=True, read_only=True)
    relaciones_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = MapaEstrategico
        fields = [
            'id', 'plan', 'plan_name', 'name', 'description',
            'canvas_data', 'image', 'version', 'is_active',
            'relaciones', 'relaciones_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_relaciones_count(self, obj):
        return obj.relaciones.count()


class MapaEstrategicoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Mapa Estratégico"""

    class Meta:
        model = MapaEstrategico
        fields = [
            'plan', 'name', 'description', 'canvas_data',
            'image', 'version', 'is_active'
        ]


class UpdateCanvasSerializer(serializers.Serializer):
    """Serializer para actualizar datos del canvas"""
    canvas_data = serializers.JSONField(
        required=True,
        help_text="Datos del canvas (posiciones de nodos, etc.)"
    )


# =============================================================================
# KPI Y MEDICIONES
# =============================================================================

class MedicionKPISerializer(serializers.ModelSerializer):
    """Serializer para Mediciones de KPI"""
    measured_by_name = serializers.CharField(
        source='measured_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = MedicionKPI
        fields = [
            'id', 'kpi', 'period', 'value', 'notes',
            'evidence_file', 'measured_by', 'measured_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'measured_by', 'created_at', 'updated_at']


class KPIObjetivoSerializer(serializers.ModelSerializer):
    """Serializer para KPI de Objetivo"""
    objective_code = serializers.CharField(
        source='objective.code',
        read_only=True
    )
    objective_name = serializers.CharField(
        source='objective.name',
        read_only=True
    )
    frequency_display = serializers.CharField(
        source='get_frequency_display',
        read_only=True
    )
    trend_type_display = serializers.CharField(
        source='get_trend_type_display',
        read_only=True
    )
    status_semaforo = serializers.ReadOnlyField()
    responsible_name = serializers.CharField(
        source='responsible.get_full_name',
        read_only=True
    )
    responsible_cargo_name = serializers.CharField(
        source='responsible_cargo.name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    measurements_count = serializers.SerializerMethodField()
    recent_measurements = serializers.SerializerMethodField()

    class Meta:
        model = KPIObjetivo
        fields = [
            'id', 'objective', 'objective_code', 'objective_name',
            'name', 'description', 'formula', 'unit',
            'frequency', 'frequency_display', 'trend_type', 'trend_type_display',
            'target_value', 'warning_threshold', 'critical_threshold',
            'min_value', 'max_value', 'data_source',
            'responsible', 'responsible_name',
            'responsible_cargo', 'responsible_cargo_name',
            'last_value', 'last_measurement_date', 'status_semaforo',
            'measurements_count', 'recent_measurements', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'last_value', 'last_measurement_date', 'status_semaforo',
            'created_by', 'created_at', 'updated_at'
        ]

    def get_measurements_count(self, obj):
        return obj.measurements.count()

    def get_recent_measurements(self, obj):
        recent = obj.measurements.order_by('-period')[:5]
        return MedicionKPISerializer(recent, many=True).data


class KPIObjetivoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar KPI"""

    class Meta:
        model = KPIObjetivo
        fields = [
            'objective', 'name', 'description', 'formula', 'unit',
            'frequency', 'trend_type', 'target_value',
            'warning_threshold', 'critical_threshold',
            'min_value', 'max_value', 'data_source',
            'responsible', 'responsible_cargo', 'is_active'
        ]


class AddMeasurementSerializer(serializers.Serializer):
    """Serializer para agregar medición a un KPI"""
    value = serializers.DecimalField(
        max_digits=15,
        decimal_places=4,
        required=True
    )
    period = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    evidence_file = serializers.FileField(required=False)


# =============================================================================
# GESTIÓN DEL CAMBIO
# =============================================================================

class GestionCambioSerializer(serializers.ModelSerializer):
    """Serializer para Gestión del Cambio"""
    change_type_display = serializers.CharField(
        source='get_change_type_display',
        read_only=True
    )
    priority_display = serializers.CharField(
        source='get_priority_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    responsible_name = serializers.CharField(
        source='responsible.get_full_name',
        read_only=True
    )
    responsible_cargo_name = serializers.CharField(
        source='responsible_cargo.name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    related_objectives_details = serializers.SerializerMethodField()

    class Meta:
        model = GestionCambio
        fields = [
            'id', 'code', 'title', 'description',
            'change_type', 'change_type_display',
            'priority', 'priority_display',
            'status', 'status_display',
            'impact_analysis', 'risk_assessment', 'action_plan',
            'resources_required',
            'responsible', 'responsible_name',
            'responsible_cargo', 'responsible_cargo_name',
            'start_date', 'due_date', 'completed_date',
            'related_objectives', 'related_objectives_details',
            'lessons_learned', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'completed_date', 'created_by', 'created_at', 'updated_at'
        ]

    def get_related_objectives_details(self, obj):
        return [
            {'id': o.id, 'code': o.code, 'name': o.name}
            for o in obj.related_objectives.all()
        ]


class GestionCambioCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Gestión del Cambio"""

    class Meta:
        model = GestionCambio
        fields = [
            'code', 'title', 'description', 'change_type', 'priority',
            'status', 'impact_analysis', 'risk_assessment', 'action_plan',
            'resources_required', 'responsible', 'responsible_cargo',
            'start_date', 'due_date', 'related_objectives',
            'lessons_learned', 'is_active'
        ]


class TransitionStatusSerializer(serializers.Serializer):
    """Serializer para transicionar estado de cambio"""
    new_status = serializers.ChoiceField(
        choices=GestionCambio.STATUS_CHOICES,
        required=True
    )
