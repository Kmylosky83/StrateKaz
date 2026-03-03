"""
ViewSets para Gestión de Proveedores - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: ViewSets usan modelos de catálogo dinámicos.
"""
import logging
import uuid
from datetime import timedelta

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q, Avg, Sum, Count
from django.utils import timezone
from django.conf import settings

from .models import (
    # Catálogos dinámicos
    CategoriaMateriaPrima,
    TipoMateriaPrima,
    TipoProveedor,
    ModalidadLogistica,
    FormaPago,
    TipoCuentaBancaria,
    TipoDocumentoIdentidad,
    Departamento,
    Ciudad,
    # Modelos principales
    UnidadNegocio,
    Proveedor,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
    CondicionComercialProveedor,
    PruebaAcidez,
    # Evaluación
    CriterioEvaluacion,
    EvaluacionProveedor,
    DetalleEvaluacion,
)
from .serializers import (
    # Catálogos
    CategoriaMateriaPrimaSerializer,
    TipoMateriaPrimaSerializer,
    TipoMateriaPrimaListSerializer,
    TipoProveedorSerializer,
    ModalidadLogisticaSerializer,
    FormaPagoSerializer,
    TipoCuentaBancariaSerializer,
    TipoDocumentoIdentidadSerializer,
    DepartamentoSerializer,
    CiudadSerializer,
    # Unidad de Negocio
    UnidadNegocioSerializer,
    # Proveedor
    ProveedorListSerializer,
    ProveedorDetailSerializer,
    ProveedorCreateSerializer,
    ProveedorUpdateSerializer,
    PrecioMateriaPrimaSerializer,
    CambiarPrecioSerializer,
    CrearAccesoProveedorSerializer,
    # Historial y Condiciones
    HistorialPrecioSerializer,
    CondicionComercialSerializer,
    # Prueba de Acidez
    PruebaAcidezListSerializer,
    PruebaAcidezDetailSerializer,
    PruebaAcidezCreateSerializer,
    SimularPruebaAcidezSerializer,
    # Evaluación
    CriterioEvaluacionSerializer,
    EvaluacionProveedorSerializer,
    DetalleEvaluacionSerializer,
)

from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin

logger = logging.getLogger(__name__)
User = get_user_model()
from .permissions import (
    CanManageProveedores,
    CanModifyPrecioProveedor,
    CanManageUnidadesNegocio,
    CanManageCondicionesComerciales,
    CanManageCatalogos,
)
from .filters import ProveedorFilter


