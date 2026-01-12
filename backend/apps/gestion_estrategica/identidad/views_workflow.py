"""
ViewSets para el sistema de Workflow de Firmas Digitales y Revisión Periódica
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db.models import Count, Q, Avg, F
from datetime import timedelta

from .models_workflow import (
    FirmaDigital,
    ConfiguracionRevision,
    HistorialVersion,
    ConfiguracionWorkflowFirma,
)
from .serializers_workflow import (
    FirmaDigitalSerializer,
    FirmarDocumentoSerializer,
    RechazarFirmaSerializer,
    DelegarFirmaSerializer,
    ConfiguracionRevisionSerializer,
    IniciarRevisionSerializer,
    HistorialVersionSerializer,
    HistorialVersionResumidoSerializer,
    CompararVersionesSerializer,
    RestaurarVersionSerializer,
    ConfiguracionWorkflowFirmaSerializer,
    AplicarWorkflowSerializer,
    EstadisticasFirmasSerializer,
    EstadisticasRevisionesSerializer,
)


# =============================================================================
# VIEWSET - FIRMA DIGITAL
# =============================================================================

class FirmaDigitalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de firmas digitales.

    Endpoints:
    - GET /firmas-digitales/ - Listar firmas
    - GET /firmas-digitales/{id}/ - Detalle de firma
    - POST /firmas-digitales/ - Crear firma manual (admin)
    - PUT /firmas-digitales/{id}/ - Actualizar firma (admin)
    - DELETE /firmas-digitales/{id}/ - Eliminar firma (admin)

    Acciones personalizadas:
    - POST /firmas-digitales/{id}/firmar/ - Firmar documento
    - POST /firmas-digitales/{id}/rechazar/ - Rechazar firma
    - POST /firmas-digitales/{id}/delegar/ - Delegar firma
    - GET /firmas-digitales/{id}/verificar-integridad/ - Verificar hash
    - GET /firmas-digitales/mis-firmas-pendientes/ - Mis firmas pendientes
    - GET /firmas-digitales/documento/{content_type}/{object_id}/ - Firmas de un documento
    - GET /firmas-digitales/estadisticas/ - Estadísticas de firmas
    """

    queryset = FirmaDigital.objects.select_related(
        'firmante',
        'cargo',
        'delegado_por',
        'created_by',
        'updated_by'
    ).filter(is_active=True)
    serializer_class = FirmaDigitalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'rol_firma', 'firmante', 'orden_firma']
    search_fields = ['firmante__first_name', 'firmante__last_name', 'observaciones']
    ordering_fields = ['orden_firma', 'fecha_firma', 'created_at']
    ordering = ['orden_firma', 'created_at']

    def get_queryset(self):
        """Filtra según permisos del usuario"""
        user = self.request.user
        qs = super().get_queryset()

        # Los usuarios ven sus propias firmas + las del contenido que crearon
        if not user.is_staff:
            qs = qs.filter(
                Q(firmante=user) | Q(created_by=user)
            )

        return qs

    @action(detail=True, methods=['post'])
    def firmar(self, request, pk=None):
        """
        Firma el documento.

        Body:
        {
            "firma_base64": "data:image/png;base64,xxxxx",
            "observaciones": "Aprobado según criterios técnicos"
        }
        """
        firma = self.get_object()

        # Verificar que el usuario es el firmante
        if firma.firmante != request.user:
            return Response(
                {"error": "Solo el firmante asignado puede firmar"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validar datos
        serializer = FirmarDocumentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Obtener metadatos
            ip_address = self.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            # Firmar
            firma.firmar(
                firma_base64=serializer.validated_data['firma_base64'],
                ip_address=ip_address,
                user_agent=user_agent,
                observaciones=serializer.validated_data.get('observaciones')
            )

            return Response(
                {
                    "message": "Documento firmado exitosamente",
                    "firma": FirmaDigitalSerializer(firma).data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """
        Rechaza la firma del documento.

        Body:
        {
            "motivo": "El documento no cumple con los requisitos..."
        }
        """
        firma = self.get_object()

        # Verificar que el usuario es el firmante o tiene permisos
        if firma.firmante != request.user and not request.user.is_staff:
            return Response(
                {"error": "No tiene permisos para rechazar esta firma"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validar datos
        serializer = RechazarFirmaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            firma.rechazar(
                motivo=serializer.validated_data['motivo'],
                rechazado_por=request.user
            )

            return Response(
                {
                    "message": "Firma rechazada exitosamente",
                    "firma": FirmaDigitalSerializer(firma).data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def delegar(self, request, pk=None):
        """
        Delega la firma a otro usuario.

        Body:
        {
            "nuevo_firmante_id": 123,
            "motivo": "Por motivo de ausencia temporal..."
        }
        """
        firma = self.get_object()

        # Verificar que el usuario es el firmante
        if firma.firmante != request.user:
            return Response(
                {"error": "Solo el firmante asignado puede delegar"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validar datos
        serializer = DelegarFirmaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            nuevo_firmante = User.objects.get(id=serializer.validated_data['nuevo_firmante_id'])

            firma.delegar(
                nuevo_firmante=nuevo_firmante,
                motivo=serializer.validated_data['motivo'],
                delegado_por=request.user
            )

            return Response(
                {
                    "message": "Firma delegada exitosamente",
                    "firma": FirmaDigitalSerializer(firma).data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def verificar_integridad(self, request, pk=None):
        """
        Verifica la integridad de la firma comparando el hash.

        Response:
        {
            "integra": true,
            "hash_almacenado": "abc123...",
            "hash_calculado": "abc123...",
            "fecha_verificacion": "2024-01-15T10:30:00Z"
        }
        """
        firma = self.get_object()

        try:
            es_integra = firma.verificar_integridad()

            return Response({
                "integra": es_integra,
                "hash_almacenado": firma.firma_hash,
                "hash_calculado": firma.generar_hash() if firma.firma_manuscrita else None,
                "fecha_verificacion": timezone.now().isoformat()
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def mis_firmas_pendientes(self, request):
        """
        Obtiene las firmas pendientes del usuario actual.

        Query params:
        - es_mi_turno: bool - Filtrar solo las que son mi turno (default: true)
        """
        user = request.user
        es_mi_turno_filter = request.query_params.get('es_mi_turno', 'true').lower() == 'true'

        firmas = FirmaDigital.objects.filter(
            firmante=user,
            status='PENDIENTE',
            is_active=True
        ).select_related('content_type', 'cargo')

        # Filtrar por turno si se solicita
        if es_mi_turno_filter:
            firmas_filtradas = []
            for firma in firmas:
                if firma.es_mi_turno():
                    firmas_filtradas.append(firma)
            firmas = firmas_filtradas
        else:
            firmas = list(firmas)

        serializer = FirmaDigitalSerializer(firmas, many=True)

        return Response({
            "count": len(firmas),
            "results": serializer.data
        })

    @action(detail=False, methods=['get'], url_path='documento/(?P<content_type_id>[^/.]+)/(?P<object_id>[^/.]+)')
    def firmas_documento(self, request, content_type_id=None, object_id=None):
        """
        Obtiene todas las firmas de un documento específico.

        URL: /firmas-digitales/documento/{content_type_id}/{object_id}/
        """
        firmas = FirmaDigital.objects.filter(
            content_type_id=content_type_id,
            object_id=object_id,
            is_active=True
        ).select_related('firmante', 'cargo', 'delegado_por')

        serializer = FirmaDigitalSerializer(firmas, many=True)

        # Calcular progreso
        total = firmas.count()
        firmadas = firmas.filter(status='FIRMADO').count()
        pendientes = firmas.filter(status='PENDIENTE').count()
        rechazadas = firmas.filter(status='RECHAZADO').count()

        return Response({
            "firmas": serializer.data,
            "resumen": {
                "total": total,
                "firmadas": firmadas,
                "pendientes": pendientes,
                "rechazadas": rechazadas,
                "porcentaje_completado": (firmadas / total * 100) if total > 0 else 0
            }
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtiene estadísticas generales de firmas.

        Query params:
        - fecha_desde: date - Fecha desde (default: último mes)
        - fecha_hasta: date - Fecha hasta (default: hoy)
        """
        from datetime import datetime
        from decimal import Decimal

        fecha_desde_str = request.query_params.get('fecha_desde')
        fecha_hasta_str = request.query_params.get('fecha_hasta')

        if fecha_desde_str:
            fecha_desde = datetime.strptime(fecha_desde_str, '%Y-%m-%d').date()
        else:
            fecha_desde = timezone.now().date() - timedelta(days=30)

        if fecha_hasta_str:
            fecha_hasta = datetime.strptime(fecha_hasta_str, '%Y-%m-%d').date()
        else:
            fecha_hasta = timezone.now().date()

        # Filtrar firmas en el rango
        firmas = FirmaDigital.objects.filter(
            created_at__date__gte=fecha_desde,
            created_at__date__lte=fecha_hasta,
            is_active=True
        )

        # Estadísticas por estado
        stats = firmas.aggregate(
            total=Count('id'),
            firmadas=Count('id', filter=Q(status='FIRMADO')),
            pendientes=Count('id', filter=Q(status='PENDIENTE')),
            rechazadas=Count('id', filter=Q(status='RECHAZADO')),
            delegadas=Count('id', filter=Q(status='DELEGADO')),
            vencidas=Count('id', filter=Q(status='VENCIDO')),
        )

        # Calcular tiempo promedio de firma
        firmas_con_tiempo = firmas.filter(
            status='FIRMADO',
            fecha_firma__isnull=False
        ).annotate(
            tiempo_firma=F('fecha_firma') - F('created_at')
        )

        if firmas_con_tiempo.exists():
            tiempo_promedio = sum([f.tiempo_firma.total_seconds() for f in firmas_con_tiempo]) / firmas_con_tiempo.count()
            tiempo_promedio_horas = Decimal(str(tiempo_promedio / 3600))
        else:
            tiempo_promedio_horas = None

        # Calcular porcentaje
        total = stats['total'] or 1
        porcentaje = Decimal(str((stats['firmadas'] / total * 100)))

        data = {
            "total_firmas": stats['total'],
            "firmadas": stats['firmadas'],
            "pendientes": stats['pendientes'],
            "rechazadas": stats['rechazadas'],
            "delegadas": stats['delegadas'],
            "vencidas": stats['vencidas'],
            "porcentaje_completado": porcentaje,
            "tiempo_promedio_firma_horas": tiempo_promedio_horas,
        }

        serializer = EstadisticasFirmasSerializer(data)
        return Response(serializer.data)

    @staticmethod
    def get_client_ip(request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# =============================================================================
# VIEWSET - CONFIGURACIÓN DE REVISIÓN
# =============================================================================

class ConfiguracionRevisionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de configuración de revisión periódica.

    Endpoints:
    - GET /configuracion-revision/ - Listar configuraciones
    - GET /configuracion-revision/{id}/ - Detalle de configuración
    - POST /configuracion-revision/ - Crear configuración
    - PUT /configuracion-revision/{id}/ - Actualizar configuración
    - DELETE /configuracion-revision/{id}/ - Eliminar configuración

    Acciones personalizadas:
    - POST /configuracion-revision/{id}/iniciar-revision/ - Iniciar revisión
    - POST /configuracion-revision/{id}/completar-revision/ - Completar revisión
    - POST /configuracion-revision/{id}/enviar-alerta/ - Enviar alerta manual
    - GET /configuracion-revision/proximos-vencimientos/ - Próximos vencimientos
    - GET /configuracion-revision/vencidas/ - Configuraciones vencidas
    - GET /configuracion-revision/estadisticas/ - Estadísticas
    """

    queryset = ConfiguracionRevision.objects.select_related(
        'responsable_revision',
        'cargo_responsable',
        'created_by',
        'updated_by'
    ).prefetch_related('destinatarios_adicionales').filter(is_active=True)
    serializer_class = ConfiguracionRevisionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['frecuencia', 'tipo_revision', 'estado', 'habilitado']
    search_fields = ['responsable_revision__first_name', 'responsable_revision__last_name']
    ordering_fields = ['proxima_revision', 'estado', 'created_at']
    ordering = ['proxima_revision']

    @action(detail=True, methods=['post'])
    def iniciar_revision(self, request, pk=None):
        """
        Inicia el proceso de revisión de la política.

        Body:
        {
            "observaciones": "Iniciando revisión anual programada"
        }
        """
        config = self.get_object()

        serializer = IniciarRevisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            config.iniciar_revision(iniciado_por=request.user)

            return Response(
                {
                    "message": "Revisión iniciada exitosamente",
                    "configuracion": ConfiguracionRevisionSerializer(config).data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def completar_revision(self, request, pk=None):
        """
        Completa el proceso de revisión y actualiza la próxima fecha.

        Body:
        {
            "observaciones": "Revisión completada sin cambios"
        }
        """
        config = self.get_object()

        if config.estado != 'EN_REVISION':
            return Response(
                {"error": "La configuración no está en revisión"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            config.actualizar_proxima_revision()

            return Response(
                {
                    "message": "Revisión completada exitosamente",
                    "configuracion": ConfiguracionRevisionSerializer(config).data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def enviar_alerta(self, request, pk=None):
        """
        Envía alerta de revisión manualmente.
        """
        config = self.get_object()

        try:
            config.enviar_alerta_revision()

            return Response(
                {"message": "Alerta enviada exitosamente"},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def proximos_vencimientos(self, request):
        """
        Obtiene configuraciones próximas a vencer.

        Query params:
        - dias: int - Días hacia adelante (default: 30)
        """
        dias = int(request.query_params.get('dias', 30))
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        configs = self.get_queryset().filter(
            habilitado=True,
            proxima_revision__lte=fecha_limite,
            estado__in=['VIGENTE', 'PROXIMO_VENCIMIENTO']
        ).order_by('proxima_revision')

        serializer = self.get_serializer(configs, many=True)

        return Response({
            "count": configs.count(),
            "dias": dias,
            "fecha_limite": fecha_limite,
            "results": serializer.data
        })

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """
        Obtiene configuraciones vencidas.
        """
        configs = self.get_queryset().filter(
            habilitado=True,
            estado='VENCIDA'
        ).order_by('proxima_revision')

        serializer = self.get_serializer(configs, many=True)

        return Response({
            "count": configs.count(),
            "results": serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtiene estadísticas de revisiones.
        """
        configs = self.get_queryset().filter(habilitado=True)

        stats = configs.aggregate(
            total=Count('id'),
            vigentes=Count('id', filter=Q(estado='VIGENTE')),
            proximos_vencimiento=Count('id', filter=Q(estado='PROXIMO_VENCIMIENTO')),
            vencidas=Count('id', filter=Q(estado='VENCIDA')),
            en_revision=Count('id', filter=Q(estado='EN_REVISION')),
        )

        # Calcular próximas en diferentes rangos
        hoy = timezone.now().date()
        stats['proximas_7_dias'] = configs.filter(
            proxima_revision__lte=hoy + timedelta(days=7),
            proxima_revision__gte=hoy,
            estado__in=['VIGENTE', 'PROXIMO_VENCIMIENTO']
        ).count()

        stats['proximas_30_dias'] = configs.filter(
            proxima_revision__lte=hoy + timedelta(days=30),
            proxima_revision__gte=hoy,
            estado__in=['VIGENTE', 'PROXIMO_VENCIMIENTO']
        ).count()

        data = {
            "total_documentos": stats['total'],
            "vigentes": stats['vigentes'],
            "proximos_vencimiento": stats['proximos_vencimiento'],
            "vencidas": stats['vencidas'],
            "en_revision": stats['en_revision'],
            "proximas_7_dias": stats['proximas_7_dias'],
            "proximas_30_dias": stats['proximas_30_dias'],
        }

        serializer = EstadisticasRevisionesSerializer(data)
        return Response(serializer.data)


# =============================================================================
# VIEWSET - HISTORIAL DE VERSIONES
# =============================================================================

class HistorialVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para historial de versiones.

    Endpoints:
    - GET /historial-versiones/ - Listar versiones
    - GET /historial-versiones/{id}/ - Detalle de versión

    Acciones personalizadas:
    - POST /historial-versiones/comparar/ - Comparar dos versiones
    - POST /historial-versiones/{id}/restaurar/ - Restaurar versión
    - GET /historial-versiones/documento/{content_type}/{object_id}/ - Historial de documento
    """

    queryset = HistorialVersion.objects.select_related(
        'usuario',
        'cargo_usuario',
        'content_type'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_cambio', 'usuario', 'version_numero']
    search_fields = ['descripcion_cambio', 'version_numero']
    ordering_fields = ['created_at', 'version_numero']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Retorna serializer según la acción"""
        if self.action == 'list':
            return HistorialVersionResumidoSerializer
        return HistorialVersionSerializer

    @action(detail=False, methods=['post'])
    def comparar(self, request):
        """
        Compara dos versiones de un documento.

        Body:
        {
            "version_a_id": 123,
            "version_b_id": 456
        }

        Response:
        {
            "version_a": {...},
            "version_b": {...},
            "diferencias": {...}
        }
        """
        serializer = CompararVersionesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        version_a = get_object_or_404(HistorialVersion, id=serializer.validated_data['version_a_id'])
        version_b = get_object_or_404(HistorialVersion, id=serializer.validated_data['version_b_id'])

        # Verificar que sean del mismo documento
        if version_a.content_type != version_b.content_type or version_a.object_id != version_b.object_id:
            return Response(
                {"error": "Las versiones deben pertenecer al mismo documento"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calcular diferencias
        diferencias = HistorialVersion.calcular_diff(
            version_a.snapshot_data,
            version_b.snapshot_data
        )

        return Response({
            "version_a": HistorialVersionSerializer(version_a).data,
            "version_b": HistorialVersionSerializer(version_b).data,
            "diferencias": diferencias,
            "cantidad_cambios": len(diferencias)
        })

    @action(detail=True, methods=['post'])
    def restaurar(self, request, pk=None):
        """
        Restaura el documento a esta versión.

        Body:
        {
            "confirmar": true
        }

        PRECAUCIÓN: Esta acción no se puede deshacer.
        """
        version = self.get_object()

        # Solo staff puede restaurar versiones
        if not request.user.is_staff:
            return Response(
                {"error": "No tiene permisos para restaurar versiones"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = RestaurarVersionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            exito = version.restaurar_version(usuario=request.user)

            if exito:
                return Response(
                    {
                        "message": "Versión restaurada exitosamente",
                        "version_restaurada": HistorialVersionSerializer(version).data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": "No se pudo restaurar la versión"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='documento/(?P<content_type_id>[^/.]+)/(?P<object_id>[^/.]+)')
    def historial_documento(self, request, content_type_id=None, object_id=None):
        """
        Obtiene el historial completo de un documento.

        URL: /historial-versiones/documento/{content_type_id}/{object_id}/
        """
        versiones = HistorialVersion.objects.filter(
            content_type_id=content_type_id,
            object_id=object_id
        ).select_related('usuario', 'cargo_usuario').order_by('-created_at')

        serializer = HistorialVersionResumidoSerializer(versiones, many=True)

        return Response({
            "count": versiones.count(),
            "documento": {
                "content_type_id": content_type_id,
                "object_id": object_id
            },
            "versiones": serializer.data
        })


# =============================================================================
# VIEWSET - CONFIGURACIÓN DE WORKFLOW
# =============================================================================

class ConfiguracionWorkflowFirmaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de configuraciones de workflow de firma.

    Endpoints:
    - GET /workflow-firmas/ - Listar workflows
    - GET /workflow-firmas/{id}/ - Detalle de workflow
    - POST /workflow-firmas/ - Crear workflow
    - PUT /workflow-firmas/{id}/ - Actualizar workflow
    - DELETE /workflow-firmas/{id}/ - Eliminar workflow

    Acciones personalizadas:
    - POST /workflow-firmas/{id}/aplicar/ - Aplicar workflow a documento
    - GET /workflow-firmas/{id}/validar/ - Validar configuración
    - POST /workflow-firmas/{id}/duplicar/ - Duplicar workflow
    """

    queryset = ConfiguracionWorkflowFirma.objects.select_related(
        'created_by',
        'updated_by'
    ).filter(is_active=True)
    serializer_class = ConfiguracionWorkflowFirmaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_politica', 'tipo_orden', 'activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']

    @action(detail=True, methods=['post'])
    def aplicar(self, request, pk=None):
        """
        Aplica el workflow a un documento específico.

        Body:
        {
            "content_type": "identidad.politicaintegral",
            "object_id": 123
        }
        """
        workflow = self.get_object()

        # Validar datos
        content_type_str = request.data.get('content_type')
        object_id = request.data.get('object_id')

        if not content_type_str or not object_id:
            return Response(
                {"error": "Se requieren content_type y object_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Obtener content type
            app_label, model = content_type_str.split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)

            # Obtener documento
            model_class = content_type.model_class()
            documento = get_object_or_404(model_class, id=object_id)

            # Crear firmas
            firmas_creadas = workflow.crear_firmas_para_documento(
                documento=documento,
                creado_por=request.user
            )

            return Response(
                {
                    "message": f"Workflow aplicado exitosamente. {len(firmas_creadas)} firmas creadas.",
                    "firmas": FirmaDigitalSerializer(firmas_creadas, many=True).data
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def validar(self, request, pk=None):
        """
        Valida la configuración del workflow.

        Verifica:
        - Que todos los roles tengan firmantes asignados
        - Que no haya órdenes duplicados (si es secuencial)
        - Que los usuarios/cargos existan
        """
        workflow = self.get_object()

        errores = []
        advertencias = []

        # Validar roles
        if not workflow.roles_config:
            errores.append("El workflow no tiene roles configurados")
        else:
            ordenes_vistos = set()

            for idx, rol in enumerate(workflow.roles_config):
                # Validar firmante asignado
                if not rol.get('usuario_id') and not rol.get('cargo_id'):
                    advertencias.append(f"El rol {rol.get('rol')} no tiene firmante asignado")

                # Validar orden (si es secuencial)
                if workflow.tipo_orden == 'SECUENCIAL':
                    orden = rol.get('orden', 0)
                    if orden in ordenes_vistos:
                        errores.append(f"Orden duplicado: {orden}")
                    ordenes_vistos.add(orden)

        es_valido = len(errores) == 0

        return Response({
            "valido": es_valido,
            "errores": errores,
            "advertencias": advertencias,
            "configuracion": ConfiguracionWorkflowFirmaSerializer(workflow).data
        })

    @action(detail=True, methods=['post'])
    def duplicar(self, request, pk=None):
        """
        Duplica el workflow con un nuevo nombre.

        Body:
        {
            "nuevo_nombre": "Workflow Política SST - Copia"
        }
        """
        workflow = self.get_object()

        nuevo_nombre = request.data.get('nuevo_nombre')
        if not nuevo_nombre:
            return Response(
                {"error": "Se requiere nuevo_nombre"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el nombre no exista
        if ConfiguracionWorkflowFirma.objects.filter(nombre=nuevo_nombre).exists():
            return Response(
                {"error": "Ya existe un workflow con ese nombre"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Duplicar
        nuevo_workflow = ConfiguracionWorkflowFirma.objects.create(
            nombre=nuevo_nombre,
            descripcion=workflow.descripcion,
            tipo_politica=workflow.tipo_politica,
            tipo_orden=workflow.tipo_orden,
            dias_para_firmar=workflow.dias_para_firmar,
            permitir_delegacion=workflow.permitir_delegacion,
            roles_config=workflow.roles_config,
            activo=False,  # Crear inactivo por seguridad
            created_by=request.user,
            updated_by=request.user
        )

        return Response(
            {
                "message": "Workflow duplicado exitosamente",
                "workflow": ConfiguracionWorkflowFirmaSerializer(nuevo_workflow).data
            },
            status=status.HTTP_201_CREATED
        )
