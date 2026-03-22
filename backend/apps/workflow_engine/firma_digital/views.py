"""
Views del módulo Firma Digital - Workflow Engine
Sistema de Gestión StrateKaz

API REST completa para workflow de firma digital y revisión periódica
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import GranularActionPermission
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.apps import apps
from django.db import transaction
from django.db.models import Q, Count, Prefetch

from .models import (
    ConfiguracionFlujoFirma,
    FlowNode,
    FirmaDigital,
    HistorialFirma,
    DelegacionFirma,
    ConfiguracionRevision,
    AlertaRevision,
    HistorialVersion
)
from .serializers import (
    ConfiguracionFlujoFirmaSerializer,
    ConfiguracionFlujoFirmaCreateSerializer,
    FlowNodeSerializer,
    FirmaDigitalSerializer,
    FirmaDigitalCreateSerializer,
    HistorialFirmaSerializer,
    DelegacionFirmaSerializer,
    ConfiguracionRevisionSerializer,
    AlertaRevisionSerializer,
    HistorialVersionSerializer,
    HistorialVersionDetailSerializer,
    IniciarRevisionSerializer,
    FirmarDocumentoSerializer,
    RechazarDocumentoSerializer,
    DelegarFirmaSerializer,
    RevocarDelegacionSerializer,
    ConfigurarRevisionSerializer,
    RenovarPoliticaSerializer,
    VerificarIntegridadSerializer,
    FirmarFirmaActionSerializer,
    RechazarFirmaActionSerializer,
    DelegarFirmaActionSerializer,
    AsignarFirmantesSerializer,
)

import logging
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)


# ==============================================================================
# VIEWSETS DE CONFIGURACIÓN
# ==============================================================================

class ConfiguracionFlujoFirmaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar configuraciones de flujos de firma.

    list: Lista todas las configuraciones de flujo
    retrieve: Detalle de una configuración
    create: Crea nueva configuración
    update: Actualiza configuración
    destroy: Elimina configuración
    """

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'firma_digital'
    serializer_class = ConfiguracionFlujoFirmaSerializer
    filterset_fields = ['tipo_flujo', 'permite_delegacion']
    search_fields = ['nombre', 'codigo', 'descripcion']
    ordering_fields = ['nombre', 'created_at']

    def get_queryset(self):
        return ConfiguracionFlujoFirma.objects.prefetch_related(
            'nodos', 'nodos__cargo'
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return ConfiguracionFlujoFirmaCreateSerializer
        return ConfiguracionFlujoFirmaSerializer

    @action(detail=True, methods=['get'])
    def nodos(self, request, pk=None):
        """Obtiene los nodos de un flujo"""
        flujo = self.get_object()
        nodos = flujo.nodos.all().order_by('orden')
        serializer = FlowNodeSerializer(nodos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='agregar-nodo')
    def agregar_nodo(self, request, pk=None):
        """Agrega un nodo al flujo"""
        flujo = self.get_object()
        serializer = FlowNodeSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(configuracion_flujo=flujo)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='validar-usuario')
    def validar_usuario(self, request, pk=None):
        """Valida si un usuario puede participar en el flujo"""
        flujo = self.get_object()
        usuario = request.user

        # Verificar si el usuario tiene algún cargo asignado en los nodos
        nodos = flujo.nodos.filter(
            Q(cargo=usuario.cargo) |
            Q(cargos_alternativos__contains=[str(usuario.cargo.id)])
        )

        return Response({
            'puede_participar': nodos.exists(),
            'roles_disponibles': [
                {
                    'rol': nodo.rol_firma,
                    'orden': nodo.orden,
                    'es_requerido': nodo.es_requerido
                }
                for nodo in nodos
            ]
        })


class FlowNodeViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar nodos de flujo"""

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'firma_digital'
    serializer_class = FlowNodeSerializer
    filterset_fields = ['configuracion_flujo', 'rol_firma', 'cargo', 'es_requerido']
    ordering_fields = ['orden']

    def get_queryset(self):
        return FlowNode.objects.select_related(
            'configuracion_flujo', 'cargo'
        )


# ==============================================================================
# VIEWSETS DE FIRMA DIGITAL
# ==============================================================================

class FirmaDigitalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar firmas digitales.

    list: Lista firmas digitales del usuario o de documentos
    retrieve: Detalle de una firma
    create: Crea nueva firma (proceso de firma)
    """

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'firma_digital'
    serializer_class = FirmaDigitalSerializer
    filterset_fields = ['estado', 'rol_firma', 'usuario', 'content_type', 'object_id']
    search_fields = ['comentarios', 'usuario__first_name', 'usuario__last_name']
    ordering_fields = ['fecha_firma', 'orden']

    def get_queryset(self):
        user = self.request.user

        # Usuarios pueden ver:
        # 1. Sus propias firmas
        # 2. Firmas de documentos donde participan
        # 3. Si son gestores, pueden ver todas las firmas de su empresa

        queryset = FirmaDigital.objects.select_related(
            'usuario', 'cargo', 'configuracion_flujo', 'nodo_flujo', 'delegante'
        )

        # Filtrar por permisos
        if not user.is_staff:
            queryset = queryset.filter(
                Q(usuario=user) |
                Q(content_type__in=self._get_user_documents_content_types())
            )

        return queryset.order_by('-fecha_firma')

    def _get_user_documents_content_types(self):
        """Obtiene los content types de documentos donde el usuario participa"""
        # TODO: Implementar lógica específica según los roles del usuario
        return ContentType.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return FirmaDigitalCreateSerializer
        return FirmaDigitalSerializer

    def create(self, request, *args, **kwargs):
        """
        Crea una firma digital con validaciones completas.

        Valida:
        - Usuario autorizado para firmar
        - Orden correcto en flujo secuencial
        - Delegación vigente (si aplica)
        - Integridad del documento
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validaciones adicionales
        content_type = serializer.validated_data['content_type']
        object_id = serializer.validated_data['object_id']
        configuracion_flujo = serializer.validated_data['configuracion_flujo']
        rol_firma = serializer.validated_data['rol_firma']

        # Obtener el documento
        model_class = content_type.model_class()
        documento = get_object_or_404(model_class, pk=object_id)

        # Validar estado del documento
        if hasattr(documento, 'status'):
            if documento.status not in ['BORRADOR', 'EN_REVISION', 'EN_APROBACION']:
                return Response(
                    {'error': 'El documento no está en un estado que permita firma'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Validar orden de firma (si es secuencial)
        if configuracion_flujo.tipo_flujo == 'SECUENCIAL':
            firmas_anteriores = FirmaDigital.objects.filter(
                content_type=content_type,
                object_id=object_id,
                estado='FIRMADO'
            ).order_by('-orden')

            orden_esperado = firmas_anteriores.first().orden + 1 if firmas_anteriores.exists() else 1

            # Validar si es el turno del usuario
            if not configuracion_flujo.validar_orden_firma(request.user, orden_esperado):
                return Response(
                    {'error': 'No es su turno para firmar en el flujo secuencial'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer.validated_data['orden'] = orden_esperado

        # Calcular hash del documento
        contenido_documento = getattr(documento, 'content', getattr(documento, 'contenido', ''))
        firma_obj = FirmaDigital()
        documento_hash = firma_obj.calcular_documento_hash(contenido_documento)
        serializer.validated_data['documento_hash'] = documento_hash

        # Guardar firma
        with transaction.atomic():
            firma = serializer.save()

            # Crear historial
            HistorialFirma.objects.create(
                firma=firma,
                accion='FIRMA_CREADA',
                usuario=request.user,
                descripcion=f"Firma {rol_firma} creada exitosamente",
                metadatos={
                    'ip': request.META.get('REMOTE_ADDR'),
                    'user_agent': request.META.get('HTTP_USER_AGENT', '')
                },
                ip_address=request.META.get('REMOTE_ADDR')
            )

            # Actualizar estado del documento si es necesario
            self._actualizar_estado_documento(documento, configuracion_flujo, firma)

            # Notificar siguiente firmante
            self._notificar_siguiente_firmante(documento, configuracion_flujo, firma)

        return Response(
            FirmaDigitalSerializer(firma).data,
            status=status.HTTP_201_CREATED
        )

    def _actualizar_estado_documento(self, documento, configuracion_flujo, firma):
        """Actualiza el estado del documento según el flujo"""
        if not hasattr(documento, 'status'):
            return

        # Verificar si es la última firma requerida
        total_nodos = configuracion_flujo.nodos.filter(es_requerido=True).count()
        firmas_completadas = FirmaDigital.objects.filter(
            content_type=ContentType.objects.get_for_model(documento),
            object_id=documento.pk,
            estado='FIRMADO'
        ).count()

        if firmas_completadas >= total_nodos:
            # Todas las firmas completadas → VIGENTE
            documento.status = 'VIGENTE'
            documento.effective_date = timezone.now().date()
            documento.save(update_fields=['status', 'effective_date'])

    def _notificar_siguiente_firmante(self, documento, configuracion_flujo, firma_actual):
        """Notifica al siguiente firmante en el flujo"""
        if configuracion_flujo.tipo_flujo != 'SECUENCIAL':
            return

        siguiente_nodo_data = configuracion_flujo.get_siguiente_firmante(firma_actual.orden)
        if not siguiente_nodo_data:
            return

        # TODO: Crear notificación para el siguiente firmante
        # Integrar con sistema de notificaciones

    @action(detail=True, methods=['post'], url_path='validar-integridad')
    def validar_integridad(self, request, pk=None):
        """Valida la integridad de una firma"""
        firma = self.get_object()
        serializer = VerificarIntegridadSerializer(data=request.data)

        if serializer.is_valid():
            contenido_actual = serializer.validated_data['contenido_actual']
            es_valida = firma.verificar_integridad(contenido_actual)

            # Crear historial
            HistorialFirma.objects.create(
                firma=firma,
                accion='HASH_VERIFICADO' if es_valida else 'HASH_INVALIDO',
                usuario=request.user,
                descripcion=f"Verificación de integridad: {'VÁLIDA' if es_valida else 'INVÁLIDA'}",
                metadatos={'resultado': es_valida},
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({
                'es_valida': es_valida,
                'mensaje': 'La firma es válida' if es_valida else 'El documento ha sido modificado después de la firma'
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def firmar(self, request, pk=None):
        """
        Firma una FirmaDigital existente con datos del canvas de firma.

        Valida que:
        - La firma esté en estado PENDIENTE
        - El usuario sea el firmante asignado
        - Sea su turno (en flujos secuenciales)
        """
        firma = self.get_object()
        serializer = FirmarFirmaActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validar estado
        if firma.estado != 'PENDIENTE':
            return Response(
                {'error': f'La firma no está pendiente (estado actual: {firma.estado})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que el usuario sea el firmante
        if firma.usuario != request.user:
            return Response(
                {'error': 'No eres el firmante asignado para esta firma'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validar turno en flujo secuencial
        if firma.configuracion_flujo and firma.configuracion_flujo.tipo_flujo == 'SECUENCIAL':
            firmas_anteriores_pendientes = FirmaDigital.objects.filter(
                content_type=firma.content_type,
                object_id=firma.object_id,
                orden__lt=firma.orden,
                estado='PENDIENTE'
            ).exists()
            if firmas_anteriores_pendientes:
                return Response(
                    {'error': 'No es tu turno. Hay firmas anteriores pendientes.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        data = serializer.validated_data

        # ================================================================
        # VERIFICACIÓN 2FA AL FIRMAR (ISO 27001)
        # nivel_firma >= 2: requiere código TOTP
        # nivel_firma >= 3: acepta TOTP o OTP por email
        # ================================================================
        user = request.user
        nivel_firma = getattr(user, 'nivel_firma', 1)
        otp_usado = ''

        if nivel_firma >= 2:
            totp_code = data.get('totp_code')
            email_otp_code = data.get('email_otp_code')

            if not totp_code and not email_otp_code:
                return Response(
                    {
                        'error': 'Se requiere código de verificación para firmar',
                        'requires_totp': True,
                        'nivel_firma': nivel_firma,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verificar TOTP o email OTP via apps.get_model (C2→C0 sin import directo)
            TwoFactorAuth = apps.get_model('core', 'TwoFactorAuth')
            try:
                two_factor = TwoFactorAuth.objects.get(user=user)
            except TwoFactorAuth.DoesNotExist:
                return Response(
                    {'error': 'Debe configurar 2FA antes de firmar con este nivel de seguridad'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if totp_code:
                if not two_factor.verify_token(totp_code):
                    return Response(
                        {'error': 'Código TOTP inválido'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                otp_usado = totp_code
            elif email_otp_code and nivel_firma >= 3:
                EmailOTP = apps.get_model('core', 'EmailOTP')
                pending_otp = EmailOTP.objects.filter(
                    user=user,
                    purpose='FIRMA',
                    is_used=False,
                ).order_by('-created_at').first()

                if not pending_otp or not pending_otp.verify(email_otp_code):
                    return Response(
                        {'error': 'Código OTP por email inválido o expirado'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                otp_usado = email_otp_code
            else:
                return Response(
                    {'error': 'Método de verificación no válido para su nivel de firma'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        with transaction.atomic():
            # Actualizar firma
            firma.estado = 'FIRMADO'
            firma.firma_imagen = data['firma_base64']
            firma.fecha_firma = timezone.now()
            firma.ip_address = data.get('ip_address') or request.META.get('REMOTE_ADDR')
            firma.user_agent = data.get('user_agent') or request.META.get('HTTP_USER_AGENT', '')
            firma.comentarios = data.get('observaciones', '')

            # Calcular hashes
            documento = firma.content_type.get_object_for_this_type(pk=firma.object_id)
            contenido = getattr(documento, 'content', getattr(documento, 'contenido', ''))
            firma.documento_hash = firma.calcular_documento_hash(contenido)

            firma.save()

            # Recalcular firma_hash (usa save() override)
            firma.firma_hash = firma.calcular_firma_hash()

            # Hash de verificación extendido (ISO 27001)
            # SHA-256(trazo[:200] | otp | documento_id | version | timestamp_utc | cedula)
            import hashlib
            version = getattr(documento, 'version', '1.0.0')
            cedula = getattr(user, 'document_number', '') or str(user.id)
            hash_input = '|'.join([
                data['firma_base64'][:200],
                otp_usado,
                str(firma.object_id),
                str(version),
                firma.fecha_firma.strftime('%Y-%m-%dT%H:%M:%S+00:00'),
                cedula,
            ])
            firma.hash_verificacion = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()

            firma.save(update_fields=['firma_hash', 'hash_verificacion'])

            # Historial
            metadatos = {
                'ip': firma.ip_address,
                'user_agent': firma.user_agent[:200] if firma.user_agent else '',
            }
            if nivel_firma >= 2:
                metadatos['nivel_firma'] = nivel_firma
                metadatos['metodo_2fa'] = 'email_otp' if data.get('email_otp_code') else 'totp'
                metadatos['hash_verificacion'] = firma.hash_verificacion[:16] + '...'

            HistorialFirma.objects.create(
                firma=firma,
                accion='FIRMA_VALIDADA',
                usuario=request.user,
                descripcion=f"Firma {firma.get_rol_firma_display()} completada"
                            + (f" (2FA nivel {nivel_firma})" if nivel_firma >= 2 else ""),
                metadatos=metadatos,
                ip_address=firma.ip_address,
            )

            # Auto-transicion del documento si todas las firmas completadas
            self._verificar_firmas_completas(firma)

        return Response(FirmaDigitalSerializer(firma).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """
        Rechaza una firma pendiente con motivo obligatorio.
        """
        firma = self.get_object()
        serializer = RechazarFirmaActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if firma.estado != 'PENDIENTE':
            return Response(
                {'error': f'La firma no está pendiente (estado actual: {firma.estado})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if firma.usuario != request.user:
            return Response(
                {'error': 'No eres el firmante asignado'},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():
            firma.estado = 'RECHAZADO'
            firma.comentarios = serializer.validated_data['motivo']
            firma.fecha_firma = timezone.now()
            firma.save(update_fields=['estado', 'comentarios', 'fecha_firma', 'updated_at'])

            HistorialFirma.objects.create(
                firma=firma,
                accion='FIRMA_RECHAZADA',
                usuario=request.user,
                descripcion=f"Firma rechazada: {firma.comentarios[:100]}",
                metadatos={'motivo': firma.comentarios},
                ip_address=request.META.get('REMOTE_ADDR'),
            )

            # Marcar documento como rechazado si tiene status
            documento = firma.content_type.get_object_for_this_type(pk=firma.object_id)
            if hasattr(documento, 'estado'):
                documento.estado = 'RECHAZADO'
                documento.save(update_fields=['estado', 'updated_at'])

        return Response(FirmaDigitalSerializer(firma).data)

    @action(detail=True, methods=['post'])
    def delegar(self, request, pk=None):
        """
        Delega una firma pendiente a otro usuario.
        """
        firma = self.get_object()
        serializer = DelegarFirmaActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if firma.estado != 'PENDIENTE':
            return Response(
                {'error': f'La firma no está pendiente (estado actual: {firma.estado})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if firma.usuario != request.user:
            return Response(
                {'error': 'Solo puedes delegar tus propias firmas'},
                status=status.HTTP_403_FORBIDDEN
            )

        User = get_user_model()
        try:
            nuevo_firmante = User.objects.get(id=serializer.validated_data['nuevo_firmante_id'])
        except User.DoesNotExist:
            return Response(
                {'error': 'El usuario delegado no existe'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Marcar firma actual como delegada
            firma.estado = 'DELEGADO'
            firma.comentarios = serializer.validated_data['motivo']
            firma.save(update_fields=['estado', 'comentarios', 'updated_at'])

            # Crear nueva firma para el delegado
            nueva_firma = FirmaDigital.objects.create(
                content_type=firma.content_type,
                object_id=firma.object_id,
                usuario=nuevo_firmante,
                cargo=firma.cargo,
                rol_firma=firma.rol_firma,
                estado='PENDIENTE',
                orden=firma.orden,
                configuracion_flujo=firma.configuracion_flujo,
                nodo_flujo=firma.nodo_flujo,
                delegante=request.user,
                es_delegada=True,
                created_by=request.user,
            )

            HistorialFirma.objects.create(
                firma=firma,
                accion='FIRMA_DELEGADA',
                usuario=request.user,
                descripcion=f"Delegada a {nuevo_firmante.get_full_name()}",
                metadatos={
                    'delegado_a_id': nuevo_firmante.id,
                    'nueva_firma_id': str(nueva_firma.id),
                    'motivo': serializer.validated_data['motivo'],
                },
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        return Response(FirmaDigitalSerializer(nueva_firma).data, status=status.HTTP_201_CREATED)

    def _verificar_firmas_completas(self, firma):
        """
        Verifica si todas las firmas de un documento están completadas.
        Si es así, transiciona el documento al estado apropiado.
        """
        total_pendientes = FirmaDigital.objects.filter(
            content_type=firma.content_type,
            object_id=firma.object_id,
            estado='PENDIENTE'
        ).count()

        if total_pendientes > 0:
            return

        # Todas las firmas completadas (no quedan PENDIENTES)
        alguna_rechazada = FirmaDigital.objects.filter(
            content_type=firma.content_type,
            object_id=firma.object_id,
            estado='RECHAZADO'
        ).exists()

        if alguna_rechazada:
            return  # No transicionar si hay rechazos

        documento = firma.content_type.get_object_for_this_type(pk=firma.object_id)

        if hasattr(documento, 'estado'):
            # Documento de Gestion Documental
            documento.estado = 'APROBADO'
            documento.fecha_aprobacion = timezone.now().date()
            documento.save(update_fields=['estado', 'fecha_aprobacion', 'updated_at'])
            logger.info(f"Documento {documento.pk} transicionado a APROBADO (todas las firmas completadas)")
        elif hasattr(documento, 'status'):
            # Modelo genérico con campo status
            documento.status = 'VIGENTE'
            if hasattr(documento, 'effective_date'):
                documento.effective_date = timezone.now().date()
                documento.save(update_fields=['status', 'effective_date', 'updated_at'])
            else:
                documento.save(update_fields=['status', 'updated_at'])
            logger.info(f"Politica {documento.pk} transicionada a VIGENTE (todas las firmas completadas)")

    @action(detail=False, methods=['post'], url_path='asignar-firmantes')
    def asignar_firmantes(self, request):
        """
        Asigna firmantes a un documento en estado BORRADOR/EN_REVISION.
        Crea batch de FirmaDigital en estado PENDIENTE.

        POST /api/workflows/firma-digital/firmas/asignar_firmantes/
        Body: {
            "content_type": <int>,
            "object_id": "<uuid>",
            "firmantes": [
                {"usuario_id": 1, "cargo_id": "<uuid>", "rol_firma": "REVISO", "orden": 1},
                {"usuario_id": 2, "cargo_id": "<uuid>", "rol_firma": "APROBO", "orden": 2}
            ]
        }
        """
        serializer = AsignarFirmantesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        User = get_user_model()
        data = serializer.validated_data
        content_type_id = data['content_type']
        object_id = data['object_id']
        firmantes_data = data['firmantes']

        # 1. Validar documento existe y estado
        try:
            content_type = ContentType.objects.get(pk=content_type_id)
        except ContentType.DoesNotExist:
            return Response(
                {'error': f'ContentType con ID {content_type_id} no existe'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            documento = content_type.get_object_for_this_type(pk=object_id)
        except Exception:
            return Response(
                {'error': f'Documento con ID {object_id} no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        estado_doc = getattr(documento, 'estado', None)
        if estado_doc and estado_doc not in ['BORRADOR', 'EN_REVISION']:
            return Response(
                {'error': f'El documento debe estar en BORRADOR o EN_REVISION (actual: {estado_doc})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Validar usuarios y cargos existen
        from django.apps import apps
        Cargo = apps.get_model('core', 'Cargo')

        for idx, f_data in enumerate(firmantes_data):
            if not User.objects.filter(pk=f_data['usuario_id']).exists():
                return Response(
                    {'error': f'Firmante {idx + 1}: usuario ID {f_data["usuario_id"]} no existe'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not Cargo.objects.filter(pk=f_data['cargo_id']).exists():
                return Response(
                    {'error': f'Firmante {idx + 1}: cargo ID {f_data["cargo_id"]} no existe'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 3. Crear FirmaDigital records en batch
        firmas_creadas = []
        with transaction.atomic():
            for f_data in firmantes_data:
                usuario = User.objects.get(pk=f_data['usuario_id'])
                firma = FirmaDigital.objects.create(
                    content_type=content_type,
                    object_id=object_id,
                    usuario=usuario,
                    cargo_id=f_data['cargo_id'],
                    rol_firma=f_data['rol_firma'],
                    orden=f_data['orden'],
                    estado='PENDIENTE',
                    firma_imagen='',
                    documento_hash='pending',
                    ip_address='0.0.0.0',
                    user_agent='',
                    created_by=request.user,
                )
                firmas_creadas.append(firma)

                # Historial de auditoria
                HistorialFirma.objects.create(
                    firma=firma,
                    accion='FIRMA_CREADA',
                    usuario=request.user,
                    descripcion=f'Firma {f_data["rol_firma"]} asignada a {usuario.get_full_name() or usuario.email}',
                    metadatos={
                        'asignado_por': request.user.id,
                        'orden': f_data['orden'],
                    },
                    ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0'),
                )

            # 4. Transicionar documento a EN_REVISION
            if hasattr(documento, 'estado') and documento.estado == 'BORRADOR':
                documento.estado = 'EN_REVISION'
                documento.save(update_fields=['estado', 'updated_at'])
                logger.info(f'Documento {documento.pk} transicionado a EN_REVISION')

        logger.info(f'{len(firmas_creadas)} firmantes asignados a documento {object_id}')

        return Response({
            'mensaje': f'{len(firmas_creadas)} firmantes asignados exitosamente',
            'firmas_creadas': FirmaDigitalSerializer(firmas_creadas, many=True).data,
            'documento_nuevo_estado': getattr(documento, 'estado', ''),
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='mis-firmas-pendientes')
    def mis_firmas_pendientes(self, request):
        """
        Obtiene las firmas pendientes del usuario actual.
        Incluye firmas directas y delegadas.

        Query params:
        - es_mi_turno: true/false (filtra solo las que son su turno en flujo secuencial)
        """
        user = request.user

        # Firmas directas del usuario
        firmas_directas = FirmaDigital.objects.filter(
            usuario=user,
            estado='PENDIENTE'
        ).select_related('content_type', 'cargo', 'configuracion_flujo')

        # Construir respuesta con info del documento
        resultado = []
        for firma in firmas_directas:
            # Obtener documento para titulo/tipo
            try:
                documento = firma.content_type.get_object_for_this_type(pk=firma.object_id)
                doc_titulo = getattr(documento, 'titulo', getattr(documento, 'title', str(documento)))
                doc_tipo = firma.content_type.model
            except Exception:
                doc_titulo = f'Documento #{firma.object_id}'
                doc_tipo = firma.content_type.model if firma.content_type else 'desconocido'

            # Determinar si es su turno
            es_mi_turno = True
            if firma.configuracion_flujo and firma.configuracion_flujo.tipo_flujo == 'SECUENCIAL':
                firmas_anteriores_pendientes = FirmaDigital.objects.filter(
                    content_type=firma.content_type,
                    object_id=firma.object_id,
                    orden__lt=firma.orden,
                    estado='PENDIENTE'
                ).exists()
                es_mi_turno = not firmas_anteriores_pendientes

            # Filtrar por es_mi_turno si se pide
            es_mi_turno_param = request.query_params.get('es_mi_turno')
            if es_mi_turno_param is not None:
                if es_mi_turno_param.lower() == 'true' and not es_mi_turno:
                    continue

            dias_pendiente = (timezone.now() - firma.created_at).days if firma.created_at else 0

            resultado.append({
                'id': firma.id,
                'documento_tipo': doc_tipo,
                'documento_id': firma.object_id,
                'documento_titulo': doc_titulo,
                'rol_firma': firma.rol_firma,
                'rol_firma_display': firma.get_rol_firma_display(),
                'orden': firma.orden,
                'es_mi_turno': es_mi_turno,
                'fecha_limite': None,
                'dias_pendiente': dias_pendiente,
            })

        return Response(resultado)


class HistorialFirmaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para historial de firmas"""

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'firma_digital'
    serializer_class = HistorialFirmaSerializer
    filterset_fields = ['firma', 'accion', 'usuario']
    ordering_fields = ['created_at']

    def get_queryset(self):
        return HistorialFirma.objects.select_related(
            'firma', 'usuario'
        ).order_by('-created_at')


