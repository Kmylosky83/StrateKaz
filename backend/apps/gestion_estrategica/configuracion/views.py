"""
Views del módulo Configuración - Dirección Estratégica
Sistema de Gestión StrateKaz

Define viewsets para:
- EmpresaConfig: Gestión de datos fiscales de la empresa (Singleton)
- SedeEmpresa: Gestión de sedes y ubicaciones
- ConsecutivoConfig: Configuración de consecutivos automáticos
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import EmpresaConfig, SedeEmpresa, IconRegistry, NormaISO, ICON_CATEGORY_CHOICES
from .serializers import (
    EmpresaConfigSerializer,
    EmpresaConfigChoicesSerializer,
    SedeEmpresaSerializer,
    SedeEmpresaListSerializer,
    SedeEmpresaChoicesSerializer,
    IconRegistrySerializer,
    IconRegistryListSerializer,
    IconCategorySerializer,
    NormaISOSerializer,
    NormaISOListSerializer,
)
from apps.core.permissions import GranularActionPermission


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

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'empresa'

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

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'sedes'
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
    - Controlado por GranularActionPermission (Sección: 'integraciones')
    """
    
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'integraciones'
    
    granular_action_map = {
        'toggle_status': 'can_edit',
        'test_connection': 'can_edit',
        'update_credentials': 'can_edit',
        'clear_errors': 'can_edit',
        'restore': 'can_delete',
        'logs': 'can_view',
    }

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo_servicio', 'proveedor', 'is_active', 'ambiente']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at', 'ultima_conexion_exitosa']
    ordering = ['-is_active', 'nombre']

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
        MI-001: Prueba la conexión con el servicio externo.

        POST /integraciones-externas/{id}/test_connection/

        Usa ConnectionTesters específicos para cada tipo de servicio.
        Retorna información detallada sobre el resultado de la prueba.
        """
        from .services import get_connection_tester

        integracion = self.get_object()

        if not integracion.is_active:
            return Response(
                {'error': 'La integración no está activa.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar credenciales básicas
        is_valid, error_msg = integracion.validar_credenciales()
        if not is_valid:
            return Response(
                {
                    'success': False,
                    'error': f'Credenciales inválidas: {error_msg}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # MI-001: Obtener el tester apropiado según el tipo de servicio
            tipo_code = integracion.tipo_servicio.code if integracion.tipo_servicio else 'GENERIC'
            tester = get_connection_tester(tipo_code)

            # Ejecutar prueba de conexión real
            result = tester.test(integracion)

            if result.success:
                # Registrar éxito
                integracion.registrar_exito()

                logger.info(
                    f"Prueba de conexión exitosa para {integracion.nombre} "
                    f"por {request.user.username} "
                    f"({result.response_time_ms}ms)"
                )

                return Response({
                    'success': True,
                    'message': result.message,
                    'timestamp': integracion.ultima_conexion_exitosa.isoformat(),
                    'response_time_ms': result.response_time_ms,
                    'details': result.details,
                })
            else:
                # Registrar error
                integracion.registrar_error(result.message, result.error_code)

                logger.warning(
                    f"Prueba de conexión fallida para {integracion.nombre}: "
                    f"{result.message} ({result.error_code})"
                )

                return Response(
                    {
                        'success': False,
                        'error': result.message,
                        'error_code': result.error_code,
                        'response_time_ms': result.response_time_ms,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            # Registrar error inesperado
            integracion.registrar_error(str(e), 'UNEXPECTED_ERROR')

            logger.error(
                f"Error inesperado en prueba de conexión para {integracion.nombre}: {str(e)}"
            )

            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'error_code': 'UNEXPECTED_ERROR'
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


# ==============================================================================
# ICON REGISTRY VIEWSET - SISTEMA DINAMICO DE ICONOS
# ==============================================================================

import logging
logger = logging.getLogger(__name__)


class IconRegistryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar el registro de iconos del sistema.

    Endpoints:
    - GET /icons/ -> Lista todos los iconos activos
    - GET /icons/{id}/ -> Detalle de un icono
    - POST /icons/ -> Crear nuevo icono (admin)
    - PUT/PATCH /icons/{id}/ -> Actualizar icono (admin)
    - DELETE /icons/{id}/ -> Eliminar icono (admin, solo si no es del sistema)
    - GET /icons/categories/ -> Lista categorias con conteo
    - GET /icons/by_category/?category=VALORES -> Filtra por categoria
    - GET /icons/search/?q=corazon -> Busca iconos
    - POST /icons/load_system_icons/ -> Carga iconos del sistema (admin)
    """

    queryset = IconRegistry.objects.filter(
        is_active=True,
        deleted_at__isnull=True
    )
    serializer_class = IconRegistrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'es_sistema']
    search_fields = ['name', 'label', 'keywords']
    ordering_fields = ['orden', 'label', 'category']
    ordering = ['category', 'orden', 'label']

    def get_serializer_class(self):
        if self.action == 'list':
            return IconRegistryListSerializer
        return IconRegistrySerializer

    def destroy(self, request, *args, **kwargs):
        """Solo permite eliminar iconos que no son del sistema"""
        instance = self.get_object()
        if instance.es_sistema:
            return Response(
                {'detail': 'No se pueden eliminar iconos del sistema.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Soft delete
        instance.deleted_at = timezone.now()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Lista todas las categorias de iconos con su conteo.

        GET /icons/categories/
        """
        from django.db.models import Count

        categories_data = []
        for code, name in ICON_CATEGORY_CHOICES:
            count = IconRegistry.objects.filter(
                category=code,
                is_active=True,
                deleted_at__isnull=True
            ).count()
            categories_data.append({
                'code': code,
                'name': name,
                'icon_count': count
            })

        serializer = IconCategorySerializer(categories_data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Obtiene iconos filtrados por categoria.

        GET /icons/by_category/?category=VALORES
        """
        category = request.query_params.get('category', None)
        if not category:
            return Response(
                {'detail': 'El parametro category es requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        icons = IconRegistry.obtener_por_categoria(category)
        serializer = IconRegistryListSerializer(icons, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Busca iconos por nombre, etiqueta o palabras clave.

        GET /icons/search/?q=corazon
        """
        query = request.query_params.get('q', None)
        if not query:
            return Response(
                {'detail': 'El parametro q es requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        icons = IconRegistry.buscar(query)
        serializer = IconRegistryListSerializer(icons, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def load_system_icons(self, request):
        """
        Carga los iconos base del sistema.

        POST /icons/load_system_icons/
        Solo para administradores.
        """
        if not request.user.is_staff:
            return Response(
                {'detail': 'Solo administradores pueden cargar iconos del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            count = IconRegistry.cargar_iconos_sistema()
            logger.info(f"Iconos del sistema cargados por {request.user.username}: {count} nuevos")
            return Response({
                'message': f'Iconos del sistema cargados exitosamente.',
                'icons_created': count,
                'total_icons': IconRegistry.objects.filter(is_active=True).count()
            })
        except Exception as e:
            logger.error(f"Error cargando iconos del sistema: {str(e)}")
            return Response(
                {'detail': f'Error cargando iconos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Import timezone for soft delete
from django.utils import timezone


class NormaISOViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Normas ISO y Sistemas de Gestión.

    Endpoints:
    - GET /normas-iso/ -> Lista todas las normas ISO activas
    - GET /normas-iso/{id}/ -> Detalle de una norma ISO
    - POST /normas-iso/ -> Crear nueva norma ISO (solo custom)
    - PUT/PATCH /normas-iso/{id}/ -> Actualizar norma ISO
    - DELETE /normas-iso/{id}/ -> Eliminar norma ISO (solo custom)
    - GET /normas-iso/choices/ -> Opciones para dropdowns
    - GET /normas-iso/by-category/ -> Normas agrupadas por categoría
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_active', 'es_sistema']
    search_fields = ['code', 'name', 'short_name', 'description']
    ordering_fields = ['orden', 'name', 'code', 'created_at']
    ordering = ['orden', 'name']

    def get_queryset(self):
        """Retorna normas ISO activas (no eliminadas)"""
        return NormaISO.objects.filter(
            deleted_at__isnull=True
        ).order_by('orden', 'name')

    def get_serializer_class(self):
        """Usa serializer reducido para listados"""
        if self.action == 'list':
            return NormaISOListSerializer
        return NormaISOSerializer

    def destroy(self, request, *args, **kwargs):
        """Solo permite eliminar normas custom (no del sistema)"""
        instance = self.get_object()
        if instance.es_sistema:
            return Response(
                {'detail': 'No se pueden eliminar normas del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )
        # Soft delete
        instance.deleted_at = timezone.now()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna opciones para dropdowns de normas ISO.

        GET /normas-iso/choices/

        Returns:
            - normas: Lista de normas para selects
            - categorias: Categorías disponibles (dinámico desde BD)
        """
        normas = self.get_queryset().filter(is_active=True)
        # Obtener categorías únicas de la BD
        categorias_db = normas.exclude(
            category__isnull=True
        ).exclude(
            category=''
        ).values_list('category', flat=True).distinct()

        return Response({
            'normas': [
                {
                    'value': n.id,
                    'label': f"{n.code} - {n.short_name or n.name}",
                    'code': n.code,
                    'name': n.name,
                    'short_name': n.short_name,
                    'icon': n.icon,
                    'color': n.color,
                    'category': n.category,
                }
                for n in normas
            ],
            'categorias': [
                {'value': cat, 'label': cat.replace('_', ' ').title()}
                for cat in categorias_db
            ]
        })

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Retorna normas ISO agrupadas por categoría.

        GET /normas-iso/by-category/
        """
        normas = self.get_queryset().filter(is_active=True)
        result = {}

        # Obtener categorías únicas de la BD
        categorias = normas.exclude(
            category__isnull=True
        ).exclude(
            category=''
        ).values_list('category', flat=True).distinct()

        for cat_code in categorias:
            cat_normas = normas.filter(category=cat_code)
            if cat_normas.exists():
                result[cat_code] = {
                    'name': cat_code.replace('_', ' ').title(),
                    'normas': NormaISOListSerializer(cat_normas, many=True).data
                }

        return Response(result)


# ==============================================================================
# UNIDAD MEDIDA VIEWSET - MC-001: UI Unidades de Medida
# ==============================================================================

from .models_unidades import UnidadMedida, CATEGORIA_UNIDAD_CHOICES
from .serializers_unidades import (
    UnidadMedidaSerializer,
    UnidadMedidaListSerializer,
    ConversionRequestSerializer,
    FormateoRequestSerializer,
)


class UnidadMedidaViewSet(viewsets.ModelViewSet):
    """
    MC-001: ViewSet para gestionar Unidades de Medida.

    Catálogo transversal utilizado por múltiples módulos:
    - SedeEmpresa (capacidad de almacenamiento)
    - Supply Chain (cantidades de productos)
    - Gestión Ambiental (residuos, emisiones)
    - Gestor Documental (tamaños de archivo)

    Endpoints:
    - GET /unidades-medida/ -> Lista todas las unidades activas
    - GET /unidades-medida/{id}/ -> Detalle de una unidad
    - POST /unidades-medida/ -> Crear nueva unidad (solo custom)
    - PUT/PATCH /unidades-medida/{id}/ -> Actualizar unidad
    - DELETE /unidades-medida/{id}/ -> Eliminar unidad (solo custom)
    - GET /unidades-medida/choices/ -> Opciones para dropdowns
    - GET /unidades-medida/by-categoria/ -> Unidades agrupadas por categoría
    - POST /unidades-medida/convertir/ -> Convertir valor entre unidades
    - POST /unidades-medida/formatear/ -> Formatear valor con unidad
    - POST /unidades-medida/cargar-sistema/ -> Cargar unidades del sistema (admin)
    """

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'unidades_medida'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categoria', 'es_sistema', 'is_active']
    search_fields = ['codigo', 'nombre', 'simbolo', 'descripcion']
    ordering_fields = ['categoria', 'orden_display', 'nombre', 'codigo']
    ordering = ['categoria', 'orden_display', 'nombre']

    def get_queryset(self):
        """Retorna unidades no eliminadas por defecto."""
        queryset = UnidadMedida.objects.filter(deleted_at__isnull=True)

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.select_related('unidad_base')

    def get_serializer_class(self):
        """Usa serializer reducido para listados."""
        if self.action == 'list':
            return UnidadMedidaListSerializer
        return UnidadMedidaSerializer

    def destroy(self, request, *args, **kwargs):
        """Solo permite eliminar unidades custom (no del sistema)."""
        instance = self.get_object()

        if instance.es_sistema:
            return Response(
                {'detail': 'No se pueden eliminar unidades del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Soft delete
        instance.deleted_at = timezone.now()
        instance.is_active = False
        instance.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

        logger.info(
            f"Unidad de medida '{instance.codigo}' eliminada por {request.user.username}"
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        """Al crear, asegura que no sea marcada como sistema."""
        serializer.save(es_sistema=False)

    def perform_update(self, serializer):
        """Previene modificar unidades del sistema (excepto campos permitidos)."""
        instance = self.get_object()

        if instance.es_sistema:
            # Solo permitir modificar ciertos campos en unidades del sistema
            allowed_fields = {'orden_display', 'is_active', 'descripcion'}
            data_keys = set(serializer.validated_data.keys())
            disallowed = data_keys - allowed_fields

            if disallowed:
                raise serializers.ValidationError({
                    'detail': f'Las unidades del sistema solo permiten modificar: {", ".join(allowed_fields)}. '
                              f'Campos no permitidos: {", ".join(disallowed)}'
                })

        serializer.save()

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna opciones para dropdowns de unidades de medida.

        GET /unidades-medida/choices/

        Returns:
            - unidades: Lista de unidades para selects
            - categorias: Categorías disponibles
            - unidades_base: Unidades que pueden ser base de conversión
        """
        unidades = self.get_queryset()

        return Response({
            'unidades': [
                {
                    'value': u.id,
                    'label': f"{u.nombre} ({u.simbolo})",
                    'codigo': u.codigo,
                    'simbolo': u.simbolo,
                    'categoria': u.categoria,
                    'es_sistema': u.es_sistema,
                }
                for u in unidades
            ],
            'categorias': [
                {'value': code, 'label': label}
                for code, label in CATEGORIA_UNIDAD_CHOICES
            ],
            'unidades_base': [
                {
                    'value': u.id,
                    'label': f"{u.nombre} ({u.simbolo})",
                    'codigo': u.codigo,
                    'categoria': u.categoria,
                }
                for u in unidades.filter(unidad_base__isnull=True)
            ],
        })

    @action(detail=False, methods=['get'])
    def by_categoria(self, request):
        """
        Retorna unidades agrupadas por categoría.

        GET /unidades-medida/by-categoria/
        """
        unidades = self.get_queryset()
        result = {}

        for cat_code, cat_label in CATEGORIA_UNIDAD_CHOICES:
            cat_unidades = unidades.filter(categoria=cat_code)
            if cat_unidades.exists():
                result[cat_code] = {
                    'label': cat_label,
                    'unidades': UnidadMedidaListSerializer(cat_unidades, many=True).data
                }

        return Response(result)

    @action(detail=False, methods=['post'])
    def convertir(self, request):
        """
        Convierte un valor entre dos unidades compatibles.

        POST /unidades-medida/convertir/

        Body:
        {
            "valor": 1000,
            "unidad_origen": "KG",
            "unidad_destino": "TON"
        }

        Returns:
        {
            "valor_original": 1000,
            "unidad_origen": {"codigo": "KG", "simbolo": "kg"},
            "valor_convertido": 1.0,
            "unidad_destino": {"codigo": "TON", "simbolo": "ton"}
        }
        """
        serializer = ConversionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        unidad_origen = UnidadMedida.obtener_por_codigo(
            serializer.validated_data['unidad_origen']
        )
        unidad_destino = UnidadMedida.obtener_por_codigo(
            serializer.validated_data['unidad_destino']
        )
        valor = serializer.validated_data['valor']

        try:
            valor_convertido = unidad_origen.convertir_a(valor, unidad_destino)

            return Response({
                'valor_original': float(valor),
                'unidad_origen': {
                    'codigo': unidad_origen.codigo,
                    'simbolo': unidad_origen.simbolo,
                    'nombre': unidad_origen.nombre,
                },
                'valor_convertido': float(valor_convertido),
                'unidad_destino': {
                    'codigo': unidad_destino.codigo,
                    'simbolo': unidad_destino.simbolo,
                    'nombre': unidad_destino.nombre,
                },
            })
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def formatear(self, request):
        """
        Formatea un valor con su unidad de medida.

        POST /unidades-medida/formatear/

        Body:
        {
            "valor": 1234.567,
            "unidad": "KG",
            "incluir_simbolo": true
        }

        Returns:
        {
            "valor_original": 1234.567,
            "valor_formateado": "1,234.57 kg",
            "unidad": "KG"
        }
        """
        serializer = FormateoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        unidad = UnidadMedida.obtener_por_codigo(
            serializer.validated_data['unidad']
        )
        valor = serializer.validated_data['valor']
        incluir_simbolo = serializer.validated_data.get('incluir_simbolo', True)

        # Obtener configuración de locale de la empresa
        from .utils_unidades import obtener_locale_config
        locale_config = obtener_locale_config()

        valor_formateado = unidad.formatear(
            valor,
            incluir_simbolo=incluir_simbolo,
            locale_config=locale_config
        )

        return Response({
            'valor_original': float(valor),
            'valor_formateado': valor_formateado,
            'unidad': {
                'codigo': unidad.codigo,
                'simbolo': unidad.simbolo,
                'nombre': unidad.nombre,
            },
        })

    @action(detail=False, methods=['post'])
    def cargar_sistema(self, request):
        """
        Carga las unidades predefinidas del sistema.

        POST /unidades-medida/cargar-sistema/

        Solo para administradores. Idempotente (seguro ejecutar múltiples veces).
        """
        if not request.user.is_staff:
            return Response(
                {'detail': 'Solo administradores pueden cargar unidades del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            count = UnidadMedida.cargar_unidades_sistema()

            logger.info(
                f"Unidades del sistema cargadas por {request.user.username}: {count} nuevas"
            )

            return Response({
                'message': 'Unidades del sistema cargadas exitosamente.',
                'unidades_creadas': count,
                'total_unidades': UnidadMedida.objects.filter(
                    is_active=True,
                    deleted_at__isnull=True
                ).count()
            })
        except Exception as e:
            logger.error(f"Error cargando unidades del sistema: {str(e)}")
            return Response(
                {'detail': f'Error cargando unidades: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restaura una unidad eliminada lógicamente.

        POST /unidades-medida/{id}/restore/
        """
        try:
            unidad = UnidadMedida.objects.get(pk=pk)
        except UnidadMedida.DoesNotExist:
            return Response(
                {'detail': 'Unidad de medida no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if unidad.deleted_at is None:
            return Response(
                {'detail': 'La unidad no está eliminada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        unidad.deleted_at = None
        unidad.is_active = True
        unidad.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

        logger.info(
            f"Unidad de medida '{unidad.codigo}' restaurada por {request.user.username}"
        )

        serializer = self.get_serializer(unidad)
        return Response({
            'message': 'Unidad de medida restaurada exitosamente.',
            'data': serializer.data
        })


# ==============================================================================
# MC-002: CONSECUTIVO CONFIG VIEWSET
# ==============================================================================

from .models_consecutivos import ConsecutivoConfig, CONSECUTIVOS_SISTEMA
from .serializers_consecutivos import (
    ConsecutivoConfigSerializer,
    ConsecutivoConfigListSerializer,
    ConsecutivoConfigChoicesSerializer,
    GenerarConsecutivoSerializer,
    PreviewConsecutivoSerializer,
)


class ConsecutivoConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar configuraciones de consecutivos.

    Los consecutivos permiten numerar automáticamente documentos y registros
    con formatos personalizables (prefijo, año, número, sufijo).

    section_code: 'consecutivos' para permisos RBAC

    Endpoints:
    - GET /consecutivos/ -> Lista todas las configuraciones activas
    - GET /consecutivos/{id}/ -> Detalle de una configuración
    - POST /consecutivos/ -> Crear nueva configuración (solo custom)
    - PUT/PATCH /consecutivos/{id}/ -> Actualizar configuración
    - DELETE /consecutivos/{id}/ -> Eliminar configuración (solo custom)
    - GET /consecutivos/choices/ -> Opciones para dropdowns
    - GET /consecutivos/by-categoria/ -> Consecutivos agrupados por categoría
    - POST /consecutivos/generar/ -> Genera el siguiente consecutivo
    - POST /consecutivos/preview/ -> Previsualiza el formato
    - POST /consecutivos/cargar-sistema/ -> Cargar consecutivos del sistema (admin)
    - POST /consecutivos/{id}/restore/ -> Restaurar consecutivo eliminado
    - POST /consecutivos/{id}/reiniciar/ -> Reiniciar contador a número inicial
    """

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'consecutivos'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categoria', 'es_sistema', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion', 'prefix']
    ordering_fields = ['categoria', 'codigo', 'nombre', 'current_number']
    ordering = ['categoria', 'codigo']

    def get_queryset(self):
        """Retorna consecutivos no eliminados por defecto."""
        queryset = ConsecutivoConfig.objects.filter(deleted_at__isnull=True)

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset

    def get_serializer_class(self):
        """Usa serializer reducido para listados."""
        if self.action == 'list':
            return ConsecutivoConfigListSerializer
        return ConsecutivoConfigSerializer

    def destroy(self, request, *args, **kwargs):
        """Solo permite eliminar consecutivos custom (no del sistema)."""
        instance = self.get_object()

        if instance.es_sistema:
            return Response(
                {'detail': 'No se pueden eliminar consecutivos del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Soft delete
        instance.deleted_at = timezone.now()
        instance.is_active = False
        instance.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

        logger.info(
            f"Consecutivo '{instance.codigo}' eliminado por {request.user.username}"
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        """Al crear, asegura que no sea marcada como sistema."""
        serializer.save(es_sistema=False)

    def perform_update(self, serializer):
        """Previene modificar consecutivos del sistema (excepto campos permitidos)."""
        instance = self.get_object()

        if instance.es_sistema:
            # Solo permitir modificar ciertos campos en consecutivos del sistema
            allowed_fields = {'is_active', 'descripcion'}
            data_keys = set(serializer.validated_data.keys())
            disallowed = data_keys - allowed_fields

            if disallowed:
                raise serializers.ValidationError({
                    'detail': f'Los consecutivos del sistema solo permiten modificar: {", ".join(allowed_fields)}. '
                              f'Campos no permitidos: {", ".join(disallowed)}'
                })

        serializer.save()

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna opciones para dropdowns de consecutivos.

        GET /consecutivos/choices/

        Returns:
            - categorias: Categorías disponibles
            - separadores: Separadores disponibles
            - consecutivos: Lista de consecutivos para selects
        """
        serializer = ConsecutivoConfigChoicesSerializer(instance={})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-categoria')
    def by_categoria(self, request):
        """
        Retorna consecutivos agrupados por categoría.

        GET /consecutivos/by-categoria/
        """
        from collections import defaultdict

        queryset = self.get_queryset()
        grouped = defaultdict(list)

        for config in queryset:
            grouped[config.categoria].append({
                'id': config.id,
                'codigo': config.codigo,
                'nombre': config.nombre,
                'prefix': config.prefix,
                'ejemplo': config.get_ejemplo_formato(),
                'es_sistema': config.es_sistema,
            })

        return Response(grouped)

    @action(detail=False, methods=['post'])
    def generar(self, request):
        """
        Genera el siguiente número de un consecutivo.

        POST /consecutivos/generar/
        Body: {"codigo": "FACTURA"} o {"consecutivo_id": 1}

        Returns:
            - consecutivo: El consecutivo generado
            - numero: El número generado
        """
        serializer = GenerarConsecutivoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        codigo = serializer.validated_data.get('codigo')
        consecutivo_id = serializer.validated_data.get('consecutivo_id')

        try:
            if consecutivo_id:
                config = ConsecutivoConfig.objects.get(pk=consecutivo_id)
            else:
                config = ConsecutivoConfig.objects.get(codigo=codigo)

            consecutivo = config.generate_next()

            logger.info(
                f"Consecutivo '{config.codigo}' generado: {consecutivo} por {request.user.username}"
            )

            return Response({
                'consecutivo': consecutivo,
                'numero': config.current_number,
                'codigo': config.codigo,
            })

        except ConsecutivoConfig.DoesNotExist:
            return Response(
                {'detail': f'No existe configuración para el código "{codigo or consecutivo_id}"'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Previsualiza el formato de un consecutivo sin generarlo.

        POST /consecutivos/preview/
        Body: {
            "prefix": "FAC",
            "separator": "-",
            "padding": 5,
            "numero": 1,
            "include_year": true
        }

        Returns:
            - formato: El formato previsualizado
        """
        serializer = PreviewConsecutivoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        from datetime import date
        today = date.today()

        parts = []

        # Prefijo
        if data['prefix']:
            parts.append(data['prefix'])

        # Componentes de fecha
        if data.get('include_day'):
            parts.append(today.strftime('%Y%m%d'))
        elif data.get('include_month'):
            parts.append(today.strftime('%Y%m'))
        elif data.get('include_year'):
            parts.append(today.strftime('%Y'))

        # Número con padding
        padded_number = str(data['numero']).zfill(data['padding'])
        parts.append(padded_number)

        # Sufijo
        if data.get('suffix'):
            parts.append(data['suffix'])

        separator = data.get('separator', '-')
        formato = separator.join(parts)

        return Response({'formato': formato})

    @action(detail=False, methods=['post'], url_path='cargar-sistema')
    def cargar_sistema(self, request):
        """
        Carga o actualiza los consecutivos predefinidos del sistema.
        Solo disponible para administradores.

        POST /consecutivos/cargar-sistema/
        """
        if not request.user.is_staff:
            return Response(
                {'detail': 'Solo administradores pueden cargar consecutivos del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Obtener empresa_id del usuario o usar 1 por defecto
        empresa_id = getattr(request.user, 'empresa_id', 1)

        created_count = 0
        updated_count = 0

        for config_data in CONSECUTIVOS_SISTEMA:
            config, created = ConsecutivoConfig.objects.update_or_create(
                codigo=config_data['codigo'],
                empresa_id=empresa_id,
                defaults={
                    **config_data,
                    'empresa_id': empresa_id,
                    'created_by': request.user if created else ConsecutivoConfig.objects.filter(
                        codigo=config_data['codigo'],
                        empresa_id=empresa_id
                    ).first().created_by,
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        logger.info(
            f"Consecutivos del sistema cargados por {request.user.username}: "
            f"{created_count} creados, {updated_count} actualizados"
        )

        return Response({
            'message': 'Consecutivos del sistema cargados exitosamente.',
            'creados': created_count,
            'actualizados': updated_count,
            'total': len(CONSECUTIVOS_SISTEMA)
        })

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restaura un consecutivo eliminado (soft delete).

        POST /consecutivos/{id}/restore/
        """
        try:
            config = ConsecutivoConfig.objects.get(pk=pk)
        except ConsecutivoConfig.DoesNotExist:
            return Response(
                {'detail': 'Consecutivo no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if config.deleted_at is None:
            return Response(
                {'detail': 'Este consecutivo no está eliminado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config.deleted_at = None
        config.is_active = True
        config.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

        logger.info(
            f"Consecutivo '{config.codigo}' restaurado por {request.user.username}"
        )

        serializer = self.get_serializer(config)
        return Response({
            'message': 'Consecutivo restaurado exitosamente.',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def reiniciar(self, request, pk=None):
        """
        Reinicia el contador de un consecutivo a su número inicial.
        Operación delicada que requiere confirmación.

        POST /consecutivos/{id}/reiniciar/
        Body: {"confirmar": true}
        """
        config = self.get_object()

        if config.es_sistema:
            # Verificar si el usuario tiene permisos de admin
            if not request.user.is_staff:
                return Response(
                    {'detail': 'Solo administradores pueden reiniciar consecutivos del sistema.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        confirmar = request.data.get('confirmar', False)
        if not confirmar:
            return Response(
                {
                    'detail': 'Debe confirmar la operación.',
                    'warning': f'Esta acción reiniciará el contador de "{config.codigo}" '
                               f'desde {config.current_number} a {config.numero_inicial - 1}. '
                               'El siguiente consecutivo generado será el número inicial.',
                    'current_number': config.current_number,
                    'numero_inicial': config.numero_inicial,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        old_number = config.current_number
        config.current_number = config.numero_inicial - 1
        config.last_reset_date = timezone.now().date()
        config.save(update_fields=['current_number', 'last_reset_date', 'updated_at'])

        logger.warning(
            f"Consecutivo '{config.codigo}' reiniciado por {request.user.username}: "
            f"{old_number} -> {config.current_number}"
        )

        serializer = self.get_serializer(config)
        return Response({
            'message': f'Consecutivo reiniciado exitosamente. Anterior: {old_number}, Nuevo: {config.current_number}',
            'data': serializer.data
        })