# ==============================================================================
# VIEWSETS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class CatalogoBaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet base para catálogos dinámicos.
    Proporciona funcionalidad CRUD estándar con filtros comunes.
    """
    permission_classes = [IsAuthenticated, CanManageCatalogos]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        """Filtrar por estado activo si se solicita."""
        queryset = super().get_queryset()

        # Filtrar solo activos si se solicita
        solo_activos = self.request.query_params.get('solo_activos', 'false')
        if solo_activos.lower() == 'true':
            queryset = queryset.filter(is_active=True)

        return queryset


class CategoriaMateriaPrimaViewSet(CatalogoBaseViewSet):
    """
    ViewSet para Categorías de Materia Prima (dinámico).

    Endpoints:
    - GET /api/supply-chain/categorias-materia-prima/
    - POST /api/supply-chain/categorias-materia-prima/
    - GET /api/supply-chain/categorias-materia-prima/{id}/
    - PUT/PATCH /api/supply-chain/categorias-materia-prima/{id}/
    - DELETE /api/supply-chain/categorias-materia-prima/{id}/
    - GET /api/supply-chain/categorias-materia-prima/{id}/tipos/ - Tipos de esta categoría
    """

    queryset = CategoriaMateriaPrima.objects.all()
    serializer_class = CategoriaMateriaPrimaSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre', 'codigo']

    @action(detail=True, methods=['get'])
    def tipos(self, request, pk=None):
        """Listar tipos de materia prima de esta categoría."""
        categoria = self.get_object()
        tipos = categoria.tipos.filter(is_active=True).order_by('orden', 'nombre')
        serializer = TipoMateriaPrimaListSerializer(tipos, many=True)
        return Response({
            'categoria': categoria.nombre,
            'tipos': serializer.data
        })


class TipoMateriaPrimaViewSet(CatalogoBaseViewSet):
    """
    ViewSet para Tipos de Materia Prima (dinámico).

    Endpoints:
    - GET /api/supply-chain/tipos-materia-prima/
    - POST /api/supply-chain/tipos-materia-prima/
    - GET /api/supply-chain/tipos-materia-prima/{id}/
    - PUT/PATCH /api/supply-chain/tipos-materia-prima/{id}/
    - DELETE /api/supply-chain/tipos-materia-prima/{id}/
    - GET /api/supply-chain/tipos-materia-prima/por-acidez/?valor=X - Buscar por acidez
    """

    queryset = TipoMateriaPrima.objects.all()
    serializer_class = TipoMateriaPrimaSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['categoria', 'is_active']
    ordering_fields = ['orden', 'nombre', 'categoria__orden']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('categoria')

    @action(detail=False, methods=['get'], url_path='por-acidez')
    def por_acidez(self, request):
        """
        Obtener tipo de materia prima por valor de acidez.
        Útil para determinar la calidad de sebo procesado.

        GET /api/supply-chain/tipos-materia-prima/por-acidez/?valor=4.5
        """
        valor = request.query_params.get('valor')

        if not valor:
            return Response(
                {'detail': 'Debe proporcionar el parámetro "valor"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            valor_acidez = float(valor)
        except ValueError:
            return Response(
                {'detail': 'El valor de acidez debe ser un número'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tipo = TipoMateriaPrima.obtener_por_acidez(valor_acidez)

        if tipo:
            serializer = TipoMateriaPrimaSerializer(tipo)
            return Response({
                'valor_acidez': valor_acidez,
                'tipo_materia': serializer.data,
                'encontrado': True
            })
        else:
            return Response({
                'valor_acidez': valor_acidez,
                'tipo_materia': None,
                'encontrado': False,
                'mensaje': 'No se encontró tipo de materia prima para este valor de acidez'
            })


class TipoProveedorViewSet(CatalogoBaseViewSet):
    """
    ViewSet para Tipos de Proveedor (dinámico).

    Endpoints:
    - GET /api/supply-chain/tipos-proveedor/
    - POST /api/supply-chain/tipos-proveedor/
    - GET /api/supply-chain/tipos-proveedor/{id}/
    - PUT/PATCH /api/supply-chain/tipos-proveedor/{id}/
    - DELETE /api/supply-chain/tipos-proveedor/{id}/
    """

    queryset = TipoProveedor.objects.all()
    serializer_class = TipoProveedorSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active', 'requiere_materia_prima', 'requiere_modalidad_logistica']
    ordering_fields = ['orden', 'nombre', 'codigo']


class ModalidadLogisticaViewSet(CatalogoBaseViewSet):
    """ViewSet para Modalidades Logísticas (dinámico)."""

    queryset = ModalidadLogistica.objects.all()
    serializer_class = ModalidadLogisticaSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre']


class FormaPagoViewSet(CatalogoBaseViewSet):
    """ViewSet para Formas de Pago (dinámico)."""

    queryset = FormaPago.objects.all()
    serializer_class = FormaPagoSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre']


class TipoCuentaBancariaViewSet(CatalogoBaseViewSet):
    """ViewSet para Tipos de Cuenta Bancaria (dinámico)."""

    queryset = TipoCuentaBancaria.objects.all()
    serializer_class = TipoCuentaBancariaSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre']


class TipoDocumentoIdentidadViewSet(CatalogoBaseViewSet):
    """ViewSet para Tipos de Documento de Identidad (dinámico)."""

    queryset = TipoDocumentoIdentidad.objects.all()
    serializer_class = TipoDocumentoIdentidadSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre']


class DepartamentoViewSet(CatalogoBaseViewSet):
    """
    ViewSet para Departamentos de Colombia (dinámico).

    Endpoints adicionales:
    - GET /api/supply-chain/departamentos/{id}/ciudades/ - Ciudades del departamento
    """

    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    search_fields = ['codigo', 'nombre', 'codigo_dane']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre']

    @action(detail=True, methods=['get'])
    def ciudades(self, request, pk=None):
        """Listar ciudades de este departamento."""
        departamento = self.get_object()
        ciudades = departamento.ciudades.filter(is_active=True).order_by('nombre')
        serializer = CiudadSerializer(ciudades, many=True)
        return Response({
            'departamento': departamento.nombre,
            'ciudades': serializer.data
        })


class CiudadViewSet(CatalogoBaseViewSet):
    """
    ViewSet para Ciudades de Colombia (dinámico).

    Endpoints adicionales:
    - GET /api/supply-chain/ciudades/autocomplete/?q=&departamento_id=
    """

    queryset = Ciudad.objects.all()
    serializer_class = CiudadSerializer
    search_fields = ['codigo', 'nombre', 'codigo_dane']
    filterset_fields = ['departamento', 'is_active', 'es_capital']
    ordering_fields = ['nombre', 'departamento__nombre']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('departamento')

    @action(detail=False, methods=['get'])
    def autocomplete(self, request):
        """
        ME-002: Endpoint de autocompletado para ciudades.

        GET /api/supply-chain/ciudades/autocomplete/

        Query params:
        - q: Texto de búsqueda (mínimo 2 caracteres)
        - departamento_id: Filtrar por departamento (opcional)
        - limit: Límite de resultados (default 10, max 50)

        Retorna lista de ciudades con departamento para select/combobox.
        """
        query = request.query_params.get('q', '').strip()
        departamento_id = request.query_params.get('departamento_id')
        limit = min(int(request.query_params.get('limit', 10)), 50)

        # Base queryset: solo activas
        queryset = Ciudad.objects.filter(is_active=True).select_related('departamento')

        # Filtrar por departamento si se especifica
        if departamento_id:
            queryset = queryset.filter(departamento_id=departamento_id)

        # Búsqueda por texto (mínimo 2 caracteres)
        if len(query) >= 2:
            queryset = queryset.filter(
                Q(nombre__icontains=query) |
                Q(codigo__icontains=query) |
                Q(codigo_dane__icontains=query)
            )

        # Ordenar: capitales primero, luego alfabético
        queryset = queryset.order_by('-es_capital', 'nombre')[:limit]

        # Formato optimizado para autocompletado
        results = [
            {
                'id': ciudad.id,
                'nombre': ciudad.nombre,
                'departamento_id': ciudad.departamento_id,
                'departamento_nombre': ciudad.departamento.nombre,
                'es_capital': ciudad.es_capital,
                'label': f"{ciudad.nombre}, {ciudad.departamento.nombre}"
            }
            for ciudad in queryset
        ]

        return Response({
            'results': results,
            'count': len(results),
            'query': query,
            'departamento_id': departamento_id
        })


# ==============================================================================
# VIEWSET DE UNIDAD DE NEGOCIO
# ==============================================================================

class UnidadNegocioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Unidades de Negocio.

    Endpoints:
    - GET /api/supply-chain/unidades-negocio/ - Lista de unidades
    - POST /api/supply-chain/unidades-negocio/ - Crear unidad (Admin+)
    - GET /api/supply-chain/unidades-negocio/{id}/ - Detalle
    - PUT/PATCH /api/supply-chain/unidades-negocio/{id}/ - Actualizar (Admin+)
    - DELETE /api/supply-chain/unidades-negocio/{id}/ - Soft delete (Admin+)
    - POST /api/supply-chain/unidades-negocio/{id}/restore/ - Restaurar
    """

    queryset = UnidadNegocio.objects.all()
    serializer_class = UnidadNegocioSerializer
    permission_classes = [IsAuthenticated, CanManageUnidadesNegocio]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_unidad', 'is_active', 'responsable', 'departamento']
    search_fields = ['codigo', 'nombre', 'ciudad']
    ordering_fields = ['codigo', 'nombre', 'created_at']
    ordering = ['codigo']

    def get_queryset(self):
        """Excluir unidades eliminadas por defecto."""
        queryset = super().get_queryset()

        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        return queryset.select_related('responsable', 'departamento')

    def perform_destroy(self, instance):
        """Soft delete de unidad de negocio."""
        instance.soft_delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanManageUnidadesNegocio])
    def restore(self, request, pk=None):
        """Restaurar unidad de negocio eliminada."""
        unidad = self.get_object()

        if not unidad.is_deleted:
            return Response(
                {'detail': 'La unidad de negocio no está eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        unidad.restore()
        serializer = self.get_serializer(unidad)
        return Response(serializer.data)


# ==============================================================================
# VIEWSET DE PROVEEDOR
# ==============================================================================

class ProveedorViewSet(ResumenRevisionMixin, viewsets.ModelViewSet):
    """
    ViewSet completo para Proveedores (100% dinámico).

    Endpoints:
    - GET /api/supply-chain/proveedores/ - Lista de proveedores
    - POST /api/supply-chain/proveedores/ - Crear proveedor (Líder Comercial+)
    - GET /api/supply-chain/proveedores/{id}/ - Detalle de proveedor
    - PUT/PATCH /api/supply-chain/proveedores/{id}/ - Actualizar proveedor
    - DELETE /api/supply-chain/proveedores/{id}/ - Soft delete (Admin+)
    - POST /api/supply-chain/proveedores/{id}/cambiar-precio/ - Cambiar precio (SOLO Gerente)
    - GET /api/supply-chain/proveedores/{id}/historial-precio/ - Ver historial de precios
    - POST /api/supply-chain/proveedores/{id}/restore/ - Restaurar eliminado
    - GET/POST /api/supply-chain/proveedores/{id}/condiciones-comerciales/ - Condiciones
    """

    queryset = Proveedor.objects.all()
    permission_classes = [IsAuthenticated, CanManageProveedores]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProveedorFilter
    search_fields = ['nombre_comercial', 'razon_social', 'numero_documento', 'nit', 'codigo_interno']
    ordering_fields = ['nombre_comercial', 'created_at', 'codigo_interno']
    ordering = ['nombre_comercial']

    # ResumenRevisionMixin config
    resumen_date_field = 'created_at'
    resumen_modulo_nombre = 'gestion_proveedores'

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """Resumen de proveedores para Revisión por la Dirección."""
        # Total de proveedores activos
        todos = Proveedor.objects.filter(is_active=True, deleted_at__isnull=True)
        total_activos = todos.count()

        # Nuevos en período
        nuevos_periodo = queryset.count()

        # Evaluaciones en período
        evaluaciones = EvaluacionProveedor.objects.filter(
            fecha_evaluacion__range=[fecha_desde, fecha_hasta]
        )
        total_evaluaciones = evaluaciones.count()
        evaluaciones_completadas = evaluaciones.filter(estado='COMPLETADA').count()
        calificacion_promedio = evaluaciones.filter(
            calificacion_total__isnull=False
        ).aggregate(promedio=Avg('calificacion_total'))['promedio']

        # Proveedores por tipo
        por_tipo = list(
            todos.values('tipo_proveedor__nombre')
            .annotate(cantidad=Count('id'))
            .order_by('-cantidad')
        )

        return {
            'total_proveedores_activos': total_activos,
            'nuevos_en_periodo': nuevos_periodo,
            'por_tipo': por_tipo,
            'evaluaciones': {
                'total': total_evaluaciones,
                'completadas': evaluaciones_completadas,
                'calificacion_promedio': round(float(calificacion_promedio), 1) if calificacion_promedio else None,
            },
        }

    def get_queryset(self):
        """Excluir proveedores eliminados por defecto."""
        queryset = super().get_queryset()

        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        return queryset.select_related(
            'tipo_proveedor',
            'tipo_documento',
            'modalidad_logistica',
            'departamento',
            'tipo_cuenta',
            'unidad_negocio',
            'created_by'
        ).prefetch_related(
            'tipos_materia_prima',
            'formas_pago',
            'precios_materia_prima',
            'precios_materia_prima__tipo_materia',
            'usuarios_vinculados',
        ).annotate(
            usuarios_vinculados_count=Count(
                'usuarios_vinculados',
                filter=Q(usuarios_vinculados__is_active=True)
            ),
        )

    def get_serializer_class(self):
        """Retornar serializer según la acción."""
        if self.action == 'list':
            return ProveedorListSerializer
        elif self.action == 'create':
            return ProveedorCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProveedorUpdateSerializer
        elif self.action == 'cambiar_precio':
            return CambiarPrecioSerializer
        else:
            return ProveedorDetailSerializer

    def perform_create(self, serializer):
        """Guardar quién creó el proveedor."""
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete de proveedor."""
        instance.soft_delete()

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanModifyPrecioProveedor],
        url_path='cambiar-precio'
    )
    def cambiar_precio(self, request, pk=None):
        """
        Cambiar precio de proveedor de materia prima por tipo.

        SOLO Gerente o SuperAdmin pueden ejecutar esta acción.

        Body:
        {
            "tipo_materia_id": 1,
            "precio_nuevo": 3500.00,
            "motivo": "Ajuste por inflación"
        }
        """
        proveedor = self.get_object()

        # Validar que sea proveedor de materia prima
        if not proveedor.es_proveedor_materia_prima:
            return Response(
                {'detail': 'Solo se puede cambiar precio a proveedores de materia prima'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CambiarPrecioSerializer(
            data=request.data,
            context={
                'proveedor': proveedor,
                'usuario': request.user
            }
        )
        serializer.is_valid(raise_exception=True)
        precio_obj = serializer.save()

        return Response({
            'detail': 'Precio actualizado exitosamente',
            'tipo_materia': precio_obj.tipo_materia.nombre,
            'tipo_materia_id': precio_obj.tipo_materia.id,
            'precio_nuevo': str(precio_obj.precio_kg),
            'modificado_por': request.user.get_full_name(),
            'fecha_modificacion': precio_obj.modificado_fecha
        })

    @action(
        detail=True,
        methods=['get'],
        url_path='historial-precio'
    )
    def historial_precio(self, request, pk=None):
        """Ver historial de cambios de precio del proveedor."""
        proveedor = self.get_object()

        if not proveedor.es_proveedor_materia_prima:
            return Response(
                {'detail': 'Este proveedor no es de materia prima'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener precios actuales por tipo de materia
        precios_actuales = PrecioMateriaPrima.objects.filter(
            proveedor=proveedor
        ).select_related('tipo_materia', 'tipo_materia__categoria', 'modificado_por')

        # Obtener historial
        historial = HistorialPrecioProveedor.objects.filter(
            proveedor=proveedor
        ).select_related('tipo_materia', 'modificado_por').order_by('-fecha_modificacion')

        return Response({
            'proveedor': proveedor.nombre_comercial,
            'proveedor_id': proveedor.id,
            'precios_actuales': PrecioMateriaPrimaSerializer(precios_actuales, many=True).data,
            'historial': HistorialPrecioSerializer(historial, many=True).data
        })

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanManageProveedores]
    )
    def restore(self, request, pk=None):
        """Restaurar proveedor eliminado."""
        proveedor = self.get_object()

        if not proveedor.is_deleted:
            return Response(
                {'detail': 'El proveedor no está eliminado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proveedor.restore()
        serializer = self.get_serializer(proveedor)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=['get', 'post'],
        permission_classes=[IsAuthenticated, CanManageCondicionesComerciales],
        url_path='condiciones-comerciales'
    )
    def condiciones_comerciales(self, request, pk=None):
        """
        Gestionar condiciones comerciales del proveedor.

        GET: Lista condiciones comerciales
        POST: Crea nueva condición comercial
        """
        proveedor = self.get_object()

        if request.method == 'GET':
            condiciones = CondicionComercialProveedor.objects.filter(
                proveedor=proveedor
            ).select_related('created_by').order_by('-vigencia_desde')

            serializer = CondicionComercialSerializer(condiciones, many=True)

            return Response({
                'proveedor': proveedor.nombre_comercial,
                'proveedor_id': proveedor.id,
                'condiciones': serializer.data
            })

        elif request.method == 'POST':
            data = request.data.copy()
            data['proveedor'] = proveedor.id

            serializer = CondicionComercialSerializer(
                data=data,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ==========================================================================
    # CREAR ACCESO — Crear usuario para un proveedor existente
    # ==========================================================================

    def _create_user_for_proveedor(self, proveedor, email, username, cargo, created_by):
        """Crea cuenta de usuario vinculada al proveedor y envía email de setup."""
        temp_password = uuid.uuid4().hex

        new_user = User(
            username=username,
            email=email,
            first_name=proveedor.nombre_comercial or proveedor.razon_social,
            last_name='',
            cargo=cargo,
            document_number=proveedor.numero_documento or f'PROV-{proveedor.id}',
            proveedor=proveedor,
            is_active=True,
            created_by=created_by,
        )
        new_user._from_contratacion = True
        new_user.set_password(temp_password)

        setup_token = uuid.uuid4().hex
        new_user.password_setup_token = setup_token
        new_user.password_setup_expires = timezone.now() + timedelta(hours=72)
        new_user.save()

        try:
            from apps.core.tasks import send_setup_password_email_task
            from django.db import connection

            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com')
            setup_url = f"{frontend_url}/setup-password?token={setup_token}&email={email}"

            tenant_name = proveedor.nombre_comercial or proveedor.razon_social

            try:
                primary_color = connection.tenant.primary_color or '#3b82f6'
                secondary_color = connection.tenant.secondary_color or '#1e40af'
            except Exception:
                primary_color = '#3b82f6'
                secondary_color = '#1e40af'

            send_setup_password_email_task.delay(
                user_email=email,
                user_name=proveedor.nombre_comercial or proveedor.razon_social,
                tenant_name=tenant_name,
                cargo_name=cargo.name if cargo else '',
                setup_url=setup_url,
                expiry_hours=72,
                primary_color=primary_color,
                secondary_color=secondary_color,
            )
            logger.info(
                'User %s creado para Proveedor %s, email de setup enviado a %s',
                new_user.id, proveedor.id, email
            )
        except Exception as e:
            logger.error(
                'Error enviando email de setup para User %s (Proveedor %s): %s',
                new_user.id, proveedor.id, e, exc_info=True
            )

        return new_user

    @action(
        detail=True,
        methods=['post'],
        url_path='crear-acceso',
        permission_classes=[IsAuthenticated, CanManageProveedores],
    )
    @transaction.atomic
    def crear_acceso(self, request, pk=None):
        """
        Crea cuenta de usuario para un proveedor existente sin acceso.

        POST /api/supply-chain/proveedores/{id}/crear-acceso/
        Body: { email, username, cargo_id }
        """
        proveedor = self.get_object()

        if proveedor.usuarios_vinculados.filter(is_active=True).exists():
            return Response(
                {'detail': 'Este proveedor ya tiene un usuario activo vinculado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CrearAccesoProveedorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        username = serializer.validated_data['username']
        cargo_id = serializer.validated_data['cargo_id']

        from django.apps import apps
        Cargo = apps.get_model('core', 'Cargo')
        cargo = Cargo.objects.get(id=cargo_id)

        if User.objects.filter(email=email).exists():
            return Response(
                {'detail': 'Este email ya está registrado en el sistema.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'detail': 'Este nombre de usuario ya existe.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        self._create_user_for_proveedor(proveedor, email, username, cargo, request.user)

        return Response({
            'detail': 'Acceso al sistema creado exitosamente. Se envió un correo para configurar la contraseña.',
        })

    # ==========================================================================
    # PORTAL PROVEEDOR — Endpoints para usuarios externos vinculados
    # ==========================================================================

    @action(
        detail=False,
        methods=['get'],
        url_path='mi-empresa',
        permission_classes=[IsAuthenticated],
    )
    def mi_empresa(self, request):
        """
        Retorna el Proveedor vinculado al usuario autenticado.

        GET /api/supply-chain/proveedores/mi-empresa/

        Solo accesible para usuarios con proveedor asignado.
        Solo lectura — el consultor ve su ficha pero no la edita.
        """
        proveedor = getattr(request.user, 'proveedor', None)
        if not proveedor:
            return Response(
                {'detail': 'No tienes un proveedor vinculado a tu cuenta.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProveedorDetailSerializer(
            proveedor,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(
        detail=False,
        methods=['get'],
        url_path='mi-empresa/contratos',
        permission_classes=[IsAuthenticated],
    )
    def mi_empresa_contratos(self, request):
        """
        Retorna las condiciones comerciales del proveedor vinculado al usuario.

        GET /api/supply-chain/proveedores/mi-empresa/contratos/
        """
        proveedor = getattr(request.user, 'proveedor', None)
        if not proveedor:
            return Response(
                {'detail': 'No tienes un proveedor vinculado a tu cuenta.'},
                status=status.HTTP_404_NOT_FOUND
            )

        condiciones = CondicionComercialProveedor.objects.filter(
            proveedor=proveedor
        ).select_related('created_by').order_by('-vigencia_desde')

        serializer = CondicionComercialSerializer(condiciones, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=['get'],
        url_path='mi-empresa/evaluaciones',
        permission_classes=[IsAuthenticated],
    )
    def mi_empresa_evaluaciones(self, request):
        """
        Retorna las evaluaciones del proveedor vinculado al usuario.

        GET /api/supply-chain/proveedores/mi-empresa/evaluaciones/
        """
        proveedor = getattr(request.user, 'proveedor', None)
        if not proveedor:
            return Response(
                {'detail': 'No tienes un proveedor vinculado a tu cuenta.'},
                status=status.HTTP_404_NOT_FOUND
            )

        evaluaciones = EvaluacionProveedor.objects.filter(
            proveedor=proveedor
        ).select_related(
            'evaluado_por', 'aprobado_por'
        ).prefetch_related('detalles__criterio').order_by('-fecha_evaluacion')

        serializer = EvaluacionProveedorSerializer(evaluaciones, many=True)
        return Response(serializer.data)

    # ── Importación masiva ────────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='plantilla-importacion')
    def plantilla_importacion(self, request):
        """
        Descarga la plantilla Excel para importación masiva de proveedores.
        GET /api/supply-chain/proveedores/plantilla-importacion/
        """
        from django.http import HttpResponse
        from .import_proveedores_utils import generate_proveedor_import_template

        # Obtener datos de referencia del tenant
        try:
            tipos_proveedor = list(
                TipoProveedor.objects.filter(is_active=True)
                .values('nombre').order_by('nombre')
            )
        except Exception:
            tipos_proveedor = []

        try:
            tipos_documento = list(
                TipoDocumentoIdentidad.objects.filter(is_active=True)
                .values('nombre').order_by('nombre')
            )
        except Exception:
            tipos_documento = []

        try:
            departamentos = list(
                Departamento.objects.filter(is_active=True)
                .values('nombre').order_by('nombre')
            )
        except Exception:
            departamentos = []

        try:
            proveedores_existentes = list(
                Proveedor.objects.filter(deleted_at__isnull=True)
                .values('nombre_comercial', 'codigo_interno')
                .order_by('nombre_comercial')
            )
        except Exception:
            proveedores_existentes = []

        excel_bytes = generate_proveedor_import_template(
            tipos_proveedor=tipos_proveedor,
            tipos_documento=tipos_documento,
            departamentos=departamentos,
            proveedores_existentes=proveedores_existentes,
        )

        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="plantilla_proveedores.xlsx"'
        return response

    @action(detail=False, methods=['post'], url_path='importar')
    def importar(self, request):
        """
        Importa proveedores desde un archivo Excel.
        POST /api/supply-chain/proveedores/importar/   multipart/form-data  campo: archivo

        Procesa fila por fila — los errores NO bloquean las filas válidas.
        Respuesta:
        {
          "creados": N,
          "actualizados": N,
          "errores": [{"fila": X, "nombre": "...", "errores": [...]}]
        }
        """
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'detail': 'Se requiere el archivo Excel (.xlsx).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nombre = archivo.name.lower()
        if not (nombre.endswith('.xlsx') or nombre.endswith('.xls')):
            return Response(
                {'detail': 'El archivo debe ser Excel (.xlsx).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from .import_proveedores_utils import parse_proveedor_excel, PROVEEDOR_COLUMNAS
            contenido = archivo.read()
            filas = parse_proveedor_excel(contenido)
        except Exception as e:
            logger.error('Error parseando archivo de importación de proveedores: %s', e, exc_info=True)
            return Response(
                {'detail': f'No se pudo leer el archivo: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not filas:
            return Response(
                {'detail': 'El archivo no contiene datos. Verifica que haya filas después de las cabeceras (fila 4 en adelante).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        creados = 0
        actualizados = 0
        errores = []

        from .import_proveedores_serializer import ProveedorImportRowSerializer

        for fila_raw in filas:
            num_fila = fila_raw.pop('_fila', '?')
            nombre_raw = str(fila_raw.get('nombre_comercial', '')).strip()

            datos = {col: fila_raw.get(col, '') for col in PROVEEDOR_COLUMNAS}

            serializer = ProveedorImportRowSerializer(data=datos)
            if not serializer.is_valid():
                msgs = []
                for field, errs in serializer.errors.items():
                    if isinstance(errs, list):
                        msgs.extend([str(e) for e in errs])
                    else:
                        msgs.append(str(errs))
                errores.append({
                    'fila': num_fila,
                    'nombre': nombre_raw or '—',
                    'errores': msgs,
                })
                continue

            vdata = serializer.validated_data
            tipo_proveedor = vdata.pop('_tipo_proveedor')
            tipo_documento = vdata.pop('_tipo_documento')
            departamento_obj = vdata.pop('_departamento')

            # Limpiar campos auxiliares
            for key in ['tipo_proveedor_nombre', 'tipo_documento_nombre', 'departamento_nombre']:
                vdata.pop(key, None)

            proveedor_data = {
                'tipo_proveedor': tipo_proveedor,
                'nombre_comercial': vdata.pop('nombre_comercial'),
                'razon_social': vdata.pop('razon_social'),
                'tipo_documento': tipo_documento,
                'numero_documento': vdata.pop('numero_documento'),
                'nit': vdata.pop('nit', '') or None,
                'telefono': vdata.pop('telefono', '') or None,
                'email': vdata.pop('email', '') or None,
                'direccion': vdata.pop('direccion', ''),
                'ciudad': vdata.pop('ciudad', ''),
                'departamento': departamento_obj,
                'banco': vdata.pop('banco', '') or None,
                'numero_cuenta': vdata.pop('numero_cuenta', '') or None,
                'titular_cuenta': vdata.pop('titular_cuenta', '') or None,
                'dias_plazo_pago': vdata.pop('dias_plazo_pago', 0),
                'observaciones': vdata.pop('observaciones', '') or None,
                'created_by': user,
            }

            try:
                with transaction.atomic():
                    prov = Proveedor(**proveedor_data)
                    prov.full_clean()
                    prov.save()
                    creados += 1

            except Exception as e:
                logger.error(
                    'Error importando proveedor fila %s (%s): %s',
                    num_fila, nombre_raw, e, exc_info=True
                )
                errores.append({
                    'fila': num_fila,
                    'nombre': nombre_raw or '—',
                    'errores': [str(e)],
                })

        return Response({
            'creados': creados,
            'actualizados': actualizados,
            'errores': errores,
            'total_filas': creados + actualizados + len(errores),
        }, status=status.HTTP_200_OK if creados > 0 else status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# VIEWSETS DE HISTORIAL Y CONDICIONES
# ==============================================================================

class HistorialPrecioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para Historial de Precios.

    Endpoints:
    - GET /api/supply-chain/historial-precios/ - Lista de cambios de precio
    - GET /api/supply-chain/historial-precios/{id}/ - Detalle de cambio
    """

    queryset = HistorialPrecioProveedor.objects.all()
    serializer_class = HistorialPrecioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['proveedor', 'tipo_materia', 'modificado_por']
    ordering_fields = ['fecha_modificacion']
    ordering = ['-fecha_modificacion']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('proveedor', 'tipo_materia', 'modificado_por')


class CondicionComercialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Condiciones Comerciales de Proveedores.

    Endpoints:
    - GET /api/supply-chain/condiciones-comerciales/ - Lista de condiciones
    - POST /api/supply-chain/condiciones-comerciales/ - Crear condición
    - GET /api/supply-chain/condiciones-comerciales/{id}/ - Detalle
    - PUT/PATCH /api/supply-chain/condiciones-comerciales/{id}/ - Actualizar
    - DELETE /api/supply-chain/condiciones-comerciales/{id}/ - Eliminar (Admin+)
    """

    queryset = CondicionComercialProveedor.objects.all()
    serializer_class = CondicionComercialSerializer
    permission_classes = [IsAuthenticated, CanManageCondicionesComerciales]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['proveedor']
    ordering_fields = ['vigencia_desde', 'vigencia_hasta']
    ordering = ['-vigencia_desde']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrar solo vigentes si se solicita
        solo_vigentes = self.request.query_params.get('solo_vigentes', 'false')
        if solo_vigentes.lower() == 'true':
            from datetime import date
            hoy = date.today()
            queryset = queryset.filter(
                Q(vigencia_hasta__isnull=True, vigencia_desde__lte=hoy) |
                Q(vigencia_desde__lte=hoy, vigencia_hasta__gte=hoy)
            )

        return queryset.select_related('proveedor', 'created_by')

    def perform_create(self, serializer):
        """Guardar quién creó la condición."""
        serializer.save(created_by=self.request.user)


# ==============================================================================
# VIEWSET DE PRUEBA DE ACIDEZ
# ==============================================================================

class PruebaAcidezViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Pruebas de Acidez de Sebo Procesado (dinámico).

    Endpoints:
    - GET /api/supply-chain/pruebas-acidez/ - Lista de pruebas
    - POST /api/supply-chain/pruebas-acidez/ - Crear prueba
    - GET /api/supply-chain/pruebas-acidez/{id}/ - Detalle de prueba
    - DELETE /api/supply-chain/pruebas-acidez/{id}/ - Soft delete (Admin+)
    - POST /api/supply-chain/pruebas-acidez/simular/ - Simular resultado sin crear
    - POST /api/supply-chain/pruebas-acidez/{id}/restore/ - Restaurar eliminada
    - GET /api/supply-chain/pruebas-acidez/por-proveedor/{id}/ - Pruebas de un proveedor
    - GET /api/supply-chain/pruebas-acidez/estadisticas/ - Estadísticas
    """

    queryset = PruebaAcidez.objects.all()
    permission_classes = [IsAuthenticated, CanManageProveedores]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['proveedor', 'calidad_resultante', 'realizado_por', 'tipo_materia_resultante']
    search_fields = ['codigo_voucher', 'proveedor__nombre_comercial', 'lote_numero']
    ordering_fields = ['fecha_prueba', 'created_at', 'valor_acidez', 'cantidad_kg']
    ordering = ['-fecha_prueba']

    def get_queryset(self):
        """Excluir pruebas eliminadas por defecto."""
        queryset = super().get_queryset()

        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        # Filtrar por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_prueba__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_prueba__lte=fecha_hasta)

        return queryset.select_related(
            'proveedor',
            'tipo_materia_resultante',
            'tipo_materia_resultante__categoria',
            'realizado_por'
        )

    def get_serializer_class(self):
        """Retornar serializer según la acción."""
        if self.action == 'list':
            return PruebaAcidezListSerializer
        elif self.action == 'create':
            return PruebaAcidezCreateSerializer
        elif self.action == 'simular':
            return SimularPruebaAcidezSerializer
        else:
            return PruebaAcidezDetailSerializer

    def perform_create(self, serializer):
        """Guardar quién realizó la prueba."""
        serializer.save(realizado_por=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete de prueba de acidez."""
        instance.soft_delete()

    @action(detail=False, methods=['post'])
    def simular(self, request):
        """
        Simular resultado de prueba de acidez sin crear registro.

        Útil para mostrar al usuario qué calidad obtendrá antes de confirmar.

        Body:
        {
            "valor_acidez": 4.5,
            "proveedor_id": 123,
            "cantidad_kg": 500  (opcional)
        }
        """
        serializer = SimularPruebaAcidezSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resultado = serializer.simulate()
        return Response(resultado)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restaurar prueba de acidez eliminada."""
        prueba = self.get_object()

        if not prueba.is_deleted:
            return Response(
                {'detail': 'La prueba no está eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        prueba.restore()
        serializer = self.get_serializer(prueba)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-proveedor/(?P<proveedor_id>[^/.]+)')
    def por_proveedor(self, request, proveedor_id=None):
        """
        Lista pruebas de acidez de un proveedor específico.

        GET /api/supply-chain/pruebas-acidez/por-proveedor/{proveedor_id}/
        """
        try:
            proveedor = Proveedor.objects.get(pk=proveedor_id)
        except Proveedor.DoesNotExist:
            return Response(
                {'detail': 'Proveedor no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar que maneja SEBO (buscar por categoría dinámica)
        tipos_sebo = TipoMateriaPrima.objects.filter(
            categoria__codigo__icontains='SEBO',
            is_active=True
        )
        if not proveedor.tipos_materia_prima.filter(id__in=tipos_sebo.values_list('id', flat=True)).exists():
            return Response(
                {'detail': 'El proveedor no maneja SEBO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pruebas = PruebaAcidez.objects.filter(
            proveedor=proveedor,
            deleted_at__isnull=True
        ).select_related('tipo_materia_resultante', 'realizado_por').order_by('-fecha_prueba')

        serializer = PruebaAcidezListSerializer(pruebas, many=True)

        return Response({
            'proveedor': proveedor.nombre_comercial,
            'proveedor_id': proveedor.id,
            'total_pruebas': pruebas.count(),
            'pruebas': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de pruebas de acidez.

        GET /api/supply-chain/pruebas-acidez/estadisticas/
        """
        queryset = PruebaAcidez.objects.filter(deleted_at__isnull=True)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_prueba__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_prueba__lte=fecha_hasta)

        # Estadísticas por calidad
        por_calidad = queryset.values('calidad_resultante').annotate(
            cantidad=Count('id'),
            total_kg=Sum('cantidad_kg'),
            total_valor=Sum('valor_total'),
            acidez_promedio=Avg('valor_acidez')
        ).order_by('calidad_resultante')

        # Estadísticas por tipo de materia (dinámico)
        por_tipo = queryset.values(
            'tipo_materia_resultante__nombre'
        ).annotate(
            cantidad=Count('id'),
            total_kg=Sum('cantidad_kg'),
            total_valor=Sum('valor_total'),
            acidez_promedio=Avg('valor_acidez')
        ).order_by('tipo_materia_resultante__nombre')

        # Estadísticas generales
        totales = queryset.aggregate(
            total_pruebas=Count('id'),
            total_kg=Sum('cantidad_kg'),
            total_valor=Sum('valor_total'),
            acidez_promedio=Avg('valor_acidez')
        )

        return Response({
            'por_calidad': list(por_calidad),
            'por_tipo_materia': list(por_tipo),
            'totales': totales,
            'filtros': {
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta
            }
        })


# ==============================================================================
# VIEWSETS DE EVALUACIÓN DE PROVEEDORES
# ==============================================================================

class CriterioEvaluacionViewSet(CatalogoBaseViewSet):
    """
    ViewSet para Criterios de Evaluación de Proveedores (dinámico).

    Endpoints:
    - GET /api/supply-chain/criterios-evaluacion/
    - POST /api/supply-chain/criterios-evaluacion/
    - GET /api/supply-chain/criterios-evaluacion/{id}/
    - PUT/PATCH /api/supply-chain/criterios-evaluacion/{id}/
    - DELETE /api/supply-chain/criterios-evaluacion/{id}/
    - GET /api/supply-chain/criterios-evaluacion/por-tipo-proveedor/?tipo_id=X
    """

    queryset = CriterioEvaluacion.objects.all()
    serializer_class = CriterioEvaluacionSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre', 'peso']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.prefetch_related('aplica_a_tipo')

    @action(detail=False, methods=['get'], url_path='por-tipo-proveedor')
    def por_tipo_proveedor(self, request):
        """
        Obtener criterios de evaluación que aplican a un tipo de proveedor.

        GET /api/supply-chain/criterios-evaluacion/por-tipo-proveedor/?tipo_id=1
        """
        tipo_id = request.query_params.get('tipo_id')

        if not tipo_id:
            return Response(
                {'detail': 'Debe proporcionar el parámetro "tipo_id"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            tipo_proveedor = TipoProveedor.objects.get(pk=tipo_id)
        except TipoProveedor.DoesNotExist:
            return Response(
                {'detail': 'Tipo de proveedor no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        criterios = CriterioEvaluacion.objects.filter(
            Q(aplica_a_tipo__id=tipo_id) | Q(aplica_a_tipo__isnull=True),
            is_active=True
        ).distinct().order_by('orden', 'nombre')

        serializer = CriterioEvaluacionSerializer(criterios, many=True)

        return Response({
            'tipo_proveedor': tipo_proveedor.nombre,
            'tipo_proveedor_id': tipo_proveedor.id,
            'criterios': serializer.data
        })


class EvaluacionProveedorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Evaluaciones de Proveedores.

    Endpoints:
    - GET /api/supply-chain/evaluaciones-proveedor/
    - POST /api/supply-chain/evaluaciones-proveedor/
    - GET /api/supply-chain/evaluaciones-proveedor/{id}/
    - PUT/PATCH /api/supply-chain/evaluaciones-proveedor/{id}/
    - DELETE /api/supply-chain/evaluaciones-proveedor/{id}/
    - POST /api/supply-chain/evaluaciones-proveedor/{id}/calcular/ - Calcular calificación
    - POST /api/supply-chain/evaluaciones-proveedor/{id}/aprobar/ - Aprobar evaluación
    """

    queryset = EvaluacionProveedor.objects.all()
    serializer_class = EvaluacionProveedorSerializer
    permission_classes = [IsAuthenticated, CanManageProveedores]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['proveedor', 'estado', 'periodo', 'evaluado_por']
    ordering_fields = ['fecha_evaluacion', 'calificacion_total']
    ordering = ['-fecha_evaluacion']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related(
            'proveedor',
            'evaluado_por',
            'aprobado_por'
        ).prefetch_related('detalles', 'detalles__criterio')

    def perform_create(self, serializer):
        """Guardar quién creó la evaluación."""
        serializer.save(evaluado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def calcular(self, request, pk=None):
        """Calcular calificación total basada en los detalles."""
        evaluacion = self.get_object()
        calificacion = evaluacion.calcular_calificacion()

        if calificacion is not None:
            evaluacion.save(update_fields=['calificacion_total', 'updated_at'])
            return Response({
                'detail': 'Calificación calculada exitosamente',
                'calificacion_total': str(calificacion)
            })
        else:
            return Response(
                {'detail': 'No hay detalles de evaluación para calcular'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar evaluación de proveedor."""
        evaluacion = self.get_object()

        if evaluacion.estado == 'APROBADA':
            return Response(
                {'detail': 'La evaluación ya está aprobada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if evaluacion.calificacion_total is None:
            return Response(
                {'detail': 'Debe calcular la calificación antes de aprobar'},
                status=status.HTTP_400_BAD_REQUEST
            )

        evaluacion.estado = 'APROBADA'
        evaluacion.aprobado_por = request.user
        evaluacion.fecha_aprobacion = timezone.now()
        evaluacion.save(update_fields=['estado', 'aprobado_por', 'fecha_aprobacion', 'updated_at'])

        serializer = self.get_serializer(evaluacion)
        return Response(serializer.data)


class DetalleEvaluacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Detalles de Evaluación.

    Endpoints:
    - GET /api/supply-chain/detalles-evaluacion/
    - POST /api/supply-chain/detalles-evaluacion/
    - GET /api/supply-chain/detalles-evaluacion/{id}/
    - PUT/PATCH /api/supply-chain/detalles-evaluacion/{id}/
    - DELETE /api/supply-chain/detalles-evaluacion/{id}/
    """

    queryset = DetalleEvaluacion.objects.all()
    serializer_class = DetalleEvaluacionSerializer
    permission_classes = [IsAuthenticated, CanManageProveedores]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['evaluacion', 'criterio']
    ordering = ['criterio__orden']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('evaluacion', 'criterio')
