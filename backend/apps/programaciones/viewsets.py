"""
ViewSets del módulo Programaciones - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q

from .models import Programacion
from .serializers import (
    ProgramacionListSerializer,
    ProgramacionDetailSerializer,
    ProgramacionCreateSerializer,
    ProgramacionUpdateSerializer,
    AsignarRecolectorSerializer,
    CambiarEstadoSerializer,
    ReprogramarSerializer,
)
from .permissions import (
    CanManageProgramaciones,
    CanAsignarRecolector,
    CanCambiarEstadoProgramacion,
    CanReprogramar,
)
from .filters import ProgramacionFilter


class ProgramacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para Programaciones

    Permisos por rol:
    - comercial_econorte: CRUD de sus propias programaciones (programado_por=request.user)
    - lider_com_econorte: CRUD de todas las programaciones
    - lider_log_econorte: Ver todas, asignar recolectores, modificar fechas
    - recolector_econorte: Ver solo asignadas, cambiar a EN_RUTA/COMPLETADA/CANCELADA
    - gerente/superadmin: Full access

    Endpoints:
    - GET /api/programaciones/programaciones/ - Lista de programaciones
    - POST /api/programaciones/programaciones/ - Crear programación (Comercial+)
    - GET /api/programaciones/programaciones/{id}/ - Detalle de programación
    - PUT/PATCH /api/programaciones/programaciones/{id}/ - Actualizar programación
    - DELETE /api/programaciones/programaciones/{id}/ - Soft delete (Líder Comercial/Logística+)
    - POST /api/programaciones/programaciones/{id}/asignar-recolector/ - Asignar recolector (Líder Logística+)
    - POST /api/programaciones/programaciones/{id}/cambiar-estado/ - Cambiar estado
    - POST /api/programaciones/programaciones/{id}/reprogramar/ - Reprogramar desde cancelada (Líder Logística+)
    - GET /api/programaciones/programaciones/calendario/ - Vista de calendario
    - GET /api/programaciones/programaciones/estadisticas/ - Estadísticas
    """

    queryset = Programacion.objects.all()
    permission_classes = [IsAuthenticated, CanManageProgramaciones]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProgramacionFilter
    search_fields = [
        'ecoaliado__codigo',
        'ecoaliado__razon_social',
        'observaciones_comercial',
        'observaciones_logistica'
    ]
    ordering_fields = ['fecha_programada', 'created_at', 'cantidad_estimada_kg', 'estado']
    ordering = ['-fecha_programada', '-created_at']

    def get_queryset(self):
        """
        Filtrar programaciones según permisos del usuario
        - comercial_econorte: Solo SUS programaciones
        - lider_com_econorte: Todas las programaciones
        - lider_log_econorte: Todas las programaciones
        - recolector_econorte: Solo las asignadas a él
        - gerente/superadmin: Todas las programaciones
        """
        queryset = super().get_queryset()

        # Excluir eliminadas lógicamente por defecto
        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        # Aplicar filtros por rol
        user = self.request.user

        # SuperAdmin ve todo
        if user.is_superuser:
            return queryset.select_related(
                'ecoaliado',
                'programado_por',
                'recolector_asignado',
                'asignado_por',
                'created_by'
            )

        # Gerente (nivel 3+) ve todo
        if user.has_cargo_level(3):
            return queryset.select_related(
                'ecoaliado',
                'programado_por',
                'recolector_asignado',
                'asignado_por',
                'created_by'
            )

        # Verificar que tenga cargo
        if not user.cargo:
            return queryset.none()

        cargo_code = user.cargo.code

        # Líder Comercial Econorte ve todas las programaciones
        if cargo_code == 'lider_com_econorte':
            return queryset.select_related(
                'ecoaliado',
                'programado_por',
                'recolector_asignado',
                'asignado_por',
                'created_by'
            )

        # Líder Logística Econorte ve todas las programaciones
        if cargo_code == 'lider_log_econorte':
            return queryset.select_related(
                'ecoaliado',
                'programado_por',
                'recolector_asignado',
                'asignado_por',
                'created_by'
            )

        # Comercial Econorte ve SOLO sus programaciones
        if cargo_code == 'comercial_econorte':
            return queryset.filter(
                programado_por=user
            ).select_related(
                'ecoaliado',
                'programado_por',
                'recolector_asignado',
                'asignado_por',
                'created_by'
            )

        # Recolector Econorte ve SOLO las asignadas a él
        if cargo_code == 'recolector_econorte':
            return queryset.filter(
                recolector_asignado=user
            ).select_related(
                'ecoaliado',
                'programado_por',
                'recolector_asignado',
                'asignado_por',
                'created_by'
            )

        # Si no tiene cargo permitido, no ve nada
        return queryset.none()

    def get_serializer_class(self):
        """Retornar serializer según la acción"""
        if self.action == 'list':
            return ProgramacionListSerializer
        elif self.action == 'create':
            return ProgramacionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProgramacionUpdateSerializer
        elif self.action == 'asignar_recolector':
            return AsignarRecolectorSerializer
        elif self.action == 'cambiar_estado':
            return CambiarEstadoSerializer
        elif self.action == 'reprogramar':
            return ReprogramarSerializer
        else:
            return ProgramacionDetailSerializer

    def perform_create(self, serializer):
        """Guardar quién creó la programación"""
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete de programación"""
        instance.soft_delete()

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanAsignarRecolector],
        url_path='asignar-recolector'
    )
    def asignar_recolector(self, request, pk=None):
        """
        Asignar recolector a una programación

        SOLO Líder Logística, Gerente o SuperAdmin pueden ejecutar esta acción

        Body:
        {
            "recolector_asignado": 5,
            "observaciones_logistica": "Recolector asignado por cercanía"
        }
        """
        programacion = self.get_object()

        # Validar que no esté eliminada
        if programacion.is_deleted:
            return Response(
                {'detail': 'No se puede asignar recolector a una programación eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AsignarRecolectorSerializer(
            data=request.data,
            context={
                'programacion': programacion,
                'usuario': request.user
            }
        )
        serializer.is_valid(raise_exception=True)

        # Guardar (asigna recolector y cambia a CONFIRMADA)
        programacion = serializer.save()

        return Response({
            'detail': 'Recolector asignado exitosamente',
            'programacion': ProgramacionDetailSerializer(programacion).data
        })

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanCambiarEstadoProgramacion],
        url_path='cambiar-estado'
    )
    def cambiar_estado(self, request, pk=None):
        """
        Cambiar estado de programación con validaciones por rol

        Body:
        {
            "nuevo_estado": "EN_RUTA",
            "observaciones": "Iniciando ruta",
            "motivo_cancelacion": "Ecoaliado cerrado" (solo si nuevo_estado es CANCELADA)
        }
        """
        programacion = self.get_object()

        # Validar que no esté eliminada
        if programacion.is_deleted:
            return Response(
                {'detail': 'No se puede cambiar el estado de una programación eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CambiarEstadoSerializer(
            data=request.data,
            context={
                'programacion': programacion,
                'usuario': request.user
            }
        )
        serializer.is_valid(raise_exception=True)

        # Guardar (cambia estado con validaciones)
        programacion = serializer.save()

        return Response({
            'detail': f'Estado cambiado a {programacion.get_estado_display()}',
            'programacion': ProgramacionDetailSerializer(programacion).data
        })

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanReprogramar],
        url_path='reprogramar'
    )
    def reprogramar(self, request, pk=None):
        """
        Reprogramar una programacion existente

        SOLO Lider Logistica, Gerente o SuperAdmin pueden ejecutar esta accion

        Body:
        {
            "fecha_reprogramada": "2024-12-01",
            "motivo_reprogramacion": "Solicitud del ecoaliado por cierre temporal",
            "mantener_recolector": true
        }
        """
        programacion = self.get_object()

        # Validar que no este eliminada
        if programacion.is_deleted:
            return Response(
                {'detail': 'No se puede reprogramar una programacion eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReprogramarSerializer(
            data=request.data,
            context={
                'programacion': programacion,
                'usuario': request.user
            }
        )
        serializer.is_valid(raise_exception=True)

        # Guardar cambios
        programacion_actualizada = serializer.save()

        return Response({
            'message': 'Programacion reprogramada exitosamente',
            'programacion': ProgramacionDetailSerializer(programacion_actualizada).data
        }, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=['get'],
        url_path='calendario'
    )
    def calendario(self, request):
        """
        Vista de calendario de programaciones

        Query params:
        - fecha_desde: Fecha inicio (YYYY-MM-DD)
        - fecha_hasta: Fecha fin (YYYY-MM-DD)
        - recolector_asignado: Filtrar por recolector
        - estado: Filtrar por estado
        """
        # Obtener queryset filtrado por permisos
        queryset = self.filter_queryset(self.get_queryset())

        # Aplicar filtros de fecha si se proporcionan
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_programada__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_programada__lte=fecha_hasta)

        # Agrupar por fecha
        programaciones = queryset.order_by('fecha_programada')

        # Serializar
        serializer = ProgramacionListSerializer(programaciones, many=True)

        return Response({
            'total': programaciones.count(),
            'programaciones': serializer.data
        })

    @action(
        detail=False,
        methods=['get'],
        url_path='estadisticas'
    )
    def estadisticas(self, request):
        """
        Obtener estadísticas de programaciones según permisos del usuario
        """
        # Obtener queryset filtrado por permisos
        queryset = self.get_queryset().filter(deleted_at__isnull=True)

        # Estadísticas generales
        total = queryset.count()

        # Por estado
        por_estado = queryset.values('estado').annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')

        # Por tipo de programación
        por_tipo = queryset.values('tipo_programacion').annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')

        # Por recolector
        por_recolector = queryset.filter(
            recolector_asignado__isnull=False
        ).values(
            'recolector_asignado__first_name',
            'recolector_asignado__last_name'
        ).annotate(
            cantidad=Count('id'),
            kg_estimados=Sum('cantidad_estimada_kg')
        ).order_by('-cantidad')

        # Por comercial (programado por)
        por_comercial = queryset.values(
            'programado_por__first_name',
            'programado_por__last_name'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')

        # Por ciudad
        por_ciudad = queryset.values(
            'ecoaliado__ciudad'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')[:10]

        # Estadísticas de cantidad
        stats_cantidad = queryset.aggregate(
            total_kg_estimados=Sum('cantidad_estimada_kg'),
            promedio_kg=Avg('cantidad_estimada_kg'),
        )

        # Programaciones pendientes
        pendientes = queryset.filter(
            estado__in=['PROGRAMADA', 'CONFIRMADA']
        ).count()

        # Programaciones sin recolector
        sin_recolector = queryset.filter(
            recolector_asignado__isnull=True,
            estado='PROGRAMADA'
        ).count()

        # Programaciones vencidas (fecha pasada y no completadas)
        vencidas = queryset.filter(
            fecha_programada__lt=timezone.now().date()
        ).exclude(
            estado__in=['COMPLETADA', 'CANCELADA', 'REPROGRAMADA']
        ).count()

        # Programaciones del día
        hoy = queryset.filter(
            fecha_programada=timezone.now().date()
        ).count()

        # Por estado específico (para frontend)
        asignadas = queryset.filter(estado='ASIGNADA').count()
        en_ruta = queryset.filter(estado='EN_RUTA').count()
        completadas = queryset.filter(estado='COMPLETADA').count()

        return Response({
            # Contadores principales (en root para compatibilidad con frontend)
            'total': total,
            'pendientes': pendientes,
            'asignadas': asignadas,
            'en_ruta': en_ruta,
            'completadas': completadas,
            'sin_recolector': sin_recolector,
            'vencidas': vencidas,
            'hoy': hoy,
            # Detalles agrupados
            'por_estado': list(por_estado),
            'por_tipo': list(por_tipo),
            'por_recolector': list(por_recolector),
            'por_comercial': list(por_comercial),
            'por_ciudad': list(por_ciudad),
            'cantidades': {
                'total_kg_estimados': float(stats_cantidad['total_kg_estimados'] or 0),
                'promedio_kg': round(float(stats_cantidad['promedio_kg'] or 0), 2),
            }
        })

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanManageProgramaciones]
    )
    def restore(self, request, pk=None):
        """Restaurar programación eliminada (solo Líder Comercial/Logística+)"""
        programacion = self.get_object()

        if not programacion.is_deleted:
            return Response(
                {'detail': 'La programación no está eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        programacion.restore()
        serializer = self.get_serializer(programacion)

        return Response({
            'detail': 'Programación restaurada exitosamente',
            'programacion': serializer.data
        })

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated],
        url_path='recolectores-disponibles'
    )
    def recolectores_disponibles(self, request):
        """
        GET /api/programaciones/programaciones/recolectores-disponibles/
        Retorna lista de recolectores activos disponibles para asignar
        Accesible para líderes de logística y gerentes
        """
        from apps.core.models import User

        recolectores = User.objects.filter(
            cargo__code='recolector_econorte',
            is_active=True,
            deleted_at__isnull=True
        ).order_by('first_name', 'last_name')

        data = [{
            'id': recolector.id,
            'nombre_completo': recolector.get_full_name(),
            'username': recolector.username,
            'email': recolector.email,
            'telefono': recolector.phone,
        } for recolector in recolectores]

        return Response({
            'count': len(data),
            'results': data
        }, status=status.HTTP_200_OK)
