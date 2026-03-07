"""
Views para Gestión de Clientes - Sales CRM
Sistema de Gestión StrateKaz

ViewSets para la gestión de clientes, contactos, segmentos,
interacciones y scoring de clientes.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Count, Sum, Avg, F, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    TipoCliente, EstadoCliente, CanalVenta, Cliente,
    ContactoCliente, SegmentoCliente, ClienteSegmento,
    InteraccionCliente, ScoringCliente
)
from .serializers import (
    TipoClienteSerializer, EstadoClienteSerializer, CanalVentaSerializer,
    ClienteListSerializer, ClienteSerializer, ContactoClienteSerializer,
    SegmentoClienteSerializer, ClienteSegmentoSerializer,
    InteraccionClienteListSerializer, InteraccionClienteSerializer,
    ScoringClienteSerializer, ActualizarScoringSerializer,
    AsignarSegmentoSerializer,
    CrearAccesoClienteSerializer, MiClienteSerializer,
)


# ==============================================================================
# VIEWSETS PARA CATÁLOGOS
# ==============================================================================

class TipoClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de cliente.

    list: Listar todos los tipos de cliente activos
    retrieve: Obtener detalle de un tipo de cliente
    create: Crear nuevo tipo de cliente
    update: Actualizar tipo de cliente
    partial_update: Actualizar parcialmente tipo de cliente
    destroy: Eliminar tipo de cliente (soft delete)
    """
    serializer_class = TipoClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        """Filtrar por empresa del usuario."""
        # Los catálogos no tienen empresa, son globales
        queryset = TipoCliente.objects.filter(activo=True)
        return queryset


class EstadoClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para estados de cliente.

    list: Listar todos los estados activos
    retrieve: Obtener detalle de un estado
    create: Crear nuevo estado
    update: Actualizar estado
    partial_update: Actualizar parcialmente estado
    destroy: Eliminar estado (soft delete)
    """
    serializer_class = EstadoClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'permite_ventas', 'requiere_aprobacion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        """Filtrar estados activos."""
        queryset = EstadoCliente.objects.filter(activo=True)
        return queryset


class CanalVentaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para canales de venta.

    list: Listar todos los canales activos
    retrieve: Obtener detalle de un canal
    create: Crear nuevo canal
    update: Actualizar canal
    partial_update: Actualizar parcialmente canal
    destroy: Eliminar canal (soft delete)
    """
    serializer_class = CanalVentaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'aplica_comision']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        """Filtrar canales activos."""
        queryset = CanalVenta.objects.filter(activo=True)
        return queryset


# ==============================================================================
# VIEWSETS PRINCIPALES - CLIENTES
# ==============================================================================

