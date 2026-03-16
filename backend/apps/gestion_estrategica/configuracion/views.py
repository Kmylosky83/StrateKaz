"""
Views del módulo Configuración - Dirección Estratégica
Sistema de Gestión StrateKaz

Define viewsets para:
- SedeEmpresa: Gestión de sedes y ubicaciones
- IntegracionExterna: Integraciones con servicios externos
- NormaISO: Normas ISO y sistemas de gestión
- IconRegistry: Registro de iconos
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import SedeEmpresa, IconRegistry, NormaISO, TipoContrato, ICON_CATEGORY_CHOICES
from .serializers import (
    SedeEmpresaSerializer,
    SedeEmpresaListSerializer,
    SedeEmpresaChoicesSerializer,
    IconRegistrySerializer,
    IconRegistryListSerializer,
    IconCategorySerializer,
    NormaISOSerializer,
    NormaISOListSerializer,
    TipoContratoSerializer,
    TipoContratoListSerializer,
)
from apps.core.permissions import GranularActionPermission
from apps.core.mixins import StandardViewSetMixin
from apps.core.base_models.mixins import get_tenant_empresa


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

    @action(detail=True, methods=['post'], url_path='set-principal')
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

    @action(detail=True, methods=['post'], url_path='test-connection')
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

    @action(detail=True, methods=['post'], url_path='toggle-status')
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

    @action(detail=True, methods=['put', 'patch'], permission_classes=[IsAuthenticated, IsSuperAdmin], url_path='update-credentials')
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

    @action(detail=True, methods=['post'], url_path='clear-errors')
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

    @action(detail=False, methods=['get'], url_path='by-category')
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

    @action(detail=False, methods=['post'], url_path='load-system-icons')
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

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'normas_iso'
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

    @action(detail=False, methods=['get'], url_path='by-category')
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
# VIEWSET DE TIPO DE CONTRATO
# ==============================================================================

class TipoContratoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Tipos de Contrato laboral.

    Fundación Tab 4: Mis Políticas y Reglamentos → Contratos Tipo.
    CST Art. 37-47.

    Endpoints:
    - GET /contratos-tipo/ -> Lista tipos de contrato
    - POST /contratos-tipo/ -> Crear tipo de contrato
    - GET /contratos-tipo/{id}/ -> Detalle
    - PUT/PATCH /contratos-tipo/{id}/ -> Actualizar
    - DELETE /contratos-tipo/{id}/ -> Eliminar
    """
    queryset = TipoContrato.objects.all()
    serializer_class = TipoContratoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'is_active', 'requiere_poliza']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'tipo', 'created_at']
    ordering = ['orden', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return TipoContratoListSerializer
        return TipoContratoSerializer


# ==============================================================================
# NOTA: UnidadMedidaViewSet y ConsecutivoConfigViewSet fueron migrados a:
# apps.gestion_estrategica.organizacion.viewsets_unidades
# apps.gestion_estrategica.organizacion.viewsets_consecutivos
# ==============================================================================


# UnidadNegocio ELIMINADO — Unificado con SedeEmpresa (v5.2.0)
