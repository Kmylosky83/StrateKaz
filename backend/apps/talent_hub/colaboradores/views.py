"""
Views para Colaboradores - Talent Hub
Sistema de Gestión StrateKaz

ViewSets CRUD completos para colaboradores, hojas de vida,
información personal e historial laboral.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone

from .models import Colaborador, HojaVida, InfoPersonal, HistorialLaboral
from .serializers import (
    ColaboradorListSerializer,
    ColaboradorDetailSerializer,
    ColaboradorCreateUpdateSerializer,
    ColaboradorCompleteSerializer,
    ColaboradorEstadisticasSerializer,
    HojaVidaSerializer,
    HojaVidaCreateUpdateSerializer,
    InfoPersonalSerializer,
    InfoPersonalPublicSerializer,
    InfoPersonalCreateUpdateSerializer,
    HistorialLaboralSerializer,
    HistorialLaboralCreateSerializer,
)


class ColaboradorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Colaboradores.

    Endpoints:
    - GET /colaboradores/ - Listar colaboradores
    - POST /colaboradores/ - Crear colaborador
    - GET /colaboradores/{id}/ - Detalle
    - PUT /colaboradores/{id}/ - Actualizar
    - DELETE /colaboradores/{id}/ - Eliminar (soft delete)
    - GET /colaboradores/estadisticas/ - Estadísticas
    - GET /colaboradores/activos/ - Solo colaboradores activos
    - GET /colaboradores/por-area/{area_id}/ - Filtrar por área
    - GET /colaboradores/por-cargo/{cargo_id}/ - Filtrar por cargo
    - POST /colaboradores/{id}/retirar/ - Marcar como retirado
    - GET /colaboradores/{id}/completo/ - Obtener perfil completo
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Colaborador.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        # Filtros
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        cargo_id = self.request.query_params.get('cargo')
        if cargo_id:
            queryset = queryset.filter(cargo_id=cargo_id)

        area_id = self.request.query_params.get('area')
        if area_id:
            queryset = queryset.filter(area_id=area_id)

        tipo_contrato = self.request.query_params.get('tipo_contrato')
        if tipo_contrato:
            queryset = queryset.filter(tipo_contrato=tipo_contrato)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(primer_nombre__icontains=search) |
                Q(primer_apellido__icontains=search) |
                Q(numero_identificacion__icontains=search)
            )

        return queryset.select_related('cargo', 'area', 'usuario')

    def get_serializer_class(self):
        if self.action == 'list':
            return ColaboradorListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ColaboradorCreateUpdateSerializer
        elif self.action == 'completo':
            return ColaboradorCompleteSerializer
        return ColaboradorDetailSerializer

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(
            empresa_id=empresa_id,
            created_by=user,
            updated_by=user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Retorna estadísticas de colaboradores"""
        queryset = self.get_queryset()

        # Contar por estado
        por_estado = dict(queryset.values_list('estado').annotate(count=Count('id')))

        # Contar por tipo de contrato
        por_contrato = dict(queryset.values_list('tipo_contrato').annotate(count=Count('id')))

        # Contar por área
        por_area = dict(
            queryset.values_list('area__nombre').annotate(count=Count('id'))
        )

        # Activos
        activos = queryset.filter(estado='activo').count()

        data = {
            'total': queryset.count(),
            'activos': activos,
            'por_estado': por_estado,
            'por_tipo_contrato': por_contrato,
            'por_area': por_area,
        }

        serializer = ColaboradorEstadisticasSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Retorna solo colaboradores activos"""
        queryset = self.get_queryset().filter(estado='activo')
        serializer = ColaboradorListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-area/(?P<area_id>[^/.]+)')
    def por_area(self, request, area_id=None):
        """Retorna colaboradores por área"""
        queryset = self.get_queryset().filter(area_id=area_id)
        serializer = ColaboradorListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-cargo/(?P<cargo_id>[^/.]+)')
    def por_cargo(self, request, cargo_id=None):
        """Retorna colaboradores por cargo"""
        queryset = self.get_queryset().filter(cargo_id=cargo_id)
        serializer = ColaboradorListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def retirar(self, request, pk=None):
        """Marca al colaborador como retirado"""
        colaborador = self.get_object()
        colaborador.estado = 'retirado'
        colaborador.fecha_retiro = request.data.get(
            'fecha_retiro',
            timezone.now().date()
        )
        colaborador.motivo_retiro = request.data.get('motivo_retiro', '')
        colaborador.updated_by = request.user
        colaborador.save()

        # Crear registro en historial
        HistorialLaboral.objects.create(
            empresa_id=colaborador.empresa_id,
            colaborador=colaborador,
            tipo_movimiento='retiro',
            fecha_movimiento=colaborador.fecha_retiro,
            motivo=colaborador.motivo_retiro,
            salario_anterior=colaborador.salario,
            cargo_anterior=colaborador.cargo,
            area_anterior=colaborador.area,
            created_by=request.user,
            updated_by=request.user
        )

        serializer = ColaboradorDetailSerializer(colaborador)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def completo(self, request, pk=None):
        """Retorna el perfil completo del colaborador"""
        colaborador = self.get_object()
        serializer = ColaboradorCompleteSerializer(colaborador)
        return Response(serializer.data)


class HojaVidaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Hojas de Vida.

    Endpoints:
    - GET /hojas-vida/ - Listar hojas de vida
    - POST /hojas-vida/ - Crear hoja de vida
    - GET /hojas-vida/{id}/ - Detalle
    - PUT /hojas-vida/{id}/ - Actualizar
    - DELETE /hojas-vida/{id}/ - Eliminar
    - GET /hojas-vida/por-colaborador/{colaborador_id}/ - Por colaborador
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = HojaVida.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        nivel_estudio = self.request.query_params.get('nivel_estudio')
        if nivel_estudio:
            queryset = queryset.filter(nivel_estudio_maximo=nivel_estudio)

        return queryset.select_related('colaborador')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return HojaVidaCreateUpdateSerializer
        return HojaVidaSerializer

    def perform_create(self, serializer):
        user = self.request.user
        colaborador = serializer.validated_data.get('colaborador')
        serializer.save(
            empresa_id=colaborador.empresa_id,
            created_by=user,
            updated_by=user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-colaborador/(?P<colaborador_id>[^/.]+)')
    def por_colaborador(self, request, colaborador_id=None):
        """Retorna la hoja de vida de un colaborador"""
        try:
            hoja_vida = HojaVida.objects.get(
                colaborador_id=colaborador_id,
                is_active=True
            )
            serializer = HojaVidaSerializer(hoja_vida)
            return Response(serializer.data)
        except HojaVida.DoesNotExist:
            return Response(
                {'detail': 'No existe hoja de vida para este colaborador'},
                status=status.HTTP_404_NOT_FOUND
            )


class InfoPersonalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Información Personal.

    Información sensible - requiere permisos especiales.

    Endpoints:
    - GET /info-personal/ - Listar (solo datos públicos)
    - POST /info-personal/ - Crear
    - GET /info-personal/{id}/ - Detalle
    - PUT /info-personal/{id}/ - Actualizar
    - DELETE /info-personal/{id}/ - Eliminar
    - GET /info-personal/por-colaborador/{colaborador_id}/ - Por colaborador
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = InfoPersonal.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        return queryset.select_related('colaborador')

    def get_serializer_class(self):
        if self.action == 'list':
            return InfoPersonalPublicSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return InfoPersonalCreateUpdateSerializer
        return InfoPersonalSerializer

    def perform_create(self, serializer):
        user = self.request.user
        colaborador = serializer.validated_data.get('colaborador')
        serializer.save(
            empresa_id=colaborador.empresa_id,
            created_by=user,
            updated_by=user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-colaborador/(?P<colaborador_id>[^/.]+)')
    def por_colaborador(self, request, colaborador_id=None):
        """Retorna la información personal de un colaborador"""
        try:
            info_personal = InfoPersonal.objects.get(
                colaborador_id=colaborador_id,
                is_active=True
            )
            serializer = InfoPersonalSerializer(info_personal)
            return Response(serializer.data)
        except InfoPersonal.DoesNotExist:
            return Response(
                {'detail': 'No existe información personal para este colaborador'},
                status=status.HTTP_404_NOT_FOUND
            )


class HistorialLaboralViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Historial Laboral.

    Endpoints:
    - GET /historial-laboral/ - Listar movimientos
    - POST /historial-laboral/ - Registrar movimiento
    - GET /historial-laboral/{id}/ - Detalle
    - PUT /historial-laboral/{id}/ - Actualizar
    - DELETE /historial-laboral/{id}/ - Eliminar
    - GET /historial-laboral/por-colaborador/{colaborador_id}/ - Por colaborador
    - GET /historial-laboral/ascensos/ - Solo ascensos
    - GET /historial-laboral/traslados/ - Solo traslados
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = HistorialLaboral.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        tipo_movimiento = self.request.query_params.get('tipo_movimiento')
        if tipo_movimiento:
            queryset = queryset.filter(tipo_movimiento=tipo_movimiento)

        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_movimiento__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_movimiento__lte=fecha_hasta)

        return queryset.select_related(
            'colaborador',
            'cargo_anterior', 'cargo_nuevo',
            'area_anterior', 'area_nueva',
            'aprobado_por'
        ).order_by('-fecha_movimiento')

    def get_serializer_class(self):
        if self.action == 'create':
            return HistorialLaboralCreateSerializer
        return HistorialLaboralSerializer

    def perform_create(self, serializer):
        user = self.request.user
        colaborador = serializer.validated_data.get('colaborador')
        serializer.save(
            empresa_id=colaborador.empresa_id,
            created_by=user,
            updated_by=user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-colaborador/(?P<colaborador_id>[^/.]+)')
    def por_colaborador(self, request, colaborador_id=None):
        """Retorna el historial laboral de un colaborador"""
        queryset = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = HistorialLaboralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def ascensos(self, request):
        """Retorna solo ascensos"""
        queryset = self.get_queryset().filter(tipo_movimiento='ascenso')
        serializer = HistorialLaboralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def traslados(self, request):
        """Retorna solo traslados"""
        queryset = self.get_queryset().filter(tipo_movimiento='traslado')
        serializer = HistorialLaboralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def cambios_salario(self, request):
        """Retorna solo cambios de salario"""
        queryset = self.get_queryset().filter(tipo_movimiento='cambio_salario')
        serializer = HistorialLaboralSerializer(queryset, many=True)
        return Response(serializer.data)