@extend_schema_view(
    list=extend_schema(
        summary='Listar clientes',
        description='Obtiene el listado de clientes con paginación, filtros y búsqueda avanzada',
        tags=['Sales CRM']
    ),
    retrieve=extend_schema(
        summary='Obtener detalle de cliente',
        description='Obtiene el detalle completo de un cliente incluyendo contactos, scoring y segmentos',
        tags=['Sales CRM']
    ),
    create=extend_schema(
        summary='Crear nuevo cliente',
        description='Registra un nuevo cliente en el sistema',
        tags=['Sales CRM']
    ),
    update=extend_schema(
        summary='Actualizar cliente',
        description='Actualiza completamente la información de un cliente',
        tags=['Sales CRM']
    ),
    partial_update=extend_schema(
        summary='Actualizar parcialmente cliente',
        description='Actualiza campos específicos de un cliente',
        tags=['Sales CRM']
    ),
    destroy=extend_schema(
        summary='Eliminar cliente',
        description='Elimina un cliente del sistema (soft delete)',
        tags=['Sales CRM']
    )
)
class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de clientes

    Permite administrar el portafolio de clientes del sistema, incluyendo:
    - Información de contacto y documentación
    - Asignación de vendedores y canales de venta
    - Segmentación de clientes
    - Scoring y análisis de comportamiento
    - Historial de compras y métricas
    - Dashboard con indicadores clave

    Filtros disponibles:
    - tipo_cliente: Tipo de cliente (PERSONA_NATURAL, JURIDICA, etc.)
    - estado_cliente: Estado actual del cliente
    - canal_venta: Canal de venta asignado
    - vendedor_asignado: Vendedor responsable
    - ciudad, departamento: Ubicación geográfica
    - sin_compras: Clientes que no han comprado (true/false)
    - dias_inactividad: Días sin comprar (número)
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'tipo_cliente', 'estado_cliente', 'canal_venta',
        'vendedor_asignado', 'is_active', 'ciudad', 'departamento'
    ]
    search_fields = [
        'codigo_cliente', 'numero_documento', 'razon_social',
        'nombre_comercial', 'email', 'telefono'
    ]
    ordering_fields = [
        'codigo_cliente', 'razon_social', 'created_at',
        'ultima_compra', 'total_compras_acumulado', 'cantidad_pedidos'
    ]
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filtrar clientes por tenant (schema isolation).
        Optimizado con select_related y prefetch_related.
        """
        queryset = Cliente.objects.select_related(
            'tipo_cliente',
            'estado_cliente',
            'canal_venta',
            'vendedor_asignado',
            'created_by',
            'updated_by'
        ).prefetch_related(
            'contactos',
            'segmentos__segmento'
        )

        # Filtros adicionales por query params
        tipo_cliente = self.request.query_params.get('tipo_cliente', None)
        if tipo_cliente:
            queryset = queryset.filter(tipo_cliente_id=tipo_cliente)

        estado_cliente = self.request.query_params.get('estado_cliente', None)
        if estado_cliente:
            queryset = queryset.filter(estado_cliente_id=estado_cliente)

        vendedor = self.request.query_params.get('vendedor_asignado', None)
        if vendedor:
            queryset = queryset.filter(vendedor_asignado_id=vendedor)

        # Filtrar clientes sin compras
        sin_compras = self.request.query_params.get('sin_compras', None)
        if sin_compras == 'true':
            queryset = queryset.filter(cantidad_pedidos=0)

        # Filtrar clientes inactivos (sin compras recientes)
        dias_inactividad = self.request.query_params.get('dias_inactividad', None)
        if dias_inactividad:
            fecha_limite = timezone.now().date() - timedelta(days=int(dias_inactividad))
            queryset = queryset.filter(
                Q(ultima_compra__lt=fecha_limite) | Q(ultima_compra__isnull=True)
            )

        return queryset

    def get_serializer_class(self):
        """Usar serializer según la acción."""
        if self.action == 'list':
            return ClienteListSerializer
        return ClienteSerializer

    def perform_create(self, serializer):
        """Asignar empresa al crear cliente."""
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)

    @extend_schema(
        summary='Actualizar scoring del cliente',
        description='Recalcula el scoring del cliente basado en su comportamiento de compras y actividad',
        tags=['Sales CRM']
    )
    @action(detail=True, methods=['post'], url_path='actualizar-scoring')
    def actualizar_scoring(self, request, pk=None):
        """
        Recalcular el scoring del cliente.

        POST /api/sales-crm/clientes/{id}/actualizar_scoring/
        """
        cliente = self.get_object()

        # Actualizar scoring
        cliente.actualizar_scoring()

        # Obtener scoring actualizado
        scoring = ScoringCliente.objects.get(cliente=cliente)
        serializer = ScoringClienteSerializer(scoring)

        return Response({
            'message': 'Scoring actualizado correctamente',
            'scoring': serializer.data
        })

    @extend_schema(
        summary='Obtener historial de compras',
        description='Retorna el historial completo de compras del cliente con métricas y estadísticas',
        tags=['Sales CRM']
    )
    @action(detail=True, methods=['get'], url_path='historial-compras')
    def historial_compras(self, request, pk=None):
        """
        Obtener historial de compras del cliente.

        GET /api/sales-crm/clientes/{id}/historial_compras/
        """
        cliente = self.get_object()

        # TODO: Implementar cuando exista el modelo de Pedidos
        historial = cliente.get_historial_compras()

        return Response({
            'cliente': cliente.razon_social,
            'total_compras': cliente.total_compras_acumulado,
            'cantidad_pedidos': cliente.cantidad_pedidos,
            'ticket_promedio': cliente.ticket_promedio,
            'primera_compra': cliente.fecha_primera_compra,
            'ultima_compra': cliente.ultima_compra,
            'dias_sin_comprar': cliente.dias_sin_comprar,
            'historial': historial
        })

    @extend_schema(
        summary='Dashboard de clientes',
        description='''
        Retorna un dashboard completo con métricas de clientes:
        - Total de clientes y clientes activos
        - Distribución por estado y tipo
        - Clientes por vendedor
        - Top 10 clientes por compras
        - Métricas de scoring
        - Clientes sin compras e inactivos
        ''',
        tags=['Sales CRM']
    )
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Dashboard con métricas de clientes.

        GET /api/sales-crm/clientes/dashboard/

        Retorna:
        - Total de clientes
        - Clientes por estado
        - Clientes por tipo
        - Clientes por vendedor
        - Top 10 clientes por compras
        - Métricas de scoring
        """
        queryset = self.get_queryset()

        # Total de clientes
        total_clientes = queryset.count()
        clientes_activos = queryset.filter(is_active=True).count()

        # Clientes por estado
        por_estado = list(queryset.values(
            'estado_cliente__codigo',
            'estado_cliente__nombre',
            'estado_cliente__color'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad'))

        # Clientes por tipo
        por_tipo = list(queryset.values(
            'tipo_cliente__codigo',
            'tipo_cliente__nombre'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad'))

        # Clientes por vendedor
        por_vendedor = list(queryset.filter(
            vendedor_asignado__isnull=False
        ).values(
            'vendedor_asignado__id',
            'vendedor_asignado__first_name',
            'vendedor_asignado__last_name'
        ).annotate(
            cantidad=Count('id'),
            ventas_totales=Sum('total_compras_acumulado')
        ).order_by('-ventas_totales')[:10])

        # Top 10 clientes por compras
        top_clientes = list(queryset.order_by('-total_compras_acumulado')[:10].values(
            'id',
            'codigo_cliente',
            'razon_social',
            'total_compras_acumulado',
            'cantidad_pedidos'
        ))

        # Métricas de scoring
        scorings = ScoringCliente.objects.aggregate(
            promedio_scoring=Avg('puntuacion_total'),
            clientes_excelentes=Count('id', filter=Q(puntuacion_total__gte=80)),
            clientes_buenos=Count('id', filter=Q(puntuacion_total__gte=60, puntuacion_total__lt=80)),
            clientes_regulares=Count('id', filter=Q(puntuacion_total__gte=40, puntuacion_total__lt=60)),
            clientes_bajos=Count('id', filter=Q(puntuacion_total__lt=40))
        )

        # Clientes sin compras
        sin_compras = queryset.filter(cantidad_pedidos=0).count()

        # Clientes inactivos (>90 días sin comprar)
        fecha_limite = timezone.now().date() - timedelta(days=90)
        inactivos = queryset.filter(
            Q(ultima_compra__lt=fecha_limite) | Q(ultima_compra__isnull=True)
        ).exclude(cantidad_pedidos=0).count()

        return Response({
            'resumen': {
                'total_clientes': total_clientes,
                'clientes_activos': clientes_activos,
                'sin_compras': sin_compras,
                'inactivos_90_dias': inactivos
            },
            'por_estado': por_estado,
            'por_tipo': por_tipo,
            'por_vendedor': por_vendedor,
            'top_clientes': top_clientes,
            'scoring': scorings
        })

    # ── Portal de clientes ──────────────────────────────────────────────

    @extend_schema(
        summary='Crear acceso portal para cliente',
        description='Crea una cuenta de usuario con cargo CLIENTE_PORTAL vinculada al cliente',
        tags=['Sales CRM - Portal']
    )
    @action(detail=True, methods=['post'], url_path='crear-acceso')
    def crear_acceso(self, request, pk=None):
        """
        Crea cuenta de usuario portal para un cliente existente.

        POST /api/sales-crm/clientes/{id}/crear-acceso/
        Body: { email, username }

        - Crea User con cargo CLIENTE_PORTAL
        - Vincula User.cliente = cliente
        - Envía email de setup de contraseña
        """
        from django.db import transaction, connection
        from django.apps import apps
        from django.conf import settings as django_settings
        from django.utils import timezone as tz
        from datetime import timedelta
        import uuid

        cliente = self.get_object()

        serializer = CrearAccesoClienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        username = serializer.validated_data['username']

        User = apps.get_model('core', 'User')
        Cargo = apps.get_model('core', 'Cargo')

        # Obtener o crear cargo CLIENTE_PORTAL
        cargo, created = Cargo.objects.get_or_create(
            code='CLIENTE_PORTAL',
            defaults={
                'name': 'Cliente - Portal',
                'is_system': True,
                'is_active': True,
                'is_externo': True,
            }
        )
        if not created and not cargo.is_externo:
            cargo.is_externo = True
            cargo.save(update_fields=['is_externo'])

        # Verificar si el email ya existe
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            # Si el usuario tiene un cliente eliminado → reasignar
            old_cliente = existing_user.cliente
            if old_cliente and old_cliente.is_deleted:
                with transaction.atomic():
                    existing_user.cliente = cliente
                    existing_user.cargo = cargo
                    existing_user.is_active = True
                    existing_user.first_name = cliente.nombre_comercial or cliente.razon_social
                    setup_token = uuid.uuid4().hex
                    existing_user.password_setup_token = setup_token
                    existing_user.password_setup_expires = tz.now() + timedelta(hours=User.PASSWORD_SETUP_EXPIRY_HOURS)
                    existing_user.save()

                self._send_setup_email(existing_user, cliente, setup_token)

                from apps.core.utils.audit_logging import log_cliente_access_created
                log_cliente_access_created(request, cliente, existing_user)

                return Response({
                    'detail': 'Acceso reasignado exitosamente. Se envió un correo para configurar la contraseña.',
                })
            else:
                return Response(
                    {'detail': 'Este email ya está registrado en el sistema.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Verificar username
        existing_by_username = User.objects.filter(username=username).first()
        if existing_by_username:
            old_cliente = existing_by_username.cliente
            if old_cliente and old_cliente.is_deleted:
                existing_by_username.username = f'del_{existing_by_username.id}_{username}'
                existing_by_username.save(update_fields=['username'])
            else:
                return Response(
                    {'detail': 'Este nombre de usuario ya existe.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Crear usuario
        with transaction.atomic():
            temp_password = uuid.uuid4().hex
            base_doc = cliente.numero_documento or f'CLI-{cliente.id}'
            doc_number = base_doc
            if User.objects.filter(document_number=base_doc).exists():
                doc_number = f'{base_doc}-{uuid.uuid4().hex[:6]}'

            new_user = User(
                username=username,
                email=email,
                first_name=cliente.nombre_comercial or cliente.razon_social,
                last_name='',
                cargo=cargo,
                document_number=doc_number,
                cliente=cliente,
                is_active=True,
                created_by=request.user,
            )
            new_user._from_contratacion = True
            new_user.set_password(temp_password)

            setup_token = uuid.uuid4().hex
            new_user.password_setup_token = setup_token
            new_user.password_setup_expires = tz.now() + timedelta(hours=User.PASSWORD_SETUP_EXPIRY_HOURS)
            new_user.save()

        self._send_setup_email(new_user, cliente, setup_token)

        from apps.core.utils.audit_logging import log_cliente_access_created
        log_cliente_access_created(request, cliente, new_user)

        return Response({
            'detail': 'Acceso al portal creado exitosamente. Se envió un correo para configurar la contraseña.',
        })

    def _send_setup_email(self, user, cliente, setup_token):
        """Envía email de setup de contraseña para usuario de portal de clientes."""
        import logging
        from django.db import connection
        from django.conf import settings as django_settings

        logger = logging.getLogger(__name__)

        try:
            from apps.core.tasks import send_setup_password_email_task

            frontend_url = getattr(django_settings, 'FRONTEND_URL', 'https://app.stratekaz.com')
            tenant_id = getattr(connection.tenant, 'id', '')
            setup_url = f"{frontend_url}/setup-password?token={setup_token}&email={user.email}&tenant_id={tenant_id}"

            tenant_name = cliente.nombre_comercial or cliente.razon_social

            try:
                primary_color = connection.tenant.primary_color or '#3b82f6'
                secondary_color = connection.tenant.secondary_color or '#1e40af'
            except Exception:
                primary_color = '#3b82f6'
                secondary_color = '#1e40af'

            send_setup_password_email_task.delay(
                user_email=user.email,
                user_name=user.get_full_name() or user.username or tenant_name,
                tenant_name=tenant_name,
                cargo_name='Portal de Clientes',
                setup_url=setup_url,
                expiry_hours=user.PASSWORD_SETUP_EXPIRY_HOURS,
                primary_color=primary_color,
                secondary_color=secondary_color,
            )
            logger.info(
                'User %s creado para Cliente %s, email de setup enviado a %s',
                user.id, cliente.id, user.email
            )
        except Exception as e:
            logger.error(
                'Error enviando email de setup para User %s (Cliente %s): %s',
                user.id, cliente.id, e, exc_info=True
            )

    @extend_schema(
        summary='Mi cliente (portal)',
        description='Retorna la información del cliente vinculado al usuario autenticado',
        tags=['Sales CRM - Portal']
    )
    @action(detail=False, methods=['get'], url_path='mi-cliente')
    def mi_cliente(self, request):
        """
        Información del cliente vinculado al usuario actual.

        GET /api/sales-crm/clientes/mi-cliente/
        """
        cliente = getattr(request.user, 'cliente', None)
        if not cliente:
            return Response(
                {'error': 'No tiene cliente vinculado'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = MiClienteSerializer(cliente)
        return Response(serializer.data)

    @extend_schema(
        summary='Contactos de mi cliente (portal)',
        description='Retorna los contactos del cliente vinculado al usuario autenticado',
        tags=['Sales CRM - Portal']
    )
    @action(detail=False, methods=['get'], url_path='mi-cliente/contactos')
    def mi_cliente_contactos(self, request):
        """
        Contactos del cliente vinculado.

        GET /api/sales-crm/clientes/mi-cliente/contactos/
        """
        cliente = getattr(request.user, 'cliente', None)
        if not cliente:
            return Response(
                {'error': 'No tiene cliente vinculado'},
                status=status.HTTP_404_NOT_FOUND,
            )
        contactos = ContactoCliente.objects.filter(
            cliente=cliente, is_active=True
        ).order_by('-es_principal', 'nombre_completo')
        serializer = ContactoClienteSerializer(contactos, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary='Scoring de mi cliente (portal)',
        description='Retorna el scoring del cliente vinculado al usuario autenticado',
        tags=['Sales CRM - Portal']
    )
    @action(detail=False, methods=['get'], url_path='mi-cliente/scoring')
    def mi_cliente_scoring(self, request):
        """
        Scoring del cliente vinculado.

        GET /api/sales-crm/clientes/mi-cliente/scoring/
        """
        cliente = getattr(request.user, 'cliente', None)
        if not cliente:
            return Response(
                {'error': 'No tiene cliente vinculado'},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            scoring = ScoringCliente.objects.get(cliente=cliente)
            serializer = ScoringClienteSerializer(scoring)
            return Response(serializer.data)
        except ScoringCliente.DoesNotExist:
            return Response({
                'puntuacion_total': 0,
                'nivel_scoring': 'Sin evaluar',
                'color_nivel': 'gray',
            })

    # ── Importación masiva ────────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='plantilla-importacion')
    def plantilla_importacion(self, request):
        """
        Descarga la plantilla Excel para importación masiva de clientes.
        GET /api/sales-crm/clientes/plantilla-importacion/
        """
        import logging
        from django.http import HttpResponse
        from .import_clientes_utils import generate_cliente_import_template

        logger = logging.getLogger(__name__)

        # Obtener datos de referencia del tenant
        try:
            tipos_cliente = list(
                TipoCliente.objects.filter(activo=True)
                .values('nombre', 'codigo').order_by('nombre')
            )
        except Exception:
            tipos_cliente = []

        try:
            estados_cliente = list(
                EstadoCliente.objects.filter(activo=True)
                .values('nombre', 'codigo').order_by('nombre')
            )
        except Exception:
            estados_cliente = []

        try:
            canales_venta = list(
                CanalVenta.objects.filter(activo=True)
                .values('nombre', 'codigo').order_by('nombre')
            )
        except Exception:
            canales_venta = []

        try:
            clientes_existentes = list(
                Cliente.objects.filter(is_active=True)
                .values('razon_social', 'codigo_cliente')
                .order_by('razon_social')
            )
        except Exception:
            clientes_existentes = []

        excel_bytes = generate_cliente_import_template(
            tipos_cliente=tipos_cliente,
            estados_cliente=estados_cliente,
            canales_venta=canales_venta,
            clientes_existentes=clientes_existentes,
        )

        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="plantilla_clientes.xlsx"'
        return response

    @action(detail=False, methods=['post'], url_path='importar')
    def importar(self, request):
        """
        Importa clientes desde un archivo Excel.
        POST /api/sales-crm/clientes/importar/   multipart/form-data  campo: archivo

        Procesa fila por fila — los errores NO bloquean las filas válidas.
        Respuesta:
        {
          "creados": N,
          "actualizados": N,
          "errores": [{"fila": X, "nombre": "...", "errores": [...]}]
        }
        """
        import logging
        from django.db import transaction

        logger = logging.getLogger(__name__)

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
            from .import_clientes_utils import parse_cliente_excel, CLIENTE_COLUMNAS
            contenido = archivo.read()
            filas = parse_cliente_excel(contenido)
        except Exception as e:
            logger.error('Error parseando archivo de importación de clientes: %s', e, exc_info=True)
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

        from .import_clientes_serializer import ClienteImportRowSerializer

        for fila_raw in filas:
            num_fila = fila_raw.pop('_fila', '?')
            nombre_raw = str(fila_raw.get('razon_social', '')).strip()

            datos = {col: fila_raw.get(col, '') for col in CLIENTE_COLUMNAS}

            serializer = ClienteImportRowSerializer(data=datos)
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
            tipo_cliente = vdata.pop('_tipo_cliente')
            canal_venta = vdata.pop('_canal_venta')
            estado_cliente = vdata.pop('_estado_cliente')
            empresa = vdata.pop('_empresa')

            # Limpiar campos auxiliares
            for key in ['tipo_cliente_nombre', 'canal_venta_nombre']:
                vdata.pop(key, None)

            from decimal import Decimal

            cliente_data = {
                'empresa': empresa,
                'tipo_documento': vdata.pop('tipo_documento'),
                'numero_documento': vdata.pop('numero_documento'),
                'razon_social': vdata.pop('razon_social'),
                'nombre_comercial': vdata.pop('nombre_comercial', ''),
                'tipo_cliente': tipo_cliente,
                'estado_cliente': estado_cliente,
                'canal_venta': canal_venta,
                'telefono': vdata.pop('telefono', ''),
                'email': vdata.pop('email', ''),
                'direccion': vdata.pop('direccion', ''),
                'ciudad': vdata.pop('ciudad', ''),
                'departamento': vdata.pop('departamento', ''),
                'plazo_pago_dias': vdata.pop('plazo_pago_dias', 30),
                'cupo_credito': Decimal(vdata.pop('cupo_credito', '0.00')),
                'descuento_comercial': Decimal(vdata.pop('descuento_comercial', '0.00')),
                'observaciones': vdata.pop('observaciones', ''),
                'created_by': user,
            }

            try:
                with transaction.atomic():
                    cli = Cliente(**cliente_data)
                    cli.full_clean()
                    cli.save()
                    creados += 1

            except Exception as e:
                logger.error(
                    'Error importando cliente fila %s (%s): %s',
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
# VIEWSETS DE CONTACTOS
# ==============================================================================

class ContactoClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para contactos de clientes.

    list: Listar contactos
    retrieve: Obtener detalle de un contacto
    create: Crear nuevo contacto
    update: Actualizar contacto
    partial_update: Actualizar parcialmente contacto
    destroy: Eliminar contacto (soft delete)
    """
    serializer_class = ContactoClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cliente', 'es_principal', 'is_active']
    search_fields = ['nombre_completo', 'cargo', 'email', 'telefono']
    ordering_fields = ['nombre_completo', 'created_at']
    ordering = ['-es_principal', 'nombre_completo']

    def get_queryset(self):
        """Filtrar contactos por tenant (schema isolation)."""
        queryset = ContactoCliente.objects.select_related('cliente').all()

        # Filtrar por cliente si se especifica
        cliente_id = self.request.query_params.get('cliente', None)
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)

        return queryset

    def perform_create(self, serializer):
        """Asignar empresa al crear contacto."""
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)


# ==============================================================================
# VIEWSETS DE SEGMENTACIÓN
# ==============================================================================

class SegmentoClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para segmentos de clientes.

    list: Listar segmentos
    retrieve: Obtener detalle de un segmento
    create: Crear nuevo segmento
    update: Actualizar segmento
    partial_update: Actualizar parcialmente segmento
    destroy: Eliminar segmento (soft delete)
    """
    serializer_class = SegmentoClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']

    def get_queryset(self):
        """Filtrar segmentos por tenant (schema isolation)."""
        return SegmentoCliente.objects.prefetch_related('clientes').all()

    def perform_create(self, serializer):
        """Asignar empresa al crear segmento."""
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)


class ClienteSegmentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para asignaciones cliente-segmento.

    list: Listar asignaciones
    retrieve: Obtener detalle de una asignación
    create: Crear nueva asignación
    update: Actualizar asignación
    partial_update: Actualizar parcialmente asignación
    destroy: Eliminar asignación (soft delete)
    """
    serializer_class = ClienteSegmentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cliente', 'segmento', 'is_active']
    search_fields = ['cliente__razon_social', 'segmento__nombre']
    ordering_fields = ['fecha_asignacion']
    ordering = ['-fecha_asignacion']

    def get_queryset(self):
        """Filtrar asignaciones por tenant (schema isolation)."""
        return ClienteSegmento.objects.select_related(
            'cliente', 'segmento', 'asignado_por'
        ).all()

    def perform_create(self, serializer):
        """Asignar empresa y usuario al crear asignación."""
        serializer.save(
            empresa=get_tenant_empresa(),
            asignado_por=self.request.user,
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)


# ==============================================================================
# VIEWSETS DE INTERACCIONES
# ==============================================================================

class InteraccionClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para interacciones con clientes.

    list: Listar interacciones
    retrieve: Obtener detalle de una interacción
    create: Registrar nueva interacción
    update: Actualizar interacción
    partial_update: Actualizar parcialmente interacción
    destroy: Eliminar interacción (soft delete)

    Acciones adicionales:
    - proximas_acciones: Listar seguimientos pendientes
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'cliente', 'tipo_interaccion', 'registrado_por', 'is_active'
    ]
    search_fields = ['descripcion', 'resultado', 'cliente__razon_social']
    ordering_fields = ['fecha', 'fecha_proxima_accion', 'created_at']
    ordering = ['-fecha']

    def get_queryset(self):
        """Filtrar interacciones por tenant (schema isolation)."""
        queryset = InteraccionCliente.objects.select_related(
            'cliente', 'registrado_por', 'created_by'
        )

        # Filtros adicionales
        cliente_id = self.request.query_params.get('cliente', None)
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)

        tipo = self.request.query_params.get('tipo_interaccion', None)
        if tipo:
            queryset = queryset.filter(tipo_interaccion=tipo)

        # Filtrar solo con próximas acciones
        con_seguimiento = self.request.query_params.get('con_seguimiento', None)
        if con_seguimiento == 'true':
            queryset = queryset.filter(
                fecha_proxima_accion__isnull=False,
                fecha_proxima_accion__gte=timezone.now().date()
            )

        return queryset

    def get_serializer_class(self):
        """Usar serializer según la acción."""
        if self.action == 'list':
            return InteraccionClienteListSerializer
        return InteraccionClienteSerializer

    def perform_create(self, serializer):
        """Asignar empresa y usuario al crear interacción."""
        serializer.save(
            empresa=get_tenant_empresa(),
            registrado_por=self.request.user,
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='proximas-acciones')
    def proximas_acciones(self, request):
        """
        Listar seguimientos pendientes.

        GET /api/sales-crm/interacciones/proximas_acciones/

        Retorna interacciones con próxima acción programada.
        """
        # Obtener interacciones con seguimiento pendiente
        hoy = timezone.now().date()
        proximos_7_dias = hoy + timedelta(days=7)

        pendientes = InteraccionCliente.objects.filter(
            is_active=True,
            fecha_proxima_accion__isnull=False,
            fecha_proxima_accion__gte=hoy
        ).select_related('cliente', 'registrado_por').order_by('fecha_proxima_accion')

        # Agrupar por período
        hoy_list = list(pendientes.filter(fecha_proxima_accion=hoy).values(
            'id', 'cliente__razon_social', 'tipo_interaccion',
            'proxima_accion', 'fecha_proxima_accion', 'registrado_por__first_name'
        ))

        proximos_dias = list(pendientes.filter(
            fecha_proxima_accion__gt=hoy,
            fecha_proxima_accion__lte=proximos_7_dias
        ).values(
            'id', 'cliente__razon_social', 'tipo_interaccion',
            'proxima_accion', 'fecha_proxima_accion', 'registrado_por__first_name'
        ))

        futuras = list(pendientes.filter(
            fecha_proxima_accion__gt=proximos_7_dias
        ).values(
            'id', 'cliente__razon_social', 'tipo_interaccion',
            'proxima_accion', 'fecha_proxima_accion', 'registrado_por__first_name'
        ))

        return Response({
            'hoy': hoy_list,
            'proximos_7_dias': proximos_dias,
            'futuras': futuras,
            'total_pendientes': pendientes.count()
        })


# ==============================================================================
# VIEWSETS DE SCORING
# ==============================================================================

class ScoringClienteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para scoring de clientes (solo lectura).

    list: Listar scorings
    retrieve: Obtener detalle de un scoring

    El scoring se calcula automáticamente, no se puede crear o modificar manualmente.
    """
    serializer_class = ScoringClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['cliente']
    ordering_fields = ['puntuacion_total', 'ultima_actualizacion']
    ordering = ['-puntuacion_total']

    def get_queryset(self):
        """Filtrar scorings por tenant (schema isolation)."""
        queryset = ScoringCliente.objects.select_related('cliente').all()

        # Filtrar por nivel de scoring
        nivel = self.request.query_params.get('nivel', None)
        if nivel == 'EXCELENTE':
            queryset = queryset.filter(puntuacion_total__gte=80)
        elif nivel == 'BUENO':
            queryset = queryset.filter(puntuacion_total__gte=60, puntuacion_total__lt=80)
        elif nivel == 'REGULAR':
            queryset = queryset.filter(puntuacion_total__gte=40, puntuacion_total__lt=60)
        elif nivel == 'BAJO':
            queryset = queryset.filter(puntuacion_total__lt=40)

        return queryset
