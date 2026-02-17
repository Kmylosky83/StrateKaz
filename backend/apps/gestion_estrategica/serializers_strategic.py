"""
Serializers para el Modulo de Direccion Estrategica
Sistema de Gestion StrateKaz

NOTA LEGACY v4.0:
- Tab 1 serializers (CorporateIdentity, CorporateValue) MOVIDOS a identidad/serializers.py
- Tab 2 serializers (StrategicPlan, StrategicObjective) MOVIDOS a planeacion/serializers.py
- Tab 4 serializers (SystemModule, ModuleTab, TabSection) MOVIDOS a core/serializers_config.py
- Sidebar serializers MOVIDOS a core/serializers_config.py

Solo queda StrategicStatsSerializer para documentar la respuesta de stats.
"""
from rest_framework import serializers


# =============================================================================
# ESTADISTICAS DE GESTION ESTRATEGICA
# =============================================================================

class StrategicStatsSerializer(serializers.Serializer):
    """Serializer para estadisticas de Direccion Estrategica"""

    # Identidad
    has_active_identity = serializers.BooleanField()
    identity_is_signed = serializers.BooleanField()
    values_count = serializers.IntegerField()

    # Planeacion
    active_plan_name = serializers.CharField(allow_null=True)
    total_objectives = serializers.IntegerField()
    completed_objectives = serializers.IntegerField()
    in_progress_objectives = serializers.IntegerField()
    avg_progress = serializers.FloatField()

    # Configuracion
    enabled_modules = serializers.IntegerField()
    total_modules = serializers.IntegerField()
    configured_consecutivos = serializers.IntegerField()
