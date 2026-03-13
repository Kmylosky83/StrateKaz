"""
ViewSet para Consultores Externos - Talent Hub
Sistema de Gestión StrateKaz

Lee usuarios vinculados a proveedores tipo CONSULTOR/CONTRATISTA.
Fuente: User (C0) con FK a Proveedor (supply_chain).
No tiene modelos propios — solo viewset de lectura + toggle activo.
"""
from django.apps import apps
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import GranularActionPermission
from .serializers import (
    ConsultorExternoListSerializer,
    ConsultorExternoDetailSerializer,
    ConsultorExternoEstadisticasSerializer,
)

# Tipos de proveedor que se consideran consultores externos
TIPOS_CONSULTOR = ['CONSULTOR', 'CONTRATISTA']


class ConsultorExternoViewSet(viewsets.GenericViewSet):
    """
    ViewSet para gestión de consultores externos.

    Consulta usuarios cuyo proveedor vinculado es tipo CONSULTOR o CONTRATISTA.
    No crea ni elimina — eso se hace desde Supply Chain (crear_acceso).

    Acciones:
    - list: Listado paginado con filtros
    - retrieve: Detalle de un consultor
    - estadisticas: Stats para dashboard
    - toggle-activo: Activar/desactivar usuario
    """
    permission_classes = [GranularActionPermission]
    section_code = 'consultores_externos'

    def get_queryset(self):
        User = apps.get_model('core', 'User')
        return (
            User.objects.filter(
                proveedor__isnull=False,
                proveedor__tipo_proveedor__codigo__in=TIPOS_CONSULTOR,
                proveedor__deleted_at__isnull=True,
            )
            .select_related('cargo', 'proveedor', 'proveedor__tipo_proveedor')
            .order_by('-date_joined')
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConsultorExternoDetailSerializer
        return ConsultorExternoListSerializer

    def _apply_filters(self, queryset):
        """Aplica filtros de query params."""
        params = self.request.query_params

        # Búsqueda por nombre o email
        search = params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(username__icontains=search)
                | Q(proveedor__nombre_comercial__icontains=search)
            )

        # Filtro por tipo (CONSULTOR / CONTRATISTA)
        tipo = params.get('tipo', '').strip()
        if tipo and tipo in TIPOS_CONSULTOR:
            queryset = queryset.filter(
                proveedor__tipo_proveedor__codigo=tipo
            )

        # Filtro por independiente/firma
        es_independiente = params.get('es_independiente', '').strip().lower()
        if es_independiente == 'true':
            queryset = queryset.filter(proveedor__es_independiente=True)
        elif es_independiente == 'false':
            queryset = queryset.filter(proveedor__es_independiente=False)

        # Filtro por estado (activo/inactivo)
        estado = params.get('estado', '').strip().lower()
        if estado == 'activo':
            queryset = queryset.filter(is_active=True)
        elif estado == 'inactivo':
            queryset = queryset.filter(is_active=False)

        # Filtro por cargo
        cargo_id = params.get('cargo', '').strip()
        if cargo_id and cargo_id.isdigit():
            queryset = queryset.filter(cargo_id=int(cargo_id))

        # Filtro por firma (proveedor)
        firma_id = params.get('firma', '').strip()
        if firma_id and firma_id.isdigit():
            queryset = queryset.filter(proveedor_id=int(firma_id))

        # Filtro portal-only vs colocado
        modalidad = params.get('modalidad', '').strip().lower()
        if modalidad == 'portal':
            queryset = queryset.filter(cargo__code='PROVEEDOR_PORTAL')
        elif modalidad == 'colocado':
            queryset = queryset.exclude(cargo__code='PROVEEDOR_PORTAL')

        return queryset

    def list(self, request, *args, **kwargs):
        """Listado paginado de consultores externos."""
        queryset = self._apply_filters(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Detalle de un consultor externo."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='estadisticas')
    def estadisticas(self, request):
        """Estadísticas de consultores externos para StatsGrid."""
        qs = self.get_queryset()
        total = qs.count()
        activos = qs.filter(is_active=True).count()
        data = {
            'total': total,
            'activos': activos,
            'inactivos': total - activos,
            'independientes': qs.filter(proveedor__es_independiente=True).count(),
            'de_firma': qs.filter(proveedor__es_independiente=False).count(),
            'consultores': qs.filter(
                proveedor__tipo_proveedor__codigo='CONSULTOR'
            ).count(),
            'contratistas': qs.filter(
                proveedor__tipo_proveedor__codigo='CONTRATISTA'
            ).count(),
        }
        serializer = ConsultorExternoEstadisticasSerializer(data)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='toggle-activo')
    def toggle_activo(self, request, pk=None):
        """Activar/desactivar un consultor externo."""
        instance = self.get_object()
        instance.is_active = not instance.is_active
        instance.save(update_fields=['is_active'])
        estado = 'activado' if instance.is_active else 'desactivado'
        return Response(
            {'detail': f'Consultor {estado} exitosamente.', 'is_active': instance.is_active},
            status=status.HTTP_200_OK,
        )
