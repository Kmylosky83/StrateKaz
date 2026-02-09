"""
ViewSet para Evidencias Centralizadas.

Endpoints:
- /evidencias/ - CRUD de evidencias (multipart upload)
- /evidencias/{id}/aprobar/ - Aprobar evidencia
- /evidencias/{id}/rechazar/ - Rechazar con motivo
- /evidencias/{id}/archivar/ - Archivar
- /evidencias/por_entidad/ - Listar por entidad
- /evidencias/resumen/ - Dashboard stats
- /evidencias/pendientes/ - Lista pendientes
- /evidencias/vencidas/ - Lista vencidas
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.contenttypes.models import ContentType

from .models import Evidencia, HistorialEvidencia
from .serializers import (
    EvidenciaListSerializer,
    EvidenciaDetailSerializer,
    EvidenciaCreateSerializer,
    EvidenciaUpdateSerializer,
    RechazarEvidenciaSerializer,
    HistorialEvidenciaSerializer,
)
from .services import EvidenciaService


class EvidenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Evidencias Centralizadas.

    Soporta multipart/form-data para upload de archivos.
    Filtra automáticamente por empresa_id del usuario autenticado.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'categoria', 'content_type']
    search_fields = ['titulo', 'descripcion', 'nombre_original']
    ordering_fields = ['created_at', 'titulo', 'estado', 'fecha_vigencia']
    ordering = ['-created_at']

    def get_queryset(self):
        empresa_id = getattr(self.request.user, 'empresa_id', None)
        if not empresa_id:
            return Evidencia.objects.none()
        qs = Evidencia.objects.filter(
            empresa_id=empresa_id
        ).select_related('subido_por', 'aprobado_por', 'content_type')

        # Filtro por norma
        norma = self.request.query_params.get('norma')
        if norma:
            qs = qs.filter(normas_relacionadas__contains=[norma])

        # Filtro por tag
        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__contains=[tag])

        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return EvidenciaCreateSerializer
        if self.action in ['update', 'partial_update']:
            return EvidenciaUpdateSerializer
        if self.action == 'retrieve':
            return EvidenciaDetailSerializer
        if self.action == 'rechazar':
            return RechazarEvidenciaSerializer
        return EvidenciaListSerializer

    def create(self, request, *args, **kwargs):
        """
        Crear evidencia via multipart/form-data.

        Body:
            archivo: File (requerido)
            titulo: string
            entity_type: "app_label.model" (ej: "calidad.noconformidad")
            entity_id: int
            categoria: string (opcional)
            descripcion: string (opcional)
            normas_relacionadas: JSON array (opcional)
            tags: JSON array (opcional)
            fecha_vigencia: date (opcional)
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        archivo = data['archivo']

        # Resolver content_type
        app_label, model_name = data['entity_type'].split('.')
        ct = ContentType.objects.get_by_natural_key(app_label, model_name)

        empresa_id = getattr(request.user, 'empresa_id', None)
        if not empresa_id:
            return Response(
                {'error': 'Usuario no tiene empresa asignada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que la entidad existe
        ModelClass = ct.model_class()
        if ModelClass:
            if not ModelClass.objects.filter(pk=data['entity_id']).exists():
                return Response(
                    {'error': f'Entidad {data["entity_type"]}:{data["entity_id"]} no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )

        evidencia = Evidencia.objects.create(
            empresa_id=empresa_id,
            content_type=ct,
            object_id=data['entity_id'],
            archivo=archivo,
            nombre_original=archivo.name,
            mime_type=getattr(archivo, 'content_type', ''),
            tamano_bytes=archivo.size,
            titulo=data['titulo'],
            descripcion=data.get('descripcion', ''),
            categoria=data.get('categoria', 'OTRO'),
            normas_relacionadas=data.get('normas_relacionadas', []),
            tags=data.get('tags', []),
            fecha_vigencia=data.get('fecha_vigencia'),
            subido_por=request.user,
        )

        HistorialEvidencia.objects.create(
            evidencia=evidencia,
            empresa_id=empresa_id,
            accion='CREADA',
            usuario=request.user,
            comentario=f'Evidencia subida: {archivo.name}',
        )

        return Response(
            EvidenciaDetailSerializer(evidencia).data,
            status=status.HTTP_201_CREATED
        )

    # ============ ACCIONES ============

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """POST /evidencias/{id}/aprobar/"""
        evidencia = self.get_object()

        if evidencia.estado != 'PENDIENTE':
            return Response(
                {'error': f'Solo se pueden aprobar evidencias pendientes (actual: {evidencia.estado})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa_id = getattr(request.user, 'empresa_id', None)
        evidencia = EvidenciaService.aprobar_evidencia(
            evidencia_id=evidencia.id,
            usuario=request.user,
            empresa_id=empresa_id,
        )
        return Response(EvidenciaListSerializer(evidencia).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """POST /evidencias/{id}/rechazar/"""
        evidencia = self.get_object()

        if evidencia.estado != 'PENDIENTE':
            return Response(
                {'error': f'Solo se pueden rechazar evidencias pendientes (actual: {evidencia.estado})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RechazarEvidenciaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        empresa_id = getattr(request.user, 'empresa_id', None)
        evidencia = EvidenciaService.rechazar_evidencia(
            evidencia_id=evidencia.id,
            usuario=request.user,
            empresa_id=empresa_id,
            motivo=serializer.validated_data['motivo'],
        )
        return Response(EvidenciaListSerializer(evidencia).data)

    @action(detail=True, methods=['post'])
    def archivar(self, request, pk=None):
        """POST /evidencias/{id}/archivar/"""
        evidencia = self.get_object()

        if evidencia.estado not in ['APROBADA', 'VENCIDA']:
            return Response(
                {'error': 'Solo se pueden archivar evidencias aprobadas o vencidas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa_id = getattr(request.user, 'empresa_id', None)
        evidencia = EvidenciaService.archivar_evidencia(
            evidencia_id=evidencia.id,
            usuario=request.user,
            empresa_id=empresa_id,
        )
        return Response(EvidenciaListSerializer(evidencia).data)

    # ============ CONSULTAS ============

    @action(detail=False, methods=['get'], url_path='por-entidad')
    def por_entidad(self, request):
        """
        GET /evidencias/por-entidad/?entity_type=calidad.noconformidad&entity_id=1

        Lista evidencias vinculadas a una entidad específica.
        """
        entity_type = request.query_params.get('entity_type', '')
        entity_id = request.query_params.get('entity_id', '')

        if not entity_type or not entity_id:
            return Response(
                {'error': 'Se requieren entity_type y entity_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        parts = entity_type.split('.')
        if len(parts) != 2:
            return Response(
                {'error': 'entity_type debe ser app_label.model'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa_id = getattr(request.user, 'empresa_id', None)
        try:
            evidencias = EvidenciaService.obtener_evidencias_por_content_type(
                app_label=parts[0],
                model_name=parts[1],
                object_id=int(entity_id),
                empresa_id=empresa_id,
            )
        except ContentType.DoesNotExist:
            return Response(
                {'error': f'Tipo de entidad no encontrado: {entity_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EvidenciaListSerializer(evidencias, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """
        GET /evidencias/resumen/?norma=ISO_9001

        Dashboard de evidencias: totales por estado y categoría.
        """
        empresa_id = getattr(request.user, 'empresa_id', None)
        norma = request.query_params.get('norma')
        data = EvidenciaService.obtener_resumen(empresa_id, norma=norma)
        return Response(data)

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """GET /evidencias/pendientes/ - Lista evidencias pendientes de aprobación."""
        qs = self.get_queryset().filter(estado='PENDIENTE')
        serializer = EvidenciaListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """GET /evidencias/vencidas/ - Lista evidencias vencidas."""
        qs = self.get_queryset().filter(estado='VENCIDA')
        serializer = EvidenciaListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def historial(self, request, pk=None):
        """GET /evidencias/{id}/historial/ - Historial de cambios."""
        evidencia = self.get_object()
        historial = evidencia.historial.select_related('usuario').all()
        serializer = HistorialEvidenciaSerializer(historial, many=True)
        return Response(serializer.data)
