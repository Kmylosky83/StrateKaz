"""
ViewSet para estadísticas de Dirección Estratégica
Sistema de Gestión StrateKaz

Este módulo proporciona estadísticas integradas de:
- Identidad Corporativa (firma, valores)
- Planeación Estratégica (objetivos, progreso)
- Control de Acceso RBAC (usuarios, roles)
- Configuración del Sistema (módulos, completitud)

Movido desde apps.core.viewsets_strategic para resolver dependencias circulares.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

# Modelos de identidad y planeación
from .models import CorporateIdentity, CorporateValue

# Importación condicional de planeación para evitar dependencias circulares
try:
    from apps.gestion_estrategica.planeacion.models import StrategicPlan, StrategicObjective
    PLANEACION_AVAILABLE = True
except ImportError:
    PLANEACION_AVAILABLE = False

# Modelos de core para estadísticas RBAC y configuración
try:
    from apps.core.models import Role, Cargo, SystemModule
    CORE_MODELS_AVAILABLE = True
except ImportError:
    CORE_MODELS_AVAILABLE = False


class StrategicStatsViewSet(viewsets.ViewSet):
    """
    ViewSet para estadísticas de Dirección Estratégica

    Endpoints:
    - GET /api/identidad/stats/ - Estadísticas generales (list)
    - GET /api/identidad/stats/stats/ - Alias para estadísticas

    También disponible en URL legacy: /api/core/strategic/
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/identidad/stats/

        Retorna estadísticas de valor para Dirección Estratégica:
        1. Completitud del Sistema (%)
        2. Objetivos Estratégicos (cumplidos/total, en riesgo)
        3. Control de Acceso RBAC (usuarios con/sin roles)
        4. Identidad Corporativa (estado de firma)
        """
        return self._get_stats(request)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/identidad/stats/stats/

        Alias para el método list
        """
        return self._get_stats(request)

    def _get_stats(self, request):
        """
        Método interno para obtener estadísticas
        """
        User = get_user_model()

        # === 1. DATOS BASE - IDENTIDAD ===
        active_identity = CorporateIdentity.objects.filter(
            is_active=True
        ).annotate(
            active_values_count=Count('values', filter=Q(values__is_active=True))
        ).first()
        values_count = active_identity.active_values_count if active_identity else 0

        # === 2. DATOS BASE - PLANEACIÓN ===
        active_plan = None
        total_objs = 0
        completed_objs = 0
        in_progress_objs = 0
        at_risk_objs = 0
        avg = 0

        if PLANEACION_AVAILABLE:
            active_plan = StrategicPlan.objects.filter(is_active=True).first()

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
        total_users = 0
        users_with_roles = 0
        users_without_roles = 0
        total_roles = 0
        total_cargos = 0

        if CORE_MODELS_AVAILABLE:
            total_users = User.objects.filter(is_active=True).count()
            # Usuarios con al menos un rol asignado (via user_roles relation)
            users_with_roles = User.objects.filter(
                is_active=True, user_roles__isnull=False
            ).distinct().count()
            users_without_roles = total_users - users_with_roles
            total_roles = Role.objects.filter(is_active=True).count()
            total_cargos = Cargo.objects.filter(is_active=True).count()

        # === 4. CONFIGURACIÓN ===
        enabled_modules = 0
        total_modules = 0

        if CORE_MODELS_AVAILABLE:
            enabled_modules = SystemModule.objects.filter(is_enabled=True).count()
            total_modules = SystemModule.objects.count()

        # === 5. COMPLETITUD DEL SISTEMA ===
        has_identity = active_identity is not None
        has_organization = total_cargos >= 1 and total_roles >= 1
        has_plan = active_plan is not None
        has_config = enabled_modules >= 1

        # Calcular porcentaje (25% por cada sección)
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

            # 2. Objetivos Estratégicos
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
            'values_count': values_count,
            'policy_pending_signature': has_identity and not active_identity.is_signed,

            # Configuración del sistema
            'enabled_modules': enabled_modules,
            'total_modules': total_modules,
        }

        return Response(stats)