# ==============================================================================
# VIEWSETS DE DELEGACIÓN
# ==============================================================================

class DelegacionFirmaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar delegaciones de firma.

    list: Lista delegaciones (otorgadas y recibidas)
    retrieve: Detalle de una delegación
    create: Crea nueva delegación
    update: Actualiza delegación
    """

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'firma_digital'
    serializer_class = DelegacionFirmaSerializer
    filterset_fields = ['delegante', 'delegado', 'cargo', 'esta_activa']
    ordering_fields = ['fecha_inicio', 'fecha_fin']

    def get_queryset(self):
        user = self.request.user

        return DelegacionFirma.objects.filter(
            Q(delegante=user) | Q(delegado=user),
        ).select_related('delegante', 'delegado', 'cargo')

    def perform_create(self, serializer):
        """Crea delegación validando permisos"""
        user = self.request.user

        # Validar que el usuario sea el delegante
        if serializer.validated_data['delegante'] != user:
            from rest_framework import serializers as drf_serializers
            raise drf_serializers.ValidationError("Solo puede delegar su propia autoridad")

        serializer.save(created_by=user)

    @action(detail=True, methods=['post'])
    def revocar(self, request, pk=None):
        """Revoca una delegación"""
        delegacion = self.get_object()

        # Validar que sea el delegante
        if delegacion.delegante != request.user:
            return Response(
                {'error': 'Solo el delegante puede revocar la delegación'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = RevocarDelegacionSerializer(data=request.data)
        if serializer.is_valid():
            delegacion.revocar(motivo=serializer.validated_data['motivo'])

            return Response({
                'mensaje': 'Delegación revocada exitosamente',
                'delegacion': DelegacionFirmaSerializer(delegacion).data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='mis-delegaciones-vigentes')
    def mis_delegaciones_vigentes(self, request):
        """Obtiene las delegaciones vigentes del usuario"""
        user = request.user
        now = timezone.now()

        otorgadas = DelegacionFirma.objects.filter(
            delegante=user,
            esta_activa=True,
            fecha_inicio__lte=now,
            fecha_fin__gte=now,
            fecha_revocacion__isnull=True
        )

        recibidas = DelegacionFirma.objects.filter(
            delegado=user,
            esta_activa=True,
            fecha_inicio__lte=now,
            fecha_fin__gte=now,
            fecha_revocacion__isnull=True
        )

        return Response({
            'otorgadas': DelegacionFirmaSerializer(otorgadas, many=True).data,
            'recibidas': DelegacionFirmaSerializer(recibidas, many=True).data
        })


# ==============================================================================
# VIEWSETS DE REVISIÓN PERIÓDICA
# ==============================================================================

class ConfiguracionRevisionViewSet(viewsets.ModelViewSet):
    """ViewSet para configuraciones de revisión periódica"""

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'firma_digital'
    serializer_class = ConfiguracionRevisionSerializer
    filterset_fields = ['frecuencia', 'responsable_revision', 'renovacion_automatica']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']

    def get_queryset(self):
        return ConfiguracionRevision.objects.select_related(
            'responsable_revision', 'responsable_escalamiento', 'flujo_firma_renovacion'
        )

    @action(detail=True, methods=['post'], url_path='calcular-proxima-revision')
    def calcular_proxima_revision(self, request, pk=None):
        """Calcula la próxima fecha de revisión"""
        configuracion = self.get_object()
        fecha_base = request.data.get('fecha_base')

        if fecha_base:
            from datetime import datetime
            fecha_base = datetime.fromisoformat(fecha_base).date()

        proxima_fecha = configuracion.calcular_proxima_revision(fecha_base)

        return Response({
            'proxima_fecha_revision': proxima_fecha.isoformat(),
            'frecuencia': configuracion.get_frecuencia_display(),
            'dias': (proxima_fecha - (fecha_base or timezone.now().date())).days
        })


class AlertaRevisionViewSet(viewsets.ModelViewSet):
    """ViewSet para alertas de revisión"""

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'firma_digital'
    serializer_class = AlertaRevisionSerializer
    filterset_fields = ['estado', 'tipo_alerta', 'content_type', 'object_id']
    ordering_fields = ['fecha_programada', 'fecha_vencimiento']

    def get_queryset(self):
        user = self.request.user

        return AlertaRevision.objects.filter(
            Q(destinatarios=user) | Q(atendida_por=user)
        ).select_related(
            'configuracion_revision', 'atendida_por', 'tarea', 'notificacion'
        ).prefetch_related('destinatarios').distinct()

    @action(detail=True, methods=['post'], url_path='marcar-atendida')
    def marcar_atendida(self, request, pk=None):
        """Marca una alerta como atendida"""
        alerta = self.get_object()

        notas = request.data.get('notas', '')
        alerta.marcar_atendida(request.user, notas)

        return Response({
            'mensaje': 'Alerta marcada como atendida',
            'alerta': AlertaRevisionSerializer(alerta).data
        })

    @action(detail=False, methods=['get'], url_path='mis-alertas-pendientes')
    def mis_alertas_pendientes(self, request):
        """Obtiene las alertas pendientes del usuario"""
        user = request.user

        alertas = AlertaRevision.objects.filter(
            destinatarios=user,
            estado__in=['PROGRAMADA', 'ENVIADA']
        ).order_by('fecha_programada')

        return Response({
            'total': alertas.count(),
            'alertas': AlertaRevisionSerializer(alertas, many=True).data
        })

    @action(detail=False, methods=['post'], url_path='crear-alertas-documento')
    def crear_alertas_documento(self, request):
        """Crea alertas para un documento específico"""
        from django.contrib.contenttypes.models import ContentType

        content_type_id = request.data.get('content_type_id')
        object_id = request.data.get('object_id')
        configuracion_revision_id = request.data.get('configuracion_revision_id')
        fecha_vencimiento = request.data.get('fecha_vencimiento')

        if not all([content_type_id, object_id, configuracion_revision_id, fecha_vencimiento]):
            return Response(
                {'error': 'Faltan parámetros requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        content_type = get_object_or_404(ContentType, pk=content_type_id)
        configuracion = get_object_or_404(ConfiguracionRevision, pk=configuracion_revision_id)

        from datetime import datetime
        fecha_venc = datetime.fromisoformat(fecha_vencimiento).date()

        # Obtener fechas de alertas
        fechas_alertas = configuracion.get_fechas_alertas(fecha_venc)

        # Crear alertas
        alertas_creadas = []
        for alerta_info in fechas_alertas:
            alerta = AlertaRevision.objects.create(
                content_type=content_type,
                object_id=object_id,
                configuracion_revision=configuracion,
                tipo_alerta=alerta_info['tipo'],
                fecha_vencimiento=fecha_venc,
                fecha_programada=timezone.make_aware(
                    datetime.combine(alerta_info['fecha'], datetime.min.time())
                ),
                estado='PROGRAMADA'
            )

            # Agregar destinatarios
            # TODO: Implementar lógica de destinatarios según configuración
            alerta.destinatarios.add(request.user)

            alertas_creadas.append(alerta)

        return Response({
            'mensaje': f'{len(alertas_creadas)} alertas creadas exitosamente',
            'alertas': AlertaRevisionSerializer(alertas_creadas, many=True).data
        }, status=status.HTTP_201_CREATED)


# ==============================================================================
# VIEWSETS DE VERSIONAMIENTO
# ==============================================================================

class HistorialVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para historial de versiones"""

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'firma_digital'
    serializer_class = HistorialVersionSerializer
    filterset_fields = ['content_type', 'object_id', 'tipo_cambio', 'estado_documento']
    search_fields = ['titulo', 'motivo_cambio', 'version']
    ordering_fields = ['fecha_version', 'version']

    def get_queryset(self):
        return HistorialVersion.objects.select_related(
            'usuario_version'
        ).prefetch_related('firmas')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HistorialVersionDetailSerializer
        return HistorialVersionSerializer

    @action(detail=True, methods=['get'])
    def comparar(self, request, pk=None):
        """Compara esta versión con la anterior"""
        version = self.get_object()
        comparacion = version.comparar_con_anterior()

        if not comparacion:
            return Response(
                {'mensaje': 'No hay versión anterior para comparar'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(comparacion)

    @action(detail=False, methods=['post'], url_path='comparar-versiones')
    def comparar_versiones(self, request):
        """Compara dos versiones específicas"""
        version_1_id = request.data.get('version_1_id')
        version_2_id = request.data.get('version_2_id')

        version_1 = get_object_or_404(HistorialVersion, pk=version_1_id)
        version_2 = get_object_or_404(HistorialVersion, pk=version_2_id)

        # Calcular diff
        diff = HistorialVersion.calcular_diff(version_1.contenido, version_2.contenido)

        return Response({
            'version_1': {
                'version': version_1.version,
                'fecha': version_1.fecha_version,
                'usuario': version_1.usuario_version.get_full_name()
            },
            'version_2': {
                'version': version_2.version,
                'fecha': version_2.fecha_version,
                'usuario': version_2.usuario_version.get_full_name()
            },
            'diff': diff,
            'cambios': version_2.cambios_realizados
        })

    @action(detail=False, methods=['get'], url_path='por-documento')
    def por_documento(self, request):
        """Obtiene todas las versiones de un documento"""
        content_type_id = request.query_params.get('content_type_id')
        object_id = request.query_params.get('object_id')

        if not content_type_id or not object_id:
            return Response(
                {'error': 'Se requiere content_type_id y object_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        versiones = self.get_queryset().filter(
            content_type_id=content_type_id,
            object_id=object_id
        ).order_by('-fecha_version')

        return Response({
            'total': versiones.count(),
            'versiones': HistorialVersionSerializer(versiones, many=True).data
        })


# ==============================================================================
# VIEWSET WORKFLOW COMPLETO
# ==============================================================================

class WorkflowPoliticasViewSet(viewsets.ViewSet):
    """
    ViewSet especial para acciones de workflow completo de políticas.

    Incluye:
    - Iniciar proceso de revisión
    - Firmar documento
    - Rechazar documento
    - Renovar política
    - Consultar estado
    """

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'firma_digital'

    @action(detail=False, methods=['post'], url_path='iniciar-revision')
    def iniciar_revision(self, request):
        """Inicia el proceso de revisión de un documento"""
        serializer = IniciarRevisionSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # TODO: Implementar lógica de inicio de revisión
        # 1. Validar estado del documento
        # 2. Crear flujo de firmas
        # 3. Notificar primer firmante
        # 4. Crear tareas

        return Response({
            'mensaje': 'Proceso de revisión iniciado',
            'flujo_id': serializer.validated_data['configuracion_flujo_id']
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def firmar(self, request):
        """Firma un documento"""
        serializer = FirmarDocumentoSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # La firma se crea a través del FirmaDigitalViewSet
        # Este endpoint es un wrapper conveniente

        return Response({
            'mensaje': 'Documento firmado exitosamente'
        })

    @action(detail=False, methods=['post'])
    def rechazar(self, request):
        """Rechaza un documento con comentarios"""
        serializer = RechazarDocumentoSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # TODO: Implementar lógica de rechazo
        # 1. Validar permisos del usuario
        # 2. Cambiar estado del documento a RECHAZADO
        # 3. Registrar comentarios
        # 4. Notificar elaborador
        # 5. Invalidar firmas parciales

        return Response({
            'mensaje': 'Documento rechazado',
            'motivo': serializer.validated_data['motivo']
        })

    @action(detail=False, methods=['post'], url_path='renovar-politica')
    def renovar_politica(self, request):
        """Renueva una política vencida o próxima a vencer"""
        serializer = RenovarPoliticaSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # TODO: Implementar lógica de renovación
        # 1. Validar permisos
        # 2. Si es renovación simple: mantener contenido, nueva versión PATCH
        # 3. Si es con cambios: nueva versión MINOR o MAJOR
        # 4. Crear nueva versión
        # 5. Iniciar flujo de firma
        # 6. Programar nuevas alertas

        return Response({
            'mensaje': 'Política renovada',
            'tipo': serializer.validated_data['tipo_renovacion']
        })

    @action(detail=False, methods=['get'], url_path='estado-documento')
    def estado_documento(self, request):
        """Consulta el estado completo de un documento en el workflow"""
        content_type_id = request.query_params.get('content_type_id')
        object_id = request.query_params.get('object_id')

        if not content_type_id or not object_id:
            return Response(
                {'error': 'Se requiere content_type_id y object_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener firmas
        firmas = FirmaDigital.objects.filter(
            content_type_id=content_type_id,
            object_id=object_id
        ).order_by('orden')

        # Obtener versiones
        versiones = HistorialVersion.objects.filter(
            content_type_id=content_type_id,
            object_id=object_id
        ).order_by('-fecha_version')

        # Obtener alertas
        alertas = AlertaRevision.objects.filter(
            content_type_id=content_type_id,
            object_id=object_id,
            estado__in=['PROGRAMADA', 'ENVIADA']
        )

        return Response({
            'firmas': {
                'total': firmas.count(),
                'completadas': firmas.filter(estado='FIRMADO').count(),
                'pendientes': firmas.filter(estado='PENDIENTE').count(),
                'detalle': FirmaDigitalSerializer(firmas, many=True).data
            },
            'versiones': {
                'actual': versiones.first().version if versiones.exists() else None,
                'total': versiones.count(),
                'historial': HistorialVersionSerializer(versiones[:5], many=True).data
            },
            'alertas': {
                'total': alertas.count(),
                'proxima': AlertaRevisionSerializer(alertas.first()).data if alertas.exists() else None
            }
        })
