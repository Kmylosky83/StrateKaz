"""
Views del módulo Configuración - Dirección Estratégica
Sistema de Gestión Grasas y Huesos del Norte

Define viewsets para:
- EmpresaConfig: Gestión de datos fiscales de la empresa (Singleton)
- SedeEmpresa: Gestión de sedes y ubicaciones
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import EmpresaConfig, SedeEmpresa
from .serializers import (
    EmpresaConfigSerializer,
    EmpresaConfigChoicesSerializer,
    SedeEmpresaSerializer,
    SedeEmpresaListSerializer,
    SedeEmpresaChoicesSerializer,
)


class EmpresaConfigViewSet(viewsets.ViewSet):
    """
    ViewSet para gestionar la configuración de la empresa (Singleton).

    No es un ModelViewSet tradicional porque:
    - Solo puede existir un registro
    - No hay listado ni eliminación
    - La URL principal retorna la única instancia

    Endpoints:
    - GET /empresa-config/ -> Obtiene la configuración actual
    - PUT /empresa-config/ -> Actualiza la configuración
    - PATCH /empresa-config/ -> Actualización parcial
    - GET /empresa-config/choices/ -> Obtiene opciones para dropdowns
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Obtiene la configuración de la empresa.
        Si no existe, retorna 404 con mensaje indicativo.
        """
        instance = EmpresaConfig.get_instance()

        if not instance:
            return Response(
                {
                    'detail': 'No se ha configurado la información de la empresa.',
                    'configured': False
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = EmpresaConfigSerializer(instance, context={'request': request})
        return Response({
            'configured': True,
            **serializer.data
        })

    def create(self, request):
        """
        Crea la configuración de la empresa.
        Solo permitido si no existe configuración previa.
        """
        existing = EmpresaConfig.get_instance()
        if existing:
            return Response(
                {'detail': 'Ya existe una configuración de empresa. Use PUT para actualizar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EmpresaConfigSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        """
        Actualiza la configuración de la empresa.
        pk se ignora porque es singleton.
        """
        instance = EmpresaConfig.get_instance()

        if not instance:
            return Response(
                {'detail': 'No existe configuración de empresa. Use POST para crear.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = EmpresaConfigSerializer(
            instance,
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """
        Actualización parcial de la configuración.
        pk se ignora porque es singleton.
        """
        instance = EmpresaConfig.get_instance()

        if not instance:
            return Response(
                {'detail': 'No existe configuración de empresa. Use POST para crear.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = EmpresaConfigSerializer(
            instance,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna todas las opciones para los campos con choices.
        Útil para poblar selects/dropdowns en el frontend.

        GET /empresa-config/choices/
        """
        serializer = EmpresaConfigChoicesSerializer({})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def initialize(self, request):
        """
        Inicializa la configuración con valores por defecto si no existe.
        Útil para el setup inicial del sistema.

        POST /empresa-config/initialize/
        """
        instance, created = EmpresaConfig.get_or_create_default()

        if created:
            return Response(
                {
                    'detail': 'Configuración inicializada con valores por defecto.',
                    'created': True,
                    'data': EmpresaConfigSerializer(instance, context={'request': request}).data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                'detail': 'Ya existe una configuración de empresa.',
                'created': False,
                'data': EmpresaConfigSerializer(instance, context={'request': request}).data
            }
        )


# ==============================================================================
# VIEWSET DE SEDE EMPRESA
# ==============================================================================

class SedeEmpresaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar sedes y ubicaciones de la empresa.

    Endpoints:
    - GET /sedes/ -> Lista todas las sedes
    - POST /sedes/ -> Crea una nueva sede
    - GET /sedes/{id}/ -> Obtiene detalle de una sede
    - PUT /sedes/{id}/ -> Actualiza una sede
    - PATCH /sedes/{id}/ -> Actualización parcial
    - DELETE /sedes/{id}/ -> Eliminación lógica (soft delete)
    - GET /sedes/choices/ -> Opciones para dropdowns
    - GET /sedes/principal/ -> Obtiene la sede principal
    - POST /sedes/{id}/restore/ -> Restaura una sede eliminada
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo_sede', 'departamento', 'is_active', 'es_sede_principal']
    search_fields = ['codigo', 'nombre', 'ciudad', 'direccion']
    ordering_fields = ['nombre', 'created_at', 'codigo']
    ordering = ['-es_sede_principal', 'nombre']

    def get_queryset(self):
        """
        Retorna las sedes no eliminadas por defecto.
        Si se pasa ?include_deleted=true, incluye las eliminadas.
        """
        queryset = SedeEmpresa.objects.all()

        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        return queryset.select_related('responsable', 'created_by')

    def get_serializer_class(self):
        """Usa serializer simplificado para listados"""
        if self.action == 'list':
            return SedeEmpresaListSerializer
        return SedeEmpresaSerializer

    def destroy(self, request, *args, **kwargs):
        """
        Implementa soft delete en lugar de eliminación física.
        """
        instance = self.get_object()

        # No permitir eliminar la sede principal
        if instance.es_sede_principal:
            return Response(
                {'detail': 'No se puede eliminar la sede principal. '
                           'Primero asigne otra sede como principal.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna opciones para los campos con choices.

        GET /sedes/choices/
        """
        serializer = SedeEmpresaChoicesSerializer({})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def principal(self, request):
        """
        Retorna la sede principal si existe.

        GET /sedes/principal/
        """
        sede = SedeEmpresa.get_sede_principal()

        if not sede:
            return Response(
                {'detail': 'No hay sede principal configurada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SedeEmpresaSerializer(sede, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restaura una sede eliminada lógicamente.

        POST /sedes/{id}/restore/
        """
        # Buscar incluyendo eliminadas
        try:
            sede = SedeEmpresa.objects.get(pk=pk)
        except SedeEmpresa.DoesNotExist:
            return Response(
                {'detail': 'Sede no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not sede.is_deleted:
            return Response(
                {'detail': 'La sede no está eliminada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sede.restore()
        serializer = SedeEmpresaSerializer(sede, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def set_principal(self, request, pk=None):
        """
        Establece una sede como la sede principal.
        Automáticamente quita el flag de la sede principal anterior.

        POST /sedes/{id}/set_principal/
        """
        sede = self.get_object()

        if not sede.is_active:
            return Response(
                {'detail': 'No se puede establecer como principal una sede inactiva.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Quitar flag de sede principal anterior
        SedeEmpresa.objects.filter(es_sede_principal=True).update(es_sede_principal=False)

        # Establecer nueva sede principal
        sede.es_sede_principal = True
        sede.save(update_fields=['es_sede_principal', 'updated_at'])

        serializer = SedeEmpresaSerializer(sede, context={'request': request})
        return Response(serializer.data)


# ==============================================================================
# VIEWSET DE INTEGRACION EXTERNA
# ==============================================================================

from .models import IntegracionExterna
from .serializers import (
    IntegracionExternaSerializer,
    IntegracionExternaListSerializer,
    IntegracionExternaChoicesSerializer,
    IntegracionExternaCredencialesSerializer,
)
from apps.core.permissions import IsSuperAdmin, RequireCargoLevel
import logging

logger = logging.getLogger(__name__)


class IntegracionExternaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar integraciones con servicios externos.

    Endpoints:
    - GET /integraciones-externas/ -> Lista todas las integraciones
    - POST /integraciones-externas/ -> Crea una nueva integración (SuperAdmin)
    - GET /integraciones-externas/{id}/ -> Obtiene detalle de una integración
    - PUT /integraciones-externas/{id}/ -> Actualiza una integración (SuperAdmin)
    - PATCH /integraciones-externas/{id}/ -> Actualización parcial (SuperAdmin)
    - DELETE /integraciones-externas/{id}/ -> Eliminación lógica (SuperAdmin)

    Acciones personalizadas:
    - GET /integraciones-externas/choices/ -> Opciones para dropdowns
    - POST /integraciones-externas/{id}/test_connection/ -> Prueba conexión
    - POST /integraciones-externas/{id}/toggle_status/ -> Activa/desactiva
    - GET /integraciones-externas/{id}/logs/ -> Últimos logs
    - PUT /integraciones-externas/{id}/update_credentials/ -> Actualiza credenciales (SuperAdmin)
    - POST /integraciones-externas/{id}/restore/ -> Restaura eliminada
    - POST /integraciones-externas/{id}/clear_errors/ -> Limpia errores

    Permisos:
    - Ver: IsAuthenticated + nivel Coordinación o superior
    - Crear/Editar: IsSuperAdmin
    - Ver credenciales completas: IsSuperAdmin
    - Probar conexión: Coordinación o SuperAdmin
    """

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo_servicio', 'proveedor', 'is_active', 'ambiente']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at', 'ultima_conexion_exitosa']
    ordering = ['-is_active', 'nombre']

    def get_permissions(self):
        """
        Permisos específicos por acción.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Solo SuperAdmin puede crear, editar o eliminar
            permission_classes = [IsAuthenticated, IsSuperAdmin]
        elif self.action in ['update_credentials']:
            # Solo SuperAdmin puede ver/editar credenciales completas
            permission_classes = [IsAuthenticated, IsSuperAdmin]
        elif self.action in ['test_connection', 'logs']:
            # Coordinación o superior puede probar conexión y ver logs
            permission_classes = [IsAuthenticated, RequireCargoLevel]
        else:
            # Resto de acciones requiere nivel Coordinación o superior
            permission_classes = [IsAuthenticated, RequireCargoLevel]

        return [permission() for permission in permission_classes]

    # Nivel requerido para RequireCargoLevel
    required_level = 2  # Coordinación

    def get_queryset(self):
        """
        Retorna las integraciones no eliminadas por defecto.
        Si se pasa ?include_deleted=true, incluye las eliminadas.
        """
        queryset = IntegracionExterna.objects.all()

        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        return queryset.select_related('created_by', 'updated_by')

    def get_serializer_class(self):
        """Usa serializer simplificado para listados"""
        if self.action == 'list':
            return IntegracionExternaListSerializer
        elif self.action == 'update_credentials':
            return IntegracionExternaCredencialesSerializer
        return IntegracionExternaSerializer

    def destroy(self, request, *args, **kwargs):
        """
        Implementa soft delete en lugar de eliminación física.
        """
        instance = self.get_object()

        # Soft delete
        instance.soft_delete()

        logger.info(
            f"Integración '{instance.nombre}' eliminada lógicamente por {request.user.username}"
        )

        return Response(
            {'detail': f'Integración "{instance.nombre}" eliminada exitosamente.'},
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna opciones para los campos con choices.

        GET /integraciones-externas/choices/
        """
        serializer = IntegracionExternaChoicesSerializer({})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """
        Prueba la conexión con el servicio externo.

        POST /integraciones-externas/{id}/test_connection/

        IMPORTANTE: Este es un método placeholder.
        La implementación real debe hacerse según el tipo de servicio.
        """
        integracion = self.get_object()

        if not integracion.is_active:
            return Response(
                {'error': 'La integración no está activa.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar credenciales
        is_valid, error_msg = integracion.validar_credenciales()
        if not is_valid:
            return Response(
                {
                    'success': False,
                    'error': f'Credenciales inválidas: {error_msg}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Implementar prueba de conexión real según tipo de servicio
        # Por ahora, simular éxito
        try:
            # Aquí iría la lógica específica de cada tipo de servicio
            # Por ejemplo:
            # if integracion.tipo_servicio == 'EMAIL':
            #     test_email_connection(integracion)
            # elif integracion.tipo_servicio == 'FACTURACION':
            #     test_facturacion_connection(integracion)

            # Registrar éxito
            integracion.registrar_exito()

            logger.info(
                f"Prueba de conexión exitosa para {integracion.nombre} "
                f"por {request.user.username}"
            )

            return Response({
                'success': True,
                'message': 'Conexión exitosa (simulada)',
                'timestamp': integracion.ultima_conexion_exitosa.isoformat(),
            })

        except Exception as e:
            # Registrar error
            integracion.registrar_error(str(e))

            logger.error(
                f"Error en prueba de conexión para {integracion.nombre}: {str(e)}"
            )

            return Response(
                {
                    'success': False,
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Activa o desactiva una integración.

        POST /integraciones-externas/{id}/toggle_status/
        """
        integracion = self.get_object()

        # Toggle estado
        integracion.is_active = not integracion.is_active
        integracion.save(update_fields=['is_active', 'updated_at'], skip_validation=True)

        estado_texto = 'activada' if integracion.is_active else 'desactivada'

        logger.info(
            f"Integración {integracion.nombre} {estado_texto} por {request.user.username}"
        )

        serializer = self.get_serializer(integracion)
        return Response({
            'message': f'Integración {estado_texto} exitosamente.',
            'is_active': integracion.is_active,
            'data': serializer.data
        })

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """
        Retorna los últimos logs/errores de la integración.

        GET /integraciones-externas/{id}/logs/
        """
        integracion = self.get_object()

        return Response({
            'integracion_id': integracion.id,
            'integracion_nombre': integracion.nombre,
            'errores_recientes': integracion.errores_recientes,
            'ultima_conexion_exitosa': integracion.ultima_conexion_exitosa,
            'ultima_falla': integracion.ultima_falla,
            'contador_llamadas': integracion.contador_llamadas,
            'limite_llamadas_dia': integracion.limite_llamadas_dia,
            'porcentaje_uso_limite': integracion.porcentaje_uso_limite,
        })

    @action(detail=True, methods=['put', 'patch'], permission_classes=[IsAuthenticated, IsSuperAdmin])
    def update_credentials(self, request, pk=None):
        """
        Actualiza las credenciales de la integración.

        PUT /integraciones-externas/{id}/update_credentials/

        SEGURIDAD: Solo SuperAdmin puede acceder.

        Body:
        {
            "credenciales": {
                "api_key": "sk_live_xxxxx",
                // ... otros campos según método de autenticación
            }
        }
        """
        integracion = self.get_object()

        serializer = IntegracionExternaCredencialesSerializer(
            integracion,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        logger.warning(
            f"Credenciales actualizadas para {integracion.nombre} por {request.user.username}"
        )

        return Response({
            'message': 'Credenciales actualizadas exitosamente.',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restaura una integración eliminada lógicamente.

        POST /integraciones-externas/{id}/restore/
        """
        # Buscar incluyendo eliminadas
        try:
            integracion = IntegracionExterna.objects.get(pk=pk)
        except IntegracionExterna.DoesNotExist:
            return Response(
                {'detail': 'Integración no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not integracion.is_deleted:
            return Response(
                {'detail': 'La integración no está eliminada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        integracion.restore()

        logger.info(
            f"Integración {integracion.nombre} restaurada por {request.user.username}"
        )

        serializer = self.get_serializer(integracion)
        return Response({
            'message': 'Integración restaurada exitosamente.',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def clear_errors(self, request, pk=None):
        """
        Limpia la lista de errores recientes de la integración.

        POST /integraciones-externas/{id}/clear_errors/
        """
        integracion = self.get_object()

        integracion.limpiar_errores()

        logger.info(
            f"Errores limpiados para {integracion.nombre} por {request.user.username}"
        )

        return Response({
            'message': 'Errores limpiados exitosamente.',
            'errores_recientes': integracion.errores_recientes
        })
