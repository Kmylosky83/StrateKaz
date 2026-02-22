"""
People Analytics - Metricas basicas de talento humano.

Endpoint para coordinacion+ que muestra KPIs de:
- Headcount activo
- Rotacion (ultimos 12 meses)
- Ausentismo
- Antiguedad promedio
- Cumplimiento de formacion
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Avg, Count, Q
from datetime import timedelta
from decimal import Decimal
from apps.core.base_models.mixins import get_tenant_empresa


class PeopleAnalyticsSerializer(serializers.Serializer):
    """Serializer para las metricas de people analytics."""
    headcount_activo = serializers.IntegerField()
    headcount_inactivo = serializers.IntegerField()
    headcount_total = serializers.IntegerField()
    rotacion_12m = serializers.DecimalField(max_digits=5, decimal_places=2)
    retiros_12m = serializers.IntegerField()
    ingresos_12m = serializers.IntegerField()
    antiguedad_promedio_meses = serializers.DecimalField(
        max_digits=6, decimal_places=1, allow_null=True
    )
    genero_distribucion = serializers.DictField(child=serializers.IntegerField())
    por_area = serializers.ListField(child=serializers.DictField())
    cumplimiento_formacion = serializers.DecimalField(
        max_digits=5, decimal_places=2, allow_null=True
    )


class PeopleAnalyticsView(APIView):
    """
    GET: Metricas de People Analytics.
    Requiere autenticacion. Ideal para coordinacion+.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.talent_hub.colaboradores.models import Colaborador

        empresa = get_tenant_empresa(auto_create=False)

        if not empresa:
            return Response(
                {'error': 'No se puede determinar la empresa.'},
                status=status.HTTP_404_NOT_FOUND
            )

        ahora = timezone.now()
        hace_12m = ahora - timedelta(days=365)

        # Colaboradores
        todos = Colaborador.objects.filter(empresa=empresa)
        activos = todos.filter(estado='activo', is_active=True)
        inactivos = todos.filter(
            Q(estado='retirado') | Q(is_active=False)
        )

        headcount_activo = activos.count()
        headcount_inactivo = inactivos.count()
        headcount_total = todos.count()

        # Rotacion (retiros / promedio headcount) * 100
        retiros_12m = todos.filter(
            estado='retirado',
            updated_at__gte=hace_12m,
        ).count()

        ingresos_12m = activos.filter(
            fecha_ingreso__gte=hace_12m.date(),
        ).count()

        promedio_headcount = max(headcount_activo, 1)
        rotacion_12m = Decimal(str((retiros_12m / promedio_headcount) * 100)).quantize(
            Decimal('0.01')
        )

        # Antiguedad promedio
        antiguedad_avg = None
        if headcount_activo > 0:
            fecha_ref = ahora.date()
            total_meses = 0
            for col in activos:
                fi = getattr(col, 'fecha_ingreso', None)
                if fi:
                    delta = (fecha_ref - fi).days / 30.44
                    total_meses += delta
            antiguedad_avg = round(total_meses / headcount_activo, 1)

        # Distribucion por genero
        genero_dist = {}
        for col in activos:
            genero = getattr(col, 'genero', 'no_especificado') or 'no_especificado'
            genero_dist[genero] = genero_dist.get(genero, 0) + 1

        # Por area
        area_counts = (
            activos.values('area__name')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        por_area = [
            {
                'area': item['area__name'] or 'Sin area',
                'total': item['total'],
            }
            for item in area_counts
        ]

        # Cumplimiento formacion
        cumplimiento_formacion = None
        try:
            from apps.talent_hub.formacion_reinduccion.models import EjecucionCapacitacion
            total_ejecuciones = EjecucionCapacitacion.objects.filter(
                colaborador__empresa=empresa,
                is_active=True,
                created_at__gte=hace_12m,
            ).count()
            completadas = EjecucionCapacitacion.objects.filter(
                colaborador__empresa=empresa,
                is_active=True,
                created_at__gte=hace_12m,
                estado='completada',
            ).count()
            if total_ejecuciones > 0:
                cumplimiento_formacion = round(
                    (completadas / total_ejecuciones) * 100, 2
                )
        except Exception:
            pass

        data = {
            'headcount_activo': headcount_activo,
            'headcount_inactivo': headcount_inactivo,
            'headcount_total': headcount_total,
            'rotacion_12m': rotacion_12m,
            'retiros_12m': retiros_12m,
            'ingresos_12m': ingresos_12m,
            'antiguedad_promedio_meses': antiguedad_avg,
            'genero_distribucion': genero_dist,
            'por_area': por_area,
            'cumplimiento_formacion': cumplimiento_formacion,
        }

        return Response(PeopleAnalyticsSerializer(data).data)
