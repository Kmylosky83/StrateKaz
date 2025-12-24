"""
Serializers del módulo Planeación Estratégica - Dirección Estratégica
"""
from rest_framework import serializers
from .models import StrategicPlan, StrategicObjective


class StrategicObjectiveSerializer(serializers.ModelSerializer):
    """Serializer para Objetivos Estratégicos"""

    responsible_name = serializers.CharField(
        source='responsible.get_full_name',
        read_only=True
    )
    responsible_cargo_name = serializers.CharField(
        source='responsible_cargo.nombre',
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

    class Meta:
        model = StrategicObjective
        fields = [
            'id', 'plan', 'code', 'name', 'description',
            'bsc_perspective', 'bsc_perspective_display',
            'iso_standards', 'responsible', 'responsible_name',
            'responsible_cargo', 'responsible_cargo_name',
            'target_value', 'current_value', 'unit', 'progress',
            'status', 'status_display', 'start_date', 'due_date',
            'completed_at', 'order', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at', 'completed_at'
        ]


class StrategicObjectiveCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Objetivos Estratégicos"""

    class Meta:
        model = StrategicObjective
        fields = [
            'plan', 'code', 'name', 'description',
            'bsc_perspective', 'iso_standards',
            'responsible', 'responsible_cargo',
            'target_value', 'current_value', 'unit',
            'start_date', 'due_date', 'order', 'is_active'
        ]


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
