# -*- coding: utf-8 -*-
"""
Views del modulo Recolecciones - Sistema de Gestion Grasas y Huesos del Norte
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import Recoleccion
from .serializers import (
    RecoleccionListSerializer,
    RecoleccionDetailSerializer,
    RegistrarRecoleccionSerializer,
    VoucherRecoleccionSerializer,
    RecoleccionEstadisticasSerializer,
)


class RecoleccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestion de Recolecciones

    Endpoints:
    - GET    /api/recolecciones/                    - Lista de recolecciones
    - POST   /api/recolecciones/                    - Crear recoleccion (NO usar, usar registrar/)
    - GET    /api/recolecciones/{id}/               - Detalle de recoleccion
    - POST   /api/recolecciones/registrar/          - Registrar recoleccion desde programacion
    - GET    /api/recolecciones/{id}/voucher/       - Obtener datos del voucher
    - GET    /api/recolecciones/estadisticas/       - Estadisticas generales
    - GET    /api/recolecciones/mis-recolecciones/  - Recolecciones del recolector actual
    """

    permission_classes = [IsAuthenticated]
    serializer_class = RecoleccionListSerializer

    def get_queryset(self):
        """
        Filtra recolecciones segun el rol del usuario:
        - Recolector: Solo sus recolecciones
        - Lider Logistico/Comercial: Todas
        - Gerente/SuperAdmin: Todas
        """
        user = self.request.user
        queryset = Recoleccion.objects.select_related(
            'ecoaliado', 'recolector', 'programacion', 'created_by'
        ).filter(deleted_at__isnull=True)

        # Filtrar por rol
        if user.cargo:
            cargo_code = user.cargo.code
            if cargo_code == 'recolector_econorte':
                # Recolector solo ve sus recolecciones
                queryset = queryset.filter(recolector=user)
            elif cargo_code == 'comercial_econorte':
                # Comercial ve recolecciones de sus ecoaliados
                queryset = queryset.filter(ecoaliado__comercial_asignado=user)

        # Aplicar filtros de query params
        queryset = self._aplicar_filtros(queryset)

        return queryset.order_by('-fecha_recoleccion')

    def _aplicar_filtros(self, queryset):
        """Aplica filtros desde query params"""
        params = self.request.query_params

        # Filtro por ecoaliado
        ecoaliado_id = params.get('ecoaliado')
        if ecoaliado_id:
            queryset = queryset.filter(ecoaliado_id=ecoaliado_id)

        # Filtro por recolector
        recolector_id = params.get('recolector')
        if recolector_id:
            queryset = queryset.filter(recolector_id=recolector_id)

        # Filtro por fecha desde
        fecha_desde = params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_recoleccion__date__gte=fecha_desde)

        # Filtro por fecha hasta
        fecha_hasta = params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_recoleccion__date__lte=fecha_hasta)

        # Busqueda general
        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(codigo_voucher__icontains=search) |
                Q(ecoaliado__codigo__icontains=search) |
                Q(ecoaliado__razon_social__icontains=search)
            )

        return queryset

    def get_serializer_class(self):
        """Retorna el serializer apropiado segun la accion"""
        if self.action == 'retrieve':
            return RecoleccionDetailSerializer
        if self.action == 'registrar':
            return RegistrarRecoleccionSerializer
        if self.action == 'voucher':
            return VoucherRecoleccionSerializer
        return RecoleccionListSerializer

    def create(self, request, *args, **kwargs):
        """
        NO usar este endpoint directamente.
        Usar /api/recolecciones/registrar/ en su lugar.
        """
        return Response(
            {'detail': 'Usar POST /api/recolecciones/registrar/ para registrar recolecciones'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['post'])
    def registrar(self, request):
        """
        Registra una nueva recoleccion desde una programacion EN_RUTA

        Payload:
        {
            "programacion_id": 123,
            "cantidad_kg": 450.50,
            "observaciones": "Material en buen estado"
        }

        Response:
        - 201: Recoleccion creada exitosamente + datos del voucher
        - 400: Error de validacion
        - 403: Sin permisos
        """
        serializer = RegistrarRecoleccionSerializer(
            data=request.data,
            context={
                'request': request,
                'usuario': request.user,
            }
        )

        if serializer.is_valid():
            recoleccion = serializer.save()

            # Retornar datos del voucher para impresion inmediata
            voucher_serializer = VoucherRecoleccionSerializer(recoleccion)

            return Response({
                'message': 'Recoleccion registrada exitosamente',
                'recoleccion': RecoleccionDetailSerializer(recoleccion).data,
                'voucher': voucher_serializer.data,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def voucher(self, request, pk=None):
        """
        Obtiene los datos del voucher para impresion

        Response:
        - 200: Datos del voucher
        - 404: Recoleccion no encontrada
        """
        recoleccion = self.get_object()
        serializer = VoucherRecoleccionSerializer(recoleccion)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtiene estadisticas generales de recolecciones

        Query params opcionales:
        - fecha_desde: Fecha inicial (YYYY-MM-DD)
        - fecha_hasta: Fecha final (YYYY-MM-DD)
        - ecoaliado: ID del ecoaliado
        - recolector: ID del recolector

        Response:
        {
            "total_recolecciones": 150,
            "total_kg_recolectados": 75000.50,
            "total_valor_pagado": 112500750.00,
            "promedio_kg_por_recoleccion": 500.00,
            "promedio_valor_por_recoleccion": 750005.00,
            "recolecciones_hoy": 5,
            "recolecciones_semana": 25,
            "recolecciones_mes": 100
        }
        """
        queryset = self.get_queryset()

        # Fechas para estadisticas temporales
        hoy = timezone.now().date()
        inicio_semana = hoy - timedelta(days=hoy.weekday())
        inicio_mes = hoy.replace(day=1)

        # Estadisticas generales
        stats = queryset.aggregate(
            total_recolecciones=Count('id'),
            total_kg_recolectados=Sum('cantidad_kg'),
            total_valor_pagado=Sum('valor_total'),
            promedio_kg_por_recoleccion=Avg('cantidad_kg'),
            promedio_valor_por_recoleccion=Avg('valor_total'),
        )

        # Recolecciones por periodo
        stats['recolecciones_hoy'] = queryset.filter(
            fecha_recoleccion__date=hoy
        ).count()

        stats['recolecciones_semana'] = queryset.filter(
            fecha_recoleccion__date__gte=inicio_semana
        ).count()

        stats['recolecciones_mes'] = queryset.filter(
            fecha_recoleccion__date__gte=inicio_mes
        ).count()

        # Manejar valores nulos
        for key in stats:
            if stats[key] is None:
                stats[key] = Decimal('0') if 'kg' in key or 'valor' in key or 'promedio' in key else 0

        serializer = RecoleccionEstadisticasSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='mis-recolecciones')
    def mis_recolecciones(self, request):
        """
        Obtiene las recolecciones del recolector actual

        Solo disponible para usuarios con cargo recolector_econorte

        Response:
        - 200: Lista de recolecciones del recolector
        - 403: No es recolector
        """
        user = request.user

        if not user.cargo or user.cargo.code != 'recolector_econorte':
            return Response(
                {'detail': 'Este endpoint es solo para recolectores'},
                status=status.HTTP_403_FORBIDDEN
            )

        queryset = Recoleccion.objects.select_related(
            'ecoaliado', 'programacion'
        ).filter(
            recolector=user,
            deleted_at__isnull=True
        ).order_by('-fecha_recoleccion')

        # Paginacion simple
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        offset = (page - 1) * page_size

        total = queryset.count()
        recolecciones = queryset[offset:offset + page_size]

        serializer = RecoleccionListSerializer(recolecciones, many=True)

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data,
        })

    @action(detail=False, methods=['get'], url_path='por-ecoaliado/(?P<ecoaliado_id>[^/.]+)')
    def por_ecoaliado(self, request, ecoaliado_id=None):
        """
        Obtiene recolecciones de un ecoaliado especifico

        Response:
        - 200: Lista de recolecciones del ecoaliado
        """
        queryset = self.get_queryset().filter(ecoaliado_id=ecoaliado_id)

        # Paginacion
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        offset = (page - 1) * page_size

        total = queryset.count()
        recolecciones = queryset[offset:offset + page_size]

        serializer = RecoleccionListSerializer(recolecciones, many=True)

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data,
        })


class ProgramacionesEnRutaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar programaciones EN_RUTA disponibles para registrar recoleccion

    Este endpoint es usado por el recolector para ver que programaciones
    tiene asignadas y listas para completar.
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retorna programaciones EN_RUTA del recolector actual
        """
        from apps.programaciones.models import Programacion

        user = self.request.user
        queryset = Programacion.objects.select_related(
            'ecoaliado', 'recolector_asignado'
        ).filter(
            estado='EN_RUTA',
            deleted_at__isnull=True
        )

        # Si es recolector, solo sus programaciones
        if user.cargo and user.cargo.code == 'recolector_econorte':
            queryset = queryset.filter(recolector_asignado=user)

        return queryset.order_by('fecha_programada')

    def list(self, request, *args, **kwargs):
        """Lista programaciones EN_RUTA disponibles para completar"""
        queryset = self.get_queryset()

        data = []
        for prog in queryset:
            data.append({
                'id': prog.id,
                'codigo': f"PROG-{prog.id:06d}",
                'ecoaliado_id': prog.ecoaliado.id,
                'ecoaliado_codigo': prog.ecoaliado.codigo,
                'ecoaliado_razon_social': prog.ecoaliado.razon_social,
                'ecoaliado_direccion': prog.ecoaliado.direccion,
                'ecoaliado_ciudad': prog.ecoaliado.ciudad,
                'precio_kg': float(prog.ecoaliado.precio_compra_kg) if prog.ecoaliado.precio_compra_kg else 0,
                'fecha_programada': prog.fecha_programada,
                'cantidad_estimada_kg': float(prog.cantidad_estimada_kg) if prog.cantidad_estimada_kg else None,
            })

        return Response({
            'count': len(data),
            'results': data,
        })
