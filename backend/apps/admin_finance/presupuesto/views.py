"""
Views para Presupuesto - Admin Finance
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q, Count, Avg
from decimal import Decimal
from datetime import datetime
from django.utils import timezone

from apps.core.mixins import StandardViewSetMixin
from apps.core.base_models.mixins import get_tenant_empresa
from .models import (
    CentroCosto, Rubro, PresupuestoPorArea,
    Aprobacion, Ejecucion
)
from .serializers import (
    CentroCostoSerializer, CentroCostoListSerializer,
    RubroSerializer, RubroListSerializer,
    PresupuestoPorAreaSerializer, PresupuestoPorAreaListSerializer,
    AprobacionSerializer, AprobacionListSerializer,
    EjecucionSerializer, EjecucionListSerializer
)


class CentroCostoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de centros de costo.

    list: Listar centros de costo
    create: Crear centro de costo
    retrieve: Ver detalle
    update: Actualizar
    partial_update: Actualizar parcialmente
    destroy: Eliminar (soft delete)
    """
    queryset = CentroCosto.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'area']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'created_at']
    ordering = ['codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return CentroCostoListSerializer
        return CentroCostoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('area', 'responsable')
        return queryset


class RubroViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de rubros presupuestales.

    list: Listar rubros
    create: Crear rubro
    retrieve: Ver detalle
    update: Actualizar
    partial_update: Actualizar parcialmente
    destroy: Eliminar (soft delete)
    por_tipo: Listar rubros filtrados por tipo (ingreso/egreso)
    """
    queryset = Rubro.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo', 'categoria']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'tipo', 'created_at']
    ordering = ['tipo', 'codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return RubroListSerializer
        return RubroSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('rubro_padre').prefetch_related('subrubros')
        return queryset

    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        """Listar rubros por tipo (ingreso o egreso)."""
        tipo = request.query_params.get('tipo')

        if not tipo or tipo not in ['ingreso', 'egreso']:
            return Response(
                {'error': 'Debe especificar el tipo: ingreso o egreso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa = get_tenant_empresa()
        rubros = Rubro.objects.filter(
            empresa=empresa,
            tipo=tipo,
            is_active=True
        )

        serializer = RubroListSerializer(rubros, many=True)
        return Response({
            'tipo': tipo,
            'count': rubros.count(),
            'results': serializer.data
        })


class PresupuestoPorAreaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de presupuestos por área.

    list: Listar presupuestos
    create: Crear presupuesto
    retrieve: Ver detalle
    update: Actualizar
    partial_update: Actualizar parcialmente
    destroy: Eliminar (soft delete)
    resumen_ejecucion: Resumen de ejecución por área
    disponible: Presupuesto disponible por rubro
    """
    queryset = PresupuestoPorArea.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'anio', 'area', 'centro_costo', 'rubro']
    search_fields = ['codigo']
    ordering_fields = ['anio', 'monto_asignado', 'monto_ejecutado', 'created_at']
    ordering = ['-anio', 'area']

    def get_serializer_class(self):
        if self.action == 'list':
            return PresupuestoPorAreaListSerializer
        return PresupuestoPorAreaSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('area', 'centro_costo', 'rubro')
        return queryset

    @action(detail=False, methods=['get'])
    def resumen_ejecucion(self, request):
        """
        Resumen de ejecución presupuestal por área.

        Muestra el porcentaje de ejecución para cada área en el año especificado.
        """
        empresa = get_tenant_empresa()
        anio = request.query_params.get('anio', timezone.now().year)

        try:
            anio = int(anio)
        except ValueError:
            return Response(
                {'error': 'El año debe ser un número válido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener presupuestos por área
        presupuestos = PresupuestoPorArea.objects.filter(
            empresa=empresa,
            anio=anio,
            is_active=True
        ).select_related('area', 'centro_costo', 'rubro')

        # Agrupar por área
        resumen_areas = {}

        for presupuesto in presupuestos:
            area_key = presupuesto.area.name if presupuesto.area else presupuesto.centro_costo.nombre

            if area_key not in resumen_areas:
                resumen_areas[area_key] = {
                    'area': area_key,
                    'total_asignado': Decimal('0.00'),
                    'total_ejecutado': Decimal('0.00'),
                    'presupuestos': []
                }

            resumen_areas[area_key]['total_asignado'] += presupuesto.monto_asignado
            resumen_areas[area_key]['total_ejecutado'] += presupuesto.monto_ejecutado
            resumen_areas[area_key]['presupuestos'].append({
                'codigo': presupuesto.codigo,
                'rubro': presupuesto.rubro.nombre,
                'asignado': presupuesto.monto_asignado,
                'ejecutado': presupuesto.monto_ejecutado,
                'porcentaje': float(presupuesto.porcentaje_ejecucion),
                'saldo': presupuesto.saldo_disponible
            })

        # Calcular porcentajes globales
        for area in resumen_areas.values():
            if area['total_asignado'] > 0:
                area['porcentaje_ejecucion'] = float(
                    (area['total_ejecutado'] / area['total_asignado']) * Decimal('100.00')
                )
            else:
                area['porcentaje_ejecucion'] = 0.0

            area['saldo_disponible'] = area['total_asignado'] - area['total_ejecutado']

        return Response({
            'anio': anio,
            'total_areas': len(resumen_areas),
            'resumen': list(resumen_areas.values())
        })

    @action(detail=False, methods=['get'])
    def disponible(self, request):
        """
        Presupuesto disponible por rubro para el año especificado.

        Útil para saber cuánto presupuesto queda disponible antes de aprobar ejecuciones.
        """
        empresa = get_tenant_empresa()
        anio = request.query_params.get('anio', timezone.now().year)
        tipo_rubro = request.query_params.get('tipo')  # ingreso o egreso

        try:
            anio = int(anio)
        except ValueError:
            return Response(
                {'error': 'El año debe ser un número válido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filtros
        filtros = {
            'empresa': empresa,
            'anio': anio,
            'estado__in': ['aprobado', 'vigente'],
            'is_active': True
        }

        if tipo_rubro:
            filtros['rubro__tipo'] = tipo_rubro

        presupuestos = PresupuestoPorArea.objects.filter(
            **filtros
        ).select_related('rubro', 'area', 'centro_costo')

        # Agrupar por rubro
        por_rubro = {}

        for p in presupuestos:
            rubro_key = p.rubro.nombre

            if rubro_key not in por_rubro:
                por_rubro[rubro_key] = {
                    'rubro': rubro_key,
                    'tipo': p.rubro.tipo,
                    'total_asignado': Decimal('0.00'),
                    'total_ejecutado': Decimal('0.00'),
                    'areas': []
                }

            por_rubro[rubro_key]['total_asignado'] += p.monto_asignado
            por_rubro[rubro_key]['total_ejecutado'] += p.monto_ejecutado
            por_rubro[rubro_key]['areas'].append({
                'area': p.area.name if p.area else p.centro_costo.nombre,
                'asignado': float(p.monto_asignado),
                'ejecutado': float(p.monto_ejecutado),
                'disponible': float(p.saldo_disponible)
            })

        # Calcular disponibles
        for rubro in por_rubro.values():
            rubro['saldo_disponible'] = rubro['total_asignado'] - rubro['total_ejecutado']
            rubro['porcentaje_disponible'] = float(
                (rubro['saldo_disponible'] / rubro['total_asignado'] * Decimal('100.00'))
                if rubro['total_asignado'] > 0 else Decimal('0.00')
            )

        return Response({
            'anio': anio,
            'tipo_rubro': tipo_rubro if tipo_rubro else 'todos',
            'total_rubros': len(por_rubro),
            'rubros': list(por_rubro.values())
        })


class AprobacionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de aprobaciones de presupuesto.

    list: Listar aprobaciones
    create: Crear aprobación
    retrieve: Ver detalle
    update: Actualizar
    partial_update: Actualizar parcialmente
    destroy: Eliminar (soft delete)
    aprobar: Aprobar presupuesto
    rechazar: Rechazar presupuesto
    pendientes: Listar aprobaciones pendientes del usuario
    """
    queryset = Aprobacion.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'nivel_aprobacion', 'presupuesto']
    search_fields = ['presupuesto__codigo']
    ordering_fields = ['orden', 'fecha_aprobacion', 'created_at']
    ordering = ['presupuesto', 'orden']

    def get_serializer_class(self):
        if self.action == 'list':
            return AprobacionListSerializer
        return AprobacionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('presupuesto', 'aprobado_por')
        return queryset

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """
        Aprobar un presupuesto.

        Cambia el estado de la aprobación a 'aprobado' y actualiza el presupuesto
        si todas las aprobaciones están completas.
        """
        aprobacion = self.get_object()

        if aprobacion.estado != 'pendiente':
            return Response(
                {'error': f'Esta aprobación ya fue procesada. Estado: {aprobacion.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Aprobar
        aprobacion.aprobar(request.user)

        serializer = self.get_serializer(aprobacion)
        return Response({
            'message': 'Presupuesto aprobado exitosamente',
            'aprobacion': serializer.data
        })

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """
        Rechazar un presupuesto.

        Requiere observaciones explicando el motivo del rechazo.
        """
        aprobacion = self.get_object()

        if aprobacion.estado != 'pendiente':
            return Response(
                {'error': f'Esta aprobación ya fue procesada. Estado: {aprobacion.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = request.data.get('observaciones', '')

        if not observaciones:
            return Response(
                {'error': 'Debe proporcionar observaciones para rechazar el presupuesto'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Rechazar
        aprobacion.rechazar(request.user, observaciones)

        serializer = self.get_serializer(aprobacion)
        return Response({
            'message': 'Presupuesto rechazado',
            'aprobacion': serializer.data
        })

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Listar aprobaciones pendientes asignadas al usuario actual."""
        empresa = get_tenant_empresa()

        # Aquí se podría filtrar por rol o asignación específica
        # Por ahora, mostramos todas las pendientes de la empresa
        pendientes = Aprobacion.objects.filter(
            empresa=empresa,
            estado='pendiente',
            is_active=True
        ).select_related('presupuesto', 'presupuesto__area', 'presupuesto__rubro')

        serializer = AprobacionListSerializer(pendientes, many=True)
        return Response({
            'count': pendientes.count(),
            'results': serializer.data
        })


class EjecucionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de ejecución presupuestal.

    list: Listar ejecuciones
    create: Registrar ejecución
    retrieve: Ver detalle
    update: Actualizar
    partial_update: Actualizar parcialmente
    destroy: Eliminar (soft delete)
    anular: Anular ejecución y revertir monto
    """
    queryset = Ejecucion.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'presupuesto']
    search_fields = ['codigo', 'concepto', 'numero_documento']
    ordering_fields = ['fecha', 'monto', 'created_at']
    ordering = ['-fecha', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return EjecucionListSerializer
        return EjecucionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related(
            'presupuesto',
            'presupuesto__area',
            'presupuesto__centro_costo',
            'presupuesto__rubro'
        )
        return queryset

    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        """
        Anular una ejecución presupuestal.

        Revierte el monto ejecutado del presupuesto y marca la ejecución como anulada.
        """
        ejecucion = self.get_object()

        if ejecucion.estado == 'anulado':
            return Response(
                {'error': 'Esta ejecución ya está anulada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Anular
        ejecucion.anular()

        serializer = self.get_serializer(ejecucion)
        return Response({
            'message': 'Ejecución anulada exitosamente',
            'ejecucion': serializer.data
        })
