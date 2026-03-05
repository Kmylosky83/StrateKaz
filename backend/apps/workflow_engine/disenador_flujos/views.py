from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from apps.core.base_models.mixins import get_tenant_empresa
from .models import (
    CategoriaFlujo,
    PlantillaFlujo,
    NodoFlujo,
    TransicionFlujo,
    CampoFormulario,
    RolFlujo,
    FormularioDiligenciado,
    RespuestaCampo,
    AsignacionFormulario,
)
from .serializers import (
    CategoriaFlujoSerializer,
    PlantillaFlujoSerializer,
    NodoFlujoSerializer,
    TransicionFlujoSerializer,
    CampoFormularioSerializer,
    RolFlujoSerializer,
    FormularioDiligenciadoListSerializer,
    FormularioDiligenciadoDetailSerializer,
    FormularioDiligenciadoCreateSerializer,
    RespuestaCampoSerializer,
    AsignacionFormularioListSerializer,
    AsignacionFormularioDetailSerializer,
    AsignacionFormularioCreateSerializer,
)


class CategoriaFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activo', 'codigo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        return CategoriaFlujo.objects.select_related('created_by')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)


class PlantillaFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = PlantillaFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['categoria', 'estado', 'version', 'codigo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['nombre', 'version', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return PlantillaFlujo.objects.select_related('categoria', 'created_by', 'activado_por', 'plantilla_origen')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activa una plantilla en estado BORRADOR"""
        plantilla = self.get_object()

        if plantilla.estado != 'BORRADOR':
            return Response(
                {'error': 'Solo se pueden activar plantillas en estado BORRADOR'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que tenga al menos un nodo INICIO y FIN
        tiene_inicio = plantilla.nodos.filter(tipo='INICIO').exists()
        tiene_fin = plantilla.nodos.filter(tipo='FIN').exists()

        if not tiene_inicio or not tiene_fin:
            return Response(
                {'error': 'La plantilla debe tener al menos un nodo INICIO y un nodo FIN'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Marcar versiones anteriores como OBSOLETO
        PlantillaFlujo.objects.filter(
            codigo=plantilla.codigo,
            estado='ACTIVO'
        ).exclude(pk=plantilla.pk).update(
            estado='OBSOLETO',
            fecha_obsolescencia=timezone.now()
        )

        # Activar la plantilla
        plantilla.estado = 'ACTIVO'
        plantilla.fecha_activacion = timezone.now()
        plantilla.activado_por = request.user
        plantilla.save()

        return Response(self.get_serializer(plantilla).data)

    @action(detail=True, methods=['post'], url_path='crear-nueva-version')
    def crear_nueva_version(self, request, pk=None):
        """Crea una nueva versión de la plantilla"""
        plantilla = self.get_object()

        if plantilla.estado not in ['ACTIVO', 'OBSOLETO']:
            return Response(
                {'error': 'Solo se pueden crear versiones de plantillas ACTIVO u OBSOLETO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nueva = plantilla.crear_nueva_version(request.user)
        return Response(self.get_serializer(nueva).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def activas(self, request):
        """Lista plantillas activas"""
        queryset = self.get_queryset().filter(estado='ACTIVO')
        return Response(self.get_serializer(queryset, many=True).data)


class NodoFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = NodoFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plantilla', 'tipo', 'rol_asignado']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['plantilla', 'codigo']

    def get_queryset(self):
        return NodoFlujo.objects.select_related('plantilla', 'rol_asignado', 'created_by')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)


class TransicionFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = TransicionFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plantilla', 'nodo_origen', 'nodo_destino']
    search_fields = ['nombre']
    ordering_fields = ['prioridad', 'nombre']
    ordering = ['plantilla', '-prioridad']

    def get_queryset(self):
        return TransicionFlujo.objects.select_related('plantilla', 'nodo_origen', 'nodo_destino', 'created_by')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)


class CampoFormularioViewSet(viewsets.ModelViewSet):
    serializer_class = CampoFormularioSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['nodo', 'tipo', 'requerido']
    search_fields = ['nombre', 'etiqueta']
    ordering_fields = ['orden', 'nombre']
    ordering = ['nodo', 'orden']

    def get_queryset(self):
        return CampoFormulario.objects.select_related('nodo', 'created_by')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)


class RolFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = RolFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activo', 'tipo_asignacion', 'codigo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']

    def get_queryset(self):
        return RolFlujo.objects.select_related('created_by')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)


# ============================================================================
# VIEWSETS PARA FORMBUILDER
# ============================================================================

class FormularioDiligenciadoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de formularios diligenciados.

    Endpoints:
    - GET /formularios-diligenciados/ - Lista formularios
    - POST /formularios-diligenciados/ - Crear nuevo formulario
    - GET /formularios-diligenciados/{id}/ - Detalle de formulario
    - PUT /formularios-diligenciados/{id}/ - Actualizar formulario
    - DELETE /formularios-diligenciados/{id}/ - Eliminar formulario
    - POST /formularios-diligenciados/{id}/completar/ - Marcar como completado
    - POST /formularios-diligenciados/{id}/guardar_respuesta/ - Guardar respuesta
    """
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plantilla_flujo', 'estado', 'diligenciado_por']
    search_fields = ['numero_formulario', 'titulo']
    ordering_fields = ['fecha_diligenciamiento', 'titulo', 'estado']
    ordering = ['-fecha_diligenciamiento']

    def get_queryset(self):
        return FormularioDiligenciado.objects.select_related(
            'plantilla_flujo',
            'diligenciado_por',
            'created_by'
        ).prefetch_related('respuestas')

    def get_serializer_class(self):
        if self.action == 'list':
            return FormularioDiligenciadoListSerializer
        elif self.action == 'create':
            return FormularioDiligenciadoCreateSerializer
        return FormularioDiligenciadoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            diligenciado_por=self.request.user,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marca el formulario como completado"""
        formulario = self.get_object()

        if formulario.estado != 'EN_PROGRESO':
            return Response(
                {'error': 'Solo se pueden completar formularios en progreso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que todas las firmas requeridas estén capturadas
        campos_pendientes = formulario.campos_pendientes_firma()
        if campos_pendientes.exists():
            return Response(
                {
                    'error': 'Hay campos de firma pendientes',
                    'campos_pendientes': list(campos_pendientes.values_list('id', flat=True))
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar respuestas requeridas
        respuestas_invalidas = []
        for respuesta in formulario.respuestas.all():
            if not respuesta.validar_respuesta():
                respuestas_invalidas.append({
                    'campo_id': respuesta.campo_formulario_id,
                    'error': respuesta.mensaje_validacion
                })

        if respuestas_invalidas:
            return Response(
                {
                    'error': 'Hay respuestas inválidas',
                    'respuestas_invalidas': respuestas_invalidas
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        formulario.estado = 'COMPLETADO'
        formulario.fecha_completado = timezone.now()
        formulario.save()

        # Si tiene asignación asociada, marcarla como completada
        if hasattr(formulario, 'asignacion_origen') and formulario.asignacion_origen:
            formulario.asignacion_origen.completar()

        return Response(FormularioDiligenciadoDetailSerializer(formulario).data)

    @action(detail=True, methods=['post'], url_path='guardar-respuesta')
    def guardar_respuesta(self, request, pk=None):
        """Guarda o actualiza una respuesta de campo"""
        formulario = self.get_object()

        if formulario.estado != 'EN_PROGRESO':
            return Response(
                {'error': 'Solo se pueden modificar formularios en progreso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        campo_id = request.data.get('campo_formulario')
        valor = request.data.get('valor')
        firma_base64 = request.data.get('firma_base64')

        if not campo_id:
            return Response(
                {'error': 'Se requiere campo_formulario'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el campo pertenece a la plantilla
        try:
            campo = CampoFormulario.objects.get(
                id=campo_id,
                nodo__plantilla=formulario.plantilla_flujo
            )
        except CampoFormulario.DoesNotExist:
            return Response(
                {'error': 'Campo no encontrado o no pertenece a esta plantilla'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Crear o actualizar respuesta
        respuesta, created = RespuestaCampo.objects.update_or_create(
            formulario_diligenciado=formulario,
            campo_formulario=campo,
            defaults={
                'valor': valor,
                'firma_base64': firma_base64 if campo.tipo == 'SIGNATURE' else None,
                'modificado_por': request.user,
            }
        )

        # Validar respuesta
        respuesta.validar_respuesta()
        respuesta.save()

        return Response(
            RespuestaCampoSerializer(respuesta).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='mis-formularios')
    def mis_formularios(self, request):
        """Lista formularios diligenciados por el usuario actual"""
        queryset = self.get_queryset().filter(diligenciado_por=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = FormularioDiligenciadoListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = FormularioDiligenciadoListSerializer(queryset, many=True)
        return Response(serializer.data)


class RespuestaCampoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de respuestas de campos.

    Principalmente usado para operaciones de lectura y actualización individual.
    La creación masiva se realiza mediante FormularioDiligenciado.guardar_respuesta
    """
    serializer_class = RespuestaCampoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['formulario_diligenciado', 'campo_formulario', 'es_valido']
    ordering_fields = ['campo_formulario__orden', 'fecha_modificacion']
    ordering = ['campo_formulario__orden']

    def get_queryset(self):
        return RespuestaCampo.objects.select_related(
            'formulario_diligenciado',
            'campo_formulario',
            'modificado_por'
        )

    def perform_create(self, serializer):
        serializer.save(modificado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)


class AsignacionFormularioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de asignaciones de formularios.

    Endpoints:
    - GET /asignaciones-formularios/ - Lista asignaciones
    - POST /asignaciones-formularios/ - Crear asignación
    - GET /asignaciones-formularios/{id}/ - Detalle de asignación
    - PUT /asignaciones-formularios/{id}/ - Actualizar asignación
    - DELETE /asignaciones-formularios/{id}/ - Eliminar asignación
    - POST /asignaciones-formularios/{id}/iniciar/ - Iniciar diligenciamiento
    - POST /asignaciones-formularios/{id}/cancelar/ - Cancelar asignación
    """
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plantilla_flujo', 'estado', 'asignado_a', 'prioridad']
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_asignacion', 'fecha_limite', 'prioridad']
    ordering = ['-fecha_asignacion']

    def get_queryset(self):
        return AsignacionFormulario.objects.select_related(
            'plantilla_flujo',
            'asignado_a',
            'asignado_por',
            'formulario_diligenciado'
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return AsignacionFormularioListSerializer
        elif self.action == 'create':
            return AsignacionFormularioCreateSerializer
        return AsignacionFormularioDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            asignado_por=self.request.user
        )

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Inicia el diligenciamiento de un formulario asignado"""
        asignacion = self.get_object()

        if asignacion.estado not in ['PENDIENTE', 'EN_PROGRESO']:
            return Response(
                {'error': 'Solo se pueden iniciar asignaciones pendientes o en progreso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el usuario actual es el asignado
        if asignacion.asignado_a != request.user:
            return Response(
                {'error': 'Solo el usuario asignado puede iniciar el diligenciamiento'},
                status=status.HTTP_403_FORBIDDEN
            )

        formulario = asignacion.iniciar_diligenciamiento(request.user)

        return Response({
            'asignacion': AsignacionFormularioDetailSerializer(asignacion).data,
            'formulario': FormularioDiligenciadoDetailSerializer(formulario).data
        })

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela una asignación"""
        asignacion = self.get_object()

        if asignacion.estado in ['COMPLETADO', 'CANCELADO']:
            return Response(
                {'error': 'No se puede cancelar una asignación completada o ya cancelada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        asignacion.cancelar()
        return Response(AsignacionFormularioDetailSerializer(asignacion).data)

    @action(detail=False, methods=['get'], url_path='mis-asignaciones')
    def mis_asignaciones(self, request):
        """Lista asignaciones pendientes del usuario actual"""
        queryset = self.get_queryset().filter(
            asignado_a=request.user,
            estado__in=['PENDIENTE', 'EN_PROGRESO']
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = AsignacionFormularioListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = AsignacionFormularioListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Lista asignaciones vencidas"""
        queryset = self.get_queryset().filter(
            estado='PENDIENTE',
            fecha_limite__lt=timezone.now().date()
        )

        # Actualizar estado a VENCIDO
        for asignacion in queryset:
            asignacion.actualizar_estado_vencimiento()

        queryset = self.get_queryset().filter(estado='VENCIDO')
        serializer = AsignacionFormularioListSerializer(queryset, many=True)
        return Response(serializer.data)
