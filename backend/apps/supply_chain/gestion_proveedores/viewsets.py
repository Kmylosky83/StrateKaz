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
from apps.core.utils.impersonation import get_effective_user

from .models import (
    # Catálogos dinámicos (propios de Supply Chain)
    CategoriaMateriaPrima,
    TipoMateriaPrima,
    TipoProveedor,
    ModalidadLogistica,
    FormaPago,
    TipoCuentaBancaria,
    # NOTA: TipoDocumentoIdentidad, Departamento, Ciudad → migrados a Core (C0)
    # NOTA: UnidadNegocio → Migrado a Fundación (configuracion)
    # Modelos principales
    Proveedor,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
    CondicionComercialProveedor,
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
    # NOTA: TipoDocumentoIdentidad/Departamento/Ciudad serializers → Core (C0)
    # NOTA: UnidadNegocioSerializer → Migrado a Fundación (configuracion)
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
    # Evaluación
    CriterioEvaluacionSerializer,
    EvaluacionProveedorSerializer,
    DetalleEvaluacionSerializer,
)
# PruebaAcidez → Movido a production_ops.recepcion

from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin

logger = logging.getLogger(__name__)
User = get_user_model()
from .permissions import (
    CanManageProveedores,
    CanModifyPrecioProveedor,
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


# TipoDocumentoIdentidadViewSet, DepartamentoViewSet, CiudadViewSet
# → Migrados a Core (C0): apps.core.viewsets_datos_maestros
# Endpoints ahora: /api/core/tipos-documento/, /api/core/departamentos/, /api/core/ciudades/


# ==============================================================================
# NOTA: UnidadNegocioViewSet → Migrado a Fundación (configuracion)
# Endpoint: /api/fundacion/configuracion/unidades-negocio/
# ==============================================================================


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

        # Extraer número de documento original (quitar prefijo DEL-{id}-)
        prefix = f'DEL-{proveedor.id}-'
        doc_original = proveedor.numero_documento
        if doc_original.startswith(prefix):
            doc_original = doc_original[len(prefix):]

        # Verificar que el número de documento no esté en uso por otro proveedor activo
        if Proveedor.objects.filter(
            numero_documento=doc_original,
            deleted_at__isnull=True,
        ).exclude(pk=proveedor.pk).exists():
            return Response(
                {'detail': f'Ya existe un proveedor activo con el documento {doc_original}. '
                           'Elimina o modifica ese proveedor antes de restaurar este.'},
                status=status.HTTP_400_BAD_REQUEST,
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

    def _create_user_for_proveedor(self, proveedor, email, username, cargo, created_by,
                                    existing_tenant_user=None):
        """
        Crea cuenta de usuario vinculada al proveedor.

        Si existing_tenant_user se pasa (TenantUser con password usable),
        copia el password hash y envía email de "nuevo acceso" en vez de "setup password".
        """
        from apps.core.utils.user_factory import _resolve_tenant_for_user

        # Generar document_number único por usuario (no por proveedor)
        base_doc = proveedor.numero_documento or f'PROV-{proveedor.id}'
        doc_number = base_doc
        if User.objects.filter(document_number=base_doc).exists():
            doc_number = f'{base_doc}-{uuid.uuid4().hex[:6]}'

        new_user = User(
            username=username,
            email=email,
            first_name=proveedor.nombre_comercial or proveedor.razon_social,
            last_name='',
            cargo=cargo,
            document_number=doc_number,
            proveedor=proveedor,
            is_active=True,
            created_by=created_by,
        )
        new_user._from_contratacion = True

        if existing_tenant_user:
            # Copiar password hash del TenantUser existente (ya configuró password en otro tenant)
            new_user.password = existing_tenant_user.password
            # NO generar setup token — el usuario ya tiene password funcional
            new_user.save()
        else:
            # Flujo normal: password temporal + token de setup
            temp_password = uuid.uuid4().hex
            new_user.set_password(temp_password)
            setup_token = uuid.uuid4().hex
            new_user.password_setup_token = setup_token
            new_user.password_setup_expires = timezone.now() + timedelta(hours=User.PASSWORD_SETUP_EXPIRY_HOURS)
            new_user.save()

        # Resolver tenant para branding del email
        tenant_id, tenant_name_resolved, primary_color, secondary_color = _resolve_tenant_for_user(new_user)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com')

        try:
            if existing_tenant_user:
                # Email de "nuevo acceso concedido" (ya tiene password)
                from apps.core.tasks import send_new_access_email_task

                login_url = f"{frontend_url}/login"
                send_new_access_email_task.delay(
                    user_email=email,
                    user_name=new_user.get_full_name() or new_user.username or proveedor.razon_social,
                    tenant_name=tenant_name_resolved,
                    cargo_name=cargo.name if cargo else '',
                    login_url=login_url,
                    primary_color=primary_color,
                    secondary_color=secondary_color,
                )
                logger.info(
                    'User %s creado para Proveedor %s (password existente), email de nuevo acceso enviado a %s',
                    new_user.id, proveedor.id, email
                )
            else:
                # Email de "configurar contraseña" (flujo normal)
                from apps.core.tasks import send_setup_password_email_task

                setup_url = f"{frontend_url}/setup-password?token={new_user.password_setup_token}&email={email}&tenant_id={tenant_id}"
                send_setup_password_email_task.delay(
                    user_email=email,
                    user_name=new_user.get_full_name() or new_user.username or proveedor.razon_social,
                    tenant_name=tenant_name_resolved,
                    cargo_name=cargo.name if cargo else '',
                    setup_url=setup_url,
                    expiry_hours=User.PASSWORD_SETUP_EXPIRY_HOURS,
                    primary_color=primary_color,
                    secondary_color=secondary_color,
                )
                logger.info(
                    'User %s creado para Proveedor %s, email de setup enviado a %s',
                    new_user.id, proveedor.id, email
                )
        except Exception as e:
            logger.error(
                'Error enviando email para User %s (Proveedor %s): %s',
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
        Crea cuenta de usuario para un proveedor existente.

        POST /api/supply-chain/proveedores/{id}/crear-acceso/
        Body: { email, username, cargo_id? }

        Lógica por tipo:
        - CONSULTOR/CONTRATISTA con cargo_id: profesional colocado (acceso a módulos)
        - CONSULTOR/CONTRATISTA sin cargo_id: representante de firma (solo Portal)
        - Otros tipos: siempre cargo "Proveedor - Portal" (solo Portal)
        Permite múltiples usuarios por proveedor.
        """
        proveedor = self.get_object()

        serializer = CrearAccesoProveedorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        username = serializer.validated_data['username']
        cargo_id = serializer.validated_data.get('cargo_id')

        from django.apps import apps
        Cargo = apps.get_model('core', 'Cargo')

        if cargo_id:
            # Profesional con cargo específico (consultor/contratista colocado)
            cargo = Cargo.objects.get(id=cargo_id)
        else:
            # Representante de firma o proveedor estándar → cargo portal
            cargo, created = Cargo.objects.get_or_create(
                code='PROVEEDOR_PORTAL',
                defaults={
                    'name': 'Proveedor - Portal',
                    'is_system': True,
                    'is_active': True,
                    'is_externo': True,
                }
            )
            # Fixup: si el cargo ya existía sin is_externo, corregirlo
            if not created and not cargo.is_externo:
                cargo.is_externo = True
                cargo.save(update_fields=['is_externo'])

        # Verificar si el email ya existe en este tenant
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            # Si el usuario existente tiene proveedor eliminado → reasignar
            old_prov = existing_user.proveedor
            if old_prov and old_prov.is_deleted:
                from apps.core.utils.user_factory import _resolve_tenant_for_user

                existing_user.proveedor = proveedor
                existing_user.cargo = cargo
                existing_user.is_active = True
                existing_user.first_name = proveedor.nombre_comercial or proveedor.razon_social
                # Regenerar token de setup password
                setup_token = uuid.uuid4().hex
                existing_user.password_setup_token = setup_token
                existing_user.password_setup_expires = timezone.now() + timedelta(hours=User.PASSWORD_SETUP_EXPIRY_HOURS)
                existing_user.save()
                # Re-enviar email de setup (usando resolución robusta de tenant)
                try:
                    from apps.core.tasks import send_setup_password_email_task
                    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com')
                    tenant_id, tenant_name_r, primary_color, secondary_color = _resolve_tenant_for_user(existing_user)
                    setup_url = f"{frontend_url}/setup-password?token={setup_token}&email={email}&tenant_id={tenant_id}"
                    send_setup_password_email_task.delay(
                        user_email=email,
                        user_name=existing_user.get_full_name() or existing_user.username or tenant_name_r,
                        tenant_name=tenant_name_r,
                        cargo_name=cargo.name if cargo else '',
                        setup_url=setup_url,
                        expiry_hours=User.PASSWORD_SETUP_EXPIRY_HOURS,
                        primary_color=primary_color,
                        secondary_color=secondary_color,
                    )
                except Exception as e:
                    logger.error('Error re-enviando email de setup: %s', e, exc_info=True)

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
            old_prov = existing_by_username.proveedor
            if old_prov and old_prov.is_deleted:
                # Username tomado por usuario de proveedor eliminado → liberar
                existing_by_username.username = f'del_{existing_by_username.id}_{username}'
                existing_by_username.save(update_fields=['username'])
            else:
                return Response(
                    {'detail': 'Este nombre de usuario ya existe.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # MB-TENANT: Detectar si ya existe TenantUser con password configurado
        # (proveedor ya tiene cuenta en otro tenant → no forzar setup de password)
        existing_tenant_user = None
        try:
            from apps.tenant.models import TenantUser
            from django.contrib.auth.hashers import is_password_usable

            tu = TenantUser.objects.filter(
                user_email=email.lower().strip(), is_active=True
            ).first()
            if tu and tu.password and is_password_usable(tu.password):
                existing_tenant_user = tu
        except Exception:
            pass

        self._create_user_for_proveedor(
            proveedor, email, username, cargo, request.user,
            existing_tenant_user=existing_tenant_user,
        )

        if existing_tenant_user:
            return Response({
                'detail': 'Acceso al sistema creado exitosamente. Se envió un correo de notificación.',
            })
        return Response({
            'detail': 'Acceso al sistema creado exitosamente. Se envió un correo para configurar la contraseña.',
        })

    # ==========================================================================
    # ESTADÍSTICAS
    # ==========================================================================

    @action(
        detail=False,
        methods=['get'],
        url_path='estadisticas',
        permission_classes=[IsAuthenticated],
    )
    def estadisticas(self, request):
        """
        Estadísticas generales de proveedores.

        GET /api/supply-chain/proveedores/estadisticas/
        """
        base_qs = Proveedor.objects.filter(deleted_at__isnull=True)

        total = base_qs.count()
        activos = base_qs.filter(is_active=True).count()
        inactivos = base_qs.filter(is_active=False).count()

        # Por tipo
        por_tipo = list(
            base_qs.values('tipo_proveedor__nombre')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        por_tipo_clean = [
            {'tipo': item['tipo_proveedor__nombre'] or 'Sin tipo', 'count': item['count']}
            for item in por_tipo
        ]

        # Calificación promedio (de evaluaciones completadas)
        calificacion = EvaluacionProveedor.objects.filter(
            estado='COMPLETADA',
            calificacion_total__isnull=False,
        ).aggregate(promedio=Avg('calificacion_total'))['promedio']

        # Total materias primas únicas
        total_materias = TipoMateriaPrima.objects.filter(is_active=True).count()

        return Response({
            'total_proveedores': total,
            'proveedores_activos': activos,
            'proveedores_inactivos': inactivos,
            'por_tipo': por_tipo_clean,
            'calificacion_promedio': round(float(calificacion), 1) if calificacion else None,
            'total_materias_primas': total_materias,
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
        proveedor = getattr(get_effective_user(request), 'proveedor', None)
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
        proveedor = getattr(get_effective_user(request), 'proveedor', None)
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
        proveedor = getattr(get_effective_user(request), 'proveedor', None)
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

    @action(
        detail=False,
        methods=['get'],
        url_path='mi-empresa/precios',
        permission_classes=[IsAuthenticated],
    )
    def mi_empresa_precios(self, request):
        """
        Retorna los precios de materia prima del proveedor vinculado.

        GET /api/supply-chain/proveedores/mi-empresa/precios/

        Solo disponible para proveedores que manejan materia prima.
        """
        proveedor = getattr(get_effective_user(request), 'proveedor', None)
        if not proveedor:
            return Response(
                {'detail': 'No tienes un proveedor vinculado a tu cuenta.'},
                status=status.HTTP_404_NOT_FOUND
            )

        precios = PrecioMateriaPrima.objects.filter(
            proveedor=proveedor
        ).select_related(
            'tipo_materia__categoria', 'modificado_por'
        ).order_by('tipo_materia__categoria__orden', 'tipo_materia__orden')

        serializer = PrecioMateriaPrimaSerializer(precios, many=True)
        return Response(serializer.data)

    # ==========================================================================
    # PORTAL PROVEEDOR — Gestión de Profesionales (Consultoras)
    # ==========================================================================

    @action(
        detail=False,
        methods=['get'],
        url_path='mi-empresa/profesionales',
        permission_classes=[IsAuthenticated],
    )
    def mi_empresa_profesionales(self, request):
        """
        Lista usuarios vinculados al mismo proveedor.

        GET /api/supply-chain/proveedores/mi-empresa/profesionales/

        Permite a la firma consultora ver y gestionar los profesionales
        que ha colocado en la empresa cliente.
        Solo disponible para proveedores tipo CONSULTOR.
        """
        proveedor = getattr(get_effective_user(request), 'proveedor', None)
        if not proveedor:
            return Response(
                {'detail': 'No tienes un proveedor vinculado a tu cuenta.'},
                status=status.HTTP_404_NOT_FOUND
            )

        tipo_codigo = proveedor.tipo_proveedor.codigo if proveedor.tipo_proveedor else ''
        if tipo_codigo != 'CONSULTOR':
            return Response(
                {'detail': 'Esta funcionalidad solo está disponible para consultores.'},
                status=status.HTTP_403_FORBIDDEN
            )

        usuarios = User.objects.filter(
            proveedor=proveedor
        ).select_related('cargo').order_by('-date_joined')

        data = []
        for u in usuarios:
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'full_name': u.get_full_name(),
                'cargo_name': u.cargo.name if u.cargo else None,
                'is_active': u.is_active,
                'last_login': u.last_login.isoformat() if u.last_login else None,
                'date_joined': u.date_joined.isoformat() if u.date_joined else None,
                'es_yo': u.id == request.user.id,
            })

        return Response(data)

    @action(
        detail=False,
        methods=['patch'],
        url_path=r'mi-empresa/profesionales/(?P<user_id>[^/.]+)/toggle-estado',
        permission_classes=[IsAuthenticated],
    )
    def mi_empresa_profesionales_toggle(self, request, user_id=None):
        """
        Activa/desactiva un profesional vinculado al mismo proveedor.

        PATCH /api/supply-chain/proveedores/mi-empresa/profesionales/{user_id}/toggle-estado/

        Seguridad:
        - Solo disponible para proveedores tipo CONSULTOR
        - Solo puede gestionar usuarios del MISMO proveedor
        - No puede desactivar su propia cuenta
        """
        proveedor = getattr(get_effective_user(request), 'proveedor', None)
        if not proveedor:
            return Response(
                {'detail': 'No tienes un proveedor vinculado a tu cuenta.'},
                status=status.HTTP_404_NOT_FOUND
            )

        tipo_codigo = proveedor.tipo_proveedor.codigo if proveedor.tipo_proveedor else ''
        if tipo_codigo != 'CONSULTOR':
            return Response(
                {'detail': 'Esta funcionalidad solo está disponible para consultores.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            target_user = User.objects.get(id=user_id, proveedor=proveedor)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado o no pertenece a tu empresa.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if target_user.id == request.user.id:
            return Response(
                {'detail': 'No puedes desactivar tu propia cuenta.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        target_user.is_active = not target_user.is_active
        target_user.save(update_fields=['is_active'])

        accion = 'activado' if target_user.is_active else 'desactivado'
        logger.info(
            'Profesional %s (User %d) %s por User %d (Proveedor %d)',
            target_user.email, target_user.id, accion,
            request.user.id, proveedor.id
        )

        return Response({
            'detail': f'Usuario {accion} exitosamente.',
            'is_active': target_user.is_active,
        })

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
        con_acceso = 0
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

            # Extraer campos de acceso al portal
            crear_acceso = vdata.pop('_crear_acceso', False)
            email_portal = vdata.pop('_email_portal', None)
            username_portal = vdata.pop('_username', None)

            # Limpiar campos auxiliares
            for key in [
                'tipo_proveedor_nombre', 'tipo_documento_nombre', 'departamento_nombre',
                'crear_acceso', 'email_portal', 'username',
            ]:
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

                    # Crear acceso al portal si se solicitó
                    if crear_acceso and email_portal and username_portal:
                        from django.apps import apps as django_apps
                        Cargo = django_apps.get_model('core', 'Cargo')
                        cargo_portal, _ = Cargo.objects.get_or_create(
                            code='PROVEEDOR_PORTAL',
                            defaults={
                                'name': 'Proveedor - Portal',
                                'is_system': True,
                                'is_active': True,
                                'is_externo': True,
                            }
                        )
                        self._create_user_for_proveedor(
                            prov, email_portal, username_portal,
                            cargo_portal, user
                        )
                        con_acceso += 1

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
            'con_acceso': con_acceso,
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


# PruebaAcidezViewSet → Movido a production_ops.recepcion.views


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
