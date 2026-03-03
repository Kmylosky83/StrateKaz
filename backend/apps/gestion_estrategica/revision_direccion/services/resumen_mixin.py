"""
Mixin reutilizable para agregar endpoint /resumen/ a cualquier ViewSet.

Uso:
    class MiViewSet(ResumenRevisionMixin, viewsets.ModelViewSet):
        resumen_model = MiModelo
        resumen_date_field = 'created_at'  # campo de fecha para filtrar período

        def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
            # Implementar la lógica de resumen específica del módulo
            return { ... }
"""
from datetime import date, timedelta

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone


class ResumenRevisionMixin:
    """
    Mixin que agrega un endpoint GET /resumen/ para la Revisión por la Dirección.

    El ViewSet que lo use debe implementar:
    - resumen_date_field: str (campo de fecha para filtrar período, default: 'created_at')
    - get_resumen_data(queryset, fecha_desde, fecha_hasta) -> dict

    Query params aceptados:
    - fecha_desde: YYYY-MM-DD (default: 6 meses atrás)
    - fecha_hasta: YYYY-MM-DD (default: hoy)

    Respuesta estándar:
    {
        "disponible": true,
        "modulo": "nombre_modulo",
        "periodo": {
            "fecha_desde": "2025-07-01",
            "fecha_hasta": "2026-01-01"
        },
        "data": { ... }  # específico de cada módulo
    }
    """

    resumen_date_field = 'created_at'
    resumen_modulo_nombre = ''

    @action(detail=False, methods=['get'], url_path='resumen-revision')
    def resumen_revision(self, request):
        """
        GET /resumen-revision/?fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD

        Retorna resumen de datos del módulo para la Revisión por la Dirección.
        """
        # Parsear fechas
        hoy = timezone.now().date()
        fecha_desde_str = request.query_params.get('fecha_desde')
        fecha_hasta_str = request.query_params.get('fecha_hasta')

        try:
            fecha_desde = (
                date.fromisoformat(fecha_desde_str) if fecha_desde_str
                else hoy - timedelta(days=180)
            )
        except (ValueError, TypeError):
            fecha_desde = hoy - timedelta(days=180)

        try:
            fecha_hasta = (
                date.fromisoformat(fecha_hasta_str) if fecha_hasta_str
                else hoy
            )
        except (ValueError, TypeError):
            fecha_hasta = hoy

        # Obtener queryset base (respeta filtros del ViewSet)
        try:
            queryset = self.get_queryset()
        except Exception:
            return Response({
                'disponible': False,
                'modulo': self.resumen_modulo_nombre,
                'periodo': {
                    'fecha_desde': str(fecha_desde),
                    'fecha_hasta': str(fecha_hasta),
                },
                'data': {},
                'error': 'No se pudo acceder a los datos del módulo',
            })

        # Filtrar por período si hay campo de fecha definido
        if self.resumen_date_field:
            date_filter_field = self.resumen_date_field
            # Manejar campos DateTime vs Date
            if hasattr(queryset.model, date_filter_field):
                field = queryset.model._meta.get_field(date_filter_field)
                from django.db.models import DateTimeField, DateField
                if isinstance(field, DateTimeField):
                    filter_key = f'{date_filter_field}__date__range'
                elif isinstance(field, DateField):
                    filter_key = f'{date_filter_field}__range'
                else:
                    filter_key = f'{date_filter_field}__range'
                queryset = queryset.filter(**{filter_key: [fecha_desde, fecha_hasta]})

        # Obtener datos del resumen (implementado por cada ViewSet)
        try:
            data = self.get_resumen_data(queryset, fecha_desde, fecha_hasta)
        except Exception as e:
            return Response({
                'disponible': False,
                'modulo': self.resumen_modulo_nombre,
                'periodo': {
                    'fecha_desde': str(fecha_desde),
                    'fecha_hasta': str(fecha_hasta),
                },
                'data': {},
                'error': str(e),
            })

        return Response({
            'disponible': True,
            'modulo': self.resumen_modulo_nombre,
            'periodo': {
                'fecha_desde': str(fecha_desde),
                'fecha_hasta': str(fecha_hasta),
            },
            'data': data,
        })

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """
        Debe ser implementado por cada ViewSet.
        Retorna un diccionario con los datos de resumen del módulo.
        """
        raise NotImplementedError(
            f'{self.__class__.__name__} debe implementar get_resumen_data()'
        )
