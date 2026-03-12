"""
ViewSets para el Modulo de Direccion Estrategica
Sistema de Gestion StrateKaz

Este modulo contiene:
- StrategicStatsViewSet: Estadisticas de Direccion Estrategica

NOTA LEGACY v4.0:
- Tab 1 ViewSets (CorporateIdentity, CorporateValue) MOVIDOS a identidad/views.py
  Endpoints activos: /api/identidad/identidad/, /api/identidad/valores/
- Tab 2 ViewSets (StrategicPlan, StrategicObjective) MOVIDOS a planeacion/views.py
  Endpoints activos: /api/planeacion/planes/, /api/planeacion/objetivos/
- Tab 4 ViewSets (SystemModule, ModuleTab, TabSection) MOVIDOS a core/viewsets_config.py
  Endpoints activos: /api/core/system-modules/, /api/core/module-tabs/
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import get_user_model

# Modelos de core (RBAC, Configuracion del Sistema)
from apps.core.models import (
    SystemModule,
    Role, Cargo
)

# Modelos locales de gestion_estrategica (imports relativos)
from .identidad.models import CorporateIdentity
from .planeacion.models import StrategicPlan, StrategicObjective


# =============================================================================
# ESTADISTICAS DE GESTION ESTRATEGICA
# =============================================================================

class StrategicStatsViewSet(viewsets.ViewSet):
    """
    ViewSet para estadisticas de Direccion Estrategica

    Endpoints:
    - GET /api/gestion-estrategica/strategic-stats/ - Estadisticas generales (list)
    - GET /api/gestion-estrategica/strategic-stats/stats/ - Alias para estadisticas

    Tambien disponible en: /api/identidad/stats/ (identidad sub-app)
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/gestion-estrategica/strategic-stats/

        Retorna estadisticas de valor para Direccion Estrategica:
        1. Completitud del Sistema (%)
        2. Objetivos Estrategicos (cumplidos/total, en riesgo)
        3. Control de Acceso RBAC (usuarios con/sin roles)
        4. Identidad Corporativa (estado)
        """
        return self._get_stats(request)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/gestion-estrategica/strategic-stats/stats/

        Alias para el metodo list
        """
        return self._get_stats(request)

    def _get_stats(self, request):
        """
        Metodo interno para obtener estadisticas
        """
        User = get_user_model()

        # === 1. DATOS BASE ===
        from django.db.models import Count, Q
        active_identity = CorporateIdentity.objects.filter(
            is_active=True
        ).annotate(
            active_values_count=Count('values', filter=Q(values__is_active=True))
        ).first()
        active_plan = StrategicPlan.objects.filter(is_active=True).first()

        # === 2. OBJETIVOS ESTRATEGICOS ===
        total_objs = 0
        completed_objs = 0
        in_progress_objs = 0
        at_risk_objs = 0
        avg = 0

        if active_plan:
            plan_objectives = StrategicObjective.objects.filter(
                plan=active_plan, is_active=True
            )
            total_objs = plan_objectives.count()
            completed_objs = plan_objectives.filter(status='COMPLETADO').count()
            in_progress_objs = plan_objectives.filter(status='EN_PROGRESO').count()
            # Objetivos en riesgo: retrasados o con progreso <30%
            at_risk_objs = plan_objectives.filter(status='RETRASADO').count()
            at_risk_objs += plan_objectives.filter(
                status='EN_PROGRESO', progress__lt=30
            ).count()

            progress_values = list(plan_objectives.values_list('progress', flat=True))
            avg = sum(progress_values) / len(progress_values) if progress_values else 0

        # === 3. CONTROL DE ACCESO (RBAC) ===
        total_users = User.objects.filter(is_active=True).count()
        # Usuarios con al menos un rol asignado (via user_roles relation)
        users_with_roles = User.objects.filter(
            is_active=True, user_roles__isnull=False
        ).distinct().count()
        users_without_roles = total_users - users_with_roles
        total_roles = Role.objects.filter(is_active=True).count()
        total_cargos = Cargo.objects.filter(is_active=True).count()

        # === 4. CONFIGURACION ===
        enabled_modules = SystemModule.objects.filter(is_enabled=True).count()
        total_modules = SystemModule.objects.count()

        # === 5. COMPLETITUD DEL SISTEMA ===
        has_identity = active_identity is not None
        has_organization = total_cargos >= 1 and total_roles >= 1
        has_plan = active_plan is not None
        has_config = enabled_modules >= 1

        # Calcular porcentaje (25% por cada seccion)
        completeness_score = 0
        if has_identity:
            completeness_score += 25
        if has_organization:
            completeness_score += 25
        if has_plan:
            completeness_score += 25
        if has_config:
            completeness_score += 25

        stats = {
            # 1. Completitud del Sistema
            'system_completeness': completeness_score,
            'completeness_details': {
                'has_identity': has_identity,
                'has_organization': has_organization,
                'has_plan': has_plan,
                'has_config': has_config,
            },

            # 2. Objetivos Estrategicos
            'total_objectives': total_objs,
            'completed_objectives': completed_objs,
            'in_progress_objectives': in_progress_objs,
            'at_risk_objectives': at_risk_objs,
            'avg_progress': round(avg, 1),
            'active_plan_name': active_plan.name if active_plan else None,

            # 3. Control de Acceso (RBAC)
            'total_users': total_users,
            'users_with_roles': users_with_roles,
            'users_without_roles': users_without_roles,
            'total_roles': total_roles,
            'total_cargos': total_cargos,

            # 4. Identidad Corporativa
            'has_active_identity': has_identity,
            'identity_is_signed': active_identity.is_signed if active_identity else False,
            'identity_version': active_identity.version if active_identity else 0,
            'values_count': active_identity.active_values_count if active_identity else 0,
            'policy_pending_signature': has_identity and not active_identity.is_signed,

            # Configuracion del sistema
            'enabled_modules': enabled_modules,
            'total_modules': total_modules,
            'configured_consecutivos': self._get_consecutivos_count(),
        }

        return Response(stats)

    def _get_consecutivos_count(self):
        """Cuenta consecutivos activos configurados"""
        try:
            from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
            return ConsecutivoConfig.objects.filter(is_active=True).count()
        except Exception:
            return 0
